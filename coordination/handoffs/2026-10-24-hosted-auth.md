# Hosted auth Worker A handoff

- **Owner:** `codex-hosted-auth-20261024-a` (Codex, gpt-6.1-sol, effort unknown)
- **Task:** `HOSTED-AUTH-A-001`; exact owned scope: hosted-auth middleware, focused Express test, evidence docs, this handoff.
- **Judging criteria:** Product/Usability (account-bound learner save identity), Sustainability (reusable hosted boundary), Intelligence (identity comes from verified claims).
- **Need:** prevent request body/query identity from controlling whose hosted learner record is accessed.
- **Changed:** `studio/server/hosted-auth/guard.mjs`, `studio/tests/hosted-auth.test.mjs`, `docs/hosted-auth-20261024/README.md`, `docs/checks/hosted-auth-20261024/test-output.txt`.
- **Interface:** `createIdentityGuard({ projectId, verifyToken })`; Express middleware attaches frozen `req.kairoIdentity = { uid }`. Verifier is injected and must perform cryptographic Firebase token verification before claims are trusted.
- **Checks/evidence:** `cd studio; node --test tests/hosted-auth.test.mjs` — 4 passed, 0 failed. Actual Express app exercised via synthetic Node streams after sandbox loopback TCP returned EACCES. Evidence in `docs/checks/hosted-auth-20261024/test-output.txt`.
- **Limits:** Synthetic verifier only; no signature/key/revocation verification, Firebase Admin integration, router mount, cloud/provider changes, browser/device checks, or hosted persistence ownership proof. Middleware alone does not isolate the existing global local APIs. Root must implement verifier, mount on hosted APIs and derive storage ownership exclusively from `req.kairoIdentity.uid`; then add owner-isolation integration tests.
- **Remaining acceptance:** root review/integration, real cryptographic verifier tests, persistence cross-owner denial and hosted authenticated flow. No deployment or cloud mutation.
