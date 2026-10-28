// Maya Patel's support journey through Relay's synthetic Northstar portal.
// 01-voice replays a live Deepgram voice session (projects/relay/voice/live-01, recorded with
// capture/relay/voice-live.ts): Kokoro speaks Maya's question, and the agent's spoken answer,
// tools and navigation are the ones the live agent produced.
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildReplay, replayScript } from "../relay/voice-replay.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const VOICE = path.join(root, "projects", "relay", "voice");
const replay = buildReplay(path.join(VOICE, "live-01", "session.json"), path.join(VOICE, "maya-q1-16k.wav"));

export default {
  url: process.env.RELAY_URL || "http://127.0.0.1:5180",
  hideText: ["127.0.0.1", "localhost"],
  start: { x: 1500, y: 760 },
  async reset(context) {
    // The reset needs the signed-in synthetic employee's session cookie.
    await context.request.get(`${this.url}/api/bootstrap`);
    const response = await context.request.post(`${this.url}/api/dev/reset`);
    if (!response.ok()) throw new Error(`Relay reset failed: ${response.status()}`);
    await context.addInitScript({ content: "window.__name = (target) => target;" });
    await context.addInitScript({ content: replayScript(replay.data) });
    // No Deepgram traffic during capture: the token and usage calls are answered locally.
    await context.route("**/api/deepgram-token", (route) => route.fulfill({ status: 200, contentType: "text/plain", body: "replay" }));
    await context.route("**/api/deepgram-usage", (route) => route.fulfill({ status: 204, body: "" }));
  },
  chapters: [
    {
      name: "01-voice",
      async run(rec, page) {
        // Page time at this chapter's first frame: frame f is pageT0 + f / 60 s (the clock only
        // advances one frame at a time), which places the session's audio on the capture.
        const pageT0 = await page.evaluate(() => performance.now());
        const frame0 = rec.frameIndex;
        await rec.hold(900);
        await rec.click(page.locator(".assistant-launcher"), { label: "orb" });
        const phase = () => page.evaluate(() => window.__voiceReplay.phase);
        await rec.waitFor(async () => (await phase()) === "greeting", { label: "greeting", settle: 0, pageTimeout: 60000 });
        await rec.waitFor(async () => (await phase()) === "listening", { label: "listening", settle: 0, pageTimeout: 60000 });
        await rec.waitFor(async () => (await phase()) === "processing", { label: "heard", settle: 0, pageTimeout: 60000 });
        await rec.waitFor(async () => (await phase()) === "speaking", { label: "answer", settle: 0, pageTimeout: 60000 });
        // The answer runs to its end; the session returns to listening once playback drains.
        await rec.waitFor(async () => (await phase()) === "listening", { label: "answer-done", settle: 1200, pageTimeout: 60000 });
        const log = await page.evaluate(() => window.__voiceReplay);
        writeFileSync(path.join(rec.outDir, "01-voice.voice.json"), `${JSON.stringify({ recordedAt: replay.recordedAt, pageT0, frame0, ...log })}\n`);
      },
    },
  ],
};
