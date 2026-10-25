# Handoff: extraction wrapper correctness repair

Date: 26 October 2026. Owner: `codex-luna-extraction-next-20261026-a`. Task: `EXTRACTION-NEXT-WAVE-20261026`.

## Scope and learner need

Criteria: **Product** (honest extraction results) and **Intelligence** (bounded source handling). Learners need OCR previews to respect the stated page cap and parser failures not to hide an available safe fallback. Observable acceptance: production wrapper tests show only pages 1–4 can be supplied by OCR, later native pages remain included, duplicates do not consume OCR slots, blank pages remain marked for review, and native parser exceptions can return a labeled OCR-only preview.

## Changed paths and decisions

- `studio/server/learner-workspace/extraction.mjs`: restrict OCR merge/coverage to the configured four-page window, count unique pages, and use generic-labeled OCR fallback when the native PDF runner throws. Validation errors remain fail-closed. `visualUnderstanding:false` and existing review/byte/time caps are preserved.
- `studio/tests/extraction-next-wave.test.mjs`: five regressions invoke the real wrapper/coverage functions with synthetic adapters, including mixed native/OCR pages, duplicate and over-limit OCR, native failure fallback, blank-page status and Office coverage summary.
- `docs/extraction-next-wave-20261026/README.md`: source-derived behavior, test evidence and limitations.
- No shared interface, native Python parser, manifest, route, upload flow, provider or cloud code changed.

## Checks and results

From `studio/` on the isolated branch:

- `KAIRO_PYTHON=C:\Python311\python.exe node --test tests/extraction-next-wave.test.mjs tests/extraction-coverage.test.mjs tests/extraction-edge-wave.test.mjs tests/material-ingestion.test.mjs` — **26 passed, 0 failed**. The nine existing Python parser tests ran against synthetic generated fixtures.
- `npm run build` — **not completed**; isolated worktree lacks `tsc`. No install was attempted.
- The separate `tests/native-extraction.test.mjs` runner could not load because `google-auth-library` is absent from this isolated dependency tree. This package's actual wrapper tests do pass without that import.
- No browser/device, real OCR, live source, provider or cloud action was performed.

## Remaining review and gaps

Root should review the exact branch, rerun wider tests/build in its available dependency environment, and decide whether to mount the wrapper fix. Parser/OCR behavior is tested using deterministic injected outputs; actual OCR recognition, scanned-content completeness, formula/diagram understanding and learner usability remain unvalidated. The fix does not imply OCR correctness or full-document understanding.

Publication is a draft PR for root review only; no merge or deployment was performed. The exact pushed head and CI status are to be shared with root after publication.
