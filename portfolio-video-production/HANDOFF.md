# Portfolio films: handoff (2026-10-28)

Six narrated films for the portfolio are being rebuilt on a Remotion engine. Homeward is the pilot, and the user signed it off on 2026-10-28.

Films: relay, refract-ai, homeward, birb-hangout, tracelens, alzheimers-research (a combined film).
Outputs go to `../output/portfolio-videos/`. Renders, captures and media are gitignored and rebuildable.

## Rules from the user (non-negotiable)

- **No paid infrastructure.** Only the capped Claude API may cost money: no paid TTS, GPU, stock footage or music.
  - One exception: the user asked for a live Deepgram session for Relay. It is already recorded (about 57 s, ≈$0.16). Do not record another; replay the saved one.
- **All evidence is real.** That means real app footage (seeded demo data is fine), real paper, notebook and thesis figures, and real terminal output. Never invent numbers or UI.
  - Designed bridging visuals are labelled "Illustrative interface · real model outputs" or "schematic".
- **Narrator voice:** Kokoro `af_heart` with the existing tuning, synthesized per sentence. Never change the tuning.
- **Copy:** no "X, not Y" contrasts and no curation or meta talk. Use they/them, or avoid pronouns, for people whose pronouns are unknown (Alex, Maya).
- **State measured claims plainly.** Find the number in the user's runs instead of softening a claim.
- **Refract's selling point is the end-to-end research workspace.** Its parts: paper Q&A, notes logged from assistant explanations, literature review and gap finding, then stats on the reviewed data with leakage prevention and several models tested at once. Don't headline accuracy or RMSE.
- **Never put transient percussion under narration** (see the audio fix below).

## Status

| Film | State |
|---|---|
| Homeward | Delivered and **signed off** by the user. Voice chipping fixed (below). |
| Relay | Captured (take-02, five chapters), edited (`edit/films/relay.mjs`, 89.2 s) and mixed. Final render, QA and delivery: see "Relay (built)" below. |
| TraceLens | Plan and designed boards D1–D4 done (`plans/boards/tracelens-*`). Hero case and cost numbers verified. |
| Alzheimer's | Plan rewritten: ensemble of specialist CNNs (78% → 85%), then the IEEE CV atrophy paper. Waiting on the user (open questions). |
| Birb, Refract | Plans written; the user's decisions are below. |

## Homeward audio fix (done this session)

The user heard the Kokoro narration "chipping and cutting". The cause was the music bed's offbeat hi-hats: full-band ticks every 0.65 s under the speech. The narration itself was clean: the voice stem matches `narration.wav` sample for sample.

Fix:
- `audio/synth.mjs`: hats removed; the bed is low-passed at 4.2 kHz.
- `scripts/mix-audio.mjs`: SFX ducked 12 dB under the voice.

Homeward was remixed, and only its audio was swapped into the delivered mp4s. Loudness is −15.9 LUFS, and the audio offset is 0 samples. To diagnose audio, compare `ffmpeg … showspectrumpic` spectrograms of `narration.wav`, the stems and the master.

## Relay voice

Relay repo: `/Users/neeravch/Documents/ChatGPT/DeepGram Project`.
- Start the API with `npx tsx src/server/index.ts` (port 8787).
- Start Vite with `npx vite --port 5180 --strictPort`.
- The capture needs both running.

The recording:
- `projects/relay/voice/live-01/session.json` holds every socket message and the agent's PCM. It contains no credentials.
- Maya's question is a Kokoro `bf_emma` line, `projects/relay/voice/maya-q1.wav`: "My corporate account access says blocked. Why, and is anyone working on it?"
- The agent called `get_employee_portal_context`, then `reveal_portal_record`, and opened IT-2047 about 15 s into its answer.

Replay (`capture/relay/voice-replay.mjs`):
- A fake Deepgram socket replays the recording, gated on the app's own messages.
- Maya's PCM goes in through the microphone worklet.
- The audio clock follows page time.
- The app runs unchanged, so the user's orb animation and the navigation are real.

Capture command: `node scripts/capture-journey.mjs relay --take 1 --only 01-voice`. It writes to `projects/relay/captures/journey/take-01/`, with the log in `projects/relay/voice/capture-take-01.log`.
- At 4K it runs at about 2.6 fps, so a 60 s chapter takes about 25 min.
- Waits use `waitFor({ pageTimeout })`, which counts page time. The first attempt failed on the wall-clock `timeout`.

Take-01 result (done): greeting 2.5–8.2 s, Maya 9.9–14.9 s, tool calls 13.4–17.4 s (including the cancelled first call, as live), answer 16.6–47.5 s. IT-2047 opens around 17–22 s. Frames confirm the orb reacts and the caption card follows the answer. To rebuild the sound and preview: `sh capture/relay/voice-preview.sh`.

