# Handoff: citation and relevance regression evidence

Agent: `codex-citation-edgecases-20261024-a` (Codex, model `gpt-6.1-sol`, effort `unknown`). Task: `CITATION-RELEVANCE-EDGECASES-001`.

Criterion/subquestion: Product (source-grounded lesson behavior), Intelligence (evidence selection), Impact (learner ability to check explanations). Need: learners need to find the exact reviewed passage and distinguish edited source text while checking lesson claims. Acceptance check: actual modules preserve relevant source metadata/offsets within limits and validators reject stale revisions and fabricated practice support quotes.

Changed files:
- `studio/tests/citation-relevance-edgecases.test.mjs` — four focused actual-module regression cases.
- `docs/citation-relevance-20261024/README.md` — evidence and limits.
- `coordination/handoffs/2026-10-24-citation-relevance.md` — this handoff.

Checks: `node --test studio/tests/citation-relevance-edgecases.test.mjs` — 4 passed, 0 failed. Tests run against `selectEvidence` and `validateDraft`/`draftFromLesson`; inputs are local synthetic objects only. No product, selector, shared contract, manifest, browser, learner-data or provider changes.

Evidence and boundaries: repeated identical passages retain distinct locators and edited flags; Unicode prefix offsets are UTF-16 and slice back to exact quotes; two late relevant chunks survive a bounded selection; a no-match goal uses source order; draft validation rejects stale source revision and a fabricated quiz support quote. Citation presence and quote containment do not establish semantic entailment or subject accuracy. Human/domain review and browser/device behavior remain untested. This supports Product/Intelligence/Impact evidence only; no learning or traction claim is made.

Next: root may review and integrate this evidence with the LMS wave. If a stronger semantic claim check is needed, define and validate a separate acceptance method with domain review; do not infer entailment from these passing tests.
