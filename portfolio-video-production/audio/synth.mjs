// Procedural music bed and sound effects, synthesized locally from oscillators and
// seeded noise. No samples, stock audio, or network sources: the source of every sound
// is this file, and the same seed always renders the same audio.
export const SR = 48000;

// Mulberry32: small seeded PRNG so noise and variations are reproducible.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;
const midiHz = (m) => 440 * 2 ** ((m - 69) / 12);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smooth = (x) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};

// Stereo buffer helpers.
export const stereo = (seconds) => [new Float32Array(Math.ceil(seconds * SR)), new Float32Array(Math.ceil(seconds * SR))];
function addMono(dst, src, at, gain = 1, pan = 0) {
  const start = Math.round(at * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < src.length; i += 1) {
    const j = start + i;
    if (j < 0 || j >= dst[0].length) continue;
    dst[0][j] += src[i] * gl;
    dst[1][j] += src[i] * gr;
  }
}

// Two-pole state-variable filter, processed in place.
function svf(buf, cutoff, q = 0.7, mode = "lp") {
  let low = 0;
  let band = 0;
  const cut = typeof cutoff === "function" ? cutoff : () => cutoff;
  for (let i = 0; i < buf.length; i += 1) {
    const f = 2 * Math.sin((Math.PI * clamp(cut(i), 20, SR / 6)) / SR);
    low += f * band;
    const high = buf[i] - low - band / q / 1.4;
    band += f * high;
    buf[i] = mode === "lp" ? low : mode === "hp" ? high : band;
  }
  return buf;
}

// Feedback delay with damping, for space on plucks and chimes.
function echo(ch, seconds, feedback, mix, damp = 0.35) {
  const d = Math.round(seconds * SR);
  for (const buf of ch) {
    const out = new Float32Array(buf.length);
    let lp = 0;
    for (let i = 0; i < buf.length; i += 1) {
      const fb = i >= d ? out[i - d] : 0;
      lp += (fb - lp) * (1 - damp);
      out[i] = buf[i] + lp * feedback;
    }
    for (let i = 0; i < buf.length; i += 1) buf[i] = buf[i] * (1 - mix) + out[i] * mix;
  }
}

// Small Schroeder reverb (4 combs + 2 allpasses per channel, decorrelated).
export function reverb(ch, { size = 1, wet = 0.25, damp = 0.4 } = {}) {
  const combs = [1557, 1617, 1491, 1422];
  const aps = [225, 556];
  ch.forEach((buf, c) => {
    const out = new Float32Array(buf.length);
    for (const base of combs) {
      const n = Math.round(base * size * (SR / 44100)) + c * 23;
      const line = new Float32Array(n);
      let idx = 0;
      let lp = 0;
      for (let i = 0; i < buf.length; i += 1) {
        const y = line[idx];
        lp = y * (1 - damp) + lp * damp;
        line[idx] = buf[i] + lp * 0.84;
        idx = (idx + 1) % n;
        out[i] += y * 0.25;
      }
    }
    for (const base of aps) {
      const n = Math.round(base * (SR / 44100)) + c * 7;
      const line = new Float32Array(n);
      let idx = 0;
      for (let i = 0; i < out.length; i += 1) {
        const y = line[idx];
        const x = out[i];
        line[idx] = x + y * 0.5;
        out[i] = y - x * 0.5;
        idx = (idx + 1) % n;
      }
    }
    for (let i = 0; i < buf.length; i += 1) buf[i] = buf[i] * (1 - wet * 0.5) + out[i] * wet;
  });
}

// ---------- music ----------

// sections: [{ at, name }] in seconds. Each section sets which layers play.
// Layer levels per section name; anything unnamed uses "journey".
const LAYERS = {
  "Cold open": { pad: 0.7, arp: 0, kick: 0, bright: 0.25 },
  Sting: { pad: 1, arp: 0.5, kick: 0, bright: 0.7 },
  Problem: { pad: 0.8, arp: 0, kick: 0, bright: 0.2 },
  Journey: { pad: 0.85, arp: 1, kick: 0.8, bright: 0.6 },
  "Under the hood": { pad: 0.9, arp: 0.9, kick: 0.45, bright: 0.85 },
  Result: { pad: 1, arp: 0.7, kick: 0, bright: 0.6 },
  End: { pad: 1, arp: 0.35, kick: 0, bright: 0.5 },
};

