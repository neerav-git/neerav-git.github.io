# Portfolio film suite: production plan

Six films on the Remotion engine piloted by Homeward. The two Alzheimer's case studies share one film. Each film has a `plan.md` with its story, draft narration, shot list, visual inventory, fact ledger and open questions.

| Film | Plan | Footage | Designed bridging visuals | Runtime |
|---|---|---|---|---|
| Homeward | (pilot, delivered) | live journey capture | — | 82 s |
| Relay | `projects/relay/plan.md` | live journey capture; the real W2 agent turns replayed through the portal (no Deepgram cost) | R1 "the hunt"; execution-contract overlay | 80–88 s |
| Birb Hangout | `projects/birb-hangout/plan.md` | the owner's full-resolution two-player captures (8 files, 60 fps) | B1 sync map | 70–80 s |
| TraceLens | `projects/tracelens/plan.md` | live capture of the research workspace; real dashboard figures | D1 symptom chat, D2 under-triage, D3 second judge, D4 disclosed reconsideration (**boards rendered**) | 85–90 s |
| Refract | `projects/refract-ai/plan.md` | option A, live journey recapture; option B, the 25 thesis screenshots in order | F1 fragmentation, F2 session chain | 85–90 s |
| Alzheimer's research | `projects/alzheimers-research/plan.md` | paper pages and figures, notebook outputs | A1 model pair, A2 probability average, A3 colour mask on the paper's scan, A4 dem scale | 75–85 s |

## Rules for designed visuals

- Each one explains a mechanism. Any number it shows is taken from the film's fact ledger.
- A designed interface carries a chip, "Illustrative interface · real model outputs" or "Interface design · real model outputs". A schematic chart with no data is marked "schematic".
- Texts inside designed interfaces are exact extracts. For TraceLens they come from `remotion/designed/tracelens-case.json`, which is generated from the run files and names its sources.
- No brand names on generic system or tool windows.

## Boards

- `node scripts/render-boards.mjs [prefix]` renders every board in `remotion/designed/Boards.tsx` to `plans/boards/<id>.png`, plus a contact sheet.
- These are the same components the films will animate, so a board is exactly the frame that will appear.

## Order of work

1. **TraceLens.** The designs are ready for review; then capture the workspace.
2. **Relay.** It needs only a replay-driven capture.
3. **Birb Hangout.** It is an edit of existing footage.
4. **Alzheimer's research.** Build boards A1–A4, then the edit.
5. **Refract.** This waits on the option A/B decision.

## Open questions (collected from the plans)

1. **TraceLens.** HealthBench text on screen (the item carries a contamination canary); "small" vs "cheap"; the wording of the proposed escalation line.
2. **Alzheimer's.** Did the ensemble work come before the IEEE paper? Confirm 78 → 85% as the figure to show.
3. **Refract.** Live recapture (option A) or the screenshot journey (option B); where the HNEI dataset and the papers are.
4. **Birb.** Record a 6 s "create a room and join by code" shot? Should the records clip's own music play?
5. **Relay.** Add a voice beat?
