# Neerav Chaudhary

Source: https://neerav-git.github.io/writing/measuring-emergency-guidance-in-health-chatbots
Description: A public record of work, projects, research, and technical writing by Neerav Chaudhary.

AI SAFETY & EVALUATION
Can a supporting model catch the emergencies health chatbots miss? Results from TraceLens

General-purpose chatbots miss emergencies or do not clearly state them to the patient. TraceLens, a self-built AI safety and evaluation workspace, tested a supporting model, Vega, that reads the patient's message independently: it reached held-out AUC 0.966, caught 18 of the chatbot's 31 missed emergencies with each flag disclosed, and raised final emergency guidance from 39 to 47 of 70.

PUBLICATION DETAILS

October 27, 2026

AI Safety & Evaluation

REFERENCES AND FILES
TraceLens case study
ARCHITECTURE, EVALUATION DASHBOARD, TOOLS, AND MEASURED RESULTS.
ON THIS PAGE
THE QUESTION
General-purpose chatbots miss emergencies or do not clearly state them to the patient. Can a supporting model both reduce under-triage and make failures transparent to the end user?

TraceLens is a self-built AI safety and evaluation workspace built to answer that question. Vega, a supporting model, reads the patient's message independently of the chatbot. When the two disagree, the chatbot reconsiders with the flag disclosed to the user, and every step from first answer to final action is recorded and scored against physician labels.

Models: Gemma 3 4B-it as the chatbot; Vega with Qwen3.5 readers as the supporting model.

WHY THE ACTION MATTERS
An answer can describe the right condition and still leave the person with the wrong next step

Published audits of consumer health chatbots, including Ramaswamy et al. in Nature Medicine (2026), found that models often under-triage emergencies: they recognize the danger and then recommend a slower level of care, or mention emergency care only as a condition. For a person deciding whether to go to the emergency room, the recommended action is the part of the answer that matters most.

TraceLens therefore scores the action. Each answer is mapped to one care level (emergency, same-day, routine, or self-care) and compared with a physician label. A supporting model is judged on two numbers at once: how many missed emergencies it recovers, and how many non-emergencies it sends to emergency care unnecessarily.

SYSTEM DESIGN
The support loop and the evidence layer

The chatbot and Vega read the same patient message independently. A recommendation reader extracts the advised action. Disagreement triggers a reconsideration with the flag disclosed to the user, and the final action is stored with an evidence receipt.

Every study runs from hash-pinned bundles on Kaggle or Colab GPUs and is scored by analysis code frozen before results are opened.

DECISION MODEL
The cascade decision model behind Vega

A single frozen Qwen3.5 reader feeds four task heads: emergency boundary, a four-action decision, information sufficiency, and broad care level. The output carries the action, the exact patient words behind it, and the details still needed, and it abstains when information is short.

Its training package holds 917 development records, with 181 validation and 135 protected test prefixes stored and hashed apart.

METHOD
How each study was run
1
Pin everything

Cases, prompts, model revision, and decoding settings are hashed into a bundle before any GPU time is used.

2
Fix the analysis first

Outcomes, comparisons, and decision rules are written into a preregistration, and the analysis code is committed before the results are read.

3
Run on cloud GPUs

A resumable runner executes bundles on Kaggle 2×T4 or Colab; the importer accepts results only when every hash and split boundary matches.

4
Read the advised action

The scope-aware recommendation reader, validated on held-out physician answers at 90% emergency precision, maps each answer to a care level.

5
Test with paired statistics

Each safeguard is compared with the baseline on the same cases using McNemar tests and Wilson or bootstrap intervals.

RESULT 1 · THE SUPPORTING MODEL
Vega reached held-out AUC 0.966, accurate enough for its flags to be shown to a person

A supporting model helps only if its flags are right often enough to act on. Across 70 held-out emergencies and 134 non-emergencies, Vega's 4B head reached AUC 0.966: it ranks a true emergency above a non-emergency 97% of the time. It flagged 55 of 70 emergencies with 10 false alarms, Brier score 0.083 and calibration error 0.089. On the same 125 cases, it ranked emergencies at 0.92 against 0.76 for Gemma's own pre-answer likelihood, a difference of 0.157 (95% CI 0.047–0.271).

Right panel: the rebuilt recommendation reader, frozen before held-out scoring, raised emergency precision from 74% to 90%, so the chatbot's misses are counted accurately.

RESULT 2 · TRANSPARENCY LOOP
Vega caught 18 of the chatbot's 31 misses, disclosed each one, and final emergency guidance rose from 39 to 47 of 70

The replay joined 277 saved cases from five sources. The chatbot's first answer gave emergency guidance to 39 of 70 emergencies. Vega flagged 18 of the 31 misses, and each flag was disclosed to the user. With the flag in view, the chatbot corrected 8 of those 18, and false alarms moved from 4 to 5 of 134.

