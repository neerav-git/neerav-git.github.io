# Portfolio films: continue the rebuild at Homeward quality

You're continuing the narrated portfolio films in
`/Users/neeravch/Documents/ChatGPT/neerav github io/portfolio-video-production/`
(branch `feature/portfolio-guide`; finished files go to `../output/portfolio-videos/`).

## Read first, in this order

1. `HANDOFF.md`: status, verified facts, commands and open questions. This is the source of truth.
2. `README.md`: the editorial standard and pipeline. It still says 7 films; it is now 6 (below).
3. `edit/films/homeward.mjs` and `qa/homeward.md`: the reference edit and the QA bar every film must match.
4. `plans/README.md` and `projects/<slug>/plan.md` for the film you are working on.
5. Memory notes: `portfolio-videos.md`, `state-measured-claims-plainly.md`, `portfolio-copy-voice.md`, `no-paid-infrastructure.md`.

## The quality bar is Homeward

I rejected the first cuts of every film as "crap": wobbly images, nothing that looked professionally edited, just a voice over pictures, no transition animations and no end-to-end user journey. Homeward is the rebuild I called "substantially better". Every film must hold up next to it. Hold up means a polished product-launch video or research explainer. Be a strict editor: anything that looks amateur in a frame you review is a defect, whether or not I named it.

What makes Homeward work, and what every film must keep:

- **Structure:**
  - cold open (3–5 s) → title sting (≤2 s) → problem (≤8 s);
  - then one user's journey through the real product (55–65% of the runtime) → under the hood → result → end card (3–4 s);
  - 40–90 s at 1920×1080 and 60 fps.
- **Real footage:**
  - Deterministic frame-stepped captures (`capture/director.mjs`): 3840×2160 frames and a human-paced cursor.
  - Real waits on real results, never fixed sleeps. State is reset before every take.
  - Never use Playwright `recordVideo` or ffmpeg `zoompan`.
- **Edit as code:** shots are pinned to capture event labels and narration words, so a new take re-cuts itself. The camera:
  - is eased auto-zoom, 1.3–1.9× on everything the narration names, with motion blur;
  - has no direction reversals;
  - never holds for more than 3 s without visual change.
- **Editing grammar:**
  - cursor with click ripples, callouts, lower thirds, journey tracker, chapter cards;
  - document reveals, animated diagrams, terminal replays;
  - transitions: blurDissolve, radial, whip, wipe and zoomThrough;
  - finish with vignette and grain;
  - Inter titles at ≥28 px inside 5% title-safe margins, with captions ≤52 characters.
- **Sync:** each click lands on the narrator's matching verb within ±150 ms. Homeward's worst is 97 ms.
- **Sound:**
  - Kokoro `af_heart` with the approved tuning, synthesized per sentence;
  - a procedural music bed 15 dB under the voice;
  - SFX on clicks, keys and transitions, ducked 12 dB under narration;
  - master at −16 LUFS, ≤ −1.5 dBTP.
- **QA:** `npm run qa -- <slug>` and `npm run deliver -- <slug>`. Every check must pass and be reported honestly, including coverage limits. Look at the contact sheet and transition strips yourself before showing me anything.
- **Pipeline:** `npm run film -- <slug>` runs plan → mix → render → QA. Use `npm run draft -- <slug>` for fast previews.

## What we decided, so it guides every film

- **Six films:** relay, refract-ai, homeward, birb-hangout, tracelens, alzheimers-research. The last one merges the two Alzheimer's projects.
- **Rollout gate:** don't render the other films until I sign off on Homeward. I praised it and its voice chipping is fixed, but I haven't formally signed off. Ask me.
- **Evidence:**
  - All evidence is real: app footage on seeded demo data, exact paper, notebook and thesis crops, real terminal output, real model outputs.
  - Designed bridging visuals are Remotion components in `remotion/designed/`, labelled "Illustrative interface · real model outputs" or "schematic".
  - Never invent numbers or UI.
