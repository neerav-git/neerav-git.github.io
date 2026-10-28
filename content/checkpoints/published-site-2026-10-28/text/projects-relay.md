# Neerav Chaudhary

Source: https://neerav-git.github.io/projects/relay
Description: A public record of work, projects, research, and technical writing by Neerav Chaudhary.

VOICE-FIRST EMPLOYEE SERVICES · BUILT AND EVALUATED · 2026
Relay

A voice-first employee-service workspace that answers questions from authenticated records, opens the exact task or document, and carries reviewed requests through confirmation to a verified result.

ROLE
I defined the employee journeys and product architecture; implemented the React, Fastify, shared-contract, workflow, voice, and evidence layers; designed the safety and evaluation program; executed the measured runs; and converted the failure analysis into tested product fixes and a CI release gate.

SUMMARY

Evaluated product system. Core workflows have recorded task, voice, tool, safety, groundedness, recovery, and held-out evaluations.

Build, evidence, and scope ↓
SKILLS APPLIED
Agentic Workflows
Harness Engineering
TypeScript
Voice AI
Tool Calling
Playwright
BUILD, EVIDENCE, AND SCOPE
ON THIS PAGE
PRODUCT OUTCOME
Relay turns an employee's intent into a visible, verified workflow

The employee starts with a question or request. Relay resolves the signed-in employee, reads the relevant records, opens the exact task or document, prepares a registered action, waits for explicit approval, and reports completion only after the application confirms the new state.

The answer, destination, proposal, confirmation, and resulting record remain visible in one employee workspace.

IMPLEMENTED PRODUCT
A conversational guide operating across the full employee-service workspace

Relay covers Home, My Onboarding, Tasks, Documents, Learning, Pay & Benefits, Help & Support, meetings, reminders, and workflow operations. The guide opens beside those surfaces on desktop and within a constrained mobile layout, so an employee can move from a spoken or typed request to the source record and resulting action without losing the surrounding application context.

The data model carries the details employees and service teams need to act: status, owner, due health, blocker, employee responsibility, next-step owner, and source condition. Relay reads those typed records before answering. When required data is missing, stale, conflicting, or unavailable, the system returns a typed abstention and a concrete next step instead of inventing a value.

Navigation is semantic and application-controlled. The guide requests a registered route, panel, record, or allowlisted anchor; Relay maps that identifier to the real destination, focuses the matching UI, and checks a visible postcondition. Conversational references such as Open it can carry across turns while the application continues to decide which record and destination are valid.

READ AND NAVIGATE
A grounded answer names the record, owner, deadline, and action

When Maya asks what is next, Relay reads her current employee-scoped records and cites the relevant task details.

Relay identifies the Federal and California withholding forms, their Not started state, Maya's responsibility, today's deadline, and the next employee action.

CONVERSATION-TO-ACTION LIFECYCLE
Application-owned controls turn a request into a trustworthy action

Each consequential workflow uses the same five-stage contract, giving employees a predictable review step and giving engineering a reusable control plane for identity, authority, retries, audit, and evidence.

DISCOVER
Resolve identity and current state

Bind the session to the signed-in employee and retrieve the relevant scoped records from the server.

GROUND
Identify the record and responsible path

Connect the request to a typed source, registered route, responsible party, and permitted next action.

PREPARE
Inspect the capability and show the proposal

Run duplicate, ownership, eligibility, and conflict checks, then render the exact proposed write in the workspace.

CONFIRM
Bind approval to the same actor and session

Wait for the employee to review the visible destination and details, then submit an opaque confirmation token.

VERIFY
Execute once and prove the result

Use a stable idempotency key, re-read application state, and report success only when the expected record is present.

CONFIRMATION-GATED WORKFLOW
A VPN issue becomes a reviewable IT Support request

Relay gathers the missing incident detail, checks related access records and similar cases, opens Help & Support, selects IT Support, and displays the complete request before any write occurs.

The employee can inspect the destination, summary, and details, then confirm or cancel the action.

VISIBLE RESULT
The completed action returns to the workspace as a verified record

After confirmation, Relay executes with a stable idempotency key, re-reads the employee's case collection, and shows the case ID, responsible team, status, and next step. A retry returns the completed result instead of creating a duplicate.

The new case appears in Help & Support with the same stable id shown in Relay's response.

CAPABILITY SYSTEM
Five employee actions share one rigorous execution contract

Each capability supplies its own eligibility and state-change logic while the shared workflow service supplies actor binding, confirmation, idempotency, ordered audit events, execution receipts, and post-write verification.

SUPPORT
Create or safely reuse a support case

Inspect similar cases and the approved service route, prepare a correctly scoped request, and verify that the created or reused case appears in the employee's collection.

TASKS
Start an eligible employee task

Check ownership and current state, transition the task, and re-read the same record to verify that work is in progress.

REMINDERS
Schedule a record-linked reminder

Validate the referenced task, document, or course and the permitted delay, then create or reuse one reminder with a stable identity.

MEETINGS
Place a conflict-checked meeting

Resolve an eligible attendee, inspect shared hours and calendar conflicts, keep the draft editable, and add the confirmed meeting with a stable ID.

CASES
Add a reviewed case reply once

Confirm that the case belongs to the employee and remains open, then append the approved response to the same activity history without duplication.

MEASURED RESULTS
The evaluation program turned failures into fixes and release criteria

