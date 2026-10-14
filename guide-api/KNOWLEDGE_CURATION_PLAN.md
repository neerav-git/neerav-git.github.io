# Portfolio guide knowledge curation plan

This is the content and knowledge-architecture companion to [`IMPROVEMENT_PLAN.md`](./IMPROVEMENT_PLAN.md). The improvement plan defines how the guide should speak, reason, navigate, and pass evaluation. This document defines what the guide should know, what must stay out of its default context, and how the underlying portfolio records remain detailed without allowing internal review material to weaken spoken answers.

The shared quality bar is [`eval/criteria.md`](./eval/criteria.md). This plan adds source-level and generated-knowledge gates that must pass before the conversational criteria are meaningful.

## Decision summary

The guide should be an informed advocate for Neerav's work. It should have enough depth to explain the product journey, architecture, tools, methodology, iteration, results, and impact of every project, but it should not treat repository forensics, authorship debates, failed research setup, or unfinished-work inventories as ordinary portfolio facts.

The approved editorial direction is:

- Lead with achievements, methodology, differentiation, rigor, and impact.
- Preserve concrete technical and product detail; do not compress projects into marketing slogans.
- Explain iterative improvement through the problem found, the design or engineering response, and the measured result.
- State a scope boundary only when it changes the conclusion or the visitor asks about it.
- Keep evidence records available for audit without injecting their internal scaffolding into every guide turn.
- Present Homeward as Neerav's work. Do not introduce collaborator names, team-role breakdowns, commit-based authorship arguments, or qualifiers such as "primary," "predominantly," or "core contributor."
- Preserve the IEEE paper's public co-authorship because it is part of the publication record, while making Neerav's individual pipeline contribution direct and specific.

This plan does not authorize inflated claims. Synthetic data remains synthetic, a retrospective imaging study remains research rather than clinical deployment, and measured results retain their denominators and evaluation context. The change is one of emphasis and information architecture: accurate limits should support a strong claim, not become the headline or closing sentence.

## Relationship to the existing improvement plan

| Existing phase | How this plan contributes |
| --- | --- |
| Phase 1: visible defects and baseline | Establishes the current knowledge baseline, removes caveat-heavy and internal material from default context, and adds deterministic knowledge audits. |
| Phase 2: strengths and presentation | Supplies the approved strengths profile, curated project records, direct authorship statements, role mappings, and deeper methodology material. |
| Phase 3: conversation, navigation, and release | Adds transcript tests for knowledge selection, verifies that navigation metadata is not spoken, and makes knowledge/PDF consistency part of the release gate. |

The two plans should be executed together. Prompt changes cannot compensate for a noisy source corpus, and better source material cannot compensate for a guide that repeats itself or mishandles tools.

## Current-state findings

The generated `public/guide/knowledge.json` currently contains:

- 217,973 characters of prose across 1,419 lines, approximately 73,000 tokens using the build script's conservative estimate;
- the visible project pages;
- the full extracted resume PDF;
- writing and archive pages;
- six additional excerpts selected from `docs/work-records/`;
- a target registry and link registry used for page actions.

The six work-record excerpts add 38,731 characters. They are selected by this heading expression in `scripts/build-guide-knowledge.ts`:

```text
role|attribution|claim ledger|bounded scope|scope and evidence|record status|results|lineage
```

That expression disproportionately selects material written for evidence review rather than spoken portfolio explanation. It imports sections titled "Team attribution," "Claim ledger," "Record status," and "Evidence basis" while omitting much of the fuller product journey and design reasoning.

The corpus also repeats important results across the home page, project page, resume, writing, archive, and work-record excerpt. In the inspected build:

- Relay's 103/110 result appears four times.
- Relay's 39/42 held-out result appears four times.
- Homeward's 32/32 guardrail result appears four times.
- The MRI classification improvement from 78% to 85% appears seven times.
- The brain-atrophy crop comparison from 66% to 71% appears five times.

This is semantic duplication even where the surrounding sentences differ. It increases prompt cost, biases retrieval toward a small set of repeated facts, and makes answers more likely to sound repetitive.

### High-risk material currently available to the guide

The current knowledge includes examples such as:

- "From the source work record ... not shown on the site."
- current branch names, commit hashes, inspection dates, and untracked-directory notes;
- statements that no paid service was launched during a research pass;
- detailed Git-identity and merge-commit authorship analysis;
- AI coding-tool identities described as repository contributors;
- Homeward collaborator names and a four-person attribution narrative;
- Homeward's invalidated provider key, HTTP 401, and nine scenarios that were not run;
- tests or model training that were intentionally not rerun during documentation;
- incomplete experiment variants and future-work inventories;
- raw headings such as "Measured results," "Directly verified capabilities," and "Interpretation";
- target IDs, link IDs, page routes, and instructions about which target the guide should cite.

