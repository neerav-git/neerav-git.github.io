import React from "react";
import { EndCard, IntroSting, ChapterCard, DocumentReveal, Poster } from "../components/Cards";
import { BrowserFrame } from "../components/BrowserFrame";
import { CaptureScene, Video, type CaptureSceneData } from "../components/CaptureScene";
import { AnimatedDiagram, type DiagramCheck, type DiagramEdge, type DiagramNode, type DiagramPacket } from "../components/Diagram";
import { Terminal } from "../components/Technical";
import { Chip } from "../components/Overlays";
import { Film, type Plan, type PlanScene } from "../Film";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";

// Homeward's own mark: the lucide HeartPulse icon on its #2563eb tile, as in the app sidebar.
const HeartPulse: React.FC<{ size: number; stroke?: string }> = ({ size, stroke = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
  </svg>
);

const Mark: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.26, background: "#2563eb", display: "grid", placeItems: "center", boxShadow: "0 18px 50px rgba(37,99,235,0.55)" }}>
    <HeartPulse size={size * 0.56} />
  </div>
);

const Wordmark: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ fontFamily: '"Manrope Variable", Manrope, sans-serif', fontWeight: 800, fontSize: size, letterSpacing: -size * 0.035, color: "#fff", lineHeight: 1 }}>
    homeward<span style={{ color: "#5b8cff" }}>.</span>
  </div>
);

const Icon: React.FC = () => (
  <div style={{ width: 28, height: 28, borderRadius: 8, background: "#2563eb", display: "grid", placeItems: "center" }}>
    <HeartPulse size={17} />
  </div>
);

export const HomewardPoster: React.FC<{ plan: Plan }> = ({ plan }) => {
  const still = plan.poster!;
  const L = plan.layout;
  return (
    <Poster
      palette={plan.palette}
      mark={<Mark size={92} />}
      wordmark={<Wordmark size={92} />}
      tagline={plan.meta.tagline}
      window={
        <BrowserFrame layout={L} product="Homeward" icon={<Icon />}>
          <Video src={still.video} frame={still.frame} width={L.content.width} height={L.content.height} />
        </BrowserFrame>
      }
    />
  );
};

// Slow push-in so a terminal shot keeps moving after its output lands.
const TerminalScene: React.FC<{ duration: number; children: React.ReactNode }> = ({ duration, children }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, duration], [0, 1], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ transform: `scale(${1 + 0.045 * p})`, transformOrigin: "960px 600px" }}>{children}</AbsoluteFill>;
};

export const HomewardFilm: React.FC<{ plan: Plan; captions?: boolean }> = ({ plan, captions }) => {
  const icon = <Icon />;
  const render = (scene: PlanScene) => {
    switch (scene.kind) {
      case "capture":
        return <CaptureScene scene={scene as unknown as CaptureSceneData} layout={plan.layout} palette={plan.palette} product="Homeward" icon={icon} />;
      case "sting":
        return <IntroSting palette={plan.palette} mark={<Mark size={132} />} wordmark={<Wordmark size={128} />} tagline={scene.tagline as string} />;
      case "document":
        return <DocumentReveal palette={plan.palette} {...(scene.props as React.ComponentProps<typeof DocumentReveal>)} />;
      case "chapter":
        return <ChapterCard palette={plan.palette} {...(scene.props as { title: string; steps: string[]; current: number })} />;
      case "diagram": {
        const props = scene.props as { title: string; nodes: DiagramNode[]; edges: DiagramEdge[]; packets: DiagramPacket[]; checks: DiagramCheck[]; chips?: { text: string; at: number; x: number; y: number }[] };
        return (
          <AbsoluteFill>
            <AnimatedDiagram palette={plan.palette} {...props} />
            {(props.chips ?? []).map((c) => (
              <Chip key={c.text} text={c.text} from={c.at} to={scene.duration + 30} x={c.x} y={c.y} color={plan.palette.accent} />
            ))}
          </AbsoluteFill>
        );
      }
      case "terminal": {
        type Run = { title: string; prompt: string; command: string; typeFrom: number; lines: { text: string; at: number }[] };
        const props = scene.props as Run & { test: Run };
        return (
          <TerminalScene duration={scene.duration}>
            <Backdrop palette={plan.palette} />
            <Terminal
              palette={plan.palette}
              {...props}
              backdrop={false}
              rect={{ x: 100, y: 120, w: 1080, h: 840 }}
              emphasise={(l) => (/checks passed/.test(l) ? "strong" : l.startsWith(">") ? "dim" : undefined)}
            />
            <Terminal
              palette={plan.palette}
              {...props.test}
              backdrop={false}
              rect={{ x: 1230, y: 250, w: 590, h: 470 }}
              emphasise={(l) => (/^ℹ pass/.test(l) ? "ok" : undefined)}
            />
          </TerminalScene>
        );
      }
      case "endcard":
        return <EndCard palette={plan.palette} title="Homeward" impact={scene.impact as string} link={scene.link as string} mark={<Mark size={104} />} />;
      default:
        return null;
    }
  };
  return <Film plan={plan} captions={captions} render={render} />;
};
