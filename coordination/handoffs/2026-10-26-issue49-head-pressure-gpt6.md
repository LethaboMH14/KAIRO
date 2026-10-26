# Issue #49 — head/gauge pressure learning slice (26 October 2026)

Session: `gpt6-i49-head-pressure-20261026-0706-v11`; client ChatGPT; model GPT-6; effort setting unknown. Isolated branch: `feat/issue49-head-pressure-20261026-v11`, based on `main@7e94b557b095188cf80d0a125d6be4967374bd95`.

## Cooperative scope and boundaries

Issue PLAN: https://github.com/LethaboMH14/KAIRO/issues/49#issuecomment-6408700158 . Canonical local `coordination/bus.sqlite3` is inaccessible through this remote GitHub session: **no local atomic claim or inbox inspection**. Coordinator must check conflicts before integration. PR #55 owns the original `pump-what-if/**` and dedicated test. PR #53 is still open/unmerged; Kaggle #50 was not touched. PR #54 closed unmerged; draft #96 has no verified same-path Codex work. No shared router, global styles, existing studio files, packages, auth, cloud, IAM, credentials or deployment changes.

**Six added-only files:**
- `studio/src/studio-scenarios/pump-head-pressure-20261026/model.mjs`
- `studio/src/studio-scenarios/pump-head-pressure-20261026/app.mjs`
- `studio/src/studio-scenarios/pump-head-pressure-20261026/preview.html`
- `studio/src/studio-scenarios/pump-head-pressure-20261026/SOURCE-REVIEW.md`
- `studio/tests/pump-head-pressure-20261026.test.mjs`
- `coordination/handoffs/2026-10-26-issue49-head-pressure-gpt6.md`

## Actual behaviour and interfaces

Standalone unmounted HTML/ESM preview: open `studio/src/studio-scenarios/pump-head-pressure-20261026/preview.html` through the studio Vite dev server. Round 1 varies a fictional open column's depth at fixed density; round 2 varies fictional density at fixed depth. Learner selects a change, predicts direction and gauge kPa, and explains before revealing deterministic `ρgh/1000` trace. A 2D bar comparison has an equivalent semantic reading table. Focus moves to the result heading; native fieldsets, labels and a live status report errors. Strict revisioned, bounded action-only JSON export/import recomputes all results and rejects forged verified results/identity. Nothing is sent to a server; records are `local-unverified`.

Source: OpenStax University Physics 1 §14.1 and existing KAIRO `docs/pump-lab/MODEL.md`; review status is public-concept-checked but **independent engineering review pending**. Static hydrostatic columns are not active pumps, dynamic head, equipment operation or safety guidance. Density examples are invented teaching values, not real fluid measurements.

## Verification and release boundary

At first draft, a V8 model smoke/preflight check passed for 4 m, 1000 kg/m³ (39.23 kPa) and a local replay action. This is **not** a Node test, browser test or CI claim. The dedicated 16-test Node suite covers independent numeric oracles, tampering, revision, local replay, and static accessibility markers. Exact-head GitHub Actions Node24 full regression, Vite build and Python coordination tests must be observed and reported in the issue/PR before acceptance. No authorised browser/device/screen-reader test, independent subject QA, authenticated learner integration or impact evaluation has been performed.

Judging criteria: Product/Intelligence (checked source concept, deterministic prediction), Usability/Presentation (native inputs, 2D + table), Creativity (two distinct one-variable counterfactuals), Sustainability (local-only arithmetic; cost not measured), Impact (learning improvement unknown). Follow PR #34 conditional independent review, ownership reconciliation and device evidence before merge or mounting.

## Next dependency-ready work

1. Independent engineering reviewer: confirm the gauge-vs-absolute boundary, fixed-density assumption, source citations, pressure units and the six-case oracle. Accessibility reviewer: authorised keyboard, screen-reader, 200% zoom, mobile and JSON-error/focus test.
2. Coordinator/StudioRouter and authenticated lesson owners: after review and canonical bus reconciliation, choose **one** reviewed activity to integrate into source/revision/consent→practice→resume; do not merge all unmounted previews merely because their isolated tests pass.
