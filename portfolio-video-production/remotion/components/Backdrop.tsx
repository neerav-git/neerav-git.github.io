import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { alpha, type Palette } from "../lib/theme";

// Slow-drifting mesh in the project's palette. parallax shifts it against camera moves.
export const Backdrop: React.FC<{ palette: Palette; parallax?: { x: number; y: number; s: number } }> = ({ palette, parallax = { x: 0, y: 0, s: 1 } }) => {
  const frame = useCurrentFrame();
  const t = frame / 60;
  const blob = (cx: number, cy: number, r: number, color: string, speed: number, phase: number) => {
    const x = cx + Math.sin(t * speed + phase) * 7;
    const y = cy + Math.cos(t * speed * 0.8 + phase) * 6;
    return `radial-gradient(${r}% ${r * 1.2}% at ${x}% ${y}%, ${color} 0%, transparent 70%)`;
  };
  return (
    <AbsoluteFill style={{ background: palette.deep, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${parallax.x}px, ${parallax.y}px) scale(${1.08 * parallax.s})`,
          background: [
            blob(18, 22, 55, alpha(palette.accent, 0.42), 0.11, 0),
            blob(84, 78, 60, alpha(palette.accent2, 0.26), 0.09, 2.1),
            blob(70, 10, 40, alpha(palette.accent, 0.22), 0.13, 4.2),
            blob(12, 92, 45, alpha(palette.accent2, 0.14), 0.07, 1.3),
          ].join(","),
        }}
      />
    </AbsoluteFill>
  );
};

// Film grain (2.5%) and a soft vignette; one grade shared by every film.
export const Finish: React.FC = () => {
  const frame = useCurrentFrame();
  const variant = frame % 4;
  const ox = ((frame * 73) % 97) - 48;
  const oy = ((frame * 41) % 89) - 44;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 70% at 50% 48%, transparent 55%, rgba(0,0,0,0.42) 100%)" }} />
      <Img
        src={staticFile(`shared/noise-${variant}.png`)}
        style={{ position: "absolute", left: ox - 50, top: oy - 50, width: 2020, height: 1180, opacity: 0.028, mixBlendMode: "overlay" }}
      />
    </AbsoluteFill>
  );
};
