# Synthetic local OCR evaluation helpers

`tools/course_sources/ocr_eval` is a small pure-Python helper library for evaluating in-memory page records. It does not open files, run OCR, use the network, read a manifest, grade an answer, or write evaluation output. Private manifest/gold preparation remains a separate reviewed task.

## Interface

- `score_text(reference, recognized)` applies Unicode NFC normalization and collapses whitespace runs to one ASCII space. It preserves case, punctuation, digits, signs and symbols. CER uses Unicode code points; WER splits on normalized whitespace and retains punctuation attached to each word. Rates are error ratios, not accuracy, and are not capped: insertions may exceed 1.0. Empty reference denominators, size caps, word caps or edit-cell budget overflow return `available: false` with null metrics.
- Edit distance uses O(min(n, m)) working rows. Workload caps are checked before distance calculation: 20,000 input characters, 5,000 tokens, 1,000,000 DP cells per metric, 1,000,000 combined estimated edit cells across a batch, 100 critical checks and at most 1,000 page records. If the aggregate batch budget is exceeded, every otherwise scoreable success row is marked unavailable with `batch-edit-budget`; failures and malformed rows retain their own counts. No subset is scored and no row is silently dropped.
- `check_critical_tokens` compares caller-reviewed reference and recognized token regions literally. It returns only index/exact flags, never token text or labels. It cannot validate who supplied the reference or whether it is an official key.
- `validate_provenance` checks an opaque 24-character lowercase hex source ID, source role (`unknown`, `student-response`, or `reference-transcription`), positive integer page, allowlisted method, and exact `page_text[start:end] == excerpt` offsets. Optional geometry requires positive finite page dimensions, bounded polygon/point counts, finite coordinate pairs and coordinates inside page bounds. It checks bounds, not polygon semantics, alignment or OCR quality.
- Successful records must declare `score_scope` as `page` or `excerpt`. For `page`, `recognized_text` must exactly equal the provenance-checked `page_text`; for `excerpt`, it must exactly equal the checked `excerpt` whose offsets match `page_text[start:end]`. `reference_text` is the caller-reviewed reference for that same declared scope. A mismatch is unavailable and is never scored, even if the unrelated candidate would compare perfectly.
- `evaluate_pages` accepts an explicit in-memory sequence only. It counts each supplied page as attempted, including malformed and failed records. Results contain only input index, validated source ID/page/role/method, status, safe error codes, numeric metrics and critical-match flags; no raw text, token value, path or exception message is returned. Failure records may omit excerpt offsets; successful records require them.

Roles remain descriptive metadata. `unknown` and `student-response` do not become authoritative source text. `reference-transcription` means a caller supplied a transcription reference, not that it is an answer key or correct answer. No answer-key role, marks, learner grading or answer inference exists in this library.

## Synthetic verification

Run from `tools/course_sources/`:

```powershell
python -m unittest discover -s ocr_eval -p test_ocr_eval.py -v
```

Tests use authored synthetic strings and polygons only. They cover uncapped insertion error rates, empty reference, per-record and aggregate workload bounds (including an exact-boundary case), page/excerpt scope binding, exact signs/options, offset and role failures, invalid geometry, source privacy in output, and attempted-page accounting including failure cases. They do not use the private sample IDs or source files and do not support a broad OCR accuracy claim.
