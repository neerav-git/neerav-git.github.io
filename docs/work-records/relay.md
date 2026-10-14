# Relay — evidence-led employee service through conversation

## Executive description

Relay is a voice-first employee workspace that turns fragmented employee-service work into one continuous, reviewable journey. Instead of asking an employee to know which portal, department, form, case queue, or calendar owns a problem, Relay begins with the employee’s own question: “What do I still need to do?”, “Open the form,” “Why is my account blocked?”, or “Set up time with IT.” It reads the employee’s current records, identifies the responsible party and next action, moves the existing portal to the relevant record, and prepares a bounded action for review. When a request changes state, the employee sees the exact proposal and explicitly confirms it before the application executes and verifies the result.

This is more than a conversational skin over a portal. The repository contains a React employee workspace, Fastify application boundary, typed synthetic company data, semantic navigation, five state-changing capabilities, confirmation and idempotency controls, post-write verification, text and voice adapters, and append-only evidence. It also contains the machinery to improve the agent: live and replay runners, held-out rewordings, grounding and tool scoring, safety and voice evaluation, statistical summaries, and a CI release gate.

Northstar Analytics is the fictional employer inside the product. Relay is the product and assistant brand. The records, cases, people, policies, and workflow effects are synthetic, which allows the work to demonstrate realistic employee-service behavior without using real employee data.

## The problem and the people affected

Employee-service portals often expose the organization’s internal boundaries rather than the employee’s goal. A new employee may need to coordinate tax documents, direct deposit, training, equipment, account access, meetings, benefits, and support cases, but those records can live behind different navigation structures and be owned by different teams. The employee has to translate a plain-language need into system vocabulary, locate the right page, interpret status and ownership, and decide whether an action has actually happened. People Operations and service teams absorb the resulting follow-up: repeated status questions, incorrectly routed issues, incomplete tickets, duplicate work, and manual reconciliation.

Relay addresses that fragmentation while preserving the underlying systems’ authority. Employees get a clearer path to completion; People Operations gets answers tied to current records and explicit ownership; service teams get better-scoped requests routed through a versioned catalog. Product and engineering teams gain a reusable workflow shell for identity, confirmation, idempotency, audit, and verification.

The design is useful where convenience and consequence meet. Natural language should simplify discovery without silently submitting a tax form, exposing private data, duplicating a case, or presenting a draft as a completed action. Relay combines conversational ease with application-owned control.

## What was implemented

The employee-facing product is a complete synthetic portal rather than a chat-only demo. Its principal surfaces cover Home, My Onboarding, Tasks, Documents, Learning, Pay & Benefits, Help & Support, meetings, and workflow operations. Relay Guide opens beside this workspace on desktop and as a constrained mobile surface without replacing the portal. This matters because the employee can see the answer, destination, proposed action, and resulting record together.

Relay reads typed records across onboarding, tasks, documents, learning, equipment, meetings, cases, knowledge, pay, and benefits. It preserves status, owner, due health, blocker, employee action, and next-step owner. Missing, stale, conflicting, or unavailable required data produces a typed abstention rather than a model guess.

Navigation is semantic and application-controlled. The agent requests a registered route, panel, typed record, or allowlisted anchor, never an arbitrary selector or URL. The application maps the ID to the real route and DOM target, highlights it, and reports a visible postcondition. A follow-up such as “Open it” retains conversational reference while the portal decides what may be shown.

The write surface is deliberately small and concrete. Five registered capabilities are implemented:

- `create_support_case` inspects existing cases and an approved route, prepares the request and duplicate check, then verifies that the created or reused case appears in the employee’s collection.
- `start_employee_task` checks ownership and the current state, transitions an eligible employee-owned task, and verifies that the same task re-reads as in progress.
- `schedule_employee_reminder` validates the referenced task, document, or course and permitted delay, then schedules or safely reuses one process-local reminder.
- `schedule_calendar_meeting` resolves an eligible attendee, shared hours and conflicts, then places the confirmed meeting on the Relay demo calendar with a stable ID.
- `add_case_comment` checks that the case belongs to the employee and remains open, then adds the reviewed reply once to the same case activity.

Each capability supplies product-specific `inspect` and `execute` behavior. The shared workflow service supplies actor binding, confirmation, idempotency, ordered audit events, execution receipts, and post-write verification. This separation is a practical extensibility decision: adding a workflow requires a new adapter, while the safety and evidence lifecycle remains consistent.

## End-to-end journeys

The flagship journey starts with “My VPN is failing.” Relay retrieves the signed-in employee’s context and checks related access records and cases. If timing or attempted fixes are missing, it asks one short question and re-reads context on the next turn. For a distinct issue, it opens Help & Support, selects IT Support, checks similar cases, and presents the exact proposal. No write has occurred. The employee reviews it and chooses Confirm or Cancel.

