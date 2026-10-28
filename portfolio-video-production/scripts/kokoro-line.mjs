// Synthesizes one spoken line with local Kokoro (a character's voice, distinct from the narrator).
// Writes <out>.wav at 24 kHz (for the film mix) and <out>-16k.wav (16 kHz mono, for a microphone shim).
// Usage: node scripts/kokoro-line.mjs <voice> <out-without-ext> "<text>"
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import ffmpegPath from "ffmpeg-static";
import { KokoroTTS } from "kokoro-js";

const [voice, out, text] = process.argv.slice(2);
if (!voice || !out || !text) throw new Error('usage: node scripts/kokoro-line.mjs <voice> <out> "<text>"');
const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "fp32", device: "cpu" });
const audio = await tts.generate(text, { voice, speed: 1 });

// 16-bit PCM WAV of the raw synthesis.
const pcm = Buffer.alloc(audio.audio.length * 2);
audio.audio.forEach((s, i) => pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
const header = Buffer.alloc(44);
header.write("RIFF", 0); header.writeUInt32LE(36 + pcm.length, 4); header.write("WAVEfmt ", 8);
header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
header.writeUInt32LE(audio.sampling_rate, 24); header.writeUInt32LE(audio.sampling_rate * 2, 28);
header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write("data", 36); header.writeUInt32LE(pcm.length, 40);
writeFileSync(`${out}.wav`, Buffer.concat([header, pcm]));
const r = spawnSync(ffmpegPath, ["-v", "error", "-y", "-i", `${out}.wav`, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", `${out}-16k.wav`], { stdio: "inherit" });
if (r.status !== 0) throw new Error("resample failed");
writeFileSync(`${out}.json`, `${JSON.stringify({ voice, text, sampleRate: audio.sampling_rate, seconds: audio.audio.length / audio.sampling_rate }, null, 2)}\n`);
console.log(`${out}.wav  ${(audio.audio.length / audio.sampling_rate).toFixed(2)} s`);
