import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "./Backdrop";
import { alpha, EASE, FONT, type Palette } from "../lib/theme";

export type DiagramNode = { id: string; label: string; sub?: string; x: number; y: number; w: number; h: number; at: number; lit?: [number, number][]; tone?: "accent" | "ok" | "warn" | "plain" };
export type DiagramEdge = { from: string; to: string; at: number; via?: [number, number][] };
export type DiagramPacket = { route: string[]; from: number; dur: number };
export type DiagramCheck = { node: string; text: string; at: number };

const ramp = (frame: number, a: number, b: number) => EASE.enter(interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

function centre(n: DiagramNode) {
  return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
}

// Point where the segment from a node's centre towards p leaves the node's box.
function exitPoint(n: DiagramNode, p: { x: number; y: number }) {
  const c = centre(n);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  const sx = dx === 0 ? Infinity : n.w / 2 / Math.abs(dx);
  const sy = dy === 0 ? Infinity : n.h / 2 / Math.abs(dy);
  const s = Math.min(sx, sy);
  return { x: c.x + dx * s, y: c.y + dy * s };
}

function edgePoints(e: DiagramEdge, nodes: Record<string, DiagramNode>) {
  const a = nodes[e.from];
  const b = nodes[e.to];
  const mids = (e.via ?? []).map(([x, y]) => ({ x, y }));
  const first = mids[0] ?? centre(b);
  const last = mids[mids.length - 1] ?? centre(a);
  return [exitPoint(a, first), ...mids, exitPoint(b, last)];
}

const length = (pts: { x: number; y: number }[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);

function pointAt(pts: { x: number; y: number }[], t: number) {
  const total = length(pts);
  let d = t * total;
  for (let i = 1; i < pts.length; i += 1) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (d <= seg) return { x: pts[i - 1].x + ((pts[i].x - pts[i - 1].x) * d) / seg, y: pts[i - 1].y + ((pts[i].y - pts[i - 1].y) * d) / seg };
    d -= seg;
  }
  return pts[pts.length - 1];
}

// Vector architecture diagram: components build in, edges draw, a request packet travels the
// route the narration describes, and each component lights up as it is named.
export const AnimatedDiagram: React.FC<{
  palette: Palette;
  title?: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  packets?: DiagramPacket[];
  checks?: DiagramCheck[];
  backdrop?: boolean;
}> = ({ palette, title, nodes, edges, packets = [], checks = [], backdrop = true }) => {
  const frame = useCurrentFrame();
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const toneOf = (n: DiagramNode) => (n.tone === "ok" ? palette.ok : n.tone === "warn" ? palette.warn : palette.accent);
  return (
    <AbsoluteFill>
      {backdrop && <Backdrop palette={palette} />}
      {title && (
        <div style={{ position: "absolute", left: 96, top: 66, fontFamily: FONT, fontSize: 30, fontWeight: 650, letterSpacing: 2.4, textTransform: "uppercase", color: alpha(palette.accent, 0.95), opacity: ramp(frame, 0, 20) }}>{title}</div>
      )}
      <svg style={{ position: "absolute", inset: 0, width: 1920, height: 1080 }}>
        {edges.map((e, i) => {
          const pts = edgePoints(e, byId);
          const len = length(pts);
          const p = ramp(frame, e.at, e.at + 24);
          return (
            <polyline
              key={i}
              points={pts.map((q) => `${q.x},${q.y}`).join(" ")}
              fill="none"
              stroke={alpha("#ffffff", 0.28)}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={len}
              strokeDashoffset={len * (1 - p)}
            />
          );
        })}
        {packets.map((pk, i) => {
          const t = interpolate(frame, [pk.from, pk.from + pk.dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          if (frame < pk.from || frame > pk.from + pk.dur + 10) return null;
          const legs = pk.route.slice(1).map((to, k) => {
            const e = edges.find((x) => (x.from === pk.route[k] && x.to === to) || (x.to === pk.route[k] && x.from === to));
            const pts = e ? edgePoints(e, byId) : [centre(byId[pk.route[k]]), centre(byId[to])];
            return e && e.from !== pk.route[k] ? [...pts].reverse() : pts;
          });
          const total = legs.reduce((s, l) => s + length(l), 0);
          let d = EASE.camera(t) * total;
          let pos = legs[0][0];
          for (const leg of legs) {
            const L = length(leg);
            if (d <= L) {
              pos = pointAt(leg, d / L);
              break;
            }
            d -= L;
            pos = leg[leg.length - 1];
          }
          const fade = interpolate(frame, [pk.from + pk.dur, pk.from + pk.dur + 10], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <g key={i} opacity={fade}>
              <circle cx={pos.x} cy={pos.y} r={22} fill={alpha(palette.accent, 0.25)} />
              <circle cx={pos.x} cy={pos.y} r={10} fill="#fff" />
            </g>
          );
        })}
      </svg>
      {nodes.map((n) => {
        const p = ramp(frame, n.at, n.at + 22);
        // A window of 20 frames or less has no hold: it fades up and straight back down.
        const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
        const lit = (n.lit ?? []).reduce((m, [a, b]) => Math.max(m, b - a > 20 ? interpolate(frame, [a, a + 10, b - 10, b], [0, 1, 1, 0], clamp) : b > a ? interpolate(frame, [a, (a + b) / 2, b], [0, 1, 0], clamp) : 0), 0);
        const color = toneOf(n);
        return (
          <div
            key={n.id}
            style={{
              position: "absolute",
              left: n.x,
              top: n.y,
              width: n.w,
              height: n.h,
              borderRadius: 18,
              padding: "0 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              fontFamily: FONT,
              background: lit > 0 ? `linear-gradient(180deg, ${alpha(color, 0.32 * lit + 0.08)}, ${alpha(color, 0.14 * lit + 0.04)})` : "rgba(255,255,255,0.06)",
              boxShadow: `0 0 0 ${1.5 + lit * 1.5}px ${lit > 0 ? alpha(color, 0.35 + 0.6 * lit) : "rgba(255,255,255,0.14)"}, 0 ${18 * lit}px ${50 * lit}px ${alpha(color, 0.35 * lit)}`,
              opacity: p,
              transform: `translateY(${(1 - p) * 24}px) scale(${0.94 + 0.06 * p + lit * 0.02})`,
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 700, color: "#fff", letterSpacing: -0.3, lineHeight: 1.15 }}>{n.label}</div>
            {n.sub && <div style={{ fontSize: 28, fontWeight: 450, color: "rgba(255,255,255,0.68)", marginTop: 4 }}>{n.sub}</div>}
          </div>
        );
      })}
      {checks.map((c, i) => {
        const n = byId[c.node];
        const p = ramp(frame, c.at, c.at + 16);
        const k = checks.filter((x) => x.node === c.node).indexOf(c);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: n.x + 24,
              top: n.y + n.h + 14 + k * 54,
              height: 46,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 18px 0 12px",
              borderRadius: 999,
              background: alpha(palette.ok, 0.18),
              boxShadow: `inset 0 0 0 1.5px ${alpha(palette.ok, 0.7)}`,
              color: "#fff",
              fontFamily: FONT,
              fontSize: 28,
              fontWeight: 600,
              opacity: p,
              transform: `translateX(${(1 - p) * -14}px)`,
            }}
          >
            <span style={{ color: palette.ok, fontWeight: 800 }}>✓</span>
            {c.text}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
