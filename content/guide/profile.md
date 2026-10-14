# Neerav Chaudhary — guide profile

## What Neerav is strongest at

Neerav's greatest strength is product vision grounded in the user's perspective. As an AI product engineer, he starts from what a person is trying to get done, then builds complete feature sets and responsive interfaces around it. His deep interest in interaction design shows in software that feels simple and accessible to use while the engineering underneath stays innovative and rigorous.

He demonstrates this across his products. Relay gives employees a voice AI agent they can talk to or type to: it answers from their own records, takes them to the right page, and uses tool calling to complete requests like opening a support case once they say yes. Refract puts an entire research process in one place, from reading papers and capturing evidence through comparing sources, testing recall, and running statistical analysis, and its retrieval-augmented generation (RAG) ties every answer to its source, so researchers stop stitching together half a dozen tools. Homeward uses multi-agent AI to turn confusing hospital discharge paperwork into a clear recovery plan a patient can follow. Birb Hangout gives distant friends a realtime multiplayer 3D space where they can simply spend time together.

He also proves that his products work through harness engineering: he builds evaluation harnesses that test each product against realistic conversations and the ways it could fail. In 110 realistic multi-step conversations, Relay's voice AI agent completed the employee's request correctly 103 times, and it handled 39 of 42 conversations phrased in ways it had never seen.

## Why interview Neerav

Neerav brings something unusual: a wide breadth of knowledge and experience that most applicants do not combine. He has worked across machine learning and AI, education, healthcare, software development, workflow automation, and AI policy and safety research, and he has worked with a wide variety of stakeholders and founders along the way. He is a source of ideas who can take a user problem, research it properly, and turn it into an innovative outcome people can use.

The evidence is concrete. He has built four complete products end to end: Relay, Refract, Homeward, and Birb Hangout. He co-authored peer-reviewed research on analyzing brain atrophy in dementia, published through IEEE. At Deep Strat he consulted the founders and policy researchers on AI safety, guardrails, and model failure modes, and that work supported jointly authored AI-safety research presented at the Nullcon security conference. His master's in Industrial and Engineering Management adds the operational side: users, process, measurement, and delivery.

## Explaining the work in plain terms

Visitors care about what the work does for people. Describe each mechanism by its benefit first, and name its field and core technology (the lead key terms) in the same sentence; go deeper into technique only if they ask how. Use these plain explanations:

- Relay's confirmed actions: Relay's voice AI agent never changes anything for an employee without first showing exactly what it will do and getting a yes, and afterwards it checks that the change really happened. The employee gets a finished result they can trust.
- Relay's evaluation: Neerav built an evaluation harness for Relay. In 110 realistic multi-step conversations, Relay's voice AI agent completed the employee's request correctly 103 times; on 42 conversations worded in ways it had never seen, it succeeded 39 times. That shows it understands people who phrase things their own way.
- Relay's safety testing: across 21 recorded attempts to trick it, including requests for other people's information, it never made an unsafe change.
- Homeward's 32 of 32 safety scenarios: Homeward's multi-agent AI was tested against 32 ways things can go wrong for a patient, such as a reminder created without the patient's approval, another patient's records appearing, a document trying to trick the assistant, or a dropped connection creating a duplicate reminder. It handled every one safely, which means a patient can rely on what it tells them and on what it does.
- Homeward when the AI service is down: the patient can still see their next step, search their discharge papers, and reach their care team, so recovery never stalls on an outage.
- Homeward's sources: every task shows the exact sentence from the discharge papers it came from, so patients and caregivers can check it themselves.
- Refract's grounded answers: Refract uses retrieval-augmented generation (RAG), so every answer shows the exact paper and page it came from, so a researcher can verify a claim in one step.
- Refract's recall testing: learners give their answer and how confident they are before seeing the source, so the tool measures what they actually know.
- Refract's statistics: the analysis pauses for a person to review data problems before any model result is accepted, so conclusions rest on checked data.
- The MRI ensemble: a deep learning computer vision study where combining two differently built convolutional neural networks raised accuracy on scans held back from training from 78 to 85 percent, seven more correct classifications for every hundred scans.
- The brain-atrophy measure: a computer vision method that turns each MRI scan into a simple score anyone can recompute, and focusing on the hippocampus raised accuracy from 66 to 71 percent.
- Birb Hangout's animation review: vague feedback like "the motion feels floaty" became precise, repeatable comparisons, so each fix could be checked by eye and by measurement.

## Direction: why product engineering

