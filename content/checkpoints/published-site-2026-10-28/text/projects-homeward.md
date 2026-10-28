# Neerav Chaudhary

Source: https://neerav-git.github.io/projects/homeward
Description: A public record of work, projects, research, and technical writing by Neerav Chaudhary.

SOURCE-GROUNDED DISCHARGE COORDINATION · BUILT AND EVALUATED · 2026
Homeward

A source-grounded discharge system that turns hospital instructions into a persistent recovery plan with exact citations, deterministic next steps, specialist assistance, care-team review, and safely retryable reminders.

ROLE
I conceived and built Homeward end to end: the product direction, patient journey, interface, backend, persistence, synthetic patient data and Synthea integration, source-grounded specialist architecture, deterministic workflow controls, evaluation, and technical documentation. I am continuing its development toward launch.

SUMMARY

Tested product system. Patient, care-team, agent-routing, approval, and failure-recovery journeys have recorded deterministic test evidence.

Build, evidence, and scope ↓
SKILLS APPLIED
Agentic Workflows
MCP
Harness Engineering
TypeScript
Human-in-the-Loop
Failure Recovery
BUILD, EVIDENCE, AND SCOPE
ON THIS PAGE
PRODUCT OUTCOME
Homeward turns discharge paperwork into a source-linked plan for recovering at home

A patient can see the next recorded step, inspect the exact instruction behind it, carry missing details into clarification, ask questions from the saved record, request care-team help, and approve a dated reminder through one continuous workflow.

The product keeps ready tasks, items needing attention, reported completion, help requests, imported passages, and historical context visible as distinct states.

PATIENT-CENTERED COORDINATION
Uncertainty stays visible throughout the workflow

The primary Alex Morgan journey begins with four concrete tasks: arrange a follow-up visit, gather the required paperwork, complete a dated recovery check-in, and clarify a laboratory instruction whose test and date are absent. Homeward does not fill those gaps. The clarification state follows the item through the patient workspace, source search, saved-record summary, help flow, care-team review, and reminder eligibility checks.

The next-step selector considers pending, unpaused tasks with valid source references and recorded dates. It orders eligible tasks by date and labels the result as scheduling guidance. Completed, rejected, unreviewed, help-paused, historical, and clarification items remain visible in their own states. The dashboard and the question What is my next step? consume the same guidance object, keeping the visual recommendation and conversational response aligned.

Every recovery task carries a document ID, section ID, and exact quote. Dates retain their origin: reviewed discharge source, human clarification, or legacy plan entry. Relative language is converted only when the workflow has adequate evidence; an unknown deadline remains empty, preventing a convenient reminder from turning ambiguity into an invented care instruction.

END-TO-END JOURNEY
The workflow carries a question from the record to a verified patient action

Read-only guidance remains responsive while clinical wording, dates, approvals, and side effects stay under deterministic application control.

RESOLVE
Load the bound patient and current plan

Read the patient's tasks, sources, review status, help state, dates, completion reports, and current plan revision from SQLite.

GUIDE
Select the next valid recorded step

Apply deterministic eligibility and ordering rules, then return the task, owner, date, source quote, and reason it is next.

ASSIST
Search sources or route to a bounded specialist

Use lexical search and saved-record summaries directly, or send one request to the coordinator, summarizer, questions, or reminders role with a patient-specific tool inventory.

REVIEW
Validate references and request human judgment

Resolve every selected task, source, and action against the current patient snapshot; send unclear instructions to the local care-team workspace and show consequential proposals before approval.

ACT
Execute once and recover visibly

Bind the approved action to the task revision and source, create the local calendar artifact once, retain the receipt, and return the same result when a lost response is retried.

SPECIALIST ARCHITECTURE
Four roles receive different tools because their authority is genuinely different

The deterministic router selects one role from explicit intent or request language. Each role has a native AgentSpec, a patient-and-role-scoped MCP endpoint, and a server-enforced tool inventory.

COORDINATOR
Organize plan work without approving it

Read the patient snapshot, inspect guidance, and propose a task-level coordination step while leaving instruction approval and clinical wording to deterministic services and human review.

SUMMARIZER
Explain the saved discharge record

Read summaries and source passages, organize ready tasks and unresolved items, and return patient-facing structure without receiving reminder-execution tools.

QUESTIONS
Answer from patient-bound sources

Search exact passages and select source references for ordinary discharge questions; the backend reconstructs the response from stored text after validating patient scope and plan revision.

REMINDERS
Prepare an eligible reminder

Inspect a known dated task, propose a reminder, and execute only a reminder already approved through Homeward's UI and API. No agent receives an approval tool.

AUTHORITY MODEL
The model selects references; the application decides what those references are allowed to mean
IDENTITY
Every tool call is patient-bound

MCP endpoints and store operations resolve one patient and role. Foreign, fabricated, malformed, or stale identifiers are rejected before they can affect the plan.

LANGUAGE
Stored records supply the clinical wording

Structured model output selects source, task, and action identifiers plus an optional allowlisted education topic. The backend reconstructs exact text from current records.

APPROVAL
Homeward owns consequential decisions

Agents cannot approve instructions, resolve help, modify medication, book appointments, send messages, or dispatch emergency care. Human-facing UI and API flows retain those controls.

FRESHNESS
Plan changes invalidate prior authority

Optimistic revisions prevent reviewers from overwriting newer decisions, and action fingerprints bind reminders to the exact task revision, source, instruction, and date.

SOURCE AND REVIEW SYSTEM
Imported records become searchable evidence before they become actionable instructions

Homeward accepts pasted text, TXT or Markdown, and text-based PDFs, divides them into searchable passages, and labels the resulting material unreviewed. A patient or specialist can retrieve an exact passage and propose it for review. The care-team workspace can confirm, clarify, or reject the passage while retaining the original citation and the before-and-after task snapshots in immutable audit history.

