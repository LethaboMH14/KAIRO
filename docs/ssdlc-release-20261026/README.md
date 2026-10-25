# KAIRO SSDLC release update — 26 October 2026

Prepared paste-ready text for the five security fields in the KAIRO submission form. Nothing in this package has been submitted. It reflects the integrated multi-source release, actual repository controls, synthetic checks, and the recorded font/CSP repair; it is not a certification or an independent penetration test.

## Paste-ready fields

Use [the combined text](SSDLC-PASTE-READY.md), or paste each file into the matching form field:

1. [Security Requirements / Risk Assessment](01-risk-assessment.txt)
2. [Threat Modelling & Design Review](02-threat-modelling.txt)
3. [Development / Secure Coding Practices](03-secure-development.txt)
4. [Security Testing](04-security-testing.txt)
5. [Assessment & Secure Integration](05-secure-integration.txt)

## Evidence and exact scope

- **Integrated source and controls:** `studio/server/learner-entry.mjs` (configuration, middleware, CSP, account/session guards and routes); `studio/server/account/routes.mjs` (session validation, cookie flags and process-local sign-in/recovery abuse limits); `studio/server/learner-repository/index.mjs` (owner-derived Firestore paths, record validation, transaction/version checks, bounded blobs and integrity); `studio/server/learner-workspace/routes.mjs` and `extraction.mjs` (authenticated upload/review/generation/cancellation bounds); `studio/server/owner-retrieval/lesson-contract.mjs`, `studio/server/lesson-v2/record.mjs` and `studio/server/bundle-lessons/service.mjs` (multi-source request, revision, citation and saved-work integrity); `studio/server/ai-runtime/gateway.mjs`, `service.mjs` and `providers.mjs` (consent, provider policy, reservations, cancellation and output validation).
- **CI:** PR115 merge commit `3d2a372807ba2166168a6df0034a1c2d62af76d1`; clean Linux CI run [40238800285](https://github.com/LethaboMH14/KAIRO/actions/runs/40238800285) passed 925/925 app tests, production build and bus checks. The later exact heading-fix head `2dd3f831` also passed 925/925, production build and bus checks in [run 40240125580](https://github.com/LethaboMH14/KAIRO/actions/runs/40240125580). These are automated engineering results, not a penetration-test result.
- **Release checks:** `docs/full-integration-release-20261025/README.md`, `tests-final.txt`, `service-tests.txt`, `live-candidate.json`, `live-production.json`, `live-existing.json`, `browser-journey.json`, `browser-cloud.json`, `browser-cloud-heading-failure.json`, `service-final.json`, `iam-after.json` and `cloud-build-heading-result.json` retain the dated synthetic results and promotion/build state. The candidate check includes one explicit synthetic, consented Groq lesson request; the production API checks made zero model calls.
- **Font/CSP repair:** `docs/full-integration-release-20261025/FONT-FIX.md`, `font-before.txt`, `font-after.txt` and `studio/tests/runtime-font-policy.test.mjs`. The strict UTF-8 and stylesheet-import regressions failed on pre-fix source and passed on the repair; the existing CSP was not loosened.
- **Older but still useful security evidence:** `docs/security-submission-20261024/` contains the previous threat model, tests, npm advisory snapshot and cloud/IAM evidence. Its 24 October advisory result is historical, not a fresh dependency scan for this release.

## Status boundaries

The latest serving snapshot identifies `kairo-app-full26b` at 100% traffic (`service-final.json`). Its image digest is `sha256:2e74388c7fcd295501649d999b77fdaf83899bfea33e6f5a33f25ea505e41ffc`; Cloud Build `b439eab4-3798-4e81-b9a6-19e4462fd29e` succeeded. It includes the font repair (PR115 merge `3d2a372807ba2166168a6df0034a1c2d62af76d1`) and heading fix (PR117 commit `63171a7`). Exact heading-fix CI head `2dd3f831` passed 925/925 app tests, production build and bus checks (run 40240125580). Production access remains IAM-private and no `allUsers` invoker is present in the recorded IAM snapshot. A valid, authorized Google entry path is still required for an external judge; no public judge access is claimed. The post-fix desktop browser report `browser-cloud.json` records four hosted pages (bundle lesson, motor, direction and CV), `errors: []`, and zero model calls; accompanying screenshots are under `screenshots/`. This observation used a synthetic account and an operator-authorized session, so it does not establish external judge access or a public website. `browser-cloud-heading-failure.json` preserves the earlier pre-fix CSS preload failure.

Remaining work includes distributed abuse controls, parser/service-account isolation, least-privilege review, application-level audit/alerting, end-to-end deletion/retention/recovery drills, provider-retention review, fresh Python/OS/image dependency scans, external judge access, and human/physical-device and language/SASL acceptance. No statement here means no vulnerabilities exist, that the app is OWASP/ASVS/NIST-certified, or that it is quantum-safe.
