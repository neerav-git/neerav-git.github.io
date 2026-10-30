# Portfolio films: handoff (2026-10-30)

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
| Relay | **v3 second draft rendered and reviewed (2026-10-30).** Take 4, 3:11.7, full-res, mix −15.9 LUFS. Saved as `projects/relay/reference/relay-v3-draft2-2026-10-30.mp4` (+ contact sheet). The user: "a perfect base", but it needs to be **snappier**. Their notes and the plan are in **Relay draft-2 notes** below. Do that pass, render draft 3 at full res, show the user, then QA/deliver/commit on approval. |
| Homeward | v1 delivered, but the user rejected its opening (a cropped cold open with no need or industry). The **v3 script** is in `plans/film-scripts-v3.md`; the user said "fine". |
| TraceLens | v3 script: the user said "fine" and set the opener (Nature Medicine, then the portfolio question). Boards D1–D4 exist (`plans/boards/`). Fix the D3 "median per answer" overflow before use. |
| Alzheimer's | v3 script rewritten to the user's notes (dementia's importance, then the research question). Needs a final look. |
| Birb | v3 script rewritten to the user's notes (the hearth and *Mythos* opening, all eleven about-site activities, the AI annotation tool). Needs a final look. |
| Refract | v3 script written; **no comments from the user yet**. |

The scripts are at **revision 3** (`plans/film-scripts-v3.md`), after the user's detail-cut note was applied to all five. Ask once for sign-off on revision 3, then capture and edit in the order the user prefers.

Estimated runtimes: Homeward ~2:25, TraceLens ~2:35, Alzheimer's ~2:10, Birb ~2:45, Refract ~2:00, Relay ~2:30.


## Relay draft-2 notes (from the user, 2026-10-30) and the plan

The user's notes, in their words:
- "the exchanges between user and relay agent needs a bit of cuts to make it look faster, because the interaction seems slow for the video's pace"
- "the tool call keeps overlapping and crowding the screen (some tool call banners)"
- "in general we need a little more snappier video (so this video is a perfect base just needs to be adjusted to make it a bit more well paced and speech could also be a little faster and warmer)"
- "Relay guide's voice needs to be as loud as the narrator when the video switches to showing its greeting or functionality"
- Assess "where we can add a little more meaning in the visual frame (the content is there, but how do we make the right visual and focus on it better to convey the significance of the work)".

This is an explicit request to re-pace. The "don't re-time approved parts" rule still holds for anything the notes don't cover (the problem schematic, the diagrams, the scene order and the script).

### 1. Faster exchanges (`edit/films/relay.mjs`, scenes `voice` and `meeting`)

- `voice` runs 32 s at 1× (film 39.3–71.3 s). `meeting` runs 19.1 s (film 89.1–108.3), **including a 5.5 s silent tool wait** (94.3–99.8, −23.7 LUFS).
- **Cut dead air.** Cut the waits between Maya's question and the agent's first word down to about 1 s, and mark each with the existing "⏩ n s of agent work cut" chip, as the typed scenes do. Trim gaps over about 0.3 s between agent sentences. Cues are in `take-04/01-voice.voice.json` and `03-meeting.voice.json`.
- **Meeting.** End the agent audio after its first line ("A thirty-minute follow-up with Casey Nguyen is ready to schedule…"), unless the subject line is needed. Then go straight to the confirm.
- **Dialogue speed.** Optionally play the dialogue a little faster (pitch-preserved `atempo` at 1.08–1.12) with the video speed-mapped to match. Note it in the deliver notes' speed-ramp list.
- **Mechanics.** Split each dialogue clip into utterance segments (`plan.audio` entries) with matching video shots, so cuts keep lip-sync with the UI: the orb state, the text appearing, the record opening.
- **Target.** Roughly 15–20 s shorter overall (about 2:50–2:55).

### 2. Narrator "a little faster and warmer"

- **Speed.** `scripts/generate-narration.mjs` has `SPEED = 1`. Kokoro `af_heart` stays; nothing else in the voice tuning changes.
- **Warmth.** Do it in the mix, on the narration stem only: a gentle low shelf (about +1.5–2 dB around 150–250 Hz) and a slight 5–8 kHz softening or de-ess.
- **Ask first.** The narrator tuning is a standing rule, so make an A/B **before** re-synthesizing. Render two narration sentences at speed 1.0 / 1.06 / 1.1, each with and without the warm EQ, and let the user pick.
- **Then rebuild.** `node scripts/generate-narration.mjs --project relay`, then word timings and the pronunciation check. Every `say()`/`sync()` anchor re-derives from `words.json`. Check the tour, which plays at its fixed 1× pace with line 2 at tourStart+1.0.

### 3. Relay Guide as loud as the narrator (`scripts/mix-audio.mjs`)

Measured on draft 2 (integrated LUFS per window):

| Window | Level |
|---|---|
| Narrator (8–14 s) | −15.0 LUFS |
| Narrator (150–158 s) | −14.9 LUFS |
| Greeting | −15.7 LUFS |
| Maya's first line | −18.5 LUFS |
| Agent reply | −16.2 LUFS |
| Meeting: Maya | −16.2 LUFS |
| Meeting: agent | −17.0 LUFS |

- **Cause.** `mix-audio.mjs` gives each dialogue clip **one** gain, matching its speech RMS to the narrator's. Lines quieter than the clip average land 1–3.5 dB low, and the 16 kHz Deepgram audio sounds thinner than the narrator at equal level.
- **Fix:**
  - Gain-match **each utterance** (Maya / agent segments from the voice.json cues) to the narrator by loudness (K-weighted).
  - Add a little presence EQ (about +2 dB at 2–4 kHz) to the agent.
  - Hold the music at its "speaking" duck for the whole dialogue scene.
- **Check.** Every utterance should land within ±0.5 LU of the narrator.

### 4. Tool-call banners crowding the screen

- **Where it happens.** The `chip` overlays at the orb (`relay.mjs` ~231–232, ~377–378) stack with lower thirds, callouts and captions. In draft 2 at about 1:47, "Tool · propose_onboarding_action → meeting" sits on the caption line.
- **Rule.** One annotation at a time, plus captions. Never over the caption band.
- **Labels.** Show tool calls as one plain-language status line in a fixed slot above the captions and clear of the orb, e.g. "Reading Maya's records" with the tool name small and dim. Swap the text in place for the next call instead of stacking chips.
- **Drop.** Remove `get_employee_portal_context` in the meeting (the intelligence diagram explains it), and remove any chip shorter than about 1.2 s.

### 5. More meaning in the frame (assessment for the user)

These are ranked by impact. Propose them to the user with a still or two and do the ones they pick. All of them use existing real footage or labelled schematics.

1. **Push in on what matters.** Most capture scenes show the whole 2K browser shrunk into the frame, so the UI text is unreadable at 1080p (see the contact sheet). On each beat, ease the camera in (1.3–1.6×; 2K source stays sharp) to:
   - the record the agent opens;
   - the confirm card;
   - the calendar slot;
   - the evaluation number being read;

   then ease back out between beats. This is the single biggest gain.
2. **Close the problem→product loop.**
   - At the sting, the four portal windows from the schematic fly together into the Relay window ("four sign-ins → one workspace").
   - In the payoff, bring back the new hire's three questions ("Which system? Which form? Who do I ask?"). Tick each with the real moment that answered it: the opened form, the IT request routed to IT Support, the booked meeting.
3. **Show voice turning into action.**
   - Time callouts to the agent's *words* (e.g., the record pulses when "DOC-TAX-1007" or "withholding" is spoken), not only to the tool event.
   - Draw a short line from the orb to the thing that opened.
   - Give Maya and Relay distinct caption styles (name tag or colour) so it's obvious who is talking.
4. **Diagrams explain what we just watched.**
   - Plain labels large, code names small and dim.
   - When a tool node lights, show a small thumbnail of the real frame where it fired (e.g., "Open a record" next to the DOC-TAX-1007 frame).
5. **Security made concrete.** Next to "Bank numbers removed", cut in a tight real frame of the masked bank number from the deposit capture. Add the measured result as a source-backed stat: leaks 4/4 → 0/5 after redaction.
6. **Evaluation and gate.**
   - Zoom into each dashboard card as it's narrated.
   - In the gate terminal, keep only the narrated line bright and push in on it.
7. **Payoff as a recap of Maya's day one.** A 2×2 of the real end frames: form opened, IT request filed, meeting booked, deposit opened. It reads as "what got done in a few sentences".

### Order of work

1. Mix-level fix and banner cleanup. These are mechanical.
2. Exchange cuts.
3. Narrator A/B to the user.
4. Re-synthesize if they pick a change.
5. Visual-meaning items the user approves.
6. Plan (expect about 2:50).
7. Mix: check per-utterance LUFS.
8. Full-res chunked render.
9. Contact sheet.
10. Show the user and save the draft to `projects/relay/reference/`.

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

**History (superseded: take 4 is complete and is the one in use; the steps below are kept for the capture mechanics).** Take 3 (2K) was incomplete:
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

**Original build steps (done for take 4):**
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
