# Package A handoff: extraction edge regression coverage

Date: 25 October 2026. Owner: `codex-luna-extraction-edge-20261025-a`. Exposed model and effort: unknown. Bus task: `EXTRACTION-EDGE-WAVE-20261025-A`.

## Scope and judging need

Owned only `studio/tests/extraction-edge-wave.test.mjs`, `docs/extraction-edge-wave-20261025/`, and this handoff. Criteria: Product, Usability, Intelligence. Need: a learner can tell what extraction missed, distinguish OCR from native text, and retain source positions. Observable acceptance: focused runnable tests invoke actual `extractUpload`, `buildCoverage`, and `nativeReview` for sparse PDF/OCR coverage, blank OCR rejection, slide/cell/table locators, unknown counts, non-visual understanding, and byte/character truncation.

## Changes and decisions

- Added five focused regression tests against production JavaScript functions. Injected adapter results are explicitly synthetic; they do not assert that real OCR recognized content.
- Added a bounded source-derived format matrix with native/OCR paths, locator expectations and limitations.
- No extractor, parser, provider or route implementation changed.
- No new real encrypted/corrupt PDF/Office fixture was added. Existing ingestion/security tests already exercise corrupt package/error boundaries; this package focuses production JS mapping and review boundary behavior.

## Checks and actual results

- `node --test studio/tests/extraction-edge-wave.test.mjs`: **5 passed, 0 failed**.
- Root reran the native parser and edge files from the required `studio` working directory: `node --test tests/material-ingestion.test.mjs tests/extraction-edge-wave.test.mjs` passed **14/14** (0 skipped; about 40 seconds). This includes all nine existing native ingestion tests and the five new tests.\n- A separate attempt to run native API route tests was blocked by sandbox loopback `EACCES`; those route tests are not reported as passing. An earlier material-ingestion failure occurred when invoked from the repository root (incorrect working directory) and is superseded by the successful correct-cwd run.
- Several early assertions exposed actual boundary semantics (blank page inside first-four OCR window is `needs-review`; pages beyond that can be `skipped`; byte bound may truncate before the character bound); final assertions match those semantics.

## Limitations and next acceptance

Tests use bounded injected parser/OCR adapters and synthetic buffers, not independently parsed real-world documents. There is no learner/human scan comparison, diagram/formula fidelity study, browser/device acceptance, full suite acceptance, or format-wide compatibility proof. Root should review the report and test assertions, then run focused wider tests where loopback permissions allow. The actual open PR scopes were checked by root; PRs #71, #67, #19 have unrelated paths and the exact new test filename is unique.

## Publication status

Local source at baseline `a2dfc4f10499bcd32ac45548fc6767094b26c8d2`. This handoff records implementation evidence; isolated publication remains pending root review. Files to publish are only the three claimed paths above. No merge, deployment, or public access claim.


## Publication update

Draft PR: https://github.com/LethaboMH14/KAIRO/pull/73. Branch: `codex/extraction-edge-wave-20261025`. Published implementation commit: `d6ecc82c31b363aa25cbb1131f9bcd5278cc0270` (three files, 113 insertions). Root-created independent test evidence is **14/14** for material ingestion plus this package when run from the canonical `studio` directory. On the isolated publication worktree, the new focused tests pass 5/5; attempting the existing material-ingestion tests there returned 9 failures because the configured Python invocation returned a null process status. This worktree-specific setup difference does not override the successful canonical run and is not presented as parser acceptance from this checkout. The native API route tests remain not passed because loopback access returned EACCES.
