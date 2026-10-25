# Independent source-intake and retrieval memo

23 October 2026. Replacement Lane A research, independent of the existing `docs/authoring-ingest-20261023/` claim. Read-only code review plus public primary-source verification. Recommendation: retain current bounded local parser path as the default; close original/source revision lineage before adding parser breadth; evaluate layout parsing only against a fixed corpus. This memo does not implement or install anything.

## Current path and boundaries

`studio/server/workspace/routes.mjs` accepts PDF, DOCX, PPTX, XLSX, TXT, MD, PNG, JPG/JPEG as raw octet-stream up to 8 MB. It serializes one extraction at a time, runs a private worker with a 120 s timeout, stores up to 30 in-memory job statuses, deletes the uploaded original in `finally`, and retains up to four sections with 16,000 chars each in `safeSource`. `app_worker.py` enforces private-upload path containment, 8 MB file size, ZIP ≤2,000 entries / ≤40 MB expanded, and image ≤12 MP. It parses text PDFs with pypdf; scans low-text PDF pages with pypdfium2 rendering + RapidOCR; PNG/JPEG with RapidOCR; DOCX with python-docx paragraphs/tables; PPTX slide text from XML; XLSX read-only first 100×20 cells per first four sheets (formulas not executed); TXT/MD UTF-8 with replacement. `extract.py` computes SHA256/sourceId, chunk offsets (1,400 chars, 180 overlap), OCR polygons/confidence and review flag, but `safeSource` drops hash, polygons/confidence, table arrays, pageCount, and original path/content. It keeps text, locator, method. Job response is the only immediate link to upload job; original is deleted after parse.

Source review in `routes.mjs` overwrites the same source JSON: `reviewedPages`, revision hash, reviewed flag/time. No immutable original or prior reviewed revisions are addressable from the workspace route, and save has no expected-revision/CAS conflict guard. Thus citations to the current reviewed text are traceable within that revision, while source authenticity, comparison with original pixels, and historical review chain are gaps. Avoid overstating: upload, package-expansion, image-pixel and timeout bounds already exist. More robust signature/content-type validation, decompression-ratio policy, parser process isolation/resource limits, and hostile-document corpus checks remain worthwhile before public exposure.

## Formats and decision

| Format | Current behavior/status | Bounded next step |
|---|---|---|
| Pasted text, TXT, MD | Supported; UTF-8 replacement; upload preview truncates each extracted section | Preserve full admitted text or state exact coverage; treat markup as data, render escaped |
| Text/scanned PDF | pypdf text; low-text page rasterized by pypdfium2 and OCR by RapidOCR; at most four sections retained in app | Keep pypdf + existing render/OCR. Add page preview and source-pixel lineage before replacing extraction |
| DOCX | Paragraphs and tables extracted; no stable printed-page locator | Keep paragraph/table/cell locators; preserve table structure through adapter |
| PPTX | Slide text from XML in order; diagrams/layout not interpreted | Keep slide number and shape/notes provenance; no OCR/layout claim without fixtures |
| XLSX | First 100 rows ×20 columns, first four sheets; formula strings, not calculated values | Preserve sheet/cell coordinates and formula/value distinction; never execute workbook code/macros |
| PNG/JPEG | OCR; coordinates retained in extractor output, lost in app projection | Preserve crop/polygon and confidence with review UI; require learner correction for formulas/options |
| CSV, HTML/web, audio/video | Not admitted by current upload extension allowlist | Future adapters only after rights, SSRF, size/time and transcript policies |

Small reviewed inputs should be sent whole when within explicit token/character limits. For longer text, lexical/section ranking is the inexpensive first retrieval method; show passages, locators and omitted coverage. Chunk offsets currently exist in extraction pilot but are not projected into workspace evidence. Add tested lexical selection/recall before embedding. Embeddings are a later candidate only if a representative evaluation set demonstrates missed relevant passages; compare recall@k and citation coverage against whole-context/lexical baselines, by document type and formula/table questions. Similarity is ranking, not truth or entailment. Preserve exact spans, extraction method and source revision regardless of retrieval method.

