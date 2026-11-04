// TraceLens bridging visuals: the user-facing pairing of a symptom chatbot with Vega.
// Every text shown comes from tracelens-case.json, extracted from the saved runs; the chat
// window itself is an illustrative interface and is labelled as one on screen.
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { alpha, EASE, FONT, MONO, type Palette } from "../lib/theme";
import kase from "./tracelens-case.json";

export const TRACELENS: Palette = { accent: "#3b82f6", accent2: "#e8552b", deep: "#0b0d11", ink: "#ffffff", muted: "rgba(255,255,255,0.68)", warn: "#f5a524", ok: "#22a06b" };
export const CHATBOT = "#e8552b";
export const VEGA = "#3b82f6";
export const EMERGENCY = "#ef4444";
const PAPER = "#f7f7f5";
export const INK = "#1d2026";
export const SUB = "#5b6170";
// Label on every chat window (the user's wording, 2026-11-01).
export const CHAT_LABEL = "Illustrative schematic · real tested data · Gemma 3 4B on HealthBench";
// Banner shown in the chat when Vega disagrees (approved 2026-11-01).
export const BANNER = "This response was flagged because it disagrees with our emergency detection model. Please take the advice here with caution and contact emergency services.";

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const ease = (p: number) => EASE.enter(clamp01(p));
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

// --- answer text -------------------------------------------------------------------------

type Block = { kind: "p" | "h" | "li" | "li2" | "ol"; text: string; n?: string };

function parseAnswer(text: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) continue;
    const sub = /^\s{2,}\*\s+(.*)$/.exec(line);
    const li = /^\*\s+(.*)$/.exec(line.trim());
    const ol = /^(\d+)\.\s+(.*)$/.exec(line.trim());
    if (sub) blocks.push({ kind: "li2", text: sub[1] });
    else if (li) blocks.push({ kind: "li", text: li[1] });
    else if (ol) blocks.push({ kind: "ol", text: ol[2], n: ol[1] });
    else if (/^\*\*[^*]+\*\*$/.test(line.trim())) blocks.push({ kind: "h", text: line.trim() });
    else blocks.push({ kind: "p", text: line.trim() });
  }
  return blocks;
}

export type Highlight = { phrase: string; p: number; tone?: string };

// Inline **bold** and *italic*, with marker-sweep highlights over exact phrases.
const Inline: React.FC<{ text: string; highlights: Highlight[] }> = ({ text, highlights }) => {
  const plain = text.replace(/\*\*([^*]+)\*\*/g, "\u0001$1\u0002").replace(/\*([^*]+)\*/g, "$1");
  const marks: { a: number; b: number; h: Highlight }[] = [];
  for (const h of highlights) {
    const i = plain.replace(/[\u0001\u0002]/g, "").indexOf(h.phrase);
    if (i < 0 || h.p <= 0) continue;
    marks.push({ a: i, b: i + h.phrase.length, h });
  }
  const out: React.ReactNode[] = [];
  let bold = false;
  let idx = 0;
  let buf = "";
  let bufMark: (typeof marks)[number] | undefined;
  let bufBold = false;
  const flush = (key: number) => {
    if (!buf) return;
    const style: React.CSSProperties = { fontWeight: bufBold ? 700 : 400 };
    if (bufMark) {
      const tone = bufMark.h.tone ?? CHATBOT;
      const sweep = ease(bufMark.h.p) * 100;
      Object.assign(style, { backgroundImage: `linear-gradient(90deg, ${alpha(tone, 0.28)} ${sweep}%, transparent ${sweep}%)`, boxShadow: `inset 0 -3px 0 ${alpha(tone, ease(bufMark.h.p))}`, borderRadius: 4 });
    }
    out.push(<span key={key} style={style}>{buf}</span>);
    buf = "";
  };
  for (const ch of plain) {
    if (ch === "\u0001" || ch === "\u0002") { flush(out.length); bold = ch === "\u0001"; bufBold = bold; continue; }
    const m = marks.find((k) => idx >= k.a && idx < k.b);
    if (m !== bufMark || bold !== bufBold) { flush(out.length); bufMark = m; bufBold = bold; }
    buf += ch;
    idx += 1;
  }
  flush(out.length);
  return <>{out}</>;
};

