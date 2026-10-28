# Neerav Chaudhary

Source: https://neerav-git.github.io/projects/refract-ai
Description: A public record of work, projects, research, and technical writing by Neerav Chaudhary.

RESEARCH AND LEARNING PLATFORM · ACTIVE BUILD · 2026
Refract

A session-centered research workspace that keeps papers, cited passages, grounded answers, recall attempts, comparison scopes, datasets, analysis decisions, and model results connected to their provenance.

ROLE
I designed the research model and product workflow; built the document reader, evidence index, comparison system, recall and grading pipeline, research exports, session and migration layers, and Stats workspace; and translated the literature review into testable product instrumentation.

SUMMARY

Active build. The core workflow is implemented; research, product refinement, and validation continue.

Build, evidence, and scope ↓
SKILLS APPLIED
Python
RAG
FastAPI
Research Workflows
Model Evaluation
ChromaDB
BUILD, EVIDENCE, AND SCOPE
ON THIS PAGE
PRODUCT OUTCOME
One research session connects the paper page to the analytical decision

A researcher can move from a highlighted passage to a grounded response, saved evidence, a cross-paper comparison, a recall attempt, a rubric result, a scheduled review, a dataset audit, and a model comparison without losing the identifiers and decisions that connect the sequence.

Reader, Index, Compare, Review, and Stats operate as distinct tools over the same persisted research state.

RESEARCH CONTINUITY
Refract stores the relationships that research tools usually leave implicit

The research problem is larger than finding a relevant paragraph. A defensible argument requires the researcher to remember which paper and page supported a note, which sources were included in a synthesis, which evidence shaped a question, what the learner knew before seeing the answer, and which assumptions produced a statistical result. Refract makes those relationships first-class records.

A session has a goal, domain, methodology, population, outcome, inclusion criteria, and status. PDFs can participate in more than one session through membership records. Saved passages retain their document and location. Comparisons retain both the selected paper set and the framing question. Review attempts retain the learner response, confidence, source-reveal behavior, rubric and prompt versions, model identity, feedback, and scheduler transition. Analysis steps retain dataset identity, predictor decisions, audit warnings, acceptance state, model settings, metrics, artifacts, and literature-alignment notes.

This structure reduces the reconstruction work that normally happens at the end of a study. A later reviewer can recover the source, version, state, and decision behind an answer or result instead of relying on a final narrative that has already compressed away the research path.

IMPLEMENTED WORKSPACES
Five focused workspaces form one recoverable research workflow
READER
Interrogate a paper at passage level

Open a PDF, select text, ask a grounded question, transcribe microphone input, follow page-linked sources, and save evidence without leaving the document.

INDEX
Recover saved evidence and questions

Browse passages, notes, cards, facets, source links, and research context retained from the active session, including older records repaired into the current schema.

COMPARE
Synthesize a bounded source set

Run a research question across selected papers, track progress and source coverage, retain per-paper analyses, and mark the result stale when its framing or paper set changes.

REVIEW
Turn evidence into measurable recall

Answer before reveal, record confidence, receive source-grounded feedback across three dimensions, update FSRS state, and retain the attempt for later human grading.

STATS
Audit and model session data

Profile a dataset, identify leakage and redundancy risks, approve the feature frame, compare three baselines, and store metrics, coefficients, feature importance, and visual artifacts with the run.

SOURCE-CONSTRAINED RETRIEVAL
The retrieval path keeps every answer tied to the active paper

Refract implements the complete retrieval path directly in its application services, making the chunking, filtering, relevance threshold, source metadata, and fallback behavior inspectable.

EXTRACT
Carry page identity through ingestion

PyMuPDF extracts the document page by page. tiktoken with cl100k_base creates 512-token chunks with 50-token overlap while retaining the PDF ID, page number, and chunk index.

RETRIEVE
Search the active document's vector collection

L2-normalized all-MiniLM-L6-v2 embeddings are stored in ChromaDB with cosine distance. Each question retrieves the top five chunks filtered to the active PDF.

CITE
Return source metadata to the interface

Claude receives the retrieved excerpts and produces an answer with page-linked source records; clickable page markers take the researcher back to the supporting location.

ROUTE
Treat weak evidence as a product state

When all five distances exceed 1.3, selected-passage questions stay bound to the highlight, document questions remain on the document path, and genuinely external questions use a separately labeled web route.

