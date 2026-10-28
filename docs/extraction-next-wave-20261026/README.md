# Extraction wrapper correctness repair — 26 October 2026

## Judging need and acceptance

**Criteria:** Product (does what it claims) and Intelligence (source coverage and bounded interpretation). Learner need: a reviewed extraction must not quietly include OCR outside its advertised page limit, and a parser failure must still allow a safe, clearly labeled OCR preview where available. Acceptance uses the actual `extractUpload` and `buildCoverage` functions with injected deterministic adapters, plus the existing Python ingestion suite on synthetic generated documents.

## Changes

- The PDF wrapper now ignores OCR page results outside the first four source pages while retaining native text found later in the document. Coverage marks pages outside the OCR window as skipped.
- Coverage counts distinct OCR page indices, not response rows. Duplicate reports no longer consume the four-page allowance, and OCR cannot change coverage for a page outside the bound.
- A thrown native PDF runner error now tries the existing OCR runner. Successful fallback output is limited to the same four-page window and labeled as OCR-only, with a generic warning rather than raw parser error details. Failed native result validation still fails closed.
- The existing return shape and limits remain in place: 100 review sections, 16,000 characters per section, 48,000 characters and 64 KiB total review text, OCR bound of four pages, and `visualUnderstanding: false`. Native Office summary counts remain available; per-page coverage stays explicitly unavailable for those formats.

## Evidence

From `studio/`, using installed Node 24 and `KAIRO_PYTHON=C:\Python311\python.exe` (no dependency install):

```text
node --test tests/extraction-next-wave.test.mjs tests/extraction-coverage.test.mjs tests/extraction-edge-wave.test.mjs tests/material-ingestion.test.mjs
26 passed, 0 failed
```

The new tests prove the pre-fix wrapper failures for over-bound OCR merging, native-runner exception propagation and duplicate OCR coverage consumption; they also cover blank scan coverage and native Office reporting. The existing Python ingestion suite exercised nine synthetic TXT/PDF/DOCX/PPTX/XLSX cases and passed.

`npm run build` was attempted from the isolated worktree but could not start because `tsc` is not installed there. No packages were installed. `tests/native-extraction.test.mjs` could not load in the isolated worktree because `google-auth-library` is unavailable. Root should rerun build and any broader app tests after reviewing/importing the branch with the repository's full dependency environment.

## Remaining gaps

The injected native/OCR adapters use synthetic results; no real learner document, scanned page, OCR recognition quality, visual understanding, human comparison or device/browser acceptance was performed. Native OCR process timeout and output-buffer defaults remain the existing 120-second / 1.1 MB limits. These checks are regression evidence for the JavaScript wrapper, not an extraction-accuracy or learning-gain claim.
