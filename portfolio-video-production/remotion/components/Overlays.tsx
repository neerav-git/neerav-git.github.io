import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { Box } from "../lib/geometry";
import { alpha, EASE, FONT, type Palette } from "../lib/theme";

const span = (frame: number, from: number, to: number, inDur = 18, outDur = 14) => {
  const i = EASE.enter(interpolate(frame, [from, from + inDur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const o = EASE.exit(interpolate(frame, [to - outDur, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return i * (1 - o);
};

// Dims everything outside a box inside the window content (drawn in content coordinates).
export const CalloutDim: React.FC<{ box: Box; from: number; to: number; scale: number; pad?: number; radius?: number; dim?: number }> = ({ box, from, to, scale, pad = 10, radius = 14, dim = 0.5 }) => {
  const frame = useCurrentFrame();
  const v = span(frame, from, to);
  if (v <= 0) return null;
  const x = box.x * scale - pad;
  const y = box.y * scale - pad;
  const w = box.width * scale + pad * 2;
  const h = box.height * scale + pad * 2;
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      <defs>
        <mask id={`dim-${from}`}>
          <rect width="100%" height="100%" fill="white" />
          <rect x={x} y={y} width={w} height={h} rx={radius} fill="black" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={`rgba(8,12,24,${dim * v})`} mask={`url(#dim-${from})`} />
    </svg>
  );
};

// Highlight ring and label for the exact UI region being discussed (screen coordinates).
export const CalloutRing: React.FC<{
  box: Box;
  from: number;
  to: number;
  palette: Palette;
  label?: string;
  side?: "top" | "bottom" | "left" | "right";
  pad?: number;
  tone?: "accent" | "warn" | "ok";
}> = ({ box, from, to, palette, label, side = "top", pad = 10, tone = "accent" }) => {
  const frame = useCurrentFrame();
  const v = span(frame, from, to);
  if (v <= 0) return null;
  const color = tone === "warn" ? palette.warn : tone === "ok" ? palette.ok : palette.accent;
  const draw = EASE.enter(interpolate(frame, [from, from + 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const x = box.x - pad;
  const y = box.y - pad;
  const w = box.width + pad * 2;
  const h = box.height + pad * 2;
  const perimeter = 2 * (w + h);
  const labelIn = EASE.enter(interpolate(frame, [from + 10, from + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const lead = 34;
  const anchor =
    side === "top" ? { x: x + Math.min(w * 0.5, 80), y } : side === "bottom" ? { x: x + Math.min(w * 0.5, 80), y: y + h } : side === "left" ? { x, y: y + h / 2 } : { x: x + w, y: y + h / 2 };
  const end =
    side === "top" ? { x: anchor.x, y: anchor.y - lead } : side === "bottom" ? { x: anchor.x, y: anchor.y + lead } : side === "left" ? { x: anchor.x - lead, y: anchor.y } : { x: anchor.x + lead, y: anchor.y };
  return (
    <div style={{ position: "absolute", inset: 0, opacity: v, pointerEvents: "none" }}>
      <svg style={{ position: "absolute", inset: 0, width: 1920, height: 1080, overflow: "visible" }}>
        <rect x={x} y={y} width={w} height={h} rx={14} fill="none" stroke={alpha(color, 0.35)} strokeWidth={10} strokeDasharray={perimeter} strokeDashoffset={perimeter * (1 - draw)} />
        <rect x={x} y={y} width={w} height={h} rx={14} fill="none" stroke={color} strokeWidth={3} strokeDasharray={perimeter} strokeDashoffset={perimeter * (1 - draw)} />
        {label && <line x1={anchor.x} y1={anchor.y} x2={anchor.x + (end.x - anchor.x) * labelIn} y2={anchor.y + (end.y - anchor.y) * labelIn} stroke={color} strokeWidth={3} strokeLinecap="round" />}
      </svg>
      {label && (
        <div
          style={{
            position: "absolute",
            left: side === "left" ? undefined : side === "right" ? end.x : end.x - 24,
            right: side === "left" ? 1920 - end.x : undefined,
            top: side === "top" ? end.y - 58 : side === "bottom" ? end.y : end.y - 29,
            height: 58,
            display: "flex",
            alignItems: "center",
            padding: "0 22px",
            borderRadius: 14,
            background: color,
            color: "#fff",
            fontFamily: FONT,
            fontWeight: 650,
            fontSize: 30,
            letterSpacing: -0.2,
            whiteSpace: "nowrap",
            boxShadow: `0 10px 30px ${alpha(color, 0.45)}`,
            opacity: labelIn,
            transform: `translateY(${(1 - labelIn) * (side === "bottom" ? -10 : 10)}px) scale(${0.92 + 0.08 * labelIn})`,
            transformOrigin: "left center",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

// Feature name with accent bar, bottom-left, above the caption zone.
export const LowerThird: React.FC<{ title: string; detail?: string; from: number; to: number; palette: Palette; bottom?: number }> = ({ title, detail, from, to, palette, bottom = 136 }) => {
  const frame = useCurrentFrame();
  const v = span(frame, from, to, 22, 16);
  if (v <= 0) return null;
  const bar = EASE.enter(interpolate(frame, [from, from + 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const textIn = EASE.enter(interpolate(frame, [from + 6, from + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        bottom,
        display: "flex",
        alignItems: "stretch",
        gap: 0,
        opacity: v,
        borderRadius: 16,
        overflow: "hidden",
        background: "rgba(10,14,26,0.82)",
        backdropFilter: "blur(18px)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)",
        transform: `translateX(${(1 - bar) * -24}px)`,
      }}
    >
      <div style={{ width: 8, background: palette.accent, transform: `scaleY(${bar})`, transformOrigin: "bottom" }} />
      <div style={{ padding: "16px 28px 18px 22px", fontFamily: FONT, opacity: textIn, transform: `translateY(${(1 - textIn) * 10}px)`, filter: `blur(${(1 - textIn) * 6}px)` }}>
        <div style={{ fontSize: 38, fontWeight: 700, color: "#fff", letterSpacing: -0.6, lineHeight: 1.1 }}>{title}</div>
        {detail && <div style={{ fontSize: 28, fontWeight: 450, color: "rgba(255,255,255,0.74)", marginTop: 6 }}>{detail}</div>}
      </div>
    </div>
  );
};

// Journey progress: "1 Plan → 2 Source → …", current step expanded in the accent colour.
export const JourneyTracker: React.FC<{ steps: { label: string; from: number }[]; from: number; to: number; palette: Palette }> = ({ steps, from, to, palette }) => {
  const frame = useCurrentFrame();
  // Shown for ~2.5 s at each step change, so it never sits over zoomed footage for long.
  const atStep = Math.max(
    ...steps.map((s) => interpolate(frame, [s.from + 6, s.from + 24, s.from + 150, s.from + 168], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })),
  );
  const v = span(frame, from, to, 24, 18) * atStep;
  if (v <= 0.001) return null;
  let current = 0;
  steps.forEach((s, i) => {
    if (frame >= s.from) current = i;
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 56,
        left: "50%",
        transform: `translate(-50%, ${(1 - v) * -16}px)`,
        opacity: v,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: 6,
        borderRadius: 999,
        background: "rgba(10,14,26,0.72)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08)",
        fontFamily: FONT,
      }}
    >
      {steps.map((s, i) => {
        const on = EASE.enter(interpolate(frame, [s.from, s.from + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
        const next = steps[i + 1];
        const off = next ? EASE.enter(interpolate(frame, [next.from, next.from + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })) : 0;
        const active = on * (1 - off);
        const done = i < current;
        return (
          <div
            key={s.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              height: 46,
              padding: `0 ${14 + active * 8}px`,
              borderRadius: 999,
              background: active > 0.01 ? alpha(palette.accent, active) : "transparent",
              color: active > 0.5 ? "#fff" : done ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.46)",
              fontSize: 28,
              fontWeight: active > 0.5 ? 650 : 500,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontWeight: 700, opacity: active > 0.5 ? 0.7 : 0.6, fontVariantNumeric: "tabular-nums" }}>{done ? "✓" : i + 1}</span>
            {s.label}
          </div>
        );
      })}
    </div>
  );
};

// Animated state chip, e.g. "Verified" or "32/32 checks".
export const Chip: React.FC<{ text: string; from: number; to: number; x: number; y: number; color: string; icon?: string; anchor?: "left" | "center" | "right" }> = ({ text, from, to, x, y, color, icon, anchor = "left" }) => {
  const frame = useCurrentFrame();
  const v = span(frame, from, to, 20, 14);
  if (v <= 0) return null;
  const pop = EASE.enter(interpolate(frame, [from, from + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const tx = anchor === "center" ? "-50%" : anchor === "right" ? "-100%" : "0";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(${tx}, 0) scale(${0.86 + 0.14 * pop})`,
        transformOrigin: anchor === "right" ? "right center" : anchor === "center" ? "center" : "left center",
        opacity: v,
        display: "flex",
        alignItems: "center",
        gap: 12,
        height: 60,
        padding: "0 24px 0 18px",
        borderRadius: 999,
        background: color,
        color: "#fff",
        fontFamily: FONT,
        fontWeight: 650,
        fontSize: 30,
        whiteSpace: "nowrap",
        boxShadow: `0 14px 34px ${alpha(color, 0.45)}, inset 0 0 0 1px rgba(255,255,255,0.18)`,
      }}
    >
      {icon && <span style={{ width: 34, height: 34, borderRadius: 17, background: "rgba(255,255,255,0.22)", display: "grid", placeItems: "center", fontSize: 20 }}>{icon}</span>}
      {text}
    </div>
  );
};