export const AnswerBody: React.FC<{ text: string; highlights: Highlight[]; size?: number }> = ({ text, highlights, size = 30 }) => (
  <div style={{ fontSize: size, lineHeight: 1.45, color: INK }}>
    {parseAnswer(text).map((b, i) => {
      const common = { marginTop: b.kind === "h" ? 26 : 10 };
      if (b.kind === "li" || b.kind === "li2" || b.kind === "ol")
        return (
          <div key={i} style={{ ...common, display: "flex", gap: 14, paddingLeft: b.kind === "li2" ? 44 : 4 }}>
            <span style={{ color: SUB, minWidth: 22 }}>{b.kind === "ol" ? `${b.n}.` : "•"}</span>
            <span><Inline text={b.text} highlights={highlights} /></span>
          </div>
        );
      return <div key={i} style={common}><Inline text={b.text} highlights={highlights} /></div>;
    })}
  </div>
);

// --- chat window ------------------------------------------------------------------------

export const Window: React.FC<{ children: React.ReactNode; x?: number; w?: number; top?: number; h?: number }> = ({ children, x = 330, w = 1260, top = 44, h = 920 }) => (
  <div style={{ position: "absolute", left: x, top, width: w, height: h, borderRadius: 28, background: PAPER, overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,0.55)", fontFamily: FONT }}>
    <div style={{ height: 84, display: "flex", alignItems: "center", gap: 18, padding: "0 34px", borderBottom: "1px solid #e3e4e8", background: "#ffffff" }}>
      <div style={{ width: 44, height: 44, borderRadius: 22, background: "#e9ebf0", display: "grid", placeItems: "center", color: SUB, fontSize: 26, fontWeight: 700 }}>+</div>
      <div style={{ fontSize: 30, fontWeight: 700, color: INK }}>Symptom assistant</div>
      <div style={{ marginLeft: "auto", fontSize: 28, color: SUB }}>Gemma 3 4B</div>
    </div>
    <div style={{ position: "absolute", inset: "84px 0 0 0", overflow: "hidden" }}>{children}</div>
  </div>
);

export const IllustrativeChip: React.FC<{ text?: string }> = ({ text = CHAT_LABEL }) => (
  <div style={{ position: "absolute", right: 96, bottom: 40, padding: "10px 20px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.78)", fontFamily: FONT, fontSize: 28 }}>{text}</div>
);

export const UserBubble: React.FC<{ typed: number }> = ({ typed }) => {
  const msg: string = kase.message;
  const shown = msg.slice(0, Math.round(msg.length * clamp01(typed)));
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", padding: "34px 40px 0" }}>
      <div style={{ maxWidth: 900, padding: "22px 28px", borderRadius: "26px 26px 6px 26px", background: "#2b3140", color: "#fff", fontSize: 30, lineHeight: 1.42 }}>
        {shown}
        {typed < 1 ? <span style={{ opacity: 0.7 }}>▍</span> : null}
      </div>
    </div>
  );
};

export const AssistantMeta: React.FC<{ label: string; color?: string }> = ({ label, color = SUB }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, color, fontWeight: 600, marginBottom: 10 }}>
    <span style={{ width: 14, height: 14, borderRadius: 7, background: color }} />
    {label}
  </div>
);

// D1: the question and the chatbot's first answer, streamed and scrolled.
export const SymptomChat: React.FC<{ typed: number; streamed: number; scroll: number; highlights?: Highlight[]; chip?: boolean }> = ({ typed, streamed, scroll, highlights = [], chip = true }) => {
  const text: string = kase.firstAnswer;
  const shown = text.slice(0, Math.round(text.length * clamp01(streamed)));
  return (
    <AbsoluteFill>
      <Backdrop palette={TRACELENS} />
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
      {chip ? <IllustrativeChip /> : null}
    </AbsoluteFill>
  );
};

