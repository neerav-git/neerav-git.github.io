import "./lib/fonts";
import React from "react";
import { Composition } from "remotion";
import { CaptionsLayer, type Plan } from "./Film";
import { HomewardFilm, HomewardPoster } from "./films/Homeward";
import homeward from "../projects/homeward/edit/plan.json";
import { boards } from "./designed/Boards";

const films: { id: string; plan: Plan; component: React.FC<{ plan: Plan; captions?: boolean }>; poster: React.FC<{ plan: Plan }> }[] = [
  { id: "homeward", plan: homeward as unknown as Plan, component: HomewardFilm, poster: HomewardPoster },
];

export const Root: React.FC = () => (
  <>
    {films.map(({ id, plan, component, poster }) => (
      <React.Fragment key={id}>
        <Composition id={id} component={component} durationInFrames={plan.durationInFrames} fps={plan.fps} width={1920} height={1080} defaultProps={{ plan, captions: false }} />
        <Composition id={`${id}-captions`} component={CaptionsLayer} durationInFrames={plan.durationInFrames} fps={plan.fps} width={1920} height={1080} defaultProps={{ plan }} />
        <Composition id={`${id}-poster`} component={poster} durationInFrames={1} fps={plan.fps} width={1920} height={1080} defaultProps={{ plan }} />
      </React.Fragment>
    ))}
    {boards.map(({ id, component }) => (
      <Composition key={id} id={`board-${id}`} component={component} durationInFrames={1} fps={60} width={1920} height={1080} />
    ))}
  </>
);
