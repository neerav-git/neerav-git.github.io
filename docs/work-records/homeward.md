# Homeward — source-grounded hospital discharge assistance

## Product outcome and Neerav's contribution

Homeward is a patient-facing discharge follow-through system that turns a hospital record into a persistent, source-linked recovery plan. It helps a patient identify the next recorded step, keeps missing or conflicting information visible, lets a local care-team operator review uncertain instructions, and makes reminder creation an explicit, auditable, safely retryable action.

Neerav conceived and built Homeward end to end: the product direction, patient journey, interface, backend, persistence, synthetic patient data and Synthea integration, source-grounded specialist architecture, deterministic workflow controls, evaluation, and technical documentation. He is continuing its development toward launch.

The core problem is the handoff between receiving discharge paperwork and acting on it at home. A patient may need to arrange follow-up, bring documents, complete a check-in, clarify a laboratory instruction, and remember dates, while also distinguishing the hospital’s actual directions from historical records or general educational material. That is an information-coordination problem with real consequences: unsupported certainty is dangerous, but a product that only warns and refuses is not useful. Homeward’s answer is to make the record operational without silently upgrading unreviewed text into clinical truth.

The implemented experience supports three hand-authored fictional patients plus one patient derived from an official Synthea sample. In the primary Alex Morgan scenario, the plan exposes four concrete tasks: arrange a follow-up visit, gather paperwork, complete a dated recovery check-in, and clarify a laboratory instruction whose test and date are absent. The application does not fill those gaps. It carries the clarification state through the patient workspace, source search, summary, help flow, care-team view, and reminder eligibility rules. This is a strong product decision: uncertainty is modeled as durable state rather than softened into vague prose.

## The end-to-end workflow

A patient begins in **My recovery**, where Homeward presents a deterministic next step derived from the current plan. The selector considers only pending, unpaused tasks with valid source references and valid recorded dates. It orders eligible items by recorded date and explicitly describes that order as scheduling, not medical urgency. Completed, rejected, unreviewed, help-paused, and clarification items remain visible in their own states rather than contaminating the recommendation. The dashboard and the question “What is my next step?” consume the same guidance object, so the card and conversation cannot drift into two competing interpretations of the plan.

Every task retains an exact source reference: document ID, section ID, and quote. The patient can inspect the underlying passage instead of trusting a generated summary. Date provenance is also represented. A date may come from a reviewed source, a human clarification, or a legacy plan entry, and Homeward labels that distinction. Relative phrases are not converted into dates unless the workflow has acceptable evidence. An unknown deadline remains `null`, which prevents an apparently convenient reminder from laundering ambiguity into a scheduled action.

The **Ask Homeward** workspace offers source search and a TrueForge-backed agent path. Recognized plan-navigation questions always remain deterministic, even if the user selected live mode. Source search retrieves exact passages lexically from the patient’s own small corpus without requiring embeddings or a vector database. A saved-record summary groups ready tasks, items needing attention, reported completion, history, imported passages, and historical context. This gives the patient a usable explanation even when no model is configured.

When live execution is available, a deterministic router sends one request to one of four specialists: a care-plan coordinator, discharge summarizer, questions-and-sources specialist, or reminder assistant. These are not cosmetic labels over a universal agent. Each role has its own native AgentSpec and patient-and-role-scoped MCP endpoint, and the server enforces a different tool inventory. The summarizer can read summaries and search sources but cannot propose or execute reminders. The reminders role can inspect the plan, propose a reminder, and execute only an already approved reminder. No role receives instruction approval, help resolution, medication modification, appointment booking, outbound messaging, or emergency-dispatch tools.

The model is deliberately denied authority over clinical wording. Its structured output selects source, task, and action identifiers and, optionally, one allow-listed education topic. The backend verifies those references against the current patient snapshot and reconstructs the answer from stored records. Foreign, fabricated, malformed, or stale references are rejected. If the plan changes while a model turn is running, or if the output cannot be verified, the app returns a labeled saved-record fallback. This transforms the language model from an unbounded answer generator into a constrained reference selector inside a deterministic product workflow.

Unclear information has a separate human path. A patient can request help on a task, which persists in SQLite and appears in the local care-team workspace. An open help request pauses completion, reminder proposals, and execution of a previously approved reminder. The operator can respond or resolve the conversation, but doing so does not approve the instruction or invent a deadline. Review decisions preserve the original citation and create immutable audit history containing the prior and resulting task snapshots, source references, request ID, and locally assigned actor category. Optimistic revisions prevent one reviewer from overwriting a newer decision made in another session.

