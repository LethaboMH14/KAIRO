# Issue #14 — audited skill supply chain handoff (25 October 2026)

Session: `gpt6-skill-audit-20261025-0542-jhb`. Client ChatGPT; actual model GPT-6, effort unknown. Starting main commit `20183faf31fe30bc68e2fc70cb339e7fd24fce79`. Branch `feature/issue14-skill-audit-20261025`. GitHub issue #14 is the remote cross-chat ledger; this worker did **not** register on or claim the owner's separate local SQLite bus.

## Exact changes and product fit

Owned new `tools/agent-skills/harness.py`, `registry.v1.json`, `README.md`, `tests/test_harness.py`, `tests/fixtures/README.md` and this handoff only. No shared installer, CI workflows, package manifests, `studio/`, coordination/swarm, cloud, IAM, secrets, browser, microphone, or production deployment changed. This supports Sustainability (reproducible tool provenance) and Product/Intelligence (safer specialist development), **not** a validated learner result.

- 11 pinned candidate upstream commits/licences: React/Three.js, frontend design, Python/OCR, GCP, Azure, Hugging Face, Playwright, RAG, security, accessibility. Each is deliberately `proposed` and **not installable**.
- Python 3.11+ stdlib-only CLI: `inventory`, `plan`, `init`, `stage`, `verify`, `rollback`. Network and script execution intentionally absent. No ZIP download and no global installation.
- Promotion requires a reviewed entry with ticket/reviewer, full SHA-256 ZIP and file manifest, a pinned GitHub commit/licence, allowlisted inert extensions, no network/cost and low-risk permissions. Stage rejects traversal, symlinks, special files, scripts, duplicates, bombs, tampering and overwrite; stage manifests are checked back against reviewed registry.
- New unittest file defines 17 generated adversarial/end-to-end cases, including forged upstream licence provenance. Paths are isolated under an explicitly initialized workspace marker.
- Existing `tools/install_engineering_skills.ps1` has pinned refs but invokes a bundled installer and copies to `.claude/skills`. It was inspected **but neither executed nor modified**. New task-runner/install integration requires coordinator approval and shared ownership.

## Evidence ledger — distinguish local prototype from pushed branch

1. **Executed locally** in this ChatGPT isolated Linux runner: `python3 -m unittest discover -s /mnt/data/kairo-skill-worker/tools/agent-skills/tests -v` on an independently authored same-policy *local prototype* → **16 tests, OK, exit 0**, Python 3.13.5. `python3 -m py_compile` on that prototype also passed. CLI local prototype `inventory` and `plan --id threejs-guides` showed proposed/not installable. The local prototype is **not byte-identical to the GitHub branch's concise implementation**: do **not** cite this as passing execution of the committed test suite.
2. **Executed connector/static verification** against pushed GitHub branch: 5 scoped files fetched, 11 candidates all `proposed`, 40-character hexadecimal source refs, all licence evidence links containing matching full commit. Branch commit history checked. No uploaded secrets/credentials.
3. **Not run on exact GitHub branch yet:** `python -m unittest discover -s tools/agent-skills/tests -v`; **CI status pending/not configured on main**. A reviewer must run exact checkout tests before approval; do not advertise remote code as CI-green. App baseline `Node 24; cd studio && npm ci && node --test --test-concurrency=1 tests/*.test.mjs && npm run build` **not run** here: only Node v22.16.0 is installed and network/repository clone unavailable (git DNS failure). Earlier 741-test handoff is not a current run.
4. No third-party code, installer, native binary, browser or network side effect was executed. The only installation demonstrated was inert ZIP text created inside temporary synthetic directories.

## Risks, blockers, explicit review gates

Exact committed Python test suite (17 cases) needs direct execution in a real clone (Python 3.11+); static GitHub reads do not replace execution. No separate full ZIP digest has been approved for upstream tools: proposals must remain disabled. A digest protects consistency, not malicious `SKILL.md` instructions. Shared PowerShell installer, PR #12 swarm coordination text, root CI and task runner cannot be edited without coordinator scope approval. Existing browser/microphone policy denials remain.

## NEXT

The next independently bounded improvement inside this issue is to exercise **case-colliding ZIP member names, malicious stage symlink/extra-directory mutations and coherent manifest tampering**, then run exact PR-branch tests on Node 24/Python checkout and post logs. A separate follow-up issue should obtain coordinator approval before touching installer/task-runner interfaces. Do not silently merge this draft PR.
