// Design boards: stills of the bridging visuals at their key states, for review before the
// films are cut. Each board is a one-frame composition rendered by scripts/render-boards.mjs.
import React from "react";
import { DisclosedChat, SecondJudge, SymptomChat, VerdictPair } from "./TraceLens";

const answerMarks = (p: number) => [
  { phrase: "Heat Exhaustion:", p },
  { phrase: "This is the most likely explanation.", p },
  { phrase: "Prompt Care (Within 1-2 hours):", p },
  { phrase: "If your friend loses consciousness", p, tone: "#ef4444" },
  { phrase: "Hydrate them:", p },
];

export const boards: { id: string; component: React.FC }[] = [
  { id: "tracelens-d1a-ask", component: () => <SymptomChat typed={1} streamed={0} scroll={0} /> },
  { id: "tracelens-d1b-answer-top", component: () => <SymptomChat typed={1} streamed={0.42} scroll={0} highlights={answerMarks(1)} /> },
  { id: "tracelens-d1c-answer-care", component: () => <SymptomChat typed={1} streamed={1} scroll={1820} highlights={answerMarks(1)} /> },
  { id: "tracelens-d2-undertriage", component: () => <VerdictPair p={1} gap={1} /> },
  { id: "tracelens-d3a-fork", component: () => <SecondJudge fork={1} gauge={0.6} verdicts={0} clash={0} /> },
  { id: "tracelens-d3b-disagree", component: () => <SecondJudge fork={1} gauge={1} verdicts={1} clash={1} /> },
  { id: "tracelens-d4a-banner", component: () => <DisclosedChat banner={1} collapse={0} revision={0} escalation={0} receipt={0} /> },
  { id: "tracelens-d4b-reconsidered", component: () => <DisclosedChat banner={1} collapse={1} revision={1} escalation={1} receipt={1} /> },
];
