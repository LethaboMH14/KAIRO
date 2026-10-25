# Local OCR evaluation plan

## Purpose and limits

The existing source pipeline is a bounded local extraction/OCR pilot. This plan proposes a small evaluation that can say which inputs and source spans have been checked; it cannot establish broad OCR accuracy, language coverage, answer correctness, learner marks, or suitability for automatic lesson generation. No private text or personal identifiers belong in public reports. No cloud/model upload or original-file mutation is part of this plan.

The 537 candidate course files, 2,091 unclassified screenshots, 24 extracted documents, 41 pages/sections, separate two-page scan probe, and 24 sampled screenshots are prior snapshot counts recorded in the 21 October source handoff and private inventory/extraction summaries; this plan did not rerun inventory or extraction. All prior extraction records remain marked unvalidated/human-review required. The sample list below uses only opaque content IDs, extensions and counts; it is a candidate selection, not an answer set. The sample-table details come from the prior private `extraction-summary.json`, `scanned-probe-summary.json`, and visual-review summaries. They describe available candidates, not new validated results.

| Evaluation category | Opaque local ID | Format and extent | Basis / caveat |
|---|---|---|---|
| Text-bearing PDF baseline | `25c78b5075f57afc712c7ebd` | PDF, 2 processed pages | Existing bounded `pypdf-text` output with substantial text; verify selectable-text status against the local page before classifying as born-digital. |
| Scanned MCQ / OCR | `fb0f5f6252faa6eff37e909d` | PDF, 2 rendered pages | Existing RapidOCR scan probe; SQL option wording was visually checked but exact symbols/options still need human review. |
| Table / layout | `fea1bafef8a480a6e33f` | PNG screenshot, 1 image | Existing visual review identified a scenario table; table semantics and answer correctness were not validated. |
| Equation-rich candidate | `618f46f4d48c0e0914595ffb` | PDF, 2 processed pages | Native text has a high symbol-count heuristic; visual equation classification remains unconfirmed. |
| Coursework screenshot / diagram MCQ | `d68953a024144dfbfe16` | PNG screenshot, 1 image | Existing review identified a diagram/MCQ; graph semantics and answer correctness were not validated. |

IDs are existing opaque content IDs, not filenames. Do not publish a path-to-ID map or a sample's source text. If one candidate does not match its intended category after local visual review, replace it with another inventory ID and record only the alias/category/format/extent in a private manifest.

## Existing local tools and cost profile

- `tools/course_sources/extract.py` supports bounded local document extraction (`--max-files` 1–50, `--pages` 1–10) and optional RapidOCR. PDF text uses `pypdf`; scan rendering uses `pypdfium2` at scale 1.5; image OCR returns line text, confidence-like model scores and polygons, and always sets `needsReview`.
- The existing OCR venv has `rapidocr-onnxruntime` 1.4.4 and `onnxruntime` 1.31.0. It is configured for two intra-op threads and one inter-op thread. This is local CPU inference with no per-page API charge; the installed runtime/model footprint is already present. This evaluation should not install or update packages.
- `app_worker.py` limits uploads to 8 MiB, package expansion to 2,000 entries/40 MiB, processing to four pages and returned page text to 16,000 characters. It routes PDFs and raster images through local RapidOCR. These limits are application-worker boundaries, not a validated evaluation limit.
- `source_index.py` returns exact extracted excerpts with `sourceId`, `chunkId`, page/method and character start/end offsets. PDF text extraction has page locations but no visual bounding boxes. OCR currently has line polygons but no stable character offsets from those polygons.
- `windows_ocr.ps1` is a local Windows OCR alternative with word boxes and language tag but no confidence. Prior project notes record its invocation blocked by local script authorization. Do not weaken execution policy; use the already-installed RapidOCR path or defer that comparison.
- No paid provider, cloud endpoint, or network service is required or proposed. Earlier local setup and installed-package versions are recorded in the existing private inventory metadata and public tool docs; the exact local model version must be written into each future run report.

## Proposed reproducible protocol

