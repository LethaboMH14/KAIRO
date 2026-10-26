# Issue #49 — pump measurement-uncertainty lab (26 October 2026)

Session `gpt6-i49-pump-uncertainty-20261026-0405-s`, ChatGPT GPT-6, effort unknown. Base main `fc03149be570cb1bbf4b663f612c3fcbd28f0c76`; branch `feat/issue49-pump-uncertainty-20261026-0405-s`. Remote PLAN posted in Issue #49 comment 6406627646 before edits. This is a **non-atomic cooperative remote scope notice**, not a local SQLite-bus claim: canonical owner-local bus cannot be inspected from GitHub. Coordinator must reconcile local claims before integration.

## Exact exclusive file scope

New-only `studio/src/studio-scenarios/pump-uncertainty-20261026/{model.mjs,app.mjs,preview.html}`, `studio/tests/pump-uncertainty-20261026.test.mjs`, and this handoff. No shared router, global CSS, package/lockfile, authentication, lesson data, existing pump-what-if, other PR paths, cloud, IAM or deployment modifications. PR #55 continues to own the original pump what-if; PR #53 is still open/unmerged, so no Kaggle lab edits. PR #54 closed unmerged and draft #96 does not establish an active competing Codex job.

## Learner need, behaviour and limits

A gauge value can differ from a model without proving a mechanical fault. Two fictional, independently recorded prediction rounds ask the learner to choose a reading and uncertainty, predict the relationship of measured and expected intervals, and explain **before** reveal. A deterministic interval comparison shows both 2D bars and equivalent numeric reading table. Three outcomes: measurement band fully within model band, partly overlapping, or separated. Touching bands are never declared separated; a wide reading band enclosing the model is inconclusive, not certain agreement. UI uses native form controls, a reading alternative, result focus recovery, explicit local JSON copy/import and error preservation.

The internally authored `docs/pump-lab/MODEL.md` (`kairo-pump-lab-model/1`) describes units, noise and limitations; it has **not** been externally validated. The prepared model bands, readings and selectable uncertainty values here are independently authored fictional teaching fixtures, not empirical instrument specifications. No sensor was connected; no equipment control, fault diagnosis, live measurement, safety instructions, verified mastery or real learner account data. Static `SOURCE_REVISION` is a pinned *label*, not a live authenticated source-owner check. The model explicitly reports `local-unverified` and rejects a claimed `verified` status, fabricated outcomes, owner IDs, unknown source revisions and malformed/reordered actions. JSON contains actions and explanations only; results are recomputed.

## Validation evidence and honest gaps

Local isolated Node **22.16.0**: `node --test tests/pump-uncertainty-20261026.test.mjs` **16/16 PASS**; `node --check` on model and app PASS. Tests include **32 independent interval-oracle combinations**, two boundary-touching cases, wide-uncertainty negative controls, two distinct attempts, replay/source/schema tampering and static accessibility/network checks. These are synthetic math and code checks, not measured learning performance. No browser/device, keyboard navigation, screen reader, 200% zoom, human subject-matter review, hosted Kaggle training or authenticated learner integration was executed locally. The repository-wide Node24 suite, Vite production build and Python coordination tests must be checked on the **exact new PR head**, with real Actions logs and SHA recorded separately; never reuse the green main run #40246318389 as proof of this branch.

## Judging lens and next dependency-ready work

Product: working two-round standalone learning interaction, not authenticated app mount. Creativity: shows how interval overlap changes interpretation. Usability: keyboard-native reading interface and focus management implemented; real-device verification outstanding. Sustainability: deterministic local CPU only; runtime cost not measured. Impact: addresses a plausible measurement misconception; learning gains unknown. Presentation: chart/table both exist; no authorised screenshot. Intelligence: explainable arithmetic, not ML or externally validated fault detection.

1. Independent pump-domain, accessibility and code-diff review; authorised real keyboard/screen-reader/mobile/200%-zoom and reduced-motion observation, with defects fixed before acceptance.
2. Coordinate one source-revision-verified, owner-authenticated StudioRouter/progress integration with actual interface owners and canonical local bus, under PR #34 conditional merge gates. Recheck exact integrated CI and visual evidence. Do not self-merge or deploy.
