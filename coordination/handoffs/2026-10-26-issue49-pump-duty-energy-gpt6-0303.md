# Issue #49 — pump shaft-energy versus power (isolated)

Session: `gpt6-i49-pump-duty-energy-20261026-0303-s`; client ChatGPT; model GPT-6; effort unknown. Branch: `feat/issue49-pump-duty-energy-20261026-0303-s`, based on `main@fc03149be570cb1bbf4b663f612c3fcbd28f0c76`.

## Scope and dependency

New-only `studio/src/studio-scenarios/pump-duty-energy-20261026/{model.mjs,app.mjs,preview.html}`, `studio/tests/pump-duty-energy-20261026.test.mjs`, this handoff. Existing #55 pump-what-if files and dedicated test, #128 static-head, #106 hydraulic-power, shared router, styles, manifest, cloud and auth remain untouched. Remote GitHub scope proposal in Issue #49 is cooperative/non-atomic; the owner's canonical SQLite coordination bus is unavailable. Coordinator must reconcile any local claim before integration.

## What works

A standalone, unmounted browser preview offers two fictional comparisons of constant **mechanical shaft power** (kW) over elapsed hours; the learner chooses bounded values for schedule B, predicts which uses less **shaft energy** (kWh), predicts the absolute difference, and explains before reveal. The model recomputes `E_shaft = P_shaft × time` and shows a plain-language trace, numeric reading table and optional 2D `<meter>` bars. Round 2 is independent. Local action-only JSON import/export checks exact source revision, order, keys, finite numbers and bounded explanations; results are recomputed, not trusted from import. The preview uses native keyboard controls, labels, visible focus, live status, text content instead of HTML insertion, and reduced-motion CSS.

Concept provenance: `docs/pump-lab/MODEL.md`, `kairo-pump-lab-model/1`, pinned to source main SHA in `SOURCE.revision`. The original pump model is illustrative and **not externally expert-reviewed**. The practice's constant-power schedules are KAIRO-authored synthetic examples, **not** the physics.ts dynamic power model or measured equipment. Shaft energy is **not** electrical input energy, tariff cost, a safe duty recommendation or verified learner progress.

## Evidence and judging

Product: learner can predict/reveal/retry in a complete local two-round activity. Creativity/Intelligence: variable-driven transparent arithmetic, not ML inference. Usability/Presentation: labelled controls, reading table, 2D meter and deterministic replay. Sustainability: no added runtime dependencies or cloud calls. Impact: unmeasured hypothesis only.

Local run (Node 22.16.0): `node --test studio/tests/pump-duty-energy-20261026.test.mjs` — **13/13 PASS** after correcting floating-point assertions to use a tolerance; `node --check studio/src/studio-scenarios/pump-duty-energy-20261026/app.mjs` — PASS. These are focused tests only. Node 24 repository-wide CI, TypeScript/Vite build and Python coordination checks must be reported separately from actual exact-head Actions results. No human/phone/browser/screen-reader or authenticated learner test was run. No Kaggle execution.

## Next dependency-ready work

1. Independent engineering/domain and keyboard/screen-reader/device review of this preview and PR #55; confirm shaft-versus-electrical distinction and whether a curriculum reviewer accepts the source.
2. With explicit coordinator ownership, connect one accepted challenge to the authenticated source/revision → practice → owner-scoped evidence/resume contract; only after #34 conditional review and real visual/device acceptance. Do not directly modify shared router from this branch.
