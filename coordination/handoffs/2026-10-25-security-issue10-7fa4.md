# Issue #10 security lifecycle test handoff — 25 October 2026

- Session: `gpt6-sec10-20261025-0539-7fa4`
- Client/model: ChatGPT GitHub connector, GPT-6; thinking effort: unknown (not exposed).
- Parent repository/ref: `LethaboMH14/KAIRO`, `main` at `20183faf31fe30bc68e2fc70cb339e7fd24fce79`.
- Branch: `test/issue-10-lifecycle-adversarial-7fa4`.
- Task ledger: https://github.com/LethaboMH14/KAIRO/issues/10
- Bus: owner's canonical local SQLite coordination database not accessible. **No local bus status, registration, claim or lock is asserted.** The issue comment coordinates new-file scope.
- Judging benefit: Usability + Impact / safe, trustworthy personal material lifecycle; observable criteria are HTTP/AI denial behavior with synthetic data. These are engineering checks, not user/device/privacy-policy certification.

## Changes and boundary

Added one NEW test file: `studio/tests/security-lifecycle-boundaries.test.mjs` (commit `4c0249affb03f7fed931d2b04fef205c7dbeb200`). It uses real `createIdentityGuard`, `createLearnerWorkspace`, `admit` and `createModelGateway` from production files, Express in a loopback-only test server, synthetic bearer claims, an owner-scoped CAS fixture and mock AI provider. No actual Firebase, cloud APIs, credentials, real learners, paid inference, private files, audio/video/camera, or browser use.

Eight tests:
1. Verified account switch and forged UID/query/body cannot reach the other owner's record; revoked token fails closed.
2. Retained-original download/delete affects only the authenticated owner; repeated download fails.
3. Cancel queued import; removes only its owner's temporary blob and prevents resumed extraction.
4. Stale source-review expected revision returns 409 and does not append revision.
5. Durable model gateway isolates two owners, deduplicates and rejects changed-content request ID reuse.
6. Missing, withdrawn, malformed or wrong-provider consent prevents reservations and dispatch.
7. Abort/session-consent revocation and source revision change prevent late AI persistence.
8. Synthetic prompt-injection-like tool command is denied by explicit output validator; no fallback on failed validation.

New test mock uses versioned owner+kind+ID keys and in-memory blobs; it does NOT simulate Firestore operational durability, IAM, deletion recovery of deployed backups, provider-side data deletion, regional retention, or billing. Full deletion/export/retention drill remains open and must not be inferred from these tests.

## Actual checks versus pending

- **PASS, scoped standalone smoke**: on Node `v22.16.0` in isolated sandbox, `node --test --test-concurrency=1 identity-guard-smoke.test.mjs` passed **3/3**. It exercised a byte-identical copy of production `studio/server/hosted-auth/guard.mjs`, verified by Git blob hash `f2fa10a7dad1ec227d3b0d8235ef8bd08d72e300`. Covers synthetic switched owners, revoked token and malformed cross-project/expired claims. These are NOT the eight new test cases.
- **PASS, syntax-only**: V8 parser accepted the committed test after removal of import declarations; this is not a Node test execution.
- **NOT RUN**: committed `security-lifecycle-boundaries.test.mjs` eight-case execution (no local repo dependencies).
- **NOT RUN**: Node 24 / `cd studio && npm ci`, full `node --test --test-concurrency=1 tests/*.test.mjs`, `npm run build`. This conversation's container has Node 22 only, no installed Express/Vite dependencies and blocked GitHub network clone. Earlier 741/741 baseline is **historical**, not a result of this change.
- **NOT RUN**: browser/device, Firebase live sessions, cross-project/deployed cloud, irreversible deletion, backup recovery, retention ageing, external provider revocation.

Do not mark green or merge until a Node 24 checked-out runner tests this PR's actual new file and full suite/build; investigate failures and leave complete logs. Existing PR #1 CI failure and its cross-platform repair should remain a separate owner/PR concern.

## Review and next

No confirmed P0 found from the executed smoke subset. No runtime fixes or shared interface changes made. Ask security coordinator/owner to review the eight test expectations (especially original export and cancellation) and run on Node 24; classify any failing production behavior only after reproduction. Next unblocked test-only slice within Issue #10: synthetic owner-bound `/preferences` and `/pattern-events` retention/consent checks, in a second *new* file after separate scope allocation; provider-side and backup deletion policy require owner/product review. Keep this draft PR unmerged until validated.
