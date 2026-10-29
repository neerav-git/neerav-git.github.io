// Relay v3: the need, the idea, Maya's live voice request, three typed requests, the intelligence
// layer and its security boundary, the operations record, and the measured results.
// Times are seconds; event names are the labels logged by capture/journeys/relay.mjs.
// The voice beats play recorded live Deepgram exchanges (projects/relay/voice/live-02, greeting
// included, and live-03 for the meeting) with the narrator silent; long agent waits in the typed
// requests are cut and labelled on screen.
import { readFileSync } from "node:fs";
import path from "node:path";
import { f, FPS, captureShot, event, loadNarration } from "../planner.mjs";

export const meta = {
  slug: "relay",
  take: 4,
  palette: { accent: "#3ccfba", accent2: "#3b7be0", deep: "#06141f", ink: "#ffffff", muted: "rgba(255,255,255,0.72)", warn: "#f5a524", ok: "#34c38f" },
  tagline: "One workspace and one voice agent for every employee service",
  impact: "Say it once, and Relay finds the record, the owner and the next step.",
  link: "neerav-git.github.io/projects/relay",
  runtime: [120, 200], // v3 script approved at about 2:30; the greeting and the spoken meeting add about 30 s
};

// Frames covered by [start, start + length), so adjacent scenes tile exactly.
const span = (start, length) => f(start + length) - f(start);
const centre = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

// The typed requests, word for word from the evaluation recordings the replay uses (W5).
const ASKED = {
  paycheck: "What's blocking my first paycheck?",
  deposit: "Take me to direct deposit",
};
// The live answer (live-02 ConversationText), split into caption cues.
const ANSWER = [
  ["Relay: Your next highest priority task is to", "complete your federal and California", "withholding forms."],
  ["These are due by the end of today."],
  ["Click “Complete withholding forms”", "on the document just highlighted."],
];

