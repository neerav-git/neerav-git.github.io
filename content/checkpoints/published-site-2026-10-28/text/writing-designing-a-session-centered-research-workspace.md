# Neerav Chaudhary

Source: https://neerav-git.github.io/writing/designing-a-session-centered-research-workspace
Description: A public record of work, projects, research, and technical writing by Neerav Chaudhary.

SYSTEM DESIGN
Designing one research session across reading, recall, and analysis

A shared session ID connects papers, passages, review attempts, datasets, and model runs across five implemented workspaces.

PUBLICATION DETAILS

June 12, 2026

System design

REFERENCES AND FILES
Refract case study
PRODUCT SCREENS, IMPLEMENTATION DETAILS, AND EVALUATION BOUNDARIES.
Repository
FRONTEND, BACKEND, DATA MODEL, AND RESEARCH DOCUMENTATION.
ON THIS PAGE
SYSTEM DESIGN
One session ID joins five research workspaces

Reader, Index, Compare, Review, and Stats write distinct records that share the research goal, selected sources, and session identifier.

The data model connects a final claim to the passage, review attempt, dataset, or analysis run that produced it.

DATA MODEL
Each workspace writes a defined record
READER
Passages and answers

Document ID, page location, selected text, prompt, response, and saved evidence.

COMPARE
Question and source set

Research question, selected papers, synthesis output, and citation coverage.

REVIEW
Recall attempt

Prompt, learner answer, confidence, rubric scores, feedback, source reveal mode, and FSRS state.

STATS
Analysis run

Dataset identity, profile, audit findings, predictors, model settings, metrics, charts, and interpretation notes.

RESEARCH SEQUENCE
The same sources support reading, retrieval practice, synthesis, and modeling
CREATE
Create a session

Set the research goal and attach the relevant papers.

READ
Read and save passages

Select exact text, ask grounded questions, and store evidence with page references.

RECALL
Practice recall

Answer before source reveal, score three dimensions, and schedule the next review with FSRS.

COMPARE
Compare selected papers

Run one question across a bounded source set and store agreements, differences, and coverage.

ANALYZE
Analyze a dataset

Profile variables, audit leakage, compare baselines, and attach model metrics to the session.

COMPARE
A bounded paper set makes synthesis traceable

The Compare workspace receives the selected question and papers, then records which sources contribute to the result.

Cross-paper comparison interface from the public repository.

REVIEW
Retrieval practice produces analyzable learning data

A review attempt includes the learner response, self-rated confidence, grading output, revealed source, and scheduling update.

Refract scores the core claim, reference details, and faithfulness through structured model output. It records rubric hits, omissions, feedback, model name, prompt version, and source reveal mode. A human-grade export supports agreement checks against sampled attempts.

FSRS state schedules the next attempt. The planned retention study remains separate from the implemented instrumentation.

STATS
Analysis records include predictors, audit decisions, and metrics

Battery remaining-useful-life runs record column profiles, leakage findings, baseline results, Linear Regression, Random Forest, MAE, RMSE, R², and literature alignment notes.

Stats interface for the battery analysis workflow.

ENGINEERING CONSEQUENCE
Traceability depends on IDs and stored records

The interface can expose provenance because the backend stores the links explicitly.

PostgreSQL records relational data for sessions, papers, evidence, reviews, and analyses. ChromaDB indexes document chunks for retrieval. File storage holds PDFs and datasets. FastAPI routes validate operations across those stores, while the React/Vite client presents the five task-specific workspaces.