ACTIVE-RECALL LOOP
A review attempt measures recall before the source changes the answer

The loop joins retrieval practice, confidence calibration, source-grounded grading, feedback, and scheduling while retaining enough provenance for human agreement studies and later rubric revision.

PROMPT
Generate from selected academic evidence

Create or refine a recall item from a saved passage, expected answer, rhetorical facet, or research concept while retaining the source relationship.

RECALL
Answer and rate confidence before reveal

Capture the learner's free-recall response and confidence while the source remains hidden, separating remembered knowledge from recognition.

GRADE
Evaluate claim, detail, and faithfulness

A temperature-zero, versioned grading call returns JSON for the core claim, supporting detail, source faithfulness, rubric hits, omissions, feedback, and model confidence.

REVEAL
Reconnect feedback to the original passage

Show the source according to the selected reveal mode and retain whether assistance occurred so later analysis can distinguish independent recall from aided review.

SCHEDULE
Convert the assessment into review state

Store the original 1-5 result, map it to the 1-4 FSRS signal, update the next review date, and retain the complete attempt for export or human scoring.

COMPARE
The research question and selected papers remain attached to the synthesis

Compare runs asynchronous per-paper analysis, organizes agreements, disagreements, methodological differences, gaps, and guidance, and fingerprints the output to both the framing question and source set. A changed source or question makes the prior result visibly stale instead of silently reusing it.

Cross-paper comparison interface from the public repository.

STATS
Battery analysis makes data quality and predictor decisions reviewable

The Stats workspace stores the dataset schema and identity, profiles every variable, flags missingness, constants, identifier-like fields, target leakage, and correlated predictors, then pauses for human acceptance before fitting a mean baseline, standardized Linear Regression, and Random Forest.

Battery remaining-useful-life workspace with analysis outputs linked to the active research session.

REVIEW-GATED ANALYSIS
Each statistical checkpoint leaves an inspectable record

The quantitative workflow behaves like a staged research notebook: later steps inherit accepted inputs and become stale when an earlier decision changes.

PROFILE
Describe the uploaded dataset

Record rows, columns, duplicates, missingness, inferred types, numeric summaries, target candidates, role hints, and variable semantics.

AUDIT
Surface leakage and redundancy risks

Check constants, identifiers, timing, target correlation, probable leakage at |Spearman rho| >= 0.97, and predictor redundancy at |rho| >= 0.95.

REVIEW
Accept the feature frame explicitly

Require a human decision on exclusions, target, predictors, assumptions, and warnings before model execution can proceed.

COMPARE
Fit three interpretable baselines

Use an 80/20 split with random_state 42 to compare a train-mean baseline, standardized Linear Regression, and a 240-tree Random Forest using MAE, RMSE, and R-squared.

RETAIN
Store the result with its decisions

Keep step versions, acceptance, stale state, metrics, coefficients, feature importance, artifact manifests, literature evidence, and reviewer notes with the run.

RESEARCH PROVENANCE
Every generated result carries the evidence and version state needed to audit it
RETRIEVAL
Paper, page, chunk, and distance

Grounded answers and saved evidence retain the source document, page, chunk identity, retrieval distance, and active-session relationship.

COMPARISON
Question, source set, and freshness

Comparative outputs retain the framing question, selected papers, per-paper analysis, source coverage, progress state, and fingerprint used to detect stale results.

RECALL
Answer, confidence, rubric, and scheduler

Review logs include the learner response, pre-grade confidence, dimension scores, feedback, exact model, prompt and rubric versions, reveal mode, and FSRS transition.

STATISTICS
Dataset, decisions, models, and metrics

Analysis records retain dataset identity, feature choices, audit warnings, acceptance decisions, step versions, assumptions, metrics, coefficients, feature importance, and visual artifacts.

RESEARCH METHODOLOGY
The literature review shaped what the product records and when it asks for judgment

The product was developed alongside a structured review of the testing effect, generative learning, FSRS, confidence calibration, LLM grading, scholarly-reading interfaces, and authentic classroom studies. That research changed the interaction design: learners answer before source reveal; confidence is captured before feedback; the scheduler receives a structured assessment; paper comparisons retain rhetorical and methodological facets; and research exports separate assisted from independent recall.