Confirmation sends an opaque token bound to the same actor and session. The server executes with a stable idempotency key, re-reads the cases, and reports success only when the returned case is present. The portal shows the stable ID, status, team, and next step. The audit progresses from inspection and reasoning through confirmation, tool execution, and `state_change_verified`; retries return the completed result instead of creating a second effect.

The same pattern supports “What’s next?”, exact-record navigation, reviewed case replies, reminders tied to the current record, and editable meeting drafts with conflict handling. Voice uses the same records, functions, workflow adapters, and confirmation UI as text, so speech is a transport into the product rather than a less-controlled implementation.

## Architecture and important decisions

Relay is a typed TypeScript system with explicit browser, conversation, application, record, and evidence boundaries. React 19 and Vite render the portal and assistant; Fastify 5 owns HTTP and sessions. Shared contracts define domain records, navigation, functions, capabilities, reason codes, and evaluation snapshots. Ajv validates structured artifacts, and Vitest covers policy, orchestration, adapters, navigation, voice/text dispatch, secure input, persistence, and evaluation logic.

Deepgram’s Agents SDK provides the real-time session, speech transport, playback, and interruption events. The evaluated configuration uses Nova-3, GPT-4.1, and Flux. Relay retains identity, data, navigation, policy, confirmation, mutation, and verification. The browser never supplies employee authority, and the long-lived Deepgram key stays server-side behind a short-lived client grant.

The foundational rule is “the model proposes; the application disposes.” A function call to `propose_onboarding_action` is deferred until end of turn and can only produce a visible proposal. It cannot perform the mutation. The later confirmation path is outside the conversational function call. This prevents a plausible-sounding response, a premature function request, or an interrupted turn from becoming authority to act.

Voice lifecycle is product state, not an opaque connection. The adapter separates greetings from answers, waits for playback to drain, retains one session across a multi-turn task, interrupts when the user starts speaking, and applies bounded reconnect and inactivity limits. These details make the workflow usable by voice rather than merely capable of producing audio.

Evidence is designed into the architecture. Runs preserve configuration and provenance; the UI runner checks routes, records, confirmations, calendars, tools, writes, and final state. CI replays recorded turns through the portal with live Deepgram disabled and fails if a socket opens. Live suites are separate and budget-capped.

## Methodology: building an agent that can be improved

The evaluation program measures whether the application reached the right state, not whether the answer contained expected phrases. Seven multi-turn development workflows cover onboarding work, support, meetings, department routing, pay and benefits, learning and reminders, and service-team calendar coordination; a mobile scenario exercises the same interaction at 390 × 844. Five safety scenarios map to OWASP LLM risks including private-data disclosure, excessive agency, sensitive input, indirect prompt injection, and false claims after cancellation.

Each live attempt records revision, prompt variant, models, cost, tool calls, latency, checks, and failures. Success requires every turn to satisfy observable conditions. Fourteen held-out rewordings stay outside the fix loop; if one leads to a change, it is retired and replaced. The scorecard reports intervals, pass^k, tool recovery, latency, and cost.

Evaluation extends beyond task completion. Tool scoring checks whether record IDs came from the server and whether the expected record was reached. Grounding review checks atomic facts against tool results and plants errors to test the grader. A 100-reply sample measures answer completeness and usefulness with a judge calibrated to human labels. Voice runs measure outcomes, first-audio time, word error, key-term recall, and barge-in; matched audio compares key-term prompting off and on.

Early failures in navigation, dates, confirmation, sensitive input, record IDs, connection timeouts, voice highlighting, session limits, and rebooking became named fixes and reruns. CI runs tests, the committed gate, the build, and 764 replay turns without a paid session. The gate covers safety, faithfulness, task success, held-out behavior, tool use, answer quality, spoken turns, and barge-in.

## Results and impact

The October 11, 2026 snapshot uses 37 source runs at revision `dab9b6a`. The broader saved evidence covers 252 live conversations, 764 live turns, 1,271 tool calls, 57 recorded voice sessions, and 764 replay turns.

After the fix pass, 103 of 110 development conversations completed correctly, or 93.6% with a Wilson 95% interval of 87.4%–96.9%. The earlier-period result was 26 of 37, or 70.3%; this before/after is explicitly reported as sequential periods rather than a controlled A/B. Held-out rewordings achieved 39 of 42, or 92.9% [81.0%, 97.5%]. The measured held-out difference from development was −2.1 percentage points with a range from −11.0 to +6.0, so the evidence found no measurable drop on the unseen phrasings.

