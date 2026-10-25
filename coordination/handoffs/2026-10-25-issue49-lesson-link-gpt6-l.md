# Issue #49 — owner-reviewed lesson association for pump drafts (25 Oct 2026)

SESSION: `gpt6-kairo-lesson-pump-link-20261025-1502-l`; GPT-6, effort unknown; GitHub-only remote branch `worker/issue-49-lesson-pump-link-20261025-l`. Main baseline `0fabfdf9b8515cab8ff4100228a6a1df672491c6`. Canonical local SQLite coordination bus was **not** accessible and no local claim was made. Cooperative GitHub PLAN is in Issue #49.

## Product/judging need

Product/Usability: link a local studio practice item to an authenticated learner's actual saved lesson and current reviewed source, rather than trusting a query-string lesson ID. Intelligence: reject source-revision mismatch and foreign-owner material. This does **not** measure learner outcomes or authenticate local attempts.

## Exclusive files

- NEW `studio/server/studio-lesson-link/index.mjs`: read-only owner/lesson/source/revision gate, exact reviewed-page SHA and recheck, explicit unverified output.
- NEW `studio/server/studio-lesson-link/README.md`: trust boundary and future integration contract.
- NEW `studio/tests/studio-lesson-link.test.mjs`: positive and negative synthetic owner/source/draft tests.
- NEW this unique handoff. No shared router, CSS, existing pump physics/session, PR #55 pump challenge, PR #68 replay verifier, PR #64 attempt adapter, PR #53 Kaggle, #46/#47 lesson UI/schema or CI config edits.

## Evidence and limits

At authoring, implementation exists in a distinct GitHub branch; exact-head GitHub Actions Node24 test/build and Python bus status must be checked and recorded on the PR. The source revision gate uses the existing `studio/server/workspace/model.mjs` hash contract and `learner-workspace/routes.mjs` v1 owner-scoped repository schema. The replay audit is **not** invoked; local draft is client-declared. No persisted verified evidence, domain certification, Kaggle hosted training, provider inference, new IAM or deployment.

## NEXT

1. Independently review this gate and PR #68's replay audit for security, source/revision integrity, owner identity and race boundaries. Reject any false 'verified competency' claims.
2. Coordinator reconciles canonical local bus and owner claims. When #46/#47 contracts and #68 are reviewed, assign a separate exclusive shared-route/evidence-store owner to implement an authenticated atomic replay→write→resume journey with actual device/assistive-tech acceptance and PR #34 merge gates. Do not overwrite other workers' files.
