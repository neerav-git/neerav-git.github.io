# Guide improvement plan

Written 2026-10-14, after the guide went live and the first round of hands-on testing. The quality bar is `eval/criteria.md`: 10 categories with 5 test questions each, scored 0 to 2, where a category passes at 80% with no 0s.

Companion plan: [`KNOWLEDGE_CURATION_PLAN.md`](./KNOWLEDGE_CURATION_PLAN.md) defines what enters the guide's knowledge, the Homeward ownership correction, removal of internal meta material, preservation of rich methodology and results, PDF alignment, and the content-specific release gates.

**Where it stands:**
- The guide answers from the portfolio, moves the page, runs tours, and offers links.
- It passes the 13 automated checks and the scripted click-through in Chrome.
- Those checks only prove the mechanics work. Most of what makes an answer good for a hirer is still unmeasured, and the first real conversations fall short of the standard below.

| Phase | Goal | Categories |
|---|---|---|
| 1 | Stop the visible defects, and measure where it stands | 2, 3, 8, 9 |
| 2 | Teach it Neerav's strengths and how to present them | 1, 2, 3, 4, 5 |
| 3 | Make the conversation and navigation hold up, then lock in the standard | 6, 7, 8, 10 |

---

## Phase 1: Stop the visible defects and measure the baseline

### What doesn't work

1. **Self-talk is spoken to visitors.** Answers end with "Nothing further to add." The cause is the note the Worker attaches to every successful tool result: "Do not repeat it; add only something new, or nothing." The model reads it as something to answer. (Category 9)
2. **Page moves are announced twice.** For example: "I'm showing you Relay's architecture section now. The architecture section is now highlighted." The same goes for "The resume and contact buttons are in the panel." The model writes a sentence before the tool call and another after it. (Category 9)
3. **Answers end on a caveat.** Examples:
   - "These results come from a fictional employee environment."
   - "Its systems are fictional, though, and the Slack integration is tested contracts rather than a live workspace."

   The prompt's rule to "keep each claim's stated limits" has nothing to balance it, so limits get volunteered and land as the last word. (Category 2)
4. **It refuses to reason about experience.** Asked about 2 to 4 years for Forward Deployed Engineering, it said "The portfolio doesn't state a total number of years or use the phrase Forward Deployed Engineering, so I can't confirm." The resume dates (2022 research role, 2023 internship, 2024 to 2026 product builds) are in its knowledge. (Category 3)
5. **Tour introductions run long.** A hiring tour opened with about 80 words before the first stop. With voice on, that is roughly 30 seconds before the page moves. (Category 8)
6. **A contributor's GitHub handle is read aloud.** Homeward's credits list "sbasu107". This is a content fix and needs the contributor's real name from Neerav.

### What needs improvement

- **Testing is blocked by the visitor limits.** The 40 questions per visitor per day apply to Neerav while testing, and the eval's off-topic scenarios count toward the 3-per-day pause.
- **Nothing measures answer quality.** The 13 automated checks test mechanics (no URLs, a tour started, a link offered), not whether an answer would impress a hirer.

### Changes

- **Agent loop:** remove the "add only something new, or nothing" note. Instead:
  - When text was already spoken before a successful show, links, or tour call, end the turn without a second model call.
  - When the model called a tool before writing anything, continue as now so it can write its answer.

  This also saves one model call per answer.
- **Prompt, speaking:** write the answer, then call tools. Never describe your own process or say that you have nothing more to add. Mention a highlight or the buttons at most once, in passing.
- **Prompt, framing (first pass):**
  - A limitation is mentioned only when the visitor asks about it or it changes the conclusion.
  - It is stated once, neutrally, and followed by what the work does show.
  - An answer never ends on a caveat.
- **Prompt, experience:** reason about years from the dates in the resume and the projects. Present the experience as it is ("about four years of hands-on AI work across research roles, an internship, and product builds"), without inventing employment.
- **Prompt, tours:** the introduction is one sentence of at most 20 words. The detail goes in the narration of each step.
- **Scoring harness:** turn the 50 questions in `eval/criteria.md` into an automated eval.
  - It runs each conversation against the Worker.
  - A grader model (Claude Opus 5.5) scores every answer 0 to 2 against the category's description and failure examples, with a one-line reason.
  - Results are saved per run, so changes can be compared.
  - Estimated cost: 10 to 20 cents per full run.
- **Testing access:** an eval or tester token, stored as a Worker secret, that skips the per-visitor limits and the off-topic pause. Spend still counts toward the daily and monthly ceilings.

### Done when

- None of the defects above shows up across the 50 questions.
- The existing 13 checks still pass.
- A baseline score is recorded for all 10 categories.
- Neerav can test without hitting a limit.

---

## Phase 2: Teach it Neerav's strengths and how to present them

### What doesn't work

1. **It has no model of what Neerav is strongest at.** It knows the projects, but nothing says which strengths set him apart or which evidence proves each one. Answers default to listing projects with equal weight. (Category 1)
2. **Capability answers are thin.** "What can you tell me about his engineering capability" got one project's stack and a single sentence on Birb Hangout. The answer ignored the evaluation work, the research pipelines, the Deep Strat results, and the range across product, research, and integration. (Categories 1 and 4)
3. **It repeats the same evidence.** Relay's 103 of 110 and 39 of 42 come up for almost every question. Other strong, specific facts get skipped, for example:
   - Deep Strat's 25% cut in false positives
   - the ensemble's 78% to 85% gain
   - the peer-reviewed IEEE paper
   - the 21 red-team runs with zero unsafe actions

   (Category 4)
