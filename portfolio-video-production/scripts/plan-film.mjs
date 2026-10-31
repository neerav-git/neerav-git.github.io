// Builds projects/<slug>/edit/plan.json from the selected capture take, the narration
// word timings, and the film's edit decisions in edit/films/<slug>.mjs.
// Usage: node scripts/plan-film.mjs <slug> [--take N]
import { mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync, existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { FPS, LAYOUT, f, loadJourney, loadNarration } from "../edit/planner.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const args = process.argv.slice(2);
const slug = args[0];
if (!slug) throw new Error("Usage: node scripts/plan-film.mjs <slug> [--take N]");
const film = await import(pathToFileURL(path.join(root, "edit", "films", `${slug}.mjs`)).href);
const takeArg = args.indexOf("--take");
const take = takeArg >= 0 ? Number(args[takeArg + 1]) : film.meta.take;

const journey = loadJourney(root, slug, take);
const narration = loadNarration(root, slug);
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");

// Narration: say(i, at) places sentence i so it starts at film time `at` (seconds).
const placements = [];
const say = (index, at) => {
  const s = narration.sentences[index];
  if (!s) throw new Error(`No narration sentence ${index}`);
  const shift = at - s.start;
  placements.push({ index, at, srcStart: s.start, srcEnd: s.end, text: s.sentence, words: s.words.map((w) => ({ word: w.word, start: w.start + shift, end: w.end + shift })) });
  return {
    start: at,
    end: s.end + shift,
    word(text, n = 0) {
      const hits = s.words.filter((w) => norm(w.word) === norm(text));
      if (!hits[n]) throw new Error(`Sentence ${index} has no word "${text}"`);
      return hits[n].start + shift;
    },
  };
};

// Capture frames are served as stills from public/<slug>/frames/take-NN/<chapter>/NNNNNN.jpg.
// Only frames the edit uses are kept (extracted after the plan is built, below).
const takeDir = `take-${String(take).padStart(2, "0")}`;
const framesRoot = path.join(root, "public", slug, "frames", takeDir);
rmSync(path.join(root, "public", slug, "journey"), { force: true });
const video = (chapter) => `${slug}/frames/${takeDir}/${chapter}`;

const terminalDir = path.join(root, "projects", slug, "captures", "terminal");
const terminal = {};
if (existsSync(terminalDir)) {
  for (const file of readdirSync(terminalDir).filter((n) => n.endsWith(".json"))) {
    terminal[path.basename(file, ".json")] = JSON.parse(readFileSync(path.join(terminalDir, file), "utf8"));
  }
}

const built = film.build({ journey, say, video, terminal });

// ---------- scenes ----------
const scenes = built.scenes.map(({ outFrame, endCam, ...scene }) => {
  void outFrame;
  void endCam;
  return scene;
});

// ---------- captions: ≤52 characters, broken at punctuation where possible ----------
const captions = [];
for (const p of [...placements].sort((a, b) => a.at - b.at)) {
  // Fewest cues of ≤52 characters, with balanced lengths and breaks after commas preferred.
  const words = p.words.map((w, i) => ({ ...w, word: p.text.split(/\s+/)[i] ?? w.word }));
  const len = (ws) => ws.map((w) => w.word).join(" ").length;
  const best = (ws, k) => {
    if (k === 1) return len(ws) <= 52 ? { cost: 0, parts: [ws] } : null;
    let top = null;
    for (let i = 1; i < ws.length; i += 1) {
      const head = ws.slice(0, i);
      if (len(head) > 52) break;
      const rest = best(ws.slice(i), k - 1);
      if (!rest) continue;
      const target = len(ws) / k;
      const last = head[head.length - 1].word;
      const weak = /^(the|a|an|and|or|to|of|for|with|are|is|its|their|no|so|\d+)$/i.test(last) ? 16 : 0;
      const cost = Math.abs(len(head) - target) - (/,$/.test(last) ? 24 : 0) + weak + rest.cost;
      if (!top || cost < top.cost) top = { cost, parts: [head, ...rest.parts] };
    }
    return top;
  };
  let chunks = null;
  for (let k = 1; !chunks; k += 1) chunks = best(words, k)?.parts ?? null;
  const sentenceEnd = p.at + (p.srcEnd - p.srcStart);
  chunks.forEach((c, k) => {
    const start = Math.max(p.at, c[0].start - 0.08);
    const end = k < chunks.length - 1 ? chunks[k + 1][0].start - 0.08 : sentenceEnd + 0.25;
    captions.push({ start: Math.round(start * FPS), end: Math.round(end * FPS), text: c.map((w) => w.word).join(" ") });
  });
}
// Cues the film supplies itself (dialogue in a captured audio clip), in seconds.
for (const c of built.captions ?? []) captions.push({ start: Math.round(c.start * FPS), end: Math.round(c.end * FPS), text: c.text, ...(c.speaker && { speaker: c.speaker }) });
captions.sort((a, b) => a.start - b.start);
for (const c of captions) if (c.text.length > 52) throw new Error(`Caption over 52 characters: "${c.text}"`);
for (let i = 0; i < captions.length - 1; i += 1) captions[i].end = Math.min(captions[i].end, captions[i + 1].start);

// ---------- sound effects ----------
const sfx = [];
for (const s of built.scenes) {
  if (s.kind === "capture") {
    for (const c of s.clicks) sfx.push({ type: "click", frame: s.from + c.frame });
    for (const k of s.keysTyped) sfx.push({ type: "key", frame: s.from + k });
  }
  if (s.kind === "terminal") {
    for (const run of [s.props, s.props.test].filter(Boolean)) {
      const from = run.typeFrom ?? 8;
      for (let i = 0; i < run.command.length; i += 1) sfx.push({ type: "key", frame: s.from + from + Math.round(i * 1.6) });
      sfx.push({ type: "key", frame: s.from + from + Math.round(run.command.length * 1.6) + 4 });
    }
  }
  if (s.in && ["whip", "zoomThrough", "radial", "wipe"].includes(s.in.type)) sfx.push({ type: "whoosh", frame: s.from, dur: s.in.dur, variant: s.in.type });
  if (s.in && s.in.type === "blurDissolve") sfx.push({ type: "swell", frame: s.from, dur: s.in.dur });
  if (s.kind === "sting") sfx.push({ type: "chime", frame: s.from + 30 });
  if (s.kind === "endcard") sfx.push({ type: "chime", frame: s.from + 20, soft: true });
}
const outScenes = scenes;
sfx.sort((a, b) => a.frame - b.frame);

const plan = {
  slug,
  take,
  fps: FPS,
  durationInFrames: built.durationInFrames,
  layout: LAYOUT,
  palette: film.meta.palette,
  meta: film.meta,
  poster: built.poster,
  syncs: built.syncs ?? [],
  scenes: outScenes,
  tracker: built.tracker,
  // One plain-language status line at a time in a fixed slot above the captions (tool calls, time cuts).
  status: (built.status ?? []).map((x) => ({ ...x, start: Math.round(x.start * FPS), end: Math.round(x.end * FPS) })),
  chapters: built.chapters,
  captions,
  narration: placements.map(({ words, ...p }) => {
    void words;
    return { ...p, at: Math.round(p.at * FPS) / FPS };
  }),
  sfx,
  // Captured sound placed on the edit (a recorded voice exchange), mixed as dialogue.
  audio: built.audio ?? [],
};

// ---------- extract the capture frames the edit uses ----------
const needed = {};
const need = (dir, frame) => (needed[dir] ??= new Set()).add(frame);
for (const s of built.scenes) {
  for (const st of s.stills ?? []) need(st.video, st.frame);
  if (s.kind !== "capture") continue;
  for (const fr of s.frames.src) need(s.video, fr);
  for (const r of s.reveals) need(s.video, r.before);
}
if (built.poster) need(built.poster.video, built.poster.frame);
const frameName = (n) => `${String(n).padStart(6, "0")}.jpg`;
for (const [dir, frames] of Object.entries(needed)) {
  const chapter = dir.split("/").pop();
  const target = path.join(root, "public", dir);
  // Frames are only reusable while they come from the same capture file: a re-captured take
  // (same take number) must not keep serving the old take's stills.
  const file = journey.chapters[chapter].file;
  const { size, mtimeMs } = statSync(file);
  const source = `${path.relative(root, file)} ${size} ${Math.round(mtimeMs)}`;
  const sourceFile = path.join(target, ".source");
  if (existsSync(target) && (!existsSync(sourceFile) || readFileSync(sourceFile, "utf8") !== source)) {
    console.log(`  ${chapter}: capture changed; discarding its extracted frames`);
    rmSync(target, { recursive: true, force: true });
  }
  mkdirSync(target, { recursive: true });
  writeFileSync(sourceFile, source);
  const missing = [...frames].filter((n) => !existsSync(path.join(target, frameName(n))));
  if (!missing.length) continue;
  const tmp = path.join(target, ".all");
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp);
  console.log(`  extracting ${missing.length} frames of ${chapter}…`);
  // 2880x1620 keeps the deepest 1.9x zoom at 1:1 sharpness; frame numbers start at 0.
  const r = spawnSync(ffmpegPath, ["-v", "error", "-i", journey.chapters[chapter].file, "-vf", "scale=2880:1620:flags=lanczos", "-q:v", "2", "-start_number", "0", path.join(tmp, "%06d.jpg")]);
  if (r.status !== 0) throw new Error(r.stderr.toString());
  for (const n of missing) renameSync(path.join(tmp, frameName(n)), path.join(target, frameName(n)));
  rmSync(tmp, { recursive: true, force: true });
}

