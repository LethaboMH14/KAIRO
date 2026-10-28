# Issue #43 claim-evidence validation handoff — 25 October 2026

Session: `gpt6-kairo-evidence43-20261025-1008-a`; model GPT-6, effort unknown. Remote GitHub cooperative scope only; canonical SQLite bus inaccessible.

New paths: `tools/product-proof-validator/validate.mjs`, `studio/tests/product-proof-validator.test.mjs`, `tools/product-proof-validator/README.md`, `docs/product-proof-20261025/evidence/claims.example.json`, this unique handoff. No existing app, workflow, CI config, release gate or cloud changes.

User job: allow a reviewer to distinguish proposed source→lesson→practice evidence from exact-commit tested or actually observed learner results. Judging: Product (claim boundary), Intelligence (source trace), Impact (denominator/real observations), Presentation (no fabricated proof), Sustainability (repeatable offline audit). No measured impact, cost or user/device success claimed.

Validation: authored local copy Node 22.16.0, 12/12 synthetic focused tests PASS, sample CLI PASS. This is NOT proof of the committed GitHub bytes or exact-head Node24 CI. The PR must pass complete Node24 app serial tests/build/Python bus and independent review before any merge. Main baseline at branch creation: `0fabfdf9b8515cab8ff4100228a6a1df672491c6`.

Known limitations: structural validation only; URLs/review sessions are not authenticated; no source fetching or permissions verification; cannot verify actual device evidence, learner data or CI reachability. No private data, credentials, Kaggle, IAM, provider or deployment.

Next candidates (NOT assigned): (1) #36 judge claim snapshot from accepted registry, read-only, with actual verified artifact references; (2) #11 independently reviewed optional release-gate integration after authenticated GitHub evidence checks. Priority still #46/#47 true multi-source saved lessons and accessible picker.
