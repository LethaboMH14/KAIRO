# Issue #49 — fictional pump sensor bias reasoning slice

**Worker:** `gpt6-i49-pump-sensor-bias-20261026-0901-v11`; client ChatGPT; actual model GPT-6; effort setting unknown. **Branch:** `feat/issue49-pump-sensor-bias-20261026-0901-v11`, pinned from `main@7e94b557b095188cf80d0a125d6be4967374bd95` before code publication. GitHub issue #49 PLAN comment `6410229119`.

## Scope and ownership

New-only `studio/src/studio-scenarios/pump-sensor-bias-20261026/{model.mjs,app.mjs,preview.html,SOURCE-REVIEW.md}`, `studio/tests/pump-sensor-bias-20261026.test.mjs`, and this handoff. No existing files, shared router, global styles, package/lockfile, server, authentication, IAM, paid services, deployment, #55 pump-what-if, #137 context fence, or #53 Kaggle files are changed. Canonical owner-local SQLite bus is not remotely accessible; the GitHub issue PLAN is a **non-atomic cooperative scope notice**, not a claim on the local bus. Coordinator must reconcile before integration.

## Delivered, bounded learner behaviour

Standalone unmounted `preview.html`: two independent fictional pressure-measurement rounds. Learner compares previous baseline, independent reference, suspect display and zero-check; chooses additive offset, selects offset-versus-process-change explanation, predicts corrected pressure and commits written reasoning before revealing the arithmetic. Pure `model.mjs` checks each of three choices against a deterministic source-labelled synthetic card, explains each step, and recalculates result from action-only replay. Native labelled form, keyboard focus recovery, accessible reading tables equivalent to 2D bar chart, 200%-zoom-responsive layout and reduced-motion CSS provided. Local JSON import/export is **not authenticated, graded or server-verified** and contains only submitted choices/explanations; extra outcomes, forged verification, wrong source revision, wrong order and malformed/oversize imports fail closed. No automatic localStorage across lessons.

**Simplified assumptions:** exact independent reference and known additive zero-check offset; round one shows +8 kPa offset with unchanged reference, round two shows +12 kPa reference change with no offset. These are KAIRO-authored fictional teaching values, not real pump telemetry or safety/diagnostic guidance. NIST calibration concept source is linked in `SOURCE-REVIEW.md`; **not independently expert reviewed**, and no NIST endorsement or traceable instrument claim is made.

## Evidence and limitations

- **Actually executed locally:** `node --test studio/tests/pump-sensor-bias-20261026.test.mjs` from a local staged copy under `/mnt/data/kairo-i49-sensor`, Node **22.16.0**, **18/18 pass**, 0 fail, 0 skip. The tests include independent arithmetic, wrong-answer checks, round sequencing, explanation validation, nonfinite values, export/import recomputation, forged grade/status/source/revision, oversized/malformed JSON, no mutation, and structural keyboard/reading markup checks.
- **Not yet run at handoff authoring:** exact-head GitHub Actions Node24 full suite, production build and Python coordination checks; these must be inspected after draft PR creation. No browser/device screenshot or screen-reader test, no actual authenticated learner evidence or measured learning gain. The HTML structural check is **not** a real accessibility audit.
- Product/Creativity: prediction→trace interaction implemented, unmounted. Usability/Presentation: 2D + reading and keyboard markup, human/device observation unknown. Intelligence: deterministic feedback with source concepts, no AI inference or claimed calibrated diagnostics. Impact: no learning outcome data. Sustainability: dependency-free isolated code, no provider cost; production integration unknown.

## Next two dependency-ready work orders

1. **Independent reviewer** (not this coding session) checks exact-head domain assumptions, adversarial replay, accessibility/focus and 2D/table equivalence; correct any findings on this branch before merge review. No review is inferred from green CI.
2. **Coordinator and existing studio host owner** reconcile canonical local bus claims and source/revision contract; mount one reviewed #49 lab through an authenticated source→practice→evidence→resume path with real permitted browser/device acceptance. Avoid accumulating more unmounted demos without closing this gap. Separate #137 owner must address its independent forged-report review finding before that adapter is integrated.
