import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Backdrop } from "./Backdrop";
import { BrowserFrame } from "./BrowserFrame";
import { ClickRipple, Cursor } from "./Cursor";
import { CalloutDim, CalloutRing, Chip, Link, LowerThird } from "./Overlays";
import { type Box, camOf, cameraTransform, clamp, type Layout, screenBox, screenOf } from "../lib/geometry";
import { alpha, EASE, type Palette } from "../lib/theme";

export type Overlay =
  | { type: "callout"; from: number; to: number; box: Box; label?: string; side?: "top" | "bottom" | "left" | "right"; tone?: "accent" | "warn" | "ok"; dim?: boolean; pad?: number }
  | { type: "chip"; from: number; to: number; box: Box; text: string; side?: "right" | "left" | "below" | "above"; tone?: "accent" | "warn" | "ok"; icon?: string }
  | { type: "lowerThird"; from: number; to: number; title: string; detail?: string }
  | { type: "link"; from: number; to: number; fromBox: Box; box: Box };

export type CaptureSceneData = {
  id: string;
  kind: "capture";
  video: string;
  duration: number;
  frames: { src: number[]; cam: number[][]; cursor: number[][] };
  clicks: { frame: number; x: number; y: number }[];
  hovers: { from: number; to: number; box: Box }[];
  overlays: Overlay[];
  reveals: { frame: number; before: number; x: number; y: number; dur: number }[];
  tiltIn?: number;
};

// One captured frame. Frames are pre-extracted stills, so every output frame shows exactly
// the planned source frame with no decoder in the loop.
export const Video: React.FC<{ src: string; frame: number; width: number; height: number }> = ({ src, frame, width, height }) => (
  // A frame that stalls while the machine is under memory pressure is retried instead of failing the render.
  <Img src={staticFile(`${src}/${String(frame).padStart(6, "0")}.jpg`)} delayRenderTimeoutInMilliseconds={30000} delayRenderRetries={2} style={{ position: "absolute", left: 0, top: 0, width, height }} />
);

