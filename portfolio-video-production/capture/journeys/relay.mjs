// Maya Patel's first day in Relay's synthetic Northstar portal (take 3: the v3 script).
// 00-tour walks the workspace's sections. 01-voice replays a live Deepgram voice session
// (projects/relay/voice/live-02, recorded with capture/relay/voice-live.ts): Kokoro speaks Maya's
// question, and the agent's spoken answer, tool calls and navigation are the ones the live agent
// produced. 02-laptop, 03-meeting and 04-pay are typed: the text guide replays live agent turns
// recorded by the evaluation (W2, W3, W5 in evaluation/ui-runner/recordings) through the real
// portal tools, and Maya's confirm clicks are real, so cases, meetings and workflow records are
// written by the app itself.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildReplay, replayScript } from "../relay/voice-replay.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const VOICE = path.join(root, "projects", "relay", "voice");
const RELAY_REPO = process.env.RELAY_REPO || "/Users/neeravch/Documents/ChatGPT/DeepGram Project";
const replay = buildReplay(path.join(VOICE, "live-02", "session.json"), path.join(VOICE, "maya-q2-16k.wav"));
const recording = (id) => JSON.parse(readFileSync(path.join(RELAY_REPO, `evaluation/ui-runner/recordings/${id}.json`), "utf8"));
const W2 = recording("W2");
const W3 = recording("W3");
const W5 = recording("W5");
// The replay matches each turn on the employee's last line; earlier lines are [Portal update] notes.
const lastLine = (text) => text.trim().split("\n").at(-1).trim();
// The recordings keep no step timing, so replayed answers would land in milliseconds. Each turn is
// paced to the median of the live text runs of that request (evaluation/ui-runs, deepgram.agent
// "live"): tool calls before the first visible text, then the answer streams until the turn ends.
const LIVE_MS = [[1969, 19504], [2280, 25113], [2921, 25511], [2142, 9331]]; // [first text, done]
function paced(turn, [first, done]) {
  const tools = turn.steps.filter((step) => step.type === "functions").length;
  const texts = turn.steps.filter((step) => step.type === "text").length;
  let f = 0;
  let t = 0;
  return {
    ...turn,
    steps: turn.steps.map((step) => {
      if (step.type === "functions") return { ...step, at: Math.round((first * 0.85 * ++f) / (tools + 1)) };
      if (step.type === "text") return { ...step, at: Math.round(first + ((done - 400 - first) * t++) / Math.max(1, texts)) };
      return { ...step, at: done };
    }),
  };
}
const TURNS = [W2.turns[3], W3.turns[1], W5.turns[0], W5.turns[1]].map((turn, i) => paced(turn, LIVE_MS[i]));
const [LAPTOP, MEETING, PAYCHECK, DEPOSIT] = TURNS.map((turn) => lastLine(turn.user));
const SECTIONS = ["My Onboarding", "Pay & Benefits", "Learning", "Help & Support"];

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
    await context.addInitScript({ content: `window.__guideReplay = ${JSON.stringify({ scenario: "film-take-3", turns: TURNS })};` });
    // No Deepgram traffic during capture: the token and usage calls are answered locally.
    await context.route("**/api/deepgram-token", (route) => route.fulfill({ status: 200, contentType: "text/plain", body: "replay" }));
    await context.route("**/api/deepgram-usage", (route) => route.fulfill({ status: 204, body: "" }));
  },
  chapters: [
    {
      name: "00-tour",
      async run(rec, page) {
        // The whole workspace, one section at a time, before the guide is used.
        await rec.hold(900);
        rec.mark("home-full", { main: await rec.box(page.locator("main")) });
        for (const name of SECTIONS) {
          const before = await page.evaluate(() => location.hash);
          await rec.click(nav(page, name), { label: `nav-${name}` });
          await rec.waitFor(async () => (await page.evaluate(() => location.hash)) !== before, { label: `page-${name}`, settle: 500, pageTimeout: 15000 });
          rec.mark(`section-${name}`, { main: await rec.box(page.locator("main")) });
          await rec.hold(1500);
        }
        const before = await page.evaluate(() => location.hash);
        await rec.click(nav(page, "Home"), { label: "nav-Home" });
        await rec.waitFor(async () => (await page.evaluate(() => location.hash)) !== before, { label: "page-Home", settle: 600, pageTimeout: 15000 });
        await rec.hold(600);
      },
    },
    {
      name: "01-voice",
      async run(rec, page) {
        // Page time at this chapter's first frame: frame f is pageT0 + f / 60 s (the clock only
        // advances one frame at a time), which places the session's audio on the capture.
        const pageT0 = await page.evaluate(() => performance.now());
        const frame0 = rec.frameIndex;
        await rec.hold(500);
        await rec.click(page.locator(".assistant-launcher"), { label: "orb" });
        const phase = () => page.evaluate(() => window.__voiceReplay.phase);
        await rec.waitFor(async () => (await phase()) === "greeting", { label: "greeting", settle: 0, pageTimeout: 60000 });
        await rec.waitFor(async () => (await phase()) === "listening", { label: "listening", settle: 0, pageTimeout: 60000 });
        await rec.waitFor(async () => (await phase()) === "processing", { label: "heard", settle: 0, pageTimeout: 60000 });
        await rec.waitFor(async () => (await page.evaluate(() => location.hash)).includes("DOC-TAX-1007"), { label: "document-opened", settle: 0, pageTimeout: 60000 });
        await rec.waitFor(async () => (await phase()) === "speaking", { label: "answer", settle: 0, pageTimeout: 60000 });
        // The answer runs to its end; the session returns to listening once playback drains.
        await rec.waitFor(async () => (await phase()) === "listening", { label: "answer-done", settle: 1200, pageTimeout: 60000 });
        const record = page.locator("main [data-record-id='DOC-TAX-1007']").first();
        rec.mark("document", {
          record: await rec.box(record),
          button: await rec.box(page.locator("main").getByRole("button", { name: /Complete withholding forms/i }).first()),
          main: await rec.box(page.locator("main")),
        });
        const log = await page.evaluate(() => window.__voiceReplay);
        writeFileSync(path.join(rec.outDir, "01-voice.voice.json"), `${JSON.stringify({ recordedAt: replay.recordedAt, pageT0, frame0, ...log })}\n`);
        await rec.hold(600);
      },
    },
    {
      name: "02-laptop",
      async run(rec, page) {
        await rec.hold(300);
        // Maya ends the voice session and types the next request.
        const launcher = page.locator(".assistant-launcher");
        if ((await launcher.getAttribute("aria-pressed")) === "true") {
          await rec.click(launcher, { label: "stop-voice" });
          await rec.waitFor(async () => (await launcher.getAttribute("aria-pressed")) !== "true", { label: "voice-stopped", pageTimeout: 10000 });
        }
        await rec.click(page.locator(".assistant-chat-launcher"), { label: "resume" });
        await rec.waitFor(() => page.locator("#assistant-query").isVisible(), { label: "panel", settle: 500 });
        await sendTyped(rec, page, LAPTOP, "laptop");
        await rec.waitFor(() => confirmCard(page).isVisible(), { label: "draft", settle: 0, pageTimeout: 60000 });
        await rec.waitFor(() => idle(page), { label: "draft-ready", settle: 400, pageTimeout: 60000 });
        rec.mark("draft", { card: await rec.box(confirmCard(page)), confirm: await rec.box(confirmCard(page).locator(".assistant-primary")), panel: await rec.box(page.locator(".assistant-panel")) });
        await rec.hold(1400);
        await rec.click(confirmCard(page).locator(".assistant-primary"), { label: "confirm-case" });
        await rec.waitFor(async () => (await succeeded(page).count()) >= 1 && (await succeeded(page).last().isVisible()), { label: "case-created", settle: 0, pageTimeout: 30000 });
        await rec.hold(900);
        rec.mark("case-created", { outcome: await rec.box(succeeded(page).last()), row: await boxOf(page, "Laptop not charging on dock", { minHeight: 50 }), panel: await rec.box(page.locator(".assistant-panel")) });
        await rec.hold(1800);
      },
    },
    {
      name: "03-meeting",
      async run(rec, page) {
        await rec.hold(300);
        const done = await succeeded(page).count();
        await sendTyped(rec, page, MEETING, "meeting");
        await rec.waitFor(async () => (await confirmCard(page).count()) > 0 && (await confirmCard(page).isVisible()), { label: "meeting-draft", settle: 0, pageTimeout: 60000 });
        await rec.waitFor(() => idle(page), { label: "meeting-ready", settle: 500, pageTimeout: 60000 });
        rec.mark("meeting-draft", { card: await rec.box(confirmCard(page)), confirm: await rec.box(confirmCard(page).locator(".assistant-primary")), panel: await rec.box(page.locator(".assistant-panel")), main: await rec.box(page.locator("main")) });
        await rec.hold(1400);
        await rec.click(confirmCard(page).locator(".assistant-primary"), { label: "confirm-meeting" });
        await rec.waitFor(async () => (await succeeded(page).count()) > done, { label: "meeting-booked", settle: 0, pageTimeout: 30000 });
        await rec.hold(900);
        rec.mark("meeting-booked", { outcome: await rec.box(succeeded(page).last()), main: await rec.box(page.locator("main")), panel: await rec.box(page.locator(".assistant-panel")) });
        await rec.hold(1800);
        // Maya closes the calendar so the next request starts from the portal.
        const close = page.locator(".meeting-calendar__close");
        if (await close.isVisible()) {
          await rec.click(close, { label: "close-calendar" });
          await rec.waitFor(async () => !(await page.locator(".meeting-calendar").isVisible()), { label: "calendar-closed", settle: 400, pageTimeout: 10000 });
        }
      },
    },
    {
      name: "04-pay",
      async run(rec, page) {
        await rec.hold(300);
        await sendTyped(rec, page, PAYCHECK, "paycheck");
        await rec.waitFor(async () => !(await idle(page)), { label: "paycheck-thinking", settle: 0, pageTimeout: 15000 });
        await rec.waitFor(() => idle(page), { label: "paycheck-answer", settle: 1600, pageTimeout: 60000 });
        rec.mark("paycheck-answer", { panel: await rec.box(page.locator(".assistant-panel")) });
        const before = await page.evaluate(() => location.hash);
        await sendTyped(rec, page, DEPOSIT, "deposit");
        await rec.waitFor(async () => (await page.evaluate(() => location.hash)) !== before, { label: "deposit-opened", settle: 0, pageTimeout: 60000 });
        await rec.waitFor(() => idle(page), { label: "deposit-done", settle: 900, pageTimeout: 60000 });
        rec.mark("deposit", { main: await rec.box(page.locator("main")), panel: await rec.box(page.locator(".assistant-panel")), hash: await page.evaluate(() => location.hash) });
        await rec.hold(1800);
      },
    },
    {
      name: "05-operations",
      async run(rec, page) {
        await rec.hold(300);
        // After guided navigation the guide is already a compact bar; only an open panel is closed.
        const closePanel = page.locator(".assistant-panel").getByRole("button", { name: "Close conversation" });
        if (await closePanel.isVisible()) {
          await rec.click(closePanel, { label: "close-panel" });
          await rec.hold(400);
        }
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
      name: "06-evaluation",
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