4. **It can't go deeper than the summary.** Follow-ups like "how does it work" or "why was it built that way" tend to restate the headline instead of explaining the design, the tradeoffs, and what changed after failures. (Category 5)
5. **Role mapping is literal.** It looks for the role's exact words in the portfolio instead of the skills the role needs. Forward Deployed Engineering means customer-facing requirements work, integrations, shipping prototypes quickly, and handling ambiguity. Deep Strat (requirements with department leadership) and Relay's integrations are direct evidence of those. (Category 3)

### What needs improvement

- How limitations are framed: phase 1 stops caveats from closing answers, but the guide still needs a positive frame for each project's scope. For example, "evaluated on a realistic simulated workplace with 252 live conversations" rather than "fictional".
- Gaps need an answer pattern: the closest evidence, plus how he'd close it, instead of "the portfolio doesn't show".

### Changes

- **A strengths profile, written for the guide and approved by Neerav.** It becomes a new source file, `content/guide/profile.md`, that the knowledge build includes. It holds:
  - **Four or five core strengths, each with its proof points.** For example, end-to-end AI product engineering; application-owned safety and evaluation; research to working system; customer-facing requirements and integration.
  - **An experience timeline** with how to describe the total honestly.
  - **The roles he is targeting**, and how each maps to strengths and evidence: applied AI engineer, AI product engineer, forward deployed engineer, ML engineer in healthcare.
  - **Framing for each project's scope**, with the accurate positive wording to use.
  - **Known gaps** and the closest adjacent evidence for each.

  I draft it from the existing content. Neerav edits and approves it before it goes live, because it speaks for him.
- **Depth material:** for each project, pull the "how it works", "why this design", and "what failed and what changed" passages into the knowledge as discussable sections, so follow-ups have something real to draw on. Check that the knowledge stays under its size limit, which keeps cost per question flat.
- **Prompt, presentation:**
  - Answer like an informed advocate.
  - Lead with the strongest relevant evidence and vary it across answers.
  - Match depth to the question: short for overviews, a fuller explanation for "how" and "why".
  - Offer to go deeper.
- **Prompt, role mapping:** break a role into its requirements, match each to evidence, and handle gaps with the adjacent-evidence pattern.

### Done when

Categories 1 to 5 each score at least 80% with no 0s on the automated eval, and Neerav agrees after reading the transcripts.

---

## Phase 3: Make the conversation and navigation hold up, then lock in the standard

### What doesn't work, or hasn't been tested yet

1. **Navigation quality hasn't been reviewed by a person.** The mechanics pass, but nobody has yet judged whether each page move is the most useful one for what was said. Known risks:
   - highlighting a home-page mention instead of the project
   - moving when the visitor didn't need it
   - the words and the highlight disagreeing after a follow-up

   (Category 7)
2. **Multi-turn conversations are barely tested.** Pronouns, comparisons, and topic changes have only been checked in one scripted conversation. (Category 6)
3. **Tour pacing with voice is untested.** That covers how long each step is spoken, whether the page settles before the narration starts, and what happens when the visitor interrupts a tour with a question. (Category 8)
4. **Off-topic boundaries may be too strict or too loose.** For example, "write me a cover letter for this job" is arguably on purpose for a hirer. The flag that pauses visitors must never fire on a genuine hiring question. (Category 10)

### What needs improvement

- **There's no way to capture failures from real use.** Problems found while testing on a phone or laptop have to be described by hand.
- **The eval only covers what the Worker returns, not what happens on the page.**

### Changes

- **A flag button on each answer.**
  - It saves that conversation, the page moves, and an optional note to the Worker's storage.
  - Only flagged conversations are stored, and visitors are told so.
  - A short command lists the flags so each one becomes a test case.
- **Browser eval.** Extend the scripted Chrome run with the multi-turn conversations from categories 6 to 8. For each turn it checks the URL, the highlighted element, whether that element is in view and not under the panel on mobile, and the tour order.
- **Navigation tuning** from the flags and the browser eval:
  - target choice rules in the prompt
  - better labels in the target registry where the model picks the wrong section
  - anchors for any useful section that doesn't have one yet
- **Voice tour pacing:** wait for the scroll to settle before speaking a step, and let a question during a tour end the tour cleanly.
- **Boundaries:** decide with Neerav which hiring-adjacent requests are in scope (cover letters, interview questions about him, salary), and add those cases to the eval.
- **Release gate:** before any prompt or knowledge change goes live, it runs:
  - the 13 mechanics checks
  - the 50-question rubric eval
  - the browser eval

  A drop in any category blocks the deploy. Once testing ends, put the per-visitor limits back to their normal values.

### Done when

- All 10 categories score at least 80% with no 0s.
- The browser eval passes on desktop and mobile.
- A week of flags from real use has been reviewed and turned into test cases.
- Neerav signs off that the guide represents him the way he expects.
