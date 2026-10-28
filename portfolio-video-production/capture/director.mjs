// Deterministic journey capture.
//
// Headless Chrome's screencast only delivers CSS-pixel frames (1920x1080 at any DPR), so
// journeys are captured by frame stepping instead: Playwright's fake clock advances page
// time by exactly 1/60 s, every CSS animation is paused and seeked to the same virtual
// time, and each frame is grabbed through CDP at scale 2 (3840x2160 source pixels).
// Network requests still resolve in real time, so waits come out shorter on screen than
// they were, but nothing on screen is invented or skipped.
//
// The real cursor is invisible in headless Chrome. Every pointer position, press, key, and
// scroll is written to <chapter>.events.json so the compositor can draw the cursor, click
// ripples, and camera moves from the log.
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import { chromium } from "playwright";

export const FPS = 60;
const FRAME_MS = 1000 / FPS;
const VIEWPORT = { width: 1920, height: 1080 };
// CAPTURE_SCALE=1 gives quick 1080p test takes; real takes are always 2 (3840x2160).
const SCALE = Number(process.env.CAPTURE_SCALE ?? 2);

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Minimum-jerk profile: the velocity shape of a natural hand movement.
const minJerk = (t) => t * t * t * (10 - 15 * t + 6 * t * t);
const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

function bezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

const CLEAN_CSS = `
  * { scrollbar-width: none !important; }
  *::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
  html, * { scroll-behavior: auto !important; }
`;

export async function launch({ url, seed = 1, clock = "2026-09-19T09:00:00", reset, hideText = [], colorScheme = "light" }) {
  const browser = await chromium.launch({ headless: true, args: ["--hide-scrollbars", "--font-render-hinting=none"] });
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: SCALE, colorScheme, reducedMotion: "no-preference" });
  if (reset) await reset(context);
  const page = await context.newPage();
  await page.clock.install({ time: new Date(clock) });
  // Development URLs and similar strings are hidden wherever they render; nothing else changes.
  await page.addInitScript(({ css, hideText }) => {
    const apply = () => {
      if (!document.getElementById("__capture_css")) {
        const style = document.createElement("style");
        style.id = "__capture_css";
        style.textContent = css;
        document.head.appendChild(style);
      }
      if (!hideText.length) return;
      for (const el of document.querySelectorAll("code, a, span, p, small")) {
        if (el.children.length === 0 && hideText.some((t) => el.textContent.includes(t))) el.style.visibility = "hidden";
      }
    };
    document.addEventListener("DOMContentLoaded", () => {
      apply();
      new MutationObserver(apply).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    });
  }, { css: CLEAN_CSS, hideText });
  await page.goto(url, { waitUntil: "networkidle" });
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 500);
  const cdp = await context.newCDPSession(page);
  return { browser, context, page, cdp, rand: mulberry32(seed) };
}

export class Recorder {
  constructor({ page, cdp, rand }, outDir, { start = { x: 1180, y: 640 } } = {}) {
    this.page = page;
    this.cdp = cdp;
    this.rand = rand;
    this.outDir = outDir;
    this.cursor = { ...start };
    this.pressed = false;
    this.cursorVisible = true;
    this.vt = 0;
  }

