import { spawnSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import { KokoroTTS } from "kokoro-js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const production = JSON.parse(await readFile(path.join(root, "production.json"), "utf8"));
const forceFallback = process.argv.includes("--fallback");
const projectFlag = process.argv.indexOf("--project");
const onlyProject = projectFlag >= 0 ? process.argv[projectFlag + 1] : null;

// Same voice and tuning as the portfolio guide (lib/guide/voice.ts on main).
const SPEED = 1;
const SENTENCE_PAUSE_S = 0.18;
const ROOM = 0.06;
const SAMPLE_RATE = 24000;

export function sentencesOf(narration) {
  return narration.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map((sentence) => sentence.trim()).filter(Boolean);
}

function wav(samples, sampleRate) {
  const buffer = Buffer.alloc(44 + samples.length * 4);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + samples.length * 4, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(3, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(32, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples.length * 4, 40);
  for (let i = 0; i < samples.length; i += 1) buffer.writeFloatLE(samples[i], 44 + i * 4);
  return buffer;
}

// Decaying-noise impulse response for the small room, matching the guide's convolver.
function impulse(seconds = 1.6, decay = 3.2) {
  const length = Math.round(SAMPLE_RATE * seconds);
  const data = new Float32Array(length);
  let seed = 1;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < length; i += 1) data[i] = (random() * 2 - 1) * Math.pow(1 - i / length, decay);
  return data;
}

function master(input, roomFile, output) {
  const voice = "bass=g=2:f=180,equalizer=f=2800:t=q:w=0.9:g=1.5,treble=g=-1:f=8500,acompressor=threshold=-22dB:ratio=3.5:attack=6:release=180:knee=8";
  const result = spawnSync(ffmpegPath, [
    "-y", "-i", input, "-i", roomFile,
    "-filter_complex",
    `[0:a]${voice},asplit[dry][send];[send][1:a]afir=dry=10:wet=10:length=1[room];` +
    `[dry][room]amix=inputs=2:weights='${1 - ROOM * 0.4} ${ROOM * 0.9}':normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[out]`,
    "-map", "[out]", "-c:a", "pcm_s16le", output,
  ], { stdio: ["ignore", "ignore", "pipe"] });
  if (result.status !== 0) throw new Error(`Mastering failed: ${result.stderr.toString().slice(-1500)}`);
}

let tts;
if (!forceFallback) {
  console.log("Loading local Kokoro model (first run downloads and caches the weights)...");
  try {
    tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "fp32", device: "cpu" });
  } catch (error) {
    console.warn(`Kokoro unavailable; using the local macOS fallback. ${error.message}`);
  }
}

for (const project of production.projects) {
  if (onlyProject && project.slug !== onlyProject) continue;
  const outputDir = path.join(root, "projects", project.slug, "narration");
  await mkdir(outputDir, { recursive: true });
  const output = path.join(outputDir, "narration.wav");

  if (!tts) {
    const aiff = path.join(outputDir, "narration.aiff");
    const speech = spawnSync("say", ["-v", "Samantha", "-r", "168", "-o", aiff, project.narration], { stdio: "inherit" });
    if (speech.status !== 0) throw new Error(`macOS narration failed for ${project.slug}`);
    const convert = spawnSync("afconvert", ["-f", "WAVE", "-d", "LEI16@24000", aiff, output], { stdio: "inherit" });
    if (convert.status !== 0) throw new Error(`Audio conversion failed for ${project.slug}`);
    await rm(path.join(outputDir, "sentences.json"), { force: true });
    console.log(`Narrated ${project.slug} with the fallback voice`);
    continue;
  }

  // Kokoro truncates long inputs, so each sentence is synthesized on its own and the
  // sentence boundaries are kept as exact cut points for the edit.
  const pieces = [];
  const timings = [];
  let cursor = 0;
  for (const sentence of sentencesOf(project.narration)) {
    const audio = await tts.generate(sentence, { voice: production.format.voice, speed: SPEED });
    if (audio.sampling_rate !== SAMPLE_RATE) throw new Error(`Unexpected sample rate ${audio.sampling_rate}`);
    timings.push({ sentence, start: cursor / SAMPLE_RATE, end: (cursor + audio.audio.length) / SAMPLE_RATE });
    pieces.push(audio.audio, new Float32Array(Math.round(SENTENCE_PAUSE_S * SAMPLE_RATE)));
    cursor += audio.audio.length + Math.round(SENTENCE_PAUSE_S * SAMPLE_RATE);
  }
  const samples = new Float32Array(cursor);
  let offset = 0;
  for (const piece of pieces) {
    samples.set(piece, offset);
    offset += piece.length;
  }
  const raw = path.join(outputDir, "narration-raw.wav");
  const room = path.join(outputDir, "room-ir.wav");
  await writeFile(raw, wav(samples, SAMPLE_RATE));
  await writeFile(room, wav(impulse(), SAMPLE_RATE));
  master(raw, room, output);
  await rm(raw);
  await rm(room);
  await writeFile(path.join(outputDir, "sentences.json"), `${JSON.stringify(timings, null, 2)}\n`);
  console.log(`Narrated ${project.slug}: ${(cursor / SAMPLE_RATE).toFixed(1)} s, ${timings.length} sentences`);
}
