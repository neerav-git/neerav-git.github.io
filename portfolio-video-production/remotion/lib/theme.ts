import { Easing } from "remotion";

export const FONT = '"Inter Variable", Inter, system-ui, sans-serif';
export const MONO = '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, monospace';

// Strict typographic scale at 1080p. Nothing on screen is smaller than 28 px.
export const TYPE = { display: 104, h1: 72, h2: 56, title: 44, body: 34, label: 28 };

// Title-safe margins (5%).
export const SAFE = { x: 96, y: 54 };

export const EASE = {
  enter: Easing.bezier(0.22, 1, 0.36, 1),
  camera: Easing.bezier(0.65, 0, 0.35, 1),
  exit: Easing.bezier(0.64, 0, 0.78, 0),
};

export type Palette = {
  accent: string; // product accent, used for ripples, highlights, progress
  accent2: string; // secondary glow in the backdrop
  deep: string; // backdrop base
  ink: string; // primary text on dark
  muted: string; // secondary text on dark
  warn: string; // uncertainty / attention
  ok: string; // verified / passed
};

export const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
