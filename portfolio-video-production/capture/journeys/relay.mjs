// Maya Patel's support journey through Relay's synthetic Northstar portal.
// 01-voice replays a live Deepgram voice session (projects/relay/voice/live-01, recorded with
// capture/relay/voice-live.ts): Kokoro speaks Maya's question, and the agent's spoken answer,
// tools and navigation are the ones the live agent produced.
// 02-reply and 03-laptop are typed: the text guide replays the live agent's recorded W2 turns 3-4
// (evaluation/ui-runner/recordings/W2.json) through the real portal tools, and Maya's confirm
// clicks are real, so the writes, case activity and workflow records all happen in the app.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildReplay, replayScript } from "../relay/voice-replay.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const VOICE = path.join(root, "projects", "relay", "voice");
const RELAY_REPO = process.env.RELAY_REPO || "/Users/neeravch/Documents/ChatGPT/DeepGram Project";
const replay = buildReplay(path.join(VOICE, "live-01", "session.json"), path.join(VOICE, "maya-q1-16k.wav"));
const W2 = JSON.parse(readFileSync(path.join(RELAY_REPO, "evaluation/ui-runner/recordings/W2.json"), "utf8"));
const TYPED = W2.turns.slice(2);
const REPLY = TYPED[0].user;
const LAPTOP = TYPED[1].user.trim().split("\n").at(-1).trim();

const nav = (page, name) => page.locator(".sidebar, nav, aside").getByText(name, { exact: true }).first();
const confirmCard = (page) => page.locator("[data-state='action-confirmation']").last();
const succeeded = (page) => page.locator("[data-state='action-succeeded']");
const idle = (page) => page.evaluate(() => !document.querySelector(".assistant-panel[data-busy]"));

const at = (box, ax = 0.3, ay = 0.5) => ({ x: box.x + box.width * ax, y: box.y + box.height * ay });

// Bounding box of the smallest ancestor of an exact text match that is at least `minHeight` tall.
async function boxOf(page, text, { within = "main", minHeight = 60 } = {}) {
  const box = await page.evaluate(([text, within, minHeight]) => {
    const scope = document.querySelector(within) ?? document.body;
    const hit = [...scope.querySelectorAll("*")].find((el) => el.children.length === 0 && el.textContent.trim().toLowerCase() === text.toLowerCase());
    let el = hit;
    while (el && el.getBoundingClientRect().height < minHeight) el = el.parentElement;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }, [text, within, minHeight]);
  if (!box) throw new Error(`No element with text "${text}"`);
  return box;
}

