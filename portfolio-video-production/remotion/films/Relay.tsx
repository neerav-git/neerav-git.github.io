import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { EndCard, IntroSting, ChapterCard, Poster } from "../components/Cards";
import { BrowserFrame } from "../components/BrowserFrame";
import { CaptureScene, Video, type CaptureSceneData } from "../components/CaptureScene";
import { Terminal } from "../components/Technical";
import { Backdrop } from "../components/Backdrop";
import { AnimatedDiagram, type DiagramCheck, type DiagramEdge, type DiagramNode, type DiagramPacket } from "../components/Diagram";
import { Film, type Plan, type PlanScene } from "../Film";
import { RelayProblem, type ProblemTimes } from "../designed/RelayProblem";
import { RELAY_ICON } from "./relay-icon";
import { FONT } from "../lib/theme";

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
        return <IntroSting palette={plan.palette} mark={<Mark size={132} />} wordmark={<Wordmark size={120} />} tagline={scene.tagline as string} />;
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
        // Schematic of Relay's own components and tool names (labelled "schematic" on screen).
        const props = scene.props as { title: string; nodes: DiagramNode[]; edges: DiagramEdge[]; packets: DiagramPacket[]; checks: DiagramCheck[] };
        return (
          <AbsoluteFill>
            <AnimatedDiagram palette={plan.palette} {...props} />
            <div style={{ position: "absolute", right: 96, bottom: 54, padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.72)", fontSize: 28, fontFamily: FONT }}>Schematic</div>
          </AbsoluteFill>
        );
      }
      case "problem":
        return <RelayProblem palette={plan.palette} times={(scene.props as { times: ProblemTimes }).times} />;
      case "endcard":
        return <EndCard palette={plan.palette} title="Relay" impact={scene.impact as string} link={scene.link as string} mark={<Mark size={104} />} />;
      default:
        return null;
    }
  };
  return <Film plan={plan} captions={captions} render={render} />;
};
