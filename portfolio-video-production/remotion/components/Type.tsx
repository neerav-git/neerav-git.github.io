import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE, FONT } from "../lib/theme";

// Per-word entrance: 45 ms stagger, rise + fade + blur 8 → 0. `exitAt` mirrors it out.
export const KineticText: React.FC<{
  text: string;
  start?: number;
  size: number;
  weight?: number;
  color: string;
  stagger?: number;
  exitAt?: number;
  style?: React.CSSProperties;
  highlight?: { words: string[]; color: string };
  align?: "left" | "center";
}> = ({ text, start = 0, size, weight = 650, color, stagger = 2.7, exitAt, style, highlight, align = "left" }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  return (
    <div style={{ fontFamily: FONT, fontSize: size, fontWeight: weight, lineHeight: 1.12, letterSpacing: size > 60 ? -1.6 : -0.4, color, textAlign: align, ...style }}>
      {words.map((word, i) => {
        const t0 = start + i * stagger;
        const p = EASE.enter(interpolate(frame, [t0, t0 + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
        const q = exitAt === undefined ? 0 : EASE.exit(interpolate(frame, [exitAt + i * 1.2, exitAt + i * 1.2 + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
        const hot = highlight?.words.includes(word.replace(/[.,]/g, ""));
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: "0.26em",
              opacity: p * (1 - q),
              transform: `translateY(${(1 - p) * size * 0.42 - q * size * 0.2}px)`,
              filter: `blur(${(1 - p) * 8 + q * 6}px)`,
              color: hot ? highlight!.color : undefined,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// Counts up to a real metric with an ease-out, holding the final value.
export const Counter: React.FC<{ to: number; start: number; dur?: number; format?: (n: number) => string }> = ({ to, start, dur = 42, format = (n) => String(n) }) => {
  const frame = useCurrentFrame();
  const p = EASE.enter(interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return <>{format(Math.round(to * p))}</>;
};