Some of those facts belong in an audit trail. They do not belong in the guide's default answer material.

## Content model: four distinct layers

The central implementation change is to stop treating every evidence document as conversational knowledge.

### Layer 1: public portfolio narrative

Purpose: tell the complete project story on the website.

Contains:

- the human problem and affected users;
- the implemented journey;
- architecture and important decisions;
- tools and technologies;
- evaluation methodology;
- strongest results;
- iteration and improvement;
- impact;
- one concise scope statement where needed.

Primary sources:

- `content/projects/*.json`
- `content/writing/*.json`
- `content/archive/*.json`
- `content/settings/*.json`

This material remains rich and readable. It is not reduced merely to make the voice prompt smaller.

### Layer 2: curated guide knowledge

Purpose: give the voice agent high-signal material it can select and explain in one to three spoken sentences, with enough depth for technical follow-ups.

Proposed sources:

- `content/guide/profile.md` for strengths, experience framing, target-role mappings, and cross-project comparisons;
- `content/guide/resume.md` for a curated experience timeline and approved accomplishments instead of the entire extracted PDF;
- `content/guide/projects/<slug>.md` for one canonical voice record per project or study;
- the existing target/link registries, supplied as action metadata rather than mixed into narrative prose.

Each project guide record should use the same sections:

1. Outcome
2. Neerav's contribution
3. User journey
4. Architecture and tools
5. Methodology
6. Results
7. What changed through iteration
8. Impact
9. Scope, only where materially necessary
10. Approved page targets and links

Recommended depth:

- 900 to 1,500 words for each major product system;
- 700 to 1,200 words for each research study;
- enough detail to answer "how," "why," "what changed," and "who benefits" without consulting the audit archive.

The objective is not the smallest possible prompt. It is the highest ratio of useful project evidence to internal process text. A practical target is no more than 140,000 narrative characters, approximately 45,000 to 50,000 conservative tokens, before tool schemas and conversation history.

### Layer 3: evidence and provenance archive

Purpose: preserve the detailed research record, auditability, and source trail.

Contains:

- `docs/work-records/*.md`;
- `docs/CONTENT_SOURCE_LEDGER.md`;
- the combined portfolio work-record PDF;
- commit hashes, file maps, repository inspection notes, and evidence classifications;
- detailed limitations, incomplete checks, and research setup notes that remain useful to maintainers.

This layer remains available to humans and maintainers. It is not automatically appended to the guide prompt. Any fact promoted from this layer into guide knowledge must be deliberately rewritten for an external audience and approved.

### Layer 4: navigation and tool metadata

Purpose: let the guide move the page and offer links.

Contains:

- target IDs;
- routes and anchors;
- link IDs and URLs;
- tool constraints.

This layer should be machine-readable and separate from narrative knowledge. The model may receive the IDs it needs for tool calls, but they must not appear inside project prose or be read aloud.

## Removal and rewrite matrix

| Content type | Default disposition | What replaces it |
| --- | --- | --- |
| Branches, commit hashes, inspection dates, dirty/untracked state | Remove from guide knowledge | Version-neutral description of the implemented capability and recorded evaluation |
| "Not shown on the site" and citation-routing instructions | Remove | Tool metadata kept outside narrative prose |
| Commit counts and Git-identity authorship analysis | Remove | Direct approved contribution statement |
| Named AI coding tools as contributors | Remove unless explicitly asked about development process | Tools may be described as development assistance, never as project authorship |
| Collaborator rosters and team-role divisions for Homeward | Remove everywhere in the portfolio and guide | Direct end-to-end Neerav ownership statement |
| Failed credentials, HTTP 401 details, and scenarios not run | Remove from default knowledge | Positive failure-containment result if relevant: provider rejection caused zero unauthorized state changes |
| Tests intentionally not rerun during documentation | Remove | Retained outputs and implemented methodology described directly |
| Raw claim-ledger headings | Rewrite | Natural sections for evidence, method, result, and impact |
| Repeated scope disclaimers | Deduplicate | One concise project scope statement, used only when relevant |
| Future-work and incompleteness inventories | Exclude from ordinary answers | Optional "next direction" material only when a visitor asks |
| Entire resume PDF extraction | Replace | Curated experience timeline and approved resume highlights |
| Repeated metrics across sources | Canonicalize | One project evidence entry with denominator, context, and approved spoken form |
| Public paper co-authorship | Keep accurately | Emphasize Neerav's individual research and pipeline contribution without erasing the publication record |
| Synthetic or fictional evaluation context | Keep once | Positive scope wording after the result, never as the default opening or closing line |

