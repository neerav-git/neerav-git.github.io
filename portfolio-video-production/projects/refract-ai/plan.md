# Refract: film plan

Runtime target 85–90 s · journey film · Refract palette

## Story: one research session, paper to metric

A single researcher's session runs in order. The researcher reads a battery-ageing paper, questions a passage, saves the grounded answer, compares papers and finds a gap. They then load the HNEI battery-cycling dataset, profile and audit it, catch leakage, and compare baseline models. Every step stays linked in the same session. The film shows how each feature removes a hand-off between tools.

## Draft narration (≈180 words)

1. Research arguments get assembled across PDF readers, AI chats, notebooks and spreadsheets, and every transfer can separate a claim from its source.
2. Refract keeps the whole argument in one research session.
3. In the Reader, a selected passage can be explained, summarised, quizzed or saved, and every grounded answer keeps its page and chunk.
4. Saved evidence feeds Index and Compare: concept memory, cross-paper comparison, and a coverage map that shows the gaps before writing begins.
5. The same session then takes the battery dataset into Stats.
6. Stats moves through ordered checkpoints: profile, audit, then baseline regression.
7. Each column gets an analytical role, and Spearman screening flags leakage and redundancy before any model trains.
8. Cycle index is flagged as leakage and excluded through a saved decision.
9. Models are then compared on a fixed split and seed, reaching an RMSE of 25.61.
10. Interpretive claims carry one of five provenance labels, and anything unlabelled stays unresolved.
11. Paper, passage, question, dataset, feature decision, model and metric stay connected in one session.
12. It runs on React and FastAPI, with Postgres for sessions, ChromaDB for retrieval and Claude for grounded synthesis.

## Shot list

| Time (s) | Beat | Picture | Source |
|---|---|---|---|
| 0–3 | Sting | Refract mark | designed |
| 3–11 | Problem | **F1 Fragmentation**: four generic tool windows (PDF, chat, notebook, sheet); a claim card is dragged between them and its source tag drops off at each hand-off | designed (schematic) |
| 11–15 | One session | The four windows fold into the Refract session sidebar | designed → real (`03-session-reader`) |
| 15–26 | Reader | Passage selected → HUD actions → grounded answer with page and chunk; CalloutRing on the citation | journey capture or `01-reader-hud`, `02-passage-chat` |
| 26–35 | Synthesis | Index → Compare → the coverage map with its gaps highlighted | journey capture or `index-workspace`, `compare-workspace`, `07-coverage-map` |
| 35–40 | Into Stats | JourneyTracker turns from "Literature" to "Analysis"; the dataset is loaded | `09-stats-notebook` |
| 40–48 | Checkpoints | Profile → Audit → Baseline step rail; profile visuals | `10-profile-visuals`, `11-feature-frame` |
| 48–58 | Audit | Column roles; Spearman heatmap with the cycle-index cells ringed; chip "Leakage" | `15-correlation-heatmap`, `17-target-metrics` |
| 58–63 | Decision | The saved exclusion record pushes in | `19-saved-exclusion` |
| 63–72 | Models | Baseline regression → linear / random-forest benchmarks → predicted vs actual → model comparison | `20`–`25` |
| 72–78 | Provenance | The provenance taxonomy diagram with its five classes lit in turn | thesis figure `provenance-taxonomy` |
| 78–84 | Chain | **F2 Session chain**: seven linked nodes (paper → passage → question → dataset → feature decision → model → metric), each with a thumbnail of the real screen it came from | designed, real thumbnails |
| 84–90 | Stack + end | AnimatedDiagram: React → FastAPI → Postgres / ChromaDB / Claude (from `system-architecture.png`), then the end card | real architecture |

The headline metric is RMSE 25.61 (thesis Table 4-1). It is narrated in line 9 and shown as a counter over the model comparison.

## Capture options

- **A (recommended): live journey recapture.**
  - Run the cloned stack with Docker Postgres and Chroma and local sentence-transformer embeddings. Claude is used for the grounded answers, which stays inside the capped API.
  - S3 is the one paid dependency. For capture only, point `s3_service` at a local MinIO container, or at a disk-backed shim, in the `/tmp` clone. The product code that is shown stays unchanged.
  - Seed the same papers and the HNEI dataset used in the thesis.
  - This gives real motion: typing, panels opening, charts rendering.
  - Cost: about a day's spike, and the 8 GB machine will be tight with Docker plus capture.
- **B: screenshot journey.**
  - Use the 25 numbered thesis screenshots in thesis order, with camera moves, callouts and match-cut transitions between consecutive screens.
  - This is real but static, and needs no setup.

The shot list works with either option. B is the fallback if A's spike fails.

## Visual inventory

- **Sourced:**
  - `projects/refract-ai/captures/thesis/01–25` (real session, 2026-04-29);
  - repository workspace screenshots;
  - thesis code figures;
  - the provenance taxonomy;
  - the system architecture.
- **Designed:**
  - F1 fragmentation (schematic, generic windows, no brand names);
  - F2 session chain built from real thumbnails.

## Open questions

1. Option A or B? A needs the HNEI dataset file and the thesis papers. Are they somewhere on this Mac, or should I take them from the thesis folder?
