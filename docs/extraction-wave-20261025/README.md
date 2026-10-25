# Extraction coverage wave — 25 October 2026

## Need and judging criteria

Product, Intelligence and Usability: a learner reviewing a source needs to see which PDF pages contributed native text, which used OCR, which need a manual check, and which were not checked. Coverage communicates extraction activity only; it does not claim semantic or visual understanding.

## Delivered behavior

- `extractUpload(bytes, ext, {runNative, runOcr}?)` retains its existing `{pages, limitNote, extraction?}` contract and may now include `coverage: {schemaVersion: 1, units, warnings, visualUnderstanding: false}`.
- Sparse and mixed PDFs retain native text and source page anchors. A blank native page in the first four pages triggers OCR even when other pages have 80+ native characters. OCR text is added only for pages with no native text, within the existing four-page, 25-second-per-page and 12-million-pixel bounds. Existing 8 MiB upload admission and 120-second child-process timeout remain in place.
- Duplicate native blocks for one PDF page aggregate under that page anchor. Merged preview stays within 100 sections, 16,000 characters per section, 48,000 total characters and 64 KiB.
- Image OCR retains the established string locator (`Page 1`); PDF OCR carries page-index locators until presentation.
- Each known PDF page receives `text`, `ocr`, `needs-review` or `skipped` status. Unknown document length is stated as unknown. Page status does not imply that the content itself was interpreted.
- Other native extraction formats report unavailable page-level coverage rather than presenting an empty list as complete. The standalone UI gives an explicit unknown state and warns that OCR is not visual/semantic understanding.
- Native/OCR runners can be injected for deterministic local behavior checks; no model, network, browser, camera or cloud call was added.

## Evidence and limitations

See [CHECKS.txt](CHECKS.txt). Focused tests invoke production `buildCoverage` and `extractUpload` with deterministic extractor fixtures; they do not exercise a physical scanner, real OCR accuracy, browser rendering, end-to-end source review or learner comprehension. The four-page OCR window still begins at the first PDF page, so a scanned page after that window is marked skipped even when the native parser could not extract text.
