import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "./Backdrop";
import { KineticText } from "./Type";
import { alpha, EASE, FONT, type Palette } from "../lib/theme";

const ramp = (frame: number, a: number, b: number) => EASE.enter(interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

// Shared ≤2 s sting: the project mark scales in, its stroke draws, the wordmark wipes on.
export const IntroSting: React.FC<{ palette: Palette; mark: React.ReactNode; wordmark: React.ReactNode; tagline: string }> = ({ palette, mark, wordmark, tagline }) => {
  const frame = useCurrentFrame();
  const m = ramp(frame, 0, 26);
  const w = ramp(frame, 14, 44);
  const glow = interpolate(frame, [0, 20, 70], [0, 1, 0.35], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Backdrop palette={palette} />
      <AbsoluteFill style={{ background: `radial-gradient(40% 40% at 50% 48%, ${alpha(palette.accent, 0.35 * glow)}, transparent 70%)` }} />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
          <div style={{ transform: `scale(${0.6 + 0.4 * m}) rotate(${(1 - m) * -12}deg)`, opacity: m, filter: `blur(${(1 - m) * 8}px)` }}>{mark}</div>
          <div style={{ clipPath: `inset(-20% ${100 - w * 100}% -20% 0)`, transform: `translateX(${(1 - w) * -24}px)` }}>{wordmark}</div>
        </div>
        <KineticText text={tagline} start={30} size={36} weight={500} color="rgba(255,255,255,0.78)" align="center" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Shared end card: project, one-line impact, author, portfolio link.
export const EndCard: React.FC<{ palette: Palette; title: string; impact: string; link: string; mark?: React.ReactNode }> = ({ palette, title, impact, link, mark }) => {
  const frame = useCurrentFrame();
  const line = ramp(frame, 24, 54);
  const foot = ramp(frame, 40, 66);
  return (
    <AbsoluteFill>
      <Backdrop palette={palette} />
      <AbsoluteFill style={{ padding: "0 180px", display: "flex", flexDirection: "column", justifyContent: "center", fontFamily: FONT }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          {mark && <div style={{ opacity: ramp(frame, 0, 20), transform: `scale(${0.8 + 0.2 * ramp(frame, 0, 20)})` }}>{mark}</div>}
          <KineticText text={title} size={104} weight={750} color="#fff" />
        </div>
        <KineticText text={impact} start={10} size={44} weight={500} color="rgba(255,255,255,0.82)" stagger={1.6} style={{ marginTop: 22, maxWidth: 1400 }} />
        <div style={{ height: 3, width: 1560 * line, background: `linear-gradient(90deg, ${palette.accent}, ${alpha(palette.accent, 0)})`, margin: "56px 0 40px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", opacity: foot, transform: `translateY(${(1 - foot) * 14}px)` }}>
          <div style={{ fontSize: 40, fontWeight: 650, color: "#fff", letterSpacing: -0.4 }}>Neerav Chaudhary</div>
          <div style={{ fontSize: 34, fontWeight: 550, color: palette.accent2 === palette.accent ? palette.accent : "#fff", opacity: 0.9 }}>{link}</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ≤1.2 s kinetic chapter card with the film's progress.
export const ChapterCard: React.FC<{ palette: Palette; title: string; steps: string[]; current: number }> = ({ palette, title, steps, current }) => {
  const frame = useCurrentFrame();
  const sweep = ramp(frame, 0, 30);
  return (
    <AbsoluteFill>
      <Backdrop palette={palette} />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40, fontFamily: FONT }}>
        <div style={{ display: "flex", gap: 18, alignItems: "center", fontSize: 30, fontWeight: 600 }}>
          {steps.map((s, i) => {
            const on = i === current;
            const done = i < current;
            return (
              <React.Fragment key={s}>
                {i > 0 && <div style={{ width: 54, height: 2, background: done || on ? palette.accent : "rgba(255,255,255,0.22)", transform: `scaleX(${on ? sweep : 1})`, transformOrigin: "left" }} />}
                <div
                  style={{
                    padding: "10px 22px",
                    borderRadius: 999,
                    color: on ? "#fff" : done ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.45)",
                    background: on ? alpha(palette.accent, sweep) : "rgba(255,255,255,0.06)",
                  }}
                >
                  {done ? "✓ " : `${i + 1}  `}
                  {s}
                </div>
              </React.Fragment>
            );
          })}
        </div>
        <KineticText text={title} start={4} size={104} weight={750} color="#fff" align="center" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// A real source document, read section by section; one section becomes the subject.
export const DocumentReveal: React.FC<{
  palette: Palette;
  heading: string;
  meta: string;
  sections: { title: string; text: string; flag?: string }[];
  focus: number; // section index to single out
  focusAt: number;
  marks?: { text: string; at: number }[];
  chips?: { text: string; at: number }[];
  scan?: { index: number; at: number }[]; // a reading pass: each section lights in turn
}> = ({ palette, heading, meta, sections, focus, focusAt, marks = [], chips = [], scan = [] }) => {
  const frame = useCurrentFrame();
  const enter = ramp(frame, 0, 40);
  const f = ramp(frame, focusAt, focusAt + 24);
  const drift = interpolate(frame, [0, 600], [0, 1]);
  return (
    <AbsoluteFill>
      <Backdrop palette={palette} />
      <AbsoluteFill style={{ perspective: 2400 }}>
        <div
          style={{
            position: "absolute",
            left: 330,
            top: 120 - f * 40,
            width: 1260,
            padding: "52px 64px 40px",
            borderRadius: 22,
            background: "#fbfaf7",
            boxShadow: "0 40px 100px rgba(3,8,20,0.5), 0 0 0 1px rgba(255,255,255,0.4)",
            fontFamily: FONT,
            transform: `translateY(${(1 - enter) * 80}px) rotateX(${(1 - enter) * 10 + 2 - drift * 2}deg) rotateZ(${-0.6 + drift * 0.6}deg) scale(${0.96 + enter * 0.04 + f * 0.02})`,
            opacity: enter,
            transformOrigin: "50% 100%",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 26 }}>
            <div style={{ fontSize: 44, fontWeight: 750, color: "#0f172a", letterSpacing: -0.8 }}>{heading}</div>
            <div style={{ fontSize: 28, fontWeight: 500, color: "#64748b" }}>{meta}</div>
          </div>
          {sections.map((s, i) => {
            const appear = ramp(frame, 14 + i * 10, 40 + i * 10);
            const isFocus = i === focus;
            const dim = isFocus ? 1 : 1 - 0.62 * f;
            const read = scan.find((r) => r.index === i);
            const next = read ? scan.find((r) => r.at > read.at) : undefined;
            const reading = read ? ramp(frame, read.at, read.at + 14) * (1 - ramp(frame, (next?.at ?? focusAt), (next?.at ?? focusAt) + 14)) : 0;
            return (
              <div
                key={s.title}
                style={{
                  position: "relative",
                  padding: "18px 24px",
                  margin: "0 -24px 6px",
                  borderRadius: 14,
                  opacity: appear * dim,
                  transform: `translateY(${(1 - appear) * 16}px) scale(${isFocus ? 1 + f * 0.015 : 1})`,
                  background: isFocus ? alpha(palette.warn, 0.16 * f) : alpha(palette.accent, 0.07 * reading),
                  boxShadow: isFocus ? `inset 0 0 0 ${2 * f}px ${alpha(palette.warn, 0.7)}` : reading > 0.01 ? `inset 5px 0 0 ${alpha(palette.accent, 0.75 * reading)}` : undefined,
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 700, color: isFocus && f > 0.5 ? "#9a5b00" : "#334155", letterSpacing: 0.2, textTransform: "uppercase" }}>{s.title}</div>
                <div style={{ fontSize: 31, lineHeight: 1.38, color: "#1e293b", marginTop: 6 }}>
                  {isFocus && marks.length ? highlightRuns(s.text, marks, frame, palette) : s.text}
                </div>
              </div>
            );
          })}
        </div>
        {chips.map((c, i) => {
          const p = ramp(frame, c.at, c.at + 20);
          return (
            <div
              key={c.text}
              style={{
                position: "absolute",
                right: 150 - (1 - p) * 30,
                top: 670 + i * 78,
                opacity: p,
                transform: `scale(${0.88 + 0.12 * p})`,
                height: 60,
                padding: "0 26px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderRadius: 999,
                background: palette.warn,
                color: "#1b1205",
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 30,
                boxShadow: `0 16px 34px ${alpha(palette.warn, 0.4)}`,
              }}
            >
              {c.text}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

function highlightRuns(text: string, marks: { text: string; at: number }[], frame: number, palette: Palette) {
  let parts: React.ReactNode[] = [text];
  for (const m of marks) {
    parts = parts.flatMap((part) => {
      if (typeof part !== "string" || !part.includes(m.text)) return [part];
      const [a, b] = part.split(m.text);
      const p = ramp(frame, m.at, m.at + 22);
      return [
        a,
        <span key={m.text} style={{ backgroundImage: `linear-gradient(${alpha(palette.warn, 0.55)}, ${alpha(palette.warn, 0.55)})`, backgroundSize: `${p * 100}% 42%`, backgroundPosition: "0 88%", backgroundRepeat: "no-repeat", fontWeight: 600 }}>
          {m.text}
        </span>,
        b,
      ];
    });
  }
  return parts;
}

// Designed poster: identity on the left, a real captured frame in a tilted window on the right.
export const Poster: React.FC<{
  palette: Palette;
  mark: React.ReactNode;
  wordmark: React.ReactNode;
  tagline: string;
  window: React.ReactNode;
}> = ({ palette, mark, wordmark, tagline, window }) => (
  <AbsoluteFill>
    <Backdrop palette={palette} />
    <AbsoluteFill style={{ background: `radial-gradient(45% 60% at 72% 52%, ${alpha(palette.accent, 0.32)}, transparent 70%)` }} />
    <AbsoluteFill style={{ perspective: 2400, perspectiveOrigin: "1300px 540px" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transform: "translate(700px, 170px) scale(0.68) rotateY(-16deg) rotateX(4deg)", transformOrigin: "0 0" }}>{window}</div>
    </AbsoluteFill>
    <AbsoluteFill style={{ background: `linear-gradient(90deg, ${palette.deep} 0%, ${alpha(palette.deep, 0.92)} 30%, ${alpha(palette.deep, 0)} 52%)` }} />
    <AbsoluteFill style={{ padding: "0 120px", display: "flex", flexDirection: "column", justifyContent: "center", fontFamily: FONT, gap: 34 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        {mark}
        {wordmark}
      </div>
      <div style={{ fontSize: 44, fontWeight: 550, lineHeight: 1.2, color: "rgba(255,255,255,0.86)", maxWidth: 640, letterSpacing: -0.6 }}>{tagline}</div>
      <div style={{ height: 3, width: 420, background: `linear-gradient(90deg, ${palette.accent}, ${alpha(palette.accent, 0)})` }} />
      <div style={{ fontSize: 34, fontWeight: 650, color: "#fff" }}>Neerav Chaudhary</div>
    </AbsoluteFill>
  </AbsoluteFill>
);
