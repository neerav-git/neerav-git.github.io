# Portfolio work-record research

These records are the evidence base for a later portfolio copy pass. They are not public-site copy and do not change the current project pages.

## Record index

| Work | Record | Research depth | Primary evidence |
| --- | --- | ---: | --- |
| Relay | [`relay.md`](./relay.md) | 3,032 words | Current private source tree, evaluation snapshot, saved runs, tests, and Git history |
| Refract | [`refract.md`](./refract.md) | 2,786 words | Current local source tree, research notes, evaluation records, tests, history, and thesis-positioning PDF |
| Homeward | [`homeward.md`](./homeward.md) | 2,611 words | Public/local source tree, deterministic and browser evidence, agent contracts, tests, and four-person Git attribution |
| Birb Hangout | [`birb-hangout.md`](./birb-hangout.md) | 3,501 words | Current private source tree, live About site, tests, change evidence, Git history, and 301-page research compendium |
| Four-class Alzheimer MRI classification | [`alzheimers-mri-classification.md`](./alzheimers-mri-classification.md) | 2,788 words | All 100 public notebook cells and retained outputs, README, six-commit history, and companion-result provenance |
| Brain atrophy paper | [`brain-atrophy-paper.md`](./brain-atrophy-paper.md) | 3,210 words | Full five-page IEEE paper, seven figures, two tables, four equations, fourteen references, DOI metadata, and portfolio corroboration |

## Required shape

Each record should be approximately four to five prose pages (roughly 2,000-3,000 words) and should explain:

1. the human or organizational problem;
2. the implemented product or research contribution;
3. the end-to-end user workflow;
4. the architecture and important implementation decisions;
5. the methodology used to design, test, or evaluate the work;
6. the results and strongest defensible evidence;
7. why the work is technically or product-wise notable;
8. who benefits and what effort, risk, or fragmentation it reduces;
9. the author's role, with team attribution where applicable;
10. a concise claim ledger separating measured results, directly verified capabilities, and interpretation.

## Evidence rules

- Inspect the implementation, tests, evaluation artifacts, primary documentation, and commit context where available.
- Prefer exact counts, named workflows, and observed results to broad adjectives.
- Explain boundaries only where they clarify the scope of a positive claim; do not organize the record around missing work.
- Do not convert a prototype into a production claim, a deterministic test into a live-model result, or a team result into an individual claim.
- End with a source map naming the files, URLs, commits, or paper sections that support the record.

## Contract for the later copy pass

- Start with the specific user outcome or research result. Do not begin with a technology list or a disclaimer.
- Replace umbrella phrases such as "multiplayer play," "AI-powered," "research platform," or "improves workflows" with the concrete behavior, actor, object, and result documented in the relevant record.
- Name the methodology that made the result credible: confirmation and state verification in Relay; one shared research session in Refract; deterministic authority and human review in Homeward; diegetic interaction and reproducible 3D review in Birb Hangout; probability-level ensemble comparison in the MRI notebook; explicit pixel masks and the `dem` ratio in the paper.
- Pair every metric with its denominator, evidence source, and evaluation context. Do not detach a number from the run, split, artifact, or historical record that produced it.
- Keep authorship precise. Homeward is a four-person team project; the IEEE paper has two authors; the other repository records identify Neerav as the primary or sole repository author while still crediting platforms and AI-assisted development appropriately.
- Keep the two Alzheimer projects separate. The IEEE paper reports a 66% to 71% crop comparison for an interpretable OpenCV atrophy proxy. The later notebook implements four-class TensorFlow CNN ensembles and has distinct result provenance.
- Use scope boundaries as support for a strong exact claim, not as the headline. Never upgrade synthetic data, process-local services, deterministic tests, historical evidence, or a notebook experiment into production or clinical validation.
- When a record distinguishes measured results, directly verified capability, and interpretation, preserve that distinction in the published sentence.
