---
slug: refract-ai
approvedTargets:
  - project.refract-ai
  - project.refract-ai.methodology
  - project.refract-ai.3-five-focused-workspaces
  - project.refract-ai.4-the-retrieval-path
  - project.refract-ai.5-a-review-attempt
  - project.refract-ai.8-each-statistical-checkpoint
  - project.refract-ai.9-every-generated-result
  - project.refract-ai.13-refract-reduces-reconstruction
  - project.refract-ai.links
approvedLinks:
  - link.refract-ai.repository
  - link.refract-ai.system-design-article
  - link.refract-ai.technical-architecture-record
metricIds: []
---

# Refract

## In plain terms

Refract puts an entire research process in one place. A researcher reads papers, asks questions and gets answers that show the exact paper and page they came from, collects evidence, compares sources, tests what they have actually learned, and runs statistical analysis on their data, all inside one research session that remembers everything. Without it, the same work is scattered across a PDF reader, a chat tool, notes, flashcards, notebooks, and spreadsheets, and the link between a claim and its evidence gets lost at every hand-off.

For researchers this means every conclusion can be traced back to its source in one step. For learners it means recall is measured honestly: they answer and rate their confidence before seeing the source, so the tool knows what they really know and schedules review accordingly. For anyone running analysis it means data problems are caught and reviewed by a person before a model result is accepted. Neerav built it from research on how people learn and how research goes wrong, so it brings education and research rigor into a tool people can use every day.

## Outcome

Refract is a session-centered research workspace that keeps papers, cited passages, grounded answers, comparisons, recall attempts, datasets, analysis decisions, and model results connected to their provenance. It responds to a familiar research failure: an argument gets assembled across a PDF reader, chat, notes, flashcards, notebooks, and spreadsheets, and each transfer weakens the connection between a claim and the evidence or assumptions behind it.

The product makes the research session the durable unit of work. A researcher can move through five focused workspaces—Reader, Index, Compare, Review, and Stats—without rebuilding context. Source identities, selected passages, prompts, confidence judgments, grading records, dataset audits, metrics, and decisions stay attached as the work changes form.

## Neerav's contribution

Neerav designed the research model and product workflow and built the document reader, evidence index, comparative synthesis, recall and grading pipeline, research exports, session and migration layers, and Stats workspace. He translated a literature review into product instrumentation that can test whether a feature improves evidence use or merely makes the interface feel smoother.

He also built the validation and repair path around the product: backend tests, Playwright probes, schema migrations, legacy-context recovery, duplicate cleanup, and explicit review gates. The contribution spans product design, full-stack implementation, information retrieval, learning science, quantitative analysis, and evidence architecture.

## User journey

In Reader, a researcher imports papers and asks source-constrained questions while seeing the page-level passages behind an answer. In Index, selected evidence becomes a reusable map of concepts and citations. Compare makes the source set explicit before synthesis so a conclusion cannot quietly blend unselected material. Review asks for an answer and confidence judgment before revealing feedback, stores a structured grade, and schedules later practice. Stats brings a dataset through profiling, leakage and redundancy checks, reviewer approval, model comparison, and retained outputs; its demonstration case is battery remaining-useful-life prediction.

The continuity matters more than the individual tabs. A comparison can be traced to the papers selected for it; a flashcard can retain the passage that justified it; a recall result records both what the learner knew before reveal and how it was scored; a model metric retains the dataset version, audit decisions, predictors, and literature-alignment note that produced it.

## Architecture and tools

The interface uses React 18 and Vite. A FastAPI backend coordinates domain services, PostgreSQL and Alembic provide durable relational state and migrations, ChromaDB stores vector retrieval data, and S3-compatible storage holds source files. Python supports ingestion, retrieval, document processing, statistics, and model evaluation.

PDF text is divided into 512-token chunks with 50-token overlap. Sentence-transformer embeddings are normalized and compared with L2 distance; the system selects up to five passages per paper within the configured threshold. The retrieval path preserves paper, page, and chunk identity for every passage it returns. Session state is explicit in API contracts and persistence, preventing a workspace from silently operating on a different source set.

Recall grading separates factual correctness, conceptual coverage, and evidence use. Confidence is captured before feedback, and FSRS scheduling uses the retained attempt and its grade. The Stats workflow stages profiling, audit, review, baseline and comparison models, metrics, plots, and a final decision so exploratory output cannot quietly become an approved conclusion. Profiling flags missingness, constant and identifier-like fields, target leakage, and correlated predictors, then pauses for human acceptance before fitting a mean baseline, standardized linear regression, and a random forest.

## Methodology

Refract's design is literature-led and testable. The product records the conditions needed to evaluate retrieval, learning, and analysis behavior: source and page identifiers, prompt and response, reveal state, confidence, grading rubric and version, scheduler inputs, dataset and feature versions, audit decisions, model configuration, metrics, and reviewer approval.

Validation combines backend tests with browser-level probes. The recorded checks cover ingestion, page-aware retrieval, source-linked answers, session switching, comparison payloads, answer-before-reveal behavior, grading, duplicate repair, legacy context recovery, and the Stats layout. This division makes it possible to distinguish a visually present feature from a complete data path.

## Results

The retained product checks include nine of nine Reader and workspace interface checks, covering PDF selection, formatted answers with page-source badges, Index navigation, adaptive concision, and no horizontal overflow at 1440- and 1024-pixel widths; eight of eight recall-first scenarios; six of six duplicate-repair cases; and a multi-turn check in which follow-up answers became shorter while keeping their structure and sources. The completed implementation spans all five workspaces and preserves provenance at every handoff, from reading through final export.

These results establish implemented behavior and traceability. The system also stores the evidence required for future studies of long-term retention and of battery-life prediction in production maintenance.

## Iterative improvement

The first workspace model allowed document and session state to become disconnected. Neerav introduced a persisted session identity, explicit context in API contracts, and recovery for older records; browser probes then verified that navigation and reload retained the intended source set.

Passive highlighting in Review made it too easy to mistake recognition for recall. The interaction changed to answer and rate confidence before reveal, followed by three-dimensional grading and scheduled review. When imported material created duplicate or legacy references, migration and repair routines were added and verified against targeted cases. In Stats, the risk of leakage and premature model acceptance led to a staged audit and human-review gate before comparison results become part of the research record.

## Impact

Refract reduces the reconstruction work that normally occurs whenever research moves between reading, synthesis, learning, and analysis tools. Researchers gain a visible chain from source to claim to decision; learners get evidence of what they actually recalled; reviewers can inspect why a model or conclusion was accepted; and teams can resume a session without reverse-engineering prior context. Its differentiator is a shared provenance model that connects retrieval, recall, and statistical analysis across qualitative and quantitative work.

## Scope

The product and its study instrumentation are implemented. The stored records prepare the next validation programs: long-term retention for learners and battery-life prediction in production maintenance.

## Approved page targets and links

Use the approved target and link metadata in this record's front matter for page actions; it is not narrative content.
