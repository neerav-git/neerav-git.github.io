// Relay: Maya Patel's support journey through the real portal, edited to the narration.
// Times are seconds; event names are the labels logged by capture/journeys/relay.mjs.
// The voice beat plays the recorded live Deepgram exchange with the narrator silent.
import { readFileSync } from "node:fs";
import path from "node:path";
import { f, FPS, captureShot, event } from "../planner.mjs";

export const meta = {
  slug: "relay",
  take: 2,
  palette: { accent: "#3ccfba", accent2: "#3b7be0", deep: "#06141f", ink: "#ffffff", muted: "rgba(255,255,255,0.72)", warn: "#f5a524", ok: "#34c38f" },
  tagline: "A voice guide that acts on each employee's own records",
  impact: "Ask out loud, and the guide finds the record, prepares the action, and waits for your click.",
  link: "neerav-git.github.io/projects/relay",
};

// Frames covered by [start, start + length), so adjacent scenes tile exactly.
const span = (start, length) => f(start + length) - f(start);
const centre = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

// The approved voice cut (take-01: 0–2.3 s and 9.4–29.8 s), expressed against the recorded audio so
// any take re-derives it: the tap runs until just before the greeting, then the clip picks up just
// before Maya speaks and ends on "…when you last tried to sign in."
const CUT = { beforeGreeting: 0.22, beforeMaya: 0.45, intoAnswer: 13.17 };