## Tool candidates and licence check

- **Keep** current pypdf + pypdfium2 + RapidOCR for this stage. pypdf repository states BSD-3-Clause; pypdfium2 itself offers Apache-2.0 or BSD-3-Clause, while bundled PDFium and other dependencies have their own notices; RapidOCR source is Apache-2.0, and the selected OCR model/weights need separate attribution/licence review. [pypdf licence](https://github.com/py-pdf/pypdf/blob/main/LICENSE), [pypdfium2 notices](https://github.com/pypdfium2-team/pypdfium2/tree/main/LICENSES), [RapidOCR licence](https://github.com/RapidAI/RapidOCR/blob/main/LICENSE), [model notices](https://rapidai.github.io/RapidOCRDocs/main/en/model_licenses/).
- **Docling** is a reasonable offline layout/table extraction benchmark candidate, not an established replacement. Its current repository LICENSE is MIT (verified directly), correcting the unverified “Apache/MIT?” question. Transitive dependencies, optional model weights and their terms remain separate. [Docling LICENSE](https://github.com/docling-project/docling/blob/main/LICENSE), [official docs](https://docling-project.github.io/docling/).
- **PDF.js** is Apache-2.0 and useful for an in-browser page viewer/text selection; it is not an OCR engine or lesson planner. Adopt only if original-page review becomes the explicit gap. [PDF.js LICENSE](https://github.com/mozilla/pdf.js/blob/master/LICENSE), [official project docs](https://mozilla.github.io/pdf.js/).
- **PyMuPDF** is AGPL or commercial per vendor documentation. It is not justified as a default replacement; use only after a deliberate licence path and benchmark showing needed capability. [Official licence terms](https://pymupdf.readthedocs.io/en/latest/about.html#license-and-copyright).
- Tesseract is Apache-2.0 but would add a second OCR stack beside the current RapidOCR path; defer unless evaluated language/formula fixtures show a specific gap. [Tesseract LICENSE](https://github.com/tesseract-ocr/tesseract/blob/main/LICENSE).
- Google Document AI is a paid cloud candidate, not a default or tested path. Current pricing is processor/page dependent; region documentation lists only supported locations and requires a chosen processing region. Verify an appropriate South Africa/latency/privacy location, current SKU, retention/data terms and measured quality before any proposal to spend or send learner documents. No call or resource was made. [Pricing](https://cloud.google.com/document-ai/pricing), [regions](https://cloud.google.com/document-ai/docs/regions).

## Output contract proposal

Retain immutable original bytes where the learner's chosen storage/retention policy permits; otherwise state that only a derived reviewed text copy survives and make the limitation explicit. Store original digest separately from each extraction/review digest. Never silently rewrite source truth.

```json
{
  "schema": "kairo-source-manifest/1",
  "sourceId": "24-hex-id",
  "original": {"sha256": "hex", "mediaType": "application/pdf", "bytes": 12345, "retention": "private-local"},
  "extraction": {"id": "24-hex-id", "tool": "pypdf+RapidOCR", "version": "pinned", "createdAt": "ISO-8601", "warnings": []},
  "sections": [{"id": "p3", "locator": {"page": 3}, "method": "rapidocr", "text": "...", "spans": [{"start": 0, "end": 12, "polygon": [[0,0],[1,0],[1,1],[0,1]], "confidence": 0.91}], "needsReview": true}],
  "review": {"revision": "sha256-of-canonical-reviewed-sections", "parentRevision": null, "status": "unreviewed", "checkedAt": null, "corrections": []}
}
```

Use stable section/span IDs mapped back to original page/slide/sheet/cells. A review creates a new immutable child revision with expected parent revision; conflict returns both drafts intact. Lesson evidence must name the exact reviewed revision and quote offsets. Preserve extraction and review errors as structured outcomes rather than generic retry alone.

## Concrete paths and errors

| Input | Proposed output | Expected errors/recovery |
|---|---|---|
| Scanned formula PDF page 3 | Original page image + OCR line/polygon/confidence + `Page 3` locator + unreviewed text; learner corrects symbols before formula activity | Empty/low text → “Could not read this page”; oversized raster/time limit → reject page and offer clearer image or paste; uncertain formula/options never auto-corrected |
| DOCX lab sheet with a 3-column measurement table | Paragraph blocks plus table ID and row/column/cell coordinates; preserve headers, units and blank cells | Corrupt/unsupported package, missing headers/ambiguous merged cells → show extraction warning and original if retained; do not flatten into unlabeled numbers |

Also distinguish unsupported extension, encrypted file without supplied password, invalid container/signature mismatch, package bomb, pixel/file limits, extraction timeout/OOM, OCR unavailable, and storage revision conflict. Error text should say whether original was retained/deleted and whether prior saved source remains recoverable.

## Retrieval acceptance and source gaps

Build a small rights-cleared, human-annotated evaluation set covering native PDF, scan, equation, multicolumn text, DOCX table, XLSX formulas and mixed image/page. Record original hash, page/cell gold spans, expected covered facts, OCR edits, extraction version, retrieval top-k, time and peak memory. Report per-format exact-span recall, table cell/header preservation, formula transcription errors, citation validity and failure counts; do not combine OCR confidence with factual confidence. Hold source/licence approval separate from learner correctness.

Priority gaps: original is currently unlinked/deleted after extraction; richer OCR/table/hash fields are lost in `safeSource`; review overwrites mutable source without revision history/CAS; workspace evidence chunks are regenerated only from reviewed text and need a stable offset-to-original mapping; error taxonomy is partly collapsed in worker catch; DOCX page numbers cannot be claimed. This is a continuity/provenance gap, not absence of all intake controls.

## Judging evidence map

| Criterion | Learner need and acceptance evidence | Current boundary / gap |
|---|---|---|
| Product | Upload → inspect/correct → cite exact revision → lesson → continue; acceptance: reproducible source-to-lesson trace | Existing local flow works with bounded sections; original lineage/history missing |
| Creativity | Formula/table remain meaningful interactive evidence; acceptance: source-specific task from scanned equation and Office table fixtures | Format parsing exists; broad structured-layout accuracy unvalidated |
| Usability | Clear progress/recovery and usable original/reading alternative; acceptance: learner can correct OCR and resume after parse failure | Current errors are generic; original viewer absent |
| Sustainability | Reproducible parser versions, licence inventory and costed alternatives; acceptance: locked toolchain and per-file CPU/memory metrics | No new install/benchmark here; Docling/cloud remain candidates |
| Impact | Better access to personal course material without assuming benefit; acceptance: later consented task study | No learner or learning gain evidence from this memo |
| Presentation | Show an actual scanned equation/table with provenance and uncertainty; acceptance: demo labels extraction vs reviewed claims | Proposed demo only; no UI/demo built |
| Intelligence | Retrieve the right exact span and explain why selected; acceptance: annotated recall@k and citation/span tests, lexical baseline | Chunking exists in extraction pilot; workspace safe projection strips chunk metadata; embeddings unproven |

## Research sources, date and confidence

Reviewed 23 October 2026. High confidence on current local behavior from named code; high on repository LICENSE text at accessed upstream branch, but moving `main/master` links should be pinned to commit before adoption. Medium on proposed parser fit pending a KAIRO corpus benchmark. Low/unverified on any future price/region suitability beyond current official product pages; refresh before use. Primary references: upstream project LICENSE/docs above; [Google Document AI pricing](https://cloud.google.com/document-ai/pricing) and [region matrix](https://cloud.google.com/document-ai/docs/regions). No source requires installing or invoking a tool.
