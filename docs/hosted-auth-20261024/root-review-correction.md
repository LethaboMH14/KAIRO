# Hosted-core review correction

**Reviewer:** `codex-hosted-auth-20261024-a` — Codex, gpt-6.1-sol, effort unknown  
**Scope:** Correction to `root-review.md`, based on re-reading exact origin middleware and the subsequently supplied deployment/test receipts. No source, browser, or cloud changes were made.

## Corrected finding: origin handling

The prior review's finding that missing `allowedOrigin` permits arbitrary supplied origins was wrong and is withdrawn. At [app.mjs:12–14](../../studio/server/hosted-core/app.mjs#L12), when `allowedOrigin` is undefined, every nonempty `Origin` differs from it and is rejected with 403. Originless calls proceed to the bearer-token guard, matching the stated service-to-service intent. The constructor permits an absent origin value, but with this comparison it does not create the fail-open behavior I previously claimed.

The app has no CORS response or `OPTIONS` handling. This is only a browser integration gap if a cross-origin browser frontend is later intended. The current deployed foundation is described as private and service-to-service; no browser client acceptance is claimed. It should not be treated as a present security defect. If the client becomes cross-origin, add an explicit exact-origin CORS policy and preflight tests then.

## Remaining security and acceptance gaps

1. **Revocation and disabled-account state are not checked.** [firebase-verifier.mjs:28–31](../../studio/server/hosted-core/firebase-verifier.mjs#L28) verifies signature and JWT claims but does not query revocation or account-disabled state. A stolen but otherwise valid ID token can remain usable until expiry. This is a documented deployment/release gate to decide and test against the expected token lifetime and account-removal policy; the code currently has no revocation-check evidence.

2. **Live Firebase identity verification has failed.** [live-account-test.json](./live-account-test.json) records a synthetic-only account create/delete and temporary-key cleanup, with failure `Identity could not be verified.` It does not establish successful current-user login or the deployed API's acceptance of a real Firebase ID token. The parent reports this as an active debugging issue; until resolved and retested, authenticated learner access is not accepted.

3. **Cryptographic route composition remains unproven by the local route test.** [hosted-core.test.mjs:70–86](../../studio/tests/hosted-core.test.mjs#L70) injects a verifier that accepts any bearer text; [lines 88–102](../../studio/tests/hosted-core.test.mjs#L88) separately verifies synthetic RSA signatures. That separation is suitable for unit tests but does not show that the deployed entrypoint uses the cryptographic verifier successfully. The recorded 11/11 suite is automated synthetic evidence only.

4. **The deployment receipt does not expose the startup persistence proof.** [cloud-run-probe.json](../hosted-foundation-20261024/cloud-run-probe.json) records anonymous 403, operator health 200, and invalid Firebase token 401, which supports private IAM ingress and a responding service for that dated probe. Its health payload omits `persistenceVerified`; therefore this receipt alone does not evidence the current entrypoint's bounded Firestore startup read. The separate deployment JSON records Cloud Run Ready and the runtime service account, but the exact source/build-to-revision correspondence and current startup-read result should be retained with the review evidence.

## No finding after review

By inspection, owner selection is derived from `req.kairoIdentity.uid` and hashed into the Firestore document path; client payload identity does not select the owner path. Firestore create/update/delete operations use conditional preconditions, and no obvious CAS overwrite flaw was identified. Hosted app route scope is deliberately narrow. These conclusions remain code-review observations plus synthetic tests; the receipts do not demonstrate two real signed learner identities or real-user isolation.

## Evidence boundary

The supplied dated Cloud Run receipts support a private service endpoint responding to IAM-authenticated operator probes and rejecting an invalid Firebase-token request. They do not show successful real-user authentication, browser use, a learner UI, revocation handling, or learner-document access. No private learner records were accessed. No claim is made that the hosted flow is ready for learners or competition reviewers.
