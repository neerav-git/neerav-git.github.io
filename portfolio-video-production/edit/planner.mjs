// Turns captured journeys, narration timings, and a film's edit decisions into a
// frame-exact plan.json that the Remotion compositor renders and the mixer scores.
// Everything here is pure computation: the same plan always renders the same film.
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

export const FPS = 60;
export const W = 1920;
export const H = 1080;
export const f = (seconds) => Math.round(seconds * FPS);

// Browser window geometry at rest (composition pixels). The capture is 1920x1080 CSS px.
export const LAYOUT = {
  window: { left: 200, top: 116, width: 1520, titleBar: 56 },
};
LAYOUT.scale = LAYOUT.window.width / 1920;
LAYOUT.content = { left: LAYOUT.window.left, top: LAYOUT.window.top + LAYOUT.window.titleBar, width: 1520, height: 1080 * LAYOUT.scale };
LAYOUT.rest = { x: 960, y: (LAYOUT.content.top + LAYOUT.content.height / 2 - LAYOUT.content.top) / LAYOUT.scale };

// ---------- easing ----------

export function cubicBezier(x1, y1, x2, y2) {
  const sample = (a, b, t) => 3 * a * (1 - t) * (1 - t) * t + 3 * b * (1 - t) * t * t + t * t * t;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 40; i += 1) {
      const mid = (lo + hi) / 2;
      if (sample(x1, x2, mid) < x) lo = mid;
      else hi = mid;
    }
    return sample(y1, y2, (lo + hi) / 2);
  };
}
export const EASE = {
  camera: cubicBezier(0.65, 0, 0.35, 1),
  enter: cubicBezier(0.22, 1, 0.36, 1),
  exit: cubicBezier(0.64, 0, 0.78, 0),
};
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ---------- monotone time maps (speed ramps) ----------

// Fritsch-Carlson monotone cubic through [x, y] points. Used to map output frames to
// source frames: anchors pin events to narration words, and speed changes ease between.
export function monotone(points) {
  const n = points.length;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const d = [];
  for (let i = 0; i < n - 1; i += 1) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i += 1) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i += 1) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = 0;
    while (x > xs[i + 1]) i += 1;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

// ---------- journey data ----------

export function loadJourney(root, slug, take) {
  const dir = path.join(root, "projects", slug, "captures", "journey", `take-${String(take).padStart(2, "0")}`);
  const chapters = {};
  const meta = JSON.parse(readFileSync(path.join(dir, "take.json"), "utf8"));
  for (const { chapter } of meta.chapters) {
    const data = JSON.parse(readFileSync(path.join(dir, `${chapter}.events.json`), "utf8"));
    const file = path.join(dir, `${chapter}.mp4`);
    chapters[chapter] = { ...data, file, idle: idleFrames(file, data) };
  }
  return { dir, take, chapters };
}

// A source frame is idle when nothing on screen changes from the previous frame and the
// cursor is at rest. Idle frames can be held or skipped invisibly; everything else plays
// at a real speed. Pixel change is measured from the capture itself and cached.
function idleFrames(file, data) {
  const cache = file.replace(/\.mp4$/, ".activity.json");
  let diff;
  if (existsSync(cache)) diff = JSON.parse(readFileSync(cache, "utf8"));
  else {
    const w = 192;
    const h = 108;
    const r = spawnSync(ffmpegPath, ["-v", "error", "-i", file, "-vf", `scale=${w}:${h}:flags=area,format=gray`, "-f", "rawvideo", "-"], { maxBuffer: 1 << 30 });
    const n = Math.floor(r.stdout.length / (w * h));
    diff = [0];
    for (let i = 1; i < n; i += 1) {
      let sum = 0;
      for (let k = 0; k < w * h; k += 1) sum += Math.abs(r.stdout[i * w * h + k] - r.stdout[(i - 1) * w * h + k]);
      diff.push(Math.round((sum / (w * h)) * 1000) / 1000);
    }
    writeFileSync(cache, JSON.stringify(diff));
  }
  const idle = [];
  for (let i = 0; i < data.frames; i += 1) {
    const a = data.cursor[Math.max(0, i - 1)];
    const b = data.cursor[i];
    const still = Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.25 && !b[2] && !a[2];
    idle.push(still && (diff[i] ?? 0) < 0.06);
  }
  return idle;
}

