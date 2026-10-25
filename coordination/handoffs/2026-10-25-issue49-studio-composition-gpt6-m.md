# Issue #49 — studio draft integration rehearsal (25 October 2026)

- Session: `gpt6-kairo-studio-composition-20261025-m`.
- Client/model: ChatGPT / GPT-6. Effort setting: unknown.
- Starting main: `a2dfc4f10499bcd32ac45548fc6767094b26c8d2`.
- Branch: `worker/issue-49-studio-composition-20261025-m`.
- Cooperative claim: [Issue #49](https://github.com/LethaboMH14/KAIRO/issues/49). The canonical local SQLite bus is NOT remotely readable, and this session did not claim it.
- Exact owned files: `tools/studio-composition-20261025/{manifest.mjs,manifest.test.mjs,compose.mjs,review.mjs,review.test.mjs,README.md}`, `.github/workflows/studio-composition-20261025.yml`, this handoff. No existing app/router/host/schema/test files or PR-owned code changed.

## Why this slice

The preferred pump what-if implementation is already draft PR #55. Drafts #64 (local attempt review), #68 (server replay audit), and #70 (owner-reviewed source link) provide pieces of the learner's source→studio→evidence journey, but independent compatibility has not been shown. PR #53 Kaggle foundation is unmerged and #56 already owns ML evaluation; no Kaggle execution is claimed. PR #54 runner closed unmerged; no autonomous Codex-produced PR was observed. More isolated standalone studios would not resolve this integration gap.

## Implementation and acceptance

An immutable manifest pins candidate PR heads and exact changed files; a read-only GitHub Actions job verifies same-repo, base/main, open PR state, file additions and no path conflicts before temporary Git merges. It rejects a moved head, unexpected file or merge conflict and does not push to main. Node24 focused tests and a production build then exercise the actual combined code. The new cross-contract test uses synthetic reviewed source and v1 lesson records plus a real deterministic pump prediction and reading. It must reject forged replay results, foreign owner, missing revision, and empty attempts. A successful output explicitly remains `local-unverified` and not an authenticated/verified qualification.

Judging criteria: **Product** (composition integrity of source→studio→evidence), **Usability** (avoid broken integrated learner journey), **Intelligence** (source/replay truth), **Sustainability** (repeatable regression and release readiness). This is engineering evidence only, not observed learner outcomes.

## Verification and remaining boundaries

- Before opening PR: GitHub code written; tests and GitHub Actions are **NOT YET EXECUTED**. Inspect the exact PR-head workflow result and repair failures before claiming a pass.
- Independent security, domain/subject and accessibility review are still required. Real device/browser checks remain NOT RUN. No hosted Kaggle training, cloud calls, API billing, deployment or live learner data.
- This workflow executes draft source only in a disposable CI environment with no write token or production secrets. It does not automatically merge/approve any draft.
- A successful synthetic composite does not imply the canonical local bus claim was reconciled, that the route is mounted, or that consented evidence persistence exists.

## Next work orders

1. Independent reviewers: review #55/#64/#68/#70 against their exact pinned heads, fix any issues and rerun the composite; apply merged PR #34's conditional merge policy and reconcile local claims.
2. Separate authenticated studio-evidence route worker, **only after dependencies are reviewed and accepted**: owner/session/source revision fencing, deterministic replay, consent, idempotent evidence write, recovery and privacy-safe learner UI. Do not edit shared routes before coordinator file ownership approval.