// Per-film character (all optional; the defaults are the Homeward/Relay bed):
//   layers  section name → { pad, arp, kick, bright }, merged over LAYERS
//   arp     { rate: beats per note, pattern, octave, timbre: "pluck" | "bell", decay: seconds, attack: seconds }
//   resolveAt  seconds; from then on the bed settles on its first (home) chord with a fresh swell
export function music({ duration, sections, seed = 7, bpm = 92, root = 50, progression, layers: ownLayers, arp: arpSpec = {}, resolveAt }) {
  const layers = { ...LAYERS, ...(ownLayers ?? {}) };
  const rand = rng(seed);
  const beat = 60 / bpm;
  const bar = beat * 4;
  // Chords as semitone offsets from root; two bars each.
  const chords = progression ?? [
    [0, 4, 7, 11, 14], // Imaj9
    [-3, 0, 4, 7, 11], // vi9
    [-7, -3, 0, 4, 9], // IVmaj9 (voiced low)
    [-5, -1, 2, 5, 9], // V6/9
  ];
  const chordLen = bar * 2;
  // Chord slot at t: index, time into it, and the slot it crossfades from.
  const slot = (t) => {
    if (resolveAt !== undefined && t >= resolveAt) return { ci: 0, local: t - resolveAt, prev: Math.floor(resolveAt / chordLen) };
    const ci = Math.floor(t / chordLen);
    return { ci, local: t - ci * chordLen, prev: ci - 1 };
  };
  const chordAt = (t) => chords[slot(t).ci % chords.length];
  const out = stereo(duration + 2);
  const n = out[0].length;

  // Section levels, crossfaded over 1.2 s so layers enter and leave smoothly.
  const sorted = [...sections].sort((a, b) => a.at - b.at);
  const level = (t, key) => {
    let v = (layers[sorted[0].name] ?? layers.Journey)[key];
    for (const s of sorted) {
      const target = (layers[s.name] ?? layers.Journey)[key];
      const fade = smooth((t - s.at + 0.6) / 1.2);
      v = v + (target - v) * fade;
    }
    return v;
  };

  // Pad: detuned saws per chord tone, low-passed, with per-chord swells.
  const pad = [new Float32Array(n), new Float32Array(n)];
  const voices = [];
  for (let c = 0; c < chords.length; c += 1) for (let k = 0; k < 5; k += 1) voices.push({ c, k, phase: [rand(), rand(), rand()] });
  const ratios = [-0.07, 0, 0.065].map((d) => 2 ** (d / 12));
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    const { ci, local, prev } = slot(t);
    let l = 0;
    let r = 0;
    // Current chord plus the release tail of the previous one.
    for (const [idx, env] of [
      [ci, smooth(local / 1.4)],
      [prev, 1 - smooth(local / 1.6)],
    ]) {
      if (idx < 0 || env <= 0) continue;
      const chord = chords[idx % chords.length];
      for (let k = 0; k < chord.length; k += 1) {
        const hz = midiHz(root + 12 + chord[k]);
        let s = 0;
        for (let v = 0; v < 3; v += 1) {
          const ph = (voices[(idx % chords.length) * 5 + k].phase[v] + t * hz * ratios[v]) % 1;
          s += 2 * ph - 1;
        }
        const w = env * (k === 0 ? 0.9 : 0.55) / 3;
        l += s * w * (k % 2 ? 0.75 : 1);
        r += s * w * (k % 2 ? 1 : 0.75);
      }
    }
    pad[0][i] = l;
    pad[1][i] = r;
  }
  for (const ch of pad) svf(ch, (i) => 380 + 1500 * level(i / SR, "bright") + 140 * Math.sin((TAU * i) / SR / 7.3), 0.8, "lp");
  for (let i = 0; i < n; i += 1) {
    const g = 0.16 * level(i / SR, "pad");
    out[0][i] += pad[0][i] * g;
    out[1][i] += pad[1][i] * g;
  }

  // Bass: soft sine root, crossfaded between chords so it never steps.
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    const { ci, local, prev } = slot(t);
    const x = smooth(local / 0.35);
    const now = Math.sin(TAU * midiHz(root - 12 + chords[ci % chords.length][0]) * t);
    const before = prev >= 0 ? Math.sin(TAU * midiHz(root - 12 + chords[prev % chords.length][0]) * t) : 0;
    const s = (now * x + before * (1 - x)) * 0.045 * Math.max(level(t, "kick"), level(t, "pad") * 0.5);
    out[0][i] += s;
    out[1][i] += s;
  }

  // Arpeggio: plucked 8ths over chord tones (or the film's own rhythm and timbre), alternating
  // pan, into a dotted-8th echo.
  const arp = stereo(duration + 2);
  const { rate = 0.5, pattern = [0, 2, 1, 3, 4, 2, 3, 1], octave = 24, timbre = "pluck", decay = 0.12, attack = 0.004 } = arpSpec;
  const accentEvery = Math.max(1, Math.round(2 / rate));
  for (let step = 0; step * beat * rate < duration; step += 1) {
    const t = step * beat * rate;
    const lvl = level(t, "arp");
    if (lvl < 0.02) continue;
    const chord = chordAt(t);
    const hz = midiHz(root + octave + chord[pattern[step % pattern.length] % chord.length]);
    const len = Math.round(Math.max(0.42, decay * 4) * SR);
    const note = new Float32Array(len);
    const vel = (step % accentEvery === 0 ? 1 : 0.72) * (0.9 + 0.2 * rand());
    for (let i = 0; i < len; i += 1) {
      const x = i / SR;
      const env = Math.min(1, x / attack) * Math.exp(-x / decay);
      note[i] = timbre === "bell"
        ? (Math.sin(TAU * hz * x) + 0.3 * Math.sin(TAU * hz * 2.76 * x) * Math.exp(-x / 0.35) + 0.12 * Math.sin(TAU * hz * 5.4 * x) * Math.exp(-x / 0.12)) * env * vel
        : (Math.sin(TAU * hz * x) + 0.25 * Math.sin(TAU * hz * 2 * x) * Math.exp(-x / 0.05)) * env * vel;
    }
    addMono(arp, note, t, 0.07 * lvl, step % 2 ? 0.35 : -0.35);
  }
  echo(arp, beat * 0.75, 0.38, 0.4);
  for (let c = 0; c < 2; c += 1) for (let i = 0; i < n; i += 1) out[c][i] += arp[c][i];

  // Kick (soft, on beats 1 and 3).
  const kickLen = Math.round(0.32 * SR);
  const kick = new Float32Array(kickLen);
  let ph = 0;
  for (let i = 0; i < kickLen; i += 1) {
    const x = i / SR;
    ph += (TAU * (44 + 70 * Math.exp(-x / 0.04))) / SR;
    kick[i] = Math.sin(ph) * Math.exp(-x / 0.11) * Math.min(1, x / 0.002);
  }
  for (let b = 0; b * beat < duration; b += 1) {
    const t = b * beat;
    const k = level(t, "kick");
    if (k > 0.02 && b % 2 === 0) addMono(out, kick, t, 0.22 * k);
  }

  // The bed stays below the consonant band so nothing in it reads as a tick on the voice.
  for (const ch of out) svf(ch, 4200, 0.6, "lp");
  reverb(out, { size: 1.15, wet: 0.22 });
  // Global fades.
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    const g = smooth(t / 0.8) * (1 - smooth((t - duration + 2.2) / 2.2));
    out[0][i] *= g;
    out[1][i] *= g;
  }
  return out;
}