const outDir = path.join(root, "projects", slug, "edit");
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "plan.json"), `${JSON.stringify(plan)}\n`);

// ---------- report ----------
const sec = (fr) => (fr / FPS).toFixed(2).padStart(6);
console.log(`${slug} take ${take}: ${(plan.durationInFrames / FPS).toFixed(2)} s, ${scenes.length} scenes, ${captions.length} captions, ${sfx.length} sfx`);
const problems = [];
for (const s of built.scenes) {
  const speed = s.speed ? `speed ${s.speed.min}–${s.speed.max}×` : "";
  console.log(`  ${sec(s.from)} → ${sec(s.from + s.duration)}  ${s.kind.padEnd(9)} ${s.id.padEnd(14)} ${speed}`);
  if (s.duration <= 0) problems.push(`${s.id}: non-positive duration`);
  if (s.speed && (s.speed.min < 0.74 || s.speed.max > 2.01)) problems.push(`${s.id}: speed ${s.speed.min}–${s.speed.max}× outside 0.75–2×`);
}
for (let i = 1; i < scenes.length; i += 1) {
  const a = scenes[i - 1];
  const b = scenes[i];
  const overlap = a.from + a.duration - b.from;
  const want = b.in && b.in.type !== "cut" ? b.in.dur : 0;
  if (overlap !== want) problems.push(`${a.id} → ${b.id}: overlap ${overlap} frames, transition wants ${want}`);
}
for (const p of placements) console.log(`  narration ${String(p.index).padStart(2)} at ${p.at.toFixed(2)} s – ${(p.at + p.srcEnd - p.srcStart).toFixed(2)} s`);
for (let i = 1; i < placements.length; i += 1) {
  const a = [...placements].sort((x, y) => x.at - y.at);
  if (a[i].at < a[i - 1].at + (a[i - 1].srcEnd - a[i - 1].srcStart) - 0.01) problems.push(`narration ${a[i - 1].index} overlaps ${a[i].index}`);
}
const runtime = plan.durationInFrames / FPS;
const [minRuntime, maxRuntime] = film.meta.runtime ?? [40, 90];
if (runtime < minRuntime || runtime > maxRuntime) problems.push(`runtime ${runtime.toFixed(1)} s outside ${minRuntime}–${maxRuntime} s`);
if (problems.length) {
  console.log("Problems:");
  for (const p of problems) console.log(`  - ${p}`);
  process.exitCode = 1;
}

