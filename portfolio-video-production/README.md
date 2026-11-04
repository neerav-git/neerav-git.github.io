# Portfolio video production

This workspace produces one narrated 1920×1080, 60 fps film of 40–90 seconds for every project on the portfolio:

- Relay
- Refract
- Homeward
- Birb Hangout
- TraceLens
- Brain Atrophy Analysis in Dementia
- Four-Class Alzheimer MRI Classification

Each film follows one user's journey through the real product, then shows how it works and what it achieved. All footage is the real app on seeded demo data; every figure, terminal line, and number comes from the project's own repository, paper, notebook, or thesis.

## Editorial standard

Every film runs: cold open (3–5 s) → title sting (≤2 s) → problem (≤8 s) → the journey (55–65% of the runtime) → under the hood → result → end card (3–4 s). Narration is present tense and follows the journey. It uses direct descriptions, with no "this is X, not Y" contrasts and no talk about the film itself. Clicks land on the narrator's matching verb within ±150 ms.

## Pipeline

```sh
cd portfolio-video-production
npm install

# 1. Narration (Kokoro af_heart, approved tuning, one synthesis per sentence)
npm run narrate -- --project homeward
npm run narrate:check -- homeward        # local Whisper pronunciation check
npm run narrate:words -- homeward        # word timings → narration/words.json

# 2. Capture (product running locally; state is reset before every take)
HOMEWARD_URL=http://127.0.0.1:5173 npm run capture:journey -- homeward --take 4
npm run capture:terminal -- homeward eval <homeward-repo> npm run eval   # <slug> <name> <cwd> <command…>

# 3. Edit, score, render, check
npm run plan -- homeward                 # → projects/homeward/edit/plan.json + shots.md
npm run mix -- homeward                  # → edit/audio/master.wav (−16 LUFS, −1.5 dBTP)
npm run draft -- homeward                # fast half-resolution preview
npm run render -- homeward               # ProRes master → final MP4s, VTT, poster
npm run qa -- homeward                   # → qa/homeward/report.json, contact sheet, transition strips

npm run film -- homeward                 # all of step 3 in one go
npm run deliver -- homeward              # copy to output/portfolio-videos/, write qa/homeward.md
npm run studio                           # Remotion Studio for scrubbing the edit
```

### Capture (`capture/director.mjs`, `capture/journeys/<slug>.mjs`)

Headless Chromium at a 1920×1080 CSS viewport and DPR 2. Time is stepped deterministically: Playwright's clock and every CSS/Web animation advance exactly 1/60 s per frame, and each frame is a true 3840×2160 screenshot, so motion in the footage is perfectly even regardless of machine speed. The director moves a human-paced cursor (minimum-jerk Bézier paths with slight overshoot, 250–700 ms travel, 150–300 ms hover dwell), types at 35–90 ms per key, scrolls with momentum, waits on real results rather than fixed sleeps, and refuses to click anything outside the viewport. Scrollbars and any text naming `localhost` are hidden. Every interaction is logged with its frame and target box to `<chapter>.events.json`; the cursor itself is drawn in the edit from that log.

### Edit (`edit/planner.mjs`, `edit/films/<slug>.mjs`)

Each film's edit is code: shots are pinned to event labels from the capture log and to narration words, so a new take re-cuts itself. The planner computes per-frame source time (monotone speed ramps, 0.75–2×), an eased auto-zoom camera (1.4–1.8× before clicks, `cubic-bezier(0.65,0,0.35,1)`) with motion blur from its velocity, callouts, lower thirds, captions (≤52 characters), and SFX cues.

### Render (`remotion/`)

Remotion composites the plan: browser frame, cursor and click ripples, callouts, lower thirds, journey tracker, chapter cards, document reveals, animated diagrams, terminal replays, intro sting, end card, and transitions (zoom-through, radial reveal, whip pan, wipe, blur dissolve with light leak), finished with a vignette and 2.5% grain. Titles animate per word from an 8 px blur, in Inter, inside 5% title-safe margins, at 28 px or larger.

Delivery: H.264 High, CRF 15, yuv420p, BT.709, 60 fps, AAC 48 kHz 320 kbps, `+faststart`.

### Sound (`audio/synth.mjs`, `scripts/mix-audio.mjs`)

All music and effects are synthesized locally from oscillators and seeded noise; nothing is downloaded. The bed (pad, bass, plucked arpeggio, soft kick and hats) follows the film's sections, and its seed, tempo, and key are recorded in `edit/audio/mix.json`. It ducks 15 dB under the voice while the narrator speaks. Clicks, key ticks, whooshes, swells, and chimes come from the plan's cues. The master is loudness-normalized in two passes to −16 LUFS integrated, −1.5 dBTP.

## QA

`qa/tools/qa_film.py` checks every delivered film and writes `qa/<slug>/report.json`: a contact sheet at 1 s, a five-frame strip of each transition, camera-move wobble (direction reversals and stalls by subpixel phase correlation) and residual motion in holds, the longest span without a visual change (≤3 s), loudness and true peak, runtime, and the offset of every action from its narration word. Results are logged in `qa/<slug>.md`. `qa/AUDIT.md` records the defects of the previous cuts that this pipeline replaces.

## Folder contract

```text
projects/<slug>/
  script.md                 narration, structure, evidence, sync points
  narration/                narration.wav, sentences.json, words.json, pronunciation.json
  captures/journey/take-NN/ <chapter>.mp4 + <chapter>.events.json, take.json
  captures/terminal/        real command output with timings
  edit/plan.json            frame-exact edit (generated)
  edit/shots.md             shot list (generated)
  edit/audio/               stems, master.wav, mix.json
renders/<slug>/             ProRes master, captions layer, final MP4s, VTT, poster
qa/<slug>/                  report.json, contact.png, transitions.png
```

Final deliverables are copied to `output/portfolio-videos/` at the repository root: `<slug>.mp4`, `<slug>-captioned.mp4`, `<slug>.vtt`, `<slug>-poster.png`, and the suite contact sheet. No publication or website insertion is performed by this workspace.

The `source-map.json` file records the original path for every copied asset.
