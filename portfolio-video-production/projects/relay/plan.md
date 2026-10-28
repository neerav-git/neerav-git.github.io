# Relay: film plan

Runtime target 80–88 s · Remotion engine, journey capture like Homeward · Relay portal palette

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

## Draft narration (≈140 words, plus a ≈22 s voice exchange)

1. New employees lose time hunting for the right system, record and owner before they can fix a simple problem.
2. Relay gives every employee one place to ask, and a guide that acts on their own records.
3. Let's see an example, and hear how the Relay guide helps.

   *[Voice clip, 22 s, live recording; narration silent. The orb tap, then a dissolve past the greeting. Maya asks her question. The agent answers in three sentences and opens IT-2047 as it speaks. The clip ends on "…when you last tried to sign in." Preview: `output/portfolio-videos/previews/relay-voice-cut.mp4`.]*

4. In seconds, Relay found the right case, explained who owns it, and opened it at the reply field.
5. Maya types the details, and Relay prepares the reply and waits for confirmation.
6. One click, and the reply is on the case.
7. A laptop that won't charge on its dock becomes a complete IT request, confirmed the same way.
8. Every action runs through one execution contract: identity, approval, idempotency, audit history and a postcondition check.
9. Measured end to end on the real app, Relay completed 103 of 110 tasks after the fix pass and 39 of 42 held-out rewordings, and answered 31 of 34 recorded spoken requests usefully.
10. Red-team runs produced no unsafe actions, and a release gate fails the build if any of it regresses.

## Shot list

| Time (s) | Beat | Picture | Source |
|---|---|---|---|
| 0–3 | Sting | Relay mark | designed |
| 3–9 | Problem | **R1 The hunt**: generic system cards (HR, IT tickets, documents, learning, pay) scatter and a cursor bounces between them; they collapse into the Relay orb | designed (labelled schematic) |
| 9–12 | Lead-in | Narrator: "Let's see an example…"; the camera pushes in on the dock orb | capture `01-voice` |
| 12–34 | Voice clip | The cut: take-01 0–2.3 s (tap) and 9.4–29.8 s (question → three-sentence answer), with a 0.25 s dissolve over the greeting. Maya's question plays, with the orb reacting to it, and the transcript caption comes up. The agent then answers aloud, and the portal moves to Help & Support → IT-2047 mid-answer. Lower third: "Live Deepgram voice agent · recorded session". Narration silent | capture `01-voice` + its recorded audio |
| 27–40 | Act | Typed reply; the "Ready for your confirmation" card; push-in on Confirm; click; ripple; chip "Reply added to IT-2047" | W2 turn 3 replay + confirm |
| 40–50 | Second request | The laptop request; the drafted case card; Confirm; the case appears in the list | W2 turn 4 replay + confirm |
| 50–60 | Contract | Workflow operations evidence trace; overlay lights the five checks | live capture + designed overlay |
| 60–76 | Evidence | Agent evaluation page; counters 103/110, 39/42, 31/34; chip "0 unsafe actions · 21 runs" | live capture of the real page |
| 76–82 | Gate | Terminal: real `npm run evaluate:gate` output | real terminal |
| 82–88 | End | End card | designed |

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
