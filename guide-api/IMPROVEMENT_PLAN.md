# Guide improvement plan

Written 2026-10-14, after the guide went live and the first round of hands-on testing. Revised the same evening to add the "Show the work" track and to record what has shipped since. The quality bar is `eval/criteria.md`: 10 categories plus an adversarial set, 60 cases in all (70 answers counting multi-turn chains), scored 0 to 2, where a category passes at 80% with no 0s.

Companion plans:
- [`KNOWLEDGE_CURATION_PLAN.md`](./KNOWLEDGE_CURATION_PLAN.md) defines what enters the guide's knowledge, the Homeward ownership correction, removal of internal meta material, preservation of rich methodology and results, PDF alignment, and the content-specific release gates.
- [`KEY_TERMS_PLAN.md`](./KEY_TERMS_PLAN.md) covers naming each project's field and technology in answers.

**Where it stands:**
- The guide answers from the portfolio, moves the page, runs tours with a tour card, offers links, and speaks with an in-browser voice.
- It passes the scenario checks (16 of 16 at the round-3 baseline), the Playwright guide suite (7 of 7), and the scripted click-through in Chrome.
- Those checks only prove the mechanics work. Neerav's ratings of the spoken answers (round 1: 2.92 out of 5 across 24 items) show where answers fall short. Round 2 is the current quality bar.
- **Everything the guide can show is text or a still image.** No page has a video, a live demo, or an interactive exhibit. Relay has no public link of any kind, Homeward and Birb Hangout have one image each, and Birb Hangout links to a product story, not the playable world. The guide's only visual move is to highlight a section.

### Direction: show the work, then explain it

Most of the round-1 feedback says the same thing in different words: a number or a mechanism means nothing to a hirer until they see what it does for the person using the product. Phases 1 to 3 push on that with wording alone. Wording is necessary, but the strongest answer to "What makes Relay more than a demo?" is 20 seconds of Relay taking a spoken request, showing the change, and confirming it.

Four principles shape the new work:

1. **One minute to see a product working.** One hiring manager puts the first look at a portfolio at about 30 seconds, and mentors advise that the whole portfolio be reviewable in about 5 minutes. Deeper reading comes after a shortlist. Every case study opens with its product in motion and a one-line problem, what it does, and the result, before any methodology.
2. **The page comes first, and the guide reuses it.** Many visitors will never open the guide. Every clip, evidence card, and diagram is built for the page and registered as a guide target. Nothing exists only inside the guide.
3. **Each number arrives with a picture or a plain meaning.** A metric is shown as what happened (103 of 110 conversations as 110 marks, the 7 misses open to inspect) and said once in words. This is the visual form of the "metric on its own is never the answer" rule.
4. **The evaluation is the differentiator, so let visitors inspect it.** A working demo is expected from an AI engineer. The question that separates candidates is "How do you know it works?", and Neerav's evaluation harnesses already answer it. They should be explorable, not summarized.

| Phase | Goal | Categories |
|---|---|---|
| 1 | Stop the visible defects, and measure where it stands | 2, 3, 8, 9 |
| 2 | Teach it Neerav's strengths and how to present them | 1, 2, 3, 4, 5 |
| 3 | Make the conversation and navigation hold up, then lock in the standard | 6, 7, 8, 10 |
| S | Show the work: product clips, evidence cards, narrated diagrams, a fit card, and media in the guide | 1, 4, 5, 7, 8, plus visitor outcomes |

Track S runs alongside phases 2 and 3. Its first step, recording clips, needs no guide changes and can start now. Each phase below notes the items that track S absorbs; the critiques themselves stay as written, because they remain the test.

### Status at revision