// Output frame → source frame for one shot. Between consecutive anchors, moving
// (non-idle) source frames play at one speed in [0.75, 2] (1× whenever it fits); idle
// frames stretch or shrink to absorb the difference. Returns fractional source positions
// and the moving-frame speeds actually used.
export function timeMap(anchors, idle) {
  const n = anchors[anchors.length - 1][0];
  const src = new Array(n);
  const speeds = [];
  const warnings = [];
  for (let k = 0; k < anchors.length - 1; k += 1) {
    const [o0, s0r] = anchors[k];
    const [o1, s1r] = anchors[k + 1];
    const s0 = Math.round(s0r);
    const s1 = Math.round(s1r);
    const nOut = o1 - o0;
    const frames = [];
    for (let j = s0; j < s1; j += 1) frames.push(j);
    if (nOut <= 0) continue;
    if (!frames.length) {
      for (let i = o0; i < o1; i += 1) src[i] = s0;
      continue;
    }
    // Frame j's change happens between j-1 and j, so the step j → j+1 is idle when j+1 is idle.
    const isIdle = frames.map((j) => idle[j + 1] ?? true);
    const I = isIdle.filter(Boolean).length;
    const A = frames.length - I;
    const dur = new Array(frames.length);
    let v = 1;
    if (A === 0) {
      frames.forEach((_, i) => (dur[i] = nOut / frames.length));
    } else {
      if (nOut >= A) {
        v = I > 0 ? 1 : Math.max(0.75, A / nOut);
      } else {
        v = A / nOut;
        if (v > 2) warnings.push(`anchor ${k}: needs ${v.toFixed(2)}× over moving frames`);
      }
      let idleOut = Math.max(0, nOut - A / v);
      if (I === 0 && idleOut > 0) {
        // No idle frame to hold: hold the stillest step instead.
        let best = 0;
        frames.forEach((j, i) => {
          if (Math.abs(idle[j + 1] ? 0 : 1) <= Math.abs(idle[frames[best] + 1] ? 0 : 1)) best = i;
        });
        isIdle[best] = true;
        idleOut += 1 / v;
      }
      const idleCount = isIdle.filter(Boolean).length;
      frames.forEach((_, i) => (dur[i] = isIdle[i] ? idleOut / idleCount : 1 / v));
      speeds.push(v);
    }
    // Walk the cumulative durations: output frame i shows a fractional source position.
    let j = 0;
    let acc = 0;
    for (let i = o0; i < o1; i += 1) {
      const t = i - o0;
      while (j < frames.length - 1 && acc + dur[j] <= t) {
        acc += dur[j];
        j += 1;
      }
      const frac = dur[j] > 0 ? Math.min(1, (t - acc) / dur[j]) : 0;
      src[i] = frames[j] + frac;
    }
  }
  return { src, speeds, warnings };
}

// Find an event by action and label; n picks the nth match (0-based).
export function event(chapter, action, label, n = 0) {
  const hits = chapter.events.filter((e) => e.action === action && (label === undefined || e.label === label));
  if (!hits[n]) throw new Error(`${chapter.chapter}: no ${action}${label ? ` "${label}"` : ""} #${n}`);
  return hits[n];
}

export function loadNarration(root, slug) {
  const dir = path.join(root, "projects", slug, "narration");
  const words = JSON.parse(readFileSync(path.join(dir, "words.json"), "utf8"));
  return { dir, sentences: words, wav: path.join(dir, "narration.wav") };
}

// ---------- camera ----------

const base = (p) => ({ x: LAYOUT.content.left + p.x * LAYOUT.scale, y: LAYOUT.content.top + p.y * LAYOUT.scale });

function anchorFor(z) {
  // Smoothstep (not a linear ramp): a kink here made every zoom through 1.35x bounce.
  const u = clamp((z - 1) / 0.6, 0, 1);
  const t = u * u * (3 - 2 * u);
  const restY = LAYOUT.content.top + LAYOUT.content.height / 2;
  return { x: 960, y: lerp(restY, 548, t) };
}

