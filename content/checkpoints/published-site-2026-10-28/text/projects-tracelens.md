# Neerav Chaudhary

Source: https://neerav-git.github.io/projects/tracelens
Description: A public record of work, projects, research, and technical writing by Neerav Chaudhary.

AI SAFETY & EVALUATION WORKSPACE · BUILT AND EVALUATED · 2026
TraceLens

General-purpose chatbots miss emergencies or do not clearly state them to the patient. Can a supporting model both reduce under-triage and make failures transparent to the end user?

TraceLens is a self-built AI safety and evaluation workspace that tests this question. Vega, a supporting model, reads the patient's message independently of the chatbot. When the two disagree, the chatbot reconsiders with the flag disclosed to the user, and every step from first answer to final action is recorded for review.

ROLE
I designed and built the workspace, the study protocol, the GPU runner, the recommendation reader, the Vega detector head, and the decision-model architecture, ran the preregistered studies on Kaggle and Colab, and analyzed the results.

SUMMARY

Evaluated safety system. A supporting model, a disclosed reconsideration loop, and a preregistered held-out study, each measured on physician-labelled cases.

Build, evidence, and scope ↓
SKILLS APPLIED
LLM Evaluation
Harness Engineering
Python
PyTorch
Hugging Face
Statistical Testing
Interpretability
BUILD, EVIDENCE, AND SCOPE
ON THIS PAGE
THE ANSWER
A self-built workspace that catches missed emergencies and shows the person when the chatbot and the safety model disagree

TraceLens pairs the chatbot with Vega, a supporting model that reads the patient's message on its own. Vega's accuracy decides whether its flags are worth acting on: at held-out AUC 0.966 it caught 18 of the chatbot's 31 missed emergencies. Each disagreement is disclosed, the chatbot reconsiders, and the first answer, the flag, the reconsideration, and the final action are stored as separate records.

Delivered: an independent emergency detector, a disclosed reconsideration loop, a preregistered study, and a cascade decision-model architecture.

ARCHITECTURE
Two independent readers of the same message, joined by a disagreement check

Gemma 3 4B answers the message. Vega reads the same message without seeing the answer. A recommendation reader extracts the action the answer advises. When the two disagree, the chatbot reconsiders with the detector flag disclosed, and the final action is stored with an evidence receipt.

The evidence layer under the loop runs every study from hash-pinned bundles through a resumable GPU runner, verified import, frozen analysis, and blinded human review.

THE WORKSPACE
One workspace runs, scores, and audits every study

The TraceLens workspace is a local Python application with three views. Observability tracks each selected run with its receipts, hardware, and evidence records. Training Lab plans model runs, exports hash-pinned bundles to Kaggle or Colab GPUs, and imports results only after every hash and split boundary checks out. Baseline Lab holds the study protocol, the outcome and slice analysis, the blinded review desk, and the gate decisions for each study.

Values shown in the workspace come only from real run records. Studies move through the same sequence: pin the cases, prompts, and model revision; fix the analysis code; run on GPUs; import with verification; read the advised action; and compare arms with paired statistics.

WHAT WAS BUILT
An evaluation platform, a validated answer reader, and a fast emergency detector

Evaluation platform. Every run starts from a bundle that pins the cases, prompts, model revision, and decoding settings by hash. A resumable runner executes bundles on Kaggle 2×T4 GPUs, Google Colab, or a local Apple M3 machine, and an importer accepts results only when every hash and split boundary checks out. Analysis code is committed and frozen before results are opened.

Recommendation reader. Health answers often list several options under headings. The reader extracts the recommendation clauses themselves, including imperatives, deadlines, negation, and conditional phrases such as "go to the ER if…". It was tuned on a development split of physician-written HealthBench answers and frozen before held-out scoring, where its emergency calls matched the physician answer 27 of 30 times, up from 29 of 39 for the earlier keyword scorer.

Vega emergency detector. Vega turns a patient message into features from a pinned Qwen3.5 reader model and scores it with a PCA and logistic-regression head. Its decision threshold is locked on development data with grouped folds. On held-out messages the 4B-reader head reached AUC 0.966, flagged 55 of 70 emergencies, and raised 10 false alarms on 134 non-emergencies, with Brier score 0.083 and calibration error 0.089.

Support loop and trajectory evaluation. A replay engine joins saved chatbot answers, Vega verdicts, and reconsiderations into the final displayed action for each case. A separate trajectory evaluator scores multi-turn conversations prefix by prefix, measuring premature action, delayed updating, and oscillation.

DECISION MODEL ARCHITECTURE
A cascade decision model with four task heads, evidence spans, and abstention

The decision model reads a single message or a multi-turn conversation through one frozen Qwen3.5 reader. Four heads answer separate questions: whether this is an emergency now, which of four actions fits, whether there is enough information to act, and the broad level of care. The output carries the action, the exact patient words behind it, and the details still needed, and it abstains when information is short.

The training package holds 917 development records with 181 validation and 135 protected test prefixes stored apart, plus a 2,256-record weak-label pool used only where two independent teachers agree.

MEASURED RESULTS
Results, led by the supporting model

Vega comes first because every downstream gain depends on its flags being accurate. All counts come from physician-labelled cases scored by frozen analysis code.