The grading path is reproducible. The active service pins claude-sonnet-4-20250514, uses temperature zero, rubric version v1.0 and prompt version grading_v1.0, passes source chunks and an expected answer, requests JSON-only output, and stores model confidence, rubric hits, missing concepts, and feedback. The original 1-5 result remains available alongside the 1-4 FSRS conversion, so a revised mapping can be studied without rerunning the model.

A human_grades table and blinded export support agreement studies between model and human assessors. This design treats model grading as a measurable research component with inspectable inputs and outputs, giving the system the instrumentation needed for longitudinal retention and inter-rater-reliability studies.

RECORDED VERIFICATION
Stored evaluations cover the core reading, repair, and recall interactions

The repository retains dated browser and workflow reports in addition to backend and Playwright test coverage.

9/9
Reader and workspace UI checks
Loading, PDF selection, formatted chat, five visible page-source badges, Index navigation, adaptive concision, and 1440/1024 overflow checks passed in the stored UI report.
8/8
Recall-first workflow checks
The deep-fix verification record passed the sequence that protects answer-before-reveal behavior and its stored state.
6/6
Duplicate and repair-flow checks
Card deduplication and legacy-context repair retained the intended research record relationships.
1/1
Multi-turn concision check
The stored follow-up scenario became shorter while retaining the required structure and source context.
ARCHITECTURE
Custom services keep the research model visible across interface, storage, retrieval, and analysis
INTERFACE
React workspaces over shared session state

React 18, Vite, Zustand, Axios, React Markdown, and react-pdf provide the Reader, Index, Compare, Review, and Stats surfaces.

RECORDS
Durable relational state and migrations

FastAPI, SQLAlchemy, Alembic, and PostgreSQL store sessions, sources, memberships, cards, comparisons, grades, datasets, analysis steps, decisions, and repair history.

RETRIEVAL
Document vectors with page provenance

PyMuPDF, tiktoken, SentenceTransformers, and ChromaDB implement ingestion, chunking, per-PDF filtering, top-five cosine retrieval, and page-linked results.

RESEARCH
Model services and quantitative analysis

Claude supports document response, synthesis, card generation, classification, and recall grading; Whisper handles transcription; pandas and scikit-learn power the review-gated statistical workflow.

IMPACT
Refract reduces reconstruction work across learning, research review, and applied analysis
RESEARCHERS
Carry source context into every downstream task

A passage can become a grounded answer, indexed note, comparison input, recall item, and later citation while retaining the document relationship that makes it defensible.

LEARNERS
Turn highlighting into assessed retrieval practice

The Review workspace captures an unaided answer, confidence, source-grounded feedback, and a scheduled next attempt instead of treating reading activity as evidence of learning.

REVIEWERS
Inspect how a synthesis or grade was produced

Source fingerprints, prompt and rubric versions, reveal behavior, human-grade export, and stale-state rules make later review possible without reconstructing the workflow from screenshots.

APPLIED TEAMS
Join qualitative evidence to quantitative decisions

Dataset audits, review gates, baseline comparisons, metrics, and literature-alignment records keep the modeling result connected to both the data and the research question.

MY CONTRIBUTION
I designed and built the product, research model, and evaluation instrumentation

I created the session-centered architecture; implemented the document reader, page-aware retrieval, evidence index, cross-paper comparison workflow, active-recall and grading loop, FSRS scheduling, human-review export, database and migration model, recovery and deduplication paths, and review-gated Stats workspace; and translated the literature review into the product's confidence, reveal, provenance, and study instrumentation.

EVALUATED SCOPE
A working research system with instrumentation for longitudinal studies

The implementation covers ingestion, retrieval, evidence capture, comparative synthesis, recall grading, scheduling, human-review export, dataset profiling, leakage and redundancy audit, model comparison, visualization, and run-level provenance.

The stored records support future measurement of long-term retention and human-grader agreement. The battery workflow is an implemented analytical environment; production predictive-maintenance deployment remains a separate operational program.

PROJECT LINKS
Repository
PUBLIC CODEBASE FOR THE READER, INDEX, COMPARE, REVIEW, AND STATS WORKSPACES.
System design article
HOW SESSION STATE CONNECTS THE FIVE IMPLEMENTED WORKSPACES.
Technical architecture record
SUPPORTING ARCHITECTURE DIAGRAM AND REPOSITORY-LEVEL IMPLEMENTATION NOTES.
