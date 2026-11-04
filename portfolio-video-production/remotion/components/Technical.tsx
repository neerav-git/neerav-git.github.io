import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Highlight, themes } from "prism-react-renderer";
import { Backdrop } from "./Backdrop";
import { alpha, EASE, FONT, MONO, type Palette } from "../lib/theme";

const ramp = (frame: number, a: number, b: number) => EASE.enter(interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

const Window: React.FC<{ title: string; x: number; y: number; w: number; h: number; enter: number; children: React.ReactNode }> = ({ title, x, y, w, h, enter, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 18,
      overflow: "hidden",
      background: "#0d1117",
      boxShadow: "0 0 0 1px rgba(255,255,255,0.10), 0 40px 100px rgba(0,0,0,0.55)",
      opacity: enter,
      transform: `translateY(${(1 - enter) * 60}px) scale(${0.96 + 0.04 * enter})`,
    }}
  >
    <div style={{ height: 56, display: "flex", alignItems: "center", position: "relative", background: "#161b22", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ display: "flex", gap: 9, marginLeft: 22 }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
          <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontFamily: FONT, fontSize: 28, fontWeight: 550, color: "rgba(255,255,255,0.6)" }}>{title}</div>
    </div>
    {children}
  </div>
);

// Styled terminal replaying a real command's captured output with its real line order.
export const Terminal: React.FC<{
  palette: Palette;
  title: string;
  prompt: string;
  command: string;
  lines: { text: string; at: number }[]; // at: frames after the command is entered
  typeFrom?: number;
  emphasise?: (line: string) => "ok" | "dim" | "strong" | undefined;
  rect?: { x: number; y: number; w: number; h: number };
  backdrop?: boolean;
}> = ({ palette, title, prompt, command, lines, typeFrom = 8, emphasise, rect = { x: 210, y: 120, w: 1500, h: 840 }, backdrop = true }) => {
  const frame = useCurrentFrame();
  const enter = ramp(frame, 0, 26);
  const perChar = 1.6;
  const typed = Math.max(0, Math.min(command.length, Math.floor((frame - typeFrom) / perChar)));
  const entered = typeFrom + command.length * perChar + 8;
  const lineH = 42;
  const visible = lines.filter((l) => frame >= entered + l.at);
  const capacity = Math.floor((rect.h - 56 - 60) / lineH) - 1;
  // Smooth scroll: follow the newest line with an eased offset.
  const target = Math.max(0, visible.length + 1 - capacity) * lineH;
  const lastAt = visible.length ? entered + visible[visible.length - 1].at : 0;
  const prevTarget = Math.max(0, visible.length - capacity) * lineH;
  const scroll = prevTarget + (target - prevTarget) * ramp(frame, lastAt, lastAt + 8);
  const caretOn = Math.floor(frame / 16) % 2 === 0;
  return (
    <AbsoluteFill>
      {backdrop && <Backdrop palette={palette} />}
      <Window title={title} x={rect.x} y={rect.y} w={rect.w} h={rect.h} enter={enter}>
        <div style={{ position: "absolute", top: 56 + 30, left: 40, right: 40, bottom: 30, overflow: "hidden", fontFamily: MONO, fontSize: 28, lineHeight: `${lineH}px` }}>
          <div style={{ transform: `translateY(${-scroll}px)` }}>
            <div style={{ color: "#e6edf3", whiteSpace: "pre" }}>
              <span style={{ color: palette.accent }}>{prompt}</span> {command.slice(0, typed)}
              {frame < entered && caretOn && <span style={{ background: "#e6edf3", color: "#0d1117" }}> </span>}
            </div>
            {visible.map((l, i) => {
              const kind = emphasise?.(l.text);
              const appear = ramp(frame, entered + l.at, entered + l.at + 6);
              const color = kind === "ok" ? palette.ok : kind === "dim" ? "rgba(230,237,243,0.45)" : kind === "strong" ? "#fff" : "#c9d1d9";
              return (
                <div key={i} style={{ whiteSpace: "pre", color, opacity: appear, fontWeight: kind === "strong" ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {/^(PASS|ok) /.test(l.text) ? (
                    <>
                      <span style={{ color: palette.ok, fontWeight: 700 }}>{l.text.split(" ")[0]}</span>
                      {l.text.slice(l.text.indexOf(" "))}
                    </>
                  ) : (
                    l.text
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Window>
    </AbsoluteFill>
  );
};

// Syntax-highlighted editor panel; lines highlight in sync and the panel scrolls to them.
export const CodePanel: React.FC<{
  code: string;
  language: string;
  file: string;
  highlights: { from: number; lines: [number, number] }[];
  rect: { x: number; y: number; w: number; h: number };
  palette: Palette;
}> = ({ code, language, file, highlights, rect, palette }) => {
  const frame = useCurrentFrame();
  const enter = ramp(frame, 0, 24);
  const lineH = 40;
  let active = highlights[0];
  let prev = highlights[0];
  for (const h of highlights) {
    if (frame >= h.from) {
      prev = active;
      active = h;
    }
  }
  const p = ramp(frame, active.from, active.from + 30);
  const centre = (h: typeof active) => ((h.lines[0] + h.lines[1]) / 2) * lineH - (rect.h - 56) / 2 + lineH;
  const scroll = Math.max(0, centre(prev) + (centre(active) - centre(prev)) * p);
  return (
    <Window title={file} x={rect.x} y={rect.y} w={rect.w} h={rect.h} enter={enter}>
      <Highlight code={code} language={language} theme={themes.vsDark}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <div style={{ position: "absolute", top: 56, left: 0, right: 0, bottom: 0, overflow: "hidden", fontFamily: MONO, fontSize: 28 }}>
            <div style={{ transform: `translateY(${-scroll + 20}px)` }}>
              {tokens.map((line, i) => {
                const n = i + 1;
                const on = n >= active.lines[0] && n <= active.lines[1];
                return (
                  <div key={i} {...getLineProps({ line })} style={{ display: "flex", height: lineH, lineHeight: `${lineH}px`, background: on ? alpha(palette.accent, 0.16 * p) : "transparent", boxShadow: on ? `inset 4px 0 0 ${alpha(palette.accent, p)}` : undefined, opacity: on || p < 0.01 ? 1 : 1 - 0.45 * p }}>
                    <span style={{ width: 72, textAlign: "right", paddingRight: 22, color: "rgba(255,255,255,0.3)" }}>{n}</span>
                    <span style={{ whiteSpace: "pre" }}>
                      {line.map((token, k) => (
                        <span key={k} {...getTokenProps({ token })} />
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Highlight>
    </Window>
  );
};

// Bars grow from zero to real values; one bar can be singled out.
export const ChartDrawOn: React.FC<{
  data: { label: string; value: number; color?: string }[];
  max: number;
  from: number;
  rect: { x: number; y: number; w: number; h: number };
  palette: Palette;
  format?: (v: number) => string;
  focus?: { index: number; at: number };
}> = ({ data, max, from, rect, palette, format = (v) => String(v), focus }) => {
  const frame = useCurrentFrame();
  const rowH = rect.h / data.length;
  const f = focus ? ramp(frame, focus.at, focus.at + 20) : 0;
  return (
    <div style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, fontFamily: FONT }}>
      {data.map((d, i) => {
        const p = ramp(frame, from + i * 6, from + i * 6 + 36);
        const dim = focus && focus.index !== i ? 1 - 0.55 * f : 1;
        return (
          <div key={d.label} style={{ position: "absolute", top: i * rowH, left: 0, right: 0, height: rowH, display: "flex", alignItems: "center", gap: 24, opacity: dim }}>
            <div style={{ width: 360, fontSize: 30, color: "rgba(255,255,255,0.82)", textAlign: "right" }}>{d.label}</div>
            <div style={{ flex: 1, height: rowH * 0.5, position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 10, background: "rgba(255,255,255,0.06)" }} />
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(d.value / max) * 100 * p}%`, borderRadius: 10, background: d.color ?? palette.accent }} />
            </div>
            <div style={{ width: 150, fontSize: 32, fontWeight: 700, color: "#fff", opacity: p }}>{format(d.value * p)}</div>
          </div>
        );
      })}
    </div>
  );
};

// Who is talking in a dialogue cue: a name tag in the speaker's colour replaces the "Name:" prefix.
const SPEAKERS: Record<string, { name: string; colour: string }> = {
  maya: { name: "Maya", colour: "#f5b14a" },
  relay: { name: "Relay Guide", colour: "#3ccfba" },
};

// Captions track (burned-in version): sentence-level timing, one line at a time.
export const Captions: React.FC<{ cues: { start: number; end: number; text: string; speaker?: string }[] }> = ({ cues }) => {
  const frame = useCurrentFrame();
  const cue = cues.find((c) => frame >= c.start && frame < c.end);
  if (!cue) return null;
  const o = interpolate(frame, [cue.start, cue.start + 6, cue.end - 6, cue.end], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const who = cue.speaker ? SPEAKERS[cue.speaker] : undefined;
  const text = who ? cue.text.replace(/^[A-Z][a-z]+: /, "") : cue.text;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 58, display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ maxWidth: 1500, padding: "10px 26px 12px", borderRadius: 14, background: "rgba(6,9,18,0.78)", color: "#fff", fontFamily: FONT, fontSize: 36, fontWeight: 550, lineHeight: 1.25, textAlign: "center", letterSpacing: -0.2, display: "flex", alignItems: "center", gap: 16, borderLeft: who ? `5px solid ${who.colour}` : undefined }}>
        {who && <span style={{ flex: "none", fontSize: 24, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: who.colour }}>{who.name}</span>}
        <span>{text}</span>
      </div>
    </div>
  );
};