Tool behavior became both accurate and recoverable. The agent reached the correct record on 186 of 187 scored turns. The first ID was correct on 158 of 187; 30 hallucinated IDs were all caught by validation, and 89 of 99 turns containing a tool error recovered in the same turn. This is a stronger result than merely suppressing bad model output: the application converts an imperfect model choice into a bounded error and gives the agent a path back to real records.

Voice evidence spans natural owner-recorded sessions and controlled workflows. Thirty-one of 34 requests were useful, including 24 fully right; the latest scripted set passed 24/24 turns and 7/7 workflows. First audio was 2.0 seconds median and 2.7 seconds p95; barge-in stopped playback at 51 ms p95. Key-term prompting moved recall from 101/108 to 106/108 and WER from 3.7% to 2.7% with 0/60 false insertions, but was not adopted because `p = 0.125` was inconclusive.

Grounding review checked 1,035 facts across 316 replies and found zero unsupported facts after reviewing five flags. Planted-error sensitivity was 92% for day-off dates, 90% for wrong people, and 65% for hour-off times. Answer quality passed on 87/100 replies; judge calibration reached 94% raw agreement and κ = 0.83, with all 13 flags confirmed by the human reviewer.

The safety program recorded zero unsafe actions, proposals, forbidden calls, or unsafe reply violations in 21 runs. It also exposed an early weakness: pasted bank details reached tool arguments in 4/4 attempts. Input redaction moved that result to 0/5, with the original evidence retained.

The included usage sample cost $5.59, or $0.243 of Deepgram time per fully correct conversation. The snapshot satisfies every enforced gate. Median full turn time, 15.3 seconds, remains tracked against a 12-second goal, so the evidence supports correctness, recovery, safety, and voice interaction—not an across-the-board speed claim.

## Why the work is notable

Relay’s strongest achievement is the integration of product behavior and evaluation discipline. Many agent demos optimize for a convincing reply. Relay makes the portal’s own state the judge, keeps the model outside the authority boundary, and records enough provenance to explain why a result passed or failed. Its navigation model replaces arbitrary browser control with semantic, site-issued targets. Its workflow model separates preparation from execution, binds confirmation to actor and session, makes retries idempotent, and verifies the resulting record. Its evaluation model combines live runs with a free replay suite, holds back unseen language, tests the grader, measures voice as interaction rather than transcription alone, and turns recurring checks into a release gate.

The practical improvement is reduced translation work. Employees can begin from their intent and remain in one workspace. Service teams receive a more complete, correctly routed request. Product teams get a pattern for adding actions without expanding the model’s authority. Engineering teams gain reproducible evidence instead of relying on a hand-picked demo. Even where the prototype uses synthetic and process-local systems, the contracts make clear where a durable HRIS, case provider, calendar, or queue adapter would attach.

## Author role and attribution

The reachable Git history in the inspected checkout contains 74 commits, all attributed to the `neerav-git` account. On repository evidence, Neerav’s role spans product definition, employee-journey design, information architecture, TypeScript implementation across client/server/shared layers, synthetic data modelling, agent and tool-contract design, workflow safety, voice behavior, evaluation design and execution, statistical reporting, QA, documentation, and portfolio evidence. No separate human development team is named in the repository history, so this record does not invent team roles.

The work does build on external technology and evaluation services: Deepgram supplies the Agents SDK and speech infrastructure; GPT-4.1 is identified as the evaluated reasoning/function-selection model; Claude produced the saved LLM-judge labels; React, Fastify, Vite, Vitest, Ajv, and related open-source packages provide the application foundation. Those dependencies are credited as platforms and tools, not represented as co-authors of the product decisions and implementation contained in this repository.

## Bounded scope

The demonstrated organization and employee data are fictional. The case system, meeting calendar, reminders, outbox events, workflow state, and audit storage are application-owned. Production HR, payroll, ticketing, calendar, email, and messaging providers connect through the capability seams but are not claimed as current integrations. The measured results describe the recorded scenarios, revisions, models, and run corpus rather than population-wide employee-productivity outcomes.

## Evidence summary

### Results with context

- 103/110 post-fix development conversations completed correctly (93.6% [87.4%, 96.9%]); the earlier period was 26/37.
- 39/42 held-out rewordings completed correctly (92.9% [81.0%, 97.5%]) with no measurable drop from development.
- Correct record reached on 186/187 scored turns; all 30 invented IDs were caught by validation; 89/99 tool-error turns recovered.
- 31/34 owner-recorded spoken requests were useful; the latest scripted set passed 24/24 turns and 7/7 workflows.
- Recorded voice TTFA was 2.0 s median and 2.7 s p95; interruption-stop latency was 51 ms p95.
- 0 unsupported facts remained after review of 1,035 checked facts; answer quality passed on 87/100 replies with κ = 0.83 judge/human agreement.
- Red-team runs produced 0 unsafe actions; typed sensitive-value leakage changed from 4/4 before redaction to 0/5 after.
- Key-term prompting improved recall from 101/108 to 106/108 with no false insertions in 60 negative clips, but was not adopted because the result was not statistically conclusive.
- The included usage sample reports $0.243 of Deepgram time per fully correct conversation.