// Keeps the zoomed view inside the browser window. When the view is larger than the
// window (low zoom), any focus inside the reversed interval keeps the whole window visible.
function clampFocus(z, fx, fy) {
  const b = base({ x: fx, y: fy });
  const a = anchorFor(z);
  const win = LAYOUT.window;
  // Visible screen [0, W] maps to base [b.x - a.x / z, b.x + (W - a.x) / z].
  const minX = win.left + a.x / z;
  const maxX = win.left + win.width - (W - a.x) / z;
  const minY = win.top + a.y / z;
  const maxY = LAYOUT.content.top + LAYOUT.content.height - (H - a.y) / z;
  const x = clamp(b.x, Math.min(minX, maxX), Math.max(minX, maxX));
  const y = clamp(b.y, Math.min(minY, maxY), Math.max(minY, maxY));
  return { x: (x - LAYOUT.content.left) / LAYOUT.scale, y: (y - LAYOUT.content.top) / LAYOUT.scale };
}

export function screenOf(p, cam) {
  const a = anchorFor(cam.z);
  const b = base(p);
  const bf = base({ x: cam.fx, y: cam.fy });
  return { x: a.x + cam.z * (b.x - bf.x), y: a.y + cam.z * (b.y - bf.y) };
}

// keys: [{ frame, z, focus: {x, y} | "cursor", dur (frames) }], in shot-local output frames.
// A key that starts before the previous move ends restarts from rest (a visible jolt), so
// overlaps are reported through cameraPath.warnings.
// Focus "cursor" follows a smoothed cursor path until the next key.
export function cameraPath(keys, n, cursor, init) {
  const smooth = [];
  let sx = cursor[0]?.[0] ?? LAYOUT.rest.x;
  let sy = cursor[0]?.[1] ?? LAYOUT.rest.y;
  const k = 1 - Math.exp(-1 / (0.32 * FPS));
  for (let i = 0; i < n; i += 1) {
    sx += (cursor[i][0] - sx) * k;
    sy += (cursor[i][1] - sy) * k;
    smooth.push({ x: sx, y: sy });
  }
  const sorted = [...keys].sort((a, b) => a.frame - b.frame);
  for (let k = 1; k < sorted.length; k += 1) {
    const prev = sorted[k - 1];
    if (prev.dur > 0 && sorted[k].frame < prev.frame + prev.dur) cameraPath.warnings.push(`camera key at frame ${sorted[k].frame} interrupts the move started at ${prev.frame} (ends ${prev.frame + prev.dur})`);
  }
  let cur = init ? { ...init } : { z: 1, fx: LAYOUT.rest.x, fy: LAYOUT.rest.y };
  if (sorted[0] && sorted[0].frame <= 0 && sorted[0].dur === 0) {
    const focus = sorted[0].focus === "cursor" ? smooth[0] : sorted[0].focus;
    cur = { z: sorted[0].z, fx: focus.x, fy: focus.y };
  }
  let seg = null;
  let next = 0;
  const out = [];
  for (let i = 0; i < n; i += 1) {
    while (next < sorted.length && sorted[next].frame <= i) {
      seg = { start: sorted[next].frame, key: sorted[next], from: { ...cur } };
      next += 1;
    }
    if (seg) {
      const p = seg.key.dur > 0 ? EASE.camera(clamp((i - seg.start) / seg.key.dur, 0, 1)) : 1;
      // Targets are clamped once, at the key, so the glide between two framed views is a
      // single eased move. Clamping every frame made pans bounce as the bounds moved.
      const raw = seg.key.focus === "cursor" ? smooth[i] : seg.key.focus;
      const target = clampFocus(seg.key.z, raw.x, raw.y);
      cur = {
        z: Math.exp(lerp(Math.log(seg.from.z), Math.log(seg.key.z), p)),
        fx: lerp(seg.from.fx, target.x, p),
        fy: lerp(seg.from.fy, target.y, p),
      };
    } else if (i === 0) {
      const c = clampFocus(cur.z, cur.fx, cur.fy);
      cur = { z: cur.z, fx: c.x, fy: c.y };
    }
    out.push({ z: cur.z, fx: cur.fx, fy: cur.fy });
  }
  // Motion blur follows screen-space velocity of the frame centre.
  for (let i = 0; i < n; i += 1) {
    const a = screenOf({ x: 960, y: 540 }, out[Math.max(0, i - 1)]);
    const b = screenOf({ x: 960, y: 540 }, out[i]);
    const zoomRate = Math.abs(Math.log(out[i].z / out[Math.max(0, i - 1)].z)) * 900;
    out[i].bx = Math.min(7, Math.max(0, Math.abs(b.x - a.x) * 0.16 + zoomRate * 0.1 - 0.35));
    out[i].by = Math.min(7, Math.max(0, Math.abs(b.y - a.y) * 0.16 + zoomRate * 0.1 - 0.35));
  }
  return out;
}