## Homeward attribution and narrative correction

Homeward requires an explicit cross-source correction before the guide is regenerated.

### Approved ownership framing

Use a direct statement in this form:

> Neerav conceived and built Homeward end to end: the product direction, patient journey, interface, backend, persistence, synthetic patient data and Synthea integration, source-grounded specialist architecture, deterministic workflow controls, evaluation, and technical documentation. He is continuing its development toward launch.

The exact final wording may be adjusted for rhythm, but it must not introduce "primary," "predominantly," "led," "core," or a comparison with other contributors.

### Material to remove

- The public Collaboration section and its contributor list.
- "Coordinated the team and divided the work."
- The `docs/work-records/homeward.md` Team attribution section.
- Four-person attribution language in `docs/work-records/README.md`.
- Four-person attribution language in `docs/CONTENT_SOURCE_LEDGER.md`.
- Any generated PDF section or table that repeats team attribution.
- The current evaluation question that presupposes "it was a team project."
- Any guide prompt or profile statement that reintroduces Homeward as team-owned work.

### Material to preserve and strengthen

- The patient and caregiver problem.
- The source-linked task and clarification workflow.
- The React interface, Express API, SQLite persistence, and Synthea data strategy.
- The four role-scoped specialist architecture and MCP contracts.
- Application-owned approval, revision, reference validation, idempotency, and audit history.
- Deterministic guidance and provider-independent fallback behavior.
- The 59 backend/contract tests, four React journeys, production build, and 32/32 guardrail cases.
- The product rationale: probabilistic components help find and organize evidence while deterministic services retain authority over consequential state.
- The plan to continue developing and launch Homeward, clearly described as direction rather than a completed public launch.

### Homeward voice tests

The curated guide must answer these without team qualifiers or contributor detours:

- What did Neerav build in Homeward?
- How much of Homeward did he build?
- What was his role in the product design and backend?
- How does Homeward use Synthea data?
- Why did he separate agent assistance from application authority?
- What makes the evaluation rigorous?
- Is Homeward launched?
- What is he planning to do next with it?

The first six answers should lead with completed work. The last two should distinguish continued development and planned launch from current deployment without turning the answer into an incompleteness narrative.

## Project-level curation requirements

Every curated project record must answer the following questions from one canonical source.

### Outcome

- What can a person accomplish that was difficult before?
- What is the visible result?
- Why does the project matter?

### Contribution

- What did Neerav design?
- What did he implement?
- What system boundaries or methodology did he define?
- What evidence did he create?

Avoid "helped," "contributed," "primary," and "worked on" when the approved record supports a direct verb such as designed, built, implemented, evaluated, authored, or published.

### Methodology and tools

- Name the architecture and technical stack.
- Explain the significant design choice, not merely the library list.
- Connect each tool to the function it enabled.
- Preserve versioned scenarios, denominators, held-out sets, failure categories, and human review where they demonstrate rigor.

### Iterative improvement

Keep iteration in the pattern:

```text
Observed problem -> engineering or product response -> verification result
```

Example:

> Early navigation and confirmation failures led to typed semantic targets, server-owned approval, idempotent execution, and replay-based release checks.

Do not preserve iteration as a list of unresolved defects, abandoned branches, or missing tests.

### Impact

- Identify who benefits.
- Name the coordination, interpretation, manual work, risk, or fragmentation reduced.
- Avoid broad claims such as "improves workflows" unless the exact improvement follows immediately.

### Scope

- Use no more than one default scope statement per project.
- Put it after the positive result.
- Do not end an answer on it.
- Do not mention it when it is irrelevant to the visitor's question.
- Keep medical and deployment boundaries available for direct questions.

## Resume curation

`resumeText()` currently places the entire PDF extraction into guide knowledge. Replace it with an approved, structured summary.

The curated resume source should include:

- a compact experience timeline;
- education and publication facts;
- Deep Strat responsibilities and the 25 percent false-positive reduction;
- selected project results that match the canonical project records;
- the technical and product skill groups relevant to hiring questions;
- links to the full resume through the existing link tool.

It should not independently restate every project narrative. Claims that appear both in the resume and a project record must use the same wording, denominator, and evidence classification. In particular, review claims about live Slack behavior, percentage time reduction, dataset counts, production integrations, and deployment so the guide does not receive competing versions.

## Knowledge builder changes

### Remove automatic work-record extraction

Delete the `WORK_RECORD_SECTIONS` regex and `workRecordExcerpt()` path from `scripts/build-guide-knowledge.ts`. Do not replace it with a broader regex.

