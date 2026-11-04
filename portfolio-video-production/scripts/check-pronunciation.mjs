// Transcribes each narrated sentence and each proper noun (synthesized on its own) back to
// text with a local Whisper model, and reports words the transcript does not reproduce.
// Usage: node scripts/check-pronunciation.mjs <slug> [extra terms...]
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import { pipeline } from "@huggingface/transformers";
import { KokoroTTS } from "kokoro-js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const slug = process.argv[2];
const production = JSON.parse(await readFile(path.join(root, "production.json"), "utf8"));
const project = production.projects.find((p) => p.slug === slug);
const terms = [...(project.pronunciation || []), ...process.argv.slice(3)];
const narrationDir = path.join(root, "projects", slug, "narration");
const sentences = JSON.parse(await readFile(path.join(narrationDir, "sentences.json"), "utf8"));

function pcm16k(args) {
  const result = spawnSync(ffmpegPath, ["-v", "error", ...args, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], { maxBuffer: 1 << 28 });
  if (result.status !== 0) throw new Error(result.stderr.toString());
  return new Float32Array(result.stdout.buffer, result.stdout.byteOffset, result.stdout.length / 4);
}

const normalise = (text) => text.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean);
const NUMBERS = { 32: "thirty two", 59: "fifty nine", four: "4" };

function missing(expected, heard) {
  const said = new Set(normalise(heard));
  return normalise(expected).filter((word) => !said.has(word) && !(NUMBERS[word] && normalise(NUMBERS[word]).every((w) => said.has(w))));
}

const asr = await pipeline("automatic-speech-recognition", "onnx-community/whisper-base.en", { dtype: "fp32" });
const report = { slug, sentences: [], terms: [] };
const audio = path.join(narrationDir, "narration.wav");
for (const row of sentences) {
  const samples = pcm16k(["-ss", String(row.start), "-to", String(row.end + 0.25), "-i", audio]);
  const { text } = await asr(samples);
  const miss = missing(row.sentence, text);
  report.sentences.push({ sentence: row.sentence, heard: text.trim(), missing: miss });
  console.log(`${miss.length ? "CHECK" : "ok   "} ${text.trim()}${miss.length ? `   [missing: ${miss.join(", ")}]` : ""}`);
}

if (terms.length) {
  const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "fp32", device: "cpu" });
  for (const term of terms) {
    const spoken = typeof term === "string" ? term : term.say;
    const expect = typeof term === "string" ? term : term.expect;
    const out = await tts.generate(spoken, { voice: production.format.voice, speed: 1 });
    const tmp = path.join(narrationDir, ".term.wav");
    await out.save(tmp);
    const { text } = await asr(pcm16k(["-i", tmp]));
    const miss = missing(expect, text);
    report.terms.push({ term: spoken, expect, heard: text.trim(), missing: miss });
    console.log(`${miss.length ? "CHECK" : "ok   "} term "${spoken}" → "${text.trim()}"`);
  }
  spawnSync("rm", ["-f", path.join(narrationDir, ".term.wav")]);
}
await writeFile(path.join(narrationDir, "pronunciation.json"), `${JSON.stringify(report, null, 2)}\n`);
