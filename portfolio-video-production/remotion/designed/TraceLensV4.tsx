// TraceLens v4 scenes (script signed off 2026-11-01). Every number and quoted text is real: the
// Nature Medicine page is a still of the open-access article, chat text comes from the saved Gemma
// 3 4B runs (tracelens-case.json), and the charts use the counts on the site's figures. Props named
// `t` hold frame numbers relative to the scene's first frame.
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { alpha, EASE, FONT, MONO } from "../lib/theme";
import paper from "../../projects/tracelens/captures/paper/paper.json";
import kase from "./tracelens-case.json";
import oof from "./tracelens-vega-oof.json";
import vega from "../../projects/tracelens/captures/vega/vega.json";
import { AnswerBody, AssistantMeta, BANNER, CHATBOT, EMERGENCY, IllustrativeChip, INK, Receipt, SUB, TRACELENS, UserBubble, VEGA, Window, clamp01, ease, type Highlight } from "./TraceLens";

const OK = "#22a06b";
const AMBER = "#f5a524";
const MUTED = "rgba(255,255,255,0.7)";
const ramp = (frame: number, a: number, b: number) => clamp01((frame - a) / Math.max(1, b - a));
const eased = (frame: number, a: number, b: number) => EASE.enter(ramp(frame, a, b));
const camera = (frame: number, a: number, b: number) => EASE.camera(ramp(frame, a, b));

// The τ tile from the TraceLens workspace header, and the product name beside it.
export const TraceLensMark: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.24, background: "#1f2630", border: "1.5px solid rgba(255,255,255,0.22)", display: "grid", placeItems: "center", color: "#fff", fontFamily: "Georgia, serif", fontSize: size * 0.62, fontWeight: 700, boxShadow: `0 18px 50px ${alpha(VEGA, 0.35)}` }}>τ</div>
);

const Credit: React.FC<{ text: string; opacity?: number; bottom?: number }> = ({ text, opacity = 1, bottom = 40 }) => (
  <div style={{ position: "absolute", left: 96, bottom, padding: "10px 20px", borderRadius: 999, background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.85)", fontFamily: FONT, fontSize: 28, opacity }}>{text}</div>
);

// ---------- 1. The paper: masthead → abstract, the 52% clause highlighted, then the stat ----------
export const PaperScene: React.FC<{ t: { scroll: [number, number]; mark: [number, number]; card: number } }> = ({ t }) => {
  const frame = useCurrentFrame();
  const W = 1920;
  const H = paper.height;
  const rects = paper.rects as { x: number; y: number; width: number; height: number }[];
  const top = rects[0].y;
  const bottom = rects.at(-1)!.y + rects.at(-1)!.height;
  const s = camera(frame, t.scroll[0], t.scroll[1]);
  // Scrolls only if the still is taller than the frame, then pushes in on the highlighted clause.
  const scrollTo = Math.max(0, Math.min(H - 1080, (top + bottom) / 2 - 470));
  const z = 1 + 0.45 * s;
  const y = scrollTo * s;
  const focusY = (top + bottom) / 2 - y;
  const mark = ramp(frame, t.mark[0], t.mark[1]);
  const total = rects.reduce((n, r) => n + r.width, 0);
  const card = eased(frame, t.card, t.card + 22);
  let before = 0;
  return (
    <AbsoluteFill style={{ background: "#fff", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${z})`, transformOrigin: `700px ${focusY}px`, filter: `blur(${10 * card}px)` }}>
        <div style={{ position: "absolute", left: 0, top: -y, width: W, height: H }}>
          <Img src={staticFile("tracelens/paper.png")} style={{ width: W, height: H, display: "block" }} />
          {rects.map((r, i) => {
            const share = clamp01((mark * total - before) / r.width);
            before += r.width;
            return <div key={i} style={{ position: "absolute", left: r.x - 3, top: r.y - 2, width: (r.width + 6) * EASE.enter(share), height: r.height + 5, background: "rgba(255, 214, 10, 0.45)", mixBlendMode: "multiply", borderRadius: 3 }} />;
          })}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(8,10,14,${0.88 * card})` }} />
      {card > 0 ? (
        <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", fontFamily: FONT, color: "#fff", opacity: card, transform: `translateY(${(1 - card) * 24}px)` }}>
          <div style={{ fontSize: 210, fontWeight: 800, letterSpacing: -6, lineHeight: 1, color: "#fff" }}>52%</div>
          <div style={{ fontSize: 56, fontWeight: 700, marginTop: 18 }}>of true emergencies under-triaged</div>
          <div style={{ fontSize: 36, color: MUTED, marginTop: 18 }}>33 of 64 · mostly sent to a doctor within 24–48 hours</div>
        </AbsoluteFill>
      ) : null}
      {/* A dark strip under the credit so it never sits on the abstract's text. */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 150, background: `linear-gradient(rgba(8,10,14,0), rgba(8,10,14,${0.75 * (1 - card)}))` }} />
      <Credit text="Ramaswamy et al., Nature Medicine 2026 · open access, CC BY 4.0" />
    </AbsoluteFill>
  );
};

// ---------- 2. Scale: health questions arriving, 230 million a week ----------
const BUBBLES = Array.from({ length: 48 }, (_, i) => {
  const col = i % 8;
  const row = Math.floor(i / 8);
  const r = Math.sin(i * 12.9898) * 43758.5453;
  const j = r - Math.floor(r);
  return { x: 70 + col * 228 + (row % 2) * 60 + j * 30, y: 60 + row * 170 + j * 26, w: 150 + j * 70, lines: 2 + (i % 2), at: Math.round(j * 40 + row * 4) };
});
export const ScaleScene: React.FC<{ t: { count: number; red: number } }> = ({ t }) => {
  const frame = useCurrentFrame();
  const counter = eased(frame, t.count, t.count + 50);
  const red = eased(frame, t.red, t.red + 14);
  const hero = 27;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop palette={TRACELENS} parallax={{ x: 0, y: -frame * 0.08, s: 1 }} />
      {BUBBLES.map((b, i) => {
        const p = eased(frame, b.at, b.at + 20);
        const isHero = i === hero;
        const tone = isHero ? EMERGENCY : "#ffffff";
        return (
          <div key={i} style={{ position: "absolute", left: b.x, top: b.y - frame * 0.25, width: b.w, padding: "16px 18px", borderRadius: 18, background: isHero ? alpha(EMERGENCY, 0.08 + 0.25 * red) : "rgba(255,255,255,0.06)", border: `1.5px solid ${isHero ? alpha(EMERGENCY, 0.2 + 0.8 * red) : "rgba(255,255,255,0.12)"}`, opacity: p * (isHero ? 1 : 1 - 0.55 * red), transform: `scale(${0.85 + 0.15 * p + (isHero ? 0.25 * red : 0)})`, boxShadow: isHero ? `0 0 ${60 * red}px ${alpha(EMERGENCY, 0.6 * red)}` : "none" }}>
            {Array.from({ length: b.lines }, (_, k) => (
              <div key={k} style={{ height: 10, borderRadius: 5, marginTop: k ? 10 : 0, width: `${k === b.lines - 1 ? 60 : 100}%`, background: alpha(tone, isHero ? 0.6 : 0.22) }} />
            ))}
          </div>
        );
      })}
      <AbsoluteFill style={{ background: "radial-gradient(52% 44% at 50% 52%, rgba(8,10,14,0.88), rgba(8,10,14,0.2))" }} />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "#fff", opacity: eased(frame, t.count - 10, t.count + 14) }}>
        <div style={{ fontSize: 176, fontWeight: 800, letterSpacing: -5, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{Math.round(230 * counter)} million</div>
        <div style={{ fontSize: 46, fontWeight: 600, marginTop: 24, color: "rgba(255,255,255,0.9)" }}>people ask ChatGPT health questions every week</div>
      </AbsoluteFill>
      <Credit text="OpenAI, ChatGPT Health launch · January 2026" />
    </AbsoluteFill>
  );
};

