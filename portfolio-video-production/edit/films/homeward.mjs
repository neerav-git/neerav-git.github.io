// Homeward: Alex Morgan's recovery journey, edited to the narration.
// Times are seconds; event names are the labels logged by capture/journeys/homeward.mjs.
import { f, FPS, captureShot, event, LAYOUT } from "../planner.mjs";

export const meta = {
  slug: "homeward",
  take: 5,
  palette: { accent: "#2563eb", accent2: "#f6b26b", deep: "#070d1c", ink: "#ffffff", muted: "rgba(255,255,255,0.72)", warn: "#f5a524", ok: "#16a34a" },
  tagline: "Source-linked recovery planning after discharge",
  impact: "Every recovery step traceable to its source, with a person approving each action.",
  link: "neerav-git.github.io/projects/homeward",
};

// Frames covered by [start, start + length), so adjacent scenes tile exactly.
const span = (start, length) => f(start + length) - f(start);
const centre = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

export function build({ journey, say, video, terminal }) {
  const ch = journey.chapters;
  const ev = (c, action, label, n) => event(ch[c], action, label, n);
  const scenes = [];
  let t = 0; // output cursor (seconds)

  const push = (scene) => {
    scenes.push(scene);
    return scene;
  };
  // Adds a capture shot that starts at `start` seconds. pins: [[sourceFrame, secondsFromShotStart], ...]
  const shot = ({ id, chapter, start, srcIn, srcOut, pins = [], length, keys = [], overlays = [], reveals = [], init, tiltIn, inT, outT }) => {
    const n = span(start, length);
    const anchors = [[0, srcIn], ...pins.map(([src, s]) => [f(s), src]).filter(([o]) => o > 0 && o < n), [n, srcOut]];
    const s = captureShot({
      id,
      chapter: ch[chapter],
      video: video(chapter),
      anchors,
      init,
      keys: keys.map((k) => ({ ...k, frame: f(k.at), dur: f(k.dur ?? 0.75) })),
      overlays: overlays.map((o) => ({ ...o, from: f(o.from), to: f(o.to) })),
      reveals: reveals.map((r) => ({ ...r, frame: f(r.at), dur: r.dur ?? 20 })),
      extra: { tiltIn },
    });
    // Reveal frames are given as source frames; convert to output.
    s.reveals = s.reveals.map((r) => ({ ...r, frame: r.atSource !== undefined ? s.outFrame(r.atSource) : r.frame }));
    return push({ ...s, from: f(start), in: inT, out: outT });
  };
  // Action ↔ narration pairs, measured by QA (must land within ±150 ms).
  const syncs = [];
  const sync = (label, scene, srcFrame, wordAt, word) => syncs.push({ label, word: wordAt, said: word, event: (scene.from + scene.outFrame(srcFrame)) / FPS });

  // ---------- 1. Cold open: a cited answer opens its exact source passage ----------
  {
    const c = ev("03-ask", "click", "citation");
    const o = ev("03-ask", "wait-end", "citation-dialog");
    const m = ev("03-ask", "mark", "citation-open");
    const srcIn = c.frame - f(0.95);
    const srcOut = o.frame + f(2.45);
    const length = (srcOut - srcIn) / FPS;
    const open = (o.frame - srcIn) / FPS;
    shot({
      id: "cold", chapter: "03-ask", start: 0, srcIn, srcOut, length,
      keys: [
        { at: 0, z: 1.9, focus: { x: c.x - 40, y: c.y - 60 }, dur: 0 },
        { at: 0.05, z: 1.75, focus: { x: c.x - 20, y: c.y - 40 }, dur: open - 0.12 },
        { at: open - 0.02, z: 1.42, focus: centre(m.passage), dur: 0.6 },
      ],
      reveals: [{ atSource: o.frame, before: o.frame - 1, x: c.x, y: c.y, dur: 22 }],
      overlays: [{ type: "callout", from: open + 0.4, to: length + 1, box: m.passage, label: "The exact source passage", side: "top", pad: 12 }],
      outT: { type: "blurDissolve", dur: 26 },
    });
    t = length;
  }

  // ---------- 2. Title sting ----------
  const stingStart = t - 26 / FPS;
  push({ id: "sting", kind: "sting", from: f(stingStart), duration: 114, tagline: meta.tagline, in: { type: "blurDissolve", dur: 26 }, out: { type: "wipe", dur: 24 } });
  t = stingStart + 114 / FPS;

  // ---------- 3. The problem: the real seeded discharge note ----------
  const docStart = t - 24 / FPS;
  const s0 = say(0, docStart + 0.35);
  const docLen = s0.end + 0.4 - docStart;
  push({
    id: "problem", kind: "document", from: f(docStart), duration: span(docStart, docLen),
    in: { type: "wipe", dur: 24 }, out: { type: "zoomThrough", dur: 28, origin: { x: 960, y: 560 } },
    props: {
      heading: "Discharge summary",
      meta: "Alex Morgan · fictional record",
      sections: [
        { title: "Follow-up appointment", text: "Arrange a follow-up visit with Dr. Maya Chen within seven days of discharge. Call the clinic if you need help arranging the visit." },
        { title: "Paperwork", text: "Bring your discharge summary and current medication list to the follow-up visit." },
        { title: "Recovery check-in", text: "Complete the recovery check-in on September 21, 2026. Record any questions you want to discuss with your care team." },
        { title: "Instructions to clarify", text: "The discharge note mentions a repeat laboratory test, but does not specify the test or a date. Contact the discharge team for clarification before arranging it." },
      ],
      focus: 3,
      focusAt: f(s0.word("unclear") - docStart - 0.1),
      // Reading the note while the narrator sets the scene.
      scan: [
        { index: 0, at: f(s0.word("instructions") - docStart) },
        { index: 1, at: f(s0.word("patients") - docStart) },
        { index: 2, at: f(s0.word("exhausted") - docStart + 0.25) },
      ],
      marks: [{ text: "does not specify the test or a date", at: f(s0.word("line") - docStart) }],
      chips: [
        { text: "No test named", at: f(s0.word("stall") - docStart) },
        { text: "No date given", at: f(s0.word("stall") - docStart + 0.25) },
      ],
    },
  });
  t = docStart + docLen;

  // ---------- 4. The journey ----------
  const journeyStart = t - 28 / FPS;
  const steps = [];

  // 4a. Overview
  let prev;
  {
    const c = ch["01-overview"];
    const hero = ev("01-overview", "move-start", "next-task");
    const follow = ev("01-overview", "move-start", "follow-up-task");
    const s1 = say(1, journeyStart + 1.2);
    const length = s1.end + 0.3 - journeyStart;
    steps.push({ label: "Plan", from: f(journeyStart) });
    prev = shot({
      id: "overview", chapter: "01-overview", start: journeyStart, srcIn: 0, srcOut: c.frames - 1, length, tiltIn: 75,
      inT: { type: "zoomThrough", dur: 28, origin: { x: 960, y: 560 } },
      keys: [
        { at: 1.35, z: 1.3, focus: centre(hero.box), dur: 1.1 },
        { at: s1.word("plan") - journeyStart, z: 1.34, focus: { x: centre(follow.box).x + 120, y: centre(follow.box).y - 40 }, dur: 1.0 },
      ],
      overlays: [{ type: "lowerThird", from: 1.0, to: length - 0.1, title: "Recovery plan", detail: "Built from the saved discharge record" }],
    });
    t = journeyStart + length;
  }

  // 4b. View source
  {
    const start = t;
    const c = ch["02-source"];
    const click = ev("02-source", "click", "view-source");
    const hover = ev("02-source", "hover", "view-source");
    const open = ev("02-source", "wait-end", "source-dialog");
    const m = ev("02-source", "mark", "source-open");
    const close = ev("02-source", "click", "close");
    const s2 = say(2, start + 0.12);
    const length = s2.end + 0.75 - start;
    steps.push({ label: "Source", from: f(start) });
    const opens = s2.word("opens") - start;
    const s = shot({
      id: "source", chapter: "02-source", start, srcIn: 0, srcOut: c.frames - 1, length, init: prev.endCam,
      pins: [[click.frame, opens], [close.frame, length - 0.42]],
      keys: [
        { at: Math.max(0.05, opens - 0.85), z: 1.7, focus: centre(hover.box), dur: 0.7 },
        { at: opens + 0.03, z: 1.4, focus: centre(m.passage), dur: 0.6 },
        { at: length - 0.75, z: 1.0, focus: LAYOUT.rest, dur: 0.7 },
      ],
      reveals: [{ atSource: open.frame, before: open.frame - 1, x: click.x, y: click.y, dur: 20 }],
      overlays: [
        { type: "callout", from: opens + 0.45, to: length - 0.55, box: m.passage, label: "The sentence behind the task", side: "top", pad: 12 },
        { type: "lowerThird", from: 0.2, to: length - 0.2, title: "View source", detail: "Every step opens its original passage" },
      ],
    });
    sync("View source click", s, click.frame, s2.word("opens") , "opens");
    prev = s;
    t = start + length;
  }

  // 4c. Ask: source search answers with a citation
  {
    const start = t;
    const composer = ev("03-ask", "hover", "composer");
    const typeStart = ev("03-ask", "type-start", "question");
    const send = ev("03-ask", "click", "send");
    const answer = ev("03-ask", "wait-end", "answer");
    const m = ev("03-ask", "mark", "answer");
    const s3 = say(3, start + 0.6);
    const length = s3.end + 0.55 - start;
    steps.push({ label: "Ask", from: f(start) });
    const bring = s3.word("bring") - start;
    const answers = s3.word("answers") - start;
    prev = shot({
      id: "ask", chapter: "03-ask", start, srcIn: 0, srcOut: answer.frame + f(1.1), length, init: prev.endCam,
      pins: [[typeStart.frame, 0.85], [send.frame, bring + 0.05], [answer.frame, answers]],
      keys: [
        { at: 0.1, z: 1.7, focus: { x: centre(composer.box).x - 60, y: centre(composer.box).y - 120 }, dur: 0.75 },
        { at: bring + 0.35, z: 1.45, focus: centre(m.box), dur: 0.8 },
      ],
      overlays: [
        { type: "callout", from: answers + 0.25, to: length + 0.5, box: m.box, label: "Cited passage", side: "top", pad: 10 },
        { type: "lowerThird", from: 0.3, to: length - 0.1, title: "Source search", detail: "Exact excerpts from the saved record" },
      ],
      outT: { type: "whip", dur: 24, dir: "left" },
    });
    sync("Send question", prev, send.frame, s3.word("bring"), "bring");
    sync("Cited answer appears", prev, answer.frame, s3.word("answers"), "answers");
    t = start + length;
  }

  // 4d. Help: the unclear instruction goes to the care team
  {
    const start = t - 24 / FPS;
    const c = ch["04-help"];
    const scrollEnd = ev("04-help", "scroll-end", "lab-task");
    const labMove = ev("04-help", "move-start", "lab-task");
    const needHelp = ev("04-help", "click", "need-help");
    const flagged = ev("04-help", "mark", "help-requested");
    const careTeam = ev("04-help", "click", "care-team");
    const reviewOpen = ev("04-help", "mark", "review-open");
    const responseHover = ev("04-help", "hover", "response");
    const typeStart = ev("04-help", "type-start", "response");
    const typeEnd = ev("04-help", "type-end", "response");
    const saved = ev("04-help", "mark", "response-saved");
    const close = ev("04-help", "click", "close");
    const s4 = say(4, start + 0.6);
    const s5 = say(5, s4.end + 0.9);
    const length = s5.end + 0.55 - start;
    steps.push({ label: "Help", from: f(start + 0.2) });
    const asks = s4.word("asks") - start;
    const ct = s4.end + 0.05 - start;
    const replies = s5.word("replies") - start;
    const stays = s5.word("stays") - start;
    prev = shot({
      id: "help", chapter: "04-help", start, srcIn: 0, srcOut: close.frame + f(0.4), length,
      inT: { type: "whip", dur: 24, dir: "left" },
      pins: [
        [scrollEnd.frame, 1.0],
        [needHelp.frame, asks + 0.05],
        [careTeam.frame, ct],
        [typeStart.frame, replies - 0.25],
        [typeEnd.frame, stays - 0.95],
        [saved.frame, stays - 0.05],
        [close.frame, length - 0.4],
      ],
      keys: [
        { at: 1.0, z: 1.5, focus: { x: centre(flagged.box).x, y: centre(flagged.box).y }, dur: 0.8 },
        { at: ct - 0.55, z: 1.0, focus: LAYOUT.rest, dur: 0.6 },
        { at: ct + 0.45, z: 1.3, focus: centre(reviewOpen.box), dur: 0.55 },
        { at: replies - 0.6, z: 1.55, focus: { x: centre(responseHover.box).x, y: centre(responseHover.box).y - 140 }, dur: 0.6 },
        { at: stays - 0.35, z: 1.45, focus: { x: centre(saved.status).x + 200, y: centre(saved.status).y + 80 }, dur: 0.6 },
        { at: length - 0.7, z: 1.0, focus: LAYOUT.rest, dur: 0.6 },
      ],
      overlays: [
        { type: "callout", from: 1.35, to: asks - 0.05, box: labMove.box, label: "No test · no date", side: "top", tone: "warn", pad: 12 },
        { type: "callout", from: asks + 0.25, to: ct - 0.3, box: flagged.box, label: "Help requested", side: "top", tone: "warn", pad: 8, dim: false },
        { type: "callout", from: stays + 0.05, to: length - 0.75, box: saved.status, label: "Still needs clarification", side: "bottom", tone: "warn", pad: 8 },
        { type: "lowerThird", from: 0.5, to: ct - 0.2, title: "Help request", detail: "Uncertainty becomes a visible care-team item" },
        { type: "lowerThird", from: ct + 0.5, to: length - 0.2, title: "Care-team review", detail: "A reply never approves the task" },
      ],
      outT: { type: "wipe", dur: 24 },
    });
    sync("Need help click", prev, needHelp.frame, s4.word("asks"), "asks");
    sync("Response saved", prev, saved.frame, s5.word("stays"), "stays");
    t = start + length;
  }

  // 4e. Approval and safe retry
  {
    // Opens on Alex's plan under a wipe from the care-team page, skipping the menu click.
    const start = t - 24 / FPS;
    const recovery = ev("05-reminder", "wait-end", "recovery");
    const bell = ev("05-reminder", "click", "bell");
    const bellHover = ev("05-reminder", "hover", "bell");
    const dialog = ev("05-reminder", "wait-end", "approval-dialog");
    const proposal = ev("05-reminder", "mark", "proposal");
    const approve = ev("05-reminder", "click", "approve");
    const timeout = ev("05-reminder", "wait-end", "timeout");
    const lost = ev("05-reminder", "mark", "timeout");
    const retry = ev("05-reminder", "click", "retry");
    const receipt = ev("05-reminder", "wait-end", "receipt");
    const rm = ev("05-reminder", "mark", "receipt");
    const close = ev("05-reminder", "click", "close");
    const s6 = say(6, start + 1.0);
    const s7 = say(7, s6.end + 0.45);
    const length = s7.end + 0.6 - start;
    steps.push({ label: "Approve", from: f(start) });
    const waits = s6.word("waits") - start;
    const lostAt = s7.word("lost") - start;
    const retryAt = s7.word("Retry") - start;
    const receiptAt = s7.word("receipt") - start;
    const second = s7.word("second") - start;
    prev = shot({
      id: "reminder", chapter: "05-reminder", start, srcIn: recovery.frame + 4, srcOut: close.frame - f(0.05), length, init: prev.endCam,
      inT: { type: "wipe", dur: 24 },
      pins: [
        [dialog.frame, waits],
        [approve.frame, s6.end + 0.05 - start],
        [timeout.frame, lostAt],
        [retry.frame, retryAt + 0.05],
        [receipt.frame, s7.word("original") - start],
      ],
      keys: [
        { at: Math.max(0.2, waits - 1.0), z: 1.6, focus: centre(bellHover.box), dur: 0.6 },
        { at: waits + 0.02, z: 1.38, focus: centre(proposal.box), dur: 0.6 },
        { at: lostAt - 0.1, z: 1.55, focus: { x: centre(proposal.box).x, y: centre(lost.box).y + 30 }, dur: 0.55 },
        { at: receiptAt - 0.3, z: 1.5, focus: { x: centre(proposal.box).x, y: centre(rm.box).y + 40 }, dur: 0.55 },
      ],
      reveals: [{ atSource: dialog.frame, before: dialog.frame - 1, x: bell.x, y: bell.y, dur: 20 }],
      overlays: [
        { type: "chip", from: waits + 0.4, to: s6.end + 0.05 - start, box: proposal.box, text: "Nothing runs until approved", side: "below" },
        { type: "callout", from: lostAt + 0.15, to: retryAt - 0.05, box: lost.box, label: "Response lost", side: "top", tone: "warn", pad: 8 },
        { type: "callout", from: receiptAt - 0.05, to: length + 0.2, box: rm.receipt, label: "Original receipt returned", side: "bottom", tone: "ok", pad: 10, dim: false },
        { type: "chip", from: second - 0.1, to: length + 0.2, box: rm.box, text: "No second reminder", side: "above", tone: "ok", icon: "✓" },
        { type: "lowerThird", from: 0.3, to: s6.end + 0.1 - start, title: "Approval gate", detail: "Proposals wait for the patient" },
        { type: "lowerThird", from: lostAt, to: length - 0.1, title: "Safe retry", detail: "One saved action, even after a lost response" },
      ],
    });
    sync("Approval dialog opens", prev, dialog.frame, s6.word("waits"), "waits");
    sync("Timeout shown", prev, timeout.frame, s7.word("lost"), "lost");
    sync("Retry safely click", prev, retry.frame, s7.word("Retry"), "Retry");
    sync("Receipt returned", prev, receipt.frame, s7.word("original"), "original");
    t = start + length;
  }

  // 4f. Agent activity
  {
    const start = t;
    const click = ev("06-activity", "click", "agent-activity");
    const timeline = ev("06-activity", "wait-end", "timeline");
    const m = ev("06-activity", "mark", "timeline");
    const scroll = ev("06-activity", "scroll-start", "guardrails");
    const s8 = say(8, start + 0.5);
    const length = s8.end + 1.35 - start;
    steps.push({ label: "Record", from: f(start) });
    const at = s8.word("activity") - start;
    const focus = { x: m.box.x + 330, y: m.box.y + 330 };
    prev = shot({
      id: "activity", chapter: "06-activity", start, srcIn: 0, srcOut: scroll.frame - 2, length, init: prev.endCam,
      pins: [[click.frame, Math.max(0.3, at - 0.1)]],
      keys: [
        { at: at + 0.05, z: 1.4, focus, dur: 0.8 },
        { at: at + 0.9, z: 1.42, focus: { x: focus.x, y: focus.y + 130 }, dur: length - at - 0.9 },
      ],
      overlays: [{ type: "lowerThird", from: at, to: length - 0.1, title: "Agent activity", detail: "Approval, timeout, and retry, in order" }],
      outT: { type: "blurDissolve", dur: 26 },
    });
    sync("Agent activity click", prev, click.frame, s8.word("activity"), "activity");
    t = start + length;
  }
  const journeyEnd = t;

  // ---------- 5. Under the hood ----------
  const cardStart = t - 26 / FPS;
  push({ id: "chapter-hood", kind: "chapter", from: f(cardStart), duration: 68, in: { type: "blurDissolve", dur: 26 }, out: { type: "radial", dur: 24, origin: { x: 960, y: 540 } }, props: { title: "Under the hood", steps: ["Journey", "Under the hood", "Result"], current: 1 } });
  t = cardStart + 68 / FPS;

  // 5a. The four specialists, in the app
  const teamStart = t - 24 / FPS;
  const s9 = say(9, teamStart + 0.3);
  {
    const click = ev("06-activity", "click", "agent-team");
    const m = ev("06-activity", "mark", "agent-team");
    const c = ch["06-activity"];
    const length = s9.word("references") - teamStart + 0.1;
    shot({
      id: "team", chapter: "06-activity", start: teamStart, srcIn: click.frame - f(0.35), srcOut: c.frames - 1, length,
      inT: { type: "radial", dur: 24, origin: { x: 960, y: 540 } },
      keys: [
        { at: 0, z: 1.55, focus: { x: centre(m.box).x, y: centre(m.box).y }, dur: 0 },
        { at: 0.5, z: 1.62, focus: { x: centre(m.box).x, y: centre(m.box).y + 10 }, dur: length - 0.5 },
      ],
      overlays: [{ type: "callout", from: 0.55, to: length + 0.5, box: m.box, label: "Four role-scoped specialists", side: "left", pad: 10 }],
      outT: { type: "zoomThrough", dur: 26, origin: { x: 1100, y: 560 } },
    });
    t = teamStart + length;
  }

  // 5b. Architecture: a request travels through the validated path
  {
    const start = t - 26 / FPS;
    const length = s9.end + 0.55 - start;
    const at = (s) => f(s - start);
    const nodes = [
      { id: "ui", label: "Patient & care team", sub: "React", x: 96, y: 420, w: 330, h: 124, at: 4 },
      { id: "api", label: "Express API", sub: "Owns every write", x: 500, y: 420, w: 330, h: 124, at: 8 },
      { id: "router", label: "Role router", sub: "One specialist per request", x: 904, y: 420, w: 330, h: 124, at: 12 },
      { id: "coord", label: "Care-plan coordinator", x: 1310, y: 178, w: 514, h: 90, at: 16, lit: [[at(s9.word("specialists") - 0.2), length * FPS]] },
      { id: "sum", label: "Discharge summarizer", x: 1310, y: 290, w: 514, h: 90, at: 18, lit: [[at(s9.word("specialists") - 0.1), length * FPS]] },
      { id: "qs", label: "Questions & sources", x: 1310, y: 402, w: 514, h: 90, at: 20, lit: [[at(s9.word("specialists")), length * FPS]] },
      { id: "rem", label: "Reminder assistant", x: 1310, y: 514, w: 514, h: 90, at: 22, lit: [[at(s9.word("specialists") + 0.1), length * FPS]] },
      { id: "valid", label: "Server validation", sub: "Before anything is saved", x: 500, y: 690, w: 620, h: 124, at: 26, tone: "ok", lit: [[at(s9.word("validates") - 0.15), length * FPS]] },
      { id: "db", label: "SQLite", sub: "Records · audit · receipts", x: 1310, y: 690, w: 514, h: 124, at: 30, lit: [[at(s9.word("approval") + 0.2), length * FPS]] },
    ];
    const edges = [
      { from: "ui", to: "api", at: 10 },
      { from: "api", to: "router", at: 14 },
      { from: "router", to: "coord", at: 18, via: [[1272, 449], [1272, 223]] },
      { from: "router", to: "sum", at: 19, via: [[1272, 449], [1272, 335]] },
      { from: "router", to: "qs", at: 20, via: [[1272, 449], [1272, 447]] },
      { from: "router", to: "rem", at: 21, via: [[1272, 482], [1272, 559]] },
      { from: "rem", to: "valid", at: 28, via: [[1567, 640], [810, 640]] },
      { from: "valid", to: "db", at: 32 },
    ];
    push({
      id: "diagram", kind: "diagram", from: f(start), duration: span(start, length),
      in: { type: "zoomThrough", dur: 26, origin: { x: 1100, y: 560 } }, out: { type: "whip", dur: 24, dir: "up" },
      props: {
        title: "Under the hood",
        nodes, edges,
        packets: [
          { route: ["ui", "api", "router", "rem"], from: at(s9.word("select") - 0.1), dur: f(1.0) },
          { route: ["rem", "valid", "db"], from: at(s9.word("validates") - 0.25), dur: f(s9.word("approval") - s9.word("validates") + 0.5) },
        ],
        checks: [
          { node: "valid", text: "Patient", at: at(s9.word("patient")) },
          { node: "valid", text: "Record version", at: at(s9.word("version")) },
          { node: "valid", text: "Approval", at: at(s9.word("approval")) },
        ],
      },
    });
    t = start + length;
  }

  // 5c. The guardrail suite, run live
  {
    const start = t - 24 / FPS;
    const s10 = say(10, start + 0.75);
    const length = s10.end + 0.5 - start;
    const at = (s) => f(s - start);
    // `npm run eval` plays at its recorded speed, timed so the summary lands on "pass".
    const lines = terminal.eval.lines;
    const command = "npm run eval";
    const msToFrames = (ms) => Math.round((ms / 1000) * FPS);
    const entered = at(s10.word("pass")) - msToFrames(lines[lines.length - 1].ms);
    const typeFrom = Math.round(entered - 8 - command.length * 1.6);
    // The recorded `npm test` run's two summaries (node:test backend, then the interface
    // journeys), shown as they print, on "59" and "journeys".
    const test = terminal.test.lines.map((l) => l.text);
    const summary = (count) => {
      const i = test.indexOf(`ℹ tests ${count}`);
      return test.slice(i, i + 4);
    };
    const testCommand = "npm test";
    const testType = at(s10.word("alongside")) - 6;
    const testEntered = testType + 8 + testCommand.length * 1.6;
    push({
      id: "terminal", kind: "terminal", from: f(start), duration: span(start, length),
      in: { type: "whip", dur: 24, dir: "up" }, out: { type: "blurDissolve", dur: 26 },
      props: {
        title: "homeward — zsh",
        prompt: "~/homeward $",
        command,
        typeFrom,
        lines: lines.map((l) => ({ text: l.text, at: msToFrames(l.ms) })),
        test: {
          title: "npm test",
          prompt: "$",
          command: testCommand,
          typeFrom: testType,
          lines: [
            ...summary(59).map((text) => ({ text, at: Math.max(2, Math.round(at(s10.word("59")) - testEntered)) })),
            { text: "", at: Math.max(3, Math.round(at(s10.word("journeys")) - 6 - testEntered)) },
            ...summary(4).map((text) => ({ text, at: Math.max(4, Math.round(at(s10.word("journeys")) - 6 - testEntered)) })),
          ],
        },
      },
    });
    t = start + length;
  }

  // ---------- 6. Result ----------
  {
    const start = t - 26 / FPS;
    const c = ch["07-outro"];
    const m = ev("07-outro", "mark", "tasks");
    const scrollStart = ev("07-outro", "scroll-start", "tasks");
    const s11 = say(11, start + 0.5);
    const length = s11.end + 0.5 - start;
    const unc = s11.word("Uncertainty") - start;
    const src = s11.word("source") - start;
    shot({
      id: "outro", chapter: "07-outro", start, srcIn: scrollStart.frame - f(0.3), srcOut: c.frames - 1, length,
      inT: { type: "blurDissolve", dur: 26 },
      keys: [
        { at: 0, z: 1.05, focus: { x: 900, y: 560 }, dur: 0 },
        { at: 0.1, z: 1.22, focus: { x: centre(m.box).x - 40, y: centre(m.box).y - 30 }, dur: length - 0.1 },
      ],
      overlays: [
        { type: "callout", from: unc, to: length + 0.5, box: m.help, label: "Question still open", side: "right", tone: "warn", pad: 8, dim: false },
        { type: "callout", from: src - 0.15, to: length + 0.5, box: m.source, label: "Linked to its source", side: "right", pad: 8, dim: false },
        { type: "callout", from: unc + 0.5, to: length + 0.5, box: m.reminder, label: "Reminder saved once", side: "right", tone: "ok", pad: 8, dim: false },
      ],
      outT: { type: "blurDissolve", dur: 26 },
    });
    t = start + length;
  }

  // ---------- 7. End card ----------
  const endStart = t - 26 / FPS;
  push({ id: "end", kind: "endcard", from: f(endStart), duration: span(endStart, 3.4), impact: meta.impact, link: meta.link, in: { type: "blurDissolve", dur: 26 } });
  t = endStart + 3.4;

  // Poster: the cited answer with its exact source passage open.
  const posterFrame = ev("03-ask", "mark", "citation-open").frame + f(0.6);
  return {
    poster: { video: video("03-ask"), frame: posterFrame },
    syncs,
    scenes,
    durationInFrames: f(t),
    tracker: { from: f(journeyStart) + 30, to: f(journeyEnd) - 10, steps },
    chapters: [
      { name: "Cold open", at: 0 },
      { name: "Problem", at: docStart },
      { name: "Journey", at: journeyStart },
      { name: "Under the hood", at: cardStart },
      { name: "Result", at: journeyEnd },
    ],
  };
}