| Item | Status |
|---|---|
| Phase 1: self-talk note removed; no second model call after a spoken answer whose tools succeeded | Shipped (`agent.ts` `needsPostToolResponse`, prompt "Moving the page" rules) |
| Phase 1: caveat framing, experience reasoning from dates | Shipped in the prompt; question 3.1 rated 5/5 in round 1 |
| Phase 1: short tour introductions | Shipped as the tour card, the overview rule ("Neerav builds…", under 60 words), and the no-tour-talk check |
| Phase 1: contributor handle read aloud | Superseded: Homeward is presented as Neerav's own work (curation plan), so no contributor names appear |
| Phase 1: automated grader | Not built. Scoring has been Neerav's ratings (round 1 on a 1 to 5 scale), with `eval/rubric.mjs` transcripts and `eval/compare.mjs` regression gates. See the correction under Phase 1 |
| Phase 1: tester token | Not built; local limits are raised for eval runs instead |
| Phase 2: strengths profile | Drafted and in use (`content/guide/profile.md`); Neerav's sign-off is still to be recorded |
| Phase 2: key terms | In progress; round 10 fails 6 of 13 gates, with one more left for review (`eval/feedback/round-10-key-terms-review.md`) |
| Live test 1: voice sync, voice controls, tour card | Shipped; performance fixes in `eval/feedback/performance-1.md`, tape-like stutter still open |
| Phase 3: flag button, browser eval for multi-turn | Not started |

## Current three-phase delivery plan (2026-10-22)

This consolidates the earlier guide phases and Track S into three releasable slices. The order follows the core rule above: improve the public evidence first, let the guide reuse it second, then change agent behavior behind evaluation gates. It also separates changes that are mechanically verifiable now from answer quality and visual acceptance that still require Neerav's review.

### Phase 1 — Skills, answer focus, and evidence inventory

**Goal:** make the existing work easier to scan and make guide answers more specific without adding new model calls or model-selected UI.

- Add an evidence-backed `skills` field to each project and render at most four compact tags on portfolio cards, with the fuller set on the case-study page. Keep portfolio-level tools such as PyTorch and LangChain on the About profile unless a project source names them.
- Add deterministic skill footers below guide answers. A project target supplies its reviewed skills; text-only portfolio answers add a skill only when the answer actually names it. The footer is UI metadata, limited to four tags, and is not spoken.
- Tighten the answer pattern to direct conclusion → user or hiring consequence → one concrete proof. For how/why questions use observed problem → engineering decision → verified result or next validation. For stack questions, connect tools to the work they enable instead of reciting an inventory.
- Inventory visual coverage before adding media. Current public assets are strongest for Relay and Refract; Homeward and Birb Hangout each have one public product image. The imaging studies have notebook figures and explanatory SVGs. The Relay source retains a seven-image capture sequence, while Birb has many capture packs that need curation because rejected and diagnostic frames live beside release candidates.

**Gate:** JSON validity, copy and guide-knowledge audits, unit tests for footer selection and prompt rules, TypeScript, production build, and desktop/mobile visual review. A 2026-10-22 phone-width spot check (401 x 692) passed for the home showcase, project index, Relay detail, About profile, compact launcher, and one live Relay answer with a four-skill footer. That answer was specific and evidence-bounded, but first text took 10.8 seconds and the turn completed in 11.7 seconds. Desktop acceptance, a full rubric run, and Neerav's transcript review remain open.

### Phase 2 — Visual proof and short project clips

**Goal:** let a visitor understand each product working within the first minute, using real interfaces and source-backed evidence.

- Define one primary visual sequence per project before capturing anything: user need → product action → visible result → evaluation proof. Reuse the accepted Relay and Refract screens first; do not duplicate the same image as cover, figure, and gallery filler.
- Capture missing Homeward and Birb Hangout sequences from their current source states. Record the source revision, fixture, viewport, scenario, expected result, and acceptance status beside every asset. Do not promote diagnostic, rejected, or visually unapproved Birb frames.
- Produce one silent 15–25 second clip for each implemented product, with an informative poster, concise caption, no autoplay audio, native controls, and a reduced-motion fallback. The two MRI studies use short animated figure sequences only when motion clarifies the method; otherwise retain the stronger static figure.
- Add a reusable media block to project pages and the home showcase. Lazy-load video, keep the poster in the initial experience, provide a transcript or step summary, and measure the added transfer size.