// ---------- 3 & 15. The research question and its two lanes ----------
const Tick: React.FC<{ p: number; color: string }> = ({ p, color }) => (
  <div style={{ width: 64, height: 64, borderRadius: 16, border: `3px solid ${alpha(color, 0.9)}`, background: alpha(color, 0.9 * ease(p)), display: "grid", placeItems: "center" }}>
    <svg width={40} height={40} viewBox="0 0 40 40"><path d="M9 21 l7 7 l15 -16" stroke="#fff" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(p)} /></svg>
  </div>
);
export const Lanes: React.FC<{ show: number; ticks: [number, number]; notes?: [string, string]; compact?: boolean }> = ({ show, ticks, notes, compact }) => {
  const lane = (label: string, color: string, i: number) => (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 28, padding: compact ? "26px 32px" : "34px 40px", borderRadius: 24, background: alpha(color, 0.12), border: `2px solid ${alpha(color, 0.7)}`, opacity: ease(show * 2 - i), transform: `translateY(${(1 - ease(show * 2 - i)) * 30}px)` }}>
      <Tick p={ticks[i]} color={color} />
      <div>
        <div style={{ fontSize: compact ? 42 : 50, fontWeight: 800, color: "#fff" }}>{label}</div>
        {notes ? <div style={{ fontSize: 30, color: MUTED, marginTop: 6, opacity: ease(ticks[i]) }}>{notes[i]}</div> : null}
      </div>
    </div>
  );
  return (
    <div style={{ display: "flex", gap: 48, width: "100%" }}>
      {lane("Reduce under-triage", CHATBOT, 0)}
      {lane("Make failures transparent", VEGA, 1)}
    </div>
  );
};
// The gap as a schematic: a health question goes to a general-purpose chatbot, and the answer
// reaches the patient either missing the emergency or stating it unclearly. Then the question.
const Node: React.FC<{ x: number; y: number; w: number; p: number; color: string; title: string; sub?: string }> = ({ x, y, w, p, color, title, sub }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, padding: "24px 28px", boxSizing: "border-box", borderRadius: 22, background: alpha(color, 0.14), border: `2px solid ${alpha(color, 0.8)}`, opacity: ease(p), transform: `translateY(${(1 - ease(p)) * 18}px) scale(${0.96 + 0.04 * ease(p)})` }}>
    <div style={{ fontSize: 38, fontWeight: 800, color: "#fff", lineHeight: 1.15 }}>{title}</div>
    {sub ? <div style={{ fontSize: 28, color: MUTED, marginTop: 8, lineHeight: 1.3 }}>{sub}</div> : null}
  </div>
);
const Person: React.FC<{ x: number; y: number; p: number }> = ({ x, y, p }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 150, textAlign: "center", opacity: ease(p), transform: `translateY(${(1 - ease(p)) * 14}px)` }}>
    <svg width={96} height={110} viewBox="0 0 96 110" style={{ display: "block", margin: "0 auto" }}>
      <circle cx={48} cy={30} r={22} fill="rgba(255,255,255,0.9)" />
      <path d="M8 108 C8 72 26 60 48 60 C70 60 88 72 88 108 Z" fill="rgba(255,255,255,0.9)" />
    </svg>
    <div style={{ fontSize: 30, color: "#fff", fontWeight: 700, marginTop: 10 }}>The patient</div>
  </div>
);
export const QuestionScene: React.FC<{ t: { chatbot: number; miss: number; unclear: number; patient: number; question: number; reduce: number; make: number } }> = ({ t }) => {
  const frame = useCurrentFrame();
  const r = (a: number, d = 18) => ramp(frame, a, a + d);
  const out = eased(frame, t.question - 8, t.question + 18);
  const q = eased(frame, t.question, t.question + 22);
  const curve = (x1: number, y1: number, x2: number, y2: number, color: string, p: number) => {
    const mx = (x1 + x2) / 2;
    return <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} stroke={color} strokeWidth={4} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(p)} />;
  };
  const mark = (p: number, color: string): React.CSSProperties => ({ whiteSpace: "nowrap", backgroundImage: `linear-gradient(90deg, ${alpha(color, 0.35)} ${ease(p) * 100}%, transparent ${ease(p) * 100}%)`, borderRadius: 6, padding: "0 4px" });
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop palette={TRACELENS} />
      <AbsoluteFill style={{ opacity: 1 - out, transform: `translateY(${-40 * out}px) scale(${1 - 0.04 * out})` }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {curve(470, 540, 700, 540, "rgba(255,255,255,0.6)", r(t.chatbot))}
          {curve(1080, 540, 1210, 330, EMERGENCY, r(t.miss))}
          {curve(1080, 540, 1210, 750, AMBER, r(t.unclear))}
          {curve(1590, 330, 1700, 520, "rgba(255,255,255,0.5)", r(t.patient))}
          {curve(1590, 750, 1700, 560, "rgba(255,255,255,0.5)", r(t.patient))}
        </svg>
        <Node x={90} y={455} w={380} p={r(0, 20)} color="#94a3b8" title="A health question" sub="sent to a chatbot" />
        <Node x={700} y={455} w={380} p={r(t.chatbot)} color={CHATBOT} title="General‑purpose chatbot" />
        <Node x={1210} y={240} w={380} p={r(t.miss)} color={EMERGENCY} title="Misses the emergency" sub="Treated as something that can wait" />
        <Node x={1210} y={660} w={380} p={r(t.unclear)} color={AMBER} title="States it unclearly" sub="Emergency care mentioned only as a condition" />
        <Person x={1690} y={470} p={r(t.patient)} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 150, right: 150, top: 230, opacity: q, transform: `translateY(${(1 - q) * 30}px)` }}>
        <div style={{ fontSize: 72, lineHeight: 1.25, fontWeight: 750, color: "#fff", letterSpacing: -0.5 }}>
          Can a supporting model both <span style={mark(r(t.reduce, 24), CHATBOT)}>reduce under-triage</span> and <span style={mark(r(t.make, 24), VEGA)}>make failures transparent</span> to the end user?
        </div>
      </div>
      <div style={{ position: "absolute", left: 150, right: 150, top: 660 }}>
        <Lanes show={0.5 * ease(r(t.reduce, 24)) + 0.5 * ease(r(t.make, 24))} ticks={[0, 0]} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- 4. HealthBench source card folding into the chat window ----------
export const SourceCard: React.FC<{ p: number; fold: number }> = ({ p, fold }) => {
  const e = ease(p);
  const f = EASE.camera(clamp01(fold));
  return (
    <div style={{ position: "absolute", left: 960 - 560, top: 300, width: 1120, padding: "40px 50px", borderRadius: 28, background: "#141922", border: "2px solid rgba(255,255,255,0.18)", fontFamily: FONT, color: "#fff", opacity: e * (1 - f), transform: `translateY(${(1 - e) * 30 - f * 160}px) scale(${1 - 0.3 * f})`, boxShadow: "0 40px 120px rgba(0,0,0,0.5)" }}>
      <div style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 2, color: alpha(VEGA, 1) }}>PUBLIC BENCHMARK</div>
      <div style={{ fontSize: 76, fontWeight: 800, marginTop: 10 }}>HealthBench</div>
      <div style={{ fontSize: 36, color: MUTED, marginTop: 12, lineHeight: 1.35 }}>A public dataset for benchmarking language models on health questions, with physician labels</div>
    </div>
  );
};

