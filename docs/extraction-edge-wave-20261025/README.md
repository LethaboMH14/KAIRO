# Extraction edge coverage, 25 October 2026

## Judging need and acceptance

Criteria: Product (does what it claims), Usability (learner can tell what needs checking), Intelligence (source traceability and bounded interpretation). Learner need: understand which parts of a document were extracted, which were skipped or OCR-derived, and where each extracted passage came from. Acceptance: focused tests exercise the production `extractUpload`, `buildCoverage`, and `nativeReview` functions for sparse PDF coverage, blank OCR, non-PDF locators, unknown totals, visual limits, and review truncation.

## Supported-format boundary observed in source

| Input | Native path | Locator / coverage | Known limits |
|---|---|---|---|
| PDF | pypdf page text; OCR fallback can fill up to four pages | Page numbers; per-page text/OCR/skipped/needs-review | Sparse or image-only pages need OCR; OCR may err; formulas, figures, and visual meaning need manual review; native parser caps at 100 units |
| DOCX | top-level body paragraphs and table cells | paragraph/table row and cell indices | Headers, footnotes, comments, nested tables, floating visuals excluded |
| PPTX | slide text, table cells, speaker notes | slide plus shape/element details in native blocks | charts, images, embedded objects not interpreted; processing capped |
| XLSX | populated cells and formulas | sheet and cell range | formula text is extracted; no workbook recalculation or semantic interpretation |
| TXT / MD | UTF-8 text sections | section index | unsupported encodings/errors fail extraction |
| PNG / JPG | OCR preview | OCR page locator | four-page OCR bound; formulas/figures/visual meaning not interpreted |
| Other extensions | unsupported | extraction failure | no native path |

The review workspace further caps content at 100 sections, 16,000 characters per section, 48,000 characters and 64 KiB. OCR is an extraction aid, not validation. An extraction locator is traceability to source position, not a correctness guarantee.

## Evidence

`studio/tests/extraction-edge-wave.test.mjs` exercises production JS functions with bounded injected adapters for OCR/native parser outputs. The adapter fixtures are synthetic: they do not claim that OCR ran or that a real PDF/image was recognized. Existing `studio/tests/material-ingestion.test.mjs`, `extraction-coverage.test.mjs`, and `native-extraction.test.mjs` add parser/coverage checks; results from this wave are recorded in the handoff.

## Remaining gaps

No real encrypted/corrupt PDF or Office fixture was added in this bounded package; parser dependency/version-specific error messages remain covered only by existing ingestion/security tests. No human comparison against original scans, diagram/formula fidelity, browser/device acceptance, or learner usability evaluation was performed. The report reflects inspected implementation, not an exhaustive supported-format contract.
