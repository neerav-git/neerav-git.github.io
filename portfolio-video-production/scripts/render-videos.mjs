import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const repo = path.resolve(root, "..");
const outputRoot = path.join(repo, "output", "portfolio-videos");
const production = JSON.parse(await readFile(path.join(root, "production.json"), "utf8"));
const { width, height, fps } = production.format;
const transition = 0.6;
const shotTransition = 0.5;
const audioDelay = 0.65;
const tail = 1.2;
const encode = ["-an", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-r", String(fps)];
// UI captures sit in the same frame as stills, beside the text panel.
const frame = { left: 600, width: 1290, video: { left: 620, width: 1250, height: 703 } };
frame.video.top = Math.round((height - frame.video.height) / 2);
const projectFlag = process.argv.indexOf("--project");
const onlyProject = projectFlag >= 0 ? process.argv[projectFlag + 1] : null;

function run(args, label) {
  const result = spawnSync(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status}\n${result.stderr.toString().slice(-2000)}`);
  return result.stderr.toString();
}

function probeDuration(file) {
  const result = spawnSync(ffmpegPath, ["-i", file], { stdio: ["ignore", "ignore", "pipe"] });
  const match = result.stderr.toString().match(/Duration: (\d+):(\d+):([\d.]+)/);
  if (!match) throw new Error(`Could not read duration of ${file}`);
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function wrap(value, max) {
  const words = value.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textSvg(project, scene, mode = "still") {
  const titleLines = wrap(scene.title, mode === "still" ? 19 : 40);
  const bodyLines = wrap(scene.body, mode === "still" ? 32 : 68);
  const panelWidth = mode === "still" ? 610 : 1250;
  const panelHeight = mode === "still" ? 1080 : 360;
  const panelY = mode === "still" ? 0 : 720;
  const x = mode === "still" ? 72 : 86;
  let y = mode === "still" ? 190 : 805;
  const titleSize = mode === "still" ? 46 : 52;
  const titleLeading = mode === "still" ? 56 : 64;
  const bodySize = mode === "still" ? 25 : 26;
  const titleSpans = titleLines.map((line, i) => `<tspan x="${x}" dy="${i ? titleLeading : 0}">${escapeXml(line)}</tspan>`).join("");
  y += titleLines.length * titleLeading + (mode === "still" ? 64 : 40);
  const bodySpans = bodyLines.map((line, i) => `<tspan x="${x}" dy="${i ? 38 : 0}">${escapeXml(line)}</tspan>`).join("");
  const gradient = mode === "still"
    ? `<linearGradient id="panel" x1="0" x2="1"><stop offset="0" stop-color="#090c12" stop-opacity="0.97"/><stop offset="0.82" stop-color="#090c12" stop-opacity="0.90"/><stop offset="1" stop-color="#090c12" stop-opacity="0"/></linearGradient>`
    : `<linearGradient id="panel" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#080b11" stop-opacity="0.98"/><stop offset="0.75" stop-color="#080b11" stop-opacity="0.82"/><stop offset="1" stop-color="#080b11" stop-opacity="0"/></linearGradient>`;
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>${gradient}</defs>
      <rect x="0" y="${panelY}" width="${panelWidth}" height="${panelHeight}" fill="url(#panel)"/>
      <rect x="${x}" y="${mode === "still" ? 116 : 760}" width="66" height="5" rx="2.5" fill="${project.accent}"/>
      <text x="${x}" y="${mode === "still" ? 152 : 792}" font-family="Avenir Next, Helvetica Neue, Arial" font-size="20" font-weight="700" letter-spacing="3" fill="${project.accent}">${escapeXml(scene.beat)}</text>
      <text x="${x}" y="${mode === "still" ? 246 : 850}" font-family="Avenir Next, Helvetica Neue, Arial" font-size="${titleSize}" font-weight="650" fill="#f7f4ee">${titleSpans}</text>
      <text x="${x}" y="${y}" font-family="Avenir Next, Helvetica Neue, Arial" font-size="${bodySize}" font-weight="400" fill="#d1d4dc">${bodySpans}</text>
      <text x="${width - 82}" y="${height - 48}" text-anchor="end" font-family="Avenir Next, Helvetica Neue, Arial" font-size="18" letter-spacing="2" fill="#f7f4ee" opacity="0.72">NEERAV CHAUDHARY · ${escapeXml(project.title.toUpperCase())}</text>
    </svg>
  `);
}

function wavDuration(buffer, file) {
  const sampleRate = buffer.readUInt32LE(24);
  const channels = buffer.readUInt16LE(22);
  const bits = buffer.readUInt16LE(34);
  let offset = 12;
  while (offset + 8 < buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === "data") return size / (sampleRate * channels * (bits / 8));
    offset += 8 + size + (size % 2);
  }
  throw new Error(`Could not find WAV data chunk in ${file}`);
}

// Narration is synthesized sentence by sentence (generate-narration.mjs), so every scene
// after the first names the sentence it begins on and cuts just before that sentence is heard.
async function cueTimes(project) {
  const timingFile = path.join(root, "projects", project.slug, "narration", "sentences.json");
  const sentences = JSON.parse(await readFile(timingFile, "utf8").catch(() => {
    throw new Error(`${project.slug}: run npm run narrate to produce sentence timings`);
  }));
  if (sentences.map((row) => row.sentence).join(" ") !== project.narration) {
    throw new Error(`${project.slug}: narration changed since it was synthesized; run npm run narrate`);
  }
  return project.scenes.slice(1).map((scene) => {
    const sentence = sentences.find((row) => row.sentence.startsWith(scene.cue));
    if (!scene.cue || !sentence) throw new Error(`${project.slug}: cue "${scene.cue}" does not start a narration sentence`);
    return { cue: scene.cue, at: sentence.start + audioDelay - 0.1 };
  });
}

function shotsOf(scene) {
  const media = Array.isArray(scene.media) ? scene.media : [scene.media];
  return media.map((item) => (typeof item === "string" ? { src: item, trim: scene.trim, focus: scene.focus } : item));
}

function isVideo(file) {
  return [".mp4", ".webm", ".mov"].includes(path.extname(file).toLowerCase());
}

async function makeStillMaster(project, scene, input, output, focus) {
  // focus is [x, y, width, height] in source pixels, framing the readable part of a tall capture.
  const source = focus ? await sharp(input).extract({ left: focus[0], top: focus[1], width: focus[2], height: focus[3] }).png().toBuffer() : input;
  const background = await sharp(source).resize(width, height, { fit: "cover" }).blur(24).modulate({ brightness: 0.38, saturation: 0.7 }).png().toBuffer();
  const foreground = await sharp(source).resize(1250, 850, { fit: "contain", background: { r: 18, g: 21, b: 28, alpha: 1 } }).png().toBuffer();
  const framed = await sharp({
    create: { width: 1290, height: 890, channels: 4, background: { r: 5, g: 7, b: 12, alpha: 0.62 } }
  }).composite([{ input: foreground, left: 20, top: 20 }]).png().toBuffer();
  await sharp(background)
    .composite([
      { input: framed, left: frame.left, top: 95 },
    ])
    .png()
    .toFile(output);
}

// Background, frame, and text panel for a UI capture; the clip is overlaid into the frame.
async function makeVideoPlate(project, scene, still, output) {
  const background = await sharp(still).resize(width, height, { fit: "cover" }).blur(24).modulate({ brightness: 0.34, saturation: 0.7 }).png().toBuffer();
  const framed = await sharp({
    create: { width: frame.width, height: frame.video.height + 40, channels: 4, background: { r: 5, g: 7, b: 12, alpha: 0.62 } }
  }).png().toBuffer();
  await sharp(background)
    .composite([
      { input: framed, left: frame.left, top: frame.video.top - 20 },
    ])
    .png()
    .toFile(output);
}

function pushIn(duration) {
  const frames = Math.ceil(duration * fps);
  return `scale=2016:1134,zoompan=z='min(1+0.00022*on,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${width}x${height}:fps=${fps},trim=end_frame=${frames}`;
}

async function renderShot(project, scene, shot, duration, output, scratch) {
  const input = path.join(root, "projects", project.slug, shot.src);
  const text = `${scratch}-text.png`;
  await sharp(textSvg(project, scene, "still")).png().toFile(text);
  if (!isVideo(input)) {
    const master = `${scratch}-master.png`;
    await makeStillMaster(project, scene, input, master, shot.focus);
    run([
      "-y", "-framerate", String(fps), "-loop", "1", "-i", master, "-loop", "1", "-i", text,
      "-filter_complex", `[0:v]${pushIn(duration)}[bg];[bg][1:v]overlay=0:0,format=yuv420p[v]`,
      "-map", "[v]", "-t", duration.toFixed(3), ...encode, output
    ], `Still ${project.slug}/${shot.src}`);
    return master;
  }

  const trim = shot.trim || 0;
  const available = (shot.until ?? probeDuration(input)) - trim;
  const framed = shot.layout ? shot.layout === "framed" : shot.src.includes("/motion/");
  // Nothing loops: short gameplay eases into gentle slow motion, and UI captures play at
  // natural speed before holding their final state.
  const stretch = framed ? 1 : Math.min(1.6, Math.max(1, duration / available));
  const hold = Math.max(0, duration - available * stretch + 0.1);
  // focus is [x, y, width, height] in source pixels; until ends the clip early and holds that frame.
  const crop = shot.focus ? `crop=${shot.focus[2]}:${shot.focus[3]}:${shot.focus[0]}:${shot.focus[1]},` : "";
  const clip = `trim=start=${trim}${shot.until ? `:end=${shot.until}` : ""},setpts=${stretch.toFixed(3)}*(PTS-STARTPTS),${crop}fps=${fps},tpad=stop_mode=clone:stop_duration=${hold.toFixed(3)}`;

  if (framed) {
    const still = `${scratch}-still.png`;
    run(["-y", "-ss", String(trim + 0.5), "-i", input, "-frames:v", "1", still], `Frame ${shot.src}`);
    const plateFile = `${scratch}-plate.png`;
    await makeVideoPlate(project, scene, still, plateFile);
    const { left, top, width: w, height: h } = frame.video;
    run([
      "-y", "-i", input, "-framerate", String(fps), "-loop", "1", "-i", plateFile, "-loop", "1", "-i", text,
      "-filter_complex", `[0:v]${clip},scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1[ui];[1:v][ui]overlay=${left}:${top}:shortest=0,${pushIn(duration)}[bg];[bg][2:v]overlay=0:0,format=yuv420p[v]`,
      "-map", "[v]", "-t", duration.toFixed(3), ...encode, output
    ], `Framed video ${project.slug}/${shot.src}`);
    return plateFile;
  }

  const overlay = `${scratch}-overlay.png`;
  await sharp(textSvg(project, scene, "video")).png().toFile(overlay);
  run([
    "-y", "-i", input, "-loop", "1", "-i", overlay,
    "-filter_complex", `[0:v]${clip},scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}:(iw-ow)/2:ih-oh,setsar=1[base];[base][1:v]overlay=0:0,format=yuv420p[v]`,
    "-map", "[v]", "-t", duration.toFixed(3), ...encode, output
  ], `Video ${project.slug}/${shot.src}`);
  return null;
}

function crossfade(inputs, durations, fade, output, label, extra = "") {
  if (inputs.length === 1 && !extra) return copyFile(inputs[0], output);
  let filter = "";
  let current = "0:v";
  let elapsed = durations[0];
  for (let index = 1; index < inputs.length; index += 1) {
    filter += `[${current}][${index}:v]xfade=transition=fade:duration=${fade}:offset=${(elapsed - fade).toFixed(3)}[x${index}];`;
    current = `x${index}`;
    elapsed += durations[index] - fade;
  }
  filter += `[${current}]${extra || "null"},format=yuv420p[outv]`;
  run(["-y", ...inputs.flatMap((file) => ["-i", file]), "-filter_complex", filter, "-map", "[outv]", ...encode, "-movflags", "+faststart", output], label);
}

await mkdir(outputRoot, { recursive: true });

for (const project of production.projects) {
  if (onlyProject && project.slug !== onlyProject) continue;
  const projectDir = path.join(root, "projects", project.slug);
  const sceneDir = path.join(projectDir, "scenes");
  await rm(sceneDir, { recursive: true, force: true });
  await mkdir(sceneDir, { recursive: true });
  const audioPath = path.join(projectDir, "narration", "narration.wav");
  const audioSeconds = wavDuration(await readFile(audioPath), audioPath);
  const desiredSeconds = Math.min(90, Math.max(40, audioSeconds + audioDelay + tail));
  const cues = await cueTimes(project);
  const cuts = [0, ...cues.map((cue) => cue.at), desiredSeconds];
  // Segment lengths chosen so each crossfade is centred on its cut.
  const durations = project.scenes.map((_, i) => cuts[i + 1] - cuts[i] + (i > 0 ? transition / 2 : 0) + (i < project.scenes.length - 1 ? transition / 2 : 0));
  const segments = [];
  let posterSource = null;

  for (let index = 0; index < project.scenes.length; index += 1) {
    const scene = project.scenes[index];
    const name = String(index + 1).padStart(2, "0");
    const shots = shotsOf(scene);
    const shotDurations = shots.map(() => (durations[index] + shotTransition * (shots.length - 1)) / shots.length);
    const shotFiles = [];
    for (let s = 0; s < shots.length; s += 1) {
      const file = path.join(sceneDir, shots.length > 1 ? `${name}-${s + 1}.mp4` : `${name}.mp4`);
      const art = await renderShot(project, scene, shots[s], shotDurations[s], file, path.join(sceneDir, shots.length > 1 ? `${name}-${s + 1}` : name));
      if (index === 0 && s === 0) posterSource = { art, video: file };
      shotFiles.push(file);
    }
    const segment = path.join(sceneDir, `${name}.mp4`);
    if (shots.length > 1) await crossfade(shotFiles, shotDurations, shotTransition, segment, `Scene ${project.slug}/${name}`);
    segments.push(segment);
  }

  const silent = path.join(projectDir, "silent-master.mp4");
  await crossfade(segments, durations, transition, silent, `Crossfade master ${project.slug}`,
    `fade=t=in:st=0:d=0.55,fade=t=out:st=${Math.max(0, desiredSeconds - 0.75).toFixed(3)}:d=0.75`);

  const final = path.join(projectDir, "final.mp4");
  run([
    "-y", "-i", silent, "-i", audioPath,
    "-filter_complex", `[1:a]adelay=${audioDelay * 1000}|${audioDelay * 1000},apad=pad_dur=3,volume=1.0[a]`,
    "-map", "0:v", "-map", "[a]", "-t", desiredSeconds.toFixed(3),
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", final
  ], `Final mux ${project.slug}`);

  const poster = path.join(projectDir, "poster.png");
  run(["-y", "-ss", (Math.min(2.5, durations[0] - 1)).toFixed(2), "-i", posterSource.video, "-frames:v", "1", poster], `Poster ${project.slug}`);
  await copyFile(final, path.join(outputRoot, `${project.slug}.mp4`));
  await copyFile(poster, path.join(outputRoot, `${project.slug}-poster.png`));

  const timeline = project.scenes.map((scene, i) => ({
    start: Number(cuts[i].toFixed(2)),
    end: Number(cuts[i + 1].toFixed(2)),
    beat: scene.beat,
    cue: i ? scene.cue : project.narration.split(/\s+/).slice(0, 6).join(" "),
    media: scene.media,
  }));
  await writeFile(path.join(projectDir, "storyboard.json"), `${JSON.stringify({ title: project.title, subtitle: project.subtitle, scenes: timeline }, null, 2)}\n`);
  const edit = timeline.map((row) => `| ${row.start.toFixed(1)}–${row.end.toFixed(1)} s | ${row.beat} | ${project.scenes[timeline.indexOf(row)].title} |`).join("\n");
  await writeFile(path.join(projectDir, "script.md"), `# ${project.title}\n\n## Narration\n\n${project.narration}\n\n## Edit\n\n| Time | Beat | On screen |\n| --- | --- | --- |\n${edit}\n\n## Delivery\n\n- Length: ${desiredSeconds.toFixed(1)} seconds\n- Voice: Kokoro ${production.format.voice}, synthesized per sentence with the portfolio guide's tuning\n- Cuts land on the sentence each scene illustrates\n`);
  await writeFile(path.join(projectDir, "render-metadata.json"), `${JSON.stringify({ audioSeconds, durationSeconds: desiredSeconds, fps, resolution: `${width}x${height}`, cues }, null, 2)}\n`);
  console.log(`Rendered ${project.slug}: ${desiredSeconds.toFixed(1)} seconds`);
  for (const row of timeline) console.log(`  ${row.start.toFixed(1).padStart(5)}–${row.end.toFixed(1).padEnd(5)} ${row.beat}`);
}