// ---------- shot list (written next to the plan for review) ----------
const ts = (fr) => `${(fr / FPS).toFixed(1)} s`;
const lines = [`# ${slug} — shot list (take ${take})`, "", `Runtime ${runtime.toFixed(1)} s · ${scenes.length} scenes · generated by scripts/plan-film.mjs`, "", "| # | In | Out | Scene | Transition in | On screen | Narration |", "|---|---|---|---|---|---|---|"];
built.scenes.forEach((s, i) => {
  const a = s.from;
  const b = s.from + s.duration;
  const said = placements.filter((p) => p.at * FPS >= a - 30 && p.at * FPS < b - 30).map((p) => p.text).join(" ");
  const notes = [];
  if (s.kind === "capture") {
    notes.push(`${s.video.split("/").pop()} @ ${s.speed.min}–${s.speed.max}×`);
    for (const o of s.overlays) notes.push(o.type === "lowerThird" ? `lower third “${o.title}”` : `${o.type} “${o.label ?? o.text}”`);
  } else if (s.props?.title) notes.push(s.props.title);
  else if (s.kind === "sting") notes.push(`sting · ${s.tagline}`);
  else if (s.kind === "endcard") notes.push(`end card · ${s.impact}`);
  lines.push(`| ${i + 1} | ${ts(a)} | ${ts(b)} | ${s.kind} \`${s.id}\` | ${s.in ? `${s.in.type} ${s.in.dur}f` : "—"} | ${notes.join("; ")} | ${said} |`);
});
writeFileSync(path.join(outDir, "shots.md"), `${lines.join("\n")}\n`);