Neerav moved from research into product engineering to put his research skills to work where they change outcomes: building rigorous systems with innovative interaction design and real evaluation layers, aimed at education, healthcare, and workflow automation. His research years taught him to define a measurable question, control the conditions, and keep the evidence inspectable, first in the peer-reviewed OpenCV atrophy method and then in the four-class MRI ensemble experiment. Product engineering lets him apply that discipline to systems people use every day, where the interaction itself decides whether the rigor reaches the user.

Each product carries that direction into a specific domain:

- Education and research: Refract turns findings from learning science and research methods into product mechanics. Answer-before-reveal recall, confidence captured before feedback, versioned grading, FSRS scheduling, and review-gated statistics let the product record whether learning and analysis actually improved.
- Healthcare: Homeward brings the care of the imaging research into a patient workflow. Every recovery task is bound to its exact source, uncertainty stays explicit as durable state, and deterministic services keep authority over clinical wording, dates, and approvals.
- Workflow automation: Relay and the Deep Strat LLM workflow turn ambiguous service requests into structured, confirmed, verified outcomes, with versioned evaluation that converts each failure into an engineering fix.

Interaction design is part of that rigor. Relay's voice guide moves the page to the evidence it used, Refract makes recall visible before the answer appears, Homeward shows the source behind every step, and Birb Hangout builds consent and co-presence into its social interactions. The thread across his work is consistent: a research question about what helps people, an interaction that makes the answer natural to use, and an evaluation layer that shows whether it worked.

## Experience framing

Neerav has about four years of hands-on AI and applied research experience across a 2022 medical-imaging research role, a 2023 AI research internship at Deep Strat, graduate work from 2024 to 2026, and four complete product builds.

His background combines a bachelor's degree in Computer Engineering from Manipal University Jaipur and a master's degree in Industrial and Engineering Management from San Jose State University. That combination supports both technical implementation and the operational questions around users, process, measurement, and delivery.

## Role fit

### Applied AI engineer or AI product engineer

Neerav is a strong fit. He builds AI features people can trust inside complete products: Relay's voice AI agent uses tool calling to complete real employee requests with confirmation, Homeward's multi-agent AI helps patients follow discharge instructions safely, and Refract's retrieval-augmented generation (RAG) keeps research answers tied to their sources. He works across the full stack, from React and TypeScript interfaces to Python, FastAPI, Fastify, Express, and SQL backends, and he builds the evaluation harness that proves the feature works.

### Forward deployed engineer

Neerav is a strong fit. At Deep Strat he sat with department leadership and the founders to turn messy customer-feedback problems into a working LLM workflow, and he advised on AI safety and failure modes. In his own products he takes an ambiguous operational problem, designs the workflow around the people involved, integrates the tools it needs, and iterates quickly from measured failures. That is the core of forward deployed work: understanding the customer, building fast, and proving the result.

### ML or research engineer in healthcare

Neerav is a strong fit. He co-authored a peer-reviewed IEEE study that uses computer vision to measure brain atrophy from MRI scans, built a deep learning study whose convolutional neural networks improved four-class dementia classification through model ensembling, and built Homeward, a multi-agent AI product that helps patients follow discharge instructions safely. He brings image analysis, careful experimental design, neural network tuning, and an understanding of how clinical workflows actually reach patients.

### Realtime or interactive product engineer

Neerav is a strong fit. Birb Hangout is a deployed realtime multiplayer 3D world built with React Three Fiber and Colyseus, with live voice, synchronized media, consent-based social interactions, flight, procedural terrain, and his own tools for judging animation quality.

## Project scope framing

All six works are real, implemented, and measured: Relay, Refract, Homeward, and Birb Hangout are working products with recorded evaluations; the brain-atrophy study is peer-reviewed IEEE research; and the four-class MRI study is a complete deep learning research study. Scope details are side facts for direct questions:

- Relay runs in a realistic sample company with sample employee records, and it is built to connect to production HR, ticketing, calendar, and messaging systems through adapters designed for that purpose.
- Refract already records what it needs for long-term learning and grading studies.
- Homeward was tested with sample discharge papers and synthetic patient histories, which let it safely test situations such as cross-patient access and approval bypass; Neerav is continuing its development toward launch.
- Birb Hangout is live and playable; large-scale load testing is its next operational step.
- The two imaging studies are retrospective research on existing scans, which is the standard first stage before clinical studies.

## Handling gaps

When a requested skill is outside the recorded portfolio, state that once, then identify the closest implemented evidence and how quickly it transfers. Docker and single-service deployment support container questions; Relay's adapters and service contracts support unfamiliar integrations.
