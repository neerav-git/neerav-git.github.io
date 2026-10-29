# Portfolio films: handoff (2026-10-29)

Six narrated portfolio films, built on a Remotion engine.
- Films: relay, refract-ai, homeward, birb-hangout, tracelens, alzheimers-research (one film covering both Alzheimer's studies).
- Outputs go to `../output/portfolio-videos/`. Renders, captures and media are gitignored and rebuildable.

## Rules from the user (non-negotiable)

- **No paid infrastructure.** Only the capped Claude API may cost money: no paid TTS, GPU, stock footage or music.
  - Deepgram exceptions for Relay: `live-01` (earlier), `live-02` (the voice hook) and `live-03` (the spoken meeting, approved by the user on 2026-10-29).
  - **Never record another Deepgram session without asking.** Replay the saved sessions.
- **All evidence is real.**
  - Real app footage (seeded demo data is fine), real paper, notebook and thesis figures, and real terminal output.
  - Never invent numbers or UI.
  - Designed bridging visuals are labelled "Illustrative interface · real model outputs" or "Schematic".
  - External facts appear on screen with a source chip.
- **Narrator voice:** Kokoro `af_heart` with the existing tuning, one synthesis per sentence. Never change the tuning.
- **Copy:**
  - No "X, not Y" contrasts, no curation or meta talk, no formulaic lines ("every X becomes Y"), and no jargon ("retry-safe key", "signed keys").
  - Use they/them, or no pronouns, for Maya and Alex.
- **State measured claims plainly.** Find the number in the user's runs instead of softening a claim.
- **Script standard** (memory `film-story-first`):
  - Spine: need → idea, over the whole product at full frame → breadth → depth (one journey) → trust and proof → payoff.
  - Name the industry and the workflow types, give the hero capability room, and give every line a reason.
  - Never cold-open on a cropped, mid-action detail.
  - **Cut detail that doesn't serve the pitch.** The user called a Birb line about the room server, per-browser flight and a shared seed "nonsense we do not need". Keep the hero mechanism, trust limits and proof; drop plumbing (sync models, retry/idempotency, secondary metrics).
  - Present scripts as beats (picture / narration / why). **Scripts need the user's sign-off before capture or render.**
- **Audio:** no transient percussion under narration. Master at −16 LUFS, ≤ −1.5 dBTP.
- **Git:**
  - Commit on `feature/portfolio-guide`.
  - Commit messages end with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
  - Leave uncommitted site files outside `portfolio-video-production/` alone. Other agents or the user commit site work on this branch.

## Status

| Film | State |
|---|---|
| Relay | **v3, second draft in progress (take 4).** The user reviewed the first draft (saved in `projects/relay/reference/`): "the script and scenes and diagrams are brilliant". Notes applied: Maya's voice was noise (kokoro float32 WAV read as int16, fixed in `voice-audio.mjs`); the need lines now play over a problem schematic (`remotion/designed/RelayProblem.tsx`, scene kind `problem`); the tour follows the sting at its original pace under line 2; the greeting is heard; the meeting is spoken (live-03). Half-res drafts looked blurry to the user: show full-res from now on. Next: plan take 4, full-res chunked master as the draft, show, then QA and deliver. v1 (`aece8d6`) is superseded. |
| Homeward | v1 delivered, but the user rejected its opening (a cropped cold open with no need or industry). The **v3 script** is in `plans/film-scripts-v3.md`; the user said "fine". |
| TraceLens | v3 script: the user said "fine" and set the opener (Nature Medicine, then the portfolio question). Boards D1–D4 exist (`plans/boards/`). Fix the D3 "median per answer" overflow before use. |
| Alzheimer's | v3 script rewritten to the user's notes (dementia's importance, then the research question). Needs a final look. |
| Birb | v3 script rewritten to the user's notes (the hearth and *Mythos* opening, all eleven about-site activities, the AI annotation tool). Needs a final look. |
| Refract | v3 script written; **no comments from the user yet**. |

The scripts are at **revision 3** (`plans/film-scripts-v3.md`), after the user's detail-cut note was applied to all five. Ask once for sign-off on revision 3, then capture and edit in the order the user prefers.

Estimated runtimes: Homeward ~2:25, TraceLens ~2:35, Alzheimer's ~2:10, Birb ~2:45, Refract ~2:00, Relay ~2:30.

## Relay v3

**Script (approved).** The voice agent is the hero. The film:
1. Opens on fragmented HR, IT, payroll and learning portals.
2. Introduces Relay: one workspace, with a voice agent built on Deepgram.
3. Plays Maya's live voice hook, "What's my next highest-priority task?".
4. Moves through IT request, meeting and paycheck.
5. Explains the intelligence layer and security containment as schematic diagrams.
6. Shows the IT Operations timeline, then the evaluation numbers, then the payoff.

The narration has 15 sentences in `production.json` (relay), synthesized at 119.6 s. `narration/words.json` is generated and pronunciation is checked. "Sets reminders for training" was dropped because it isn't shown.

**Voice hook:**
- **Session:** `projects/relay/voice/live-02/session.json`. Maya's line is `projects/relay/voice/maya-q2.wav` (Kokoro `bf_emma`, 3.17 s), made by `capture/relay/say-line.mjs`.
- **Greeting:** "Hi, I'm Relay Guide…".
- **Tools:** `get_employee_portal_context` fires at +1.76 s after Maya stops, and `reveal_portal_record` (which opens DOC-TAX-1007) at +4.98 s. Speech starts at +6.3 s.
- **Waiting:** the edit shows tool-call labels during the wait. There is no TTFA claim.

**Journey** (`capture/journeys/relay.mjs`), with the replay paced to the live text-run medians:
- `00-tour`: the sidebar sections.
- `01-voice`: the live-02 replay. It writes `01-voice.voice.json` and marks `document`.
- `02-laptop`: W2 turn 3 plus confirm.
- `03-meeting`: closes the typed panel (the orb is hidden while it is open), taps the orb and replays live-03 (the page's second Deepgram socket; `replayScript([live02, live03])`), confirms, closes the calendar, closes the panel and stops voice, then reopens the typed panel. Writes `03-meeting.voice.json`.
- The typed replay (`__guideReplay`) plays its turns strictly in order, so it holds only W2 turn 3 and W5 turns 0–1.
- `04-pay`: W5 turns 0–1, paycheck then direct deposit.
- `05-operations`.
- `06-evaluation`.

Test take 91 (1080p) passed every chapter and the frames were checked.

**Take 3 (2K, the real one): incomplete, rerun it in full.**
- The laptop was going to sleep, so the capture was stopped deliberately mid-`04-pay`, and the partial file was deleted.
- `take-03/` holds good chapters 00–03 but no `take.json`.
- **Don't resume with `--only`.** The chapters share one browser session:
  - `04-pay` continues the open chat panel and the conversation from 02–03.
  - `05-operations` needs the IT case created in `02-laptop`.
- **Rerun the whole take:** `node scripts/capture-journey.mjs relay --take 3`. It takes about 30 min at 2K and overwrites the chapters.
- Then check that all seven `.mp4` + `.events.json` files and `take.json` are present.
- The Relay servers must be running, started from `/Users/neeravch/Documents/ChatGPT/DeepGram Project`. Check them with `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8787/api/health` and `http://127.0.0.1:5180/`, and restart them if they don't respond:
  - API: `npx tsx src/server/index.ts` (8787).
  - Vite: `npx vite --port 5180 --strictPort`.

**Next steps for Relay:**
1. Build the voice audio for both voice chapters (args: take folder, session, Maya's 24 kHz line, chapter):
   - `node capture/relay/voice-audio.mjs projects/relay/captures/journey/take-04 projects/relay/voice/live-02/session.json projects/relay/voice/maya-q2.wav 01-voice`
   - `node capture/relay/voice-audio.mjs projects/relay/captures/journey/take-04 projects/relay/voice/live-03/session.json projects/relay/voice/maya-q3.wav 03-meeting`
2. Rewrite `edit/films/relay.mjs` to the v3 beats, with `meta.take = 3` and an updated tagline and impact. Mechanics: `shot()`, `say()`, `sync()`, `extraCaptions`, `audio.push`, and the terminal `gate` scene.
   - A full-frame tour under the need lines.
   - The idea, then the sting.
   - The voice hook, with tool-call labels during the wait.
   - Document callouts.
   - Laptop, meeting and pay as a montage, with request chips and visible time cuts. The text replay waits run up to 25 s and must be cut down on screen.
   - Two diagrams, intelligence layer and security, using the new `diagram` scene kind in `remotion/films/Relay.tsx` (AnimatedDiagram plus a "Schematic" chip).
   - The IT Operations timeline.
   - Evaluation callouts, then the gate terminal.
   - Payoff, then the end card.
3. Plan, mix, draft render, contact sheet, and show the user.
4. On approval: the final chunked render, QA, deliver, commit and update HANDOFF.

**Relay facts for the edit:**
- **Tools:**
  - `get_employee_portal_context`: the server binds the employee's scope.
  - `get_record_details`.
  - `highlight_portal_section`: a fixed enum of sections.
  - `reveal_portal_record`: exact IDs only. The app works out the route and highlight, and unknown IDs fail closed.
  - `propose_onboarding_action`: shows the action for review and needs separate confirmation.
  - `navigate_portal` and `focus_portal_object`.
- **Security:**
  - Identity is resolved on the server.
  - Protected fields are excluded from the model.
  - Bank-number redaction: leaks went from 4/4 to 0/5.
  - The API key stays on the server; the browser gets 30 s tokens.
- **Evaluation:** 103/110 conversations, 39/42 held-out, 31/34 spoken requests useful, 0 unsafe actions in 21 red-team runs, barge-in 51 ms p95, 186/187 correct record.

## The other five films: what the next session needs

- **Homeward:** new capture chapters for the workspace tour, the care-team queue and import review on the seeded demo. Lines 6–11 reuse the existing journey chapters.
  - The repo is at `/private/tmp/portfolio-video-sources/homeward` (public as pruhnav/homeward). `/private/tmp` may have been cleared; re-clone if so.
- **TraceLens:**
  - Live workspace capture: `python3 -m tracelens_training.server` (port 8765) from `/Users/neeravch/Documents/ChatGPT/AI Self Explainability`, covering Observability, the Training Lab and the Baseline Lab.
  - Figures are in `public/uploads/tracelens/`, including safeguards, detectors, support-loop and care-trajectory.
  - Hero case facts are below.
- **Alzheimer's:**
  - No capture.
  - Sources: notebook outputs `public/uploads/alzheimers/notebook-output-1..4.png`, and paper pages `projects/brain-atrophy-computer-vision/captures/repository/paper-page-1..4.png`.
  - Designed visuals A1–A4.
- **Birb:**
  - The primary source is **birb-hangout-about.onrender.com**.
  - Its clips were downloaded to `projects/birb-hangout/captures/about-site/` (960 px, 60 fps): records, bookshelf-selection, reading, watching, trivia, hug, nap, dream-entry, flight, islands, exploration, plus annotation-workflow and the flight-studio still.
  - Use them to choose the moments, then re-cut from the full-resolution `.mov` masters in `~/Desktop/birb hangout video captures for website/` where a master exists.
  - The records clip keeps its music, ducked.
  - One new capture: create a room, then join by code with a second browser. This needs Birb running locally; its repo location hasn't been found yet.
  - The *Mythos* card is text only, with no book cover.
- **Refract:**
  - No capture: option B, the thesis screenshots in `projects/refract-ai/captures/thesis/01–25`, plus designed F1 and F2.
  - The thesis descriptions are in `~/Desktop/Integrative Framework Thesis/demo with images/Refract_Demo_Annotated_Thesis_Descriptions.docx`.
  - The end card credits the San José State ISE master's project.

## TraceLens facts (verified)

The hero case is **T1-8db5d356** (HealthBench held-out). It is one of 8 cases corrected in audit P1-20261026T110000Z: 277 cases → 31 misses → 18 flagged by Vega → 8 corrected.
- **Gemma:** the first answer advised self-care ("Hydrate them"). Gold label: emergency. The revision: emergency ("call emergency services (911) immediately").
- **Vega:** scored 0.985 against a 0.876 threshold.
- **Cost:**
  - Gemma's first answers: median 818 output tokens and 66.9 s (n=87).
  - Vega: median 0.36 s per decision (n=25).
- The HealthBench item carries a canary. Narration and VTT paraphrase it; the exact text appears only as pixels.
- The opening question is verbatim from `content/projects/tracelens.json` (`headline`).

## Pipeline notes

- `npm run film -- <slug>` runs plan-film → mix-audio → render-film → qa-film. `scripts/deliver.mjs` copies to output.
- **Capture:** `capture/director.mjs` (frame-stepped Playwright). The default is 2560×1440 (SCALE 4/3); `CAPTURE_SCALE=1` gives 1080p tests and `2` gives 4K. Films deliver at 1920×1080, 60 fps.
- **Render** (8 GB Mac; the user keeps Firefox open, so check `pgrep -fl render-film` first): `RENDER_CONCURRENCY=1 RENDER_TIMEOUT_MS=300000 node scripts/render-film.mjs <slug> --chunk 300`.
  - The parts are resumable.
  - A part with no progress for 3 min is cancelled and retried.
  - To fix a QA failure: `--patch a-b --skip-captions`.
- QA: `qa/tools/qa_film.py`, with the report at `qa/<slug>.md`. It lists holds over 3 s.
- ffmpeg isn't on PATH; use `node_modules/ffmpeg-static/ffmpeg`.
- **Pitfall:** never `require("./scripts/generate-narration.mjs")`, because it regenerates every project. Use `node scripts/generate-narration.mjs --project <slug>`.
- **Homeward audio fix (earlier):** the music bed's hi-hats caused the "chipping". The fix is in `audio/synth.mjs` (hats removed, bed low-passed at 4.2 kHz) and `scripts/mix-audio.mjs` (SFX ducked 12 dB under voice).