- **Claims:**
  - **Don't over-correct.** State measured claims plainly, using the numbers in my runs.
  - Don't soften claims into vague words or raise small source differences as blockers. When two figures differ slightly, use the better one and move on.
  - Only ask when the evidence truly isn't on disk.
- **Copy:**
  - direct descriptions;
  - no "X, not Y" contrasts;
  - no meta or curation talk about the film;
  - they/them for Alex and Maya, or no pronouns.
- **Money:**
  - No paid infrastructure; only the capped Claude API may cost money.
  - The single Deepgram session for Relay is already recorded. Never record another; replay the saved one.
- **Audio lesson:** the narration "chipped" because of offbeat hi-hats in the music. Never put transient percussion under narration. If the voice sounds wrong, compare spectrograms of `narration.wav`, the stems and `master.wav` before touching anything else.
- **Clips:** keep them crisp. Cut once enough has been said.

## Film-specific direction

**Relay (do this first)**
- Story: one employee journey through the real portal.
- Voice beat:
  - The narrator says "Let's see an example, and hear how the Relay guide helps."
  - Then the approved 22 s live voice clip plays with narration silent (`output/portfolio-videos/previews/relay-voice-cut.mp4`). It's built from capture take-01, 0–2.3 s and 9.4–29.8 s with a dissolve over the greeting. The clip ends on "…when you last tried to sign in."
  - Product narration then resumes: "In seconds, Relay found the right case…"
- Next:
  1. Capture W2 typed turns 3–4 with real confirm clicks.
  2. Capture Workflow operations, the Agent evaluation page and the `npm run evaluate:gate` terminal.
  3. Extend `mix-audio.mjs` to carry chapter audio under silent narration.
  4. Write `edit/films/relay.mjs` to the plan.
- Facts: 103/110 after the fix pass, 39/42 held-out, 31/34 spoken requests answered usefully, 0 unsafe actions in 21 red-team runs.

**Refract**
- The selling point is one research workspace that carries a study end to end in a single session:
  - paper Q&A;
  - notes logged from assistant explanations;
  - literature review and research-gap identification;
  - statistical analysis on the reviewed data, with leakage prevention;
  - several models tested at once.
- The result is that whole chain living in one workspace. Don't headline accuracy or RMSE.

**TraceLens**
- Hero case T1-8db5d356: Gemma missed it and Vega caught it. It's one of 8 corrected cases (31 misses → 18 flagged → 8 corrected out of 277).
- Cost is measured:
  - Gemma: median 818 tokens and 67 s per answer;
  - Vega: no generated text, median 0.36 s per decision.
- Boards D1–D4 are ready.

**Alzheimer's**
- Ensemble first: specialist custom CNNs varying depth, width, BatchNorm, Dropout, ReLU and LeakyReLU. Their strengths differ, and averaging them took accuracy from 78% to 85% with fewer crucial misses.
- Then the IEEE CV paper goes further: where the disease shows, hippocampal cross-sections (66% → 71%), and automated atrophy detection.

**Birb**
- A journey film from my full-resolution `.mov` captures in `~/Desktop/birb hangout video captures for website/`.
- Use the sync wording from `content/projects/birb-hangout.json`.

## Still waiting on me (ask once, together, then keep working)

- Homeward sign-off.
- Alzheimer's: per-model accuracy, false-positive rates or confusion matrices.
- Refract: option A (live recapture) or B (thesis screenshots), and where the HNEI dataset and papers are.
- Birb: a room-join shot, and whether the records-clip music plays.

## Working style

- Work autonomously and show me finished previews, not questions.
- After each film, give me the delivered file and its QA summary.
- Commit progress on `feature/portfolio-guide`. Media stays gitignored.
- Leave uncommitted site files outside `portfolio-video-production/` alone.
- Update `HANDOFF.md` as you go.