// ---------- capture shots ----------

// Builds a capture shot. anchors: [[outputFrame, sourceFrame], ...] in shot-local output
// frames; the first and last anchors set the shot's in and out points.
export function captureShot({ id, chapter, video, anchors, keys = [], overlays = [], reveals = [], extra = {}, init }) {
  const n = anchors[anchors.length - 1][0];
  const mapped = timeMap(anchors, chapter.idle);
  const src = mapped.src.map((s) => clamp(s, 0, chapter.frames - 1));
  const speeds = mapped.speeds.length ? mapped.speeds : [1];
  for (const w of mapped.warnings) console.warn(`  ${id}: ${w}`);
  const cursor = src.map((s) => {
    const i = Math.floor(s);
    const t = s - i;
    const a = chapter.cursor[i];
    const b = chapter.cursor[Math.min(chapter.cursor.length - 1, i + 1)];
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), a[2], a[3]];
  });
  // Shot-local output frame at which a source frame is shown.
  const outFrame = (source) => {
    let lo = 0;
    let hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (src[mid] < source) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const inShot = (e) => e.frame >= src[0] && e.frame <= src[n - 1];
  const keyResolved = keys.map((k) => ({ ...k, frame: Math.round(k.frame), dur: Math.round(k.dur ?? f(0.75)) }));
  cameraPath.warnings = [];
  const camera = cameraPath(keyResolved, n, cursor, init);
  for (const w of cameraPath.warnings) console.warn(`  ${id}: ${w}`);
  const clicks = chapter.events.filter((e) => e.action === "click" && inShot(e)).map((e) => ({ frame: outFrame(e.frame), x: e.x, y: e.y }));
  const keysTyped = chapter.events.filter((e) => e.action === "key" && inShot(e)).map((e) => outFrame(e.frame));
  const hovers = chapter.events.filter((e) => e.action === "hover" && inShot(e)).map((e) => {
    const click = chapter.events.find((c) => c.action === "click" && c.frame >= e.frame);
    return { from: outFrame(e.frame), to: click ? outFrame(click.frame) + f(0.35) : outFrame(e.frame) + f(0.6), box: e.box };
  });
  const minSpeed = Math.min(...speeds);
  const maxSpeed = Math.max(...speeds);
  return {
    id, kind: "capture", video, duration: n,
    frames: {
      src: src.map((s) => Math.floor(s + 1e-6)),
      // Full precision: rounding the zoom to 0.001 stair-stepped slow zooms.
      cam: camera.map((c) => [r6(c.z), r3(c.fx), r3(c.fy), r2(c.bx), r2(c.by)]),
      cursor: cursor.map((c) => [r2(c[0]), r2(c[1]), c[2], c[3]]),
    },
    clicks, keysTyped, hovers, overlays, reveals, speed: { min: r2(minSpeed), max: r2(maxSpeed) }, outFrame, endCam: camera[n - 1], ...extra,
  };
}

export const r2 = (v) => Math.round(v * 100) / 100;
export const r3 = (v) => Math.round(v * 1000) / 1000;
export const r6 = (v) => Math.round(v * 1e6) / 1e6;

export function exists(p) {
  return existsSync(p);
}
