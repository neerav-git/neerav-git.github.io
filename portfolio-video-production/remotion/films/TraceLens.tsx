import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { EndCard, Poster } from "../components/Cards";
import { BrowserFrame } from "../components/BrowserFrame";
import { CaptureScene, Video, type CaptureSceneData } from "../components/CaptureScene";
import { Film, type Plan, type PlanScene } from "../Film";
import { DisclosedChat, TRACELENS, VerdictPair, clamp01 } from "../designed/TraceLens";
import { CaseChat, ExampleScene, GoalTicks, IntroScene, TrainingScene, LayerScene, LoopScene, PaperScene, PickScene, QuestionScene, RaceChat, ScaleScene, TraceLensMark, TransparencyPanel } from "../designed/TraceLensV4";
import type { Highlight } from "../designed/TraceLens";

const Wordmark: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ fontSize: size, fontWeight: 800, color: "#fff", letterSpacing: -1, lineHeight: 1 }}>TraceLens</div>
);

const Icon: React.FC = () => <TraceLensMark size={28} />;

export const TraceLensPoster: React.FC<{ plan: Plan }> = ({ plan }) => {
  const still = plan.poster!;
  const L = plan.layout;
  return (
    <Poster
      palette={plan.palette}
      mark={<TraceLensMark size={92} />}
      wordmark={<Wordmark size={84} />}
      tagline={plan.meta.tagline}
      window={
        <BrowserFrame layout={L} product="TraceLens" icon={<Icon />}>
          <Video src={still.video} frame={still.frame} width={L.content.width} height={L.content.height} />
        </BrowserFrame>
      }
    />
  );
};

// Progress of a cue window [a, b] in scene frames.
const useRamp = () => {
  const frame = useCurrentFrame();
  return (a: number, b: number) => clamp01((frame - a) / Math.max(1, b - a));
};

type CaseT = { card: [number, number]; fold: [number, number]; chatIn: [number, number]; typed: [number, number]; streamed: [number, number]; scroll: { at: number; to: number; dur: number }[]; marks: { phrase: string; at: number }[] };
const CaseScene: React.FC<{ t: CaseT }> = ({ t }) => {
  const frame = useCurrentFrame();
  const r = useRamp();
  let scroll = 0;
  for (const s of t.scroll) {
    const p = clamp01((frame - s.at) / s.dur);
    const e = p * p * (3 - 2 * p);
    scroll = scroll + (s.to - scroll) * e;
  }
  const highlights: Highlight[] = t.marks.map((m) => ({ phrase: m.phrase, p: r(m.at, m.at + 20) }));
  return <CaseChat card={[r(...t.card), r(...t.fold)]} chatIn={r(...t.chatIn)} typed={r(...t.typed)} streamed={r(...t.streamed)} scroll={scroll} highlights={highlights} />;
};

type DisclosedT = { stamp: number; banner: number; collapse: number; revision: [number, number]; receipt: number };
const DisclosedScene: React.FC<{ t: DisclosedT }> = ({ t }) => {
  const r = useRamp();
  return <DisclosedChat stamp={r(t.stamp, t.stamp + 16)} banner={r(t.banner, t.banner + 24)} collapse={r(t.collapse, t.collapse + 30)} revision={r(...t.revision)} receipt={r(t.receipt, t.receipt + 40)} />;
};

// Beat 11: the finished flagged chat, shrunk to the left, beside the generic warning and this answer's flag.
const TransparencyScene: React.FC<{ t: { shrink: number; generic: number; dim: number; flag: number; tick: number } }> = ({ t }) => {
  const r = useRamp();
  const s = r(t.shrink, t.shrink + 34);
  const e = s * s * (3 - 2 * s);
  return (
    <AbsoluteFill>
      <Backdrop palette={TRACELENS} />
      <AbsoluteFill style={{ transform: `scale(${1 - 0.24 * e}) translateX(${-120 * e}px)`, transformOrigin: "0px 540px" }}>
        <DisclosedChat stamp={1} banner={1} collapse={1} revision={1} receipt={1 - e} chip={false} backdrop={false} />
      </AbsoluteFill>
      <TransparencyPanel t={t} />
    </AbsoluteFill>
  );
};

const VerdictScene: React.FC<{ t: { p: number; gap: number } }> = ({ t }) => {
  const r = useRamp();
  return <VerdictPair p={r(t.p, t.p + 40)} gap={r(t.gap, t.gap + 30)} />;
};

export const TraceLensFilm: React.FC<{ plan: Plan; captions?: boolean }> = ({ plan, captions }) => {
  const icon = <Icon />;
  const render = (scene: PlanScene) => {
    const t = scene.t as never;
    switch (scene.kind) {
      case "capture":
        return <CaptureScene scene={scene as unknown as CaptureSceneData} layout={plan.layout} palette={plan.palette} product="TraceLens" icon={icon} />;
      case "paper":
        return <PaperScene t={t} />;
      case "scale":
        return <ScaleScene t={t} />;
      case "question":
        return <QuestionScene t={t} />;
      case "case":
        return <CaseScene t={t} />;
      case "verdict":
        return <VerdictScene t={t} />;
      case "intro":
        return <IntroScene t={t} />;
      case "race":
        return <RaceChat t={t} />;
      case "example":
        return <ExampleScene t={t} />;
      case "disclosed":
        return <DisclosedScene t={t} />;
      case "transparency":
        return <TransparencyScene t={t} />;
      case "training":
        return <TrainingScene t={t} />;
      case "pick":
        return <PickScene t={t} />;
      case "loop":
        return <LoopScene t={t} />;
      case "layer":
        return <LayerScene t={t} />;
      case "endcard":
        return <EndCard palette={plan.palette} title="TraceLens" impact={scene.impact as string} link={scene.link as string} mark={<TraceLensMark size={104} />} impactNode={<GoalTicks at={scene.goals as [number, number]} />} fadeOut={{ at: scene.duration - 42, dur: 42 }} />;
      default:
        return null;
    }
  };
  return <Film plan={plan} captions={captions} render={render} />;
};