### Add curated sources

The builder should load the approved profile, resume summary, and six project guide records. It should fail clearly when a project is missing its curated record.

### Separate action metadata

Keep `targets` and `links` as structured JSON fields. Do not append a prose "Target registry" or "Link registry" to the narrative `knowledge` string unless the model demonstrably requires it. If IDs must be included in model context, supply them in a compact action-specific block distinct from portfolio prose.

### Canonical metric registry

Maintain a small generated or authored registry for repeated results:

- metric ID;
- approved spoken form;
- numerator and denominator;
- project and evaluation context;
- source record;
- target section.

The knowledge build should reference each metric once per canonical project record. Cross-project profile material may refer to the result without restating the entire evaluation context.

### Generated-output contract

`public/guide/knowledge.json` and `public/guide/targets.json` remain generated files. The build should print:

- narrative characters and estimated tokens;
- per-source character contribution;
- project-record presence;
- repeated metric counts;
- prohibited meta-pattern count;
- knowledge version.

## Deterministic content audits

Add `scripts/audit-guide-knowledge.mjs` and run it as part of `guide:knowledge` or the production build.

### Zero-tolerance patterns in narrative knowledge

- `not shown on the site`
- `From the source work record`
- `current branch`
- `untracked`
- `dirty worktree`
- `merge commit`
- `repository owner should not be mistaken`
- `Claim ledger`
- `Record status`
- `OpenAI Codex` or `Claude Code` as an author/contributor description
- Homeward collaborator names or handles
- Homeward described as a four-person or team-attributed project

Some terms such as `commit` and `failure` have legitimate methodological uses, so they require context-aware checks rather than a universal ban.

### Duplication checks

- Detect exact duplicate paragraphs after target markers and whitespace are normalized.
- Count registered metric IDs and fail when a metric is repeated outside its approved profile reference.
- Report near-duplicate headings and repeated long sentences for editorial review.
- Keep one canonical contribution statement per project.

### Completeness checks

Every project guide record must contain:

- outcome;
- contribution;
- user journey;
- architecture/tools;
- methodology;
- result/evidence;
- iteration;
- impact;
- approved target IDs.

A project may omit a scope section only when no material scope distinction is needed.

## Conversational and evaluator changes

### Update the guide rules

The prompt should instruct the guide to:

- answer as an informed advocate;
- begin with the strongest directly relevant achievement;
- prefer the canonical project record over resume or archive repetition;
- use scope notes only when asked or materially necessary;
- follow a scope note with what the work demonstrates;
- never end on a caveat;
- describe iteration as improvement, not as an inventory of unfinished work;
- avoid authorship qualifications unless the publication record requires them;
- use direct verbs for Neerav's contribution.

### Expand the evaluation set

In addition to the existing 50 questions, add adversarial knowledge-selection questions:

- What is unfinished in this portfolio?
- Which projects are only demos?
- Did any evaluations fail?
- Was Homeward built by a team?
- Did AI tools build these projects for him?
- What did Neerav personally do versus the model?
- Are the medical-imaging results clinically validated?
- Is Relay connected to a production HR system?

A passing answer is accurate and direct, answers the question, and returns to the strongest relevant evidence. It must not evade a necessary boundary, but it must not volunteer internal research-process details that do not affect the conclusion.

### Required Homeward criteria revision

Replace the current criterion question:

> How much of Homeward did he actually build, since it was a team project?

with two tests:

> What did Neerav build in Homeward?

> Is Homeward already launched, and what remains before launch?

The first tests direct ownership. The second tests honest present-versus-future framing without contaminating the ownership answer.

## Combined PDF and evidence-record alignment

The long-form portfolio PDF should remain detailed, but its audience-facing narrative must follow the same attribution and emphasis rules.

Before regeneration:

- update the Homeward work record and index;
- remove contributor and merge-authorship analysis;
- replace caveat-heavy review-process passages with direct methodology and evidence language;
- retain results, architecture, product rationale, tools, user impact, and iterative improvement;
- inspect all six records for agent-process notes and internal review commentary that do not help an external reader understand the work.

After regeneration:

- confirm the PDF page count and bookmarks;
- search extracted text for prohibited Homeward names and meta phrases;
- render every page;
- visually inspect section starts, page breaks, tables, headers, footers, and links;
- verify that the PDF and site use the same canonical results and contribution statements.

The PDF is an evidence-rich portfolio document, not a raw dump of the guide prompt. It can be longer than the voice knowledge while following the same external-facing editorial standard.

## Execution phases

### K0: Freeze the baseline

Record:

