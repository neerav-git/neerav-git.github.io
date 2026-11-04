// TraceLens v4 (script signed off 2026-11-01, projects/tracelens/script-v4.md): the Nature Medicine
// finding, the research question, one HealthBench case answered by Gemma 3 4B, Vega's check and the
// disclosed reconsideration, the workspace, and the measured results.
// Times are seconds; the designed scenes take cue frames relative to their own first frame (`t`).
// Capture event names are the labels logged by capture/journeys/tracelens.mjs.
import path from "node:path";
import { f, FPS, captureShot, event, loadNarration } from "../planner.mjs";

export const meta = {
  slug: "tracelens",
  take: 1,
  palette: { accent: "#3b82f6", accent2: "#e8552b", deep: "#0b0d11", ink: "#ffffff", muted: "rgba(255,255,255,0.68)", warn: "#f5a524", ok: "#22a06b" },
  tagline: "A safety and evaluation workspace for health chatbots",
  impact: "0.36 s per message",
  // Same warmth on the narration stem as Relay (approved A/B, 2026-10-30).
  narrationEq: "bass=g=1.75:f=200:w=0.7,treble=g=-1.5:f=6500:w=0.7",
  link: "neerav-git.github.io/projects/tracelens",
  runtime: [140, 200], // approved script times at about 2:40; the named datasets add about 7 s, the training scene about 19 s
  // Its own bed, so the films don't blend: A minor (i–VI–iv–VII) at 72 bpm, a slow soft bell on
  // quarter notes instead of Relay's plucked 8ths, and no kick anywhere.
  music: {
    seed: 23,
    bpm: 72,
    root: 45,
    progression: [
      [0, 3, 7, 10, 14], // Am9
      [-4, 0, 3, 7, 10], // Fmaj9
      [-7, -4, 0, 3, 7], // Dm9
      [-2, 2, 5, 7, 12], // G6/9
    ],
    arp: { rate: 1, pattern: [0, 2, 4, 1, 3, 2], octave: 24, timbre: "bell", decay: 0.55, attack: 0.012 },
    layers: {
      "The problem": { pad: 0.75, arp: 0, kick: 0, bright: 0.25 },
      "The study": { pad: 0.8, arp: 0.35, kick: 0, bright: 0.35 },
      TraceLens: { pad: 0.85, arp: 0.8, kick: 0, bright: 0.55 },
      Workspace: { pad: 0.85, arp: 0.9, kick: 0, bright: 0.6 },
      Results: { pad: 0.95, arp: 0.7, kick: 0, bright: 0.6 },
      Close: { pad: 1, arp: 0.5, kick: 0, bright: 0.5 },
      // The end card: a fuller, brighter home chord as the bed resolves.
      End: { pad: 1.25, arp: 0.3, kick: 0, bright: 0.7 },
    },
    resolveOnEnd: true,
  },
};

// Frames covered by [start, start + length), so adjacent scenes tile exactly.
const span = (start, length) => f(start + length) - f(start);
const DISSOLVE = 26;
const dissolve = { type: "blurDissolve", dur: DISSOLVE };

// Scroll (px) inside the chat window that frames "Prompt Care" through "Hydrate them" together.
const CARE_SCROLL = 2380;

