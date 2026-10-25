# LUNA-PORTFOLIO-EXPORT-001 handoff

Agent `codex-luna-portfolio-20261022-a`, Codex, `gpt-6-luna` / low. Exact scope: `studio/src/portfolio-export/`, `studio/tests/portfolio-export.test.mjs`, `docs/workstreams/portfolio-export.md`, and this handoff.

## Delivered

- Added a portable export adapter with `buildPortfolioExport`, `portfolioJson`, and `portfolioHtml`.
- The builder accepts raw `practiceCases` and `worksimRuns`, validates them through the reviewed `summarizeCase` and `exportRun` APIs, and reports invalid item positions. It caps aggregate item count at 20 and serialized input/output at 250 KB.
- Output JSON is versioned `kairo-portfolio-export-v1`. It retains both underlying artifact records and labels each as `local-practice` or `synthetic-exercise`. Assistance values and reflections are carried through unchanged.
- Standalone HTML has fixed inline CSS, selectable semantic content, print styling and escaped dynamic values. It contains no scripts, external references, remote images, data-driven links or tracking code.
- Added the API/limit note in `docs/workstreams/portfolio-export.md`. No route, UI, router, shared profile model or package manifest was changed.

## Checks

- `node --test tests/portfolio-export.test.mjs` from `studio/`: passed, 4 tests.
- No full app build or browser run was performed; root owns final build and UI continuity integration.

## Limitations

Replay verifies consistency with authored rules but cannot establish identity or immutable history. The artifacts remain self-reported and unverified. Synthetic records are clearly labeled as invented exercises. The module is not yet connected to a download UI.

## Review updates

Root review prompted these changes before acceptance:

- HTML now includes the original source and linked lesson identity, semantic rubric tables and attempt lists, and expandable technical metadata. It follows the continuity ivory/olive/brass palette.
- A private `WeakMap` snapshot plus deep freeze prevents the public serializers from accepting a cloned or mutated object merely typed as replay-validated.
- Discriminated-union accesses were narrowed on `evidenceType` / rubric shape.
- `npx tsc --noEmit --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution Bundler --allowImportingTsExtensions --strict --skipLibCheck src/portfolio-export/model.ts` from `studio/`: passed.
- `node --test tests/portfolio-export.test.mjs` from `studio/`: passed, 4 tests after review changes.
