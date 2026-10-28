// Live Relay voice turn, recorded for the film. Run from the Relay repo with its tsx:
//   cd "DeepGram Project" && npx tsx "<this file>" --base http://127.0.0.1:5180 --line <16k wav> --out <dir>
// Kokoro speaks the employee's line into Relay's real voice path (the evaluation's microphone shim):
// Deepgram speech-to-text, the agent, the portal tools and the spoken answer all run live. Every
// Deepgram socket message is logged in page time; agent audio is kept as raw PCM so the film can play
// exactly what was spoken and the capture can replay the session frame by frame.
// Cost: Deepgram Voice Agent time for one session (about a minute).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { VOICE_SHIM, waitForVoiceTurn } from "/Users/neeravch/Documents/ChatGPT/DeepGram Project/evaluation/ui-runner/voice.ts";

const arg = (name: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : undefined; };
const BASE = arg("base") ?? "http://127.0.0.1:5180";
const LINE = arg("line")!;
const OUT = arg("out")!;
mkdirSync(OUT, { recursive: true });

const TAP = `(() => {
  const Native = window.WebSocket;
  const log = (window.__dg = { msgs: [], sockets: 0 });
  const b64 = (buf) => { let s = ""; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  window.WebSocket = class extends Native {
    constructor(url, protocols) {
      super(url, protocols);
      if (!/deepgram/i.test(String(url))) return;
      const sock = ++log.sockets;
      log.msgs.push({ dir: "open", at: performance.now(), sock, url: String(url).split("?")[0] });
      this.addEventListener("open", () => log.msgs.push({ dir: "opened", at: performance.now(), sock }));
      this.addEventListener("message", async (e) => {
        const at = performance.now();
        if (typeof e.data === "string") { log.msgs.push({ dir: "in", at, sock, text: e.data }); return; }
        const buf = e.data instanceof Blob ? await e.data.arrayBuffer() : e.data;
        log.msgs.push({ dir: "in", at, sock, bin: b64(buf), bytes: buf.byteLength });
      });
      this.addEventListener("close", (e) => log.msgs.push({ dir: "close", at: performance.now(), sock, code: e.code }));
      const send = this.send.bind(this);
      this.send = (data) => {
        const at = performance.now();
        if (typeof data === "string") log.msgs.push({ dir: "out", at, sock, text: data });
        else log.msgs.push({ dir: "out", at, sock, bytes: data.byteLength ?? data.size });
        return send(data);
      };
    }
  };
})();`;

const browser = await chromium.launch({ headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: OUT, size: { width: 1920, height: 1080 } } });
await context.addInitScript({ content: "window.__name = (target) => target;" });
await context.addInitScript({ content: VOICE_SHIM });
await context.addInitScript({ content: TAP });
const page = await context.newPage();
const t0 = Date.now();
const deadline = t0 + 150_000;
try {
  await page.goto(`${BASE}/#home`);
  await page.evaluate(() => fetch("/api/dev/reset", { method: "POST", credentials: "same-origin" }));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const clickedAt = await page.evaluate(() => performance.now());
  // The dock orb (Relay's voice-first entry point) starts the conversation in place.
  await page.locator(".assistant-launcher").click();
  let ready = false;
  for (let listeningSince = 0, end = Date.now() + 40_000; Date.now() < end; await page.waitForTimeout(150)) {
    const phase = await page.evaluate(() => (window as any).__voiceShim.phases.at(-1)?.phase ?? "ready");
    if (phase === "error") break;
    if (phase === "listening") { listeningSince ||= Date.now(); if (Date.now() - listeningSince > 1_500) { ready = true; break; } }
    else listeningSince = 0;
  }
  if (!ready) throw new Error("voice session did not reach listening");
  await page.waitForTimeout(800);
  const since = await page.evaluate(() => performance.now());
  const audio = readFileSync(LINE).toString("base64");
  const spoken = await page.evaluate((a) => (window as any).__voiceShim.play(a), audio);
  const turn = await waitForVoiceTurn(page, since, Math.max(10_000, deadline - Date.now() - 15_000), 3_500);
  await page.waitForTimeout(1500);
  const log = await page.evaluate(() => ({ dg: (window as any).__dg, phases: (window as any).__voiceShim.phases, now: performance.now(), url: location.href }));
  await page.screenshot({ path: path.join(OUT, "end.png") });
  const inMsgs = log.dg.msgs.filter((m: any) => m.dir === "in" && m.text).map((m: any) => JSON.parse(m.text));
  const said = inMsgs.filter((m: any) => m.type === "ConversationText").map((m: any) => `${m.role}: ${m.content}`);
  const fns = inMsgs.filter((m: any) => m.type === "FunctionCallRequest").flatMap((m: any) => m.functions.map((f: any) => f.name));
  const audioBytes = log.dg.msgs.filter((m: any) => m.dir === "in" && m.bin).reduce((s: number, m: any) => s + m.bytes, 0);
  writeFileSync(path.join(OUT, "session.json"), JSON.stringify({ recordedAt: new Date().toISOString(), base: BASE, line: path.basename(LINE), clickedAt, since, spoken, turn, ...log }) + "\n");
  console.log(JSON.stringify({ ok: turn.ok, said, fns, agentAudioSeconds: +(audioBytes / 48000).toFixed(2), wallSeconds: Math.round((Date.now() - t0) / 1000), url: log.url }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