1. In a separate bus task with a reviewed manifest/interface contract, reserve at most these five anonymized inputs and at most two pages/images per item. The user's existing authorization covers local coursework reading/extraction for this task; new data sharing or original-file modification beyond that authorization would need separate permission. Record only an opaque local ID, extension, page/image count, content hash, category candidate, selected page, rights/privacy tag, and local-only disposition. Do not duplicate originals; render to a private scratch directory and delete only derived scratch after review according to a documented retention plan.
2. Capture a deterministic run record: extractor/OCR version, arguments, model/runtime version, input content hash, selected page, local timestamp, output hash and per-page success/error. Keep it in the ignored private evaluation folder. Never store full OCR text in public test output or logs.
3. Create page-level transcription references from the visible source, not an official answer key. This transcription and adjudication work is required evidence for evaluation, not a separate permission request. Use a local human transcription and an independent second visual check for critical tokens (digits, signs, decimals, option labels, table row/column association and negations). Adjudicate disagreements against the image. Reference text and any personally identifying regions remain private; redact identifiers before making any public examples.
4. Score each category separately. Report character error rate and word error rate after only a documented whitespace normalization; additionally count exact-match status for critical tokens and layout associations. Do not pool the five heterogeneous inputs into a headline accuracy number. A citation/offset check is binary: each excerpt must reconstruct exactly from the stored page text at its reported offsets; each OCR line polygon must remain within the rendered page bounds and map to the correct page. Missing geometry/offset support is reported as unavailable, never fabricated.
5. Treat OCR scores as uncalibrated model outputs. Keep `needsReview` true for every OCR-derived page. Review all critical-token regions and any low-score region, and deliberately inspect some high-score regions for confident errors. With this small sample, report score/error observations only; do not infer a probability of correctness or set an automatic acceptance threshold. A quoted span is exact only when it matches the human-checked source span; mismatches stay flagged and cannot be used as authoritative text.
6. Keep question text, a learner's response, and an official answer key as separate source roles. Inventory filename kinds are heuristics, not proof. Default each page to role `unknown` until a human labels it. A student's submitted answer may be transcribed as visible text, but must never become answer-key truth. Do not infer a key, grade, mark, model answer or score from OCR. Any future key comparison needs a separately authorized, provenance-checked key and independent subject review.
7. Fail closed on encrypted/unsupported/corrupt input, no text layer, missing OCR runtime, render failure, timeout, empty OCR result, non-finite geometry/score, or broken citation offsets. Preserve the per-page error and source identity, mark the page unavailable for retrieval/lesson generation, and ask for human review. Never substitute guessed text or silently drop failed pages.

## Acceptance measures for a later implementation

- **Provenance gate:** every surfaced quote has source ID/hash, page, method and exact reconstructable offset or OCR region; any missing item blocks use of that quote.
- **Source exactness gate:** per-category CER/WER and critical-token mismatches are reported against private transcriptions. No broad pass-rate claim is made. Any mismatch in a proposed citation remains a visible review issue; only individually exact, human-reviewed spans may be described as exact.
- **Uncertainty gate:** all OCR output remains review-required. No confidence score alone clears a page or option. High-confidence critical-token errors are explicitly counted.
- **Role-separation gate:** source role is explicit and separately reviewed; student response text is never promoted to key. OCR-only grading and marks remain unavailable.
- **Failure gate:** every attempted page has either a checked output or a structured, visible failure. Missing/failed pages cannot disappear from counts.
- **Privacy gate:** only anonymized counts/metrics enter public documentation; content, screenshots, path maps and references remain under an approved private scope. No cloud upload and no original changes.

These are proposed gates for the next task, not measured results or proven universal thresholds.

## Suggested follow-on scopes

1. **Private sample/gold preparation (requires its own exact bus claim and reviewed manifest/interface contract):** proposed `data/private/course-sources/evaluation/manifest.json` plus private transcription/review outputs in that evaluation subtree only. This is where sample ID mappings, source roles, page selection, redactions, gold text and raw run outputs may live. The current local reading/extraction authorization applies; any new data sharing or original-file modification outside that scope needs separate permission. Do not put any private mappings, text or raw outputs into public docs or tests.
2. **Local evaluation harness (separate runtime task after the private manifest contract is approved):** proposed `tools/course_sources/evaluate_ocr.py` and `tools/course_sources/test_evaluate_ocr.py`. It should consume opaque IDs from the private manifest, never accept arbitrary external paths, avoid network calls, and emit only summary metrics plus private per-page diagnostics.
3. **Human source/answer-role review (separate scoped review):** adjudicate source transcription and any answer-key provenance. Student work and answer keys remain separate; no scoring/mark estimation is included in OCR acceptance.

No private manifest, sample extraction, OCR run, test code, dependency change or source material edit was performed in this planning task.