Document import follows the same discipline. Homeward accepts pasted text, TXT/Markdown, and text-based PDFs, splits the content into searchable passages, and keeps them unreviewed. A user or agent may propose an exact imported passage for review; the system does not infer a deadline or make it actionable. Review can confirm, clarify, or reject it. Historical Synthea content is explicitly segregated from discharge orders, with provenance down to source file, row, fields, and hash. This lets the product demonstrate realistic longitudinal context without pretending that a medication history establishes a current discharge regimen.

The reminder workflow shows the same attention to authority and failure recovery. A known, dated task can produce a proposal. A separate Homeward UI/API step approves or declines it; there is intentionally no approval MCP tool. Execution creates a local `.ics` calendar file—not a booked appointment, sent text, or background notification. The demo can simulate a response being lost after the reminder was stored. Retrying returns the original receipt instead of creating a duplicate. Action fingerprints bind reminders to a task revision, instruction, source, and date, so later care-plan changes invalidate stale approvals even if a superficial status happens to look unchanged.

The persistent US-demo emergency control is also independent of agent readiness: it is a native `tel:911` link initiated by the user’s device, not a claim that an AI dispatched help. General education is similarly separated from patient-specific direction. The server performs fixed-topic MedlinePlus lookups, restricts returned links to the MedlinePlus domain, caches successful results for twelve hours, falls back to curated links, and sends no patient identifiers. Education can inform a conversation, but it cannot modify the care plan.

## Architecture and methodology

Homeward is a React 19 interface backed by an Express 5 API and SQLite persistence. The store contains patients, documents, tasks, actions, audit events, idempotency receipts, and operational traces. TrueForge provides the optional session/turn runtime and calls patient-bound MCP tools. This separation is the architectural thesis: probabilistic components retrieve, select, and explain, while deterministic services own task state, approval, eligibility, dates, receipts, and recovery from failure.

The implementation method was contract-first and evidence-led. Neerav defined explicit contracts for discharge review, next-step selection, source trust, role capabilities, and live evaluation. Shared scenario functions are reused by domain tests and the evaluation runner, reducing the chance that presentation evidence exercises a different behavior from the product tests. Critical transitions are tested at multiple layers: store-level invariants, HTTP behavior, real MCP client exchanges, mocked TrueForge sessions, and React DOM journeys. The UI tests exercise patient switching, help handoff, instruction review, source display, summary refresh, approval, response loss, retry, and emergency-link availability. A separate real-browser journey used a production build, real Express API, isolated SQLite store, and source-search mode.

The evaluation design names expected answers, required sources, allowed and prohibited tools, expected state changes, and failure categories. It covers missing laboratory details, conflicting uploaded records, cross-patient requests, Synthea dosage overreach, attempted approval bypass, prompt injection embedded in a document, repeated reminder proposals, open help requests, tool failure, and runtime outage. Automated checks verify controls and state while human review remains responsible for answer quality.

Recorded integrated verification passed **59 backend and contract tests, four React DOM journeys, a production build, and 32 of 32 deterministic guardrail cases**. Real MCP SDK tests verified the summary tool and role-specific published inventories, including rejection of a reminder call through the summarizer endpoint. Mocked TrueForge tests covered model selection, role-specific specifications, structured output, existing-registration preservation, provider failure, invalid or foreign references, and a care plan changing during a run.

Provider-independent behavior is part of the product rather than an afterthought. If model execution is unavailable or rejected, Homeward makes no unauthorized tool calls or state changes, while deterministic next-step guidance, lexical source search, saved-record summaries, citations, and care-team workflows remain available. This fail-closed behavior keeps the useful parts of the recovery workflow operating without turning provider availability into authority over patient state.

## Why the work is notable

Homeward’s most impressive quality is the consistency of its safety model across interface, storage, tools, and evaluation. Many prototypes append citations to generated prose. Homeward instead makes source identity, review status, date provenance, plan version, and action authority part of the domain model. The distinction matters: a citation-shaped string is not accepted merely because a model emitted it; the backend must resolve it to the bound patient’s current record.

