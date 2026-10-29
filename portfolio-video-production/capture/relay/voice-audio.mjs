// Builds the sound of a captured Relay voice chapter, aligned to its frames.
// Maya's Kokoro line starts where the replay began feeding the microphone; the agent's recorded PCM
// is laid out the way the app's player schedules it (each chunk starts at the later of its arrival
// and the end of the previous chunk), using the arrival times logged during the capture.
// Usage: node capture/relay/voice-audio.mjs <take-dir> <session.json> <maya.wav (24 kHz)> [chapter]
// The chapter defaults to 01-voice; its <chapter>.voice.json names the socket whose audio is laid out.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const [takeDir, sessionFile, mayaFile, chapter = "01-voice"] = process.argv.slice(2);
const voice = JSON.parse(readFileSync(path.join(takeDir, `${chapter}.voice.json`), "utf8"));
const events = JSON.parse(readFileSync(path.join(takeDir, `${chapter}.events.json`), "utf8"));
const sock = voice.sock ?? 1;
const session = JSON.parse(readFileSync(sessionFile, "utf8"));
const RATE = 24000;

// Mono WAV as 16-bit samples. kokoro-js saves 32-bit float WAVs (format 3); read as integers they are noise.
function pcm16(file) {
  const buf = readFileSync(file);
  const format = buf.readUInt16LE(20);
  let at = 12;
  while (at < buf.length) {
    const id = buf.toString("ascii", at, at + 4);
    const size = buf.readUInt32LE(at + 4);
    if (id === "data") {
      const bytes = buf.buffer.slice(buf.byteOffset + at + 8, buf.byteOffset + at + 8 + size);
      const data = format === 3 ? Int16Array.from(new Float32Array(bytes), (v) => Math.round(Math.max(-1, Math.min(1, v)) * 32767)) : new Int16Array(bytes);
      return { rate: buf.readUInt32LE(24), data };
    }
    at += 8 + size + (size % 2);
  }
  throw new Error(`no data in ${file}`);
}

const total = Math.ceil((events.frames / events.fps) * RATE);
const mix = new Float32Array(total);
const toSample = (pageMs) => Math.round(((pageMs - voice.pageT0) / 1000) * RATE);
const add = (samples, start) => {
  for (let i = 0; i < samples.length && start + i < total; i += 1) if (start + i >= 0) mix[start + i] += samples[i] / 32768;
};

// Agent audio: recorded chunks in order, arrival times from this capture's replay.
const chunks = session.dg.msgs.filter((m) => m.dir === "in" && m.bin).sort((a, b) => a.at - b.at);
const arrivals = voice.log.filter((e) => e.in === "audio" && (e.sock ?? 1) === sock);
if (arrivals.length !== chunks.length) throw new Error(`replay delivered ${arrivals.length} audio chunks, recording has ${chunks.length}`);
let end = -Infinity;
const spans = [];
chunks.forEach((chunk, i) => {
  const pcm = new Int16Array(Uint8Array.from(Buffer.from(chunk.bin, "base64")).buffer);
  const start = Math.max(toSample(arrivals[i].at), end);
  add(pcm, start);
  end = start + pcm.length;
  if (!spans.length || start - spans.at(-1).end > RATE * 0.3) spans.push({ start, end });
  else spans.at(-1).end = end;
});

// Maya's line (Kokoro, 24 kHz) where the microphone feed began.
const maya = pcm16(mayaFile);
if (maya.rate !== RATE) throw new Error(`expected ${RATE} Hz, got ${maya.rate}`);
add(maya.data, toSample(voice.micStart));

const out = Buffer.alloc(44 + total * 2);
out.write("RIFF", 0); out.writeUInt32LE(36 + total * 2, 4); out.write("WAVEfmt ", 8);
out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22); out.writeUInt32LE(RATE, 24);
out.writeUInt32LE(RATE * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34); out.write("data", 36); out.writeUInt32LE(total * 2, 40);
for (let i = 0; i < total; i += 1) out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mix[i])) * 32767), 44 + i * 2);
writeFileSync(path.join(takeDir, `${chapter}.audio.wav`), out);
const cues = {
  maya: { start: toSample(voice.micStart) / RATE, end: (toSample(voice.micStart) + maya.data.length) / RATE },
  agent: spans.map((s) => ({ start: +(s.start / RATE).toFixed(3), end: +(s.end / RATE).toFixed(3) })),
};
writeFileSync(path.join(takeDir, `${chapter}.audio.json`), `${JSON.stringify(cues, null, 2)}\n`);
console.log(JSON.stringify(cues));