  async chapter(name, run) {
    await mkdir(this.outDir, { recursive: true });
    const file = path.join(this.outDir, `${name}.mp4`);
    this.frameIndex = 0;
    this.events = [];
    this.track = [];
    this.encoder = spawn(ffmpegPath, [
      "-y", "-loglevel", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(FPS), "-i", "-",
      "-c:v", "libx264", "-preset", "faster", "-crf", "9", "-pix_fmt", "yuv420p", "-g", "30",
      "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart", file,
    ], { stdio: ["pipe", "inherit", "inherit"] });
    const done = new Promise((resolve, reject) => this.encoder.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code} on ${name}`)))));
    await this.page.mouse.move(this.cursor.x, this.cursor.y);
    const started = Date.now();
    await run(this);
    this.encoder.stdin.end();
    await done;
    const meta = {
      chapter: name, fps: FPS, viewport: VIEWPORT, scale: SCALE, frames: this.frameIndex,
      seconds: this.frameIndex / FPS, captureWallSeconds: (Date.now() - started) / 1000,
      // One entry per frame: cursor x, y in CSS pixels, pressed, visible.
      cursor: this.track, events: this.events,
    };
    await writeFile(path.join(this.outDir, `${name}.events.json`), `${JSON.stringify(meta)}\n`);
    console.log(`  ${name}: ${this.frameIndex} frames (${meta.seconds.toFixed(1)} s) in ${meta.captureWallSeconds.toFixed(0)} s`);
    return meta;
  }

  log(action, extra = {}) {
    this.events.push({ t: Number((this.frameIndex / FPS).toFixed(4)), frame: this.frameIndex, x: Math.round(this.cursor.x), y: Math.round(this.cursor.y), action, ...extra });
  }

  async frame() {
    await this.page.clock.runFor(FRAME_MS);
    this.vt += FRAME_MS;
    const scroll = await this.page.evaluate((now) => {
      const seen = (window.__captureAnimations ||= new WeakMap());
      for (const animation of document.getAnimations()) {
        if (!seen.has(animation)) {
          seen.set(animation, now - (animation.currentTime || 0));
          animation.pause();
        }
        animation.currentTime = now - seen.get(animation);
      }
      return { x: window.scrollX, y: window.scrollY };
    }, this.vt);
    // The clip is in document coordinates, so it follows the window's scroll to grab the viewport.
    const { data } = await this.cdp.send("Page.captureScreenshot", {
      format: "jpeg", quality: 100, optimizeForSpeed: true,
      clip: { x: scroll.x, y: scroll.y, width: VIEWPORT.width, height: VIEWPORT.height, scale: SCALE },
    });
    const buffer = Buffer.from(data, "base64");
    if (!this.encoder.stdin.write(buffer)) await new Promise((resolve) => this.encoder.stdin.once("drain", resolve));
    this.track.push([Number(this.cursor.x.toFixed(2)), Number(this.cursor.y.toFixed(2)), this.pressed ? 1 : 0, this.cursorVisible ? 1 : 0]);
    this.frameIndex += 1;
  }

  async hold(ms) {
    for (let i = 0, n = Math.round(ms / FRAME_MS); i < n; i += 1) await this.frame();
  }

  jitter(min, max) {
    return min + (max - min) * this.rand();
  }

  async box(target) {
    if (!target.boundingBox) return { x: target.x - 1, y: target.y - 1, width: 2, height: 2 };
    await target.waitFor({ state: "visible", timeout: 15000 });
    const box = await target.boundingBox();
    if (!box) throw new Error(`No bounding box for ${target}`);
    return box;
  }

  describe(target) {
    return target.boundingBox ? String(target) : "point";
  }

  // Eased Bezier travel with a slight overshoot and settle, 250-700 ms by distance.
  async moveTo(target, { duration, anchor = [0.5, 0.5], label } = {}) {
    const box = await this.box(target);
    const to = { x: box.x + box.width * anchor[0], y: box.y + box.height * anchor[1] };
    const from = { ...this.cursor };
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) return box;
    const ms = duration ?? Math.min(700, Math.max(250, 230 + 115 * Math.log2(1 + distance / 30)));
    const normal = { x: -dy / distance, y: dx / distance };
    const bow = distance * this.jitter(0.04, 0.12) * (this.rand() < 0.5 ? -1 : 1);
    const overshoot = Math.min(9, distance * 0.025);
    const end = { x: to.x + (dx / distance) * overshoot, y: to.y + (dy / distance) * overshoot };
    const c1 = { x: from.x + dx * 0.3 + normal.x * bow, y: from.y + dy * 0.3 + normal.y * bow };
    const c2 = { x: from.x + dx * 0.75 + normal.x * bow * 0.4, y: from.y + dy * 0.75 + normal.y * bow * 0.4 };
    const frames = Math.max(2, Math.round(ms / FRAME_MS));
    const travel = Math.round(frames * 0.84);
    this.log("move-start", { to: { x: Math.round(to.x), y: Math.round(to.y) }, duration: frames / FPS, target: this.describe(target), box, label });
    for (let i = 1; i <= frames; i += 1) {
      const point = i <= travel
        ? bezier(from, c1, c2, end, minJerk(i / travel))
        : { x: end.x + (to.x - end.x) * minJerk((i - travel) / (frames - travel)), y: end.y + (to.y - end.y) * minJerk((i - travel) / (frames - travel)) };
      this.cursor = point;
      await this.page.mouse.move(point.x, point.y);
      await this.frame();
    }
    this.cursor = to;
    return box;
  }

  async click(target, { label, dwell, anchor } = {}) {
    let box = await this.moveTo(target, { anchor, label });
    this.log("hover", { target: this.describe(target), box, label });
    await this.hold(dwell ?? this.jitter(150, 300));
    // Pages re-render while the cursor travels; if the target moved, follow it as a person would.
    for (let attempt = 0; attempt < 3 && target.boundingBox; attempt += 1) {
      const now = await this.box(target);
      const inside = this.cursor.x >= now.x + 1 && this.cursor.x <= now.x + now.width - 1 && this.cursor.y >= now.y + 1 && this.cursor.y <= now.y + now.height - 1;
      if (inside) break;
      this.log("retarget", { label, from: box, to: now });
      box = await this.moveTo(target, { anchor, label, duration: 260 });
      await this.hold(120);
    }
    if (box.y < 0 || box.y + box.height > 1080 || box.x < 0 || box.x + box.width > 1920) {
      throw new Error(`Click target "${label}" is outside the viewport (${Math.round(box.x)}, ${Math.round(box.y)})`);
    }
    this.pressed = true;
    await this.page.mouse.down();
    this.log("click", { target: this.describe(target), box, label });
    await this.hold(this.jitter(70, 110));
    this.pressed = false;
    await this.page.mouse.up();
    await this.frame();
    return box;
  }

  async type(text, { label, min = 35, max = 90 } = {}) {
    this.log("type-start", { text, label });
    for (const char of text) {
      await this.page.keyboard.type(char);
      this.log("key", { char });
      const pause = this.jitter(min, max) * (char === " " ? 1.3 : 1) * ([",", "."].includes(char) ? 2.2 : 1);
      await this.hold(pause);
    }
    this.log("type-end", { label });
  }

  async press(key, { label } = {}) {
    await this.page.keyboard.press(key);
    this.log("key", { key, label });
    await this.frame();
  }

  // Momentum scroll of a scroll container (or the page), driven frame by frame.
  async scroll(selector, distance, { duration = 900, label } = {}) {
    const start = await this.page.evaluate((s) => (s ? document.querySelector(s).scrollTop : window.scrollY), selector);
    const frames = Math.round(duration / FRAME_MS);
    this.log("scroll-start", { selector, from: start, distance, duration: frames / FPS, label });
    for (let i = 1; i <= frames; i += 1) {
      const y = start + distance * easeOutQuint(i / frames);
      await this.page.evaluate(([s, value]) => (s ? (document.querySelector(s).scrollTop = value) : window.scrollTo(0, value)), [selector, y]);
      await this.frame();
    }
    this.log("scroll-end", { selector, label });
  }

  // Keeps recording while a real result arrives; the edit may speed-ramp this span.
  // `timeout` is wall-clock ms; `pageTimeout` instead bounds the wait in page time (captured
  // frames), for waits on page-side timers that frame-stepping slows down.
  async waitFor(check, { timeout = 20000, pageTimeout, settle = 250, label } = {}) {
    this.log("wait-start", { label });
    const deadline = Date.now() + timeout;
    const lastFrame = pageTimeout === undefined ? Infinity : this.frameIndex + Math.round(pageTimeout / FRAME_MS);
    while (!(await check())) {
      if ((pageTimeout === undefined && Date.now() > deadline) || this.frameIndex > lastFrame) throw new Error(`Timed out waiting for ${label}`);
      await this.frame();
    }
    this.log("wait-end", { label });
    await this.hold(settle);
  }

  mark(label, extra = {}) {
    this.log("mark", { label, ...extra });
  }

  hideCursor() {
    this.cursorVisible = false;
  }

  showCursor() {
    this.cursorVisible = true;
  }
}
