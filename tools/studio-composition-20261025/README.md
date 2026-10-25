# KAIRO studio integration rehearsal — Issue #49

This isolated harness checks whether four existing **DRAFT** studio PRs can be combined and whether their actual read-only interfaces agree. It is not another unmounted studio prototype, a production endpoint, a model call, a Kaggle job, a merge approval or a substitute for the owner's canonical local coordination bus.

## What is pinned and why

- [#55](https://github.com/LethaboMH14/KAIRO/pull/55): accessible pump what-if learner task.
- [#64](https://github.com/LethaboMH14/KAIRO/pull/64): unverified local attempt review.
- [#68](https://github.com/LethaboMH14/KAIRO/pull/68): deterministic pump evidence replay.
- [#70](https://github.com/LethaboMH14/KAIRO/pull/70): current owner-reviewed v1 lesson/source association.

`manifest.mjs` pins each exact head SHA and every changed filename. The CI runner rejects a moved SHA, a fork, a changed base, a closed/merged candidate, modified/deleted/unexpected files, duplicate paths and unreviewed scope expansion. When a candidate changes, an engineer must inspect its diff and update the pin in a reviewed PR; the harness must not silently run arbitrary new code.

## Actual validation

`.github/workflows/studio-composition-20261025.yml` runs on this harness's PR or manual dispatch. It uses immutable first-party checkout/setup-node action SHAs and a read-only GitHub token. It validates PR metadata before executing candidate code, then creates a throwaway local branch in GitHub Actions, merges the exact four PR commits **locally only**, runs each candidate's focused Node24 tests, runs a real cross-contract synthetic owner/revision/replay test, and builds the composed Vite application. The test exercises a genuine deterministic prediction and reading, matches recomputed pump evidence, and checks the current reviewed v1 source revision under an owner-scoped synthetic repository. It also rejects altered evidence, wrong session/owner, missing immutable revision, unreviewed source and no learner action. No data is persisted or exported.

A passing composition means only that the **specific pinned source trees** passed this technical rehearsal. It does not mean the candidate PRs passed independent review, were merged, are mounted in the authenticated UI, or have been tested on actual learner devices. The owner must reconcile canonical local bus claims and PR #34 merge gates before integration. Cross-contract result remains `reviewable-local-draft-only`, `canSaveVerifiedEvidence:false`, `identityOfAttemptVerified:false`, and `competencyExternallyVerified:false`.

## Developer commands

```bash
node --test tools/studio-composition-20261025/manifest.test.mjs
# In authenticated GitHub Actions only, with a read-only GITHUB_TOKEN:
node tools/studio-composition-20261025/compose.mjs verify
node tools/studio-composition-20261025/compose.mjs compose
cd studio && npm ci --no-audit --no-fund
cd .. && node --test --test-concurrency=1 \
  studio/tests/pump-what-if.test.mjs \
  studio/tests/studio-attempt-contract.test.mjs \
  studio/tests/studio-evidence-replay.test.mjs \
  studio/tests/studio-lesson-link.test.mjs \
  tools/studio-composition-20261025/review.test.mjs
cd studio && npm run build
```

Never run the composition command in a working tree containing uncommitted user work. Use an isolated disposable checkout. It does not push, comment, deploy, merge GitHub PRs or invoke cloud/provider services. No API keys, learner data, Kaggle credentials or production secrets are needed.

## Next dependency-ready steps

1. Coordinator and independent reviewers inspect #55/#64/#68/#70 and this composite run's exact heads; resolve any security/education/accessibility findings and local bus ownership. Re-pin only after reviewing a changed diff.
2. After review and conditional merges, a separately scoped authenticated evidence-route owner may wire replay + current source/owner checks to an idempotent write with consent and revision recheck. The route must never treat a local simulation as an accredited competency or real pump advice. Browser/device acceptance is a separate task.