Historical Synthea records remain distinct from authored discharge instructions, imported passages, human clarifications, and general education. Provenance reaches the source file, row, fields, and hash, allowing the product to use realistic longitudinal context without treating a historical medication record as a current discharge order.

An open help request pauses completion and reminder execution for the affected task. The care-team operator can respond or resolve the conversation, but resolving a help request does not silently approve an instruction or create a missing deadline. This separation makes uncertainty visible to both sides of the workflow.

RELIABLE REMINDER EXECUTION
The reminder workflow demonstrates approval, stale-state rejection, and idempotent recovery
CHECK
Require a reviewed task with a known date

Block proposals for unresolved, unreviewed, help-paused, historical, completed, or undated instructions.

PROPOSE
Show the exact reminder before execution

Display the task, recorded date, source instruction, responsible party, and action fingerprint in the patient workflow.

APPROVE
Use a separate Homeward decision

Approve or decline through the product's UI and API; the agent cannot grant its own authority.

CREATE
Generate one local calendar artifact

Create a local .ics file and execution receipt without claiming an appointment booking, sent message, or background notification.

RETRY
Return the original receipt after response loss

If storage succeeds and the response is lost, a retry resolves the idempotency key and returns the first result instead of duplicating the reminder.

PATIENT SAFETY SURFACES
Escalation, education, and emergency access remain independent from agent readiness
CARE TEAM
Unclear instructions create a durable help item

The local operator sees the patient, task, source, question, and history, and can respond without silently changing the underlying discharge instruction.

EDUCATION
General information stays separate from the care plan

Fixed-topic MedlinePlus lookups return allowlisted links, cache successful results, send no patient identifiers, and cannot modify tasks or dates.

EMERGENCY
The patient controls the emergency call

A persistent US-demo tel:911 control bypasses the agent and lets the user's device initiate the call directly.

FALLBACK
Saved records remain useful during provider failure

Deterministic next-step guidance, lexical source search, summaries, citations, and care-team workflows continue to operate when model execution is unavailable.

RECORDED VERIFICATION
The integrated evidence exercises product behavior, authority boundaries, and recovery

Verification spans store invariants, HTTP contracts, real MCP exchanges, mocked TrueForge sessions, React journeys, and a production build.

59
Backend and contract tests
Coverage includes discharge review, revisions, persistence, guidance, agent routing, tool inventories, structured references, approval, and idempotency.
32/32
Deterministic guardrail cases
Scenarios cover missing details, conflicting records, cross-patient requests, dosage overreach, approval bypass, prompt injection, duplicate proposals, help pauses, tool failure, and runtime outage.
4
React DOM journeys
The interface tests patient switching, source display, help handoff, review, summary refresh, approval, response loss, retry, and emergency-link availability.
1
Production build
The integrated product compiled successfully alongside the recorded contract, protocol, and UI verification.
EVALUATION METHODOLOGY
The evaluation targets the transitions where polished demos hide risk

The implementation followed explicit contracts for discharge review, next-step selection, source trust, role capabilities, approval, and live evaluation. Shared scenario functions serve both the domain tests and evaluation runner, reducing the chance that presentation evidence exercises a different path from the product.

Critical transitions are checked at multiple layers: store invariants, HTTP behavior, real MCP client exchanges, mocked TrueForge sessions and structured output, React DOM journeys, and a production-browser path with an isolated SQLite database. The live scenario matrix names the expected answer, required sources, allowed and prohibited tools, expected state change, and failure category.

The evaluation includes missing laboratory details, conflicting uploads, cross-patient requests, historical dosage overreach, approval bypass, prompt injection inside a document, repeated reminder proposals, open help requests, tool failure, and runtime outage. Live execution is opt-in, request-capped, budget-referenced, and configured to stop on provider errors. Automated checks verify controls and state; human review remains the authority for answer quality.

IMPACT
Homeward reduces coordination burden while keeping the record and authority visible
PATIENTS
See what to do next and where it came from

The recovery plan combines task state, owner, date, source quote, open question, help status, and reminder state in one workflow.

CAREGIVERS
Coordinate without rewriting the discharge record

Responsibility and source references travel with each item, while missing details remain explicit instead of becoming informal family interpretations.

CARE TEAMS
Receive patient-scoped, source-linked clarification requests

The review workspace shows the instruction, patient question, activity history, plan revision, and prior decision state required for a defensible response.

PRODUCT TEAMS
Separate helpful assistance from workflow authority

Role capabilities, reference validation, human approval, idempotency, audit events, and fallback behavior form a reusable pattern for consequential agent products.

MY CONTRIBUTION
I conceived and built Homeward end to end

I conceived and built Homeward end to end: the product direction, patient journey, interface, backend, persistence, synthetic patient data and Synthea integration, source-grounded specialist architecture, deterministic workflow controls, evaluation, and technical documentation. I am continuing its development toward launch.

EVALUATED SCOPE
A deeply tested reference implementation for post-discharge coordination

Homeward implements the patient and care-team experience, source and date provenance, deterministic guidance, imported-record review, four role-scoped specialists, human-controlled approval, local reminder artifacts, stale-action rejection, idempotent recovery, education lookup, emergency access, and multi-layer evaluation.

Homeward is in continued development toward a public launch. Its current validation uses fictional discharge material and synthetic Synthea history; clinical outcomes and authenticated healthcare deployment require separate validation. The completed evidence demonstrates workflow authority, provenance, failure containment, and patient-and-caregiver coordination.

PROJECT LINKS
Repository
PUBLIC HOMEWARD CODEBASE, PRODUCT WALKTHROUGH, AND TEST RESULTS.