Take-01 was superseded by take-02 (below); every voice cue shifted by exactly +1.819 s.

## Relay (built)

Capture take-02 (`node scripts/capture-journey.mjs relay --take 2`, log `projects/relay/voice/capture-take-02.log`), five chapters at 4K:
- `01-voice` 2,973 frames: home pre-roll, orb tap, the replayed live session. Audio: `node capture/relay/voice-audio.mjs 2 projects/relay/voice/live-01/session.json projects/relay/voice/maya-q1.wav` (Maya 11.67–16.75 s; agent 4.34–10.06 s and 18.45–49.33 s).
- `02-reply` 873, `03-laptop` 838: W2 typed turns 3–4 through `window.__guideReplay`, with the real confirm clicks.
- `04-operations` 668: IT Operations and the IT-2047 chronology. `05-evaluation` 651: the Agent evaluation cards.
- Gate terminal: `node scripts/capture-terminal.mjs relay gate "<Relay repo>" npm run evaluate:gate` → `projects/relay/captures/terminal/gate.json` (exit 0, all enforced gates pass).

Director fixes made for Relay: the screenshot clip follows `window.scrollX/scrollY` (Relay scrolls the window), and `CAPTURE_SCALE` gives quick 1080p test takes.

Edit (`edit/films/relay.mjs`): cold open on the reply landing → sting → problem and lead-in → the live voice clip at 1× (narration silent; cut points derived from the audio cues) → typed reply → laptop request → "Under the hood" → the action contract on IT Operations → evaluation cards → gate terminal → end card. 89.2 s, 9 narration sentences, 7 click syncs (all ≤5 ms by plan), tracker Ask/Reply/Request. The journey share is about 53%, the same as Homeward's.

Pipeline changes made for Relay:
- `plan-film.mjs` merges an edit's own `captions` (speaker-labelled dialogue) and `audio`, and enforces ≤52 characters.
- `mix-audio.mjs` lays dialogue clips into the voice stem, level-matched to the narration's speech RMS, and engages a limiter only when a peak would pass −2 dBTP. Relay mixes to −15.9 LUFS, −3.5 dBTP.
- `render-film.mjs` takes `RENDER_CONCURRENCY` and `--chunk N`. This 8 GB machine swaps under user apps, and a single full render timed out at `remotion_setFrame`; render the master with `RENDER_CONCURRENCY=2 node scripts/render-film.mjs <slug> --chunk 600` (resumable parts in `renders/<slug>/parts/`).

## TraceLens facts (verified)

The hero case is **T1-8db5d356** (HealthBench held-out). It is one of 8 cases corrected in audit P1-20261026T110000Z: 277 cases → 31 misses → 18 flagged by Vega → 8 corrected.
- **Gemma:** first answer advised self-care ("Hydrate them"). Gold label: emergency. Gemma's revision: emergency.
- **Vega:** score 0.985 against a 0.876 threshold.
- **Cost:**
  - Gemma's first answers: median 818 output tokens and 66.9 s (n=87, BR-…-012).
  - Vega: no generated text; median 0.36 s per decision, max 2.37 s (n=25, BR-…-029).
- The HealthBench item carries a canary. Narration and VTT paraphrase it; the exact text appears only as pixels.

## Decisions from the user (2026-10-28, second session)

- **Homeward: signed off.** The rollout gate is lifted; every film renders to the Homeward standard.
- **Refract:** option B, the 25 thesis screenshots in order. The HNEI dataset and paper locations were not given.
- **Birb:** add the "create a room and join by code" shot, and let the records clip's own music play (ducked under narration).
- **Alzheimer's:** go without per-model numbers. The ensemble claim is 78% → 85% with fewer crucial misses.
  - The narration says "ensemble of specialist CNNs" instead of "mixture of experts". The models are averaged, with no learned gate.

## Where things are

- Pipeline: `npm run film -- <slug>` runs plan-film → mix-audio → render-film → qa-film. `scripts/deliver.mjs` copies to output.
- Plans: `plans/README.md` (suite) and `projects/<slug>/plan.md`. Edits are in `edit/films/<slug>.mjs`.
- Captures: `capture/director.mjs` (frame-stepped Playwright) and the journeys in `capture/journeys/`.
- Designed boards: `remotion/designed/`. Render them with `node scripts/render-boards.mjs <prefix>`.
- QA: `qa/tools/qa_film.py`, with the report at `qa/<slug>.md`.
- Port 5173 may still be held by a leftover Homeward Vite process (pid 82622).
