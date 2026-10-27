---
slug: tracelens
approvedTargets:
  - project.tracelens
  - project.tracelens.methodology
  - project.tracelens.2-two-independent-readers
  - project.tracelens.3-one-workspace-runs
  - project.tracelens.4-an-evaluation-platform
  - project.tracelens.5-a-cascade-decision
  - project.tracelens.6-results-led-by
  - project.tracelens.7-vega-s-accuracy
  - project.tracelens.8-vega-caught-18
  - project.tracelens.9-the-plain-chatbot
  - project.tracelens.10-a-care-seeking
  - project.tracelens.11-each-study-fixed
  - project.tracelens.12-industry-tooling-and
  - project.tracelens.13-research-design-engineering
  - project.tracelens.links
approvedLinks:
  - link.tracelens.results-article
metricIds:
  - tracelens-commit-first-24-to-35
  - tracelens-support-loop-39-to-47
---

# TraceLens

## In plain terms

The problem: general-purpose chatbots miss emergencies or do not clearly state them to the patient. TraceLens asks whether a supporting model can both reduce that under-triage and make the chatbot's failures transparent to the person reading the answer.

TraceLens is a self-built AI safety and evaluation workspace that tests this question. Vega, a supporting model, reads the patient's message independently of the chatbot. When Vega and the chatbot disagree, the chatbot reconsiders with Vega's flag disclosed to the user, and every step from first answer to final action is recorded and scored against physician labels. An LLM evaluation platform reads the exact care level each answer recommends, and every study was planned and its analysis code frozen before the results were opened.

The headline result is Vega's accuracy, because a supporting model helps only if its flags are right often enough to act on. Vega reached a held-out AUC of 0.966, meaning it ranks a true emergency above a non-emergency 97 percent of the time. Reading the message independently, it caught 18 of the chatbot's 31 missed emergencies and disclosed each flag, and final emergency guidance rose from 39 to 47 of 70 with only one added false alarm.

## Outcome

TraceLens delivered an independent supporting model (Vega), a disclosed reconsideration loop, a preregistered study of emergency guidance on physician-labelled cases, and a cascade decision-model architecture with its training package. The workspace separates four steps that are usually blended into one accuracy score: the chatbot's first answer, Vega's decision, the reconsideration, and the action the person finally sees. Each step is stored as its own record with the model revision, dataset hash, and disagreement status, so the gain from each step can be measured directly and every disagreement is visible.

## Neerav's contribution

Neerav framed the safety question, wrote the preregistrations and frozen analysis code, built the bundle, runner, import, and replay infrastructure, developed and validated the recommendation reader, trained and evaluated the Vega detector heads, ran every study on Kaggle and Colab GPUs, and designed the support-loop architecture and its evidence records.

## User journey

A person sends a phone-style health message. Gemma 3 4B writes an answer, and the recommendation reader extracts the care level the answer advises. In parallel, Vega reads the same message and decides whether it describes an emergency. When the answer and Vega disagree, the chatbot reconsiders with the detector flag disclosed. The final action is shown with an evidence receipt.

## Architecture and tools

The workspace is a local Python application with three views: Observability tracks each run with its receipts and evidence, Training Lab exports hash-pinned bundles to Kaggle or Colab GPUs and verifies the results on import, and Baseline Lab holds the study protocol, outcome analysis, blinded review desk, and gate decisions.

The decision model is a cascade: one frozen Qwen3.5 reader feeds four task heads that decide whether a conversation is an emergency now, which of four actions fits, whether there is enough information to act, and the broad level of care. Its output carries the action, the exact patient words behind it, and the details still needed, and it abstains when information is short. Its training package holds 917 development records, with validation and protected test sets stored apart.

The chatbot is Gemma 3 4B-it, loaded by pinned Hugging Face revision. Vega uses the vegaml engine with Qwen3.5 0.8B and 4B reader models, turning each message into features scored by a PCA and logistic-regression head with a threshold locked on development data. The platform is written in Python with PyTorch and Hugging Face Transformers. Studies run on Kaggle 2×T4 GPUs, Google Colab, and an Apple M3 laptop through a resumable runner, and 300 pytest tests cover the contracts, imports, analysis, and replay. Neerav also ran TransformerLens, circuit-tracer attribution graphs, and Gemma Scope transcoders end to end for interpretability work.

## Methodology

Cases come from physician-labelled public benchmarks: HealthBench, Ramaswamy et al. 2026, Semigran, Levine, and CARE-Bench. Every run starts from a hash-pinned bundle of cases, prompts, and model revision. Development, held-out, and sealed splits are fixed before scoring. Safeguards are compared with the baseline on the same cases using McNemar tests with Wilson and bootstrap intervals. The detector is measured with AUC, Brier score, and expected calibration error. A blinded human-reading desk audits the automated recommendation reader.

## Results

Vega reached a held-out AUC of 0.966 across 70 emergencies and 134 non-emergencies, flagging 55 emergencies with 10 false alarms, Brier score 0.083 and calibration error 0.089. On the same 125 cases it ranked emergencies at 0.92 against 0.76 for Gemma's own pre-answer likelihood, so the independent reader of the message is the stronger safety signal.

In the full support-loop replay on 277 saved cases, the chatbot's first answer gave emergency guidance to 39 of 70 emergencies. Vega flagged 18 of the 31 misses with each flag disclosed, reconsideration corrected 8, and final emergency guidance rose from 39 to 47 of 70 while false alarms moved from 4 to 5 of 134.

The preregistered study measured the problem itself: with a plain prompt, Gemma 3 4B gave 15 of 39 physician-labelled emergencies less than emergency care. The commit-first prompt raised emergency guidance from 24 to 35 of 39, a gain of 28.2 points with p equal to 0.003, and raised false alarms from 1 to 18 of 77. A likelihood monitor reached 32 with 15 false alarms. A multi-turn replay of 2,970 CARE-Bench predictions showed a care-seeking protocol raising turn-by-turn accuracy for all 11 models tested.

## Iterative improvement

Blind human reading showed the first keyword scorer was counting headings and conditional bullet points as advice. Neerav rebuilt it as a scope-aware reader of recommendation clauses, deadlines, negation, and conditionals, froze it, and raised emergency precision on held-out physician answers from 74 percent to 90 percent before any safeguard study was scored.

## Impact

TraceLens gives health-AI teams a tested pattern for emergency safety: an accurate independent supporting model that recovers missed emergencies at almost no false-alarm cost and shows the person every disagreement, with physician-labelled measurement of both the emergencies gained and the false alarms added. Its separate records show which step in a support loop produced each gain.

## Scope

The studies use pinned open-weight models on public physician-labelled benchmarks and released CARE-Bench predictions, run on cloud and laptop GPUs.

## Approved page targets and links

Use the approved target and link metadata in this record's front matter for page actions; it is not narrative content.