Audit P1-20261026T110000Z. Each stage is counted separately, so the contribution of detection and of reconsideration can be read directly.

READING RESULT 2
Accuracy keeps the false-alarm cost to one case, and disclosure makes every flagged miss visible

Because Vega is accurate, the loop adds emergency guidance in a narrow set of cases: only where an independent reader of the message sees an emergency the answer missed. That precision is why the final false-alarm count rose by one case.

Disclosure answers the second half of the question. On every flagged case the person sees that the safety model and the chatbot disagreed, including the 10 cases the chatbot did not correct. The replay also measures each step on its own: detection caught 18 of 31 misses, and reconsideration converted 8 of those 18, which identifies reconsideration as the step with the most headroom.

RESULT 3 · THE PROBLEM, MEASURED
The plain chatbot under-triaged 15 of 39 emergencies; a commit-first prompt raised guidance to 35 with 18 false alarms

With a plain prompt, Gemma 3 4B gave 15 of 39 physician-labelled emergencies less than emergency care: 6 with no clear recommendation, 5 with same-day care, 2 with routine care, and 2 with self-care. In 7 of those 15 answers, emergency care appeared only as a condition ("go to the ER if…").

Commit-first: +28.2 points on emergencies (95% CI 11.8–43.5, p = 0.003), with false alarms rising from 1/77 to 18/77. Likelihood monitor: 32/39 with 15/77. Self-check: 25/39 with 34/77.

READING RESULT 3
Prompting alone rescues emergencies at a visible false-alarm price

The commit-first prompt asks the model to choose one care level before explaining. It produced the largest gain in emergency guidance among the four prompt policies, and plotting each policy by both of its costs makes the trade visible: the same instruction that rescued 11 emergencies also sent 17 more non-emergencies to emergency care. The Vega loop recovered emergencies with one added false alarm, which is why the supporting model leads these results.

The study also measured the chatbot's internal signal. Before writing any text, Gemma's likelihood of continuing with emergency advice ranked emergencies above non-emergencies at AUC 0.858 across 91 held-out cases, and 0.91 on HealthBench. Vega, reading only the message, ranked them higher on the shared cases.

RESULT 4 · MULTI-TURN CONVERSATIONS
A care-seeking protocol raised turn-by-turn accuracy for all 11 models

Real symptom conversations unfold over several turns. The trajectory evaluator scored 2,970 released CARE-Bench predictions from 22 model and protocol systems on 135 conversation prefixes. With the protocol, Mistral Large 3 rose from 41% to 63% and Claude Opus 4.7 from 50% to 64%.

Audit P2-20261026T120000Z, conversation-cluster bootstrap with 1,000 resamples. The evaluator also reports premature action, failure to update, and oscillation.

TAKEAWAYS
What the results show
ACCURACY
An independent supporting model is accurate enough to act on

Vega reached held-out AUC 0.966 and out-ranked the chatbot's own emergency likelihood, 0.92 against 0.76.

UNDER-TRIAGE
The loop recovers missed emergencies at almost no cost

Final emergency guidance rose from 39 to 47 of 70 with one added false alarm in 134 non-emergencies.

TRANSPARENCY
Disclosure makes every disagreement visible

Each flag is shown to the user, so cases the chatbot did not correct still reach the person as a stated disagreement.

THE PROBLEM
Open-weight models reproduce the published pattern

Gemma 3 4B under-triaged 15 of 39 physician-labelled emergencies; commit-first prompting raised guidance to 35 with 18 false alarms.

SYSTEMS
Separate records make each step measurable

Splitting answer, detection, reconsideration, and final action showed which step produced each gain.

ARCHITECTURE
A decision model built for review

Every decision carries its action, the exact patient words behind it, and the details still needed, with abstention when information is short.

TOOLS AND METHODOLOGY
What the work used
MODELS
Gemma 3 4B-it, Qwen3.5 0.8B and 4B

Pinned Hugging Face revisions; Vega engine via vegaml 0.12.4.

STACK
Python, PyTorch, Hugging Face Transformers

Inference, hidden-state capture, likelihood probes, and PCA plus logistic-regression heads.

COMPUTE
Kaggle 2×T4, Google Colab, Apple M3

Resumable notebook runs with hash-verified import.

DATA
Physician-labelled benchmarks

HealthBench, Ramaswamy et al. 2026, Semigran, Levine, and CARE-Bench.

STATISTICS
Paired and calibrated

McNemar, Wilson and bootstrap intervals, AUC, Brier score, ECE.

PRACTICE
Preregistration and blinded review

Frozen analysis code, dev / held-out / sealed splits, and a blind human-reading desk.
