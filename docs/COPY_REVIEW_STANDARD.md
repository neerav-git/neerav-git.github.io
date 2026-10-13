# Portfolio copy review standard

## Objective

Present each project as substantial engineering work. A reviewer should be able to identify the problem, implementation, methodology, evidence, result, and current scope without decoding portfolio jargon.

## Audit sequence

1. Inventory every public string from structured content and visible interface components.
2. Review card copy, page introductions, headings, body sections, sidebars, resource labels, and status definitions.
3. Remove meta-copy that explains why a page or record exists.
4. Replace contrast scaffolding and vague abstractions with concrete subjects, actions, inputs, and outputs.
5. Lead with implemented capability and measured evidence. State scope once, after the evidence.
6. Render every public route and inspect the text in layout, including section maps and mobile wrapping.
7. Run `npm run audit:copy`, content validation, type checks, and the production build before publication.

## Sentence test

A sentence passes when it names at least one concrete element: a user, task, input, operation, control, metric, output, technology, or evidence source.

## Failure categories

- Meta-copy: “this entry exists,” “the point is,” or explanations of why material was archived.
- Contrast scaffolding: “not X, but Y,” “rather than,” and defensive comparisons.
- Vague abstractions: “context,” “frame,” “layer,” “artifact,” or “useful” without a named mechanism.
- Effort-minimizing language: “supporting note,” “compact record,” or language that treats substantial work as secondary.
- Repeated caveats: boundaries that dominate the contribution or appear in multiple sections.
- Unsupported claims: results without a method, denominator, test condition, or evidence source.

## Project structure

Each project page should provide:

- Problem: the user or research problem.
- Implementation: the system and the engineer’s contribution.
- Method: the workflow, controls, or experimental design.
- Evaluation: tests, metrics, denominators, or review protocol.
- Result: the working product or measured outcome.
- Scope: the single most important boundary, stated after the evidence.