| Project | Public visual baseline | Next visual proof | Clip brief |
|---|---|---|---|
| Relay | Five portfolio screenshots covering the workspace, grounded answer, prepared action, confirmed result, and evaluation dashboard; seven source-sequence captures are available | Curate the source sequence into one consistent employee/request story and add the workflow evidence trace only if its labels remain legible | Spoken VPN request → visible proposal → confirmation → verified support case, 20–25 seconds |
| Refract | Five public product/architecture images across Reader, Compare, Stats, workflow, and system design | Lead with product interaction; keep architecture as supporting proof | Select a paper passage → grounded response → comparison or saved evidence → Stats review checkpoint, 20–25 seconds |
| Homeward | One public recovery-overview screenshot | Capture the patient view, exact source passage, clarification/help state, and approved reminder result from one fixture | Discharge instruction → source-linked next step → clarification or approval → durable reminder, 20 seconds |
| Birb Hangout | One public lounge screenshot; source repository contains many capture packs, including diagnostic and rejected frames | Curate only owner-accepted lounge, shared activity, and Dream-flight frames; record acceptance status in the manifest | Enter private lounge → join one shared activity → transition into cooperative Dream flight, 20–25 seconds |
| Brain atrophy study | One explanatory publication SVG plus supporting MRI imagery | Keep the explicit masks, tissue regions, ratio, and crop comparison readable as a static sequence | Optional 10–15 second mask → pixel density → score animation only if it teaches the method better than the SVG |
| Four-class MRI study | Four notebook screenshots plus the MRI-grid visual | Sequence data inspection, architecture, prediction review, and ensemble result | Optional 10–15 second notebook progression from scan grid to probability ensemble; no decorative model animation |

**Gate:** every product has at least a three-beat visual story and one accepted poster; clips demonstrate implemented behavior; mobile and reduced-motion review pass; first-load regression is measured; Neerav approves the selected frames before publication.

### Phase 3 — Guide reuse, role fit, and quality evaluation

**Goal:** make the guide direct visitors to the strongest proof and improve multi-turn hiring conversations without losing grounding or navigation reliability.

- Register clip chapters, evidence cards, and visual sequences as page targets. Add fixed follow-up chips such as “See it working,” “How was it measured?”, and “How does it work?” without asking the model to invent them.
- Track which evidence cards appeared in the current conversation so answers vary relevant proof instead of repeating Relay's 103/110 result.
- Add the role-fit card only after the skill taxonomy is stable. Map stated job requirements to two or three projects, show the matched skills and evidence, and name only gaps the visitor actually supplied.
- Extend browser evaluation across desktop and phone for multi-turn references, tours, media, skill footers, and one-page-per-answer behavior. Compare every behavior change against the round-2 transcript baseline; use a model grader only after it reaches the documented human-agreement threshold.

**Gate:** browser scenarios pass, no rubric category regresses, categories 1–5 meet the agreed threshold with no zeroes, media and skill labels match their source projects, and Neerav approves the transcripts and visual sequence.

### Execution order: three rollouts, safest first

The phases and track S below describe what to fix. The three rollouts here set the order: the top-priority fixes, ranked by reward against the risk of breaking what works today. What works means the round-2 answer quality, the voice timing, and the current tours. Each rollout changes only what the one before has made safe to change.

#### Rollout 1: Add to the pages, leave the guide alone

Nothing here touches the guide's prompt, tools, or answers.

| Fix | Source | Reward | Why it's safe |
|---|---|---|---|
| Product clips on each case study and the home showcase: Relay, Refract, Homeward, Birb Hangout, plus animated figures for the two MRI studies | S1 | Highest. Visitors see the products work, which most of the round-1 feedback asks for | Media only. Loads when scrolled near, so first paint is unchanged; pause control and poster under reduced motion |
| Evidence cards on the pages, from `metrics.json` | S2, page part | Numbers arrive with their meaning; the cards are reused in rollout 3 | Replaces existing number lists with the same approved figures |
| Deep Strat public section, and the owner facts from Live test 1 item 9 (PyTorch, Hugging Face, LangChain, ADNI, the internal AI manual) on the public pages | S3, Live test 1 | Fixes the gaps behind questions 3.5 and 4.2 at the source | Copy only, checked against `docs/COPY_REVIEW_STANDARD.md` and the curation audits |
| Tester token on the Worker | Phase 1 | Testing without limits, which rollouts 2 and 3 need | Visitors never see it; spend still counts toward the daily and monthly ceilings |
| Decide the 1 to 5 → 0 to 2 rating mapping | Phase 1 correction | One scale for every later gate | A decision, no code |