export function build({ journey, say, video }) {
  const ch = journey.chapters;
  const narration = loadNarration(path.resolve(journey.dir, "../../../../.."), "tracelens").sentences;
  // Even pacing (user note, 2026-11-01): sentences are placed by their spoken words, with GAP s of
  // silence inside a beat; a beat's first words start LEAD s into its scene, and the scene ends
  // TAIL s after its last words (about 0.57 s of silence across each dissolve).
  const GAP = 0.45;
  const LEAD = 0.45;
  const TAIL = 0.55;
  const speak = (i, at) => {
    const w = narration[i].words;
    const s = say(i, at - (w[0].start - narration[i].start));
    return { ...s, speechStart: at, speechEnd: at + (w.at(-1).end - w[0].start) };
  };
  const then = (i, prev) => speak(i, prev.speechEnd + GAP);
  const lead = (i, start) => speak(i, start + LEAD);
  const ev = (c, action, label, n) => event(ch[c], action, label, n);
  const scenes = [];
  const push = (scene) => {
    scenes.push(scene);
    return scene;
  };
  let t = 0;
  // A designed scene from `start` for `length` seconds; `cues(at)` returns its `t` props, where
  // at(seconds) converts film time to scene frames.
  const designed = (id, kind, start, length, cues, extra = {}) => {
    const at = (s) => f(s - start);
    push({ id, kind, from: f(start), duration: span(start, length), in: dissolve, out: dissolve, t: cues(at), ...extra });
    t = start + length;
  };
  const next = () => t - DISSOLVE / FPS;

  // ---------- 1. The Nature Medicine study ----------
  {
    const s0 = speak(0, 0.6);
    designed("paper", "paper", 0, s0.speechEnd + TAIL, (at) => ({
      scroll: [at(0.2), at(s0.word("undertriaged")) - 6],
      mark: [at(s0.word("undertriaged")), at(s0.word("emergencies")) + 20],
      card: at(s0.word("often")) - 8,
    }), { in: undefined });
  }

  // ---------- 2. Scale ----------
  {
    const start = next();
    const s1 = lead(1, start);
    designed("scale", "scale", start, s1.speechEnd + TAIL - start, (at) => ({ count: at(s1.start), red: at(s1.word("consequential")) - 10 }));
  }

  // ---------- 3. The research question ----------
  const studyStart = next();
  {
    const start = studyStart;
    const s2 = lead(2, start);
    const s3 = then(3, s2);
    designed("question", "question", start, s3.speechEnd + TAIL - start, (at) => ({
      chatbot: at(s2.word("chatbots")) - 8,
      miss: at(s2.word("miss")) - 4,
      unclear: at(s2.word("dont")) - 4,
      patient: at(s2.word("patient")) - 8,
      question: at(s3.speechStart) - 10,
      reduce: at(s3.word("reduce")) - 4,
      make: at(s3.word("make")) - 4,
    }));
  }

  // ---------- 4–5. The HealthBench case and Gemma 3 4B's first answer ----------
  {
    const start = next();
    const s4 = lead(4, start);
    const s5 = then(5, s4);
    const s6 = then(6, s5);
    designed("case", "case", start, s6.speechEnd + TAIL - start, (at) => ({
      card: [0, 20],
      fold: [at(s5.start) - 10, at(s5.start) + 26],
      chatIn: [at(s5.start) - 10, at(s5.start) + 26],
      typed: [at(s5.start) + 14, at(s5.speechEnd) - 10],
      streamed: [at(s6.start), at(s6.word("calls"))],
      scroll: [{ at: at(s6.word("hydration")) - 24, to: CARE_SCROLL, dur: 30 }],
      marks: [
        { phrase: "Heat Exhaustion:", at: at(s6.word("heat")) },
        { phrase: "This is the most likely explanation.", at: at(s6.word("exhaustion")) },
        { phrase: "Hydrate them:", at: at(s6.word("hydration")) + 6 },
        { phrase: "Prompt Care (Within 1-2 hours):", at: at(s6.word("unclear")) },
        { phrase: "If your friend loses consciousness", at: at(s6.word("instructions")) },
      ],
    }));
  }

  // ---------- 6. The physician's label and the gap ----------
  {
    const start = next();
    const s7 = lead(7, start);
    const s8 = then(8, s7);
    // Half a second more before "TraceLens": the turn from the problem to the product (user note, 2026-11-01).
    designed("verdict", "verdict", start, s8.speechEnd + TAIL + 0.5 - start, (at) => ({ p: at(s7.start), gap: at(s8.word("gap")) - 6 }));
  }

  // ---------- 7. TraceLens, and one message read by two models ----------
  const introStart = next();
  {
    const start = introStart;
    const s9 = lead(9, start);
    const s10 = then(10, s9);
    const s11 = then(11, s10);
    designed("intro", "intro", start, s11.speechEnd + TAIL - start, (at) => ({
      figA: at(s9.word("safety")),
      figB: at(s9.word("scratch")),
      fork: at(s10.word("pairs")),
      jev: at(s10.word("typesafe")) - 10,
      reads: at(s11.word("reads")) - 4,
      check: at(s11.word("emergency")) - 6,
      drift: [at(s10.word("pairs")) + 30, at(s11.speechEnd + TAIL)],
    }));
  }

  // ---------- 8–11. One example in one window (user note, 2026-11-01): Gemma writes for a median
  // 67 s while Vega decides in 0.36 s; they disagree; the flag, the kept answer and the
  // reconsideration appear in the same chat; then the same window shows failing transparently.
  {
    const start = next();
    const s12 = lead(12, start);
    const s13 = then(13, s12);
    const s14 = then(14, s13);
    const s15 = then(15, s14);
    const s16 = then(16, s15);
    designed("example", "example", start, s16.speechEnd + TAIL - start, (at) => ({
      writing: at(s12.start),
      vega: at(s12.word("vega")),
      answer: at(s12.word("word")) + 4,
      gauge: at(s13.word("emergency")),
      tag: at(s13.word("disagree")),
      stamp: at(s13.word("tests")),
      banner: at(s14.word("flag")),
      collapse: at(s14.word("visible")),
      revision: [at(s14.word("reconsiders")), at(s14.word("reconsiders")) + f(4.2)],
      receipt: at(s14.word("reconsiders")) + f(1.6),
      shrink: at(s15.start) - 10,
      generic: at(s16.word("generic")) - 6,
      dim: at(s16.word("specific")),
      flag: at(s16.word("specific")),
      tick: at(s16.word("act")),
    }));
  }

  // ---------- 12. The workspace: the model ladder, then a saved case opened from a real run ----------
  const workspaceStart = next();
  {
    const shot = ({ id, chapter, start, srcIn, srcOut, length, keys, overlays = [], inT, outT }) => {
      const s = captureShot({
        id,
        chapter: ch[chapter],
        video: video(chapter),
        anchors: [[0, srcIn], [span(start, length), srcOut]],
        keys: keys.map((k) => ({ ...k, frame: f(k.at), dur: f(k.dur ?? 0.75) })),
        overlays: overlays.map((o) => ({ ...o, from: f(o.from), to: f(o.to) })),
      });
      return push({ ...s, from: f(start), in: inT, out: outT });
    };
    const start = workspaceStart;
    const s17 = lead(17, start);
    // B, under "The workspace is built to test": a saved Gemma 3 4B answer to a stroke case (run
    // BR-20261020T073945Z-005), read as under-escalated. Framed above the "Not collected" panel.
    const lenB = s17.word("several") - 0.15 - start;
    shot({
      id: "saved-case", chapter: "03-answer", start, srcIn: ev("03-answer", "scroll-end", "verdict").frame - 4, srcOut: ch["03-answer"].frames - 1, length: lenB,
      keys: [
        { at: 0, z: 2.5, focus: { x: 1160, y: 630 }, dur: 0 },
        { at: 0.1, z: 2.6, focus: { x: 1170, y: 620 }, dur: lenB - 0.1 },
      ],
      overlays: [{ type: "lowerThird", from: 0.4, to: lenB - 0.1, title: "TraceLens workspace", detail: "A saved Gemma 3 4B answer to a stroke case, read as under-escalated" }],
      inT: dissolve,
      outT: { type: "blurDissolve", dur: 15 },
    });
    t = start + lenB;
    // A, under "several models side by side … OLMo": the ladder of tested models.
    const startA = t - 15 / FPS;
    const lenA = s17.speechEnd + TAIL - startA;
    shot({
      id: "models", chapter: "01-models", start: startA, srcIn: ev("01-models", "scroll-start", "ladder").frame, srcOut: ev("01-models", "mark", "compute").frame + f(0.5), length: lenA,
      keys: [
        // Framed on the ladder and the study-set titles, above the lower cards' run status lines.
        { at: 0, z: 2.25, focus: { x: 830, y: 300 }, dur: 0 },
        { at: 0.2, z: 2.4, focus: { x: 840, y: 288 }, dur: lenA - 0.2 },
      ],
      inT: { type: "blurDissolve", dur: 15 },
      outT: dissolve,
    });
    t = startA + lenA;
  }

  // ---------- 12b. How Vega was trained (user note, 2026-11-02): the 146 real out-of-fold scores, beside the live Vega experiment page ----------
  const resultStart = next();
  {
    const start = resultStart;
    const s18 = lead(18, start);
    const s19 = then(19, s18);
    designed("training", "training", start, s19.speechEnd + TAIL - start, (at) => ({
      win: at(s18.start) - 12,
      pan: at(s19.word("146")) - 10,
      push: at(s19.word("call")) - 6,
      qwen: at(s18.word("qwen")) - 4,
      classifier: at(s18.word("classifier")) - 4,
      dots: at(s18.word("qwen")) + 10, // the message cloud fills the left half while Qwen is named
      data: at(s19.word("146")) - 4,
      learn: [at(s19.word("learned")), at(s19.word("call"))],
      line: at(s19.word("call")),
      note: at(s19.word("emergency")),
    }));
  }

  // ---------- 13. Vega picks the emergency 97 times out of 100 ----------
  {
    const start = next();
    const s20 = lead(20, start);
    designed("pick", "pick", start, s20.speechEnd + TAIL - start, (at) => {
      const result = at(s20.word("times"));
      return { cards: at(s20.start), shuffle: [at(s20.word("one")), at(s20.word("97"))], result, flagged: at(s20.word("100")) };
    });
  }

  // ---------- 14. Vega against the chatbot over 277 saved cases ----------
  {
    const start = next();
    const s21 = lead(21, start);
    // The final-answer bar and the tick land just after the sentence (47 of 70, shown, not spoken).
    const done = s21.speechEnd + 0.1;
    designed("loop", "loop", start, done + 0.9 + TAIL - start, (at) => ({
      sources: at(s21.word("four")) - 6,
      healthbench: at(s21.word("healthbench")),
      nature: at(s21.word("nature")),
      vega: at(s21.word("79")) - 4,
      first: at(s21.word("56")) - 4,
      final: at(done),
      alarms: at(done) + 12,
      tick: at(done) + 20,
    }));
  }

  // ---------- 15. The proposed system ----------
  const closeStart = next();
  {
    const start = closeStart;
    const s22 = lead(22, start);
    const s23 = then(23, s22);
    // The setup for the closing line (user-approved 2026-11-01): back to the person asking.
    const s24 = then(24, s23);
    designed("layer", "layer", start, s24.speechEnd + TAIL - start, (at) => ({
      lanes: 0,
      ticks: [at(s22.start) + 20, at(s22.start) + 45],
      strip: at(s22.word("tracelens")) - 6,
      steps: [at(s22.word("testing")), at(s22.word("safety")), at(s22.word("evaluation"))],
      layer: at(s23.word("propose")),
      flow: at(s23.word("decision")),
      flag: at(s23.word("transparency")),
      flow2: at(s24.word("asks")),
      pulse: at(s24.word("checked")),
      drift: [at(s23.word("transparency")), at(s24.speechEnd + TAIL)],
    }));
  }

  const endStart = next();
  // The closing line over the end card: each goal ticks as it is said; then the bed resolves and
  // the card fades (user notes, 2026-11-01).
  const s25 = lead(25, endStart);
  const endLen = s25.speechEnd + 2.4 - endStart;
  const atEnd = (s) => f(s - endStart);
  push({ id: "end", kind: "endcard", from: f(endStart), duration: span(endStart, endLen), impact: meta.impact, link: meta.link, in: dissolve, goals: [atEnd(s25.word("reduce")) - 4, atEnd(s25.word("make")) - 4] });
  t = endStart + endLen;

  return {
    poster: { video: video("01-models"), frame: ev("01-models", "mark", "study-set").frame },
    scenes,
    durationInFrames: f(t),
    chapters: [
      { name: "The problem", at: 0 },
      { name: "The study", at: studyStart },
      { name: "TraceLens", at: introStart },
      { name: "Workspace", at: workspaceStart },
      { name: "Results", at: resultStart },
      { name: "Close", at: closeStart },
    ],
  };
}
