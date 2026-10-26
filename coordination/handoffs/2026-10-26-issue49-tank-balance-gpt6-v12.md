# KAIRO Issue #49 — fictional Pump Tank Balance Lab

**Date:** 26 October 2026, Africa/Johannesburg. **Session:** `gpt6-i49-tank-balance-20261026-1040-v12`; client ChatGPT, model GPT-6, effort unknown. **Base:** `main@7e94b557b095188cf80d0a125d6be4967374bd95`. **Branch:** `feat/issue49-tank-balance-20261026-1040-v12`.

## Exact scope and ownership

New-only `studio/src/studio-scenarios/pump-tank-balance-20261026/{model.mjs,app.mjs,preview.html,SOURCE-REVIEW.md}`, `studio/tests/pump-tank-balance-20261026.test.mjs`, this handoff. GitHub cooperative claim: https://github.com/LethaboMH14/KAIRO/issues/49#issuecomment-6411802337 . The canonical owner-local SQLite bus is not remotely accessible: **no atomic local bus claim**, and the coordinator must reconcile before integration. PR #55 owns the original `pump-what-if/**` and its test; no files in that PR or any shared route/styles/contracts were modified. PR #53 remains unmerged at planning; Kaggle #50 was not touched. No provider calls, paid services, deployment, IAM or real data.

## Implemented learner experience

A new, independently runnable Vite preview (`/src/studio-scenarios/pump-tank-balance-20261026/preview.html`) models a **fictional** reservoir over one constant-rate time step. Round 1 varies inlet flow to expose unmet outlet demand; round 2 varies outlet demand to expose overflow. Before results are shown, the learner commits a numeric ending-volume prediction, outcome classification and written explanation. Then the model reveals a 2D tank comparison, explicit seven-step conservation trace and numeric reading table. Two independent local attempts are retained for review; JSON export/import stores only bounded, revision-fenced **actions**, recomputing results and rejecting forged grades, identities, verification flags, stale revisions and invalid ordering. Import cancellation prevents a late file read overwriting a reset or newer import.

Conservation invariant: `initial storage + inlet volume − requested outlet volume = final storage + spill − unmet demand`. For every supported choice, final storage stays between zero and capacity, and spill/unmet demand are mutually exclusive. The source is OpenStax *University Physics Volume 1* §14.5 (https://openstax.org/books/university-physics-volume-1/pages/14-5-fluid-dynamics), checked 26 October 2026; it establishes flow rate/mass conservation, **not** the fictional scenario coefficients, spill convention or engineering validity. See `SOURCE-REVIEW.md`. No live pump or water equipment control, no calibrated physics, no domain-expert signoff.

## Actual verification (before GitHub push)

- Local container Node **22.16.0**, command `node --test studio/tests/pump-tank-balance-20261026.test.mjs`: **15/15 pass, zero failures, zero skips**. Covers all eight flow options, conservation, spill, shortage, prediction/replay, forged evidence, order, size, stale revision and static UI contracts.
- `node --check studio/src/studio-scenarios/pump-tank-balance-20261026/app.mjs`: **passed**.
- The local container cannot resolve github.com for clone/npm and has no Node 24 installation. Node 24 full serial suite, Vite build and Python coordination tests **not yet run locally**. Inspect exact remote PR head GitHub Actions before making any CI claim.
- Browser, keyboard, zoom, mobile, screen-reader, actual account source/revision integration, real-device captures and human teaching/subject validation **not run**. Existing denied browser restrictions must be respected. No authenticated progress or efficacy claim.

## Seven judging criteria / evidence boundary

- **Product:** standalone complete two-round prediction→trace→review; authenticated source-to-resume journey **not implemented**.
- **Creativity:** visible overflow/shortage consequence from a learner-selected flow, not a decorative room; novelty unmeasured.
- **Usability:** native controls, focus recovery, numeric table and reading trace; actual assistive-tech/device validation pending.
- **Sustainability:** no runtime dependencies, bounded JSON and deterministic CPU model; operational support/cost unmeasured.
- **Impact:** relevant conceptual reasoning exercise; learner understanding/retention not measured.
- **Presentation:** independent preview and explicit calculation proof; no authorised screenshot/video or judge testing.
- **Intelligence:** transparent deterministic conservation model, **not** machine learning, trained prediction or adaptive pedagogy.

## Next two dependency-ready tasks

1. **Independent engineering + accessibility review** of the exact PR head: verify conservation convention, outcome wording, focus order, form submission, file import cancellation and 200% zoom/keyboard/mobile on an authorised browser/device. Correct findings on this branch before considering acceptance.
2. **Coordinator-owned integration** of ONE reviewed studio into authenticated reviewed source/revision→practice→saved evidence→resume, after local bus reconciliation and route/progress owner agreement. Test A→B→A context isolation and revoked/re-reviewed source rejection. No unreviewed automatic mounting of all isolated labs.

**Release:** draft PR only. PR #34 conditional policy requires independent review and exact-head checks. No merge or deployment authorised for this worker.
