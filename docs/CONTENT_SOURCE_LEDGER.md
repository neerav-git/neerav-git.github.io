# Portfolio content source ledger

This ledger records the evidence used for public claims. Copy changes must identify an implementation source, evaluation source, publication, or author-provided research record before adding a capability or result.

## Relay

- Implementation: private Relay/Northstar repository, audited locally on 2026-10-12
- Evaluation snapshot: `evaluation/summaries/evaluation-snapshot.json`
- Evaluation surface: `src/evaluation/` and the in-product Agent evaluation route
- Public media: `public/uploads/relay/`
- Supported claims: seven workflow families; 103/110 current task-success conversations; 39/42 held-out requests; 31/34 spoken answers meeting review criteria; 24/24 spoken end-to-end turns; 186/187 eventual record accuracy; red-team and groundedness findings reported with their review method.
- Required boundary: synthetic employer data and demo services; named production employer systems are integration targets.

## Refract

- Repository: `https://github.com/neerav-git/Refract`
- Repository review: public source audited on 2026-10-12
- Implementation sources: Reader, Index, Compare, Review, and Stats routes; `ReviewSession.jsx`; review grading service; voice transcription route; statistics services; research and evaluation documents.
- Public media: `public/uploads/refract/`
- Supported claims: React/Vite and FastAPI implementation; passage-grounded Reader; saved evidence; bounded comparison; free-recall confidence and three-dimension grading; FSRS scheduling; human-grade export; dataset profiling, leakage audit, mean baseline, Linear Regression, Random Forest, MAE, RMSE, and R².
- Removed claims: exact battery RMSE, time-reduction percentage, fixed papers-per-session count, integrated spoken recall grading, completed retention outcomes.

## Brain atrophy publication

- Publication: Neerav Chaudhary and Sourabh Singh Verma, “Analyzing Brain Atrophy in Dementia Using Computer Vision,” IEEE ICRITO 2022.
- DOI: `10.1109/ICRITO56286.2022.9964994`
- Proceedings pages: 1234–1238.
- Resume corroboration: `public/uploads/references/Resume_Neerav_Chaudhary.pdf`
- Supported claims: co-authored peer-reviewed publication; Python/OpenCV workflow for longitudinal MRI preprocessing and quantitative brain-atrophy analysis.
- Required boundary: retrospective imaging research; prospective diagnostic and patient-care performance require separate clinical validation.

## Four-class Alzheimer MRI classification

- Repository: `https://github.com/neerav-git/Alzheimer-s-Disease-Detection-Ensemble-Learning`
- Repository review: public source audited on 2026-10-12
- Public notebook: `AZclassification5(wide).ipynb`
- Companion research record: linked Colab experiment containing the reported 78% baseline and 85% ensemble result, confirmed by the author.
- Resume corroboration: `public/uploads/references/Resume_Neerav_Chaudhary.pdf`
- Supported claims: 6,400 discovered files; four folder labels; 256×256 processing; declared 80/10/10 split; TensorFlow/Keras CNNs; two-model, three-model, and draft weighted ensembles; 78% to 85% reported accuracy gain.
- Required boundary: the current public notebook retains incomplete `model.evaluate` outputs; the result is attributed to the linked companion notebook.

## Homeward

- Repository: `https://github.com/pruhnav/homeward`
- Repository review: public source audited on 2026-10-12
- Assessed commit: `eaf86d9`
- Supported claims: source-linked discharge instructions; synthetic Synthea history; four bounded specialist roles; proposed, approved, rejected, executed, retry, stale-revision, and idempotency states; 59 Node tests; four DOM journeys; 32/32 deterministic cases.
- Team attribution: four-person hackathon project with repository ownership divided across data/retrieval, agent/tools, product experience, and reliability/presentation.
- Required boundary: recorded live-agent trial returned HTTP 401 before an answer; live-model and clinical reliability remain unverified.

## Birb Hangout

- Repository: private Birb Hangout repository, audited locally on 2026-10-12
- Primary design source: `docs/studio-notes.md`
- Additional sources: animation harness, interaction tests, hug protocol, room server, deployment checks, and product README.
- Public media: `public/uploads/birb/`
- Supported claims: React Three Fiber and Colyseus multiplayer; diegetic lounge activities; frame-level animation comparison; speed, acceleration, and jerk diagnostics; annotated PNGs with strokes, comments, camera pose, and world position; consent-, proximity-, expiry-, and disconnect-aware hug flow.
- Required boundary: large-scale concurrency and broad cross-browser media testing remain open.

## Copy acceptance

Every public sentence is checked against `docs/COPY_REVIEW_STANDARD.md` and `npm run audit:copy`. Publication also requires JSON parsing, TypeScript validation, a production build, rendered desktop/mobile inspection, and public URL verification.
