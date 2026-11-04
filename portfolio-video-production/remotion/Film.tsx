import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { Finish } from "./components/Backdrop";
import { JourneyTracker, StatusLine } from "./components/Overlays";
import { Captions } from "./components/Technical";
import type { Layout } from "./lib/geometry";
import { alpha, EASE, type Palette } from "./lib/theme";

export type TransitionSpec = {
  type: "cut" | "zoomThrough" | "radial" | "whip" | "wipe" | "blurDissolve";
  dur: number;
  origin?: { x: number; y: number };
  dir?: "left" | "right" | "up" | "down";
};

export type PlanScene = { id: string; kind: string; from: number; duration: number; in?: TransitionSpec; out?: TransitionSpec; [key: string]: unknown };

export type StatusCue = { start: number; end: number; text: string; sub?: string; cut?: string };

export type Plan = {
  slug: string;
  fps: number;
  durationInFrames: number;
  layout: Layout;
  palette: Palette;
  scenes: PlanScene[];
  tracker?: { from: number; to: number; steps: { label: string; from: number }[] };
  captions: { start: number; end: number; text: string; speaker?: string }[];
  status?: StatusCue[];
  meta: { tagline: string; impact: string; link: string };
  poster?: { video: string; frame: number };
};

const dirVec = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] } as const;

// Styles for a scene while it enters or exits through a transition (p: 0 → 1).
function transitionStyle(t: TransitionSpec, p: number, entering: boolean): { style: React.CSSProperties; blur?: [number, number]; on: boolean } {
  const e = EASE.camera(p);
  const o = t.origin ?? { x: 960, y: 540 };
  switch (t.type) {
    case "zoomThrough":
      return entering
        ? { style: { transform: `scale(${0.84 + 0.16 * EASE.enter(p)})`, transformOrigin: `${o.x}px ${o.y}px`, opacity: interpolate(p, [0, 0.55], [0, 1], { extrapolateRight: "clamp" }) }, blur: [(1 - p) * 10, (1 - p) * 10], on: false }
        : { style: { transform: `scale(${1 + 2.2 * e * e})`, transformOrigin: `${o.x}px ${o.y}px`, opacity: interpolate(p, [0.45, 1], [1, 0], { extrapolateLeft: "clamp" }) }, blur: [e * 12, e * 12], on: true };
    case "radial": {
      if (!entering) return { style: { transform: `scale(${1 - 0.04 * e})`, filter: `brightness(${1 - 0.35 * e})`, transformOrigin: `${o.x}px ${o.y}px` }, on: false };
      const r = e * 2300;
      return { style: { clipPath: `circle(${r}px at ${o.x}px ${o.y}px)` }, on: true };
    }
    case "whip": {
      const [dx, dy] = dirVec[t.dir ?? "left"];
      const d = entering ? (1 - e) : -e;
      const speed = Math.sin(Math.PI * p);
      return { style: { transform: `translate(${-dx * d * 1250}px, ${-dy * d * 1250}px)` }, blur: [Math.abs(dx) * speed * 46, Math.abs(dy) * speed * 46], on: entering };
    }
    case "wipe": {
      if (!entering) return { style: {}, on: false };
      const edge = e * 130 - 15;
      const mask = `linear-gradient(105deg, black ${edge - 12}%, transparent ${edge}%)`;
      return { style: { WebkitMaskImage: mask, maskImage: mask }, on: true };
    }
    case "blurDissolve":
      return entering
        ? { style: { opacity: interpolate(p, [0.25, 1], [0, 1], { extrapolateLeft: "clamp" }), transform: `scale(${0.975 + 0.025 * EASE.enter(p)})` }, blur: [(1 - p) * 22, (1 - p) * 22], on: true }
        : { style: { opacity: interpolate(p, [0.3, 1], [1, 0], { extrapolateLeft: "clamp" }), transform: `scale(${1 + 0.04 * e})` }, blur: [e * 22, e * 22], on: false };
    default:
      return { style: {}, on: false };
  }
}

const SceneShell: React.FC<{ scene: PlanScene; render: (scene: PlanScene) => React.ReactNode }> = ({ scene, render }) => {
  const frame = useCurrentFrame();
  let style: React.CSSProperties = {};
  let blur: [number, number] | undefined;
  let z = 1;
  let leak = 0;
  if (scene.in && scene.in.type !== "cut" && frame < scene.in.dur) {
    const r = transitionStyle(scene.in, frame / scene.in.dur, true);
    style = r.style;
    blur = r.blur;
    z = r.on ? 2 : 1;
    if (scene.in.type === "blurDissolve") leak = Math.sin(Math.PI * (frame / scene.in.dur));
  } else if (scene.out && scene.out.type !== "cut" && frame >= scene.duration - scene.out.dur) {
    const r = transitionStyle(scene.out, (frame - (scene.duration - scene.out.dur)) / scene.out.dur, false);
    style = r.style;
    blur = r.blur;
    z = r.on ? 2 : 1;
  }
  const id = `tr-${scene.id}`;
  const hasBlur = blur && (blur[0] > 0.05 || blur[1] > 0.05);
  return (
    <AbsoluteFill style={{ zIndex: z }}>
      {hasBlur && (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={`${blur![0]} ${blur![1]}`} />
          </filter>
        </svg>
      )}
      <AbsoluteFill style={{ ...style, filter: [style.filter, hasBlur ? `url(#${id})` : ""].filter(Boolean).join(" ") || undefined }}>{render(scene)}</AbsoluteFill>
      {leak > 0 && <LightLeak amount={leak} />}
    </AbsoluteFill>
  );
};

// Warm light leak for chapter changes only.
const LightLeak: React.FC<{ amount: number }> = ({ amount }) => (
  <AbsoluteFill
    style={{
      mixBlendMode: "screen",
      opacity: amount * 0.55,
      background: `radial-gradient(60% 80% at ${20 + amount * 50}% 30%, rgba(255,196,140,0.85), transparent 60%), radial-gradient(40% 60% at 85% 80%, rgba(255,120,90,0.5), transparent 70%)`,
    }}
  />
);

export const Film: React.FC<{ plan: Plan; captions?: boolean; render: (scene: PlanScene) => React.ReactNode }> = ({ plan, captions = false, render }) => (
  <AbsoluteFill style={{ background: plan.palette.deep }}>
    {plan.scenes.map((scene) => (
      <Sequence key={scene.id} from={scene.from} durationInFrames={scene.duration} premountFor={30}>
        <SceneShell scene={scene} render={render} />
      </Sequence>
    ))}
    {plan.tracker && (
      <AbsoluteFill style={{ zIndex: 5 }}>
        <JourneyTracker steps={plan.tracker.steps} from={plan.tracker.from} to={plan.tracker.to} palette={plan.palette} />
      </AbsoluteFill>
    )}
    {plan.status && plan.status.length > 0 && (
      <AbsoluteFill style={{ zIndex: 5 }}>
        <StatusLine cues={plan.status} palette={plan.palette} />
      </AbsoluteFill>
    )}
    <AbsoluteFill style={{ zIndex: 6 }}>
      <Finish />
    </AbsoluteFill>
    {captions && (
      <AbsoluteFill style={{ zIndex: 7 }}>
        <Captions cues={plan.captions} />
      </AbsoluteFill>
    )}
  </AbsoluteFill>
);

// Transparent captions layer for compositing the burned-in version.
export const CaptionsLayer: React.FC<{ plan: Plan }> = ({ plan }) => <Captions cues={plan.captions} />;

export { alpha };
