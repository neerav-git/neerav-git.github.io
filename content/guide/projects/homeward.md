---
slug: homeward
approvedTargets:
  - project.homeward
  - project.homeward.methodology
  - project.homeward.3-the-workflow-carries
  - project.homeward.4-four-roles-receive
  - project.homeward.5-the-model-selects
  - project.homeward.6-imported-records-become
  - project.homeward.7-the-reminder-workflow
  - project.homeward.9-the-integrated-evidence
  - project.homeward.11-homeward-reduces-coordination
approvedLinks:
  - link.homeward.repository
metricIds:
  - homeward-guardrails-32-of-32
---

# Homeward

## In plain terms

Homeward helps patients leave the hospital and actually follow their discharge instructions. It turns the discharge paperwork into a clear recovery plan: what to do next, when, and the exact sentence from the paperwork that says so. Anything unclear, such as a missing date or two instructions that conflict, goes to the care team as a question, and a reminder is created only when the patient approves it.

Patients and caregivers get one place that shows what to do, why, and where it came from, which is designed to prevent the missed follow-ups and confusion that often happen after discharge. Care teams get specific, patient-linked questions to answer. Homeward's multi-agent AI was tested against 32 ways things can go wrong for a patient, such as a reminder created without approval, another patient's records appearing, a document trying to trick the assistant, or a dropped connection creating a duplicate reminder, and it handled every one safely. Its essentials keep working even when the AI service is down, so a patient's recovery never stalls on an outage.

Neerav conceived and built all of it himself: the patient and care-team experience, the React interface, the Express and SQLite backend, the synthetic patient data built with Synthea, the multi-agent AI of four role-specific assistants that each reach patient data only through the Model Context Protocol (MCP) tools their role allows, and the testing that shows it is safe to rely on.

## Outcome

Homeward turns hospital discharge instructions into a persistent, source-linked recovery plan. A patient can see the next recorded step, inspect the exact instruction behind it, carry a missing detail into clarification, ask questions from the saved record, request help from a care-team workspace, and approve a dated reminder without giving an agent authority over clinical wording or side effects. The result is one continuous workflow connecting the discharge source, current task state, unresolved questions, human review, and a verified action.

The product addresses the difficult handoff between receiving discharge paperwork and acting on it at home. Patients and caregivers may need to arrange follow-up, gather documents, complete recovery checks, clarify laboratory instructions, and remember dates while distinguishing current directions from historical records or general education. Homeward makes those distinctions visible and operational, so uncertainty stays explicit wherever it exists.

## Neerav's contribution

Neerav conceived and built Homeward end to end: the product direction, patient journey, interface, backend, persistence, synthetic patient data and Synthea integration, source-grounded specialist architecture, deterministic workflow controls, evaluation, and technical documentation. He defined how tasks, citations, dates, review decisions, approvals, retries, and failures move through the product; implemented the React, Express, and SQLite system; designed the four role-scoped specialists and their MCP contracts; and created the verification program. He is continuing its development toward launch.

## User journey

A patient begins in My recovery, where Homeward selects the next valid recorded step from the current plan. The selector considers pending, unpaused tasks with valid sources and recorded dates, orders them by date, and labels the result as scheduling guidance rather than medical urgency. Completed, rejected, unreviewed, help-paused, historical, and clarification items remain distinct. The dashboard and the question “What is my next step?” use the same guidance object, so the visual recommendation and conversational answer cannot drift apart.

Every recovery task carries a document, section, and exact quote. Dates retain their origin: reviewed discharge source, human clarification, or earlier plan entry. If a deadline is missing, it stays missing. The patient can search exact passages, inspect a saved-record summary, or ask a bounded specialist. An unclear item becomes a durable help request in the care-team workspace; an open request pauses completion and reminder execution without silently approving the underlying instruction.

For a dated, reviewed task, Homeward can prepare a reminder proposal showing the task, date, source instruction, responsible party, and action fingerprint. The patient approves or declines it through the product. Execution creates one local calendar file and receipt. If storage succeeds but the response is lost, a retry returns the original receipt instead of creating a duplicate. A later change to the task revision, source, instruction, or date invalidates the prior approval.

## Architecture and tools

The interface uses React 19. Express 5 owns the API boundary, and SQLite persists patients, documents, tasks, actions, audit events, idempotency receipts, and operational traces. Homeward accepts pasted text, TXT or Markdown, and text-based PDFs, divides them into searchable passages, and keeps imported content unreviewed until a human confirms, clarifies, or rejects it. Historical Synthea data remains separate from authored discharge instructions, imported passages, human clarifications, and general education, with provenance reaching the source file, row, fields, and hash.

TrueForge provides the optional agent session and turn runtime, and each specialist reaches patient data only through MCP tools that Homeward's server exposes. Recognized plan-navigation questions stay deterministic even when the agent path is enabled.

