# Live test 1 (2026-10-14): voice, tour flow, and navigation

Neerav tested the published guide (main at 2292efa, knowledge bc3c10dc1faf) on Firefox, then Chrome. All items below are high priority.

## Issues, observed behavior, and cause

| # | Issue | What Neerav saw | Cause |
| --- | --- | --- | --- |
| 1 | Speech out of sync with text | On Firefox the written reply appeared at once and the voice started much later | Text streams to the panel immediately while speech waits for synthesis. Firefox has no WebGPU, so Kokoro falls back to WASM q8, which synthesizes far slower than playback |
| 2 | Only the last few lines were spoken | The narrator spoke a few lines at the end of the reply | Sentences that arrive while the voice model is still loading are skipped (`if (voice().ready) speak`), so only sentences after it became ready were spoken |
| 3 | No audio or visual confirmation for "Turn on voice" | Pressing it gave no beep; it was unclear what it does | The button turns on spoken replies, not the microphone, and gives no sound when the voice becomes ready. Its label reads like a mic control |
| 4 | Mic hard to find | The chime comes from the mic, not "Turn on voice"; on Firefox there was no mic at all | Firefox lacks browser speech recognition, so the mic button is hidden with no explanation; on Chrome the mic has no visual invitation |
| 5 | Tour steps unexplained | "Step 1 of 4" with no indication of what the tour is, what the step shows, or what to do (screenshot: "What has Neerav built?") | Tours often start with no introduction; the step label carries no stop name; the panel never explains that the page moves and highlights each stop or what Next does |
| 6 | No opener connecting question and answer | The reply jumped straight into step 1 without relating it to the question, in text and speech | The model frequently sends a tour with no intro sentence, and nothing supplies one |
| 7 | Words and highlight disagreed | An answer ended "he's built the IEEE research you're reading right now" but the page showed Relay; the study appeared only after a follow-up | The model referred to a page the visitor was not on and showed a different project from the one its answer ended on |
| 8 | Key technology omitted | Describing the brain-atrophy study without "computer vision" made it sound archaic | The plain-language rewrite removed field and technology names along with jargon. Keywords such as computer vision, deep learning, and LLM agents are credibility, not jargon |
| 9 | Owner facts missing from the site and resume | PyTorch, LangChain, Hugging Face, Anthropic; ADNI source and tuning for the four-class study; the Deep Strat internal AI manual | Added to guide knowledge in round 1 but not to public pages |

## Plan

1. **Voice sync (1, 2):** while spoken replies are on, reveal each sentence of the written reply as it starts playing, so reading and listening stay together; show "Preparing the spoken reply" while the first sentence synthesizes; queue sentences that arrive while the voice is loading instead of dropping them.
2. **Voice control clarity (3, 4):** relabel the toggle as spoken replies, play a confirmation tone and say "Voice is on" when it becomes ready, give the mic a gentle glow and a tooltip, and on browsers without speech recognition show a disabled mic that explains which browsers support voice questions.
3. **Tour flow (5, 6):** every tour opens with a sentence that connects the question to the tour and is spoken; if the model omits it, the panel supplies one from the question and stop names. A tour card lists the stops and explains that the page moves and highlights each one and how Next and End tour work; each step label names its stop; side notes explain the highlight.
4. **Opener rule (6):** every answer's first sentence answers the question directly.
5. **Words match the page (7):** the shown target must be the project the answer is about or ends on; never claim the visitor is reading a page unless the current page says so.
6. **Keywords (8):** plain language still names the field and core technology of each project.
7. **Public consistency (9):** add the owner-supplied facts to the site's about and project pages and to the resume summary.