// D4: the same chat after Vega's flag: banner, original kept (stamped as a real output), reconsideration.
// The red fixed escalation line is gone; the approved banner already says to contact emergency services.
export const DisclosedChat: React.FC<{ banner: number; collapse: number; revision: number; escalation?: number; receipt: number; stamp?: number; chip?: boolean; x?: number; backdrop?: boolean }> = ({ banner, collapse, revision, receipt, stamp = 0, chip = true, x = 150, backdrop = true }) => {
  const rev: string = kase.revision;
  const revShown = rev.slice(0, Math.round(rev.length * clamp01(revision)));
  const originalH = interpolate(ease(collapse), [0, 1], [520, 170]);
  return (
    <AbsoluteFill>
      {backdrop ? <Backdrop palette={TRACELENS} /> : null}
      <Window x={x}>
        <div style={{ transform: `translateY(${-interpolate(ease(collapse), [0, 1], [0, 190])}px)` }}>
          <UserBubble typed={1} />
          <div style={{ padding: "26px 40px 40px", maxWidth: 1180 }}>
            <div style={{ height: interpolate(ease(banner), [0, 1], [0, 162]), opacity: ease(banner), overflow: "hidden", marginBottom: 18 * ease(banner) }}>
              <div style={{ display: "flex", gap: 18, alignItems: "center", padding: "20px 26px", borderRadius: 16, background: "#fff4e0", border: `2px solid ${alpha("#f5a524", 0.8)}`, color: "#6b4400", fontSize: 29, lineHeight: 1.35, fontWeight: 600 }}>
                <span style={{ fontSize: 34 }}>⚠</span>
                {BANNER}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <AssistantMeta label="Original answer · kept unchanged" />
              <div style={{ marginBottom: 10, padding: "4px 14px", borderRadius: 999, background: alpha(CHATBOT, 0.12), border: `1.5px solid ${alpha(CHATBOT, 0.6)}`, color: "#9a3412", fontSize: 26, fontWeight: 700, opacity: ease(stamp), transform: `scale(${0.9 + 0.1 * ease(stamp)})` }}>Real Gemma 3 4B output · HealthBench</div>
            </div>
            <div style={{ position: "relative", height: originalH, overflow: "hidden", borderRadius: 14, border: "1px solid #e1e3e8", background: "#fff", padding: "6px 26px" }}>
              <AnswerBody text={kase.firstAnswer} highlights={[]} size={28} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 120, background: "linear-gradient(rgba(255,255,255,0), #fff 45%)", display: "flex", alignItems: "flex-end", padding: "0 26px 14px", fontSize: 28, color: SUB, opacity: ease(collapse) }}>
                Show full answer · {kase.firstAnswer.length.toLocaleString("en-US")} characters
              </div>
            </div>
            {revision > 0 ? (
              <div style={{ marginTop: 26, opacity: ease(revision * 4) }}>
                <AssistantMeta label="Reconsidered after the safety check" color={VEGA} />
                <div style={{ borderLeft: `6px solid ${VEGA}`, padding: "6px 0 6px 24px", fontSize: 31, lineHeight: 1.45, color: INK, fontWeight: 500 }}>{revShown}</div>
              </div>
            ) : null}
          </div>
        </div>
      </Window>
      <Receipt p={receipt} />
      {chip ? <IllustrativeChip /> : null}
    </AbsoluteFill>
  );
};

