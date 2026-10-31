// Copies a QA'd film to output/portfolio-videos/, writes qa/<slug>.md from its report,
// and rebuilds the suite contact sheet from every delivered film's contact sheet.
// Usage: node scripts/deliver.mjs <slug>
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
const out = path.resolve(root, "..", "output", "portfolio-videos");
mkdirSync(out, { recursive: true });
const report = JSON.parse(readFileSync(path.join(root, "qa", slug, "report.json"), "utf8"));
const plan = JSON.parse(readFileSync(path.join(root, "projects", slug, "edit", "plan.json"), "utf8"));
const mix = JSON.parse(readFileSync(path.join(root, "projects", slug, "edit", "audio", "mix.json"), "utf8"));
if (!report.pass && !process.argv.includes("--force")) throw new Error(`${slug} has not passed QA; see qa/${slug}/report.json`);

const renders = path.join(root, "renders", slug);
for (const name of [`${slug}.mp4`, `${slug}-captioned.mp4`, `${slug}.vtt`, `${slug}-poster.png`]) copyFileSync(path.join(renders, name), path.join(out, name));
copyFileSync(path.join(root, "qa", slug, "contact.png"), path.join(out, `${slug}-contact.png`));

// QA log.
const mark = (ok) => (ok ? "PASS" : "FAIL");
const fps = plan.fps;
const lines = [
  `# QA — ${slug}`,
  "",
  `Take ${plan.take} · ${report.runtime.seconds} s · checked by \`qa/tools/qa_film.py\` on \`${report.video}\``,
  "",
  "| Check | Result | Detail |",
  "|---|---|---|",
  `| Runtime ${(report.runtime.range ?? [40, 90]).join("–")} s | ${mark(report.runtime.pass)} | ${report.runtime.seconds} s |`,
  `| Jitter: planned camera | ${mark(!report.jitter.plan_bounces.length)} | ${report.jitter.plan_bounces.length} direction reversals in the exact per-frame camera values the renderer draws, across all ${report.jitter.moves.length} moves |`,
  `| Jitter: rendered camera | ${mark(report.jitter.reversals === 0)} | ${report.jitter.measured_moves} of ${report.jitter.moves.length} moves have enough clean capture pixels to measure (overlays, cursor, ripples and in-page changes excluded); on those, ${report.jitter.reversals} reversals and the rendered motion tracks the plan to ${report.jitter.track_rms_px} px RMS. The other moves are covered by the planned-camera check |`,
  `| Jitter: holds | ${mark(report.jitter.max_hold_rms < 0.05)} | worst residual motion ${report.jitter.max_hold_rms} px/frame over ${report.jitter.holds.length} holds |`,
  `| No hold over 3 s | ${mark(report.holds.pass)} | longest span without visual change ${report.holds.longest_seconds} s (at ${report.holds.at} s) |`,
  `| Loudness −16 LUFS, ≤ −1.5 dBTP | ${mark(report.loudness.pass)} | ${report.loudness.integrated} LUFS, ${report.loudness.true_peak} dBTP |`,
  `| Narration/action sync ±150 ms | ${mark(report.sync.pass)} | worst ${report.sync.worst_ms} ms over ${report.sync.pairs.length} pairs |`,
  `| Transitions | — | ${report.transitions.count}: ${report.transitions.types.join(", ")} (strips in \`qa/${slug}/transitions.png\`) |`,
  `| Music under voice | — | ${mix.musicUnderVoiceDb} dB while speaking; source \`${mix.music.generator}\`, seed ${mix.music.seed}, ${mix.music.bpm} BPM |`,
  "",
  "## Sync pairs",
  "",
  "| Action | Word | Offset |",
  "|---|---|---|",
  ...report.sync.pairs.map((p) => `| ${p.label} | “${p.said}” at ${p.word.toFixed(2)} s | ${p.offset_ms > 0 ? "+" : ""}${p.offset_ms} ms |`),
  "",
  "## Camera moves",
  "",
  "Measured = at least 70% of frame pairs fitted on clean capture pixels. Tracking = rendered screen-centre motion minus planned motion.",
  "",
  "| Scene | From | To | Frames fitted | Measured | Reversals | Tracking RMS (px) | Peak pan (px/frame) |",
  "|---|---|---|---|---|---|---|---|",
  ...report.jitter.moves.map((m) => `| ${m.scene} | ${m.from} s | ${m.to} s | ${m.fitted} | ${m.measurable ? "yes" : "no"} | ${m.measurable ? m.reversals : "—"} | ${m.measurable ? m.track_rms_px : "—"} | ${m.max_pan_px} |`),
  "",
  "## Speed ramps",
  "",
  ...plan.scenes.filter((s) => s.kind === "capture").map((s) => `- \`${s.id}\`: moving footage at ${s.speed.min}–${s.speed.max}× (idle frames held or skipped)`),
  "",
  "## Legibility",
  "",
  "All added text (titles, callouts, lower thirds, tracker, captions, terminal, diagram) is set at 28 px or larger inside 5% title-safe margins. Product UI text is shown at the capture's native size and enlarged by the 1.3–1.9× camera on every element the narration names.",
  "",
  `Contact sheet: \`qa/${slug}/contact.png\` · transitions: \`qa/${slug}/transitions.png\` · raw report: \`qa/${slug}/report.json\``,
  "",
];
writeFileSync(path.join(root, "qa", `${slug}.md`), lines.join("\n"));

// Suite contact sheet: each delivered film's sheet, stacked.
// Six films: the two Alzheimer's case studies share one film (alzheimers-research).
const FILMS = ["relay", "refract-ai", "homeward", "birb-hangout", "tracelens", "alzheimers-research"];
const sheets = FILMS
  .map((s) => path.join(out, `${s}-contact.png`))
  .filter((f) => existsSync(f));
const suite = path.join(out, "portfolio-video-suite-contact-sheet.png");
const inputs = sheets.flatMap((f) => ["-i", f]);
const scaled = sheets.map((_, i) => `[${i}:v]scale=2000:-2[s${i}]`).join(";");
const stack = sheets.length > 1 ? `${scaled};${sheets.map((_, i) => `[s${i}]`).join("")}vstack=inputs=${sheets.length}` : `[0:v]scale=2000:-2`;
// The suite sheet is rebuilt once every film has been delivered on the new pipeline.
if (sheets.length === FILMS.length) spawnSync(ffmpegPath, ["-v", "error", "-y", ...inputs, "-filter_complex", stack, "-frames:v", "1", suite], { stdio: "inherit" });
console.log(`Delivered ${slug} → ${path.relative(root, out)}${sheets.length === FILMS.length ? " and rebuilt the suite contact sheet" : ` (${sheets.length}/${FILMS.length} films on the new pipeline; suite sheet waits for all ${FILMS.length})`}`);
