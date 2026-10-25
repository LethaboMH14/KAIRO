# KAIRO workflow supply-chain regression gate — 25 October 2026

## Need and exact scope

Issue #11 release integrity, Issue #13 autonomous-runner prerequisite and Issue #51 scheduled-worker prerequisite. Learners and judges need reproducible, trustworthy source → lesson → studio/reading → attempt → evidence → resume engineering evidence. A workflow that executes mutable or unreviewed code weakens that proof even if the app suite is green.

This change adds only `studio/tests/workflow-supply-chain-gate.test.mjs` and this report. It extends the already merged `studio/tests/ci-action-pins.test.mjs`, which deliberately audits only `.github/workflows/ci.yml`, to **every** YAML workflow currently present and future additions. The normal Node24 serial CI glob runs the new test automatically. No workflow, shared configuration, runtime, provider, token, IAM or user data is changed.

## Contract

- Each `uses:` reference must resolve to an exact, explicitly reviewed commit SHA from the local allowlist: `actions/checkout`, `actions/setup-node`, and `actions/setup-python` at the commits already merged in PR #65.
- Mutable tags/branches, unknown publishers, alternate hashes, local composite actions and dynamic/unparseable references fail closed until a separate reviewed update.
- Reject `pull_request_target` and blanket `permissions: write-all` as high-risk patterns. This is **not** a comprehensive GitHub Actions security scanner; job-level permissions, expression injection, external scripts, dependency integrity and provider secrets still require independent review.
- New legitimate actions (e.g. upload/download-artifact or an approved Codex adapter) require independent source/SHA verification and a reviewed allowlist change. This gate is intentionally conservative, not a ban on future approved integrations.
- Tests exercise the actual default-branch workflow directory and adversarial synthetic workflow fragments. No workflow is executed or enabled by the test.

## Review and evidence boundaries

Branch `feat/workflow-supply-chain-gate-20261025-a` starts from main `1997ba9f046f6d4122169cb26a72e89cc60befd1`. Session `gpt6-kairo-ci-supply-chain-20261025-1815-a`; model GPT-6, effort unknown; remote GitHub claims only because the canonical SQLite bus is not accessible. New paths are unique and were checked against open PR inventory.

The pre-existing PR #54 was closed unmerged and its actual `generate`/`publish` jobs skipped. PR #53 is still blocked by worker-claim classification and its mutable action tags. Neither is implicitly accepted by this new gate. The `KAIRO_CODEX_API_KEY` repository secret and Actions PR-creation permission are owner-side prerequisites and are not configured here.

## Judging and acceptance

**Product:** reproducible app CI and trustworthy changes; no claim that learner functionality changed. **Creativity:** no new interaction claimed. **Usability:** no device acceptance claimed. **Sustainability:** dependency-free deterministic test and auditable SHA allowlist. **Impact:** no measured learning outcome. **Presentation:** precise CI evidence rather than simulated model runs. **Intelligence:** no model quality claim.

Release acceptance requires exact-head Node24 full serial app tests, build and Python bus checks, independent review of the complete diff, and post-merge main verification if accepted. No production deploy, IAM, provider calls, Kaggle execution, recordings or paid resources.