// The evidence receipt stored with the final action.
export const Receipt: React.FC<{ p: number }> = ({ p }) => {
  const rows: [string, string, string][] = [
    ["First answer read as", "Self-care", CHATBOT],
    ["Vega", `${kase.vega.p.toFixed(2)} ≥ ${kase.vega.threshold.toFixed(3)}`, VEGA],
    ["Reconsidered answer", "Emergency", EMERGENCY],
    ["Physician label", "Emergency", "#ffffff"],
  ];
  return (
    <div style={{ position: "absolute", left: 1450, top: 300, width: 400, opacity: ease(p), transform: `translateX(${(1 - ease(p)) * 40}px)`, fontFamily: FONT }}>
      <div style={{ fontFamily: MONO, fontSize: 28, color: "rgba(255,255,255,0.6)", letterSpacing: 1, marginBottom: 16 }}>EVIDENCE RECEIPT</div>
      {rows.map(([k, v, c], i) => (
        <div key={k} style={{ padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.14)", opacity: ease(p * 4 - i) }}>
          <div style={{ fontSize: 28, color: "rgba(255,255,255,0.62)" }}>{k}</div>
          <div style={{ fontSize: 34, fontWeight: 700, color: c, marginTop: 4 }}>{v}</div>
        </div>
      ))}
      <div style={{ fontFamily: MONO, fontSize: 28, color: "rgba(255,255,255,0.5)", marginTop: 14 }}>case {kase.caseId}</div>
    </div>
  );
};

// D2: the two labels that define under-triage.
export const VerdictPair: React.FC<{ p: number; gap: number }> = ({ p, gap }) => {
  const pill = (label: string, value: string, color: string, i: number) => (
    <div style={{ width: 640, padding: "34px 40px", borderRadius: 26, background: alpha(color, 0.14), border: `2px solid ${alpha(color, 0.7)}`, opacity: ease(p * 2 - i), transform: `translateY(${(1 - ease(p * 2 - i)) * 24}px)` }}>
      <div style={{ fontSize: 30, color: "rgba(255,255,255,0.7)" }}>{label}</div>
      <div style={{ fontSize: 72, fontWeight: 800, color: "#fff", marginTop: 8 }}>{value}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop palette={TRACELENS} />
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 120 }}>
        {pill("Physician label", "Emergency", EMERGENCY, 0)}
        {pill("The answer read as", "Self-care", CHATBOT, 1)}
      </div>
      <div style={{ position: "absolute", top: 640, left: 0, right: 0, textAlign: "center", opacity: ease(gap) }}>
        <div style={{ width: interpolate(ease(gap), [0, 1], [0, 760]), height: 6, margin: "0 auto 34px", borderRadius: 3, background: `linear-gradient(90deg, ${EMERGENCY}, ${CHATBOT})` }} />
        <div style={{ fontSize: 104, fontWeight: 800, color: "#fff", letterSpacing: -2 }}>Under-triage</div>
        <div style={{ fontSize: 34, color: "rgba(255,255,255,0.7)", marginTop: 12 }}>an emergency answered as something that can wait</div>
      </div>
    </AbsoluteFill>
  );
};

