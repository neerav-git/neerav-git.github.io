# Refract: film plan

Runtime target 85–90 s · journey film · Refract palette

## Story: one research workspace, end to end

The selling point, in the user's words: one research workspace that carries a study end to end in a single session. Inside it the researcher can:
- ask questions of papers;
- log notes from assistant explanations;
- run a literature review and identify research gaps;
- run statistical analysis on the reviewed data, with leakage prevention;
- test several models at once.

The result the film lands on is that whole chain living in one place. It closes on the session chain, with no accuracy or RMSE headline.

A single researcher's session runs in order. The researcher reads a battery-ageing paper, questions a passage and saves the explanation as a note, compares papers and finds a gap. They then load the HNEI battery-cycling dataset, profile and audit it, catch leakage, and compare several models at once.

## Draft narration (≈175 words)

1. Research gets assembled across PDF readers, AI chats, notebooks and spreadsheets, and every transfer can separate a claim from its source.
2. Refract is one research workspace that carries a study end to end, in a single session.
3. In the Reader, any passage can be questioned, explained or quizzed, and each explanation is logged as a note that keeps its page and chunk.
4. Those notes feed the literature review: concept memory, cross-paper comparison, and a coverage map that shows where the research gaps are.
5. The same session then takes the reviewed data into Stats.
6. Stats moves through ordered checkpoints: profile, audit, then baseline models.
7. Spearman screening flags leakage and redundancy before any model trains.
8. Cycle index is flagged as leakage and excluded through a saved decision.
9. Several models are then trained and compared at once, on a fixed split and seed.
10. Interpretive claims carry one of five provenance labels, and anything unlabelled stays unresolved.
11. From the first question to the tested model, the whole study lives in one workspace.
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

The film lands on the end-to-end workspace (F2 session chain). Model screens show several models compared side by side; no accuracy or RMSE figure is narrated or put up as a headline.

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