The saved evidence spans 252 live conversations, 764 live turns, 1,271 tool calls, 57 recorded voice sessions, 764 replay turns, and 1,035 reviewed facts. Every headline result retains its numerator, denominator, revision, and test condition.

93.6%
Task success after the fix pass
103/110 conversations fully correct; up from 70.3% (26/37).
92.9%
Held-out generalization
39/42 reworded requests not used during development.
31/34
Spoken answers meeting review criteria
Owner-recorded voice requests; 24 were fully right.
24/24
Spoken end-to-end turns
Every checked turn passed through the real voice path across all seven workflows.
87%
Answer quality
87/100 replies were helpful on all four reviewed criteria.
186/187
Correct record reached
99.5% eventual tool-call record accuracy.
0
Unsafe actions in red-team runs
Twenty-one OWASP-mapped runs produced zero unsafe actions, proposals, forbidden calls, or unsafe replies; input redaction also blocked sensitive values in all five post-fix checks.
1,035
Facts reviewed
Grounding checks across 316 replies flagged five dates, times, names, IDs, or amounts; manual review found every flagged statement supported.
EVALUATION SURFACE
The product exposes the evidence behind its quality claims

The in-product evaluation route connects task outcomes, held-out behavior, voice, tool recovery, safety, factual support, latency, cost, failure categories, and the fixes made after each run. Reviewers can inspect denominators and confidence intervals instead of relying on a polished demonstration alone.

Current evaluation snapshot: 252 live conversations, 764 agent turns, 1,271 tool calls, 57 recorded voice sessions, and 1,035 facts checked.

EVALUATION METHODOLOGY
Success is defined by application state, not preferred wording

Seven multi-turn development workflows cover onboarding, support, meetings, department routing, pay and benefits, learning and reminders, and service-team calendar coordination. A mobile scenario exercises the same interaction at 390 x 844. Five safety scenarios test private-data disclosure, excessive agency, sensitive input, indirect prompt injection, and false completion claims.

Each live run records the code revision, prompt variant, models, cost, latency, function calls, observable checks, and failure reason. A workflow passes only when every turn reaches the required route, record, confirmation state, calendar state, or server-side result. Fourteen reworded requests stay outside the development loop; any held-out phrase that drives a fix is retired and replaced.

The evaluation program also tests its own measurement tools. Tool scoring checks whether record IDs came from server results and whether the expected record was eventually reached. Grounding review decomposes replies into atomic facts and uses planted errors to measure grader sensitivity. A 100-reply answer-quality sample uses a judge calibrated against human labels. Voice runs measure task outcome, first-audio time, word error rate, key-term recall, and barge-in behavior.

Recurring checks run without paid voice sessions by replaying 764 recorded turns through the real portal and workflow code. CI fails if a live socket opens during replay or if the committed thresholds for task success, safety, factual support, tool use, spoken workflows, answer quality, or interruption handling are missed.

ARCHITECTURE
Conversation, authority, and evidence are separate system responsibilities
CONVERSATION
Deepgram carries the real-time turn

Nova-3 transcribes speech, GPT-4.1 selects functions in the evaluated configuration, and Flux returns audio. The adapter manages playback drain, multi-turn continuity, interruption, reconnect, and inactivity limits.

APPLICATION
Relay owns identity, policy, and mutation

Fastify resolves employee scope, validates semantic targets, inspects capability rules, binds confirmation to actor and session, and keeps the long-lived service key behind a short-lived client grant.

EVIDENCE
Verified state determines whether a turn passed

The evaluator checks the visible route, focused record, proposal, confirmation card, calendar, audit chronology, and server records, then retains the run configuration and result for comparison.

IMPACT
Relay reduces coordination work for employees, service teams, and product engineering
EMPLOYEES
Begin with the need and stay in one workspace

Employees can ask what is due, inspect the source record, review a proposed action, and see the completed result without learning which portal, queue, form, or owner sits behind the request.

SERVICE TEAMS
Receive better-scoped, correctly routed requests

The capability inspection stage collects required details, chooses a versioned service route, checks duplicates or conflicts, and carries the responsible team and next step into the resulting record.

PRODUCT TEAMS
Add workflows without expanding model authority

A new capability implements product-specific inspect and execute behavior while reusing the shared identity, confirmation, idempotency, audit, receipt, and verification lifecycle.

ENGINEERING
Replace hand-picked demos with reproducible evidence

Versioned runs, held-out requests, replay tests, calibrated review, failure categories, and CI thresholds show which behaviors improved and protect them from regression.

MY CONTRIBUTION
Product design, implementation, evaluation, and iteration formed one body of work

I defined the employee journeys and information architecture; built the React, Fastify, shared TypeScript, workflow, voice, and evidence layers; designed the typed record and capability contracts; implemented confirmation, idempotency, audit, and verification controls; created the live, held-out, replay, safety, grounding, tool, answer-quality, and voice evaluation suites; ran and analyzed the experiments; and converted observed failures into named fixes and an enforced release gate.

EVALUATED SCOPE
A complete application-owned environment with explicit provider seams

The evaluated system includes the employee portal, typed employee records, semantic navigation, five confirmation-gated capabilities, calendar and case workflows, reminders, audit state, retained evaluation runs, and live Deepgram voice interaction.

Northstar Analytics and its employee records are fictional, and the calendar, payroll, benefits, case, reminder, and outbox services are application-owned. The adapter contracts identify the integration points for durable HRIS, ticketing, calendar, email, and queue providers.
