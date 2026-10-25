# Upload and extractor abuse-test evidence

**Date:** 24 October 2026. **Owner:** `codex-security-frameworks-20261024-l` (Codex, GPT-6, effort unknown). **Task:** `SECURITY-UPLOAD-TESTS-20261024-001`.

This package targets Product, Sustainability, Usability and Intelligence. Learners need uploaded study material to fail safely when malformed or mislabeled, without converting attacker-controlled bytes into misleading extracted source. Acceptance is based on real calls to `admit`, `extractUpload`, `nativeReview`, and `tools/material_ingestion/extract.py`, not source-string assertions or a test-only parser.

## What is covered

`studio/tests/security-upload-abuse.test.mjs` exercises:

- Unsupported active/executable/archive extensions and supported-extension signature mismatches (PDF, Office ZIP header, PNG, JPEG).
- Empty, non-Buffer and one-byte-over-8-MiB inputs, plus an ordinary UTF-8 text upload.
- A malformed tiny ZIP/Office file against the actual Python extractor; it must yield no content blocks and a recorded extraction failure.
- A tiny ZIP whose local and central directory metadata claim an uncompressed size just over 80 MiB. The on-disk fixture stays under 1 MiB; the actual extractor must reject it at the configured metadata expansion bound before parsing.
- Actual extractor result hash binding and provenance tamper rejection through `nativeReview`.
- A truncated PNG that passes the inexpensive PNG prefix check but is rejected by the actual Pillow/Tesseract extraction path. The check demonstrates that prefix admission is only a prefilter; it does not by itself establish XSS, source publication, or an exploitable upload bypass. The inspected original-serving route also uses a restrictive sandbox CSP and nosniff.

The prefilter's image byte checks are prefix checks only. Stronger full file decoding remains important as a parser-boundary control; this test records the current pipeline's rejection for the truncated synthetic input. It does not prove rejection of every polyglot or malformed image, nor does it validate safe browser rendering.

## Executed evidence

Command from `studio/`:

```text
node --test tests/security-upload-abuse.test.mjs
```

Environment: Node v24.18.0, project OCR virtualenv Python 3.11.9, installed `python-docx`, `python-pptx`, `openpyxl`, `pypdf`; no packages installed. Final focused result: **7 passed, 0 failed, 0 skipped** in 4.1 seconds. The synthetic archive was below 1 MiB and did not contain an expanded bomb payload. Temporary fixtures are removed in `finally` blocks. Raw runner output is in `CHECKS.txt`.

## Boundaries

No runtime/parser/provider changes, cloud activity, private learner files, browser/device observation, outbound network traffic, large decompression payload, or executable payload were used. This is focused automated evidence only; it does not establish broad parser security, complete MIME validation, account authorization, production config, or end-to-end human acceptance. Root owns aggregate integration and any implementation fixes.
