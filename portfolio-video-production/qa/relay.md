# QA — relay

Take 4 · 167.68 s · checked by `qa/tools/qa_film.py` on `renders/relay/relay.mp4`

| Check | Result | Detail |
|---|---|---|
| Runtime 120–200 s | PASS | 167.68 s |
| Jitter: planned camera | PASS | 0 direction reversals in the exact per-frame camera values the renderer draws, across all 31 moves |
| Jitter: rendered camera | PASS | 6 of 31 moves have enough clean capture pixels to measure (overlays, cursor, ripples and in-page changes excluded); on those, 0 reversals and the rendered motion tracks the plan to 0.401 px RMS. The other moves are covered by the planned-camera check |
| Jitter: holds | PASS | worst residual motion 0 px/frame over 0 holds |
| No hold over 3 s | FAIL | longest span without visual change 3.55 s (at 116.85 s) |
| Loudness −16 LUFS, ≤ −1.5 dBTP | PASS | -15.9 LUFS, -3.4 dBTP |
| Narration/action sync ±150 ms | PASS | worst 8 ms over 4 pairs |
| Transitions | — | 18: blurDissolve, radial, whip, wipe (strips in `qa/relay/transitions.png`) |
| Music under voice | — | -15 dB while speaking; source `audio/synth.mjs music()`, seed 7, 92 BPM |

## Sync pairs

| Action | Word | Offset |
|---|---|---|
| Orb tap | “day one (end)” at 34.62 s | 0 ms |
| Request drafted | “drafts” at 67.03 s | +3 ms |
| Confirm click | “confirms” at 71.03 s | +3 ms |
| Meeting confirm | “books” at 84.28 s | +8 ms |

## Camera moves

Measured = at least 70% of frame pairs fitted on clean capture pixels. Tracking = rendered screen-centre motion minus planned motion.

| Scene | From | To | Frames fitted | Measured | Reversals | Tracking RMS (px) | Peak pan (px/frame) |
|---|---|---|---|---|---|---|---|
| tour | 21.28 s | 31.43 s | 270/609 | no | — | — | 9.52 |
| idea | 32.77 s | 34.63 s | 77/112 | no | — | — | 9.05 |
| idea | 34.75 s | 35.32 s | 28/34 | yes | 0 | 0.118 | 1.67 |
| voice | 36.07 s | 43.88 s | 114/469 | no | — | — | 0.1 |
| voice-answer | 46.32 s | 47.32 s | 0/60 | no | — | — | 0 |
| voice-answer | 47.63 s | 51.98 s | 1/261 | no | — | — | 0.12 |
| voice-answer | 52.3 s | 53.2 s | 0/54 | no | — | — | 0 |
| voice-answer | 53.42 s | 55.27 s | 0/111 | no | — | — | 0 |
| form | 56.68 s | 57.57 s | 42/53 | yes | 0 | 0.96 | 11.09 |
| form | 57.62 s | 59.27 s | 64/99 | no | — | — | 0.82 |
| form | 59.3 s | 60.08 s | 18/47 | no | — | — | 18 |
| form | 60.22 s | 62.22 s | 106/120 | yes | 0 | 0.091 | 0.38 |
| laptop-ask | 62.87 s | 66.58 s | 17/223 | no | — | — | 0.06 |
| laptop-confirm | 67.02 s | 70.88 s | 87/232 | no | — | — | 0.44 |
| laptop-confirm | 71.35 s | 72.15 s | 4/48 | no | — | — | 15.64 |
| laptop-confirm | 72.22 s | 72.67 s | 6/27 | no | — | — | 0.7 |
| meeting | 73.15 s | 77 s | 3/231 | no | — | — | 0.11 |
| meeting-draft | 78.22 s | 79.12 s | 0/54 | no | — | — | 0 |
| meeting-draft | 79.5 s | 83.43 s | 3/236 | no | — | — | 0.05 |
| meeting-confirm | 84.55 s | 85.35 s | 10/48 | no | — | — | 4.99 |
| paycheck | 86.07 s | 88.47 s | 48/144 | no | — | — | 0.62 |
| deposit | 88.75 s | 90.28 s | 0/92 | no | — | — | 0 |
| deposit | 90.35 s | 91.15 s | 0/48 | no | — | — | 0 |
| operations | 130.5 s | 131.3 s | 32/48 | no | — | — | 12.46 |
| operations | 132.57 s | 133.13 s | 10/34 | no | — | — | 5.89 |
| operations | 133.15 s | 133.95 s | 32/48 | no | — | — | 5.84 |
| evaluation | 135.97 s | 136.85 s | 50/53 | yes | 0 | 0.122 | 5.85 |
| evaluation | 136.95 s | 137.65 s | 20/42 | no | — | — | 9.39 |
| evaluation | 138.15 s | 140.75 s | 149/156 | yes | 0 | 0.043 | 0.1 |
| evaluation | 141.23 s | 141.93 s | 24/42 | no | — | — | 19.04 |
| evaluation | 142.45 s | 145.75 s | 187/198 | yes | 0 | 0.044 | 0.16 |

## Speed ramps

- `tour`: moving footage at 1–1× (idle frames held or skipped)
- `idea`: moving footage at 1–1× (idle frames held or skipped)
- `voice`: moving footage at 1–1× (idle frames held or skipped)
- `voice-answer`: moving footage at 1–1× (idle frames held or skipped)
- `form`: moving footage at 1–1× (idle frames held or skipped)
- `laptop-ask`: moving footage at 1–1× (idle frames held or skipped)
- `laptop-confirm`: moving footage at 1–1× (idle frames held or skipped)
- `meeting`: moving footage at 1–1× (idle frames held or skipped)
- `meeting-draft`: moving footage at 1–1× (idle frames held or skipped)
- `meeting-confirm`: moving footage at 1–1× (idle frames held or skipped)
- `paycheck`: moving footage at 1–1× (idle frames held or skipped)
- `deposit`: moving footage at 1–1× (idle frames held or skipped)
- `operations`: moving footage at 1–1× (idle frames held or skipped)
- `evaluation`: moving footage at 1–1× (idle frames held or skipped)

## Legibility

All added text (titles, callouts, lower thirds, tracker, captions, terminal, diagram) is set at 28 px or larger inside 5% title-safe margins. Product UI text is shown at the capture's native size and enlarged by the 1.3–1.9× camera on every element the narration names.

Contact sheet: `qa/relay/contact.png` · transitions: `qa/relay/transitions.png` · raw report: `qa/relay/report.json`

## Delivered on approval (2026-10-31)

The only failing check is "No hold over 3 s": the intelligence-layer diagram (3.35 s at 93.27 s) and the security diagram (3.55 s at 116.85 s) rest while the narration finishes. Both diagrams were approved as they are; the user watched this cut and approved it for the website, so it was delivered with `--force` rather than restyling them.
