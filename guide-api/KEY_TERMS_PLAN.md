# Key terms plan: keep answers simple, name the technology

Goal: every answer still leads with what the work does for people, as it does today, and also names the field and core technology of the work it describes ("computer vision", "voice AI agent", "evaluation harness"). Each term appears once, inside a plain sentence that says what it does. Nothing else about the answers changes.

## Baseline checkpoint (2026-10-14)

The current answers are the quality bar. They are saved so every change is compared against them:

| What | Where |
| --- | --- |
| Code that produced them | git tag `guide-baseline-round-3` (commit `dfe804a`, live on the site and Worker) |
| Knowledge version | `ed3f87fb3d69` |
| 70 answers to the 60 rubric cases, with page moves and tour narration | `eval/feedback/round-3-baseline.json` (readable transcript: `round-3-baseline.txt`) |
| Scenario checks | `eval/feedback/round-3-baseline-scenarios.txt`: 16/16 pass |

How often today's answers name each project's lead terms, among answers that discuss that project:

| Project | Answers discussing it | Names its lead term |
| --- | --- | --- |
| Relay | 42 | voice AI 1, LLM agent or tool calling 3 |
| Refract | 19 | RAG or retrieval 3 |
| Homeward | 22 | AI agents 5, MCP 0 |
| Birb Hangout | 10 | realtime multiplayer 1 |
| Brain atrophy study | 11 | computer vision 3, OpenCV 3 |
| Four-class MRI study | 9 | deep learning or CNN 8 |
| Deep Strat | 6 | LLM workflow 4 |

Overall: 1.0 technical term per 100 words; 7 of 70 first sentences name a technology. The general rule added in round 3 ("plain language still names the field and the core technology") barely moved this, so the fix needs per-project terms rather than a broader instruction.

## Key terms by section

**Lead** terms are said whenever the section is described, once, glossed in the same sentence. **Supporting** terms come in only when the visitor asks how it was built, about tools, or about fit for a role. Every term is already backed by the section's own source in `content/guide/`.

| Section | Lead terms | Supporting terms | Plain gloss to pair with the lead term |
| --- | --- | --- | --- |
| Profile and strengths | AI product engineering, interaction design, evaluation harness engineering* | LLM agents, voice AI, computer vision, human-in-the-loop design | "builds the AI feature, the interface people use, and the tests that prove it works" |
| Relay | voice AI agent, tool calling | Deepgram Voice Agent (Nova-3, GPT-4.1), confirmation-gated actions, evaluation harness*, replay testing, Playwright, React, TypeScript, Fastify, OWASP-mapped safety tests | "a voice AI agent that uses tool calling to complete the request after the employee confirms" |
| Refract | retrieval-augmented generation (RAG) | vector search with ChromaDB and sentence-transformer embeddings, spaced repetition (FSRS), statistical modeling (regression, random forest, leakage checks), FastAPI, PostgreSQL, React | "uses RAG, so every answer is drawn from, and points to, the exact paper and page" |
| Homeward | multi-agent AI, Model Context Protocol (MCP) | role-scoped tools, human-in-the-loop approval, prompt-injection and failure testing (32 scenarios), Synthea synthetic data, React, Express, SQLite | "four AI agents, each limited by MCP to only the tools its role allows" |
| Birb Hangout | realtime multiplayer 3D | React Three Fiber, Three.js, Colyseus, WebRTC voice, Rapier physics, procedural terrain, Blender, human-in-the-loop visual QA tools | "a realtime multiplayer 3D world, so friends share the same room live" |
| Brain atrophy study (IEEE) | computer vision, medical imaging | OpenCV, Python, image segmentation, interpretable measurement, ADNI MRI | "a computer vision method that turns each MRI scan into a score anyone can recompute" |
| Four-class MRI study | deep learning, convolutional neural networks (CNNs) | ensemble learning, TensorFlow, Keras, data augmentation, hyperparameter tuning, ADNI MRI | "deep learning models (CNNs) that sort MRI scans into four stages of dementia" |
| Deep Strat | LLM workflow, AI safety | churn prediction (Random Forest, AUC), SOP-grounded routing, guardrails, model failure modes, Nullcon, forward-deployed AI | "a three-stage LLM workflow that turns raw complaints into routed cases" |
| Tech stack and skills | (named on request) | PyTorch*, TensorFlow, Keras, scikit-learn, OpenCV; OpenAI, Anthropic Claude, Hugging Face, LangChain, Deepgram; TypeScript, React, Python, FastAPI, SQL | — |

