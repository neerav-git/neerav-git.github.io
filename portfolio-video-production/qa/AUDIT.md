# Audit of the rejected cuts (2026-10-27 renders)

Reviewed against the rebuild spec: contact sheets in `qa/*-contact.png`, frame pulls, and
measurements with `qa/tools/jitter.py` (subpixel phase correlation, consecutive frames,
512×384 region) and ffmpeg `ebur128`.

## Defects shared by all seven films

| # | Defect | Evidence |
| --- | --- | --- |
| S1 | **Wobble on every still and framed clip.** `zoompan` (d=1, push to 1.05) rounds the crop origin to whole pixels, so the picture steps −0.87 px, −0.87 px, then snaps +1.1 px back, every 8–9 frames. | Homeward 33–37 s: 30 direction reversals and 27 stalls in 96 frames, jerk 1.05 px/frame². TraceLens 3–7 s, Brain 20–24 s, Alzheimer 34–38 s, Refract 38–42 s all measure 24–30 reversals and jerk 0.97–1.05. A smooth move has 0 reversals. |
| S2 | **One layout for every shot.** A 610 px text panel on the left; the product shrunk into a 1250×703 box on the right. The product UI is shown at ~0.65× and its own text renders at 7–9 px, which can't be read on any screen. | Every frame of Homeward, Relay, Refract, TraceLens, Brain, Alzheimer. |
| S3 | **The only transition is a 0.5–0.6 s crossfade**, including between shots of different scale, which produces double exposures with two sets of text on screen. | Relay 15.0 s and 42.0 s; Refract 25.0 s; Brain 55.5 s; Alzheimer 60.0 s; Homeward 15.0 s (title text ghosted over the next title). |
| S4 | **No camera, cursor, callouts, or typography motion.** Titles cut in with the scene and sit static for 6–22 s. Nothing points at what the narration is describing. | Refract "Synthesis" 24.9–34.9 s; TraceLens "Held-out result" 36.7–59.1 s (22 s on two static plates). |
| S5 | **No journeys.** UI clips are 3.5–11 s fragments, each starting from a fresh page load; most "workflow" beats are screenshots. No film shows a user carrying one task from start to result. | All films. |
| S6 | **Soft source.** UI clips came from Playwright `recordVideo` (VP8, 1× scale), then re-encoded twice at 24 fps; final bitrates are 1.1–3.4 Mb/s. Fine text breaks up and rings. | `ffprobe`: Homeward 1.7 Mb/s, Alzheimer 1.1 Mb/s video. |
| S7 | **Delivery format below spec.** 24 fps, mono AAC 192 kb/s, no colour tags on 6 of 7 files (only Birb carries BT.709), no captions, no music or sound design, no intro sting or end card. The last 0.75 s fades to black under narration tail. | `ffprobe` on all `final.mp4`. Loudness already measures −16.1 LUFS / −1.4 dBTP (kept). |
| S8 | **Structure.** Every film opens on a static problem title rather than the product's strongest moment; no title sting; no end card with name and link. | All films, 0–2 s. |

## Homeward (68.0 s)

- 0–15.1 s: 15 s on the overview page. The capture scrolls and scrolls back, with nothing selected; the title "Recovery begins when the patient has the least capacity for coordination" sits unchanged throughout.
- 15.1–20.6 s: "View source" opens a modal, but the click isn't visible (real cursor hidden, no ripple) and the highlighted passage is too small to read.
- 20.6–31.8 s: search clip, then a crossfade to a **screenshot** of the approval dialog; the approval is never performed.
- 31.8–41.4 s: 9.6 s static screenshot of Agent activity.
- 41.4–51.6 s: guardrail panel with its header cut off at the top of the frame ("Latest 200 local events" half visible); "32 / 32 passed" is legible only as a 30 px number; `npm run eval` never runs.
- 51.6–68.0 s: three screenshots (help review, provenance, safe retry) at 5.5 s each; no interaction.
- Missing: the "What paperwork should I bring?" answer arriving, clinician review, retry behaviour actually happening.

