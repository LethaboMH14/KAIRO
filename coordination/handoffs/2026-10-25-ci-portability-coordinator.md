# CI portability handoff — 25 October 2026

## Session and scope
- Session: `gpt6-kairo-coordinator-20261025-0535-ci2`; client: ChatGPT; model: GPT-6; effort: unknown.
- GitHub remote-only worker: did **not** inspect, register on or claim canonical local SQLite bus. Issue #2 carries a cooperative remote claim; owner must check local reservations before applying work.
- Head branch: `fix/ci-portable-extraction-20261025` based on PR #1 head `144c920e726102306ca79f708a8f474ab73bbe59`.
- Draft child PR: https://github.com/LethaboMH14/KAIRO/pull/15; base: `feature/ci-owner-scoped-retrieval-20261025`.
- No main branch edits, deployments, new cloud resources, secrets or production permissions.

## Confirmed baseline failure (actual GitHub Actions)
- PR #1 run: https://github.com/LethaboMH14/KAIRO/actions/runs/40157365360.
- App job 121061495539: dependency install success; full serial tests failed; production build skipped.
- Bus job 121061495663: passed.
- Multiple native-extraction fixture and adversarial-security tests spawned `tools/course_sources/.venv-ocr/Scripts/python.exe`, which does not exist on Ubuntu: `ENOENT`.
- Image OCR failure was `ModuleNotFoundError: No module named 'PIL'`.
- The failures are real; past local 741/741 pass is not evidence that this new branch passes.

## Changed code
- `.github/workflows/ci.yml`: setup Python 3.11 alongside Node 24, install bounded extraction requirements and pinned reportlab test fixture dependency, verify importability and Tesseract, export absolute interpreter path via `KAIRO_PYTHON` for app tests.
- `studio/tests/helpers/python-interpreter.mjs`: cross-platform test interpreter (explicit `KAIRO_PYTHON`, Windows documented venv fallback, Linux `python3`).
- `studio/tests/ingestion-edgecases.test.mjs`, `material-ingestion.test.mjs`, `native-extraction.test.mjs`, `security-upload-abuse.test.mjs`: replace Windows-only spawn executable paths with helper; leave test assertions and fixtures intact.

## Validation and acceptance
- Full test command: `cd studio && node --test --test-concurrency=1 tests/*.test.mjs`.
- Production build: `cd studio && npm run build`; isolated bus tests: `python -m unittest discover -s coordination -p test_bus.py -v`.
- This GitHub-connector environment could not clone the public repository directly (`Could not resolve host: github.com`), so **no local full-suite/build pass is claimed**.
- A fresh GitHub Actions run on PR #15 must be checked before marking #2 tested. If failed, fetch full job logs, fix the newly established root cause rather than skip tests.
- Independent review and local bus reconciliation required before merging PR #15 into PR #1; PR #1 still requires own successful tests, retrieval security review and explicit integration approval before main.

## Learner benefit and judging criterion
- Product / Intelligence / Sustainability: restores actionable continuous regression feedback for reliable source review, cited lessons and privacy-sensitive extraction. This is build-system repair, not a new verified learner feature.
- Next: review PR #15 CI and any failures; then integrate only when green. Issue #3 can propose the multi-source lesson API contract without shared routes, and #5/#10 can run independent browser/privacy audits under their own claims.