The product combines provider-independent utility with bounded model assistance. Deterministic source search and summaries remain available at all times; a model can improve routing and selection when available. Human review governs operations that change the plan, while safe, read-only guidance remains responsive. Idempotent receipts make the visible failure demo a real reliability feature: the system demonstrates what happens when the network response is uncertain after a write, one of the operational edge cases that ordinary demos omit.

For patients and caregivers, the improvement is reduced fragmentation. The record, the next step, its source, open questions, and local reminder state live in one workflow. For a care-team operator, Homeward turns vague “I need help” signals into patient-scoped, source-linked queue items while preserving what was and was not resolved. For product and engineering teams, the capability matrix and evidence artifacts make it possible to discuss exactly which component authorized an action, which checks passed, and whether a result came from local records, a model, or a fallback. For healthcare organizations, the prototype offers a credible pattern for future integration: keep deterministic workflow authority around model assistance, preserve provenance, and measure live behavior separately from backend controls.

The evaluated environment uses fictional discharge material and synthetic Synthea history. Homeward continues development toward public launch; clinical outcomes and authenticated healthcare deployment require separate validation. Within that scope, the completed product is a detailed reference implementation for post-discharge coordination with source provenance, human approval, deterministic authority, and failure recovery built into the workflow.

## Results and verified capabilities

### Recorded results

- The integrated verification passed 59 backend and contract tests, four React DOM journeys, a production build, and 32/32 deterministic guardrail cases.
- The guardrail matrix covers missing details, conflicting records, cross-patient requests, dosage overreach, attempted approval bypass, prompt injection, repeated proposals, help pauses, tool failure, and runtime outage.
- Provider rejection produced zero unauthorized tool calls or patient-state changes, demonstrating fail-closed behavior while deterministic record functions remained available.

### Implemented capabilities

- Source-linked recovery tasks, persistent completion/help state, deterministic next-step selection, accessible saved-record summaries, lexical source search, imported-document review, care-team review history, approval-controlled `.ics` creation, stale-action invalidation, and response-loss deduplication are implemented.
- Four specialist roles use patient-and-role-scoped MCP inventories. Server enforcement rejects tools outside a role’s inventory, and no agent has an approval tool.
- Structured model references are validated against patient scope and current plan version; rejected output falls back to current records.
- Synthea historical records, imported passages, authored discharge instructions, human clarifications, and general education remain distinct in the data and UI.
- Runtime limits include one active run per patient, eight calls per minute, an eight-iteration AgentSpec limit, and a 90-second cancellation path.

### What the results demonstrate

- Homeward demonstrates a credible way to reduce the cognitive and coordination burden of turning discharge paperwork into follow-through while keeping uncertainty actionable and visible.
- Its main technical contribution is an authority architecture: AI helps locate and organize evidence, while deterministic, auditable services retain control over instructions, dates, approvals, and side effects.
- The product is strong evidence of product design, full-stack engineering, agent-tool contracts, reliability controls, and evaluation craft.

## Source map

- Product overview and implemented capabilities: `README.md`; architecture and runtime scripts in `package.json` and `.github/workflows/ci.yml`.
- Core patient/care-team UI: `src/App.jsx`, `src/PatientSummary.jsx`, `src/ReviewWorkspace.jsx`, `src/styles.css`.
- API and domain authority: `server/app.js`, `server/store.js`, `server/guidance.js`, `server/summary.js`, `server/agent-responses.js`.
- Agent routing and TrueForge/MCP integration: `server/agents.js`, `server/trueforge.js`, `server/mcp.js`, `scripts/setup-trueforge.js`, `scripts/smoke-trueforge.js`.
- Synthetic data, Synthea provenance, and education: `server/fixtures.js`, `data/synthea-sample.json`, `scripts/ingest-synthea.py`, `server/education.js`.
- Design contracts: `docs/DISCHARGE-REVIEW-API.md`, `docs/NEXT-STEP-GUIDANCE.md`, `docs/AGENT-TEAM.md`, `docs/DATASET-AND-AGENT-INTEGRATION-GUIDE.md`, `docs/CARE-TEAM-UI.md`.
- Test and evaluation methodology: `tests/`, `scripts/evaluate*.js`, `scripts/evaluations/`, `docs/LIVE-EVALUATIONS.md`, and `docs/VALIDATION.md`.
- Recorded evidence: `docs/evidence/deterministic.json`, `docs/evidence/integrated-main/`, and `docs/assets/journey/`.
