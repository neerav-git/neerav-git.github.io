// Scores and mixes a film from its plan: narration slices placed on the edit, the
// procedural music bed ducked under the voice, synthesized SFX on clicks, keys and
// transitions, then a two-pass loudnorm master to -16 LUFS integrated, -1.5 dBTP.
// Usage: node scripts/mix-audio.mjs <slug>
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import { SR, addMono, music, reverb, sfxChime, sfxClick, sfxKey, sfxSwell, sfxWhoosh, stereo } from "../audio/synth.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const slug = process.argv[2];
const plan = JSON.parse(readFileSync(path.join(root, "projects", slug, "edit", "plan.json"), "utf8"));
const outDir = path.join(root, "projects", slug, "edit", "audio");
mkdirSync(outDir, { recursive: true });
const duration = plan.durationInFrames / plan.fps;
const db = (v) => 10 ** (v / 20);

function readPcm(file) {
  const r = spawnSync(ffmpegPath, ["-v", "error", "-i", file, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(r.stderr.toString());
  return new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 4);
}
function writeWav(file, ch) {
  const n = ch[0].length;
  const inter = new Float32Array(n * 2);
  for (let i = 0; i < n; i += 1) {
    inter[i * 2] = ch[0][i];
    inter[i * 2 + 1] = ch[1][i];
  }
  const r = spawnSync(ffmpegPath, ["-v", "error", "-y", "-f", "f32le", "-ar", String(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_f32le", file], { input: Buffer.from(inter.buffer) });
  if (r.status !== 0) throw new Error(r.stderr.toString());
}
const rms = (buf, from = 0, to = buf.length) => {
  let s = 0;
  let c = 0;
  for (let i = from; i < to; i += 1) {
    s += buf[i] * buf[i];
    c += 1;
  }
  return Math.sqrt(s / Math.max(1, c));
};

// ---------- narration ----------
const source = readPcm(path.join(root, "projects", slug, "narration", "narration.wav"));
const voice = stereo(duration);
const voiceMask = new Float32Array(voice[0].length);
for (const p of plan.narration) {
  const lead = 0.03;
  const tail = 0.09;
  const a = Math.max(0, Math.round((p.srcStart - lead) * SR));
  const b = Math.min(source.length, Math.round((p.srcEnd + tail) * SR));
  const slice = source.slice(a, b);
  const fade = Math.round(0.008 * SR);
  for (let i = 0; i < fade; i += 1) {
    slice[i] *= i / fade;
    slice[slice.length - 1 - i] *= i / fade;
  }
  addMono(voice, slice, p.at - lead);
  const s = Math.round((p.at - lead) * SR);
  for (let i = 0; i < slice.length; i += 1) if (s + i < voiceMask.length) voiceMask[s + i] = 1;
}
// Voice level while speaking, for setting the music under it.
let vs = 0;
let vc = 0;
for (let i = 0; i < voiceMask.length; i += 1) if (voiceMask[i]) {
  vs += voice[0][i] * voice[0][i];
  vc += 1;
}
const voiceRms = Math.sqrt(vs / vc);

// ---------- music ----------
const sections = [...plan.chapters.map((c) => ({ at: c.at, name: c.name }))];
const sting = plan.scenes.find((s) => s.kind === "sting");
const end = plan.scenes.find((s) => s.kind === "endcard");
if (sting) sections.push({ at: sting.from / plan.fps, name: "Sting" }, { at: (sting.from + sting.duration) / plan.fps - 0.4, name: "Problem" });
if (end) sections.push({ at: end.from / plan.fps, name: "End" });
const musicSpec = { seed: 7, bpm: 92, root: 50, ...(plan.meta.music ?? {}) };
const bed = music({ duration, sections, ...musicSpec });
const bedRms = rms(bed[0], Math.round(5 * SR), Math.round((duration - 5) * SR));

// Ducking: a smoothed voice envelope (fast attack, slow release, short hold) sets
// music 15 dB under the voice while speaking and 7 dB under it in the gaps.
const under = { speaking: -15, open: -7 };
const base = (voiceRms / bedRms);
const env = new Float32Array(voiceMask.length);
let e = 0;
let hold = 0;
const atk = 1 - Math.exp(-1 / (0.06 * SR));
const rel = 1 - Math.exp(-1 / (0.45 * SR));
for (let i = 0; i < env.length; i += 1) {
  if (voiceMask[i]) hold = Math.round(0.35 * SR);
  else hold = Math.max(0, hold - 1);
  const target = voiceMask[i] || hold > 0 ? 1 : 0;
  e += (target - e) * (target > e ? atk : rel);
  env[i] = e;
}
const musicGain = (i) => base * db(under.open + (under.speaking - under.open) * env[i]);
const mus = stereo(duration);
for (let i = 0; i < mus[0].length; i += 1) {
  const g = musicGain(i);
  mus[0][i] = bed[0][i] * g;
  mus[1][i] = bed[1][i] * g;
}

// ---------- sound effects ----------
const fx = stereo(duration);
const fxv = voiceRms;
let seed = 100;
for (const cue of plan.sfx) {
  const t = cue.frame / plan.fps;
  seed += 1;
  if (cue.type === "click") addMono(fx, sfxClick(seed), t, fxv * db(-9) * 3);
  if (cue.type === "key") addMono(fx, sfxKey(seed), t, fxv * db(-15) * 3, (seed % 5) / 10 - 0.2);
  if (cue.type === "whoosh") {
    const secs = cue.dur / plan.fps;
    const w = sfxWhoosh(secs * 1.15, seed, cue.variant === "whip" ? 1.2 : 0.8);
    addMono(fx, w, t - secs * 0.35, fxv * db(cue.variant === "whip" ? -8 : -11) * 3, cue.variant === "whip" ? 0.15 : 0);
  }
  if (cue.type === "swell") addMono(fx, sfxSwell(cue.dur / plan.fps, seed), t - 0.1, fxv * db(-14) * 3);
  if (cue.type === "chime") addMono(fx, sfxChime(cue.soft ? 69 : 74, cue.soft ? [0, 4, 7] : [0, 7]), t, fxv * db(cue.soft ? -9 : -6) * 2);
}
// Effects sit 12 dB lower while the narrator speaks, so clicks and keys never land on a word.
for (let c = 0; c < 2; c += 1) for (let i = 0; i < fx[c].length; i += 1) fx[c][i] *= db(-12 * env[i]);
reverb(fx, { size: 0.7, wet: 0.12 });

// ---------- sum and master ----------
const mix = stereo(duration);
for (let c = 0; c < 2; c += 1) for (let i = 0; i < mix[c].length; i += 1) mix[c][i] = voice[c][i] + mus[c][i] + fx[c][i];
const pre = path.join(outDir, "premix.wav");
writeWav(pre, mix);
writeWav(path.join(outDir, "stem-voice.wav"), voice);
writeWav(path.join(outDir, "stem-music.wav"), mus);
writeWav(path.join(outDir, "stem-sfx.wav"), fx);

const target = "I=-16:TP=-1.5:LRA=11";
const first = spawnSync(ffmpegPath, ["-hide_banner", "-i", pre, "-af", `loudnorm=${target}:print_format=json`, "-f", "null", "-"], { encoding: "utf8" });
const stats = JSON.parse(first.stderr.slice(first.stderr.lastIndexOf("{"), first.stderr.lastIndexOf("}") + 1));
const second = [
  `loudnorm=${target}:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true:print_format=json`,
].join(",");
const master = path.join(outDir, "master.wav");
const r = spawnSync(ffmpegPath, ["-hide_banner", "-y", "-i", pre, "-af", `${second},aresample=${SR}`, "-c:a", "pcm_s24le", master], { encoding: "utf8" });
if (r.status !== 0) throw new Error(r.stderr);
const out = JSON.parse(r.stderr.slice(r.stderr.lastIndexOf("{"), r.stderr.lastIndexOf("}") + 1));

// Measure what music sits under the voice, as the QA log records it.
const musicUnderVoice = 20 * Math.log10(rms(mus[0].filter((_, i) => voiceMask[i] && env[i] > 0.98)) / voiceRms);
const report = {
  master,
  input: { i: stats.input_i, tp: stats.input_tp },
  output: { i: out.output_i, tp: out.output_tp, lra: out.output_lra, normalization: out.normalization_type },
  musicUnderVoiceDb: Math.round(musicUnderVoice * 10) / 10,
  music: { generator: "audio/synth.mjs music()", ...musicSpec, sections },
};
writeFileSync(path.join(outDir, "mix.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ output: report.output, musicUnderVoiceDb: report.musicUnderVoiceDb }));