// ---------- sound effects ----------

export function sfxClick(seed) {
  const rand = rng(seed);
  const len = Math.round(0.05 * SR);
  const b = new Float32Array(len);
  const hz = 1900 + rand() * 300;
  for (let i = 0; i < len; i += 1) {
    const x = i / SR;
    b[i] = (Math.sin(TAU * hz * x) * Math.exp(-x / 0.006) * 0.8 + (rand() * 2 - 1) * Math.exp(-x / 0.003) * 0.5 + Math.sin(TAU * 420 * x) * Math.exp(-x / 0.012) * 0.5);
  }
  return b;
}

export function sfxKey(seed) {
  const rand = rng(seed);
  const len = Math.round(0.035 * SR);
  const b = new Float32Array(len);
  for (let i = 0; i < len; i += 1) b[i] = (rand() * 2 - 1) * Math.exp(-i / SR / 0.004);
  svf(b, 2600 + rand() * 1800, 1.4, "bp");
  return b;
}

// Whoosh: band-passed noise whose centre sweeps up then down across the transition.
export function sfxWhoosh(seconds, seed, bright = 1) {
  const rand = rng(seed);
  const len = Math.round((seconds + 0.25) * SR);
  const b = new Float32Array(len);
  for (let i = 0; i < len; i += 1) b[i] = rand() * 2 - 1;
  const peak = 0.55 * seconds;
  svf(b, (i) => {
    const x = i / SR;
    const p = x < peak ? x / peak : 1 - (x - peak) / (len / SR - peak);
    return 300 + 2600 * bright * smooth(p);
  }, 1.1, "bp");
  for (let i = 0; i < len; i += 1) {
    const x = i / SR;
    const env = x < peak ? smooth(x / peak) ** 1.6 : Math.exp(-(x - peak) / 0.12);
    b[i] *= env;
  }
  return b;
}

// Swell: soft airy rise into a dissolve.
export function sfxSwell(seconds, seed) {
  const rand = rng(seed);
  const len = Math.round((seconds + 0.4) * SR);
  const b = new Float32Array(len);
  for (let i = 0; i < len; i += 1) b[i] = rand() * 2 - 1;
  svf(b, (i) => 900 + 3000 * smooth(i / len), 0.6, "lp");
  for (let i = 0; i < len; i += 1) {
    const x = i / SR;
    b[i] *= smooth(x / seconds) * Math.exp(-Math.max(0, x - seconds) / 0.12) * 0.6;
  }
  return b;
}

// Chime: inharmonic bell partials with long decays; two notes for the title.
export function sfxChime(root = 74, notes = [0, 7]) {
  const len = Math.round(2.6 * SR);
  const b = new Float32Array(len);
  notes.forEach((n, k) => {
    const hz = midiHz(root + n);
    const offset = Math.round(k * 0.11 * SR);
    const partials = [[1, 1, 1.4], [2.0, 0.35, 0.8], [2.76, 0.22, 0.5], [5.4, 0.08, 0.25]];
    for (let i = 0; i + offset < len; i += 1) {
      const x = i / SR;
      let s = 0;
      for (const [ratio, amp, decay] of partials) s += Math.sin(TAU * hz * ratio * x) * amp * Math.exp(-x / decay);
      b[i + offset] += s * Math.min(1, x / 0.003) * 0.5;
    }
  });
  return b;
}

export { addMono };
