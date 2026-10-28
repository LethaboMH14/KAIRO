# Independent pump what-if acceptance (Issue #49)

This is a **read-only, separate-branch QA gate** for the existing working pump challenge in draft PR #55. It does not own, edit, merge or mount PR #55. The GitHub Actions workflow pins PR #55 to commit `a46838a82e3a564223196e1f270c369207771e90` and fails closed if its head or seven-file change scope differs. The candidate files are copied into the ephemeral CI checkout only.

The tests independently check the authored two-round scenario contract, the mounted deterministic pump model's numerical consequences and head balance, prediction scoring, independent attempts, replay integrity, forged source/grade rejection and explicit educational provenance. The workflow runs the candidate's original tests, these new black-box tests and the production build on Node 24.

**Not demonstrated:** external engineering expert approval, real equipment calibration, real-device keyboard/screen-reader/200%-zoom usability, authenticated learner storage or mastery. Passing synthetic tests is not a verified Kaggle run or a learning-gain study. An accepted candidate still requires independent subject/accessibility/security review and PR #34's merge policy. No production resources, IAM, billing, providers or shared routes are changed.

To repeat locally in a throwaway checkout after verifying the pinned PR head and scope, fetch PR #55, restore its two isolated paths, run `npm ci` in `studio`, then run `node --test --test-concurrency=1 tests/pump-what-if.test.mjs ../tools/studio-pump-independent-qa/pump-challenge-contract.test.mjs` and `npm run build`. Never restore those paths into a working checkout that another worker owns.
