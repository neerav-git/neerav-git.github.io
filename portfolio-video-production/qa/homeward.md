# QA — homeward

Take 5 · 82.07 s · checked by `qa/tools/qa_film.py` on `renders/homeward/homeward.mp4`

| Check | Result | Detail |
|---|---|---|
| Runtime 40–90 s | PASS | 82.07 s |
| Jitter: planned camera | PASS | 0 direction reversals in the exact per-frame camera values the renderer draws, across all 23 moves |
| Jitter: rendered camera | PASS | 6 of 23 moves have enough clean capture pixels to measure (overlays, cursor, ripples and in-page changes excluded); on those, 0 reversals and the rendered motion tracks the plan to 0.107 px RMS. The other moves are covered by the planned-camera check |
| Jitter: holds | PASS | worst residual motion 0.022 px/frame over 1 holds |
| No hold over 3 s | PASS | longest span without visual change 2.48 s (at 79.57 s) |
| Loudness −16 LUFS, ≤ −1.5 dBTP | PASS | -15.9 LUFS, -3.4 dBTP |
| Narration/action sync ±150 ms | PASS | worst 97 ms over 10 pairs |
| Transitions | — | 11: blurDissolve, radial, whip, wipe, zoomThrough (strips in `qa/homeward/transitions.png`) |
| Music under voice | — | -15 dB while speaking; source `audio/synth.mjs music()`, seed 7, 92 BPM |

## Sync pairs

| Action | Word | Offset |
|---|---|---|
| View source click | “opens” at 18.42 s | 0 ms |
| Send question | “bring” at 24.78 s | +40 ms |
| Cited answer appears | “answers” at 26.08 s | -10 ms |
| Need help click | “asks” at 32.45 s | +48 ms |
| Response saved | “stays” at 37.21 s | -40 ms |
| Approval dialog opens | “waits” at 42.08 s | +2 ms |
| Timeout shown | “lost” at 45.98 s | +7 ms |
| Retry safely click | “Retry” at 46.90 s | +53 ms |
| Receipt returned | “original” at 48.32 s | 0 ms |
| Agent activity click | “activity” at 53.75 s | -97 ms |

## Camera moves

Measured = at least 70% of frame pairs fitted on clean capture pixels. Tracking = rendered screen-centre motion minus planned motion.

| Scene | From | To | Frames fitted | Measured | Reversals | Tracking RMS (px) | Peak pan (px/frame) |
|---|---|---|---|---|---|---|---|
| cold | 0.07 s | 1.02 s | 55/57 | yes | 0 | 0.093 | 3.89 |
| cold | 1.07 s | 1.67 s | 13/36 | no | — | — | 14.49 |
| overview | 13.27 s | 14.37 s | 65/66 | yes | 0 | 0.122 | 1.23 |
| overview | 15.57 s | 16.57 s | 60/60 | yes | 0 | 0.124 | 5.8 |
| source | 17.73 s | 18.43 s | 25/42 | no | — | — | 6.65 |
| source | 18.47 s | 19.07 s | 7/36 | no | — | — | 5.92 |
| source | 21.65 s | 22.33 s | 14/41 | no | — | — | 1.94 |
| ask | 22.5 s | 23.25 s | 15/45 | no | — | — | 18 |
| ask | 25.13 s | 25.93 s | 21/48 | no | — | — | 18 |
| help | 29.68 s | 30.48 s | 17/48 | no | — | — | 9.5 |
| help | 33.57 s | 34.17 s | 13/36 | no | — | — | 11.24 |
| help | 34.57 s | 35.12 s | 11/33 | no | — | — | 0.64 |
| help | 35.17 s | 35.77 s | 12/36 | no | — | — | 0.66 |
| help | 36.88 s | 37.48 s | 7/36 | no | — | — | 10.73 |
| help | 40.13 s | 40.37 s | 0/14 | no | — | — | 0 |
| reminder | 41.1 s | 41.7 s | 16/36 | no | — | — | 4.5 |
| reminder | 42.12 s | 42.72 s | 1/36 | no | — | — | 0 |
| reminder | 45.9 s | 46.45 s | 7/33 | no | — | — | 6.01 |
| reminder | 48.38 s | 48.93 s | 15/33 | no | — | — | 0.61 |
| activity | 53.82 s | 54.62 s | 46/48 | yes | 0 | 0.12 | 6.43 |
| activity | 54.87 s | 57.08 s | 133/133 | yes | 0 | 0.06 | 0.2 |
| team | 58.43 s | 59.98 s | 0/93 | no | — | — | 0 |
| outro | 74.2 s | 78.62 s | 232/265 | yes | 0 | 0.11 | 0.42 |

## Speed ramps

- `cold`: moving footage at 1–1× (idle frames held or skipped)
- `overview`: moving footage at 1–1× (idle frames held or skipped)
- `source`: moving footage at 1–1× (idle frames held or skipped)
- `ask`: moving footage at 0.75–1× (idle frames held or skipped)
- `help`: moving footage at 1–1.15× (idle frames held or skipped)
- `reminder`: moving footage at 1–1.04× (idle frames held or skipped)
- `activity`: moving footage at 1–1× (idle frames held or skipped)
- `team`: moving footage at 1–1× (idle frames held or skipped)
- `outro`: moving footage at 1–1× (idle frames held or skipped)

## Legibility

All added text (titles, callouts, lower thirds, tracker, captions, terminal, diagram) is set at 28 px or larger inside 5% title-safe margins. Product UI text is shown at the capture's native size and enlarged by the 1.3–1.9× camera on every element the narration names.

Contact sheet: `qa/homeward/contact.png` · transitions: `qa/homeward/transitions.png` · raw report: `qa/homeward/report.json`
