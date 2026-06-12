/* ============================================================
   ARTICLES — your writing lives here.
   To add a post: copy one block below, change the fields, and
   write your post in `content` using Markdown. Newest first.
   `slug` must be unique (used in the URL: article.html?p=slug).
   ============================================================ */

window.ARTICLES = [
  {
    slug: "grounding-and-evaluation-llms-life-sciences",
    title: "What \u201creliable\u201d should mean for LLMs in life sciences",
    date: "2026-06-10",
    tags: ["LLMs", "evaluation", "healthcare"],
    summary:
      "Fluency is cheap and grounding is not. A short argument for treating evaluation as the product, not the afterthought, when language models touch regulated work.",
    content: `
When a language model writes a paragraph of a regulatory document, the failure that matters is rarely that the prose is bad. It is that the prose is *confident and wrong* — a citation that does not exist, a dosage that drifted, a claim with no source behind it. In consumer settings that is an annoyance. In life sciences it is the whole risk surface.

So the question I keep coming back to is not "can the model write this?" but "can I tell when it is wrong, cheaply and before a human is harmed?" That reframes evaluation from a box you check after building to the thing you are actually building.

### Grounding is a system property, not a prompt trick

A well-phrased prompt can reduce hallucination. It cannot bound it. The bound comes from architecture: retrieval that is scoped to a trusted corpus, every generated claim tied to a retrieved span, and a refusal path when no span supports the claim. On a research tool I built, the most useful component was not the generation step — it was a layer that classified each output by its evidence provenance and refused to surface anything ungrounded. The model got *less* impressive and *more* trustworthy. That trade is the right one for this domain.

### Offline and online evaluation are different jobs

Offline evaluation tells you whether a change is plausibly better before you ship it: held-out sets, benchmark reproduction, regression checks against known-good outputs. Online evaluation tells you whether it is actually better once real inputs hit it, which never look like your test set. Teams that only do the first ship confident regressions; teams that only do the second learn slowly and expensively. You need both, and you need the offline harness to be fast enough that nobody is tempted to skip it.

### Fairness is an evaluation question too

"Is this safe?" and "is this safe *for everyone*?" are not the same measurement. A model that performs well on average can fail systematically for a subgroup, and an aggregate metric will hide it. The fix is unglamorous: stratify your evaluation, look at the worst slice, and treat that number as the real one.

None of this is novel. It is just under-practiced, because evaluation is less fun to demo than generation. My bet is that in regulated domains, the teams that win will be the ones who found that boring work the most interesting.

*Draft — these are working notes, not a finished position. I'll revise as my thinking changes.*
`.trim(),
  },

  {
    slug: "battery-rul-notes",
    title: "Notes from a battery remaining-useful-life project",
    date: "2026-01-15",
    tags: ["ML", "evaluation", "project"],
    summary:
      "An R\u00B2 of 0.993 looked great until I asked where it came from. A short write-up on leakage, feature honesty, and trusting a number.",
    content: `
The goal was simple to state: given a lithium-ion battery's degradation history, predict its remaining useful life so maintenance happens before failure, not after. The first model I trained reported an R\u00B2 of 0.993. I did not believe it.

### A number is only as good as the audit behind it

A near-perfect score on a messy real-world target is a smell, not a celebration. The usual culprit is leakage: a feature that encodes the answer. So before trusting anything, I ran a correlation-based audit and removed variables that were suspiciously aligned with the target (Spearman r at or above ~0.97). Some of the apparent accuracy was real; some of it was the model reading the answer off a feature it should not have had.

### Discharge time carried the signal

After the cleanup, one feature — discharge time — accounted for roughly 85% of the feature importance. That is a satisfying result, because it is physically sensible: how long a cell sustains discharge is a direct expression of its health. When the model's explanation matches the physics, you have earned a little more trust in it.

### Reproducing a benchmark is underrated

The other thing that made the result believable was reproducing a previously validated result (RMSE around 25.6 cycles) before extending it. Benchmark reproduction is tedious and rarely rewarded, but it is the cheapest way to find out whether your pipeline is sound before you start drawing conclusions from it.

The lesson I took away was not about batteries. It was that the interesting work in applied ML is often *after* the model trains: deciding whether to believe it.

*Draft — edit freely.*
`.trim(),
  },
];
