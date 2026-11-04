// Maya's spoken line for a live Relay voice session, in a Kokoro voice (bf_emma by default; a
// different voice from the narrator's af_heart), saved at 24 kHz for the film and 16 kHz for Relay's
// microphone path. The film can re-voice a captured line: the microphone feed only reaches the
// replayed session, whose transcript and answers were recorded live.
// Usage: node capture/relay/say-line.mjs <name> "<text>" [voice]   → projects/relay/voice/<name>{.wav,-16k.wav,.json}
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import { KokoroTTS } from "kokoro-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const [name, text, voice = "bf_emma"] = process.argv.slice(2);
if (!name || !text) throw new Error('Usage: node capture/relay/say-line.mjs <name> "<text>"');
const dir = path.join(root, "projects", "relay", "voice");
const out = path.join(dir, `${name}.wav`);

const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "fp32", device: "cpu" });
const audio = await tts.generate(text, { voice });
audio.save(out);
const r = spawnSync(ffmpegPath, ["-v", "error", "-y", "-i", out, "-ar", "16000", "-ac", "1", "-sample_fmt", "s16", path.join(dir, `${name}-16k.wav`)], { stdio: "inherit" });
if (r.status !== 0) throw new Error("ffmpeg resample failed");
const seconds = audio.audio.length / audio.sampling_rate;
writeFileSync(path.join(dir, `${name}.json`), JSON.stringify({ voice, text, sampleRate: audio.sampling_rate, seconds: Number(seconds.toFixed(3)) }, null, 2) + "\n");
console.log(`${name}: ${seconds.toFixed(2)} s`);