Four specialists—a coordinator, summarizer, questions-and-sources role, and reminder role—receive different tools because their authority differs. Each has its own AgentSpec and patient-and-role-scoped MCP endpoint. The server enforces the tool inventory: the summarizer cannot prepare or execute reminders, and the reminder role can execute only an action already approved in Homeward. No specialist can approve instructions, resolve help, modify medication, book appointments, send messages, or dispatch emergency care.

The core architectural decision is that models select references while the application decides what those references are allowed to mean. Structured output identifies source, task, and action records. The backend resolves them against the current patient and plan revision, reconstructs wording from stored records, and rejects foreign, malformed, fabricated, or stale references. Probabilistic components help locate and organize evidence; deterministic services retain authority over clinical wording, task state, dates, approval, side effects, and recovery.

## Methodology

Homeward was built contract-first around discharge review, next-step selection, source trust, role capabilities, approval, and failure behavior. Shared scenario functions are used by both domain tests and the evaluation runner so the evidence exercises the same transitions as the product. Verification spans store invariants, HTTP contracts, real MCP exchanges, mocked TrueForge sessions, React DOM journeys, and a production build with an isolated SQLite database.

The scenario matrix names the expected answer, required source, allowed and prohibited tools, expected state change, and failure category. It covers missing laboratory details, conflicting uploads, cross-patient requests, historical dosage overreach, approval bypass, prompt injection inside a document, repeated reminder proposals, open help requests, tool failure, response loss, retry, and runtime outage. Automated checks verify application behavior and state; human review remains responsible for answer quality.

## Results

Recorded verification passed 59 backend and contract tests, four React DOM journeys, a production build, and 32 of 32 deterministic guardrail cases. The backend and contract coverage includes discharge review, persistence, optimistic revisions, next-step guidance, specialist routing, role-specific tool inventories, structured reference validation, approval, idempotency, and recovery. The React journeys exercise patient switching, source display, help handoff, review, summary refresh, approval, response loss, retry, and emergency-link availability.

Provider rejection produced zero unauthorized tool calls or patient-state changes. At the same time, deterministic next-step guidance, lexical source search, saved-record summaries, citations, and care-team workflows remained available. That result demonstrates fail-closed behavior and provider-independent usefulness.

## Iterative improvement

Observed problem: discharge summaries can hide missing dates, conflicting instructions, stale decisions, and uncertain write outcomes behind fluent language. Engineering response: Homeward models clarification as durable state, binds every task to exact sources and revisions, separates specialist selection from application authority, requires a product-owned approval, fingerprints actions, stores idempotency receipts, and exposes human review. Verified improvement: the guardrail suite passed all 32 scenarios, including approval bypass, cross-patient access, prompt injection, duplicate proposals, help pauses, provider failure, response loss, and retry.

Observed problem: a useful patient workflow could disappear whenever a model provider is unavailable. Engineering response: Homeward keeps plan navigation, lexical retrieval, saved-record summaries, deterministic guidance, citations, and care-team coordination outside the model runtime. Verified improvement: provider rejection caused no unauthorized activity while those record-based paths continued to operate.

## Impact

Patients can see what to do next, why it is next, where the instruction came from, and what still needs clarification. Caregivers can coordinate responsibility and dates without rewriting the discharge record from memory. Care-team operators receive patient-scoped, source-linked questions with the instruction, history, plan revision, and prior decision state needed for a defensible response. Product and engineering teams get a reusable pattern for consequential agent systems: role-scoped tools, reference validation, human approval, optimistic revision control, idempotent execution, immutable audit history, and deterministic fallback.

## Lessons and next version

Three lessons from building Homeward shape its next version, and each one is about what the patient experiences.

Decide the rules before building the screens. Neerav wrote down up front exactly how a discharge instruction gets reviewed, how the next step is chosen, which sources count, and what each AI assistant is allowed to do, then tested every rule against realistic situations. For a patient, that means Homeward behaves the same way every time: it never invents a deadline, never shows another patient's information, and never creates a reminder they did not approve. The next version starts from those same rules.

Keep the essentials working without AI. A patient's next step, the search through their discharge papers, the record summary, and the path to the care team all work even when the AI service is unavailable. Nobody in recovery gets stuck because of an outage, and the AI assistants add convenience on top of a plan that already works.

Show uncertainty clearly. A missing date stays visibly missing, conflicting instructions are flagged, and anything unclear goes to the care team as a question. Patients and caregivers always know what is confirmed and what still needs an answer, which is exactly where discharge mistakes tend to happen.

The path to launch adds secure sign-in for patients and care teams, real discharge records, and clinical validation with care partners.

## Scope

Homeward is an evaluated product in continued development toward a public launch. Its recorded environment uses fictional discharge material and synthetic Synthea history, while clinical outcomes and authenticated healthcare deployment require separate validation. Within that scope, the completed work demonstrates workflow authority, provenance, failure containment, and patient-and-caregiver coordination.

## Approved page targets and links

Use the approved target and link metadata in this record's front matter for page actions; it is not narrative content.
