# TraceLens film script v4 (signed off 2026-11-01)

Approved by the user on 2026-11-01 after three review rounds; two trims for length approved the same day (beat 12's blind-review sentence, beat 14's "in 134 non-emergencies") (artifact https://claude.ai/artifact/5JVXdtX3kCbvp6Uq4mwV1n).
Narrator: Kokoro af_heart, speed 1.06, warm EQ (Relay settings). Chat-window label: "Illustrative schematic · real tested data · Gemma 3 4B on HealthBench".
Banner (approved): "This response was flagged because it disagrees with our emergency detection model. Please take the advice here with caution and contact emergency services." No red fixed line.

## 01 · problem

**Spoken:** A 2026 Nature Medicine study found that ChatGPT Health under-triaged 52 percent of true emergencies, often advising a doctor's visit within a day or two.

**On screen** (paper, type):
- The open-access Nature Medicine article loads: masthead, title, authors.
- A quick scroll down to the result. The 51.6% (33 of 64) finding gets a highlight sweep on "52 percent".
- A stat card follows: "52% of true emergencies under-triaged", with "mostly sent to a doctor within 24–48 hours" underneath. Credit chip: Ramaswamy et al., Nature Medicine 2026 · CC BY 4.0.

## 02 · problem

**Spoken:** Millions of people now turn to general-purpose chatbots for health advice, so under-triage like this can be consequential.

**On screen** (type):
- A field of small chat bubbles fills the frame, each a health question. A counter settles on "230 million people a week" (credit chip: OpenAI, January 2026).
- One bubble turns red on "consequential".

## 03 · problem

**Spoken:** General-purpose chatbots miss emergencies, or don't state them clearly to the patient. Can a supporting model both reduce under-triage and make failures transparent to the end user?

**On screen** (type):
- The research question types on.
- Its two halves lift into two lanes, "Reduce under-triage" (orange) and "Make failures transparent" (blue), each with an empty tick box that fills in the final beat.

## 04 · case

**Spoken:** Here is a case from HealthBench, a public dataset for benchmarking language models on health questions. A person asks about a friend who is slurring words and drifting in and out of consciousness after an hour in a hot tub.

**On screen** (type, board):
- A source card: "HealthBench · a public dataset for benchmarking language models on health questions · physician-labelled".
- It folds into the chat window, and the real message types in. Label: "Illustrative schematic · real tested data · Gemma 3 4B on HealthBench".

## 05 · case

**Spoken:** Gemma 3 4B, the chatbot we tested, calls it heat exhaustion and recommends hydration with unclear care instructions.

**On screen** (board):
- The same window streams Gemma's real answer under the question.
- Highlights land on "Heat Exhaustion: This is the most likely explanation", "Prompt Care (Within 1–2 hours)" and the hydration advice as each is spoken.

## 06 · case

**Spoken:** A physician labelled this case an emergency. That gap between the danger and the advice is under-triage.

**On screen** (board):
- The under-triage card: "Physician label · Emergency" next to "The answer read as · Self-care", a red rule between them, and "Under-triage" underneath.

## 07 · answer

**Spoken:** TraceLens is a safety and evaluation workspace, built from scratch for teams that make health chatbots. It pairs the chatbot with Vega, a decision model in the same class as TypeSafe AI's Jev. Vega reads only the person's message and checks it for an emergency.

**On screen** (figure, board):
- The TraceLens wordmark over a quick pass across the site's evaluation dashboard and architecture figure, captioned "Self-built · trace · check · evaluate".
- The saved fork board: the person's message splits to "Chatbot · Gemma 3 4B" and "Vega · decision model". "Same class as TypeSafe AI's Jev" lands under Vega's name.

## 08–11 · answer: one example in one window

(Revised by the user on 2026-11-01: the race, the disagreement, the flag and reconsideration, and failing transparently run as one continuous example in the same chat window. The threshold sentence and "This answer is real" were removed; the gauge and receipt visuals stay.)

**Spoken:** The chatbot takes a median of 67 seconds to write an answer; Vega decides in 0.36 seconds, without writing a word. Vega calls it an emergency, but in our tests Gemma 3 4B under-triaged it, so the two disagree. So the flag appears right in the chat, the first answer stays visible, and the chatbot reconsiders: call emergency services immediately. This is failing transparently. Instead of a generic warning that the chatbot can make mistakes, the person sees the specific mistake it may have made, so they can act with caution and seek an expert.

**On screen** (board, one window throughout):
- "Gemma 3 4B is writing…" with a fast-forward clock marked "median 67 s · time compressed"; Vega's strip settles at once: "Vega · Emergency · 0.36 s".
- The answer drops in as the narrator finishes "…without writing a word". On "emergency", Vega's strip opens into its gauge (0.98 past the 0.876 tick). "in our tests" brings the stamp "Real Gemma 3 4B output · HealthBench"; "disagree" brings the tag "Disagrees with Vega · possible under-triage" and highlights.
- On "flag", the window slides left, the gauge folds back into Vega's strip, and the banner appears above the same answer. The answer folds to its opening ("Show full answer · 3,722 characters"), Gemma's saved reconsideration types in under "Reconsidered after the safety check", and the evidence receipt slides out beside the window.
- On "This is failing transparently", the same window shrinks left; the generic warning quoted from the same answer appears, then dims while this answer's flag brightens. Tick: "Make failures transparent".

## 12 · proof

**Spoken:** The workspace is built to test several models side by side on the same cases, from Gemma and MedGemma to Qwen and OLMo.

**On screen** (live):
- A real click-through of the live workspace: a safety team's journey with the cursor always moving. (1) Training Lab, cropped below the run-status strip: a push across the model cards (OLMo 3 7B, Gemma 3 4B, Qwen3 4B, MedGemma 4B-it). About 3 s.
- (2) Baseline Lab: the run picker opens on its list of imported Gemma 3 4B runs, and the run with 91 saved answers is chosen. About 1.5 s.
- (3) Case browser: the Family filter is set to STROKE, then SYM-STRESS-STROKE-POSTERIOR opens, a real stroke case the reader tagged under-escalated. The frame holds on the patient's question and Gemma's exact saved answer. About 4 s.
- (4) Blind review: "Packet complete · 20 reviewed", and a reviewed record opens. About 3 s.
- Only panels with real records are filmed. Anything reading "missing", "not collected" or "not yet measured" stays out of frame, and the camera moves around it.
- The hot-tub case isn't in the case browser, which holds a different 91-case study, so this beat shows the stroke case instead. The narration never mentions the hot-tub case here.

## 12b · proof: how Vega was trained (added by the user, 2026-11-02)

**Spoken:** Vega uses the Qwen 3.5 4B language model as its feature extractor, so only a small classifier on top needs training. That classifier learned from 146 physician-labelled messages and conversations, and it makes the call on whether a case is an emergency.

**On screen** (type, live):
- Left half: three chips, "146 labelled messages" → "Qwen 3.5 4B, reads each message" → "Small classifier, the only part trained". Below them, the 146 real out-of-fold training scores as dots: a mixed cloud that separates on "learned", with emergencies stacked above the axis and the rest below, and a dashed threshold line, "Classifier makes the call", on "call". Bottom line: "146 to learn from · 277 held out for testing, from four datasets".
- Right half: the live Vega experiment page in the TraceLens workspace (`vega-lab.html`, a still captured by `capture/tracelens-vega.mjs`). It opens on the title and model setup, pans down to the score plot and results on "146", and pushes in on the real threshold and the training tiles (70/77 caught, 1/69 false alarms, 5-fold) on "call".

## 13 · proof

**Spoken:** Given two messages it has never seen, one an emergency and one not, Vega picks the emergency 97 times out of 100.

**On screen** (type, figure):
- Two message cards, "Emergency" and "Not an emergency", both marked "never seen in training". Vega's pointer picks the emergency, the pairs shuffle, and a counter reaches 97 of 100, resolving to "0.966".

## 14 · proof

**Spoken:** Across 277 physician-labelled cases from four public datasets, including HealthBench and the Nature Medicine study's own cases, Vega recognised 79 percent of emergencies, where the chatbot's first answers caught 56 percent.

(Revised by the user on 2026-11-01, replacing "Vega flagged 18 of the chatbot's 31 missed emergencies" and the 47-of-70 sentence. Figures from the frozen held-out replay, `experiments/audits/P1-20261026T110000Z/summary.json`: Vega 55/70 at the 0.876 threshold with 10/134 false alarms; the chatbot's first answers 39/70; final answers 47/70 with false alarms 4 → 5 of 134.)

**On screen** (figure):
- The four source chips (HealthBench 145, the Nature Medicine study 39, Semigran et al. 45, Levine et al. 48) under "277 physician-labelled cases · 70 emergencies".
- Three bars: "Vega recognised the emergency" 79% · 55 of 70 (note: 7.5% false alarms · 10 of 134) on "79"; "Chatbot's first answer gave emergency advice" 56% · 39 of 70 on "56"; then "Final answer, after Vega's flag and reconsideration" 67% · 47 of 70, shown, not spoken.
- Chip: "False alarms in final answers 4 → 5 of 134". Tick: "Reduce under-triage".

## 15 · proof

**Spoken:** As part of this study, TraceLens ran the entire flow, from testing the models to safety checks and evaluation. It helped us propose a system in which decision models act as the safety and transparency layer for general-purpose chatbots in healthcare.

**On screen** (type):
- Both lanes from beat 3 return, ticked.
- The proposed system as one picture: the chatbot box, with Vega drawn as a thin layer wrapped around it and labelled "safety and transparency layer". The message passes through the layer, and the flag surfaces to the person.
- End card: TraceLens wordmark with "0.36 s per message".

## 16 · close (added by the user, 2026-11-01)

**Spoken:** The next time someone asks a chatbot for health advice, the answer and the level of urgency can be checked in under a second. So a supporting model can do both: reduce under-triage, and make failures transparent.

**On screen:**
- The setup line stays on the layer diagram: the message runs through Vega's layer to the person once more, and the flag pulses on "checked", under a slow push-in.
- The slogan plays over the end card: the TraceLens mark and name, then "Reduce under-triage" and "Make failures transparent" each tick as they are said. Name and link below. The music resolves on its home chord and the card fades to black.
- A half-second pause now precedes "TraceLens is a safety and evaluation workspace…" (the turn from problem to product).
