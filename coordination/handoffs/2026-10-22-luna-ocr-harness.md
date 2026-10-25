# Synthetic OCR evaluation helper handoff

- Task: `LUNA-OCR-HARNESS-001`
- Agent/session: `codex-luna-ocrharness-20261022-a` (Codex, gpt-6-luna, low)
- Scope: `tools/course_sources/ocr_eval`, `docs/workstreams/ocr-evaluation-harness.md`, and this handoff.

## Delivered

Added a pure in-memory Python library with bounded CER/WER, literal critical-token comparisons, page/offset/optional polygon provenance validation, and per-page result summaries. Successful scoring requires an explicit `score_scope`: `page` binds candidate text to validated page text; `excerpt` binds it to the validated offset excerpt. A mismatch stays unavailable rather than scoring unrelated text. The only emitted source identifier is accepted after a strict opaque-ID check. Text, path, arbitrary token values, and exception messages never enter result summaries. Allowed methods and failure codes are enumerated. Roles are limited to `unknown`, `student-response`, and `reference-transcription`; none provides answer-key authority.

Normalization uses Unicode NFC and whitespace collapse while preserving case, punctuation, digits, signs, and symbols. Levenshtein uses O(min(n,m)) auxiliary memory, with caps on input length, tokens, per-record DP cells, combined batch edit-cell estimates, critical checks, polygon points and pages checked before expensive processing. When a batch exceeds its aggregate budget, all otherwise scoreable success rows become unavailable while failure/malformed rows keep their status; there is no partial batch scoring. Error rates are not capped; empty references and workload overflow return unavailable/null rather than zero. Every supplied page row counts as an attempt, including failures and malformed data.

## Checks

- `python -m unittest discover -s ocr_eval -p test_ocr_eval.py -v` from `tools/course_sources/`: **9 tests passed**, including exact aggregate-budget boundary/overflow and page/excerpt binding cases.
- `python -m compileall -q ocr_eval` from `tools/course_sources/`: **passed**.
- Tests use only synthetic text, metadata and polygons; no private source files, OCR execution, filesystem input, network access or dependency installation occurred.
- No package manifest, extractor interface, private manifest, gold transcription, test fixture corpus, or source data was changed.

## Limits and next step

Geometry validation checks numeric bounds only; it does not prove a polygon aligns with printed words. The library cannot establish transcription authority or source correctness. Root can review this helper contract before any separate private manifest/reference task. The library has not been run against the private OCR candidates and supports no general OCR accuracy or language claim.
