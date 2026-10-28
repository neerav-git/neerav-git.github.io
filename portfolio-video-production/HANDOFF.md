# Portfolio films: handoff (2026-10-28)

Six narrated films for the portfolio are being rebuilt on a Remotion engine. Homeward is the pilot. **Get the user's sign-off on Homeward before rendering any of the others.**

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
- **Never narrate Refract's RMSE.** Table 4-1 (25.61) conflicts with the Stats screenshots (29.14).
- **Never put transient percussion under narration** (see the audio fix below).

## Status

| Film | State |
|---|---|
| Homeward | Delivered: mp4, captioned mp4, vtt, poster, contact sheet. **Awaiting the user's sign-off.** They said it is "substantially better" than the first cut. Their one complaint, voice chipping, is fixed (below). |
| Relay | Plan updated (`projects/relay/plan.md`). Live voice session recorded. Frame-stepped capture of `01-voice` was running at handoff; the preview is not yet built. |
| TraceLens | Plan and designed boards D1–D4 done (`plans/boards/tracelens-*`). Hero case and cost numbers verified. |
| Alzheimer's | Plan rewritten: ensemble of specialist CNNs (78% → 85%), then the IEEE CV atrophy paper. Waiting on the user (open questions). |
| Birb, Refract | Plans written. Waiting on the user (open questions). |

## Homeward audio fix (done this session)

The user heard the Kokoro narration "chipping and cutting". The cause was the music bed's offbeat hi-hats: full-band ticks every 0.65 s under the speech. The narration itself was clean: the voice stem matches `narration.wav` sample for sample.

Fix:
- `audio/synth.mjs`: hats removed; the bed is low-passed at 4.2 kHz.
- `scripts/mix-audio.mjs`: SFX ducked 12 dB under the voice.

Homeward was remixed, and only its audio was swapped into the delivered mp4s. Loudness is −15.9 LUFS, and the audio offset is 0 samples. To diagnose audio, compare `ffmpeg … showspectrumpic` spectrograms of `narration.wav`, the stems and the master.

## Relay voice (in progress)

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

Next steps:
1. When the capture finishes, check the log ends without an error and that `01-voice.voice.json` exists.
2. Build the audio: `node capture/relay/voice-audio.mjs projects/relay/captures/journey/take-01 projects/relay/voice/live-01/session.json projects/relay/voice/maya-q1.wav`. This writes `01-voice.audio.wav` and `.json`, and errors if the chunk counts differ.
2–3. Or run `sh capture/relay/voice-preview.sh`, which does step 2 and then muxes `../output/portfolio-videos/previews/relay-voice-preview.mp4` at 1920 wide.
4. Check the orb animation and lip sync, then show the user.
5. Then capture the typed W2 turns 3–4 (`window.__guideReplay`), Workflow operations, the Agent evaluation page and the gate terminal.
6. Extend `mix-audio.mjs` so it carries a chapter's own audio. The voice beat leaves the narration silent.
7. The edit keeps about 12 s of the agent's answer, ending on "…the device you used for MFA enrollment and when you last tried to sign in."

## TraceLens facts (verified)

The hero case is **T1-8db5d356** (HealthBench held-out). It is one of 8 cases corrected in audit P1-20261026T110000Z: 277 cases → 31 misses → 18 flagged by Vega → 8 corrected.
- **Gemma:** first answer advised self-care ("Hydrate them"). Gold label: emergency. Gemma's revision: emergency.
- **Vega:** score 0.985 against a 0.876 threshold.
- **Cost:**
  - Gemma's first answers: median 818 output tokens and 66.9 s (n=87, BR-…-012).
  - Vega: no generated text; median 0.36 s per decision, max 2.37 s (n=25, BR-…-029).
- The HealthBench item carries a canary. Narration and VTT paraphrase it; the exact text appears only as pixels.

## Open questions for the user

- **Homeward:** sign-off on look, pacing and narration. This gates everything else.
- **Alzheimer's:** per-model accuracy, false-positive rates or confusion matrices for the ensemble members. The notebook saved none.
  - The narration says "ensemble of specialist CNNs" instead of "mixture of experts". The models are averaged, with no learned gate.
- **Refract:** (A) live recapture, which needs Docker and an S3 stand-in, or (B) the 25 thesis screenshots. Also, where are the HNEI dataset and papers?
- **Birb:** add a room-join shot? Should the music in the records clip play?

## Where things are

- Pipeline: `npm run film -- <slug>` runs plan-film → mix-audio → render-film → qa-film. `scripts/deliver.mjs` copies to output.
- Plans: `plans/README.md` (suite) and `projects/<slug>/plan.md`. Edits are in `edit/films/<slug>.mjs`.
- Captures: `capture/director.mjs` (frame-stepped Playwright) and the journeys in `capture/journeys/`.
- Designed boards: `remotion/designed/`. Render them with `node scripts/render-boards.mjs <prefix>`.
- QA: `qa/tools/qa_film.py`, with the report at `qa/<slug>.md`.
- Port 5173 may still be held by a leftover Homeward Vite process (pid 82622).