// The question and the first answer in the chat window, with highlights; `card` shows the source first.
export const CaseChat: React.FC<{ typed: number; streamed: number; scroll: number; highlights?: Highlight[]; card?: [number, number]; chatIn?: number }> = ({ typed, streamed, scroll, highlights = [], card, chatIn = 1 }) => {
  const text: string = kase.firstAnswer;
  const shown = text.slice(0, Math.round(text.length * clamp01(streamed)));
  const c = ease(chatIn);
  return (
    <AbsoluteFill>
      <Backdrop palette={TRACELENS} />
      <AbsoluteFill style={{ opacity: c, transform: `scale(${0.94 + 0.06 * c})` }}>
        <Window>
          <div style={{ transform: `translateY(${-scroll}px)` }}>
            <UserBubble typed={typed} />
            {streamed > 0 ? (
              <div style={{ padding: "30px 40px 60px", maxWidth: 1120 }}>
                <AssistantMeta label="Assistant" />
                <AnswerBody text={shown} highlights={highlights} />
              </div>
            ) : null}
          </div>
        </Window>
        <IllustrativeChip />
      </AbsoluteFill>
      {card ? <SourceCard p={card[0]} fold={card[1]} /> : null}
    </AbsoluteFill>
  );
};

// ---------- 7. TraceLens over the site figures, then the fork: one message, two readers ----------
export const IntroScene: React.FC<{ t: { figA: number; figB: number; fork: number; jev: number; reads: number; check: number; drift: [number, number] } }> = ({ t }) => {
  const frame = useCurrentFrame();
  const mark = eased(frame, 0, 20);
  const figA = ramp(frame, t.figA, t.figB);
  const figB = ramp(frame, t.figB, t.fork);
  const fork = eased(frame, t.fork, t.fork + 30);
  const jev = eased(frame, t.jev, t.jev + 18);
  // "Vega reads only the person's message…": the chatbot branch steps back, a pulse runs to Vega.
  const reads = eased(frame, t.reads, t.reads + 18);
  const pulse = ramp(frame, t.reads + 4, t.reads + 40);
  const check = eased(frame, t.check, t.check + 20);
  const drift = EASE.camera(ramp(frame, t.drift[0], t.drift[1]));
  const fig = (src: string, p: number, show: boolean) => (show ? (
    <div style={{ position: "absolute", left: 360, top: 220, width: 1200, height: 700, borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,0.55)", opacity: ease(clamp01(p * 4)) * (1 - ease(clamp01((p - 0.85) * 6.6))) }}>
      <Img src={staticFile(src)} style={{ width: 1200, transform: `translateY(${-p * 260}px) scale(${1.02 + 0.04 * p})`, transformOrigin: "50% 0" }} />
    </div>
  ) : null);
  const path_ = (y2: number) => {
    const x1 = 600, y1 = 560, x2 = 820;
    const mx = (x1 + x2) / 2;
    return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
  };
  const line = (y2: number, color: string, dim = 0) => <path d={path_(y2)} stroke={color} strokeWidth={4} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - fork} opacity={1 - 0.65 * dim} />;
  // Point on the Vega branch's cubic at progress u (for the pulse).
  const onVega = (u: number) => {
    const [x1, y1, x2, y2] = [600, 560, 820, 730];
    const mx = (x1 + x2) / 2;
    const b = (a: number, c1: number, c2: number, d: number) => (1 - u) ** 3 * a + 3 * (1 - u) ** 2 * u * c1 + 3 * (1 - u) * u * u * c2 + u ** 3 * d;
    return [b(x1, mx, mx, x2), b(y1, y1, y2, y2)];
  };
  const card = (y: number, color: string, title: string, sub: string, extra?: React.ReactNode, o: { dim?: number; subIn?: number; glow?: number } = {}) => (
    <div style={{ position: "absolute", left: 820, top: y, width: 900, padding: "30px 38px", borderRadius: 24, boxSizing: "border-box", background: `rgba(255,255,255,${0.05 + 0.04 * (o.glow ?? 0)})`, border: `2px solid ${alpha(color, 0.8 + 0.2 * (o.glow ?? 0))}`, boxShadow: `0 0 ${60 * (o.glow ?? 0)}px ${alpha(color, 0.45 * (o.glow ?? 0))}`, opacity: fork * (1 - 0.6 * (o.dim ?? 0)), transform: `translateX(${(1 - fork) * 30}px)` }}>
      <div style={{ fontSize: 46, fontWeight: 800, color: "#fff" }}>{title}</div>
      {/* A line held back for its narration opens the card as it appears (no empty gap before). */}
      <div style={{ overflow: "hidden", maxHeight: o.subIn === undefined ? undefined : 90 * o.subIn }}>
        <div style={{ fontSize: 32, color: MUTED, marginTop: 6, opacity: o.subIn ?? 1 }}>{sub}</div>
      </div>
      {extra}
    </div>
  );
  const [px, py] = onVega(EASE.camera(pulse));
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop palette={TRACELENS} />
      <div style={{ position: "absolute", left: 96, top: 70, display: "flex", alignItems: "center", gap: 22, opacity: mark }}>
        <TraceLensMark size={76} />
        <div style={{ fontSize: 60, fontWeight: 800, color: "#fff", letterSpacing: -1 }}>TraceLens</div>
        <div style={{ fontSize: 30, color: MUTED, marginLeft: 18, opacity: 1 - fork }}>Safety and evaluation workspace · built from scratch</div>
      </div>
      {fig("tracelens/evaluation-dashboard-showcase.png", figA, frame < t.figB + 2)}
      {fig("tracelens/architecture.png", figB, frame >= t.figB - 2 && frame < t.fork + 4)}
      {fork > 0 ? (
        <AbsoluteFill style={{ transform: `scale(${1 + 0.06 * drift})`, transformOrigin: "760px 600px" }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {line(330, CHATBOT, reads)}
            {line(730, VEGA)}
            {pulse > 0 && pulse < 1 ? <circle cx={px} cy={py} r={11} fill="#cfe0ff" style={{ filter: `drop-shadow(0 0 12px ${VEGA})` }} opacity={Math.min(1, pulse * 6, (1 - pulse) * 6)} /> : null}
          </svg>
          <div style={{ position: "absolute", left: 96, top: 420, width: 500, padding: "28px 32px", borderRadius: 24, background: "#2b3140", color: "#fff", opacity: fork, boxSizing: "border-box", border: `2px solid ${alpha(VEGA, 0.85 * reads)}`, boxShadow: `0 0 ${40 * reads}px ${alpha(VEGA, 0.3 * reads)}` }}>
            <div style={{ fontSize: 28, color: "rgba(255,255,255,0.65)" }}>The person's message</div>
            <div style={{ fontSize: 32, lineHeight: 1.4, marginTop: 10 }}>…slurring words… drifting in and out of consciousness…</div>
          </div>
          {card(230, CHATBOT, "Chatbot · Gemma 3 4B", "Writes the answer", undefined, { dim: reads })}
          {card(610, VEGA, "Vega · decision model", "Reads only the person's message and checks it for an emergency", (
            <div style={{ marginTop: 20, display: "inline-block", padding: "8px 18px", borderRadius: 999, background: alpha(VEGA, 0.2), border: `1.5px solid ${alpha(VEGA, 0.9)}`, color: "#dbe7ff", fontSize: 30, fontWeight: 650, opacity: jev, transform: `translateY(${(1 - jev) * 10}px)` }}>Same class as TypeSafe AI's Jev</div>
          ), { subIn: reads, glow: check })}
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- 8–9. The race in one window: Gemma writing, Vega deciding at once; then the gauge ----------
export const RaceChat: React.FC<{ t: { writing: number; vega: number; answer: number; gauge: number; tag: number }; clockTo?: number }> = ({ t, clockTo = 67 }) => {
  const frame = useCurrentFrame();
  const vega = eased(frame, t.vega, t.vega + 10);
  const answered = frame >= t.answer;
  const drop = eased(frame, t.answer, t.answer + 16);
  const gauge = eased(frame, t.gauge, t.gauge + 40);
  const open = eased(frame, t.gauge - 6, t.gauge + 14);
  const tag = eased(frame, t.tag, t.tag + 14);
  const secs = Math.min(clockTo, clockTo * ramp(frame, t.writing, t.answer));
  const score = kase.vega.p * gauge;
  const dots = ".".repeat(1 + (Math.floor(frame / 12) % 3));
  const highlights: Highlight[] = [
    { phrase: "Heat Exhaustion:", p: tag },
    { phrase: "This is the most likely explanation.", p: tag },
  ];
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop palette={TRACELENS} />
      <Window>
        <UserBubble typed={1} />
        {/* Vega's strip: decides as soon as the message is in. */}
        <div style={{ margin: "22px 40px 0", padding: "18px 24px", borderRadius: 18, background: alpha(VEGA, 0.08 + 0.04 * open), border: `2px solid ${alpha(VEGA, 0.35 + 0.5 * vega)}`, opacity: ease(clamp01((frame - t.vega + 8) / 8)) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: INK }}>
            <span style={{ width: 16, height: 16, borderRadius: 8, background: VEGA }} />
            <b>Vega</b>
            <span style={{ color: SUB }}>reads the message</span>
            <span style={{ marginLeft: "auto", fontWeight: 800, color: vega > 0.5 ? EMERGENCY : SUB, opacity: vega }}>Emergency</span>
            <span style={{ fontFamily: MONO, fontSize: 28, color: VEGA, opacity: vega }}>0.36 s</span>
          </div>
          <div style={{ height: interpolate(open, [0, 1], [0, 92]), overflow: "hidden", opacity: open }}>
            <div style={{ position: "relative", height: 24, marginTop: 24, borderRadius: 12, background: alpha(VEGA, 0.14) }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${score * 100}%`, borderRadius: 12, background: VEGA }} />
              <div style={{ position: "absolute", left: `${kase.vega.threshold * 100}%`, top: -10, bottom: -10, width: 4, background: INK }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: MONO, fontSize: 28, color: INK }}>
              <span>score {score.toFixed(2)}</span>
              <span>threshold {kase.vega.threshold.toFixed(3)}</span>
            </div>
          </div>
        </div>
        {/* Gemma: writing with a compressed clock, then the answer lands flagged. */}
        {!answered ? (
          <div style={{ margin: "26px 40px 0", display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: SUB }}>
            <span style={{ width: 16, height: 16, borderRadius: 8, background: CHATBOT }} />
            <span><b style={{ color: INK }}>Gemma 3 4B</b> is writing{dots}</span>
            <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 30, color: CHATBOT }}>{Math.floor(secs)} s</span>
            <span style={{ fontSize: 26, color: SUB }}>median 67 s · time compressed</span>
          </div>
        ) : (
          <div style={{ margin: "26px 40px 0", padding: "18px 24px 24px", borderRadius: 18, border: `3px solid ${alpha(CHATBOT, 0.25 + 0.7 * tag)}`, background: "#fff", opacity: drop, transform: `translateY(${(1 - drop) * 30}px)`, position: "relative", height: 470, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <AssistantMeta label="Gemma 3 4B" color={CHATBOT} />
              <div style={{ marginLeft: "auto", marginBottom: 10, opacity: tag, transform: `scale(${0.92 + 0.08 * tag})`, padding: "6px 16px", borderRadius: 999, background: alpha(AMBER, 0.18), border: `2px solid ${AMBER}`, color: "#7a4a00", fontSize: 27, fontWeight: 750 }}>Disagrees with Vega · possible under-triage</div>
            </div>
            <AnswerBody text={kase.firstAnswer.slice(kase.firstAnswer.indexOf("**Possible Causes"), 1100)} highlights={highlights} size={28} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 90, background: "linear-gradient(rgba(255,255,255,0), #fff)" }} />
          </div>
        )}
      </Window>
      <IllustrativeChip />
    </AbsoluteFill>
  );
};

// ---------- 10–11. The flagged chat, then failing transparently ----------
// The generic disclaimer is quoted from the same Gemma answer; the flag is this case's own.
const DISCLAIMER = "I am an AI Chatbot and not a medical professional. This information is for general knowledge and informational purposes only…";
export const TransparencyPanel: React.FC<{ t: { generic: number; dim: number; flag: number; tick: number } }> = ({ t }) => {
  const frame = useCurrentFrame();
  const generic = eased(frame, t.generic, t.generic + 20);
  const dim = eased(frame, t.dim, t.dim + 24);
  const flag = eased(frame, t.flag, t.flag + 20);
  const tick = ramp(frame, t.tick, t.tick + 18);
  return (
    <div style={{ position: "absolute", left: 1150, top: 150, width: 690, fontFamily: FONT, display: "flex", flexDirection: "column", gap: 30 }}>
      <div style={{ padding: "28px 30px", borderRadius: 22, background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.16)", opacity: generic * (1 - 0.6 * dim), filter: `grayscale(${dim})`, transform: `translateY(${(1 - generic) * 20}px) scale(${1 - 0.04 * dim})` }}>
        <div style={{ fontSize: 28, color: MUTED }}>Generic warning · in the same answer</div>
        <div style={{ fontSize: 31, lineHeight: 1.4, color: "#fff", marginTop: 12, fontStyle: "italic" }}>“{DISCLAIMER}”</div>
        <div style={{ fontSize: 27, color: "rgba(255,255,255,0.55)", marginTop: 12 }}>Says nothing about this answer</div>
      </div>
      <div style={{ padding: "28px 30px", borderRadius: 22, background: alpha(AMBER, 0.14 + 0.08 * flag), border: `2px solid ${alpha(AMBER, 0.4 + 0.6 * flag)}`, opacity: flag, transform: `translateY(${(1 - flag) * 20}px) scale(${0.97 + 0.03 * flag})`, boxShadow: `0 0 ${50 * flag}px ${alpha(AMBER, 0.35 * flag)}` }}>
        <div style={{ fontSize: 28, color: "#ffd9a0" }}>This answer's flag · specific to this case</div>
        <div style={{ fontSize: 34, fontWeight: 750, color: "#fff", marginTop: 10, lineHeight: 1.35 }}>Vega disagrees with this answer, so the person sees the possible mistake and can seek an expert.</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 22, opacity: ease(tick * 3) }}>
        <Tick p={tick} color={VEGA} />
        <div style={{ fontSize: 40, fontWeight: 800, color: "#fff" }}>Make failures transparent</div>
      </div>
    </div>
  );
};

// ---------- 8–11. One example in one window: the race, the disagreement, the flag and the
// reconsideration, then failing transparently (user note, 2026-11-01: one continuous example) ----------
export type ExampleT = {
  writing: number; vega: number; answer: number; gauge: number; tag: number; stamp: number;
  banner: number; collapse: number; revision: [number, number]; receipt: number;
  shrink: number; generic: number; dim: number; flag: number; tick: number;
};
export const ExampleScene: React.FC<{ t: ExampleT; clockTo?: number }> = ({ t, clockTo = 67 }) => {
  const frame = useCurrentFrame();
  const vega = eased(frame, t.vega, t.vega + 10);
  const answered = frame >= t.answer;
  const drop = eased(frame, t.answer, t.answer + 16);
  const gauge = eased(frame, t.gauge, t.gauge + 40);
  const banner = eased(frame, t.banner, t.banner + 24);
  // The gauge folds back into Vega's strip as the banner takes its place in the chat.
  const open = eased(frame, t.gauge - 6, t.gauge + 14) * (1 - eased(frame, t.banner - 18, t.banner + 6));
  const tag = eased(frame, t.tag, t.tag + 14);
  const stamp = eased(frame, t.stamp, t.stamp + 16);
  const collapse = ease(clamp01((frame - t.collapse) / 30));
  const revision = ramp(frame, t.revision[0], t.revision[1]);
  const slide = camera(frame, t.banner - 16, t.banner + 30);
  const sh = ramp(frame, t.shrink, t.shrink + 34);
  const shrink = sh * sh * (3 - 2 * sh);
  const receipt = ramp(frame, t.receipt, t.receipt + 40) * (1 - shrink);
  const secs = Math.min(clockTo, clockTo * ramp(frame, t.writing, t.answer));
  const score = kase.vega.p * gauge;
  const dots = ".".repeat(1 + (Math.floor(frame / 12) % 3));
  const rev: string = kase.revision;
  const revShown = rev.slice(0, Math.round(rev.length * revision));
  const highlights: Highlight[] = [
    { phrase: "Heat Exhaustion:", p: tag },
    { phrase: "This is the most likely explanation.", p: tag },
  ];
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop palette={TRACELENS} />
      <AbsoluteFill style={{ transform: `scale(${1 - 0.24 * shrink}) translateX(${-120 * shrink}px)`, transformOrigin: "0px 540px" }}>
        <Window x={interpolate(slide, [0, 1], [330, 150])}>
          <div style={{ transform: `translateY(${-250 * collapse}px)` }}>
            <UserBubble typed={1} />
            {/* Vega's strip: decides as soon as the message is in, and stays in view as the flag's source. */}
            <div style={{ margin: "22px 40px 0", padding: "18px 24px", borderRadius: 18, background: alpha(VEGA, 0.08 + 0.04 * open), border: `2px solid ${alpha(VEGA, 0.35 + 0.5 * vega)}`, opacity: ease(clamp01((frame - t.vega + 8) / 8)) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: INK }}>
                <span style={{ width: 16, height: 16, borderRadius: 8, background: VEGA }} />
                <b>Vega</b>
                <span style={{ color: SUB }}>reads the message</span>
                <span style={{ marginLeft: "auto", fontWeight: 800, color: vega > 0.5 ? EMERGENCY : SUB, opacity: vega }}>Emergency</span>
                <span style={{ fontFamily: MONO, fontSize: 28, color: VEGA, opacity: vega }}>0.36 s</span>
              </div>
              <div style={{ height: interpolate(open, [0, 1], [0, 92]), overflow: "hidden", opacity: open }}>
                <div style={{ position: "relative", height: 24, marginTop: 24, borderRadius: 12, background: alpha(VEGA, 0.14) }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${score * 100}%`, borderRadius: 12, background: VEGA }} />
                  <div style={{ position: "absolute", left: `${kase.vega.threshold * 100}%`, top: -10, bottom: -10, width: 4, background: INK }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: MONO, fontSize: 28, color: INK }}>
                  <span>score {score.toFixed(2)}</span>
                  <span>threshold {kase.vega.threshold.toFixed(3)}</span>
                </div>
              </div>
            </div>
            {/* The flag, in the chat, above the answer it is about. */}
            <div style={{ margin: `${22 * banner}px 40px 0`, height: interpolate(banner, [0, 1], [0, 162]), opacity: banner, overflow: "hidden" }}>
              <div style={{ display: "flex", gap: 18, alignItems: "center", padding: "20px 26px", borderRadius: 16, background: "#fff4e0", border: `2px solid ${alpha(AMBER, 0.8)}`, color: "#6b4400", fontSize: 29, lineHeight: 1.35, fontWeight: 600 }}>
                <span style={{ fontSize: 34 }}>⚠</span>
                {BANNER}
              </div>
            </div>
            {!answered ? (
              <div style={{ margin: "26px 40px 0", display: "flex", alignItems: "center", gap: 16, fontSize: 30, color: SUB }}>
                <span style={{ width: 16, height: 16, borderRadius: 8, background: CHATBOT }} />
                <span><b style={{ color: INK }}>Gemma 3 4B</b> is writing{dots}</span>
                <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 30, color: CHATBOT }}>{Math.floor(secs)} s</span>
                <span style={{ fontSize: 26, color: SUB }}>median 67 s · time compressed</span>
              </div>
            ) : (
              <div style={{ margin: "26px 40px 0", padding: "18px 24px 24px", borderRadius: 18, border: `3px solid ${alpha(CHATBOT, 0.25 + 0.7 * tag)}`, background: "#fff", opacity: drop, transform: `translateY(${(1 - drop) * 30}px)`, position: "relative", height: interpolate(collapse, [0, 1], [360, 210]), overflow: "hidden", boxSizing: "border-box" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <AssistantMeta label={collapse > 0.5 ? "Gemma 3 4B · first answer, kept" : "Gemma 3 4B"} color={CHATBOT} />
                  <div style={{ marginLeft: "auto", marginBottom: 10, opacity: tag, transform: `scale(${0.92 + 0.08 * tag})`, padding: "6px 16px", borderRadius: 999, background: alpha(AMBER, 0.18), border: `2px solid ${AMBER}`, color: "#7a4a00", fontSize: 27, fontWeight: 750 }}>Disagrees with Vega · possible under-triage</div>
                </div>
                <AnswerBody text={kase.firstAnswer.slice(kase.firstAnswer.indexOf("**Possible Causes"), 1100)} highlights={highlights} size={28} />
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 110, background: "linear-gradient(rgba(255,255,255,0), #fff 55%)", display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 24px 16px" }}>
                  <span style={{ fontSize: 28, color: SUB, opacity: collapse }}>Show full answer · {kase.firstAnswer.length.toLocaleString("en-US")} characters</span>
                  <span style={{ padding: "4px 14px", borderRadius: 999, background: alpha(CHATBOT, 0.12), border: `1.5px solid ${alpha(CHATBOT, 0.6)}`, color: "#9a3412", fontSize: 26, fontWeight: 700, opacity: stamp, transform: `scale(${0.9 + 0.1 * stamp})` }}>Real Gemma 3 4B output · HealthBench</span>
                </div>
              </div>
            )}
            {revision > 0 ? (
              <div style={{ margin: "26px 40px 0", opacity: ease(clamp01(revision * 4)) }}>
                <AssistantMeta label="Reconsidered after the safety check" color={VEGA} />
                <div style={{ borderLeft: `6px solid ${VEGA}`, padding: "6px 0 6px 24px", fontSize: 31, lineHeight: 1.45, color: INK, fontWeight: 500 }}>{revShown}</div>
              </div>
            ) : null}
          </div>
        </Window>
      </AbsoluteFill>
      <Receipt p={receipt} />
      <div style={{ opacity: 1 - shrink }}>
        <IllustrativeChip />
      </div>
      <TransparencyPanel t={t} />
    </AbsoluteFill>
  );
};

// ---------- 12b. How Vega was trained: Qwen 3.5 4B reads, a small classifier learns from 146 labelled
// messages. Left: each dot is one real training message at its real out-of-fold score (v2-4b head, 5
// folds), emergencies stacked above the axis and the rest below. Right: the live Vega experiment page
// in the TraceLens workspace (a still of vega-lab.html), panning from the model setup to the scores. ----------
const OOF: { e: number; p: number }[] = oof.rows;
const PLOT = { x0: 120, w: 740, base: 600, r: 7, cap: 14 };
// Beeswarm targets: dots binned along the score axis. A full stack spills one bin toward the middle,
// which moves a dot by at most 0.043 and never across the threshold.
const SWARM = (() => {
  const step = PLOT.r * 2 + 2;
  const out: { x: number; y: number; sx: number; sy: number; delay: number; e: number }[] = new Array(OOF.length);
  for (const e of [1, 0]) {
    const height = new Map<number, number>();
    const rows = OOF.map((d, i) => ({ ...d, i })).filter((d) => d.e === e).sort((a, b) => (e ? b.p - a.p : a.p - b.p));
    for (const d of rows) {
      let bin = Math.round((d.p * PLOT.w) / step);
      while ((height.get(bin) ?? 0) >= PLOT.cap) bin += d.p > 0.5 ? -1 : 1;
      const k = height.get(bin) ?? 0;
      height.set(bin, k + 1);
      const off = PLOT.r + 4 + k * step;
      out[d.i] = { x: PLOT.x0 + bin * step, y: e ? PLOT.base - off : PLOT.base + off, sx: 0, sy: 0, delay: 0, e };
    }
  }
  // Start: one mixed cloud in the middle (before training, the labels aren't separated).
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const o of out) {
    o.sx = PLOT.x0 + 200 + rnd() * 340;
    o.sy = PLOT.base - 150 + rnd() * 300;
    o.delay = rnd() * 0.45;
  }
  return out;
})();
// The app window on the right: content area in composition pixels, and the still's camera keys
// (z = zoom over fit-to-width, cx/cy = the page point, in CSS pixels, at the centre of the window).
const VWIN = { left: 960, top: 84, width: 880, titleBar: 52, height: 768 };
const VFIT = VWIN.width / vega.width;
const vegaCam = (z: number, cx: number, cy: number) => {
  const s = VFIT * z;
  const halfW = VWIN.width / s / 2;
  const halfH = VWIN.height / s / 2;
  const x = Math.min(vega.width - halfW, Math.max(halfW, cx));
  const y = Math.min(vega.height - halfH, Math.max(halfH, cy));
  return { s, tx: VWIN.width / 2 - x * s, ty: VWIN.height / 2 - y * s };
};
export const TrainingScene: React.FC<{ t: { win: number; qwen: number; classifier: number; dots: number; data: number; learn: [number, number]; line: number; note: number; pan: number; push: number } }> = ({ t }) => {
  const frame = useCurrentFrame();
  const win = eased(frame, t.win, t.win + 26);
  const qwen = eased(frame, t.qwen, t.qwen + 18);
  const cls = eased(frame, t.classifier, t.classifier + 18);
  const data = eased(frame, t.data, t.data + 18);
  const dots = eased(frame, t.dots, t.dots + 20);
  const learn = ramp(frame, t.learn[0], t.learn[1] + 20);
  const line = eased(frame, t.line, t.line + 20);
  const note = eased(frame, t.note, t.note + 20);
  // Camera: the top of the page (title and model setup), a pan down to the scores and results, then
  // a push-in on the threshold and the training tiles when the classifier "makes the call".
  const plot = vega["vega-training-plot"];
  const stats = vega["vega-training-stats"];
  const keys = [
    { z: 1, cx: vega.width / 2, cy: 0 },
    { z: 1, cx: vega.width / 2, cy: vega.height },
    // Right edge on the training tiles, left edge just inside the threshold label, no heading cut in half.
    { z: 2.2, cx: stats.x + stats.width + 6 - VWIN.width / (VFIT * 2.2) / 2, cy: plot.y + plot.height / 2 + 16 },
  ];
  const pan = camera(frame, t.pan, t.pan + 70);
  const push = camera(frame, t.push, t.push + 70);
  const drift = 0.02 * ramp(frame, 0, t.pan);
  const k = { z: keys[0].z + drift + (keys[1].z - keys[0].z) * pan + (keys[2].z - keys[1].z) * push, cx: keys[0].cx + (keys[1].cx - keys[0].cx) * pan + (keys[2].cx - keys[1].cx) * push, cy: keys[0].cy + (keys[1].cy - keys[0].cy) * pan + (keys[2].cy - keys[1].cy) * push };
  const cam = vegaCam(k.z, k.cx, k.cy);
  const chip = (p: number, title: string, sub: string, color: string) => (
    <div style={{ padding: "14px 18px", borderRadius: 18, background: alpha(color, 0.1), border: `2px solid ${alpha(color, 0.75)}`, opacity: p, transform: `translateY(${(1 - p) * 14}px)` }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", whiteSpace: "nowrap" }}>{title}</div>
      <div style={{ fontSize: 19, color: MUTED, marginTop: 4, whiteSpace: "nowrap" }}>{sub}</div>
    </div>
  );
  const arrow = (p: number) => <div style={{ fontSize: 32, color: alpha("#ffffff", 0.7), opacity: p }}>→</div>;
  const thrX = PLOT.x0 + oof.threshold * PLOT.w;
  const reach = PLOT.cap * (PLOT.r * 2 + 2) + 20;
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop palette={TRACELENS} />
      <div style={{ position: "absolute", left: PLOT.x0 - 24, width: PLOT.w + 48, top: 96, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {chip(data, "146", "labelled messages", "#9aa3b2")}
        {arrow(Math.min(data, qwen))}
        {chip(qwen, "Qwen 3.5 4B", "reads each message", VEGA)}
        {arrow(Math.min(qwen, cls))}
        {chip(cls, "Small classifier", "the only part trained", VEGA)}
      </div>
      <div style={{ position: "absolute", left: PLOT.x0, top: 250, display: "flex", gap: 30, fontSize: 24, color: "#fff", opacity: dots }}>
        <span><span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 7, background: EMERGENCY, marginRight: 9 }} />Emergency · 77</span>
        <span><span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 7, background: "#8b95a7", marginRight: 9 }} />Not an emergency · 69</span>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: dots }}>
        <line x1={PLOT.x0 - 16} x2={PLOT.x0 + PLOT.w + 16} y1={PLOT.base} y2={PLOT.base} stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
        {SWARM.map((d, i) => {
          const u = EASE.camera(clamp01((learn - d.delay) / 0.55));
          // Unsorted, the messages mill about in the cloud; the motion settles as they sort.
          const a = frame * 0.06 + i * 2.39;
          const sx = d.sx + 11 * Math.cos(a) * (1 - u);
          const sy = d.sy + 11 * Math.sin(a * 0.83) * (1 - u);
          return <circle key={i} cx={sx + (d.x - sx) * u} cy={sy + (d.y - sy) * u} r={PLOT.r} fill={d.e ? EMERGENCY : "#8b95a7"} opacity={0.92} />;
        })}
        <line x1={thrX} x2={thrX} y1={PLOT.base + reach * line} y2={PLOT.base - reach * line} stroke="#fff" strokeWidth={3} strokeDasharray="8 8" opacity={line} />
      </svg>
      <div style={{ position: "absolute", left: thrX - 330, width: 316, top: PLOT.base - reach - 6, textAlign: "right", fontSize: 24, fontWeight: 700, color: "#fff", opacity: line }}>Classifier makes the call →</div>
      <div style={{ position: "absolute", left: PLOT.x0 - 16, width: PLOT.w + 32, top: PLOT.base + reach + 14, display: "flex", justifyContent: "space-between", fontSize: 22, color: MUTED, opacity: dots * learn }}>
        <span>Not an emergency</span>
        <span>Score for each training message</span>
        <span>Emergency</span>
      </div>
      <div style={{ position: "absolute", left: VWIN.left, top: VWIN.top, opacity: win, transform: `translateX(${(1 - win) * 40}px)` }}>
        <div style={{ position: "relative", width: VWIN.width, height: VWIN.titleBar + VWIN.height, borderRadius: 16, overflow: "hidden", background: "#f4f6f9", boxShadow: "0 0 0 1px rgba(255,255,255,0.10), 0 2px 6px rgba(0,0,0,0.18), 0 30px 70px rgba(4,8,20,0.45)" }}>
          <div style={{ height: VWIN.titleBar, display: "flex", alignItems: "center", position: "relative", borderBottom: "1px solid rgba(15,23,42,0.08)" }}>
            <div style={{ display: "flex", gap: 8, marginLeft: 20 }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />)}
            </div>
            <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontSize: 22, fontWeight: 600, color: "rgba(15,23,42,0.62)" }}>TraceLens · Vega experiment</div>
          </div>
          <div style={{ position: "relative", width: VWIN.width, height: VWIN.height, overflow: "hidden", background: "#f4f5f6" }}>
            <Img src={staticFile("tracelens/vega-lab.png")} style={{ position: "absolute", left: 0, top: 0, width: vega.width, transformOrigin: "0 0", transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})` }} />
          </div>
        </div>
      </div>
      {/* Under the plot, in the left column: the burned-in captions own the bottom of the frame. */}
      <div style={{ position: "absolute", left: PLOT.x0 - 16, width: PLOT.w + 32, top: 906, textAlign: "center", fontSize: 27, color: "#fff", whiteSpace: "nowrap", opacity: note, transform: `translateY(${(1 - note) * 10}px)` }}>
        <b>146</b> to learn from <span style={{ color: MUTED }}>·</span> <b>277</b> held out for testing, from four datasets
      </div>
    </AbsoluteFill>
  );
};

// ---------- 13. Vega picks the emergency, 97 times out of 100 ----------
export const PickScene: React.FC<{ t: { cards: number; shuffle: [number, number]; result: number; flagged: number } }> = ({ t }) => {
  const frame = useCurrentFrame();
  const cards = eased(frame, t.cards, t.cards + 20);
  const sh = ramp(frame, t.shuffle[0], t.shuffle[1]);
  const pairs = 1 + Math.floor(EASE.camera(sh) * 99);
  const right = Math.round(pairs * 0.97);
  const flip = Math.floor(EASE.camera(sh) * 14);
  const emergencyLeft = flip % 2 === 0;
  const result = eased(frame, t.result, t.result + 24);
  const flagged = eased(frame, t.flagged, t.flagged + 20);
  const msg = (left: boolean, emergency: boolean) => {
    const chosen = emergency;
    return (
      <div style={{ position: "absolute", left: left ? 300 : 1010, top: 250, width: 610, height: 330, borderRadius: 26, padding: "30px 34px", boxSizing: "border-box", background: chosen ? alpha(EMERGENCY, 0.14) : "rgba(255,255,255,0.05)", border: `2.5px solid ${chosen ? alpha(EMERGENCY, 0.85) : "rgba(255,255,255,0.2)"}`, opacity: cards, transform: `translateY(${(1 - cards) * 24}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 26, color: MUTED }}>NEVER SEEN IN TRAINING</div>
        <div style={{ fontSize: 50, fontWeight: 800, color: "#fff", marginTop: 14 }}>{emergency ? "Emergency" : "Not an emergency"}</div>
        {[0, 1, 2].map((k) => <div key={k} style={{ height: 12, borderRadius: 6, marginTop: k ? 14 : 30, width: `${[92, 80, 56][k]}%`, background: "rgba(255,255,255,0.16)" }} />)}
        {chosen ? <div style={{ position: "absolute", right: 26, top: 26, padding: "6px 16px", borderRadius: 999, background: VEGA, color: "#fff", fontSize: 28, fontWeight: 750 }}>Vega's pick</div> : null}
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop palette={TRACELENS} />
      {msg(true, emergencyLeft)}
      {msg(false, !emergencyLeft)}
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", color: "#fff", opacity: cards }}>
        <div style={{ fontSize: 140, fontWeight: 800, letterSpacing: -4, fontVariantNumeric: "tabular-nums" }}>{right} <span style={{ fontSize: 64, color: MUTED, fontWeight: 600 }}>of {pairs}</span></div>
        <div style={{ fontSize: 38, color: MUTED, marginTop: 4, opacity: 1 - result }}>pairs where Vega picks the emergency</div>
        <div style={{ fontSize: 38, color: "#fff", marginTop: -46, opacity: result }}>held-out score <b style={{ color: "#9cc0ff" }}>0.966</b> · <span style={{ opacity: flagged }}>55 of 70 emergencies flagged</span></div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 14. Vega against the chatbot, then the final answers (frozen held-out replay, P1 audit) ----------
const STAGES: { label: string; note?: string; n: number; color: string; key: string }[] = [
  { label: "Vega recognised the emergency", note: "7.5% false alarms · 10 of 134", n: 55, color: VEGA, key: "vega" },
  { label: "Chatbot's first answer gave emergency advice", n: 39, color: CHATBOT, key: "first" },
  { label: "Final answer, after Vega's flag and reconsideration", n: 47, color: OK, key: "final" },
];
// The 277 physician-labelled cases: four public datasets, none used to train Vega.
const SOURCES: { name: string; cite: string; n: number; key: string }[] = [
  { name: "HealthBench", cite: "OpenAI 2025", n: 145, key: "healthbench" },
  { name: "The Nature Medicine study", cite: "Ramaswamy et al. 2026", n: 39, key: "nature" },
  { name: "Semigran et al.", cite: "BMJ 2015", n: 45, key: "semigran" },
  { name: "Levine et al.", cite: "JAMA Netw Open 2021", n: 48, key: "levine" },
];
export const LoopScene: React.FC<{ t: Record<string, number> & { alarms: number; tick: number; sources: number } }> = ({ t }) => {
  const frame = useCurrentFrame();
  const alarms = eased(frame, t.alarms, t.alarms + 20);
  const tick = ramp(frame, t.tick, t.tick + 18);
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop palette={TRACELENS} />
      <div style={{ position: "absolute", left: 120, top: 64, color: "#fff" }}>
        <div style={{ fontSize: 46, fontWeight: 800 }}>277 physician-labelled cases · 70 emergencies</div>
      </div>
      <div style={{ position: "absolute", left: 120, right: 120, top: 138, display: "flex", gap: 16 }}>
        {SOURCES.map((src, i) => {
          const p = eased(frame, t.sources + i * 6, t.sources + i * 6 + 18);
          const lit = t[src.key] !== undefined ? eased(frame, t[src.key], t[src.key] + 14) : 0;
          return (
            <div key={src.key} style={{ flex: src.key === "nature" ? 1.25 : 1, padding: "12px 18px", borderRadius: 16, background: `rgba(255,255,255,${0.05 + 0.07 * lit})`, border: `1.5px solid rgba(255,255,255,${0.16 + 0.5 * lit})`, opacity: p, transform: `translateY(${(1 - p) * 14}px)` }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <div style={{ fontSize: 28, fontWeight: 750, color: "#fff", whiteSpace: "nowrap" }}>{src.name}</div>
                <div style={{ marginLeft: "auto", fontSize: 30, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{src.n}</div>
              </div>
              <div style={{ fontSize: 24, color: MUTED, marginTop: 2 }}>{src.cite}</div>
            </div>
          );
        })}
      </div>
      {STAGES.map((s, i) => {
        const p = eased(frame, t[s.key], t[s.key] + 26);
        const y = 330 + i * 170;
        const pct = Math.round((s.n / 70) * 100 * p);
        return (
          <div key={s.key} style={{ position: "absolute", left: 120, top: y, width: 1680, display: "flex", alignItems: "center", gap: 34, opacity: ease(clamp01((frame - t[s.key] + 6) / 10)) }}>
            <div style={{ width: 640, textAlign: "right" }}>
              <div style={{ fontSize: 34, fontWeight: 650, color: "#fff", lineHeight: 1.2 }}>{s.label}</div>
              {s.note ? <div style={{ fontSize: 26, color: MUTED, marginTop: 6 }}>{s.note}</div> : null}
            </div>
            <div style={{ position: "relative", flex: 1, height: 64, borderRadius: 12, background: "rgba(255,255,255,0.06)" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(s.n / 70) * 100 * p}%`, borderRadius: 12, background: s.color }} />
              <div style={{ position: "absolute", left: `calc(${(s.n / 70) * 100 * p}% + 22px)`, top: 2, display: "flex", alignItems: "baseline", gap: 14, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                <span style={{ fontSize: 50, fontWeight: 800, color: "#fff" }}>{pct}%</span>
                <span style={{ fontSize: 28, color: MUTED, opacity: p }}>{s.n} of 70</span>
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", right: 120, bottom: 72, padding: "14px 24px", borderRadius: 18, background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.18)", color: "#fff", fontSize: 32, opacity: alarms }}>
        False alarms in final answers <b>4 → 5</b> <span style={{ color: MUTED }}>of 134</span>
      </div>
      <div style={{ position: "absolute", left: 120, bottom: 70, display: "flex", alignItems: "center", gap: 22, opacity: ease(tick * 3) }}>
        <Tick p={tick} color={CHATBOT} />
        <div style={{ fontSize: 40, fontWeight: 800, color: "#fff" }}>Reduce under-triage</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 15. The proposed system: Vega as a safety and transparency layer around the chatbot ----------
const STEPS = ["Testing the models", "Safety checks", "Evaluation"];
export const LayerScene: React.FC<{ t: { lanes: number; ticks: [number, number]; strip: number; steps: [number, number, number]; layer: number; flow: number; flag: number; flow2?: number; pulse?: number; drift?: [number, number] } }> = ({ t }) => {
  const frame = useCurrentFrame();
  // The last line lands on movement: a slow push-in on the layer, and one pulse of the flag on "healthcare".
  const drift = t.drift ? EASE.camera(ramp(frame, t.drift[0], t.drift[1])) : 0;
  const beat = t.pulse !== undefined ? Math.sin(Math.PI * ramp(frame, t.pulse, t.pulse + 30)) : 0;
  const lanesOut = camera(frame, t.strip - 20, t.strip + 10);
  const strip = eased(frame, t.strip, t.strip + 20) * (1 - eased(frame, t.layer - 24, t.layer));
  const layer = eased(frame, t.layer, t.layer + 34);
  // The message runs through the layer once on "decision", and again for "the next time someone asks".
  const flow = t.flow2 !== undefined && frame >= t.flow2 ? ramp(frame, t.flow2, t.flow2 + 70) : ramp(frame, t.flow, t.flow + 70);
  const flag = eased(frame, t.flag, t.flag + 20);
  const ticks: [number, number] = [ramp(frame, t.ticks[0], t.ticks[0] + 18), ramp(frame, t.ticks[1], t.ticks[1] + 18)];
  const cx = 960, cy = 560;
  const dot = (() => {
    // Message from the left edge, through the layer, into the chatbot; then out to the person.
    const x = interpolate(flow, [0, 0.45, 0.55, 1], [260, cx - 120, cx + 120, 1640]);
    return { x, y: cy };
  })();
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop palette={TRACELENS} />
      <div style={{ position: "absolute", left: 150, right: 150, top: interpolate(lanesOut, [0, 1], [420, 110]), opacity: interpolate(lanesOut, [0, 1], [1, 0.0]), transform: `scale(${1 - 0.1 * lanesOut})` }}>
        <Lanes show={1} ticks={ticks} />
      </div>
      {strip > 0 ? (
        <div style={{ position: "absolute", left: 150, right: 150, top: 330, opacity: strip }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 46 }}>
            <TraceLensMark size={64} />
            <div style={{ fontSize: 44, fontWeight: 800, color: "#fff" }}>TraceLens ran the entire flow</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            {STEPS.map((label, i) => {
              const p = eased(frame, t.steps[i], t.steps[i] + 18);
              return (
                <React.Fragment key={label}>
                  {i ? <div style={{ fontSize: 46, color: alpha("#ffffff", 0.2 + 0.6 * p) }}>→</div> : null}
                  <div style={{ flex: 1, padding: "30px 32px", borderRadius: 22, background: alpha(VEGA, 0.06 + 0.12 * p), border: `2px solid ${alpha(VEGA, 0.25 + 0.65 * p)}`, opacity: 0.35 + 0.65 * p, transform: `translateY(${(1 - p) * 12}px)` }}>
                    <div style={{ fontSize: 40, fontWeight: 800, color: "#fff" }}>{label}</div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : null}
      <div style={{ opacity: layer, transform: `scale(${1 + 0.05 * drift})`, transformOrigin: `${cx + 120}px ${cy - 40}px` }}>
        {/* Vega's layer wrapped around the chatbot */}
        <div style={{ position: "absolute", left: cx - 420, top: cy - 250, width: 840, height: 500, borderRadius: 60, border: `4px solid ${alpha(VEGA, 0.9)}`, background: alpha(VEGA, 0.1), boxShadow: `0 0 ${80 * layer}px ${alpha(VEGA, 0.35)}`, transform: `scale(${0.9 + 0.1 * layer})` }} />
        <div style={{ position: "absolute", left: cx - 420, top: cy - 320, width: 840, textAlign: "center", fontSize: 36, fontWeight: 750, color: "#cfe0ff" }}>Vega · safety and transparency layer</div>
        <div style={{ position: "absolute", left: cx - 260, top: cy - 120, width: 520, height: 240, borderRadius: 34, background: alpha(CHATBOT, 0.16), border: `3px solid ${alpha(CHATBOT, 0.85)}`, display: "grid", placeItems: "center", textAlign: "center" }}>
          <div>
            <div style={{ fontSize: 46, fontWeight: 800, color: "#fff" }}>General-purpose chatbot</div>
            <div style={{ fontSize: 30, color: MUTED, marginTop: 8 }}>in healthcare</div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 96, top: cy - 50, fontSize: 30, color: MUTED, width: 200, textAlign: "center" }}>The person's message</div>
        <div style={{ position: "absolute", right: 96, top: cy - 50, fontSize: 30, color: MUTED, width: 200, textAlign: "center" }}>The person</div>
        {flow > 0 && flow < 1 ? <div style={{ position: "absolute", left: dot.x - 16, top: dot.y - 16, width: 32, height: 32, borderRadius: 16, background: flow < 0.5 ? "#fff" : CHATBOT, boxShadow: "0 0 24px rgba(255,255,255,0.6)" }} /> : null}
        <div style={{ position: "absolute", left: cx + 440, top: cy - 190, padding: "14px 22px", borderRadius: 16, background: "#fff4e0", border: `2px solid ${AMBER}`, color: "#6b4400", fontSize: 30, fontWeight: 750, opacity: flag, transform: `translateY(${(1 - flag) * 16}px) scale(${1 + 0.08 * beat})`, boxShadow: `0 0 ${46 * beat}px ${alpha(AMBER, 0.6 * beat)}` }}>⚠ Flag shown to the person</div>
      </div>
    </AbsoluteFill>
  );
};

// End card: the two goals the film opened with, each ticked as the closing line says it.
export const GoalTicks: React.FC<{ at: [number, number] }> = ({ at }) => {
  const frame = useCurrentFrame();
  const goal = (label: string, color: string, i: number) => {
    const p = eased(frame, at[i] - 10, at[i] + 8);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 20, opacity: p, transform: `translateY(${(1 - p) * 14}px)` }}>
        <Tick p={ramp(frame, at[i], at[i] + 18)} color={color} />
        <div style={{ fontSize: 46, fontWeight: 750, color: "#fff" }}>{label}</div>
      </div>
    );
  };
  return (
    <div style={{ display: "flex", gap: 70, marginTop: 30, fontFamily: FONT }}>
      {goal("Reduce under-triage", CHATBOT, 0)}
      {goal("Make failures transparent", VEGA, 1)}
    </div>
  );
};

export { BANNER };