## Relay (65.2 s)

- 0–9.3 s: overview with the hover target off-centre; no voice input anywhere in the film, though the product is voice-first.
- 9.3–21.0 s: screenshot then clip, crossfaded at different scales (double exposure at 15.0 s).
- 21.0–32.7 s: VPN action shown as two **screenshots**; prepared → confirmed is never performed.
- 32.7–51.3 s: 18.6 s on the evaluation dashboard; the second shot is a crop of the same clip, so the film repeats itself.
- 51.3–65.2 s: operations trace then a screenshot; the evidence trace is unreadable at the frame size.
- Floating chat launcher (bottom right) sits in every frame.

## Refract (89.4 s)

- 0–10.8 s: a hand-drawn "fragmentation" diagram with static boxes.
- 10.8–89.4 s: 25 thesis screenshots and code figures, each shown 2.5–5 s. Code figures (39.0, 42.5, 49.5, 65.0 s) are white-on-black PDF crops shown with no highlighting, unreadable at 9 px.
- 25.0 s: double exposure between Index and Compare.
- 77.2–89.4 s: 12 s on the static workflow-overview diagram to end the film.
- No live run of the app; upload, select, explain, and Stats steps are all stills.

## TraceLens (72.1 s)

- **No footage of the application.** Every frame is a designed results plate or figure from `public/uploads/tracelens`.
- 0–12.9 s: scatter plot of four safeguard policies with 12 px labels.
- 23.8–36.7 s: 13 s on one dashboard image.
- 36.7–59.1 s: 22 s on two bar-chart plates; the "18 of 31" headline is never animated.
- 59.1–72.1 s: the same dashboard image as 23.8 s, reused.

## Birb Hangout (64.6 s)

- Gameplay clips play full-bleed, which works better than the framed films, but:
- The **"Controls" chip** is visible top-left in 9 of 15 sampled frames (1.5–46.5 s), and the "Birb Lounge" debug title and toolbar chips at 42–46.5 s.
- The "Remote" and "Books" chips sit bottom right on the title text (1.5–33 s).
- Clips are reused from the thesis site at their source quality, upscaled; slow-motion stretching (up to 1.6×) makes flight look laggy at 37–60 s.
- No two-player view, though the film is about friends being together.
- 64.5 s: the film ends on a fade to near black with the last title still dimly visible.

## Brain Atrophy Analysis (76.3 s)

- Six static plates, 8–21 s each, with wobble (S1).
- 55.5 s: double exposure of the result plate and pipeline plate (two sets of numbers at once).
- 65–76 s: 11 s on a full page of the paper, unreadable at frame size.
- No method motion: masks, ratio, and cohort scatter never build or draw on.

## Alzheimer Four-Class Classification (78.6 s)

- 0–9.1 s: MRI grid crop with black bars and a soft upscale.
- 22–31 s: `notebook-output-2.png` upscaled to fill the frame, visibly soft, axis ticks blurred.
- 31.1–41.2 s: the architecture diagram is a static plate; the CNN never builds.
- 52.0–59.8 s: "78% → 85%" as static text.
- 59.8–78.6 s: 19 s on the progression plate with a double exposure at 60.0 s.
- No live notebook footage.

## What the rebuild changes

1. Real journey captures through CDP screencast at 1920×1080 CSS, DPR 2, with an `events.json` log per take (fixes S5, S6).
2. Remotion compositor: subpixel spring/Bézier camera, drawn cursor and click ripple, callouts, kinetic type, varied transitions (fixes S1–S4).
3. 60 fps H.264 High CRF 15, BT.709 tags, stereo AAC 320 kb/s with a music bed, UI sound design, sting, end card, VTT and burned-in captions (fixes S7, S8).
4. QA per film: 1 s contact sheet, transition strips, jitter check, legibility, sync, holds, loudness (`qa/<slug>.md`).