export const CaptureScene: React.FC<{ scene: CaptureSceneData; layout: Layout; palette: Palette; product: string; icon?: React.ReactNode }> = ({ scene, layout, palette, product, icon }) => {
  const frame = useCurrentFrame();
  const i = clamp(Math.round(frame), 0, scene.duration - 1);
  const cam = camOf(scene.frames.cam[i]);
  const cursor = scene.frames.cursor[i];
  const L = layout;
  const tone = (t?: string) => (t === "warn" ? palette.warn : t === "ok" ? palette.ok : palette.accent);

  // Backdrop parallax against the camera.
  const parallax = { x: -(cam.fx - L.rest.x) * 0.05 * cam.z, y: -(cam.fy - L.rest.y) * 0.05 * cam.z, s: 1 + (cam.z - 1) * 0.06 };

  // Intro: a gentle 3D tilt that settles flat.
  const tilt = scene.tiltIn ? EASE.enter(interpolate(frame, [0, scene.tiltIn], [0, 1], { extrapolateRight: "clamp" })) : 1;
  const tiltTransform = `translateY(${(1 - tilt) * 70}px) rotateX(${(1 - tilt) * 9}deg) scale(${0.93 + 0.07 * tilt})`;

  // Press is averaged over neighbouring frames so the cursor squashes smoothly.
  let press = 0;
  for (let k = -2; k <= 2; k += 1) press += scene.frames.cursor[clamp(i + k, 0, scene.duration - 1)][2];
  press /= 5;
  const cursorPos = screenOf({ x: cursor[0], y: cursor[1] }, cam, L);
  const blur = cam.bx > 0.05 || cam.by > 0.05;
  const filterId = `mb-${scene.id}`;

  return (
    <AbsoluteFill>
      <Backdrop palette={palette} parallax={parallax} />
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation={`${cam.bx} ${cam.by}`} />
        </filter>
      </svg>
      <AbsoluteFill style={{ transform: cameraTransform(cam, L), transformOrigin: "0 0", filter: blur ? `url(#${filterId})` : undefined }}>
        <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: "960px 560px" }}>
          <AbsoluteFill style={{ transform: tiltTransform, transformOrigin: "960px 1027px" }}>
            <BrowserFrame layout={L} product={product} icon={icon}>
              <Video src={scene.video} frame={scene.frames.src[i]} width={L.content.width} height={L.content.height} />
              {scene.reveals.map((r) => {
                const age = frame - r.frame;
                if (age < 0 || age >= r.dur) return null;
                const p = EASE.enter(age / r.dur);
                const cx = r.x * L.scale;
                const cy = r.y * L.scale;
                const reach = Math.hypot(Math.max(cx, L.content.width - cx), Math.max(cy, L.content.height - cy));
                const radius = p * reach;
                const mask = `radial-gradient(circle at ${cx}px ${cy}px, transparent ${radius}px, black ${radius + 26}px)`;
                return (
                  <React.Fragment key={r.frame}>
                    <div style={{ position: "absolute", inset: 0, WebkitMaskImage: mask, maskImage: mask }}>
                      <Video src={scene.video} frame={r.before} width={L.content.width} height={L.content.height} />
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        left: cx - radius - 13,
                        top: cy - radius - 13,
                        width: (radius + 13) * 2,
                        height: (radius + 13) * 2,
                        borderRadius: "50%",
                        boxShadow: `0 0 0 2px ${alpha(palette.accent, 0.55 * (1 - p))}, 0 0 40px ${alpha(palette.accent, 0.35 * (1 - p))}`,
                      }}
                    />
                  </React.Fragment>
                );
              })}
              {scene.hovers.map((h) => {
                const o = interpolate(frame, [h.from, h.from + 8, h.to - 8, h.to], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                if (o <= 0 || !h.box) return null;
                const pad = 5;
                return (
                  <div
                    key={h.from}
                    style={{
                      position: "absolute",
                      left: h.box.x * L.scale - pad,
                      top: h.box.y * L.scale - pad,
                      width: h.box.width * L.scale + pad * 2,
                      height: h.box.height * L.scale + pad * 2,
                      borderRadius: 9,
                      opacity: o,
                      boxShadow: `0 0 0 2px ${alpha(palette.accent, 0.35)}, 0 0 18px ${alpha(palette.accent, 0.35)}`,
                      background: alpha(palette.accent, 0.05),
                    }}
                  />
                );
              })}
              {scene.overlays.map((o, k) =>
                o.type === "callout" && o.dim !== false ? <CalloutDim key={k} box={o.box} from={o.from} to={o.to} scale={L.scale} pad={(o.pad ?? 10) / cam.z} /> : null,
              )}
            </BrowserFrame>
          </AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>
      {scene.overlays.map((o, k) => {
        if (o.type === "callout") return <CalloutRing key={k} box={screenBox(o.box, cam, L)} from={o.from} to={o.to} palette={palette} label={o.label} side={o.side} tone={o.tone} pad={o.pad} />;
        if (o.type === "chip") {
          const b = screenBox(o.box, cam, L);
          const side = o.side ?? "right";
          const pos =
            side === "right" ? { x: b.x + b.width + 18, y: b.y + b.height / 2 - 30, anchor: "left" as const } :
            side === "left" ? { x: b.x - 18, y: b.y + b.height / 2 - 30, anchor: "right" as const } :
            side === "below" ? { x: b.x + b.width / 2, y: b.y + b.height + 16, anchor: "center" as const } :
            { x: b.x + b.width / 2, y: b.y - 76, anchor: "center" as const };
          return <Chip key={k} text={o.text} from={o.from} to={o.to} x={pos.x} y={pos.y} color={tone(o.tone)} icon={o.icon} anchor={pos.anchor} />;
        }
        if (o.type === "link") {
          // From the centre of one box to the nearest point on the other's edge.
          const s = screenBox(o.fromBox, cam, L);
          const t = screenBox(o.box, cam, L);
          const a = { x: s.x + s.width / 2, y: s.y + s.height / 2 };
          const b = { x: clamp(a.x, t.x, t.x + t.width), y: clamp(a.y, t.y, t.y + t.height) };
          return <Link key={k} a={a} b={b} from={o.from} to={o.to} color={palette.accent} />;
        }
        return null;
      })}
      {scene.clicks.map((c) => {
        const p = screenOf({ x: c.x, y: c.y }, cam, L);
        return <ClickRipple key={c.frame} x={p.x} y={p.y} age={frame - c.frame} color={palette.accent} scale={Math.sqrt(cam.z)} />;
      })}
      {cursor[3] ? <Cursor x={cursorPos.x} y={cursorPos.y} scale={Math.sqrt(cam.z)} pressed={press} /> : null}
      {scene.overlays.map((o, k) => (o.type === "lowerThird" ? <LowerThird key={k} title={o.title} detail={o.detail} from={o.from} to={o.to} palette={palette} /> : null))}
    </AbsoluteFill>
  );
};
