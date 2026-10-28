# Offline language and listening evaluation fixtures

**Purpose:** provide a small, dependency-free input contract for a later, explicitly approved evaluation. This package contains no model calls, recordings, translations asserted as correct, or measured language-quality results. Every starter row is authored synthetic content, has `synthetic: true`, `humanReviewed: false`, `status: "not-run"`, and `hypothesisText: null`.

## Criteria, need and acceptance

- **Impact:** make it possible to inspect candidate language tasks before any learner data is collected. Acceptance: explicit consent and synthetic markers validate; nothing here is user evidence.
- **Usability:** cover typed terminology, listening, transcript correction and an unavailable SASL state in a compact format. Acceptance: all five starter rows pass the validator; field meanings and failure reasons are documented.
- **Intelligence:** enable reproducible mechanical comparisons without claiming language understanding. Acceptance: WER/CER are absent for missing outputs and empty references, and every computed result carries `mechanicalOnly: true` and `establishesAccuracy: false`.

These are task/category labels, not product capability declarations. The fixtures do not change KAIRO's available languages or modes.

## Files and use

- `tools/language-listening-eval/fixtures.json`: synthetic starter pack.
- `tools/language-listening-eval/validator.mjs`: strict fixture and pack validator plus bounded-simple WER/CER functions.
- `tools/language-listening-eval/test.mjs`: offline contract and metric tests.

From repository root, run `node --test tools/language-listening-eval/test.mjs`. Validate a JSON pack from Node by importing `validatePack` from `validator.mjs`; a successful schema check says only that the data shape is accepted.

Each record has a unique `id`; `language` (`en-ZA`, `zu-ZA`, `st-ZA`, or the reserved `sfs` protocol label); `inputMode` (`typed-text`, `audio-reference`, `signed-video-reference`); boolean `consent` and `humanReviewed`; `referenceText`; nullable `hypothesisText`; an array of `{source, preferred}` terminology pairs; `synthetic`; `capability`; and `status`. `status` remains `not-run` for every starter row. `humanReviewed` means a human checked that text/reference for the stated purpose; all starter rows are false. No field records a model identity or model output.

Consent is metadata, not proof of valid consent. Before evaluating real learner or speaker material, obtain explicit purpose-specific consent and rights, minimize and protect data, document retention/deletion, and use an approved evaluation protocol. Do not put personal data or recordings into this starter pack.

## Metric definition and limits

`calculateMetrics(referenceText, hypothesisText)` returns no scores when the hypothesis is absent (`missing-hypothesis`), or when the normalized reference is empty (`empty-reference`). A score denominator of zero is never substituted with a number. WER uses Levenshtein edit distance over tokens split on collapsed Unicode whitespace, divided by reference-token count. It lowercases with locale `und`, applies Unicode NFC, trims/collapses whitespace, and **does not remove punctuation**. CER applies the same normalization and whitespace handling, then compares Unicode code points via `Array.from`, divided by reference-code-point count.

These choices make a simple repeatable baseline, not a language-neutral quality measure. WER tokenization does not model language-specific word segmentation; whitespace conventions differ; punctuation/case scoring policy can affect interpretation; code points are not grapheme clusters and may split visible combined characters; and equal character substitutions may have very different meaning. Terminology correctness, meaning preservation, dialect/register, pronunciation and learner usefulness need suitable human review. Do not compare scores across languages or datasets as if directly equivalent, or present these metrics as translation quality, comprehension, learning gain, or model capability.

Every computed result states `mechanicalOnly: true` and `establishesAccuracy: false`. A score is calculable from strings even when a human has not validated the reference; it therefore does not validate the reference or establish accuracy. This helper is intentionally offline and does not produce any result for the supplied starter fixtures because their hypotheses are null.

## SASL signer-review protocol (separate, not implemented)

The `sfs`/`sasl-unavailable` row is a placeholder that explicitly keeps SASL unavailable. It contains no signed clip, gloss, transcript, output, or evidence of support. Any future SASL evaluation requires a separately approved, Deaf-led and signer-reviewed protocol: qualified reviewers and compensation; informed and revocable consent; permissions and safe handling for video; signer-disjoint development/evaluation splits; documented regional/community variation; independent review of meaning, non-manual markers and spatial grammar; and a route to report disagreement. Hand landmarks alone are not a validated translation or understanding measure. Do not use this string-oriented WER/CER helper as SASL evaluation.

## Prerequisites before any provider/model comparison

This package does not call a provider, download a model, capture microphone/camera input, or define production integration. Later approved work must publish the exact model/version, prompt/configuration, data provenance and consent, source/reference review, language/dialect coverage, privacy and retention terms, failure handling, blinded review design, disjoint split, sample rationale, metric limitations and reproducible results. Keep baseline and human-reviewed references distinct. No such evidence is present here; model/API integration and all language quality claims remain open.