- current Git revision;
- knowledge version;
- character/token estimate;
- per-source size;
- repeated metric counts;
- current 50-question evaluation results;
- representative transcripts showing caveat-first, contributor-heavy, and repetitive answers.

No editorial change should be assessed without this baseline.

### K1: Correct ownership and source-of-truth conflicts

Update Homeward attribution across the project page, work record, record index, source ledger, PDF source, profile, and evaluation criteria. Reconcile resume claims with project records. Stop and obtain Neerav's approval of the Homeward contribution paragraph and curated resume summary before proceeding.

### K2: Create curated guide sources

Create the profile, resume summary, and project guide records. Preserve rich methodology and implementation detail. Review one project at a time using the project-level requirements above.

Suggested order:

1. Homeward
2. Relay
3. Refract
4. Birb Hangout
5. Four-class Alzheimer MRI classification
6. Brain atrophy paper

### K3: Refactor the builder

Remove regex-selected work-record excerpts and full resume extraction. Load the curated sources, separate narrative from action metadata, emit source-size diagnostics, and add deterministic content audits.

### K4: Tune guide behavior

Apply the Phase 1 and Phase 2 prompt changes from `IMPROVEMENT_PLAN.md`. Make the guide use the canonical records, vary evidence across answers, explain design decisions on follow-up, and keep page actions concise.

### K5: Evaluate content quality

Run:

- deterministic knowledge audits;
- the existing 13 mechanics tests;
- the 50-question rubric evaluation;
- the added knowledge-selection questions;
- multi-turn project comparisons;
- voice-on transcripts for Homeward, Relay, Refract, Birb Hangout, and both medical-imaging studies;
- desktop and mobile navigation checks.

Review failures by category. Fix the canonical source first when the fact or framing is wrong; fix the prompt only when the source is correct and selection or presentation is wrong.

### K6: Regenerate artifacts and release

- regenerate `public/guide/knowledge.json` and `targets.json`;
- regenerate and visually verify the combined PDF;
- run copy audit, type checking, unit tests, guide tests, production build, and static-route validation;
- inspect the staged release set;
- publish to `main` only after owner approval;
- verify the GitHub Pages action and public pages;
- verify the deployed knowledge version;
- wait through the guide API's cache interval and run live questions against the public guide.

## Acceptance gates

### Content gate

- Homeward names only Neerav as the portfolio contributor.
- No "primary," "predominantly," or comparative authorship wording appears.
- Each project retains a detailed outcome, journey, method, tool, result, iteration, and impact account.
- The IEEE co-author remains correctly credited.
- Scope is accurate, concise, and not the default conclusion.

### Knowledge gate

- No automatic work-record excerpts remain.
- No full resume extraction remains.
- No prohibited meta patterns remain in narrative knowledge.
- Registered metrics meet their duplication limits.
- The narrative corpus stays within the approved size budget.
- Target and link metadata remain operational but are not spoken.

### Conversation gate

- Every category in `eval/criteria.md` scores at least 80 percent with no zero.
- Homeward answers are direct, ownership-focused, and technically rich.
- Limitations appear only when relevant and are followed by positive evidence.
- "How" and "why" follow-ups produce architecture and methodology, not summary repetition.
- Role-fit answers draw from multiple projects and vary evidence appropriately.

### Artifact and release gate

- Site and PDF contribution statements match.
- PDF text and visual QA pass.
- Production build and guide tests pass.
- Desktop/mobile page actions match spoken answers.
- Owner approves representative transcripts before deployment.
- Public site, knowledge version, and live guide are verified after deployment.

## Rollback and maintenance

- Keep the last deployed `knowledge.json` version and release commit identifiable.
- If live answers regress, revert the guide knowledge and prompt together; do not preserve a mismatched prompt/source pair.
- Add every material flagged conversation as an evaluation case before fixing it.
- Review the canonical project record whenever a project gains a feature, result, deployment, publication, or changed scope.
- Regenerate the PDF and guide knowledge from the same approved facts during each portfolio release.
- Re-run attribution and meta-pattern audits whenever a work record is rebuilt by an agent.

## Deliverables

1. Approved `content/guide/profile.md`.
2. Approved `content/guide/resume.md`.
3. Six curated project guide records.
4. Corrected Homeward public page, work record, source ledger, PDF, and evaluation questions.
5. Refactored knowledge builder without regex-selected evidence excerpts or full resume extraction.
6. Deterministic guide-knowledge audit.
7. Updated prompt and evaluation cases.
8. Regenerated, verified knowledge JSON and combined PDF.
9. Baseline-versus-final score report and representative transcripts.
10. Verified public deployment after explicit owner approval.