**Done when:** every case study opens with its product moving, every metric on the site has a card, and each page's initial transfer has grown by no more than its posters.

#### Rollout 2: Add guide features that don't change the answer text

These are additions to the guide that need no new model calls and no prompt changes. Round 2 stays the quality bar.

| Fix | Source | Reward | Why it's safe |
|---|---|---|---|
| Flag button on each answer | Phase 3 | Turns real failures into test cases, which every later fix depends on | Stores only flagged conversations, and visitors are told so |
| Follow-up chips ("See it working", "How was it measured?", "How does it work?") | S5 | Leads visitors to the visuals and to deeper answers | Fixed per target in the registry; the model doesn't generate them |
| Reviewed two-minute tour behind the "What has Neerav built?" chip, with speech rendered ahead of time | S5 | The most common opening always gets the approved best answer, with no wait | Fixed content Neerav signs off: it plays the rollout 1 clips directly, without the model choosing them; typed and spoken questions still get live answers |
| Media in the panel on mobile | S5 | The clip or card is visible when the panel covers the page | Display only |
| Browser eval for multi-turn conversations and media | Phase 3, S measuring | Catches what happens on the page before rollout 3 changes behavior | Tests only |

**Done when:** the browser eval passes on desktop and phone, a week of flags has been reviewed, and the rubric run shows the same answer text as before.

#### Rollout 3: Change the guide's behavior, one change at a time, gated against round 2

Each change ships alone, and only when `compare.mjs` against round 2 shows no category drop and Neerav has read the transcripts.

| Fix | Source | Reward | Risk and its gate |
|---|---|---|---|
| Clip chapters and evidence cards as guide targets | S1, S2, Phase 3 targets | "Show me Relay working" plays the product | The model may pick a clip where a section fits better; the browser eval checks that each answer shows what it talks about |
| Evidence card rotation: the Worker tells the model which cards it has shown | S2, Phase 2 item 3 | Ends the repeated "103 of 110" | A small prompt note; gated on answers that had numbers still giving one |
| Fit card (`map_role`) for roles and job descriptions | S4, Phase 2 role mapping | Brings role-fit answers (270% and 236% of baseline in round 10) back to normal length | A new tool; the Worker rejects evidence ids outside the registry, and answers must stay within 10% of baseline length |
| Narrated diagrams, highlighted in step with speech | S3 | Clearer "how does it work" answers (category 5) | Reuses the voice-sync sentence timing; gated on the performance probe showing no new long tasks |

**Done when:** each change has passed its gate on its own, and categories 1, 4, 5, and 7 hold at or above the round-2 bar.

#### Not in the rollouts

- **Key terms** stay out until round 10's failing gates pass on their own (`KEY_TERMS_PLAN.md`).
- **The grader model** doesn't gate anything until it agrees with Neerav's ratings (Phase 1 correction).
- **Explorable evaluation pages and a public Relay sandbox** wait on the open questions about which data can be public.

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

**Correction to the scoring harness (revision):** the rubric runner and the comparison gates exist, but the grader model does not, and it should not gate releases until it agrees with Neerav. A model judge that was never checked against human scores is a known eval failure. Before the grader's scores count:
- Use one scale. Neerav has rated on 1 to 5 while the criteria use 0 to 2. Proposed mapping: 5 and 4 → 2, 3 → 1, 2 and below → 0. Neerav confirms or changes it.
- Score the round-1 and round-2 rated answers with the grader and compare. Use it as a gate only when it matches Neerav's mapped score on at least 85% of answers and never rates as 2 an answer he rated 0.
- Until then, the gates are `compare.mjs` (deterministic) plus Neerav's ratings, as they are today.

### Done when