\* Needs your confirmation, see the open questions.

Example of the intended change, using baseline answer 1.3 ("What makes Relay more than a demo?"). Only the second and third sentences change:

> Relay is built like a real product, with its own quality program. An employee can ask for something by voice or text, and **Relay's voice AI agent** answers from their own records, then completes the request **through tool calling** only after they confirm, and checks afterward that the change actually happened. Neerav tested it **with an evaluation harness** of 110 realistic multi-step conversations, and it completed the request correctly 103 times. …

## How it gets into answers

1. **Term registry.** `content/guide/key-terms.json` holds the table above: lead, supporting, and gloss for each section. It is the single source, so the site, the guide, and the checks all agree.
2. **Knowledge.** The knowledge build adds one line to each section, "Key terms: …", next to its plain-language summary. A build check fails if a lead term never appears in that section's "In plain terms" paragraph, so the model always sees each term used plainly in context. Where a summary lacks a lead term today (Relay: voice AI agent; Refract: RAG; Homeward: MCP; Birb Hangout: realtime multiplayer), I add it in one clause, and you review those edits.
3. **One prompt rule** replaces the current general one: when describing a section, name one or two of its lead terms once, in a sentence that also says what they do for people; never open an answer with a term unless the question is about technology; never put more than two technical terms in a row; supporting terms only for how-it's-built, tool, or role-fit questions.

## Guardrails against regression

An automated comparison (`eval/compare.mjs baseline candidate`) runs the same 60 cases and blocks the change unless all of these hold:

| Check | Pass condition | Baseline |
| --- | --- | --- |
| Lead-term coverage | Each project's lead term appears in at least 70% of answers that discuss it | 0% (Homeward MCP) to 89% (MRI deep learning) |
| Simple first sentence | First sentence names a technology only when the question asks about technology | 7 of 70 |
| Density ceiling | At most 4 technical terms per 100 words in any answer; no run of 3 or more technical terms in a row outside stack questions | 1.0 average |
| No vague jargon | Zero uses of filler such as leverage, robust, seamless, cutting-edge, state-of-the-art, synergy, best-in-class, next-generation, plus the knowledge audit's prohibited phrases | 0 of 70 |
| Same length | Each answer within 20% of its baseline length and under the 130-word spoken limit | per answer |
| Facts kept | Every metric and project named in a baseline answer still appears in the candidate | per answer |
| Behavior kept | Scenario suite passes; the same page moves and tours for each case | 16/16 |

After the automated checks pass, you review a side-by-side sheet of about 15 representative cases (baseline left, candidate right, changed words highlighted) before anything is deployed. If any answer reads worse, the change does not ship.

## Rollout

1. You confirm the term table and the open questions.
2. I add the registry, knowledge lines, plain-terms edits, prompt rule, and comparison script, and run the candidate locally.
3. The comparison report and side-by-side sheet go to you.
4. On approval, deploy the Worker and site as before. The baseline tag stays as the rollback point.

## Open questions

1. **Harness engineering.** Which work should carry it? The sources support it for Relay (evaluation harness that replays 764 turns and scores 110 conversations) and Homeward (scenario runner shared with the domain tests), and arguably the 3D review studios in Birb Hangout. Should it also be a lead strength in the profile?
2. **PyTorch.** No project source says a project used PyTorch (the MRI study is TensorFlow and Keras). The plan keeps PyTorch to tech-stack and skills answers so the guide never attributes it to a project. Is that right, or did a project use it?
3. **Interaction design.** Lead term for the profile only, or also for each product (it fits Relay's guide, Refract's recall flow, and Birb Hangout's consent-based interactions)?
4. **Missing terms.** Anything you want named that is not in the table, for example forward deployed engineering, human-in-the-loop, AI safety, or full-stack?
