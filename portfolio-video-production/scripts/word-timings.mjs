// Word-level timings for the narration, from a local timestamped Whisper model.
// Script words are aligned to the transcript; words Whisper hears differently ("four" →
// "for") are interpolated between their aligned neighbours. Writes narration/words.json.
// Usage: node scripts/word-timings.mjs <slug>
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import { pipeline } from "@huggingface/transformers";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const slug = process.argv[2];
const dir = path.join(root, "projects", slug, "narration");
const sentences = JSON.parse(await readFile(path.join(dir, "sentences.json"), "utf8"));
const norm = (w) => w.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9']/g, "");

const asr = await pipeline("automatic-speech-recognition", "onnx-community/whisper-base.en_timestamped", { dtype: "fp32" });
const out = [];
for (const [index, row] of sentences.entries()) {
  const pad = 0.05;
  const from = Math.max(0, row.start - pad);
  const result = spawnSync(ffmpegPath, ["-v", "error", "-ss", String(from), "-to", String(row.end + 0.2), "-i", path.join(dir, "narration.wav"), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], { maxBuffer: 1 << 28 });
  const pcm = new Float32Array(result.stdout.buffer, result.stdout.byteOffset, result.stdout.length / 4);
  const { chunks } = await asr(pcm, { return_timestamps: "word" });
  const heard = chunks.flatMap((c) => {
    // Whisper sometimes returns "32-guard" or "back-end" as one chunk; split it evenly.
    const parts = c.text.trim().split(/[\s-]+/).filter(Boolean);
    const [a, b] = c.timestamp;
    return parts.map((p, i) => ({ w: norm(p), start: from + a + ((b - a) * i) / parts.length, end: from + a + ((b - a) * (i + 1)) / parts.length }));
  });
  const words = row.sentence.split(/\s+/).map((w) => ({ word: w.replace(/[.,;:!?]+$/, ""), start: null, end: null }));
  let cursor = 0;
  for (const word of words) {
    const target = norm(word.word.split("-")[0]);
    for (let j = cursor; j < Math.min(heard.length, cursor + 4); j += 1) {
      if (heard[j].w === target || (target.length > 3 && heard[j].w.startsWith(target.slice(0, 4)))) {
        word.start = heard[j].start;
        word.end = heard[j].end;
        cursor = j + 1;
        break;
      }
    }
  }
  // Interpolate any unaligned words between known neighbours (or the sentence bounds).
  for (let i = 0; i < words.length; i += 1) {
    if (words[i].start !== null) continue;
    let j = i;
    while (j < words.length && words[j].start === null) j += 1;
    const left = i > 0 ? words[i - 1].end : row.start;
    const right = j < words.length ? words[j].start : row.end;
    const step = (right - left) / (j - i);
    for (let k = i; k < j; k += 1) {
      words[k].start = left + step * (k - i);
      words[k].end = left + step * (k - i + 1);
      words[k].interpolated = true;
    }
  }
  for (const w of words) {
    w.start = Number(w.start.toFixed(3));
    w.end = Number(w.end.toFixed(3));
  }
  out.push({ index, sentence: row.sentence, start: row.start, end: row.end, words });
  console.log(`${index}: ${words.map((w) => `${w.word}@${w.start.toFixed(2)}${w.interpolated ? "*" : ""}`).join(" ")}`);
}
await writeFile(path.join(dir, "words.json"), `${JSON.stringify(out, null, 2)}\n`);