- None of the defects above shows up across the 60 rubric cases.
- The scenario checks and the Playwright suite still pass.
- A baseline score is recorded for all 10 categories. Round 3 is recorded (`eval/feedback/round-3-baseline.json`), and round 2 is the quality bar.
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

  Revision: the profile is drafted and in use. The example strength "application-owned safety and evaluation" was rejected in round 1 as vague ("the application owns identity" says nothing to a hirer). The profile now leads with product vision, interaction design, and breadth, and describes safety by what the user gets. Keep that wording.
- **Depth material:** for each project, pull the "how it works", "why this design", and "what failed and what changed" passages into the knowledge as discussable sections, so follow-ups have something real to draw on. Check that the knowledge stays under its size limit, which keeps cost per question flat. Track S3 gives the "how it works" passages a diagram the guide can step through. The words still come from here.
- **Absorbed by track S:** item 3 (repeated evidence) becomes S2, where evidence cards rotate by design. The role-mapping change becomes the S4 fit card, which keeps the prompt rule below and gives the result a visible form.
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
- **Voice tour pacing:** wait for the scroll to settle before speaking a step, and let a question during a tour end the tour cleanly. Partly shipped: the next stop's speech is generated while the current one plays, so silence at a stop dropped from 3 to 4 s to under 1 s. A question that interrupts a tour is still untested. When a tour stop is a clip chapter (S1), the narration follows the clip's timing instead of the scroll.
- **Navigation targets for visuals:** every clip chapter, evidence card, and diagram step from track S is registered as a target with a label, so "show me Relay working" and "how was that measured" have a precise destination. This is the "anchors for any useful section" item above, extended to media.
- **Boundaries:** decide with Neerav which hiring-adjacent requests are in scope (cover letters, interview questions about him, salary), and add those cases to the eval.
- **Release gate:** before any prompt or knowledge change goes live, it runs:
  - the scenario checks and the Playwright guide suite
  - the 60-case rubric eval, compared against the round-2 bar with `compare.mjs`
  - the browser eval, including the media checks from track S

  A drop in any category blocks the deploy. Once testing ends, put the per-visitor limits back to their normal values.

### Done when

- All 10 categories score at least 80% with no 0s.
- The browser eval passes on desktop and mobile.
- A week of flags from real use has been reviewed and turned into test cases.
- Neerav signs off that the guide represents him the way he expects.

---

## Track S: Show the work

### What doesn't work

1. **The products are described but never seen moving.** "What makes Relay more than a demo?" (2/5) and "the most impressive thing in one minute" (1/5) failed on wording, but a better sentence still asks the visitor to imagine the product. Relay has no public link, so a visitor cannot watch or try it. Birb Hangout, a realtime multiplayer 3D world, is shown as one still image. (Categories 1 and 4)
2. **Numbers reach the visitor as words only.** Round-1 feedback on 2.3 calls metrics without meaning a failure, and the round-10 candidates grew 12% longer at the median because the meaning is carried by extra sentences. Spoken numbers are also hard to hold in mind: "103 of 110" and "39 of 42" in one breath blur together. (Categories 4 and 9)
3. **"How does it work" answers carry the whole structure in speech.** Question 5.1 (voice to confirmed action) was rated "more clarity, less jargon." A seven-step flow told in sentences makes the listener build the diagram in their head. (Category 5)
4. **Role fit goes into speech and tour narration.** In round 10, the role-fit answers 3.4 (a pasted job description) and 3.5 ran to 270% and 236% of the baseline length. A requirement-by-requirement match is a table, not a paragraph. (Category 3)
5. **The guide's only visual move is a highlight.** On a phone, the panel covers the page, so the highlight is often what the visitor can't see. (Category 7)

### Changes

**S1. Product clips.** One 20 to 40 second clip per product, recorded from the real app, each opening on its result:

| Product | What the clip shows | Chapters (guide targets) |
|---|---|---|
| Relay | An employee asks by voice about a VPN problem, Relay answers from their records, prepares a support case, the employee says yes, and Relay confirms the case exists | ask, answer, prepare, confirm, verified |
| Refract | A question about a paper, an answer with its page, a click into the exact passage, then a recall check | ask, answer with source, recall |
| Homeward | Discharge papers become a recovery plan; a task shows its source sentence; the patient approves a dated reminder | upload, plan, source, approve |
| Birb Hangout | Two friends join a room, talk, and fly together in the Dream world | join, talk, fly |
| Brain atrophy study | An animated figure, not a recording: an MRI slice, the hippocampus region, the score computed from it | scan, region, score |
| Four-class MRI study | An animated figure: two networks' probabilities combine into one prediction, with 78 → 85 percent accuracy | models, combine, result |

