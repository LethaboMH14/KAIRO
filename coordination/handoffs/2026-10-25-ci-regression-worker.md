# CI Python toolchain regression guard — 25 October 2026

## Session, ownership and dependency
- Session: `gpt6-kairo-ciworker-20261025-0537-a`; client: ChatGPT; actual model: GPT-6; effort: unknown.
- Issue: https://github.com/LethaboMH14/KAIRO/issues/2.
- Parent repair: https://github.com/LethaboMH14/KAIRO/pull/15 at initial parent commit `8f58d3c834f72abaacdc711ff182ed3c3d207c28`. This is a stacked, separately reviewed test deliverable; PR #15 targets PR #1.
- Own scope: `studio/tests/ci-python-toolchain.test.mjs` and this handoff. No edit to PR #15's workflow, resolver, four existing extraction/security tests, application feature code, cloud or deployment files.
- GitHub issue plan records remote cooperative ownership. The owner's canonical local coordination SQLite bus was inaccessible; no local claim is implied. Coordinator review required before integration.

## Implementation
- Add four serial Node tests loaded automatically by `node --test --test-concurrency=1 tests/*.test.mjs`.
- Assert `KAIRO_PYTHON` override wins over defaults in a fresh Node ESM subprocess.
- Assert unset `KAIRO_PYTHON` falls back to Linux/macOS `python3` or the existing Windows OCR virtualenv path.
- Execute the selected Python interpreter to require Python 3.11+, PIL/Pillow, pytesseract, pypdf, python-docx, python-pptx, openpyxl, pypdfium2 and reportlab fixture tooling.
- Exercise the Tesseract command via pytesseract. No test skips, deleted assertions, mocks of the Python installation, private test inputs or network calls.

## Actual local evidence
- Local isolated replica of PR #15's exact `studio/tests/helpers/python-interpreter.mjs` plus new test file:
  `cd /tmp/kairo-ciworker-local/studio && node --test --test-concurrency=1 tests/ci-python-toolchain.test.mjs`.
- Observed: **4 tests, 4 pass, 0 fail, 0 skipped**, 1.9 seconds.
- Local environment: Node v22.16.0; Python 3.13.5; installed OCR binary Tesseract 5.5.0.
- These are focused checks in a reconstructed local test folder, **not** the full Git repository or Node 24 baseline.

## Baseline, authoritative gates and limitations
- Real failing PR #1 run: https://github.com/LethaboMH14/KAIRO/actions/runs/40157365360 — app serial regression 728/746 pass, 18 fail due Windows Python executable missing and PIL absent; production build skipped; coordination bus job passed.
- New full GitHub Actions check must validate the stacked draft PR with the actual repo on Node 24: serial test suite (now 4 additional tests), production build and coordination Python unittest job.
- A passing focused local reproduction does not prove that workflow, native extraction, browser/device UX or production deployment works.
- Do not merge without coordinator review, a green authoritative GitHub Actions run and reconciliation of active canonical local bus claims.

## Judging / learner relevance
- Criteria: Product (reliable material extraction), Intelligence (source-grounded test integrity) and Sustainability (repeatable checks). Fixing CI protects learners' reviewed sources; it does not demonstrate increased learning outcomes.
- Observable acceptance: workflow fails explicitly when selected Python or OCR prerequisites disappear, rather than hiding extraction test failures.

## Next issue / handoff
- First: triage any remaining failed job on PR #15 or this stacked PR, with exact logs and corrected, scoped follow-up.
- Next separately unblocked issue: #3 can prepare an owner-scoped multi-source contract while integration awaits PR #1 approval. No shared production interface edited here.
