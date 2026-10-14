---
slug: relay
approvedTargets:
  - project.relay
  - project.relay.methodology
  - project.relay.4-application-owned-controls
  - project.relay.7-five-employee-actions
  - project.relay.8-the-evaluation-program
  - project.relay.11-conversation-authority-and
  - project.relay.12-relay-reduces-coordination
approvedLinks: []
metricIds:
  - relay-development-success-103-of-110
  - relay-held-out-39-of-42
---

# Relay

## In plain terms

Relay is an employee-service workspace with a voice AI agent you can talk to or type to. An employee asks a question in their own words, such as a question about their benefits or a VPN problem that needs IT support, and Relay answers from their own records, takes them straight to the right page, and, through tool calling, can complete the request for them: opening a support case, starting a task, setting a reminder, scheduling a meeting, or replying to a case. Before it changes anything, it shows exactly what it will do and waits for a yes; afterwards it checks that the change really happened, so the employee gets a finished result they can trust.

Relay comes close to real HR software and in some ways goes beyond it. It covers what a full employee portal covers: onboarding, tasks, documents, learning, pay and benefits, support cases, meetings, and reminders. Most HR portals still make employees find the right system, form, and wording themselves. Relay removes that work: the employee says what they need, by voice or text, and the guide finds it, shows it, and finishes it. It also ships with its own evaluation harness, a quality program most production HR tools never expose: in 110 realistic multi-step conversations it completed the employee's request correctly 103 times, it handled 39 of 42 conversations worded in ways it had never seen, and across 21 recorded attempts to trick it into unsafe actions it made no unsafe change. It runs on a realistic sample company, and its adapters are built to plug into production HR, ticketing, calendar, and messaging systems.

## Outcome

Relay is a voice-first employee-service workspace that lets an employee state a need in ordinary language, receive an answer grounded in authenticated records, open the exact task or document, and carry a reviewed request through confirmation to a verified result. It addresses the coordination burden created by fragmented HR portals: employees should not need to know which system, form, owner, or internal vocabulary maps to a question about pay, benefits, onboarding, learning, support, or scheduling.

The result is a complete fictional Northstar employee environment spanning onboarding, documents, support, meetings, reminders, tasks, and case replies. The same workflow serves typed chat and live voice, and Relay's own services, not the AI model, check who the employee is, what they may do, and whether each change really happened.

## Neerav's contribution

Neerav defined the employee journeys and product architecture, then implemented the React interface, Fastify services, shared contracts, workflow engine, voice integration, capability adapters, and evidence system. He designed the safety model and evaluation program, executed the recorded runs, classified failures, converted those failures into engineering changes, and turned the resulting thresholds into a release gate.

This is end-to-end product work: information architecture, interaction design, typed data models, backend policy, provider seams, conversational behavior, test harnesses, and evidence presentation were designed as one system. Conversation serves as the interface to deterministic product capabilities, with application services retaining authority.

## User journey

The employee starts inside a familiar portal covering home, onboarding, tasks, documents, learning, pay and benefits, support cases, meetings, and reminders. The guide can answer a question from the signed-in employee's records and move the page to the evidence it used. For a consequential request, Relay first prepares a typed proposal. The employee sees the intended action and relevant details, explicitly confirms it, and receives a verified result tied to the resulting record.

Five adapters support creating a support case, starting a task, setting a reminder, scheduling a meeting, and replying to a case. Each follows the same lifecycle: resolve browser identity on the server, interpret the request against registered records and semantic targets, prepare a proposal, bind confirmation to that proposal, execute an idempotent write, record an audit event, and check the visible postcondition. If the provider or model fails, the application does not silently bypass those controls.

## Architecture and tools

Relay uses React 19 and TypeScript for the employee workspace and guide surfaces, Fastify 5 for APIs and application authority, and shared schemas for browser-server contracts. Deepgram supplies streaming speech recognition and the live Voice Agent transport; Nova-3 handles transcription and GPT-4.1 provides the conversational reasoning path. Vitest covers service behavior and Playwright exercises full browser journeys.

Typed employee records ground answers. A semantic navigation registry maps visitor language to visible routes and sections without allowing arbitrary URLs. The capability layer exposes a narrow set of preparable actions. Confirmation tokens are server-issued and bound to the resolved employee, capability, arguments, and revision. Idempotency prevents duplicated writes after retries, and postcondition checks distinguish a claimed success from a result the application can actually observe. The evaluation dashboard presents retained run artifacts as a product surface that anyone reviewing quality can inspect.

## Methodology

The evaluation program tests seven multi-turn workflow families, fourteen held-out rewordings, five OWASP-mapped safety scenarios, fifty-seven recorded voice sessions, tool recovery, factual support, latency, interruption handling, and cost. It also replays 764 turns without incurring live-model cost. Runs retain versions, denominators, failure categories, and the exact fixes applied, so an improvement can be traced to a concrete behavior change.

Evaluation is deliberately broader than task completion. It checks whether the guide used supported facts, selected the intended tool, respected confirmation boundaries, survived rewording, recovered after failure, and produced the expected application state. Safety scenarios cover prompt injection, cross-user access, confirmation substitution, replay, and attempts to escape the registered capability surface.

## Results

After the principal fixes, Relay's voice AI agent completed 103 of 110 development conversations across the seven workflow families. A separate held-out set completed 39 of 42 reworded conversations. The evidence also includes 31 of 34 target-selection cases, 24 of 24 deterministic workflow checks, 87 of 100 calibrated answer-quality points, 186 of 187 eventual tool-identifier resolutions, and zero unsafe state changes across 21 recorded safety runs.

The numbers are useful because they retain their denominators and failure categories. They show strong, repeatable behavior while leaving the remaining misses visible enough to guide another iteration.

## Iterative improvement

Early multi-turn runs completed only 26 of 37 conversations. The failure review showed that narrow prompt matching, brittle tool identifiers, and inconsistent recovery were causing otherwise valid requests to stall. Neerav replaced those assumptions with typed capability contracts, semantic target resolution, better state recovery, and versioned replay cases; the post-fix suite then reached the recorded development result.

The model chose the correct record ID on the first attempt in 158 of 187 scored turns. Server-side validation caught all 30 invented IDs and returned real candidates, and 89 of 99 turns with a tool error recovered in the same turn, so the guide eventually reached the correct record in 186 of 187 turns. A separate security probe found four sensitive disclosures in four attempts; moving identity and authorization decisions fully behind server-resolved controls reduced the next recorded set to zero disclosures in five attempts. A proposed key-term prompt change was not adopted because its measured difference was not statistically persuasive, demonstrating that the process can reject an attractive but unsupported tweak.

## Impact

Relay shows how an employee guide can reduce coordination work without surrendering product authority to a model. Employees get a direct path from intent to evidence and action; service teams receive better-formed requests; engineers get explicit provider seams and observable postconditions; and product owners get a versioned quality program that explains both success and failure. The strongest differentiator is the combination of a complete usable portal, live conversational interaction, deterministic action controls, and an evaluation loop that visibly changes the product.

## Scope

The evaluated Northstar environment uses fictional employee records and application-owned calendar, payroll, benefits, and case services. The capability adapters define the integration points for production providers.

## Approved page targets and links

Use the approved target and link metadata in this record's front matter for page actions; it is not narrative content.