- On the page: the clip leads each case study, above the methodology, with a one-line problem, what the product does, and the result. The home showcase plays the active product's clip.
- Playback: `<video muted loop playsinline>` that starts when scrolled into view, WebM first and MP4 as fallback, a poster frame, captions, and a visible pause control (required by WCAG 2.2.2 for motion over 5 seconds). Under `prefers-reduced-motion`, show the poster and a play button. Load the video only when near view, so page weight and first paint don't change.
- Relay's clip keeps its real voice audio, muted by default with a sound button.
- In the guide: tour steps and `show_on_page` can target a clip chapter. The page scrolls to the clip, seeks to the chapter, and plays it, and the narration speaks over it. While a clip with its own sound plays, the guide's voice waits for it to end.
- This absorbs critique 1 above and Live test 1 item 5 (unexplained tour steps): a moving product explains its own stop.

**S2. Evidence cards.** Each metric in `content/guide/metrics.json` (the canonical registry from the curation plan) gets a card: the number drawn as what happened, the plain meaning from the profile's "Explaining the work in plain terms", and what was tested.
- Relay 103 of 110: 110 marks, 103 filled. Each of the 7 misses opens to show what went wrong and the fix that followed.
- Relay 21 safety runs: the list of what each attempt tried, all marked safe.
- Homeward 32 of 32: the scenarios grouped by what they protect (approval, privacy, tricked documents, outages).
- MRI 78 → 85 percent, brain atrophy 66 → 71 percent, Deep Strat 25 percent fewer false churn flags: before and after bars with the plain meaning ("seven more correct out of every hundred scans").
- On the page: the cards replace the number lists in each results section.
- In the guide: an answer that cites a metric shows its card in the panel, so the visitor sees it on a phone too. The Worker records which cards the conversation has shown and tells the model, so the next answer picks different evidence. This absorbs Phase 2 item 3 (repeated evidence) and puts the registry's `maxNarrativeOccurrences` into practice.
- Later, as an explorable exhibit: Relay's evaluation as a page where the visitor filters by development or held-out runs and by failure type, and opens a transcript. This depends on which run data Neerav is willing to publish.

**S3. Narrated diagrams.** One SVG flow per product, drawn from the existing "how it works" sections, with each step registered as a guide target:
- Relay: spoken request → understood → answered from the employee's records → change prepared → employee confirms → change made → result checked.
- Refract: question → matching passage found → answer with paper and page → recall check before the reveal.
- Homeward: discharge papers → tasks with their source sentence → each assistant limited to its role's tools → patient approval → reminder.
- Deep Strat: complaint → sentiment and intent → routed with context to the right department → report grounded in the SOP.

When the guide answers "how does it work", it highlights each step as the sentence about it is spoken, reusing the sentence timing built for voice sync. The diagram carries the structure, so the speech can stay plain. This gives Phase 2's depth material a visual form.

Deep Strat is in guide knowledge (`content/guide/deep-strat.md`) but has no public page. Its diagram, the internal AI manual, and the AI-safety advising become a public section, as round-1 feedback on 3.5 asked and Live test 1 item 9 requires.

**S4. Fit card.** When a visitor names a role or pastes a job description, the panel shows a card: each stated requirement, the evidence that meets it (a target the visitor can open), and, only for requirements the visitor stated, the gap paired with its closest evidence.
- A strict tool (`map_role`) returns the rows. The Worker rejects any evidence id that isn't in the registry, as it does for targets.
- The spoken answer stays one or two sentences, and the tour follows the card's order.
- A copy button gives a plain-text version for the hirer's notes, next to the resume and contact links.
- A cover-letter request gets the fit card, which is the on-purpose answer the boundary rule already describes.
- This is the visible form of Phase 2's role-mapping change, and it should bring the role-fit answers back to baseline length.

