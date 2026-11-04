import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { alpha, EASE, FONT, type Palette } from "../lib/theme";

// The need, as a schematic: one portal per department, each with its own sign-in, forms and owner,
// then a new hire in the middle working out where things go while requests bounce between desks.
// Generic windows (no real company's portal). The user asked for no "Schematic" label (2026-10-30).
export type ProblemTimes = {
  hr: number; it: number; payroll: number; learning: number; forms: number; owners: number;
  hire: number; system: number; form: number; person: number; support: number; incomplete: number; wrong: number;
};

const ramp = (frame: number, a: number, b: number) => EASE.enter(interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

export type Portal = { id: string; name: string; colour: string; forms: string[]; owner: string; x: number; y: number; w: number; h: number; tilt: number; key: keyof ProblemTimes };
export const PORTALS: Portal[] = [
  { id: "hr", name: "HR portal", colour: "#8a6fd1", forms: ["Employment eligibility (I-9)", "Emergency contacts", "Benefits enrollment"], owner: "HR Operations", x: 110, y: 120, w: 660, h: 380, tilt: -2.2, key: "hr" },
  { id: "it", name: "IT service desk", colour: "#d0714f", forms: ["Access request form", "Hardware request", "Software license request"], owner: "IT Support", x: 1150, y: 96, w: 660, h: 380, tilt: 1.8, key: "it" },
  { id: "payroll", name: "Payroll system", colour: "#3f8fcf", forms: ["Federal withholding (W-4)", "State withholding", "Direct deposit form"], owner: "Payroll team", x: 170, y: 590, w: 660, h: 380, tilt: 1.4, key: "payroll" },
  { id: "learning", name: "Learning platform", colour: "#4aa36c", forms: ["Required courses", "Security awareness training", "Code of conduct sign-off"], owner: "Learning & Development", x: 1090, y: 600, w: 660, h: 380, tilt: -1.6, key: "learning" },
];

const HIRE = { x: 760, y: 455, w: 400, h: 150 };
const QUESTIONS: [string, keyof ProblemTimes, number][] = [["Which system?", "system", -250], ["Which form?", "form", 0], ["Who do I ask?", "person", 250]];
// Requests sent from the new hire's card to a desk, and the stamp each one comes back with.
const TICKETS: { text: string; to: string; stamp: string; key: keyof ProblemTimes; tone: "warn" | "bad" }[] = [
  { text: "Laptop request", to: "it", stamp: "Incomplete · details missing", key: "incomplete", tone: "warn" },
  { text: "Can't sign in", to: "hr", stamp: "Wrong desk · send to IT", key: "wrong", tone: "bad" },
];

const centreOf = (p: { x: number; y: number; w: number; h: number }) => ({ x: p.x + p.w / 2, y: p.y + p.h / 2 });

export const Window: React.FC<{ p: Portal; t: ProblemTimes; frame: number; palette: Palette }> = ({ p, t, frame, palette }) => {
  const shown = ramp(frame, t[p.key] - 6, t[p.key] + 16);
  const back = ramp(frame, t.hire - 10, t.hire + 30);
  const formsLit = ramp(frame, t.forms - 4, t.forms + 14);
  const ownerLit = ramp(frame, t.owners - 4, t.owners + 14);
  const c = centreOf(p);
  // In the second half the windows step back and dim around the new hire.
  const pushX = (c.x - 960) * 0.1 * back;
  const pushY = (c.y - 540) * 0.1 * back;
  return (
    <div
      style={{
        position: "absolute", left: p.x, top: p.y, width: p.w, height: p.h,
        transform: `translate(${pushX}px, ${pushY + (1 - shown) * 40}px) rotate(${p.tilt}deg) scale(${(0.92 + 0.08 * shown) * (1 - 0.1 * back)})`,
        opacity: shown * (1 - 0.42 * back),
        borderRadius: 14, overflow: "hidden", background: "#eef0f3", boxShadow: "0 30px 80px rgba(0,0,0,0.45)", fontFamily: FONT,
      }}
    >
      <div style={{ height: 58, background: p.colour, display: "flex", alignItems: "center", padding: "0 22px", gap: 12 }}>
        {[0, 1, 2].map((i) => <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.55)" }} />)}
        <div style={{ marginLeft: 10, color: "#fff", fontSize: 28, fontWeight: 700 }}>{p.name}</div>
        <div style={{ marginLeft: "auto", color: "rgba(255,255,255,0.92)", fontSize: 18, fontWeight: 600, padding: "5px 12px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.6)" }}>Separate sign-in</div>
      </div>
      <div style={{ padding: "18px 24px 0" }}>
        {p.forms.map((form, i) => {
          const lit = ramp(frame, t.forms + i * 4 - 4, t.forms + i * 4 + 12) * formsLit;
          return (
            <div key={form} style={{ display: "flex", alignItems: "center", gap: 14, height: 62, borderBottom: "1px solid #d9dde3" }}>
              <div style={{ width: 30, height: 36, borderRadius: 4, border: `2px solid ${lit > 0.5 ? p.colour : "#a9b0ba"}`, background: "#fff" }} />
              <div style={{ fontSize: 24, color: "#2b3138", fontWeight: lit > 0.5 ? 650 : 500 }}>{form}</div>
              <div style={{ marginLeft: "auto", width: 110, height: 14, borderRadius: 7, background: "#d5d9df" }} />
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 64, display: "flex", alignItems: "center", padding: "0 24px", gap: 12,
          background: ownerLit > 0.5 ? alpha(p.colour, 0.16) : "#e3e6ea", borderTop: "1px solid #d0d5dc",
        }}
      >
        <div style={{ width: 34, height: 34, borderRadius: 17, background: p.colour, opacity: 0.85 }} />
        <div style={{ fontSize: 22, color: "#39414b" }}>Owner</div>
        <div style={{ fontSize: 22, color: "#1f252c", fontWeight: 700 }}>{p.owner}</div>
      </div>
    </div>
  );
};

export const RelayProblem: React.FC<{ palette: Palette; times: ProblemTimes }> = ({ palette, times: t }) => {
  const frame = useCurrentFrame();
  const hire = ramp(frame, t.hire, t.hire + 22);
  const byId = Object.fromEntries(PORTALS.map((p) => [p.id, p]));
  const hc = centreOf(HIRE);
  // Tangled routes from the new hire to every desk: each bends a different way.
  const route = (p: Portal, bend: number) => {
    const c = centreOf(p);
    const mx = (hc.x + c.x) / 2 + bend;
    const my = (hc.y + c.y) / 2 - bend * 0.6;
    return `M ${hc.x} ${hc.y} Q ${mx} ${my} ${c.x} ${c.y}`;
  };
  const bends = [160, -140, -180, 150];
  const lines = ramp(frame, t.system - 4, t.person + 20);
  const tone = (k: "warn" | "bad") => (k === "warn" ? palette.warn : "#ef5b5b");
  return (
    <AbsoluteFill>
      <Backdrop palette={palette} />
      <svg style={{ position: "absolute", inset: 0, width: 1920, height: 1080 }}>
        {PORTALS.map((p, i) => (
          <path key={p.id} d={route(p, bends[i])} fill="none" stroke={alpha("#ffffff", 0.5)} strokeWidth={3} strokeDasharray="10 12"
            style={{ opacity: lines * 0.9 * ramp(frame, t.system + i * 6, t.system + i * 6 + 24) }}
          />
        ))}
      </svg>
      {PORTALS.map((p) => <Window key={p.id} p={p} t={t} frame={frame} palette={palette} />)}
      {/* The new hire on day one. */}
      <div
        style={{
          position: "absolute", left: HIRE.x, top: HIRE.y, width: HIRE.w, height: HIRE.h, borderRadius: 22,
          background: alpha(palette.deep, 0.92), border: `2px solid ${alpha(palette.accent, 0.8)}`, boxShadow: `0 24px 70px ${alpha("#000", 0.5)}`,
          display: "flex", alignItems: "center", gap: 22, padding: "0 30px", fontFamily: FONT,
          opacity: hire, transform: `scale(${0.9 + 0.1 * hire})`,
        }}
      >
        <div style={{ width: 78, height: 78, borderRadius: 39, background: alpha(palette.accent, 0.25), border: `2px solid ${palette.accent}`, display: "grid", placeItems: "center", color: palette.ink, fontSize: 30, fontWeight: 700 }}>NH</div>
        <div>
          <div style={{ color: palette.ink, fontSize: 32, fontWeight: 700 }}>New hire</div>
          <div style={{ color: palette.muted, fontSize: 24, marginTop: 4 }}>Day one</div>
        </div>
      </div>
      {QUESTIONS.map(([text, key, dx]) => {
        const q = ramp(frame, t[key] - 4, t[key] + 14);
        const gone = ramp(frame, t.support - 6, t.support + 14);
        return (
          <div key={text} style={{
            position: "absolute", left: hc.x + dx - 110, top: HIRE.y - 74 - (key === "form" ? 26 : 0), width: 220, textAlign: "center", fontFamily: FONT,
            fontSize: 24, fontWeight: 650, color: "#10202c", background: "#ffffff", borderRadius: 999, padding: "10px 0",
            opacity: q * (1 - gone), transform: `translateY(${(1 - q) * 14}px)`, boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
          }}>{text}</div>
        );
      })}
      {TICKETS.map((k, i) => {
        const p = byId[k.to];
        const target = centreOf(p);
        const sendAt = t.support + i * 18;
        const go = ramp(frame, sendAt, k.key === "wrong" ? t.wrong - 8 : t.incomplete - 8);
        const stamped = ramp(frame, t[k.key] - 6, t[k.key] + 8);
        const x = hc.x + (target.x - hc.x) * 0.72 * go - 150;
        const y = hc.y + (target.y - hc.y) * 0.72 * go - 44;
        return (
          <div key={k.text} style={{ position: "absolute", left: x, top: y, width: 300, fontFamily: FONT, opacity: ramp(frame, sendAt - 4, sendAt + 8) }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", boxShadow: "0 16px 40px rgba(0,0,0,0.45)", borderLeft: `6px solid ${p.colour}` }}>
              <div style={{ fontSize: 18, color: "#5b6470", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Request</div>
              <div style={{ fontSize: 26, color: "#1c232b", fontWeight: 700, marginTop: 2 }}>{k.text}</div>
            </div>
            <div style={{
              marginTop: 10, display: "inline-block", whiteSpace: "nowrap", padding: "8px 14px", borderRadius: 10, fontSize: 22, fontWeight: 750, color: "#fff",
              background: tone(k.tone), opacity: stamped, transform: `scale(${1.25 - 0.25 * stamped}) rotate(-3deg)`, transformOrigin: "left center",
            }}>{k.stamp}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
