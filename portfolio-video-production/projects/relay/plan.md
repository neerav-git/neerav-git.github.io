# Relay: film plan

Runtime target ≈89 s · Remotion engine, journey capture like Homeward · Relay portal palette

## Story

The film follows one employee journey, end to end, through the real portal. The signed-in synthetic employee is Maya Patel (Northstar Analytics); the film uses no pronouns for Maya.

1. **The problem.** A simple need turns into a hunt across systems for the right record and owner.
2. **Ask by voice (live Deepgram session).**
   - Maya taps the Relay orb and asks out loud: "My corporate account access says blocked. Why, and is anyone working on it?"
   - Your voice animation reacts to Maya's voice, then to the agent's.
   - The agent answers by voice from Maya's records and opens IT-2047 while it speaks. The narrator stays silent here, so the exchange plays as it happened.
3. **Act with approval (typed, replayed).** Maya types the details. Relay prepares the reply and waits. Maya confirms, and the reply lands on the case.
4. **Second request, same contract.** The laptop won't charge on its dock. Relay drafts a complete IT case (title, details, destination, response target), confirmed the same way.
5. **The contract.** Workflow operations shows the action prepared, confirmed, executed and verified.
6. **Evidence.** The in-app Agent evaluation page, plus the release gate.

## Narration (as built, 9 sentences ≈55 s, plus the 20.4 s voice exchange)

0. A blocked account on day one can mean hunting for the right record and owner.
1. Let's see an example, and hear how the Relay guide helps.

   *[Voice exchange, narration silent: Maya's spoken question, then the agent's three sentences; IT-2047 opens mid-answer. Ends on "…when you last tried to sign in."]*

2. In seconds, Relay found the case, named its owner, and opened the reply field.
3. Maya types the details, and Relay prepares the reply and waits.
4. One click, and the reply is on the case.
5. A laptop that won't charge becomes a complete IT request, confirmed the same way.
6. Every action runs through one contract: the signed-in employee, an explicit confirmation, a retry-safe key, an audit trail, and a verified result.
7. Measured on the real app, 103 of 110 conversations ended fully right, and 39 of 42 never-seen requests passed.
8. Red-team attacks caused no unsafe actions, and a release gate fails the build if any of this slips.

31/34 spoken requests answered usefully and 0 unsafe actions in 21 red-team runs are shown as callouts on the real evaluation cards. "Never-seen" replaces "reworded" because Whisper heard Kokoro's "reworded" as "rewarded".

## Edit (as built, `edit/films/relay.mjs`, take-02)

| Beat | Picture |
|---|---|
| Cold open | Confirm click; the reply lands in IT-2047's case activity |
| Sting | Relay mark and wordmark (cut from the app's `relay-logo.png`) |
| Problem → lead-in | Home on day one: "Corporate account access · Blocked"; the cursor goes to the orb and taps it |
| Voice | Take frames at 1× with the recorded audio; tap, then a 0.25 s dissolve past the greeting |
| Reply | Case owner and reply field; the chat opens, Maya types, the reply waits, Confirm, the reply lands |
| Laptop | Typed request; draft row; Confirm; the new case is Received |
| Under the hood | IT Operations: signed-in employee, confirmation, Retry request safely, the 10-event chronology, State Change Verified |
| Result | Agent evaluation cards (103/110, 39/42, 31/34, 0 unsafe in 21 runs), then the real `npm run evaluate:gate` output |
| End card | Relay |

## Capture (free, except for one recorded Deepgram session)

**Voice exchange** (done 2026-10-28):
- Recording: `capture/relay/voice-live.ts` ran one live session.
  - Kokoro (`bf_emma`, a different voice from the narrator's af_heart) spoke Maya's line into Relay's real microphone path, via the evaluation's microphone shim.
  - Deepgram transcribed it exactly. The agent called `get_employee_portal_context` and `reveal_portal_record`, spoke about 31 s, and opened IT-2047.
  - Every socket message and the agent's PCM are saved in `projects/relay/voice/live-01/session.json`, along with a reference video.
- Frame-stepped capture: `capture/relay/voice-replay.mjs` feeds that session back into the unchanged app.
  - The socket is replaced by the recording, gated on the app's own messages.
  - Maya's audio goes through the microphone worklet.
  - The audio clock follows page time.
  - Your orb animation and the tool navigation therefore run for real, at 60 fps, with no Deepgram calls.
- Sound: `capture/relay/voice-audio.mjs` lays the recorded audio onto the capture's frames.

**Typed turns:**
- Replay W2's turns 3 and 4 (`window.__guideReplay` with those turns), continuing from the open case.
- Confirm clicks are real.

## Visual inventory

- **Sourced:**
  - live portal and the W2 replay recording;
  - Workflow operations evidence;
  - the Agent evaluation page;
  - README screenshots `docs/assets/readme/relay/screenshots/*` as fallbacks;
  - gate terminal output.
- **Designed:**
  - R1 "the hunt" (no product names; generic system labels; marked schematic);
  - an execution-contract overlay that lights the five checks on the real trace.

## Fact ledger

| Fact | Source |
|---|---|
| 103/110 after fix pass (from 26/37) | README results table, `evaluation/summaries/evaluation-snapshot.json` |
| 39/42 held-out | README |
| 0 unsafe actions in 21 red-team runs | README |
| 0 unsupported of 1,035 facts | README |
| Release gate fails CI on regression | README, commit `dab9b6a` |
| Journey texts (IT-2047, replies, case draft) | `evaluation/ui-runner/recordings/W2.json` |
| Voice exchange (question, transcript, spoken answer, tools) | `projects/relay/voice/live-01/session.json` (live Deepgram, 2026-10-28) |
| 31/34 recorded spoken requests answered usefully | README results table |

## Open questions

None open. The user liked the voice preview and asked for a crisp cut that ends once enough has been said. The agent's answer spans take-01 17.7–29.4 s: blocked (17.7–19.5), owner and 3:00 PM target (20.6–24.0), and the request for the MFA device and sign-in time (25.2–29.4). Later sentences repeat themselves and are cut.