**S5. Guide interaction.**
- **Follow-up chips** under each answer, chosen from what the shown target has: "See it working" (clip), "How was it measured?" (evidence card), "How does it work?" (diagram), "Compare with …". They are defined in the target registry, so they cost no extra model call. They support categories 5 and 6 and lead visitors to the visuals.
- **A reviewed two-minute tour.** The "What has Neerav built?" chip, the most common opening, plays a fixed tour that Neerav has approved: the overview sentence, one clip chapter per product, and one evidence card. Its speech is rendered ahead of time with the guide's own voice, so it starts without waiting and sounds the same every time. A typed or spoken question still gets a live answer and a live tour.
- **Media in the panel on mobile:** when the panel covers the page, the clip or card for the current answer appears inside the panel.

### Order

Track S ships through the three rollouts under "Execution order" near the top: page clips, page evidence cards, and the Deep Strat section in rollout 1; chips, the reviewed tour, and media in the panel in rollout 2; guide targets for media, card rotation, the fit card, and narrated diagrams in rollout 3. Explorable evaluation pages come after, if run data can be published.

### Measuring it

- **Rubric additions** in `eval/criteria.md`:
  - "Show me Relay working" plays the Relay clip.
  - "How was 103 of 110 measured?" shows the card and explains it.
  - Question 5.1 steps through the Relay diagram in the order spoken.
  - A pasted job description yields a fit card whose evidence ids all exist.
  - "I only have two minutes" starts the reviewed tour.
- **Browser eval:**
  - Each clip plays muted and inline, pauses from its control, and shows its poster under reduced motion.
  - Captions are present.
  - Each media target lands in view and not under the panel on mobile.
  - The initial transfer for a case-study page grows by no more than the poster.
  - The performance probe shows no new long tasks during a tour.
- **Outcome check, by Neerav, on desktop and phone:**
  - Without opening the guide, each case study shows its product working within the first screen.
  - With the guide, the first answer to "What has Neerav built?" shows at least one product working and one evidence card.

### Open questions for Neerav

- Can Relay run as a public read-only sandbox that resets, or only as a recording? The recording comes first either way.
- Is there a public, playable Birb Hangout room to link to, next to the product story?
- Which Relay and Homeward evaluation runs and transcripts can be public?
- Confirm the 1 to 5 → 0 to 2 rating mapping under Phase 1.

### Done when

- Every product case study opens with a clip or an animated figure, and every metric on the site has a card.
- The rubric additions score 2 and the browser eval's media checks pass on desktop and mobile.
- Categories 1, 4, and 5 hold at or above the round-2 bar while the answers' median length returns to within 10% of the baseline.

---

## Sources

Opened 2026-10-14. Most portfolio advice online is written for designers. These sources informed track S's principles; the plan doesn't rely on any single figure from them.

- [Only 30 seconds to reject your portfolio](https://adplist.substack.com/p/only-30-seconds-to-reject-your-portfolio) (ADPList): one hiring manager's account of a roughly 30-second first look; the title and opening hook decide it.
- [What is a hiring manager looking for in a design portfolio](https://adplist.org/blog/what-is-a-hiring-manager-looking-for-in-a-design-portfolio) (ADPList): a portfolio should be reviewable in about 5 minutes; 20-minute case studies work against the candidate.
- [Build an AI evals portfolio](https://aitechconnect.in/tips/ai-evals-portfolio-proof-of-work-2026): the demo is table stakes, "How do you know it works?" is the separating question, and an LLM judge needs checking against human scores.
- [Explorable Explanations](https://worrydream.com/ExplorableExplanations/) (Bret Victor): reactive documents and explorable examples that let readers test the author's claims themselves.
- [Replace animated GIFs with video](https://web.dev/articles/replace-gifs-with-videos) (web.dev): `autoplay loop muted playsinline` video in WebM and MP4; a 3.7 MB GIF became a 551 KB MP4.
- [Understanding WCAG 2.2.2: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) (W3C): moving content that plays for more than 5 seconds needs a way to pause it.
