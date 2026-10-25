# Extraction coverage handoff — 25 October 2026

Worker: `codex-luna-extraction-20261025-a`; client Codex; model `unknown`; effort `unknown` (not exposed in this worker context).

## Scope and criterion

Owned package A paths from `coordination/briefs/ai-integration-20261025/INTERFACES.md`. Product, Intelligence and Usability: learners need to know which pages supplied text and which pages remain unchecked or need review. Acceptance evidence is per-page mixed-PDF coverage with native anchors preserved, unknown-safe coverage UI, and tests calling production helpers.

## Changes

- `studio/server/learner-workspace/extraction.mjs`: optional injectable native/OCR execution; `buildCoverage`; mixed PDF merge preserving native page text and adding OCR only where native text is blank; unknown/limited/skipped page states.
- `studio/server/learner-workspace/ocr.py`: OCR output includes page indices, page count and status for attempted pages, while retaining the four-page, per-page time and pixel limits.
- Review follow-up: OCR now runs when any first-four PDF page lacks native text even if other native text exceeds 80 characters. Duplicate page blocks aggregate under a single page anchor. Merged PDF output remains capped at 100 sections, 16,000 characters per section, 48,000 characters and 64 KiB. Image OCR continues to return string page locators.
- `studio/server/extraction-coverage/index.mjs`: package helper export.
- `studio/src/extraction-coverage-ui/ExtractionCoverage.tsx` and colocated CSS: stateless default component with malformed/unknown-safe fallback and plain limitations.
- `studio/tests/extraction-coverage.test.mjs`: three production-helper tests for mixed, scanned, native, limited and unknown coverage.
- `docs/extraction-wave-20261025/`: behavior and verification record.

## Evidence

`node --test tests/extraction-coverage.test.mjs` from `studio/`: 7 passed, 0 failed. Requested combined extraction/security command: 16 passed, 4 failed. The four failures are native-extraction end-to-end cases whose ephemeral localhost connections failed with `EACCES`; parser/security checks passed. Python syntax check passed. TypeScript check remained active without diagnostics and was interrupted; inconclusive. No browser/device/human acceptance or OCR accuracy benchmark was performed.

## Remaining work and integration

Root owns routes/router/provider. Review the merge behavior and mount `<ExtractionCoverage coverage={result.coverage} />` at the extraction review surface. Existing OCR checks first four pages only; later pages remain skipped. OCR output is not semantic or visual understanding. Other file formats intentionally use the unknown coverage state. Bounds and upload admission flow were left in place; root should review cancellation behavior with any route integration.
