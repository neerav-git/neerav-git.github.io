import React from "react";
import { interpolate } from "remotion";
import { alpha, EASE } from "../lib/theme";

// macOS-style arrow, drawn as a vector so it stays crisp at any camera zoom.
export const Cursor: React.FC<{ x: number; y: number; scale: number; pressed: number; opacity?: number }> = ({ x, y, scale, pressed, opacity = 1 }) => {
  const s = scale * (1 - 0.14 * pressed);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${s})`, transformOrigin: "3px 2px", opacity, pointerEvents: "none" }}>
      <svg width={34} height={46} viewBox="0 0 17 23" style={{ position: "absolute", left: -3, top: -2, overflow: "visible", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.35)) drop-shadow(0 6px 10px rgba(0,0,0,0.18))" }}>
        <path d="M1.5 1.2 L1.5 18.4 L5.6 14.5 L8.4 20.9 L11.3 19.6 L8.6 13.3 L14.2 13.3 Z" fill="#111" stroke="#fff" strokeWidth={1.25} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// Expanding accent ring from the click point, 450 ms.
export const ClickRipple: React.FC<{ x: number; y: number; age: number; color: string; scale: number }> = ({ x, y, age, color, scale }) => {
  const dur = 27;
  if (age < 0 || age > dur) return null;
  const p = EASE.enter(age / dur);
  const r = interpolate(p, [0, 1], [6, 46]) * scale;
  const o = interpolate(age, [0, 4, dur], [0, 0.9, 0], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        border: `${3 * scale}px solid ${alpha(color, o)}`,
        background: alpha(color, o * 0.18),
        pointerEvents: "none",
      }}
    />
  );
};