async function sendTyped(rec, page, text, label) {
  await rec.click(page.locator("#assistant-query"), { label: "composer", anchor: [0.3, 0.5] });
  await rec.hold(200);
  await rec.type(text, { label, min: 26, max: 58 });
  await rec.hold(250);
  await rec.press("Enter", { label: `send-${label}` });
}

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
    await context.addInitScript({ content: `window.__guideReplay = ${JSON.stringify({ scenario: "W2", recorded_at: W2.recorded_at, turns: TYPED })};` });
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
        await rec.hold(700);
        // Maya's day on the home page: account access is blocked.
        rec.mark("home", { blocked: await boxOf(page, "Corporate account access") });
        await rec.moveTo(page.locator("main").getByText("Corporate account access", { exact: true }), { label: "blocked", anchor: [0.3, 0.5] });
        await rec.hold(1300);
        await rec.click(page.locator(".assistant-launcher"), { label: "orb" });
        const phase = () => page.evaluate(() => window.__voiceReplay.phase);
        await rec.waitFor(async () => (await phase()) === "greeting", { label: "greeting", settle: 0, pageTimeout: 60000 });
        await rec.waitFor(async () => (await phase()) === "listening", { label: "listening", settle: 0, pageTimeout: 60000 });
        await rec.waitFor(async () => (await phase()) === "processing", { label: "heard", settle: 0, pageTimeout: 60000 });
        await rec.waitFor(async () => (await phase()) === "speaking", { label: "answer", settle: 0, pageTimeout: 60000 });
        // The answer runs to its end; the session returns to listening once playback drains.
        await rec.waitFor(async () => (await phase()) === "listening", { label: "answer-done", settle: 1200, pageTimeout: 60000 });
        rec.mark("case", { reply: await rec.box(page.locator("main").getByText("Reply to IT Support", { exact: true })), header: await boxOf(page, "Unable to sign in to corporate account", { within: "main [data-record-id='IT-2047'], main", minHeight: 40 }) });
        const log = await page.evaluate(() => window.__voiceReplay);
        writeFileSync(path.join(rec.outDir, "01-voice.voice.json"), `${JSON.stringify({ recordedAt: replay.recordedAt, pageT0, frame0, ...log })}\n`);
      },
    },
    {
      name: "02-reply",
      async run(rec, page) {
        await rec.hold(300);
        // Test takes that skip 01-voice (--only) start from the case the voice agent opened.
        if (!(await page.evaluate(() => location.hash)).includes("IT-2047")) {
          rec.mark("setup-without-voice");
          await page.evaluate(() => { location.hash = "#/help?record=IT-2047"; });
          await rec.hold(800);
        }
        // Maya ends the voice session and continues in the chat.
        const launcher = page.locator(".assistant-launcher");
        if ((await launcher.getAttribute("aria-pressed")) === "true") {
          await rec.click(launcher, { label: "stop-voice" });
          await rec.waitFor(async () => (await launcher.getAttribute("aria-pressed")) !== "true", { label: "voice-stopped", pageTimeout: 10000 });
        }
        await rec.click(page.locator(".assistant-chat-launcher"), { label: "resume" });
        await rec.waitFor(() => page.locator("#assistant-query").isVisible(), { label: "panel", settle: 500 });
        await sendTyped(rec, page, REPLY, "reply");
        await rec.waitFor(() => confirmCard(page).isVisible(), { label: "proposal", settle: 0, pageTimeout: 60000 });
        await rec.waitFor(() => idle(page), { label: "proposal-ready", settle: 400, pageTimeout: 60000 });
        rec.mark("proposal", { card: await rec.box(confirmCard(page)), confirm: await rec.box(confirmCard(page).locator(".assistant-primary")), panel: await rec.box(page.locator(".assistant-panel")) });
        await rec.hold(1400);
        await rec.click(confirmCard(page).locator(".assistant-primary"), { label: "confirm-reply" });
        await rec.waitFor(async () => (await succeeded(page).count()) >= 1 && (await succeeded(page).first().isVisible()), { label: "reply-added", settle: 0, pageTimeout: 30000 });
        await rec.hold(900);
        const entry = page.locator("main").getByText(REPLY.split(". ").slice(1).join(". ").trim(), { exact: false }).last();
        rec.mark("reply-added", { outcome: await rec.box(succeeded(page).last()), entry: await boxOf(page, (await entry.textContent()).trim(), { minHeight: 40 }), status: await rec.box(page.locator("main").getByText("In Progress", { exact: true }).last()), panel: await rec.box(page.locator(".assistant-panel")) });
        await rec.hold(2200);
      },
    },
    {
      name: "03-laptop",
      async run(rec, page) {
        await rec.hold(300);
        await sendTyped(rec, page, LAPTOP, "laptop");
        await rec.waitFor(() => confirmCard(page).isVisible(), { label: "draft", settle: 0, pageTimeout: 60000 });
        await rec.waitFor(() => idle(page), { label: "draft-ready", settle: 400, pageTimeout: 60000 });
        rec.mark("draft", { card: await rec.box(confirmCard(page)), confirm: await rec.box(confirmCard(page).locator(".assistant-primary")), row: await boxOf(page, "Laptop not charging on dock", { minHeight: 50 }), panel: await rec.box(page.locator(".assistant-panel")) });
        await rec.hold(1400);
        await rec.click(confirmCard(page).locator(".assistant-primary"), { label: "confirm-case" });
        await rec.waitFor(async () => (await succeeded(page).count()) >= 2, { label: "case-created", settle: 0, pageTimeout: 30000 });
        await rec.hold(900);
        rec.mark("case-created", { outcome: await rec.box(succeeded(page).last()), row: await boxOf(page, "Laptop not charging on dock", { minHeight: 50 }), panel: await rec.box(page.locator(".assistant-panel")) });
        await rec.hold(2200);
      },
    },
    {
      name: "04-operations",
      async run(rec, page) {
        await rec.hold(300);
        await rec.click(page.locator(".assistant-panel").getByRole("button", { name: "Close conversation" }), { label: "close-panel" });
        await rec.hold(400);
        await rec.click(nav(page, "IT Operations"), { label: "operations" });
        await rec.waitFor(() => page.getByRole("heading", { name: "Onboarding access operations" }).isVisible(), { label: "ops", settle: 600 });
        rec.mark("ops", {
          stages: await boxOf(page, "Employee request", { minHeight: 90 }),
          confirmation: await boxOf(page, "Confirmation", { minHeight: 90 }),
          queue: await boxOf(page, "IT queue", { minHeight: 90 }),
          retry: await rec.box(page.getByRole("button", { name: "Retry request safely" })),
          employee: await boxOf(page, "Maya Patel · Employee", { minHeight: 70 }),
        });
        await rec.moveTo(at((await boxOf(page, "Confirmation", { minHeight: 90 })), 0.45, 0.4), { label: "stages" });
        await rec.hold(1300);
        const chronology = page.locator("main").getByText("Workflow chronology", { exact: true });
        const top = (await rec.box(chronology)).y;
        await rec.scroll(null, top - 150, { duration: 1100, label: "chronology" });
        await rec.hold(300);
        const row = (text) => boxOf(page, text, { minHeight: 36 });
        rec.mark("chronology", {
          list: await boxOf(page, "Workflow chronology", { minHeight: 400 }),
          inspected: await row("State Inspected"),
          requested: await row("Confirmation Requested"),
          received: await row("Confirmation Received"),
          created: await row("Case Created"),
          verified: await row("State Change Verified"),
        });
        await rec.moveTo(at(await row("State Change Verified"), 0.25), { label: "verified" });
        await rec.hold(2600);
        await rec.scroll(null, -(top - 150), { duration: 900, label: "top" });
        await rec.hold(200);
      },
    },
    {
      name: "05-evaluation",
      async run(rec, page) {
        await rec.hold(200);
        await rec.click(nav(page, "Agent evaluation"), { label: "evaluation" });
        await rec.waitFor(() => page.getByRole("heading", { name: "How Relay Guide performs" }).isVisible(), { label: "eval", settle: 600 });
        const card = (text) => boxOf(page, text, { minHeight: 100 });
        const cards = {
          task: await card("Task success rate"),
          heldOut: await card("Held-out generalization"),
          voice: await card("Voice task success"),
          tools: await card("Tool-call accuracy"),
          safety: await card("Safety red-team"),
          quality: await card("Answer quality"),
          spoken: await card("Spoken end-to-end"),
          faithful: await card("Faithfulness (groundedness)"),
        };
        rec.mark("eval", cards);
        for (const [key, ms] of [["task", 1500], ["heldOut", 1300], ["voice", 1300], ["safety", 2200]]) {
          await rec.moveTo(at(cards[key], 0.32, 0.38), { label: key });
          await rec.hold(ms);
        }
      },
    },
  ],
};
