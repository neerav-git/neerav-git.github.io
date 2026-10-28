# QA — relay

Take 2 · 89.22 s · checked by `qa/tools/qa_film.py` on `renders/relay/relay.mp4`

| Check | Result | Detail |
|---|---|---|
| Runtime 40–90 s | PASS | 89.22 s |
| Jitter: planned camera | PASS | 0 direction reversals in the exact per-frame camera values the renderer draws, across all 30 moves |
| Jitter: rendered camera | PASS | 7 of 30 moves have enough clean capture pixels to measure (overlays, cursor, ripples and in-page changes excluded); on those, 0 reversals and the rendered motion tracks the plan to 0.246 px RMS. The other moves are covered by the planned-camera check |
| Jitter: holds | PASS | worst residual motion 0 px/frame over 0 holds |
| No hold over 3 s | PASS | longest span without visual change 2.48 s (at 86.72 s) |
| Loudness −16 LUFS, ≤ −1.5 dBTP | PASS | -15.9 LUFS, -3.1 dBTP |
| Narration/action sync ±150 ms | PASS | worst 5 ms over 7 pairs |
| Transitions | — | 10: blurDissolve, radial, whip, wipe (strips in `qa/relay/transitions.png`) |
| Music under voice | — | -15 dB while speaking; source `audio/synth.mjs music()`, seed 7, 92 BPM |

## Sync pairs

| Action | Word | Offset |
|---|---|---|
| Orb tap | “helps (end)” at 14.15 s | -3 ms |
| Typing starts | “types” at 41.20 s | -3 ms |
| Reply ready for confirmation | “waits” at 44.30 s | -3 ms |
| Confirm click | “click” at 46.05 s | +2 ms |
| Reply on the case | “case” at 47.69 s | -5 ms |
| Case drafted | “complete” at 52.50 s | -3 ms |
| Confirm click | “confirmed” at 54.18 s | 0 ms |

## Camera moves

Measured = at least 70% of frame pairs fitted on clean capture pixels. Tracking = rendered screen-centre motion minus planned motion.

| Scene | From | To | Frames fitted | Measured | Reversals | Tracking RMS (px) | Peak pan (px/frame) |
|---|---|---|---|---|---|---|---|
| cold | 0.08 s | 1.4 s | 40/79 | no | — | — | 2.43 |
| cold | 1.67 s | 2.52 s | 0/51 | no | — | — | 0 |
| home | 5.02 s | 5.62 s | 24/36 | no | — | — | 6.06 |
| home | 7.22 s | 8.42 s | 70/72 | yes | 0 | 0.119 | 3.67 |
| home | 11.08 s | 12.18 s | 48/66 | yes | 0 | 0.359 | 6.23 |
| home | 13.97 s | 14.38 s | 16/25 | no | — | — | 3.56 |
| voice | 14.78 s | 20.55 s | 12/346 | no | — | — | 0.02 |
| voice | 20.93 s | 21.78 s | 10/51 | no | — | — | 13.39 |
| voice | 23.72 s | 24.62 s | 0/54 | no | — | — | 0 |
| voice | 24.78 s | 28.03 s | 0/195 | no | — | — | 0 |
| voice | 28.2 s | 29.1 s | 0/54 | no | — | — | 0 |
| voice | 29.52 s | 34.35 s | 1/290 | no | — | — | 0.03 |
| reply | 36.28 s | 36.88 s | 19/36 | no | — | — | 3.99 |
| reply | 37.38 s | 37.98 s | 5/36 | no | — | — | 2.04 |
| reply | 38.52 s | 39.12 s | 0/36 | no | — | — | 0 |
| reply | 39.18 s | 40.03 s | 11/51 | no | — | — | 4.53 |
| reply | 44.37 s | 45.07 s | 0/42 | no | — | — | 0 |
| reply | 46.37 s | 47.22 s | 20/51 | no | — | — | 8 |
| laptop | 52.27 s | 53.07 s | 0/48 | no | — | — | 0 |
| laptop | 54.5 s | 55.3 s | 18/48 | no | — | — | 2.28 |
| contract | 60.75 s | 61.55 s | 42/48 | yes | 0 | 0.117 | 6.22 |
| contract | 65.05 s | 65.65 s | 5/36 | no | — | — | 1.32 |
| contract | 65.78 s | 66.53 s | 8/45 | no | — | — | 2.34 |
| evaluation | 68.75 s | 69.75 s | 52/60 | yes | 0 | 0.109 | 4.58 |
| evaluation | 70.5 s | 71.2 s | 15/42 | no | — | — | 6.24 |
| evaluation | 71.57 s | 74.35 s | 152/167 | yes | 0 | 0.051 | 0.17 |
| evaluation | 74.7 s | 75.4 s | 20/42 | no | — | — | 16.8 |
| evaluation | 75.48 s | 77.35 s | 93/112 | yes | 0 | 0.089 | 2.07 |
| evaluation | 77.43 s | 78.13 s | 32/42 | yes | 0 | 0.495 | 9.14 |
| evaluation | 80.37 s | 81.12 s | 27/45 | no | — | — | 28.39 |

## Speed ramps

- `cold`: moving footage at 1–1× (idle frames held or skipped)
- `home`: moving footage at 1–1× (idle frames held or skipped)
- `voice`: moving footage at 1–1× (idle frames held or skipped)
- `reply`: moving footage at 1–1× (idle frames held or skipped)
- `laptop`: moving footage at 1–1× (idle frames held or skipped)
- `contract`: moving footage at 1–1× (idle frames held or skipped)
- `evaluation`: moving footage at 1–1× (idle frames held or skipped)

## Legibility

All added text (titles, callouts, lower thirds, tracker, captions, terminal, diagram) is set at 28 px or larger inside 5% title-safe margins. Product UI text is shown at the capture's native size and enlarged by the 1.3–1.9× camera on every element the narration names.

Contact sheet: `qa/relay/contact.png` · transitions: `qa/relay/transitions.png` · raw report: `qa/relay/report.json`