// Measured cost per call, from the run records (median over the held-out runs).
const Cost: React.FC<{ items: string[]; note: string; color: string }> = ({ items, note, color }) => (
  <div style={{ marginTop: 18 }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 28 }}>
      {items.map((s) => (
        <span key={s} style={{ fontSize: 36, fontWeight: 800, color, fontFamily: MONO, whiteSpace: "nowrap" }}>{s}</span>
      ))}
    </div>
    <div style={{ fontSize: 28, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{note}</div>
  </div>
);

// D3: one message, two readers. Vega's score crosses its frozen threshold; the verdicts disagree.
export const SecondJudge: React.FC<{ fork: number; gauge: number; verdicts: number; clash: number }> = ({ fork, gauge, verdicts, clash }) => {
  const W = 1920;
  const msg = { x: 96, y: 390, w: 470, h: 300 };
  const bot = { x: 730, y: 170, w: 630, h: 250 };
  const vega = { x: 730, y: 590, w: 630, h: 380 };
  const out = { x: 1450, w: 374 };
  const line = (x1: number, y1: number, x2: number, y2: number, color: string, p: number) => {
    const mx = (x1 + x2) / 2;
    const d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
    return <path d={d} stroke={color} strokeWidth={4} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(p)} />;
  };
  const card = (b: { x: number; y: number; w: number; h: number }, color: string, title: string, sub: string, p: number, children?: React.ReactNode) => (
    <div style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: 22, background: "rgba(255,255,255,0.05)", border: `2px solid ${alpha(color, 0.75)}`, padding: "26px 30px", opacity: ease(p), boxSizing: "border-box" }}>
      <div style={{ fontSize: 40, fontWeight: 800, color: "#fff" }}>{title}</div>
      <div style={{ fontSize: 28, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>{sub}</div>
      {children}
    </div>
  );
  const score = kase.vega.p * ease(gauge);
  const crossed = score >= kase.vega.threshold;
  const verdict = (y: number, text: string, color: string, i: number) => (
    <div style={{ position: "absolute", left: out.x, top: y, width: out.w, padding: "22px 26px", borderRadius: 18, background: alpha(color, 0.16), border: `2px solid ${color}`, opacity: ease(verdicts * 2 - i), boxSizing: "border-box" }}>
      <div style={{ fontSize: 28, color: "rgba(255,255,255,0.7)" }}>{i === 0 ? "Answer read as" : "Vega verdict"}</div>
      <div style={{ fontSize: 44, fontWeight: 800, color: "#fff" }}>{text}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Backdrop palette={TRACELENS} />
      <svg width={W} height={1080} style={{ position: "absolute", inset: 0 }}>
        {line(msg.x + msg.w, msg.y + msg.h / 2, bot.x, bot.y + bot.h / 2, CHATBOT, fork)}
        {line(msg.x + msg.w, msg.y + msg.h / 2, vega.x, vega.y + vega.h / 2, VEGA, fork)}
        {line(bot.x + bot.w, bot.y + bot.h / 2, out.x, 250, CHATBOT, verdicts * 2)}
        {line(vega.x + vega.w, vega.y + vega.h / 2, out.x, 760, VEGA, verdicts * 2 - 1)}
      </svg>
      <div style={{ position: "absolute", left: msg.x, top: msg.y, width: msg.w, height: msg.h, borderRadius: 22, background: "#2b3140", padding: "26px 30px", boxSizing: "border-box", color: "#fff" }}>
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.65)" }}>The person's message</div>
        <div style={{ fontSize: 30, lineHeight: 1.4, marginTop: 10 }}>…extremely drowsy, keeps slurring words… drifting in and out of consciousness…</div>
      </div>
      {card(bot, CHATBOT, "Chatbot · Gemma 3 4B", "Writes the answer", fork, <Cost items={["818 tokens", "67 s"]} note="median per answer" color={CHATBOT} />)}
      {card(vega, VEGA, "Vega · decision model", "Reads only the message", fork, (
        <div style={{ marginTop: 34 }}>
          <div style={{ position: "relative", height: 26, borderRadius: 13, background: "rgba(255,255,255,0.1)" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: pct(score), borderRadius: 13, background: crossed ? VEGA : alpha(VEGA, 0.6) }} />
            <div style={{ position: "absolute", left: pct(kase.vega.threshold), top: -12, bottom: -12, width: 4, background: "#fff" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 28, fontFamily: MONO, color: "rgba(255,255,255,0.8)" }}>
            <span>score {score.toFixed(2)}</span>
            <span>threshold {kase.vega.threshold.toFixed(3)}</span>
          </div>
          <Cost items={["no text", "0.36 s"]} note="median per decision" color={VEGA} />
        </div>
      ))}
      {verdict(170, "Self-care", CHATBOT, 0)}
      {verdict(680, "Emergency", VEGA, 1)}
      <div style={{ position: "absolute", left: out.x, top: 420, width: out.w, height: 200, display: "grid", placeItems: "center", opacity: ease(clash) }}>
        <div style={{ padding: "18px 24px", borderRadius: 16, background: "#fff4e0", color: "#6b4400", fontSize: 30, fontWeight: 700, textAlign: "center", transform: `scale(${0.9 + 0.1 * ease(clash)})` }}>Disagreement · shown to the person</div>
      </div>
    </AbsoluteFill>
  );
};