0.966
Vega held-out AUC
Ranks a true emergency above a non-emergency 97% of the time; 55/70 emergencies flagged, 10/134 false alarms, Brier 0.083, ECE 0.089.
18 / 31
Chatbot misses caught by Vega
Each flag was disclosed to the user, so the disagreement was visible on every case.
39 → 47
Final emergency guidance, of 70
Reconsideration corrected 8 flagged misses; false alarms moved from 4/134 to 5/134.
0.92 vs 0.76
Vega vs the chatbot's own lean
Vega out-ranked Gemma's pre-answer emergency likelihood on the same 125 cases; difference CI −0.271 to −0.047.
15 / 39
Emergencies under-triaged by the plain chatbot
Gemma 3 4B gave less than emergency care on held-out physician-labelled emergencies.
24 → 35
Commit-first prompt, emergencies of 39
+28.2 points, 95% CI 11.8–43.5, McNemar p = 0.003; false alarms 1/77 → 18/77.
90%
Answer-reader precision
27/30 on held-out physician answers, up from 74% (29/39) for the keyword scorer.
917
Decision-model training records
HealthBench 248, authored cases 60, CARE prefixes 609; validation and protected test stored apart.
RESULT ANALYSIS · SUPPORTING MODEL
Vega's accuracy is what makes its flags worth showing to a person

A supporting model helps only if its flags are right often enough to act on. Vega reached held-out AUC 0.966 across 70 emergencies and 134 non-emergencies, and on the same 125 cases it ranked emergencies at 0.92 against 0.76 for the chatbot's own pre-answer likelihood. Reading the message independently gives a stronger safety signal than asking the chatbot about itself.

Right panel: the rebuilt answer reader, frozen before held-out scoring, raised emergency precision from 74% to 90%, so the chatbot's misses are counted accurately.

RESULT ANALYSIS · TRANSPARENCY LOOP
Vega caught 18 of 31 chatbot misses, disclosed each one, and final emergency guidance rose from 39 to 47 of 70

Across 277 saved cases from five sources, the chatbot's first answer gave emergency guidance to 39 of 70 emergencies. Vega flagged 18 of the 31 misses, and each flag was disclosed to the user. With the flag in view, the chatbot corrected 8 of those 18, and false alarms moved from 4 to 5 of 134.

Each stage is counted separately, so detection, disclosure, and correction can each be measured.

RESULT ANALYSIS · THE PROBLEM, MEASURED
The plain chatbot under-triaged 15 of 39 emergencies; prompting alone traded misses for false alarms

On 39 emergencies and 77 non-emergencies, the plain prompt gave emergency guidance to 24 emergencies. A commit-first prompt raised that to 35 and sent 18 non-emergencies to emergency care. The likelihood monitor reached 32 with 15 false alarms, and the self-check reached 25 with 34.

Each policy is placed by both of its costs, so the gain in emergency guidance and the added false alarms are read together.

RESULT ANALYSIS · MULTI-TURN
A care-seeking protocol raised turn-by-turn accuracy for all 11 models

The trajectory evaluator scored 2,970 released CARE-Bench predictions on 135 conversation prefixes. With the care-seeking protocol, every model chose the correct broad care action on more prefixes; Mistral Large 3 rose from 41% to 63% and Claude Opus 4.7 from 50% to 64%.

Accuracy is counted at every conversation prefix, so a model earns credit only when it updates its advice as details arrive.

STUDY SEQUENCE
Each study fixed its questions and analysis before the data was read
BASELINE
Output-only baseline on cloud GPUs

Ran Gemma 3 4B in float32 across two T4 GPUs and recorded complete answers to emergency and non-emergency cases.

READER
Validated the answer reader

Blind human reading showed the keyword scorer counted headings as advice; the scope-aware reader replaced it and was frozen before held-out scoring.

RESULTS A–C
Preregistered held-out safeguard study

Measured under-triage, compared four safeguard policies with paired tests, and measured the model's pre-answer emergency likelihood.

DETECTOR
Trained and tested Vega

Fit the emergency head on development messages, locked its threshold, and scored 277 held-out messages through a hash-attested Kaggle run.

REPLAY
Measured the complete support loop

Joined answers, detector verdicts, and reconsiderations into final actions, and added the multi-turn CARE-Bench trajectory evaluation.

DECISION MODEL
Designed the cascade and packaged its data

Defined four task heads, extractive evidence, and abstention, and built a hash-manifested 917-record training package with matched Kaggle smoke and full notebooks.

TOOLS AND METHODS
Industry tooling and evaluation methodology
MODELS
Pinned open-weight LLMs

Gemma 3 4B-it as the chatbot; Qwen3.5 0.8B and 4B as Vega's feature readers through the vegaml engine; all loaded by exact Hugging Face revision.

ML STACK
Python, PyTorch, Hugging Face

Transformers inference, hidden-state capture before the answer, continuation-likelihood probes, and PCA plus logistic-regression detector heads.

COMPUTE
Multi-GPU cloud runs

Kaggle 2×T4 and Google Colab notebooks with resumable checkpoints, plus local Apple M3 (MPS) runs for development.

STATISTICS
Paired and calibrated measurement

McNemar tests, Wilson and bootstrap intervals, AUC, Brier score, expected calibration error, and conversation-cluster bootstrap.

INTERPRETABILITY
Mechanism tooling

TransformerLens, circuit-tracer attribution graphs, and Gemma Scope transcoders run end to end on free-tier GPUs.

ENGINEERING
Reproducible evidence

Hash-pinned bundles, fail-closed import contracts, dev / held-out / sealed splits, a blinded review desk, and 300 pytest tests.

MY CONTRIBUTION
Research design, engineering, and analysis

I designed and built the TraceLens workspace; framed the safety question; wrote the preregistrations and frozen analysis code; built the runner, bundle, import, and replay infrastructure; developed and validated the recommendation reader; trained and evaluated the Vega detector heads; ran every study on Kaggle and Colab GPUs, debugging float16 overflow and memory limits on T4 hardware; and designed the support loop and the cascade decision-model architecture with its training package.

PROJECT LINKS
Results article
RESULT ANALYSIS WITH EVERY CHART AND THE STUDY DESIGN.
