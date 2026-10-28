# Neerav Chaudhary

Source: https://neerav-git.github.io/writing/what-reliable-should-mean-for-llms-in-life-sciences
Description: A public record of work, projects, research, and technical writing by Neerav Chaudhary.

APPLIED AI
Engineering source-grounded LLM workflows for research

Concrete controls for source selection, passage citation, structured grading, uncertainty, and repeatable evaluation in research software.

PUBLICATION DETAILS

June 10, 2026

Applied AI

REFERENCES AND FILES
Refract case study
IMPLEMENTED READER, COMPARE, REVIEW, AND STATS WORKFLOWS.
Refract repository
SOURCE FOR RETRIEVAL, GRADING, PROVENANCE, AND EXPORT BEHAVIOR.
ON THIS PAGE
APPLIED AI
A grounded answer needs a traceable source path

The system must record the selected documents, retrieved passages, prompt, model output, and evaluation result for each consequential research interaction.

Refract implements these controls for paper questions, cross-paper synthesis, and active-recall grading.

CONTROL MODEL
Four records make an LLM result reviewable
SCOPE
Selected source set

Record the papers and research question supplied to retrieval or synthesis.

EVIDENCE
Passage and page references

Store the exact excerpts used for the answer and keep their document identifiers.

GENERATION
Prompt and model version

Retain the instructions, model name, structured schema, and generated result.

EVALUATION
Rubric and reviewer output

Record dimension scores, rubric hits, omissions, feedback, and any sampled human grade.

RETRIEVAL
The source set constrains the answer before generation

A session identifies the active papers and question before document chunks enter retrieval.

Refract indexes document chunks in ChromaDB and keeps paper records in PostgreSQL. Reader questions begin from the active document or selected passage. Compare begins from a chosen paper set and research question.

These inputs define the material available to the model and allow the final output to list its coverage. Missing evidence becomes visible as missing coverage instead of being hidden inside fluent prose.

ACTIVE RECALL
Structured grading separates three kinds of error

Free-recall answers are scored on the core claim, reference details, and faithfulness to the source.

The grader returns structured fields for rubric hits, missing points, corrective feedback, and dimension scores. Refract also records the learner's confidence before source reveal.

Human-grade export supports inter-rater checks on a sample of attempts. Model name, prompt version, reveal mode, and source reference remain attached to each row so disagreements can be investigated.

EVALUATION LOOP
A model change should pass the same recorded cases
FREEZE
Freeze the case inputs

Keep the research question, selected sources, expected points, and rubric version stable.

RUN
Run the candidate

Record the model, prompt, retrieved passages, structured output, and latency.

COMPARE
Compare dimensions

Measure core-claim coverage, reference-detail coverage, faithfulness, and reviewer agreement separately.

INSPECT
Inspect failures

Review unsupported statements, missed evidence, retrieval gaps, and rubric disagreement by category.

RELEASE
Release with a bounded claim

Describe the tested cases, observed result, and untested populations or workflows.

CURRENT EVIDENCE
Refract implements the measurement path

The repository contains passage references, structured recall grading, version fields, FSRS state, and human-grade export.

Those records support technical evaluation of model behavior. Claims about improved retention or scientific decision quality require a completed user study with a registered protocol, comparison condition, and analyzed outcomes.
