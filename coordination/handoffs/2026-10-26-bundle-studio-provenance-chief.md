# KAIRO chief implementation handoff — HTTP studio citation provenance — 26 October 2026

Session: `gpt6-kairo-chief-http-studio-provenance-20261026-c`; client ChatGPT, model GPT-6, effort unknown. GitHub remote only. Base main `17dacea58130418b9fc47210407eaf3f14bf964c`. Owner-local canonical SQLite bus was not accessible; GitHub Issue #16 PLAN comment 6408039614 is a cooperative scope notice, not a local claim.

## One bounded change

Added only `studio/tests/bundle-studio-provenance-http-20261026.test.mjs` plus this handoff. Existing service, route, Firestore, React UI, claims, CI, manifests and cloud configuration are untouched. The test uses the real mounted Express `createBundleLessons().router`, two synthetic owner-reviewed and archived SHA-256 sources, an isolated in-memory CAS repository, synthetic identity middleware, and a deterministic fake Google help gateway. No actual provider, Firebase, user material, device or production service is used.

The first test follows the concrete **reviewed sources → cited v2 lesson → motor studio explanation → saved practice → resume** path. It requires the studio response's evidence ID, source ID, exact reviewed source revision, locator, bundle revision and anchored quote to resolve back to the saved lesson. The second tests foreign-owner, missing-consent and source-revocation denial before provider invocation, plus unavailable resume/listing after revocation.

## Judging/learner benefit and boundaries

Product: a learner can continue from cited teaching to a saved attempt. Intelligence: the explanation's quoted evidence remains checkable rather than free-floating. Usability: source revocation produces a safe unavailable state instead of offering outdated studio help. This is synthetic server HTTP regression evidence only, not real-device, educational efficacy or external judge acceptance. It does not repair #46 atomic Firestore commit/retry races or #132's post-commit response inconsistency.

## Acceptance and follow-up

Run exact-head Node24 serial application tests and `tsc -b && vite build`, plus six isolated Python coordination bus tests in GitHub Actions. Independently review the diff under PR #34; keep PR draft until full gates. #16 QA owner retains the separate #132 commit-order regression. #46 backend owner retains transactional source/revision/work CAS and durable consent/idempotency implementation. Next nonoverlapping follow-ons: (1) #46 transaction fence and cloud retry idempotency; (2) #47/#5 keyboard/200% zoom and narrow-screen cited-help navigation after reviewed UI contract.