### Implemented capabilities

- Server-resolved employee scope; browser-supplied identity and authority are rejected by design.
- Typed record retrieval, abstention, semantic route/record/anchor navigation, and visible postconditions.
- Five registered, confirmation-gated capabilities with inspect/execute separation, actor binding, idempotency, audit chronology, and state re-reading.
- Text and voice share one application boundary; voice implements multi-turn continuity, playback drain, barge-in, reconnect, and session limits.
- Outcome-based live runner, no-cost replay runner, held-out suite, safety suite, grounding and tool scoring, calibrated judge, key-term experiment, snapshot generation, and CI release gate.

### What the evidence demonstrates

- Relay reduces employee-service fragmentation by letting an employee begin with intent while keeping the record and action visible in the same workspace.
- The architecture is reusable because product-specific adapters plug into a shared confirmation, idempotency, evidence, and verification shell.
- The evaluation system is a substantive product-engineering contribution: it found concrete failures, supported targeted fixes, and protects measured behavior in CI.
- The work demonstrates a credible pattern for safe application-native agents without claiming that synthetic adapters are production enterprise integrations.

## Exact source map

- `README.md` — product definition, one-minute workflow, five capabilities, architecture diagrams, integration boundaries, testing/evidence levels, and reproduction steps.
- `package.json` — React/Fastify/Deepgram/Ajv/Vitest stack and build, test, dataset, live-evaluation, scoring, snapshot, and gate commands.
- `src/server/app.ts` — HTTP/session boundary, token grant, identity-field controls, context, navigation, workflow, confirmation, and evaluation endpoints.
- `src/server/intelligence-guide.ts` and `src/server/synthetic-company-store.ts` — employee-scoped context, record index/detail resolution, typed source conditions, and semantic navigation inputs.
- `src/server/onboarding-workflow.ts`, `src/server/workflow-capabilities.ts`, and `src/shared/workflow-capabilities.ts` — preparation, confirmation-token binding, idempotency, capability registry, execution, verification, receipts, and audit events.
- `src/client/DeepgramTextGuide.ts` and `src/client/voice/DeepgramVoiceAdapter.ts` — prompt/function dispatch and the text/voice session lifecycle.
- `evaluation/ui-runner/scenarios.ts` — W1–W7, M1, S1–S5, held-out phrasing rules, and observable route/state/safety expectations.
- `evaluation/scorecard/scorecard.ts` and `evaluation/scorecard/metrics.ts` — task outcomes, pass^k, Wilson intervals, stratified comparisons, tool recovery, latency, safety, and cost aggregation.
- `evaluation/summaries/evaluation-snapshot.json` — frozen October 11 metric snapshot at revision `dab9b6a`, including denominators, intervals, methods, fixes, scale, voice, grounding, safety, and answer quality.
- `docs/EVALUATION_CASE_STUDY.md` and `docs/EVALUATION_SPEC.md` — concise method/results narrative and the broader metric, reporting, voice, safety, and change-control contracts.
- `evaluation/gate.ts` and `.github/workflows/ci.yml` — enforced evaluation thresholds and the no-live-session CI sequence.
- `evaluation/judge/`, `evaluation/grounding/`, `evaluation/tool-args/`, and `evaluation/keyterms/` — answer-quality calibration, factual support checking, tool-argument accuracy, and matched audio experiments.
- `docs/AGENTIC_WORKFLOW_TRACE.md`, `docs/SYSTEM_MODEL.md`, and `docs/PHASE1_AUTOMATION_FOUNDATION.md` — workflow chronology, state ownership, trust boundaries, and secure-field design.
- `docs/assets/readme/relay/CAPTURE_MANIFEST.md` and its seven screenshots — versioned visual proof for the portal, grounded answer, focused record, prepared and confirmed case, calendar, and evidence trace.
- Commits `dab9b6a` (CI evaluation gate), `7a39ed6` (24/24 spoken turns and 7/7 workflows), `34aaa71`/`9b5b4df` (calibrated answer-quality evidence), and current inspected head `394ea86` (evaluation page/case-study release-gate wording).
- External evaluation dashboard linked by the repository: https://claude.ai/artifact/2vMEzrimhQtoprShg4uukV
