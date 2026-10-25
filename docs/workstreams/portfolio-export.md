# KAIRO portable practice portfolio export

## API

`studio/src/portfolio-export/model.ts` exports:

- `buildPortfolioExport({ practiceCases, worksimRuns })`: accepts raw case and WorkSim state records, passes them through the reviewed `summarizeCase` and `exportRun` replay validators, and returns a versioned `PortfolioExport` or `null` for an invalid/oversized envelope. Invalid individual runs are listed by their original array indices under `rejected`.
- `portfolioJson(portfolio)`: emits formatted JSON after an encoded-size check.
- `portfolioHtml(portfolio)`: emits a standalone accessible HTML report with fixed inline CSS and print styles.

The JSON format is `kairo-portfolio-export-v1`. Each included item is identified as `local-practice` or `synthetic-exercise` and preserves the underlying adapter artifact, including source/scenario/run identifiers, lesson identity where available, rubric, attempts, reflections, and assistance exposure. Unknown assistance remains `unknown`; reported assistance is retained as reported. There is no score aggregation or inferred correctness. The builder freezes accepted results and keeps a private integrity snapshot; public serializers accept only an unchanged result returned by the builder, so a caller cannot pass a hand-edited object labeled replay-validated.

## Boundaries and safety

The source models replay events against authored scenario rules. This provides a consistency check against the current rules; profile records and timestamps remain locally editable. The portfolio keeps the source artifacts' unverified status and states that self-report is not independent assessment, employer certification, hiring advice, ATS scoring, or accreditation. WorkSim's organization and records remain explicitly synthetic.

The input envelope accepts only `practiceCases` and `worksimRuns`, with at most 20 items combined and 250 KB of serialized input. Output JSON and HTML are each capped at 250 KB; over-limit HTML raises an error instead of silently truncating content. Invalid records are represented as rejected indices. HTML escapes dynamic values, uses semantic attempt/rubric tables and readable reflection text, and puts technical source/run/version identifiers in expandable details. It includes no script, network reference, remote image, data-driven link, or tracking code. The print layout uses the ivory, olive and brass palette from the KAIRO continuity direction.

## Evidence

`studio/tests/portfolio-export.test.mjs` covers JSON parsing and size, multiple artifact types, rejected source indices, unknown/none/hint assistance preservation, hostile HTML text, no script or remote resource injection, print styles, and malformed/oversized envelopes.

Run from `studio/` with `node --test tests/portfolio-export.test.mjs`.

This module is not connected to a route or download button. UI integration is a separate task.
