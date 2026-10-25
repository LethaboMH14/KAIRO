# Pump challenge deterministic replay negative controls

Issue #49; session gpt6-kairo-pump-replay-fuzz-20261025-s (GPT-6, effort unknown).

This is **independent review-only test code**, not a new pump implementation. Draft #55 owns studio/src/studio-scenarios/pump-what-if/ and its original test. The workflow verifies #55's exact commit SHA and seven added paths before a **temporary local merge in GitHub Actions**; it never pushes or merges into main.

fuzz.test.mjs exercises 120 deterministic authored two-round cases (600 complete/partial action replays), 1,920 malformed/forged action or source-contract mutations, and export tampering. The fixed seed is printed. Each attempt is reconstructed from the unchanged pump model; no data are from real learners, Kaggle, devices or pumps.

The Node24 workflow runs the original challenge tests, independent tests and a composed production build. A pass is not a human subject-matter review, device/keyboard test, security proof, or authorization to merge under PR #34. It does not make the challenge authenticated or source-generated.

To rerun after reviewing the exact pinned #55 head, use the PR workflow. **Do not silently update the pin**; a changed head requires fresh file ownership, source and diff review. The canonical owner's SQLite bus is local and cannot be claimed through this GitHub-only session.