export function build({ journey, say, video, terminal }) {
  const ch = journey.chapters;
  const ev = (c, action, label, n) => event(ch[c], action, label, n);
  // The 01-voice "document" mark stored a box under `action` in takes before the rename to `button`.
  const markByLabel = (c, label) => ch[c].events.find((e) => e.label === label && (e.action === "mark" || typeof e.action === "object"));
  const root = path.resolve(journey.dir, "../../../../..");
  const narration = loadNarration(root, "relay").sentences;
  const offset = (i, word) => {
    const w = narration[i].words.find((x) => x.word.toLowerCase().replace(/[^a-z0-9]/g, "") === word);
    if (!w) throw new Error(`Sentence ${i} has no word "${word}"`);
    return w.start - narration[i].start;
  };

  const scenes = [];
  let t = 0;
  const push = (scene) => {
    scenes.push(scene);
    return scene;
  };
  // A capture shot starting at `start` seconds. pins: [[sourceFrame, secondsFromShotStart], ...]
  const shot = ({ id, chapter, start, srcIn, srcOut, pins = [], length, keys = [], overlays = [], tiltIn, inT, outT }) => {
    const n = span(start, length);
    const anchors = [[0, srcIn], ...pins.map(([src, s]) => [f(s), src]).filter(([o]) => o > 0 && o < n), [n, srcOut]];
    const s = captureShot({
      id,
      chapter: ch[chapter],
      video: video(chapter),
      anchors,
      keys: keys.map((k) => ({ ...k, frame: f(k.at), dur: f(k.dur ?? 0.75) })),
      overlays: overlays.map((o) => ({ ...o, from: f(o.from), to: f(o.to) })),
      extra: { tiltIn },
    });
    return push({ ...s, from: f(start), in: inT, out: outT });
  };
  // Overlay timed by source frames, added after a shot is built (frames relative to the shot).
  const overlayAt = (scene, o, srcFrom, srcTo) => scene.overlays.push({ ...o, from: scene.outFrame(srcFrom), to: scene.outFrame(srcTo) });
  const syncs = [];
  const sync = (label, scene, srcFrame, wordAt, word) => syncs.push({ label, word: wordAt, said: word, event: (scene.from + scene.outFrame(srcFrame)) / FPS });
  const steps = [];
  const audio = [];
  const extraCaptions = [];
  // Caption cues split in proportion to their length (52 characters at most).
  const cueParts = (from, to, parts, place) => {
    const total = parts.join(" ").length;
    let cursor = from;
    parts.forEach((text) => {
      const d = ((to - from) * text.length) / total;
      extraCaptions.push({ start: place(cursor), end: place(cursor + d), text });
      cursor += d;
    });
  };

  // ---------- 1. The need: one portal per department, as a schematic ----------
  {
    const s0 = say(0, 0.7);
    const s1 = say(1, s0.end + 0.4);
    const length = s1.end + 0.7;
    const times = {
      hr: f(s0.word("hr")), it: f(s0.word("it")), payroll: f(s0.word("payroll")), learning: f(s0.word("learning")),
      forms: f(s0.word("forms")), owners: f(s0.word("owners")),
      hire: f(s1.start), system: f(s1.word("system")), form: f(s1.word("form")), person: f(s1.word("person")),
      support: f(s1.word("support")), incomplete: f(s1.word("incomplete")), wrong: f(s1.word("wrong")),
    };
    push({ id: "problem", kind: "problem", from: 0, duration: span(0, length), out: { type: "blurDissolve", dur: 26 }, props: { times } });
    t = length;
  }

  // ---------- 2. Title sting ----------
  const stingStart = t - 26 / FPS;
  push({ id: "sting", kind: "sting", from: f(stingStart), duration: 114, tagline: meta.tagline, in: { type: "blurDissolve", dur: 26 }, out: { type: "wipe", dur: 24 } });
  t = stingStart + 114 / FPS;

  // ---------- 3. Relay: every department in one workspace, then the voice agent and Maya's tap ----------
  const voiceLog = JSON.parse(readFileSync(path.join(journey.dir, "01-voice.voice.json"), "utf8"));
  const cues = JSON.parse(readFileSync(path.join(journey.dir, "01-voice.audio.json"), "utf8"));
  const voiceWav = path.relative(root, path.join(journey.dir, "01-voice.audio.wav"));
  const chapterT = (e) => (e.at - voiceLog.pageT0) / 1000;
  const calls = voiceLog.log.filter((e) => e.in === "FunctionCallRequest").map(chapterT);
  const answerAt = cues.agent[1].start;
  const lines = voiceLog.log.filter((e) => e.in === "ConversationText").map(chapterT).filter((s) => s >= answerAt - 0.1);
  const orb = ev("01-voice", "click", "orb");
  const orbBox = orb.box;
  const aOut = orb.frame + f(1.0);
  const tourStart = t - 24 / FPS;
  let s2;
  let s3;
  {
    // The sections at the approved draft's pace: My Onboarding to Home over 16.3 s. Line 2 runs over
    // them; the voice-agent callout sits on the orb, which is in the same corner on every page.
    const c = "00-tour";
    const firstMove = ev(c, "move-start", "nav-My Onboarding");
    const homeClick = ev(c, "click", "nav-Home");
    const homeArrived = ev(c, "wait-end", "page-Home");
    const srcIn = firstMove.frame - f(0.3);
    const pace = (homeClick.frame - firstMove.frame) / FPS / 16.3;
    const length = (homeArrived.frame - srcIn) / FPS / pace;
    const L = (x) => x - tourStart;
    s2 = say(2, tourStart + 1.0);
    // Line 3 ends as Maya taps, a moment after the tour lands on Home.
    s3 = say(3, Math.max(s2.end + 0.45, tourStart + length + 0.9 - (narration[3].end - narration[3].start)));
    const orbFrom = Math.max(0.3, L(s2.word("deepgram")) - 0.05);
    const orbTo = L(s2.word("connects")) + 0.6;
    const s = shot({
      id: "tour", chapter: c, start: tourStart, srcIn, srcOut: homeArrived.frame, length,
      keys: [
        { at: 0, z: 1.0, focus: { x: 960, y: 540 }, dur: 0 },
        { at: 0.05, z: 1.04, focus: { x: 1000, y: 530 }, dur: length - 0.05 },
      ],
      overlays: [
        { type: "callout", from: orbFrom, to: orbTo, box: { x: orbBox.x - 10, y: orbBox.y - 10, width: orbBox.width + 20, height: orbBox.height + 20 }, label: "Relay Guide · Deepgram voice agent", side: "left", pad: 6, dim: false },
        { type: "lowerThird", from: L(s3.start), to: length + 0.5, title: "Maya Patel · day one", detail: "Synthetic employee in Relay's demo portal" },
      ],
      inT: { type: "wipe", dur: 24 },
      outT: { type: "blurDissolve", dur: 15 },
    });
    const pages = [
      ["My Onboarding", "HR · My Onboarding"],
      ["Pay & Benefits", "Payroll · Pay & Benefits"],
      ["Learning", "Learning"],
      ["Help & Support", "IT · Help & Support"],
    ];
    // Section callouts give way to the orb callout instead of sharing the screen with it.
    const [oA, oB] = [f(orbFrom) - 6, f(orbTo) + 6];
    pages.forEach(([name, label], k) => {
      const arrived = ev(c, "wait-end", `page-${name}`);
      const box = ev(c, "mark", `section-${name}`).main;
      const leave = k + 1 < pages.length ? ev(c, "move-start", `nav-${pages[k + 1][0]}`) : ev(c, "move-start", "nav-Home");
      let a = s.outFrame(arrived.frame + 4);
      let b = s.outFrame(leave.frame);
      if (a < oB && b > oA) {
        if (a >= oA) a = oB;
        else b = oA;
      }
      if (b - a >= f(0.9)) s.overlays.push({ type: "callout", box: { x: box.x + 24, y: box.y + 20, width: Math.min(box.width - 48, 620), height: 96 }, label, side: "bottom", pad: 6, dim: false, from: a, to: b });
    });
    t = tourStart + length;
  }
  const ideaStart = t - 15 / FPS;
  let journeyStart;
  {
    // Home, then Maya's tap on the orb as line 3 ends.
    const orbMove = ev("01-voice", "move-start", "orb");
    journeyStart = Math.max(s3.start - 0.2, ideaStart);
    const tapAt = s3.end + 0.2 - ideaStart;
    const length = tapAt + (aOut - orb.frame) / FPS;
    const near = { x: centre(orbBox).x - 330, y: centre(orbBox).y - 190 };
    const moveAt = Math.max(0.3, tapAt - 1.4);
    steps.push({ label: "Ask", from: f(journeyStart) });
    const s = shot({
      id: "idea", chapter: "01-voice", start: ideaStart, srcIn: 0, srcOut: aOut, length,
      pins: [[orbMove.frame, moveAt], [orb.frame, tapAt]],
      keys: [
        { at: 0, z: 1.04, focus: { x: 1000, y: 530 }, dur: 0 },
        { at: 0.1, z: 1.55, focus: near, dur: tapAt - 0.1 },
        { at: tapAt + 0.1, z: 1.6, focus: { x: near.x - 30, y: near.y - 20 }, dur: length - tapAt - 0.1 },
      ],
      overlays: [
        { type: "lowerThird", from: 0, to: length - 0.2, title: "Maya Patel · day one", detail: "Synthetic employee in Relay's demo portal" },
      ],
      inT: { type: "blurDissolve", dur: 15 },
      outT: { type: "blurDissolve", dur: 15 },
    });
    sync("Orb tap", s, orb.frame, s3.end + 0.2, "day one (end)");
    t = ideaStart + length;
  }

  // ---------- 4. The live voice request: Maya asks, the agent reads her records and opens the form ----------
  const docMark = markByLabel("01-voice", "document");
  const record = docMark.record;
  const button = docMark.button ?? docMark.action;
  {
    const start = t - 15 / FPS;
    // From just before the greeting: the agent introduces itself, then Maya asks.
    const bIn = f(cues.agent[0].start - 0.5);
    const bOut = Math.min(ch["01-voice"].frames - 1, f(cues.agent[1].end + 0.5));
    const length = (bOut - bIn) / FPS;
    const at = (src) => src - bIn / FPS; // shot-local seconds for a chapter time
    const opened = ev("01-voice", "wait-end", "document-opened").frame / FPS;
    const mayaEnd = cues.maya.start + 3.3;
    // The log stamps the reveal request a moment after the app has already navigated on it.
    const revealFrom = Math.min(at(calls[1]), at(opened) - 0.6);
    const s = shot({
      id: "voice", chapter: "01-voice", start, srcIn: bIn, srcOut: bOut, length,
      keys: [
        { at: 0, z: 1.55, focus: { x: centre(orbBox).x - 330, y: centre(orbBox).y - 190 }, dur: 0 },
        { at: 0.2, z: 1.62, focus: { x: centre(orbBox).x - 300, y: centre(orbBox).y - 170 }, dur: at(opened) - 0.6 },
        { at: at(opened) - 0.3, z: 1.08, focus: { x: 1060, y: 540 }, dur: 0.9 },
        { at: at(lines[0]) + 0.2, z: 1.38, focus: { x: centre(record).x + 40, y: centre(record).y + 60 }, dur: 1.0 },
        { at: at(lines[0]) + 1.3, z: 1.42, focus: { x: centre(record).x + 30, y: centre(record).y + 120 }, dur: at(lines[2]) - at(lines[0]) - 1.6 },
        { at: at(lines[2]) - 0.2, z: 1.5, focus: { x: centre(button).x + 160, y: centre(button).y - 80 }, dur: 0.9 },
        { at: at(lines[2]) + 0.8, z: 1.52, focus: { x: centre(button).x + 150, y: centre(button).y - 70 }, dur: length - at(lines[2]) - 0.8 },
      ],
      overlays: [
        { type: "lowerThird", from: 0.3, to: at(cues.maya.start) - 0.3, title: "Live voice agent", detail: "A recorded Deepgram session in the real portal" },
        { type: "chip", from: at(calls[0]), to: revealFrom - 0.05, box: orbBox, text: "Tool · get_employee_portal_context", side: "left", icon: "⚙" },
        { type: "chip", from: revealFrom, to: at(opened) + 1.4, box: orbBox, text: "Tool · reveal_portal_record → DOC-TAX-1007", side: "left", icon: "⚙" },
        { type: "callout", from: at(opened) + 0.4, to: at(lines[2]) - 0.3, box: record, label: "Due today · opened by the agent", side: "top", tone: "warn", pad: 8, dim: false },
        { type: "callout", from: at(lines[2]) + 0.1, to: length + 0.5, box: button, label: "Ready to start", side: "top", tone: "ok", pad: 8 },
      ],
      inT: { type: "blurDissolve", dur: 15 },
    });
    void s;
    audio.push({ file: voiceWav, srcStart: bIn / FPS, srcEnd: bOut / FPS, at: start, fadeIn: 0.12, fadeOut: 0.35 });
    const filmT = (src) => start + at(src);
    cueParts(cues.agent[0].start, cues.agent[0].end, ["Relay: Hi, I'm Relay Guide.", "Ask me about your onboarding, tasks, documents,", "pay, benefits, or support."], filmT);
    extraCaptions.push({ start: filmT(cues.maya.start), end: filmT(mayaEnd), text: "Maya: What's my next highest-priority task?" });
    ANSWER.forEach((parts, k) => {
      const a = lines[k];
      const b = k + 1 < ANSWER.length ? lines[k + 1] : cues.agent[1].end;
      const total = parts.join(" ").length;
      let cursor = a;
      parts.forEach((text) => {
        const d = ((b - a) * text.length) / total;
        extraCaptions.push({ start: filmT(cursor), end: filmT(Math.min(cursor + d, bOut / FPS)), text });
        cursor += d;
      });
    });
    t = start + length;

    // Line 4 over the opened form: the last frames of the chapter, held with a slow drift.
    const s4 = say(4, t + 0.35);
    const len4 = s4.end + 0.6 - t;
    const L = (x) => x - t;
    shot({
      id: "form", chapter: "01-voice", start: t, srcIn: bOut, srcOut: ch["01-voice"].frames - 1, length: len4,
      keys: [
        { at: 0, z: 1.52, focus: { x: centre(button).x + 150, y: centre(button).y - 70 }, dur: 0 },
        { at: L(s4.word("records")) - 0.3, z: 1.3, focus: { x: centre(record).x + 40, y: centre(record).y + 40 }, dur: 0.9 },
        { at: L(s4.word("records")) + 0.6, z: 1.34, focus: { x: centre(record).x + 50, y: centre(record).y + 70 }, dur: L(s4.word("opens")) - L(s4.word("records")) - 0.8 },
        { at: L(s4.word("opens")) - 0.2, z: 1.45, focus: { x: centre(button).x + 160, y: centre(button).y - 70 }, dur: 0.8 },
        { at: L(s4.word("opens")) + 0.6, z: 1.48, focus: { x: centre(button).x + 150, y: centre(button).y - 60 }, dur: len4 - L(s4.word("opens")) - 0.6 },
      ],
      overlays: [
        { type: "callout", from: L(s4.word("picks")) - 0.1, to: L(s4.word("opens")) - 0.2, box: record, label: "Due first · Federal and California withholding", side: "top", tone: "warn", pad: 8, dim: false },
        { type: "callout", from: L(s4.word("opens")) + 0.05, to: len4 + 0.5, box: button, label: "The exact form, ready to start", side: "top", tone: "ok", pad: 8 },
      ],
      outT: { type: "whip", dur: 24, dir: "left" },
    });
    t += len4;
  }

  // ---------- 5. Raising a concern: typed, drafted, confirmed (the agent's wait is cut and labelled) ----------
  {
    const c = "02-laptop";
    const composer = ev(c, "click", "composer");
    const typeStart = ev(c, "type-start", "laptop");
    const typeEnd = ev(c, "type-end", "laptop");
    const sent = ev(c, "key", "send-laptop");
    // The draft card streams in over the agent's turn; the cut lands when it is complete.
    const draft = ev(c, "wait-end", "draft-ready");
    const d = ev(c, "mark", "draft");
    const confirm = ev(c, "click", "confirm-case");
    const created = ev(c, "wait-end", "case-created");
    const cm = ev(c, "mark", "case-created");
    const startA = t - 24 / FPS;
    const outA = sent.frame + f(0.7);
    // Maya's long message types at 1.95×; everything else plays at 1×.
    const inA = composer.frame - f(0.3);
    const typedAt = (typeStart.frame - inA) / FPS;
    const typedEnd = typedAt + (typeEnd.frame - typeStart.frame) / FPS / 1.95;
    const lenA = typedEnd + (outA - typeEnd.frame) / FPS;
    const startB = startA + lenA - 12 / FPS;
    const s5 = say(5, Math.max(startA + 0.5, startB + 0.4 - offset(5, "drafts")));
    steps.push({ label: "Request", from: f(startA + 0.2) });
    const panel = d.panel;
    shot({
      id: "laptop-ask", chapter: c, start: startA, srcIn: inA, srcOut: outA, length: lenA,
      pins: [[typeStart.frame, typedAt], [typeEnd.frame, typedEnd]],
      keys: [
        { at: 0, z: 1.55, focus: { x: centre(panel).x - 40, y: panel.y + panel.height - 200 }, dur: 0 },
        { at: 0.4, z: 1.6, focus: { x: centre(panel).x - 30, y: panel.y + panel.height - 190 }, dur: lenA - 0.4 },
      ],
      overlays: [{ type: "lowerThird", from: 0.4, to: lenA, title: "Maya types a concern", detail: "Typing shown at 2×" }],
      inT: { type: "whip", dur: 24, dir: "left" },
      outT: { type: "blurDissolve", dur: 12 },
    });
    const skipped = Math.round((draft.frame - f(0.4) - outA) / FPS);
    const lenB = s5.end + 0.8 - startB;
    const L = (x) => x - startB;
    const cardTop = { x: d.card.x, y: d.panel.y + 60, width: d.card.width, height: d.card.y + d.card.height - d.panel.y - 60 };
    const s = shot({
      id: "laptop-confirm", chapter: c, start: startB, srcIn: draft.frame - f(0.4), srcOut: cm.frame + f(0.6), length: lenB,
      // From the finished draft onward everything plays at 1×; only the wait before it is cut.
      inT: { type: "blurDissolve", dur: 12 },
      pins: [[draft.frame, L(s5.word("drafts"))], [confirm.frame, L(s5.word("confirms"))], [created.frame, L(s5.word("confirms")) + 0.25]],
      keys: [
        { at: 0, z: 1.45, focus: { x: centre(cardTop).x - 60, y: centre(cardTop).y }, dur: 0 },
        { at: 0.2, z: 1.5, focus: { x: centre(cardTop).x - 50, y: centre(cardTop).y + 20 }, dur: L(s5.word("confirms")) - 0.2 },
        { at: L(s5.word("confirms")) + 0.3, z: 1.42, focus: { x: centre(cm.row).x + 140, y: centre(cm.row).y + 160 }, dur: 0.8 },
        { at: L(s5.word("confirms")) + 1.15, z: 1.44, focus: { x: centre(cm.row).x + 150, y: centre(cm.row).y + 170 }, dur: Math.max(0.3, lenB - L(s5.word("confirms")) - 1.15) },
      ],
      overlays: [
        { type: "chip", from: 0.05, to: 1.6, box: panel, text: `${skipped} s of agent work cut`, side: "left", icon: "⏩" },
        { type: "callout", from: L(s5.word("drafts")) + 0.1, to: L(s5.word("confirms")) - 0.1, box: cardTop, label: "Complete IT request · waits for Maya", side: "left", tone: "warn", pad: 6, dim: false },
        { type: "callout", from: L(s5.word("confirms")) + 0.5, to: lenB + 0.5, box: cm.row, label: "Filed with IT Support", side: "top", tone: "ok", pad: 6, dim: false },
      ],
      outT: { type: "whip", dur: 24, dir: "left" },
    });
    sync("Request drafted", s, draft.frame, s5.word("drafts"), "drafts");
    sync("Confirm click", s, confirm.frame, s5.word("confirms"), "confirms");
    t = startB + lenB;
  }

  // ---------- 6. A meeting by voice (live-03), then the paycheck and direct deposit under one sentence ----------
  {
    const c = "03-meeting";
    const mLog = JSON.parse(readFileSync(path.join(journey.dir, "03-meeting.voice.json"), "utf8"));
    const mCues = JSON.parse(readFileSync(path.join(journey.dir, "03-meeting.audio.json"), "utf8"));
    const mWav = path.relative(root, path.join(journey.dir, "03-meeting.audio.wav"));
    const mT = (e) => (e.at - mLog.pageT0) / 1000;
    const mine = mLog.log.filter((e) => (e.sock ?? 1) === mLog.sock);
    const mCalls = mine.filter((e) => e.in === "FunctionCallRequest").map(mT);
    const mAnswer = mCues.agent[1].start;
    const mLines = mine.filter((e) => e.in === "ConversationText").map(mT).filter((x) => x >= mAnswer - 0.1);
    const m = ev(c, "mark", "meeting-draft");
    const drafted = ev(c, "wait-end", "meeting-draft").frame / FPS;
    const confirm = ev(c, "click", "confirm-meeting");
    const booked = ev(c, "mark", "meeting-booked");
    const mOrb = ev(c, "click", "orb-meeting").box;

    // A: Maya asks; the agent drafts the meeting and says the first two lines of its answer, at 1×.
    const startM = t - 24 / FPS;
    const aIn = f(mCues.maya.start - 0.6);
    const aOutM = f(mLines[2] - 0.15);
    const lenA = (aOutM - aIn) / FPS;
    const at = (src) => src - aIn / FPS;
    const panel = m.panel;
    const cal = m.calendar;
    const both = { x: Math.min(cal.x, panel.x), y: Math.min(cal.y, panel.y), width: Math.max(cal.x + cal.width, panel.x + panel.width) - Math.min(cal.x, panel.x), height: Math.max(cal.y + cal.height, panel.y + panel.height) - Math.min(cal.y, panel.y) };
    steps.push({ label: "Meeting", from: f(startM + 0.2) });
    shot({
      id: "meeting", chapter: c, start: startM, srcIn: aIn, srcOut: aOutM, length: lenA,
      keys: [
        { at: 0, z: 1.5, focus: { x: centre(mOrb).x - 330, y: centre(mOrb).y - 190 }, dur: 0 },
        { at: 0.2, z: 1.55, focus: { x: centre(mOrb).x - 310, y: centre(mOrb).y - 180 }, dur: at(drafted) - 0.6 },
        { at: at(drafted) - 0.2, z: 1.06, focus: { x: centre(both).x, y: centre(both).y }, dur: 0.9 },
        { at: at(drafted) + 0.8, z: 1.1, focus: { x: centre(both).x + 20, y: centre(both).y + 10 }, dur: Math.max(0.3, lenA - at(drafted) - 0.8) },
      ],
      overlays: [
        { type: "lowerThird", from: 0.3, to: at(mCalls[0]) - 0.2, title: "Maya asks by voice", detail: "A second recorded Deepgram session" },
        { type: "chip", from: at(mCalls[0]), to: at(mCalls[1]) - 0.05, box: mOrb, text: "Tool · get_employee_portal_context", side: "left", icon: "⚙" },
        { type: "chip", from: at(mCalls[1]), to: Math.max(at(drafted) + 1.2, at(mCalls[1]) + 2.2), box: mOrb, text: "Tool · propose_onboarding_action → meeting", side: "left", icon: "⚙" },
        { type: "callout", from: at(mLines[0]) + 0.2, to: lenA + 0.5, box: m.card, label: "Drafted · waits for Maya", side: "left", tone: "warn", pad: 6, dim: false },
      ],
      inT: { type: "whip", dur: 24, dir: "left" },
      outT: { type: "blurDissolve", dur: 12 },
    });
    audio.push({ file: mWav, srcStart: aIn / FPS, srcEnd: aOutM / FPS + 0.3, at: startM, fadeIn: 0.12, fadeOut: 0.3 });
    const mFilm = (src) => startM + at(src);
    cueParts(mCues.maya.start, mCues.maya.end, ["Maya: Set up a 30 minute follow-up with Casey", "tomorrow afternoon at 2."], mFilm);
    const SAID = [
      ["Relay: A thirty-minute follow-up with Casey Nguyen", "is ready to schedule on Fri, Oct 2,", "from 2:00 PM to 2:30 PM."],
      ["The subject is “Follow-up with Casey”."],
    ];
    SAID.forEach((parts, k) => {
      const a = mLines[k];
      const b = k + 1 < SAID.length ? mLines[k + 1] : Math.min(mLines[2], mCues.agent[1].end);
      const total = parts.join(" ").length;
      let cursor = a;
      parts.forEach((text) => {
        const d = ((b - a - 0.2) * text.length) / total;
        extraCaptions.push({ start: mFilm(cursor), end: mFilm(cursor + d), text });
        cursor += d;
      });
    });

    // B: Maya confirms as the narrator says "books"; the meeting lands on the calendar.
    const startB = startM + lenA - 12 / FPS;
    const s6 = say(6, startB + 0.6);
    const LM = (x) => x - startB;
    const startP = s6.word("explains") - 0.35;
    const lenM = startP + 12 / FPS - startB;
    const sm = shot({
      id: "meeting-confirm", chapter: c, start: startB, srcIn: confirm.frame - f(LM(s6.word("books"))), srcOut: booked.frame + f(0.4), length: lenM,
      pins: [[confirm.frame, LM(s6.word("books"))]],
      keys: [
        { at: 0, z: 1.1, focus: { x: centre(both).x + 20, y: centre(both).y + 10 }, dur: 0 },
        { at: 0.2, z: 1.14, focus: { x: centre(both).x + 60, y: centre(both).y + 10 }, dur: lenM - 0.2 },
      ],
      overlays: [
        { type: "callout", from: LM(s6.word("books")) + 0.3, to: lenM + 0.3, box: booked.outcome, label: "On the calendar", side: "left", tone: "ok", pad: 6, dim: false },
      ],
      inT: { type: "blurDissolve", dur: 12 },
      outT: { type: "blurDissolve", dur: 12 },
    });
    sync("Meeting confirm", sm, confirm.frame, s6.word("books"), "books");

    const pa = ev("04-pay", "wait-end", "paycheck-answer");
    const pm = ev("04-pay", "mark", "paycheck-answer");
    const sentP = ev("04-pay", "key", "send-paycheck");
    const startD = s6.word("every") - 0.3;
    const lenP = startD + 12 / FPS - startP;
    shot({
      id: "paycheck", chapter: "04-pay", start: startP, srcIn: pa.frame - f(1.2), srcOut: pm.frame, length: lenP,
      keys: [
        { at: 0, z: 1.5, focus: { x: centre(pm.panel).x - 60, y: centre(pm.panel).y + 40 }, dur: 0 },
        { at: 0.2, z: 1.55, focus: { x: centre(pm.panel).x - 50, y: centre(pm.panel).y + 60 }, dur: lenP - 0.2 },
      ],
      overlays: [
        { type: "lowerThird", from: 0.2, to: lenP, title: "Maya asks", detail: ASKED.paycheck },
        { type: "chip", from: 0.05, to: 1.3, box: pm.panel, text: `${Math.round((pa.frame - f(1.2) - sentP.frame) / FPS)} s of agent work cut`, side: "left", icon: "⏩" },
      ],
      inT: { type: "blurDissolve", dur: 12 },
      outT: { type: "blurDissolve", dur: 12 },
    });

    const opened = ev("04-pay", "wait-end", "deposit-opened");
    const dm = ev("04-pay", "mark", "deposit");
    const lenD = s6.end + 0.7 - startD;
    const LD = (x) => x - startD;
    shot({
      id: "deposit", chapter: "04-pay", start: startD, srcIn: opened.frame - f(0.3), srcOut: dm.frame + f(0.8), length: lenD,
      keys: [
        { at: 0, z: 1.1, focus: { x: centre(dm.main).x, y: centre(dm.main).y }, dur: 0 },
        { at: 0.3, z: 1.22, focus: { x: centre(dm.main).x - 60, y: centre(dm.main).y + 20 }, dur: lenD - 0.3 },
      ],
      overlays: [
        { type: "lowerThird", from: 0.2, to: lenD, title: "Maya asks", detail: ASKED.deposit },
        { type: "callout", from: LD(s6.word("click")) - 0.15, to: lenD + 0.5, box: dm.main, label: "Opened for Maya to finish", side: "top", tone: "ok", pad: 6, dim: false },
      ],
      inT: { type: "blurDissolve", dur: 12 },
      outT: { type: "blurDissolve", dur: 26 },
    });
    steps.push({ label: "Pay", from: f(startP) });
    t = startD + lenD;
  }
  const journeyEnd = t;

  // ---------- 7. Under the hood: the intelligence layer ----------
  const hoodStart = t - 26 / FPS;
  push({ id: "chapter-hood", kind: "chapter", from: f(hoodStart), duration: 68, in: { type: "blurDissolve", dur: 26 }, out: { type: "radial", dur: 24, origin: { x: 960, y: 540 } }, props: { title: "Under the hood", steps: ["Journey", "Under the hood", "Results"], current: 1 } });
  t = hoodStart + 68 / FPS;
  {
    const start = t - 24 / FPS;
    const s7 = say(7, start + 0.7);
    const s8 = say(8, s7.end + 0.45);
    const length = s8.end + 0.6 - start;
    const at = (s) => f(s - start);
    const end = f(length);
    const tool = (id, label, sub, y, word) => ({ id, label, sub, x: 640, y, w: 600, h: 104, at: 14 + (y - 190) / 30, lit: [[at(s7.word(word)) - 4, end]] });
    const nodes = [
      { id: "agent", label: "Deepgram voice agent", sub: "Nova-3 listens · Flux speaks", x: 96, y: 400, w: 440, h: 130, at: 4, lit: [[at(s7.word("agent")) - 4, end]] },
      tool("read", "Read records", "get_employee_portal_context", 190, "read"),
      tool("open", "Open a record", "reveal_portal_record", 318, "open"),
      tool("highlight", "Highlight a section", "highlight_portal_section", 446, "highlight"),
      tool("propose", "Propose an action", "propose_onboarding_action", 574, "propose"),
      { id: "relay", label: "Relay portal", sub: "Finds the page and highlight", x: 1350, y: 318, w: 470, h: 130, at: at(s8.start) - 6, tone: "ok", lit: [[at(s8.word("relay")) - 4, end]] },
    ];
    const edges = [
      { from: "agent", to: "read", at: 20, via: [[590, 465], [590, 242]] },
      { from: "agent", to: "open", at: 22, via: [[590, 465], [590, 370]] },
      { from: "agent", to: "highlight", at: 24, via: [[590, 465], [590, 498]] },
      { from: "agent", to: "propose", at: 26, via: [[590, 465], [590, 626]] },
      { from: "open", to: "relay", at: at(s8.start) },
    ];
    push({
      id: "intelligence", kind: "diagram", from: f(start), duration: span(start, length),
      in: { type: "radial", dur: 24, origin: { x: 960, y: 540 } }, out: { type: "whip", dur: 24, dir: "up" },
      props: {
        title: "Intelligence layer",
        nodes, edges,
        packets: [{ route: ["agent", "open", "relay"], from: at(s8.word("names")) - 6, dur: f(1.1) }],
        checks: [
          { node: "agent", text: "Names DOC-TAX-1007", at: at(s8.word("names")) },
          { node: "relay", text: "Works out page and highlight", at: at(s8.word("page")) },
          { node: "relay", text: "Unknown targets refused", at: at(s8.word("refuses")) },
        ],
      },
    });
    t = start + length;
  }

  // ---------- 8. The security boundary ----------
  {
    const start = t - 24 / FPS;
    const s9 = say(9, start + 0.6);
    const s10 = say(10, s9.end + 0.45);
    const length = s10.end + 0.6 - start;
    const at = (s) => f(s - start);
    const end = f(length);
    const nodes = [
      { id: "browser", label: "Maya's browser", sub: "Session only", x: 96, y: 400, w: 360, h: 130, at: 4, lit: [[at(s9.start), at(s9.word("server"))]] },
      { id: "server", label: "Relay server", sub: "Decides who is signed in", x: 540, y: 400, w: 420, h: 130, at: 8, lit: [[at(s9.word("server")) - 4, end]] },
      { id: "records", label: "Maya's records", sub: "This employee only", x: 1060, y: 190, w: 400, h: 130, at: 12, lit: [[at(s9.word("records")) - 4, end]] },
      { id: "redact", label: "Redaction", sub: "Bank numbers removed", x: 1060, y: 610, w: 400, h: 130, at: 16, tone: "warn", lit: [[at(s10.word("removed")) - 6, end]] },
      { id: "agent", label: "Voice agent", sub: "Deepgram", x: 1540, y: 400, w: 290, h: 130, at: 20, lit: [[at(s10.word("agent")) - 4, end]] },
    ];
    const edges = [
      { from: "browser", to: "server", at: 10 },
      { from: "server", to: "records", at: 14, via: [[750, 255]] },
      { from: "records", to: "redact", at: 18 },
      { from: "redact", to: "agent", at: 22, via: [[1685, 675]] },
    ];
    push({
      id: "security", kind: "diagram", from: f(start), duration: span(start, length),
      in: { type: "whip", dur: 24, dir: "up" }, out: { type: "wipe", dur: 24 },
      props: {
        title: "Security",
        nodes, edges,
        packets: [
          { route: ["browser", "server", "records"], from: at(s9.word("server")) - 6, dur: f(s9.word("records") - s9.word("server") + 0.2) },
          { route: ["records", "redact", "agent"], from: at(s10.start), dur: f(s10.word("agent") - s10.start + 0.2) },
        ],
        checks: [
          { node: "server", text: "Identity from the server", at: at(s9.word("decides")) },
          { node: "records", text: "Only what Maya may see", at: at(s9.word("authorized")) },
        ],
      },
    });
    t = start + length;
  }

  // ---------- 9. The operations timeline behind Maya's IT request ----------
  const resultStart = t - 24 / FPS;
  {
    const c = "05-operations";
    const start = resultStart;
    const ops = ev(c, "click", "operations");
    const scrollStart = ev(c, "scroll-start", "chronology");
    const scrollEnd = ev(c, "scroll-end", "chronology");
    const chron = ev(c, "mark", "chronology");
    const verified = ev(c, "move-start", "verified");
    const backUp = ev(c, "scroll-start", "top");
    const s11 = say(11, start + 0.6);
    const length = s11.end + 0.8 - start;
    const L = (x) => x - start;
    const s = shot({
      id: "operations", chapter: c, start, srcIn: ops.frame - f(0.3), srcOut: backUp.frame - 4, length,
      pins: [[ops.frame, 0.3], [scrollStart.frame, L(s11.word("timeline")) - 0.2], [scrollEnd.frame, L(s11.word("request"))], [verified.frame, L(s11.word("verified")) - 0.2]],
      keys: [
        { at: 0, z: 1.05, focus: { x: 1080, y: 470 }, dur: 0 },
        { at: L(s11.word("timeline")), z: 1.3, focus: { x: centre(chron.list).x + 120, y: centre(chron.list).y + 20 }, dur: 0.8 },
        { at: L(s11.word("asked")) - 0.3, z: 1.5, focus: { x: centre(chron.requested).x + 60, y: centre(chron.requested).y + 40 }, dur: 0.7 },
        { at: L(s11.word("verified")) - 0.3, z: 1.55, focus: { x: centre(chron.verified).x + 60, y: centre(chron.verified).y - 80 }, dur: 0.8 },
      ],
      overlays: [
        { type: "lowerThird", from: 0.4, to: L(s11.word("timeline")) - 0.2, title: "IT Operations", detail: "The record behind Maya's laptop request" },
        { type: "callout", from: L(s11.word("request")) + 0.1, to: L(s11.word("verified")) - 0.25, box: chron.requested, label: "What was asked", side: "right", pad: 6, dim: false },
        { type: "callout", from: L(s11.word("verified")) - 0.1, to: length + 0.5, box: chron.verified, label: "Change verified", side: "top", tone: "ok", pad: 6 },
      ],
      inT: { type: "wipe", dur: 24 },
      outT: { type: "whip", dur: 24, dir: "up" },
    });
    void s;
    t = start + length;
  }

  // ---------- 10. Results: the in-app evaluation, then the release gate ----------
  {
    const c = "06-evaluation";
    const start = t - 24 / FPS;
    const click = ev(c, "click", "evaluation");
    const e = ev(c, "mark", "eval");
    const mv = (label) => ev(c, "move-start", label);
    const s12 = say(12, start + 0.6);
    const length = s12.end + 0.6 - start;
    const L = (x) => x - start;
    shot({
      id: "evaluation", chapter: c, start, srcIn: click.frame - f(0.35), srcOut: ch[c].frames - 1, length,
      pins: [[click.frame, 0.35], [mv("task").frame, L(s12.word("103")) - 0.45], [mv("voice").frame, L(s12.word("31")) - 0.45]],
      keys: [
        { at: 0, z: 1.08, focus: { x: 1100, y: 470 }, dur: 0 },
        { at: 0.6, z: 1.3, focus: { x: 1100, y: 380 }, dur: L(s12.word("103")) - 1.0 },
        { at: L(s12.word("103")) - 0.3, z: 1.6, focus: { x: centre(e.task).x + 80, y: centre(e.task).y + 30 }, dur: 0.7 },
        { at: L(s12.word("103")) + 0.45, z: 1.62, focus: { x: centre(e.task).x + 200, y: centre(e.task).y + 30 }, dur: L(s12.word("31")) - L(s12.word("103")) - 0.8 },
        { at: L(s12.word("31")) - 0.3, z: 1.6, focus: { x: centre(e.voice).x + 40, y: centre(e.voice).y + 30 }, dur: 0.7 },
        { at: L(s12.word("31")) + 0.45, z: 1.62, focus: { x: centre(e.voice).x + 60, y: centre(e.voice).y + 40 }, dur: length - L(s12.word("31")) - 0.45 },
      ],
      overlays: [
        { type: "lowerThird", from: 0.4, to: L(s12.word("103")) - 0.2, title: "Agent evaluation", detail: "Measured end to end on the real app" },
        { type: "callout", from: L(s12.word("103")) - 0.05, to: L(s12.word("31")) - 0.35, box: e.task, label: "103 / 110 conversations fully right", side: "bottom", tone: "ok", pad: 6 },
        { type: "callout", from: L(s12.word("31")) - 0.05, to: length + 0.5, box: e.voice, label: "31 / 34 spoken requests answered usefully", side: "bottom", tone: "ok", pad: 6 },
      ],
      inT: { type: "whip", dur: 24, dir: "up" },
      outT: { type: "whip", dur: 24, dir: "up" },
    });
    t = start + length;
  }
  {
    const start = t - 24 / FPS;
    const s13 = say(13, start + 0.7);
    const length = s13.end + 0.7 - start;
    const at = (s) => f(s - start);
    // `npm run evaluate:gate`: real output (npm's echo lines omitted), entered so it prints on "stops".
    const run = terminal.gate;
    const out = run.lines.slice(run.lines.findIndex((l) => l.text.startsWith("Evaluation gate")));
    const command = "npm run evaluate:gate";
    const msToFrames = (ms) => Math.round((ms / 1000) * FPS);
    const entered = at(s13.word("stops")) - msToFrames(out[0].ms);
    const typeFrom = Math.round(entered - 8 - command.length * 1.6);
    push({
      id: "gate", kind: "terminal", from: f(start), duration: span(start, length),
      in: { type: "whip", dur: 24, dir: "up" }, out: { type: "blurDissolve", dur: 26 },
      props: { title: "relay — zsh", prompt: "~/relay $", command, typeFrom: Math.max(4, typeFrom), lines: out.map((l) => ({ text: l.text, at: msToFrames(l.ms) })) },
    });
    t = start + length;
  }

  // ---------- 11. Payoff over the form the agent found, then the end card ----------
  {
    const start = t - 26 / FPS;
    const s14 = say(14, start + 0.6);
    const length = s14.end + 0.7 - start;
    const L = (x) => x - start;
    const last = ch["01-voice"].frames - 1;
    shot({
      id: "payoff", chapter: "01-voice", start, srcIn: last - f(0.5), srcOut: last, length,
      keys: [
        { at: 0, z: 1.0, focus: { x: 960, y: 540 }, dur: 0 },
        { at: 0.1, z: 1.06, focus: { x: 1010, y: 560 }, dur: L(s14.word("record")) - 0.2 },
        { at: L(s14.word("record")) - 0.1, z: 1.14, focus: { x: centre(record).x + 60, y: centre(record).y + 80 }, dur: length - L(s14.word("record")) },
      ],
      overlays: [
        { type: "callout", from: L(s14.word("record")) - 0.05, to: L(s14.word("next")) - 0.1, box: record, label: "The record and its owner", side: "top", pad: 8, dim: false },
        { type: "callout", from: L(s14.word("next")) - 0.05, to: length + 0.5, box: button, label: "The next step", side: "top", tone: "ok", pad: 8, dim: false },
      ],
      inT: { type: "blurDissolve", dur: 26 },
      outT: { type: "blurDissolve", dur: 26 },
    });
    t = start + length;
  }
  const endStart = t - 26 / FPS;
  push({ id: "end", kind: "endcard", from: f(endStart), duration: span(endStart, 3.6), impact: meta.impact, link: meta.link, in: { type: "blurDissolve", dur: 26 } });
  t = endStart + 3.6;

  return {
    poster: { video: video("01-voice"), frame: markByLabel("01-voice", "document").frame },
    syncs,
    scenes,
    audio,
    captions: extraCaptions,
    durationInFrames: f(t),
    tracker: { from: f(journeyStart) + 30, to: f(journeyEnd) - 10, steps },
    chapters: [
      { name: "The need", at: 0 },
      { name: "Relay", at: stingStart },
      { name: "Journey", at: journeyStart },
      { name: "Under the hood", at: hoodStart },
      { name: "Results", at: resultStart },
    ],
  };
}
