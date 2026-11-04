# QA — tracelens

Take 1 · 196.98 s · checked by `qa/tools/qa_film.py` on `renders/tracelens/tracelens.mp4`

| Check | Result | Detail |
|---|---|---|
| Runtime 140–200 s | PASS | 196.98 s |
| Jitter: planned camera | PASS | 0 direction reversals in the exact per-frame camera values the renderer draws, across all 2 moves |
| Jitter: rendered camera | PASS | 2 of 2 moves have enough clean capture pixels to measure (overlays, cursor, ripples and in-page changes excluded); on those, 0 reversals and the rendered motion tracks the plan to 0.37 px RMS. The other moves are covered by the planned-camera check |
| Jitter: holds | PASS | worst residual motion 0 px/frame over 0 holds |
| No hold over 3 s | FAIL | longest span without visual change 5.98 s (at 30.97 s) |
| Loudness −16 LUFS, ≤ −1.5 dBTP | PASS | -16 LUFS, -3.7 dBTP |
| Narration/action sync ±150 ms | PASS | worst 0 ms over 0 pairs |
| Transitions | — | 13: blurDissolve (strips in `qa/tracelens/transitions.png`) |
| Music under voice | — | -15 dB while speaking; source `audio/synth.mjs music()`, seed 23, 72 BPM |

## Sync pairs

| Action | Word | Offset |
|---|---|---|

## Camera moves

Measured = at least 70% of frame pairs fitted on clean capture pixels. Tracking = rendered screen-centre motion minus planned motion.

| Scene | From | To | Frames fitted | Measured | Reversals | Tracking RMS (px) | Peak pan (px/frame) |
|---|---|---|---|---|---|---|---|
| saved-case | 113.18 s | 114.38 s | 72/72 | yes | 0 | 0.131 | 0.53 |
| models | 115.07 s | 120.9 s | 342/350 | yes | 0 | 0.506 | 7.28 |

## Speed ramps

- `saved-case`: moving footage at 1–1× (idle frames held or skipped)
- `models`: moving footage at 1–1× (idle frames held or skipped)

## Legibility

All added text (titles, callouts, lower thirds, tracker, captions, terminal, diagram) is set at 28 px or larger inside 5% title-safe margins. Product UI text is shown at the capture's native size and enlarged by the 1.3–1.9× camera on every element the narration names.

Contact sheet: `qa/tracelens/contact.png` · transitions: `qa/tracelens/transitions.png` · raw report: `qa/tracelens/report.json`

Delivered with `--force` (2026-11-02). The hold check failed only on scenes from the approved 2:58.6 cut, which the user signed off with these holds (30.97, 44.52, 55.65, 88.27, 104.22, 148.22 and 158.75 s). The new training scene (121.0–139.8 s) has none. Drift could be added to those scenes, but only if the user asks.
