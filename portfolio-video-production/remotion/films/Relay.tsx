import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { EndCard, IntroSting, ChapterCard, Poster } from "../components/Cards";
import { BrowserFrame } from "../components/BrowserFrame";
import { CaptureScene, Video, type CaptureSceneData } from "../components/CaptureScene";
import { Terminal } from "../components/Technical";
import { Backdrop } from "../components/Backdrop";
import { AnimatedDiagram, type DiagramCheck, type DiagramEdge, type DiagramNode, type DiagramPacket } from "../components/Diagram";
import { Film, type Plan, type PlanScene } from "../Film";
import { PORTALS, RelayProblem, Window, type ProblemTimes } from "../designed/RelayProblem";
import { RelayRecap, type RecapTile } from "../designed/RelayRecap";
import { RELAY_ICON } from "./relay-icon";
import { EASE, type Palette } from "../lib/theme";

// Relay's own logo, cut from the app's relay-logo.png: the two-figure mark and the wordmark.
const Mark: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.26, background: "#fff", display: "grid", placeItems: "center", boxShadow: "0 18px 50px rgba(60,207,186,0.35)" }}>
    <Img src={staticFile("relay/relay-icon.png")} style={{ width: size * 0.74, height: size * 0.74, objectFit: "contain" }} />
  </div>
);

const Wordmark: React.FC<{ size: number }> = ({ size }) => (
  <Img src={staticFile("relay/relay-wordmark-white.png")} style={{ height: size * 1.05, width: "auto", display: "block" }} />
);

const Icon: React.FC = () => (
  <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fff", display: "grid", placeItems: "center" }}>
    <img src={RELAY_ICON} style={{ width: 22, height: 22, objectFit: "contain" }} />
  </div>
);

export const RelayPoster: React.FC<{ plan: Plan }> = ({ plan }) => {
  const still = plan.poster!;
  const L = plan.layout;
  return (
    <Poster
      palette={plan.palette}
      mark={<Mark size={92} />}
      wordmark={<Wordmark size={84} />}
      tagline={plan.meta.tagline}
      window={
        <BrowserFrame layout={L} product="Relay" icon={<Icon />}>
          <Video src={still.video} frame={still.frame} width={L.content.width} height={L.content.height} />
        </BrowserFrame>
      }
    />
  );
};

// The sting opens on the four department portals from the schematic, as they were left, flying
// together into Relay's mark before it lands.
const SETTLED = Object.fromEntries(["hr", "it", "payroll", "learning", "forms", "owners", "hire", "system", "form", "person", "support", "incomplete", "wrong"].map((k) => [k, -1000])) as ProblemTimes;
const MARK_AT = { x: 800, y: 465 };
const RelaySting: React.FC<{ palette: Palette; tagline: string }> = ({ palette, tagline }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <IntroSting palette={palette} mark={<Mark size={132} />} wordmark={<Wordmark size={120} />} tagline={tagline} delay={14} />
      {PORTALS.map((p, i) => {
        const c = { x: p.x + p.w / 2, y: p.y + p.h / 2 };
        const go = EASE.camera(interpolate(frame, [6 + i * 2, 32 + i * 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
        const gone = interpolate(frame, [20 + i * 2, 34 + i * 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        if (gone >= 1) return null;
        return (
          <AbsoluteFill key={p.id} style={{ transform: `translate(${(MARK_AT.x - c.x) * go}px, ${(MARK_AT.y - c.y) * go}px) scale(${1 - 0.92 * go})`, transformOrigin: `${c.x}px ${c.y}px`, opacity: 1 - gone }}>
            <Window p={p} t={SETTLED} frame={frame} palette={palette} />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

// Slow push-in so the terminal keeps moving after its output lands.
const TerminalScene: React.FC<{ duration: number; children: React.ReactNode }> = ({ duration, children }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, duration], [0, 1], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ transform: `scale(${1 + 0.05 * p})`, transformOrigin: "960px 560px" }}>{children}</AbsoluteFill>;
};

export const RelayFilm: React.FC<{ plan: Plan; captions?: boolean }> = ({ plan, captions }) => {
  const icon = <Icon />;
  const render = (scene: PlanScene) => {
    switch (scene.kind) {
      case "capture":
        return <CaptureScene scene={scene as unknown as CaptureSceneData} layout={plan.layout} palette={plan.palette} product="Relay" icon={icon} />;
      case "sting":
        return <RelaySting palette={plan.palette} tagline={scene.tagline as string} />;
      case "chapter":
        return <ChapterCard palette={plan.palette} {...(scene.props as { title: string; steps: string[]; current: number })} />;
      case "terminal": {
        const props = scene.props as { title: string; prompt: string; command: string; typeFrom: number; lines: { text: string; at: number }[] };
        return (
          <TerminalScene duration={scene.duration}>
            <Backdrop palette={plan.palette} />
            <Terminal
              palette={plan.palette}
              {...props}
              backdrop={false}
              rect={{ x: 170, y: 90, w: 1580, h: 900 }}
              emphasise={(l) => (/^All enforced gates pass|Barge-in latency|Unsafe actions in red-team/.test(l) ? "strong" : /^Evaluation gate|^track/.test(l) ? "dim" : undefined)}
            />
          </TerminalScene>
        );
      }
      case "diagram": {
        // Schematic of Relay's own components and tool names (unlabelled at the user's request).
        const props = scene.props as { title: string; nodes: DiagramNode[]; edges: DiagramEdge[]; packets: DiagramPacket[]; checks: DiagramCheck[] };
        return (
          <AbsoluteFill>
            <AnimatedDiagram palette={plan.palette} {...props} />
          </AbsoluteFill>
        );
      }
      case "problem":
        return <RelayProblem palette={plan.palette} times={(scene.props as { times: ProblemTimes }).times} />;
      case "recap": {
        const props = scene.props as { tiles: RecapTile[]; questions: string[]; questionsAt: number; ticksAt: number };
        return <RelayRecap palette={plan.palette} duration={scene.duration} {...props} />;
      }
      case "endcard":
        return <EndCard palette={plan.palette} title="Relay" impact={scene.impact as string} link={scene.link as string} mark={<Mark size={104} />} />;
      default:
        return null;
    }
  };
  return <Film plan={plan} captions={captions} render={render} />;
};