// The agent's spoken sentences in the kept part of the answer, from the recorded session.
const SPOKEN = [
  ["Relay: Your corporate account access is blocked."],
  ["IT Support is working on this and has", "a same-day resolution target of 3:00 PM today."],
  ["IT Support is waiting on you: reply with the device", "you used for MFA enrollment", "and when you last tried to sign in."],
];

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
    s.reveals = s.reveals.map((r) => ({ ...r, frame: r.atSource !== undefined ? s.outFrame(r.atSource) : r.frame }));
    return push({ ...s, from: f(start), in: inT, out: outT });
  };
  const syncs = [];
  const sync = (label, scene, srcFrame, wordAt, word) => syncs.push({ label, word: wordAt, said: word, event: (scene.from + scene.outFrame(srcFrame)) / FPS });

  // The recorded voice exchange, laid onto take frames by capture/relay/voice-audio.mjs.
  const voiceWav = path.relative(path.resolve(journey.dir, "../../../../.."), path.join(journey.dir, "01-voice.audio.wav"));
  const cues = JSON.parse(readFileSync(path.join(journey.dir, "01-voice.audio.json"), "utf8"));
  const voiceLog = JSON.parse(readFileSync(path.join(journey.dir, "01-voice.voice.json"), "utf8"));
  const answerAt = cues.agent[1].start;
  const aOut = f(cues.agent[0].start - CUT.beforeGreeting);
  const bIn = f(cues.maya.start - CUT.beforeMaya);
  const bOut = f(answerAt + CUT.intoAnswer);
  // When each assistant line arrived in this take (page time → chapter seconds).
  const texts = voiceLog.log.filter((e) => e.in === "ConversationText").map((e) => (e.at - voiceLog.pageT0) / 1000);
  const navigated = texts.find((s) => s > answerAt - 0.1); // the answer's first line, as the case opens

  const caseMark = ev("01-voice", "mark", "case");
  const home = ev("01-voice", "mark", "home");
  // The case detail panel, as laid out at 1920×1080 (IT-2047 open in Help & Support).
  const caseDetail = { header: { x: 990, y: 246, width: 796, height: 88 }, owner: { x: 990, y: 474, width: 796, height: 136 }, reply: { x: 1008, y: 726, width: 760, height: 172 } };

  // ---------- 1. Cold open: one click puts Maya's reply on her IT case ----------
  {
    const c = ev("02-reply", "click", "confirm-reply");
    const added = ev("02-reply", "mark", "reply-added");
    const p = ev("02-reply", "mark", "proposal");
    const srcIn = c.frame - f(1.4);
    const srcOut = added.frame + f(1.1);
    const length = (srcOut - srcIn) / FPS;
    const clickAt = (c.frame - srcIn) / FPS;
    shot({
      id: "cold", chapter: "02-reply", start: 0, srcIn, srcOut, length,
      keys: [
        { at: 0, z: 1.85, focus: { x: centre(p.confirm).x + 40, y: centre(p.confirm).y - 70 }, dur: 0 },
        { at: 0.05, z: 1.72, focus: { x: centre(p.confirm).x + 20, y: centre(p.confirm).y - 50 }, dur: clickAt - 0.05 },
        { at: clickAt + 0.25, z: 1.38, focus: { x: centre(added.entry).x - 160, y: centre(added.entry).y - 40 }, dur: 0.85 },
      ],
      overlays: [{ type: "callout", from: (added.frame - srcIn) / FPS - 0.25, to: length + 1, box: added.entry, label: "Reply added to IT-2047", side: "top", tone: "ok", pad: 10 }],
      outT: { type: "blurDissolve", dur: 26 },
    });
    t = length;
  }

  // ---------- 2. Title sting ----------
  const stingStart = t - 26 / FPS;
  push({ id: "sting", kind: "sting", from: f(stingStart), duration: 114, tagline: meta.tagline, in: { type: "blurDissolve", dur: 26 }, out: { type: "wipe", dur: 24 } });
  t = stingStart + 114 / FPS;

  // ---------- 3. Problem → lead-in: day one, account access blocked; Maya taps the orb ----------
  const homeStart = t - 24 / FPS;
  let journeyStart;
  const steps = [];
  {
    const blocked = ev("01-voice", "move-start", "blocked");
    const orbMove = ev("01-voice", "move-start", "orb");
    const orb = ev("01-voice", "click", "orb");
    const s0 = say(0, homeStart + 0.55);
    const s1 = say(1, s0.end + 0.4);
    journeyStart = s1.start - 0.2;
    const tapAt = s1.end + 0.12 - homeStart;
    const length = tapAt + (aOut - orb.frame) / FPS;
    const row = home.blocked;
    const status = { x: row.x + 440, y: row.y + 14, width: 120, height: 40 };
    const orbBox = orb.box;
    steps.push({ label: "Ask", from: f(journeyStart) });
    shot({
      id: "home", chapter: "01-voice", start: homeStart, srcIn: 0, srcOut: aOut, length, tiltIn: 70,
      pins: [[blocked.frame, s0.word("blocked") - homeStart - 0.15], [orbMove.frame, s1.word("hear") - homeStart], [orb.frame, tapAt]],
      keys: [
        { at: 0.2, z: 1.42, focus: { x: centre(row).x - 120, y: centre(row).y - 60 }, dur: Math.max(0.6, s0.word("blocked") - homeStart - 0.1) },
        { at: s0.word("hunting") - homeStart - 0.2, z: 1.2, focus: { x: 1000, y: 560 }, dur: 1.2 },
        { at: s1.word("example") - homeStart, z: 1.6, focus: { x: centre(orbBox).x - 260, y: centre(orbBox).y - 160 }, dur: 1.1 },
        { at: tapAt - 0.2, z: 1.72, focus: { x: centre(orbBox).x - 220, y: centre(orbBox).y - 140 }, dur: length - tapAt + 0.2 },
      ],
      overlays: [
        { type: "callout", from: s0.word("blocked") - homeStart + 0.05, to: s0.word("hunting") - homeStart - 0.25, box: status, label: "Account access blocked", side: "top", tone: "warn", pad: 8 },
        { type: "lowerThird", from: s1.start - homeStart, to: length - 0.1, title: "Maya Patel · day one", detail: "Synthetic employee in Relay's demo portal" },
      ],
      inT: { type: "wipe", dur: 24 },
      outT: { type: "blurDissolve", dur: 15 },
    });
    sync("Orb tap", scenes.at(-1), orb.frame, s1.end + 0.12, "helps (end)");
    t = homeStart + length;
  }

  // ---------- 4. The live voice exchange (narration silent) ----------
  const audio = [];
  const extraCaptions = [];
  {
    const start = t - 15 / FPS;
    const n = bOut - bIn;
    const length = n / FPS;
    const at = (src) => src - bIn / FPS; // shot-local seconds for a chapter time
    const navAt = at(navigated);
    const orbBox = ev("01-voice", "click", "orb").box;
    shot({
      id: "voice", chapter: "01-voice", start, srcIn: bIn, srcOut: bOut, length,
      keys: [
        { at: 0, z: 1.55, focus: { x: centre(orbBox).x - 330, y: centre(orbBox).y - 120 }, dur: 0 },
        { at: 0.2, z: 1.72, focus: { x: centre(orbBox).x - 260, y: centre(orbBox).y - 90 }, dur: navAt - 1.2 },
        { at: navAt - 0.75, z: 1.12, focus: { x: 1130, y: 540 }, dur: 0.85 },
        { at: at(texts.find((s) => s > answerAt + 1)) - 0.1, z: 1.4, focus: { x: centre(caseDetail.owner).x - 60, y: centre(caseDetail.owner).y - 40 }, dur: 0.9 },
        { at: at(texts.find((s) => s > answerAt + 4)) - 0.1, z: 1.48, focus: { x: centre(caseDetail.reply).x - 180, y: centre(caseDetail.reply).y - 70 }, dur: 0.9 },
        { at: at(texts.find((s) => s > answerAt + 4)) + 1.0, z: 1.56, focus: { x: centre(caseDetail.reply).x - 200, y: centre(caseDetail.reply).y - 60 }, dur: length - at(texts.find((s) => s > answerAt + 4)) - 1.0 },
      ],
      overlays: [
        { type: "lowerThird", from: 0.3, to: navAt - 1.0, title: "Live voice agent", detail: "A recorded Deepgram session in the real portal" },
        { type: "callout", from: navAt + 0.15, to: at(texts.find((s) => s > answerAt + 1)) - 0.2, box: caseMark.header, label: "IT-2047 opened by the agent", side: "bottom", pad: 8 },
      ],
      inT: { type: "blurDissolve", dur: 15 },
      outT: { type: "blurDissolve", dur: 26 },
    });
    audio.push({ file: voiceWav, srcStart: bIn / FPS, srcEnd: bOut / FPS, at: start, fadeIn: 0.12, fadeOut: 0.35 });
    // Dialogue captions: Maya's line over its audio, then the agent's sentences as they arrive.
    const filmT = (src) => start + at(src);
    const maya = ["Maya: My corporate account access says blocked.", "Why, and is anyone working on it?"];
    const split = cues.maya.start + (cues.maya.end - cues.maya.start) * 0.55;
    extraCaptions.push({ start: filmT(cues.maya.start), end: filmT(split), text: maya[0] }, { start: filmT(split), end: filmT(cues.maya.end + 0.3), text: maya[1] });
    const starts = texts.filter((s) => s >= answerAt - 0.1).slice(0, SPOKEN.length);
    SPOKEN.forEach((parts, k) => {
      const a = starts[k];
      const b = k + 1 < starts.length ? starts[k + 1] : bOut / FPS;
      const total = parts.join(" ").length;
      let cursor = a;
      parts.forEach((text) => {
        const d = ((b - a) * text.length) / total;
        extraCaptions.push({ start: filmT(cursor), end: filmT(Math.min(cursor + d, bOut / FPS)), text });
        cursor += d;
      });
    });
    t = start + length;
  }

  // ---------- 5. Reply with approval (typed, real confirm) ----------
  {
    const start = t - 26 / FPS;
    const resume = ev("02-reply", "click", "resume");
    const composer = ev("02-reply", "click", "composer");
    const typeStart = ev("02-reply", "type-start", "reply");
    const proposal = ev("02-reply", "wait-end", "proposal");
    const p = ev("02-reply", "mark", "proposal");
    const confirm = ev("02-reply", "click", "confirm-reply");
    const added = ev("02-reply", "mark", "reply-added");
    const s2 = say(2, start + 0.45);
    const s3 = say(3, s2.end + 0.65);
    const s4 = say(4, s3.end + 0.35);
    const length = s4.end + 0.7 - start;
    steps.push({ label: "Reply", from: f(s3.start - 0.3) });
    const L = (s) => s - start;
    const cardTop = { x: p.card.x, y: p.panel.y + 60, width: p.card.width, height: p.card.y + p.card.height - p.panel.y - 60 };
    const s = shot({
      id: "reply", chapter: "02-reply", start, srcIn: 0, srcOut: added.frame + f(0.6), length,
      pins: [
        [resume.frame, L(s2.word("field")) - 0.05],
        [composer.frame, L(s3.start) - 0.1],
        [typeStart.frame, L(s3.word("types"))],
        [proposal.frame, L(s3.word("waits"))],
        [confirm.frame, L(s4.word("click"))],
        [added.frame, L(s4.word("case"))],
      ],
      keys: [
        { at: 0, z: 1.12, focus: { x: 1180, y: 520 }, dur: 0 },
        { at: L(s2.word("case")) - 0.35, z: 1.42, focus: { x: centre(caseDetail.header).x - 40, y: centre(caseDetail.header).y + 120 }, dur: 0.6 },
        { at: L(s2.word("owner")) - 0.2, z: 1.42, focus: { x: centre(caseDetail.owner).x - 40, y: centre(caseDetail.owner).y - 10 }, dur: 0.6 },
        { at: L(s2.word("reply")) - 0.3, z: 1.45, focus: { x: centre(caseDetail.reply).x - 60, y: centre(caseDetail.reply).y - 40 }, dur: 0.6 },
        { at: L(s2.word("field")) + 0.2, z: 1.58, focus: { x: centre(p.panel).x - 120, y: centre(p.panel).y + 60 }, dur: 0.85 },
        { at: L(s3.word("waits")) + 0.05, z: 1.6, focus: { x: centre(cardTop).x - 120, y: centre(cardTop).y + 40 }, dur: 0.7 },
        { at: L(s4.word("click")) + 0.3, z: 1.38, focus: { x: centre(added.entry).x - 170, y: centre(added.entry).y - 50 }, dur: 0.85 },
      ],
      overlays: [
        { type: "callout", from: L(s2.word("owner")) + 0.1, to: L(s2.word("reply")) - 0.3, box: caseDetail.owner, label: "Owner and response target", side: "top", pad: 6, dim: false },
        { type: "callout", from: L(s2.word("reply")) + 0.05, to: L(s2.word("field")) + 0.15, box: caseDetail.reply, label: "The reply field", side: "top", pad: 6, dim: false },
        { type: "chip", from: L(s3.word("waits")) + 0.35, to: L(s4.word("click")) - 0.1, box: cardTop, text: "Nothing is sent until Maya confirms", side: "left" },
        { type: "callout", from: L(s4.word("case")) - 0.05, to: length + 0.5, box: added.entry, label: "Reply added to IT-2047", side: "top", tone: "ok", pad: 10 },
        { type: "lowerThird", from: L(s3.start), to: L(s4.start) - 0.1, title: "Typed follow-up", detail: "The agent prepares; the employee approves" },
      ],
      inT: { type: "blurDissolve", dur: 26 },
      outT: { type: "whip", dur: 24, dir: "left" },
    });
    sync("Typing starts", s, typeStart.frame, s3.word("types"), "types");
    sync("Reply ready for confirmation", s, proposal.frame, s3.word("waits"), "waits");
    sync("Confirm click", s, confirm.frame, s4.word("click"), "click");
    sync("Reply on the case", s, added.frame, s4.word("case"), "case");
    t = start + length;
  }

  // ---------- 6. A second request, confirmed the same way ----------
  {
    const start = t - 24 / FPS;
    const composer = ev("03-laptop", "click", "composer");
    const typeStart = ev("03-laptop", "type-start", "laptop");
    const draft = ev("03-laptop", "wait-end", "draft");
    const d = ev("03-laptop", "mark", "draft");
    const confirm = ev("03-laptop", "click", "confirm-case");
    const created = ev("03-laptop", "wait-end", "case-created");
    const cm = ev("03-laptop", "mark", "case-created");
    const s5 = say(5, start + 1.35);
    const length = s5.end + 0.85 - start;
    steps.push({ label: "Request", from: f(start + 0.2) });
    const L = (s) => s - start;
    const cardTop = { x: d.card.x, y: d.panel.y + 60, width: d.card.width, height: d.card.y + d.card.height - d.panel.y - 60 };
    const s = shot({
      id: "laptop", chapter: "03-laptop", start, srcIn: composer.frame - f(0.25), srcOut: cm.frame + f(0.5), length,
      inT: { type: "whip", dur: 24, dir: "left" },
      pins: [
        [typeStart.frame, 0.6],
        [draft.frame, L(s5.word("complete"))],
        [confirm.frame, L(s5.word("confirmed"))],
        [created.frame, L(s5.word("confirmed")) + 0.2],
      ],
      keys: [
        { at: 0, z: 1.62, focus: { x: centre(d.panel).x + 20, y: d.panel.y + d.panel.height - 210 }, dur: 0 },
        { at: L(s5.word("complete")) - 0.25, z: 1.42, focus: { x: centre(d.row).x + 90, y: centre(cardTop).y - 60 }, dur: 0.8 },
        { at: L(s5.word("confirmed")) + 0.3, z: 1.48, focus: { x: centre(cm.row).x + 120, y: centre(cm.row).y + 170 }, dur: 0.8 },
      ],
      overlays: [
        { type: "callout", from: L(s5.word("complete")) + 0.2, to: L(s5.word("confirmed")) - 0.1, box: d.row, label: "Draft until Maya confirms", side: "top", tone: "warn", pad: 6, dim: false },
        { type: "callout", from: L(s5.word("confirmed")) + 0.55, to: length + 0.5, box: cm.row, label: "New IT case · Received", side: "top", tone: "ok", pad: 6, dim: false },
        { type: "lowerThird", from: 0.4, to: length - 0.2, title: "Second request", detail: "A complete IT case: title, details, team, target" },
      ],
      outT: { type: "blurDissolve", dur: 26 },
    });
    sync("Case drafted", s, draft.frame, s5.word("complete"), "complete");
    sync("Confirm click", s, confirm.frame, s5.word("confirmed"), "confirmed");
    t = start + length;
  }
  const journeyEnd = t;

  // ---------- 7. Under the hood: the execution contract, on the real workflow record ----------
  const cardStart = t - 26 / FPS;
  push({ id: "chapter-hood", kind: "chapter", from: f(cardStart), duration: 68, in: { type: "blurDissolve", dur: 26 }, out: { type: "radial", dur: 24, origin: { x: 960, y: 540 } }, props: { title: "Under the hood", steps: ["Journey", "Under the hood", "Result"], current: 1 } });
  t = cardStart + 68 / FPS;
  {
    const start = t - 24 / FPS;
    const ops = ev("04-operations", "click", "operations");
    const o = ev("04-operations", "mark", "ops");
    const scrollStart = ev("04-operations", "scroll-start", "chronology");
    const scrollEnd = ev("04-operations", "scroll-end", "chronology");
    const c = ev("04-operations", "mark", "chronology");
    const backUp = ev("04-operations", "scroll-start", "top");
    const s6 = say(6, start + 0.55);
    const length = s6.end + 0.9 - start;
    const L = (s) => s - start;
    const s = shot({
      id: "contract", chapter: "04-operations", start, srcIn: ops.frame - f(0.3), srcOut: backUp.frame - 4, length,
      inT: { type: "radial", dur: 24, origin: { x: 960, y: 540 } },
      pins: [[ops.frame, 0.3], [scrollStart.frame, L(s6.word("key")) + 0.05], [scrollEnd.frame, L(s6.word("audit")) - 0.05]],
      keys: [
        { at: 0, z: 1.05, focus: { x: 1080, y: 470 }, dur: 0 },
        { at: L(s6.word("employee")) - 0.5, z: 1.26, focus: { x: 1080, y: 400 }, dur: 0.8 },
        { at: L(s6.word("audit")) - 0.1, z: 1.32, focus: { x: centre(c.list).x + 120, y: centre(c.list).y + 30 }, dur: 0.6 },
        { at: L(s6.word("verified")) - 0.35, z: 1.6, focus: { x: centre(c.verified).x + 40, y: centre(c.verified).y - 90 }, dur: 0.75 },
      ],
      overlays: [
        { type: "callout", from: L(s6.word("employee")) - 0.05, to: L(s6.word("explicit")) - 0.05, box: o.employee, label: "Signed-in employee", side: "bottom", pad: 6, dim: false },
        { type: "callout", from: L(s6.word("confirmation")) - 0.1, to: L(s6.word("retry-safe")) - 0.05, box: o.confirmation, label: "Explicit confirmation", side: "bottom", tone: "ok", pad: 6, dim: false },
        { type: "callout", from: L(s6.word("retry-safe")) - 0.05, to: L(s6.word("key")) + 0.05, box: o.retry, label: "Retry-safe", side: "bottom", pad: 6, dim: false },
        { type: "callout", from: L(s6.word("audit")) + 0.05, to: L(s6.word("verified")) - 0.3, box: c.list, label: "Audit trail · 10 events", side: "right", pad: 8 },
        { type: "callout", from: L(s6.word("verified")) - 0.05, to: length + 0.5, box: c.verified, label: "Change verified", side: "top", tone: "ok", pad: 6 },
        { type: "lowerThird", from: 0.4, to: L(s6.word("audit")) - 0.3, title: "Workflow operations", detail: "The record behind Maya's new IT case" },
      ],
      outT: { type: "wipe", dur: 24 },
    });
    t = start + length;
  }

  // ---------- 8. Result: the in-app evaluation, then the release gate ----------
  const resultStart = t - 24 / FPS;
  const s7 = say(7, resultStart + 0.6);
  const s8 = say(8, s7.end + 0.4);
  {
    const start = resultStart;
    const click = ev("05-evaluation", "click", "evaluation");
    const e = ev("05-evaluation", "mark", "eval");
    const mv = (label) => ev("05-evaluation", "move-start", label);
    const c = ch["05-evaluation"];
    const L = (s) => s - start;
    const length = L(s8.word("release")) - 0.05;
    shot({
      id: "evaluation", chapter: "05-evaluation", start, srcIn: click.frame - f(0.35), srcOut: c.frames - 1, length,
      inT: { type: "wipe", dur: 24 },
      pins: [[click.frame, 0.35], [mv("task").frame, L(s7.word("103")) - 0.45], [mv("heldOut").frame, L(s7.word("39")) - 0.45], [mv("voice").frame, L(s7.word("passed")) + 0.1], [mv("safety").frame, L(s8.word("unsafe")) - 0.5]],
      keys: [
        { at: 0, z: 1.08, focus: { x: 1100, y: 470 }, dur: 0 },
        { at: 0.6, z: 1.32, focus: { x: 1100, y: 360 }, dur: 1.0 },
        { at: L(s7.word("103")) - 0.3, z: 1.62, focus: { x: centre(e.task).x + 80, y: centre(e.task).y + 30 }, dur: 0.7 },
        { at: L(s7.word("39")) - 0.3, z: 1.62, focus: { x: centre(e.heldOut).x + 80, y: centre(e.heldOut).y + 30 }, dur: 0.7 },
        { at: L(s7.word("passed")) + 0.2, z: 1.62, focus: { x: centre(e.voice).x + 40, y: centre(e.voice).y + 30 }, dur: 0.7 },
        { at: L(s8.word("unsafe")) - 0.45, z: 1.55, focus: { x: centre(e.safety).x + 160, y: centre(e.safety).y - 10 }, dur: 0.75 },
      ],
      overlays: [
        { type: "callout", from: L(s7.word("103")) - 0.05, to: L(s7.word("39")) - 0.35, box: e.task, label: "103 / 110 fully right", side: "bottom", tone: "ok", pad: 6 },
        { type: "callout", from: L(s7.word("39")) - 0.05, to: L(s7.word("passed")) + 0.15, box: e.heldOut, label: "39 / 42 never-seen requests", side: "bottom", tone: "ok", pad: 6 },
        { type: "callout", from: L(s7.word("passed")) + 0.45, to: L(s8.word("unsafe")) - 0.5, box: e.voice, label: "31 / 34 spoken requests answered usefully", side: "bottom", tone: "ok", pad: 6 },
        { type: "callout", from: L(s8.word("unsafe")) - 0.1, to: length + 0.5, box: e.safety, label: "0 unsafe actions in 21 red-team runs", side: "bottom", tone: "ok", pad: 6 },
        { type: "lowerThird", from: 0.4, to: L(s7.word("103")) - 0.2, title: "Agent evaluation", detail: "Measured end to end on the real app" },
      ],
      outT: { type: "whip", dur: 24, dir: "up" },
    });
    t = f(start + length) / FPS;
  }
  {
    const start = t - 24 / FPS;
    const length = s8.end + 0.75 - start;
    const at = (s) => f(s - start);
    // `npm run evaluate:gate`: real output at its recorded timing (npm's own echo lines omitted),
    // entered so the results print on "gate".
    const run = terminal.gate;
    const lines = run.lines.slice(run.lines.findIndex((l) => l.text.startsWith("Evaluation gate")));
    const command = "npm run evaluate:gate";
    const msToFrames = (ms) => Math.round((ms / 1000) * FPS);
    const entered = at(s8.word("gate")) - msToFrames(lines[0].ms);
    const typeFrom = Math.round(entered - 8 - command.length * 1.6);
    push({
      id: "gate", kind: "terminal", from: f(start), duration: span(start, length),
      in: { type: "whip", dur: 24, dir: "up" }, out: { type: "blurDissolve", dur: 26 },
      props: { title: "relay — zsh", prompt: "~/relay $", command, typeFrom: Math.max(4, typeFrom), lines: lines.map((l) => ({ text: l.text, at: msToFrames(l.ms) })) },
    });
    t = start + length;
  }

  // ---------- 9. End card ----------
  const endStart = t - 26 / FPS;
  push({ id: "end", kind: "endcard", from: f(endStart), duration: span(endStart, 3.4), impact: meta.impact, link: meta.link, in: { type: "blurDissolve", dur: 26 } });
  t = endStart + 3.4;

  // Poster: the reply prepared and waiting for Maya's confirmation.
  const posterFrame = ev("02-reply", "mark", "proposal").frame + f(0.3);
  return {
    poster: { video: video("02-reply"), frame: posterFrame },
    syncs,
    scenes,
    audio,
    captions: extraCaptions,
    durationInFrames: f(t),
    tracker: { from: f(journeyStart) + 30, to: f(journeyEnd) - 10, steps },
    chapters: [
      { name: "Cold open", at: 0 },
      { name: "Problem", at: homeStart },
      { name: "Journey", at: journeyStart },
      { name: "Under the hood", at: cardStart },
      { name: "Result", at: resultStart },
    ],
  };
}
