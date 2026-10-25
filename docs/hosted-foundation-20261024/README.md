# KAIRO hosted foundation — 24 October 2026 SAST

## What is working

KAIRO now has a real private Cloud Run API, managed email/password identity and durable owner-scoped Firestore progress records. Two disposable real Identity Platform accounts exercised the deployed service: signed tokens verified, the owner saved/read a record, the other account received 404, stale saving returned 409, and deletion/read-back absence passed. Both accounts, their test record and the temporary restricted API key were removed. No private learner documents were sent.

**This is the account/progress backend foundation, not the full hosted learner application.** The current local UI and global SQLite/files workspace have deliberately not been exposed online or automatically migrated. Login screens, account-bound source/lesson history and the new extraction adapter still need connection to the learner journey. The existing four-page source-review schema remains in the app until that migration is implemented and tested.

## Actual resources

| Component | Verified setup |
|---|---|
| Project | kairo-access-20261021 |
| Database | Firestore Native Standard, `(default)`, `africa-south1`; cloud response reports `freeTier: true` |
| Sign-in | Identity Platform initialized; email/password enabled; anonymous and phone disabled |
| API | Cloud Run `kairo-core`, `africa-south1`; ready revision `kairo-core-00003-qkw`; private IAM access |
| Runtime identity | Existing keyless kairo-web-runtime service account; granted roles/datastore.user for application records |
| Scaling | Minimum zero; revision maximum one, concurrency eight, 512 MiB, one CPU, 60-second request timeout; service-level maximum one also applied |
| Private file storage | Existing Johannesburg bucket from the previous cloud-copy package; no new learner originals uploaded |

Cloud Run build created an Artifact Registry container repository. Builds, retained container images, storage/network/logging and any usage exceeding applicable allowances can incur costs. Promotional credits are not assumed. This package does not establish a billing hard cap or claim zero ongoing cost.

## Interfaces and security

- `studio/server/hosted-auth/guard.mjs` takes an injected cryptographic verifier and derives a frozen identity from verified claims; body/query UID cannot select an owner.
- `studio/server/hosted-core/firebase-verifier.mjs` verifies Firebase RS256 signatures with Google's public certificates, key ID, audience, issuer, subject and timestamps. Certificates are bounded/cached; failures do not disclose tokens. Issuer/server clock difference is allowed up to 30 seconds for issue/auth time; expiration remains strict. No service-account key file.
- `studio/server/hosted-core/firestore.mjs` creates server-derived SHA-256 owner paths and validates returned record identity. Conditional create/update/delete prevents silent overwrites. Payloads and responses are bounded. Firestore REST FAILED_PRECONDITION is translated into application conflict status.
- `studio/server/hosted-core/app.mjs` exposes only health, authenticated identity and learner-authored progress CRUD. It never mounts the old global source/upload/model APIs. A supplied Origin must match the exact configured HTTPS origin; when origin is unset, supplied Origins are rejected. Originless server-to-server requests still require identity verification. CORS is not implemented; this pilot is not a cross-origin browser API.
- `studio/server/hosted-core/entry.mjs` uses the attached runtime identity and makes one bounded synthetic-namespace Firestore readiness read before listening. Health reports successful startup persistence access.
- Cloud Run IAM is an additional operator boundary, not a substitute for Firebase learner identity. The live test supplied an operator token in X-Serverless-Authorization and a learner token in Authorization. A regular friend cannot open this private API as a usable app yet.
- Progress content is learner-authored, not an accredited credential, verified competence score or authoritative simulation result.

## Extraction delivery and root review

`tools/material_ingestion/extract.py` is a separate native extraction adapter, now tested beyond four PDF pages and PowerPoint slides. It preserves source hashes and locators, PowerPoint notes, Word body/table order, Excel cell/formula strings and worksheet relationship names. It reports missing/failed/skipped content and unknown remaining coverage rather than claiming complete understanding. Limits apply to file size, package expansion, retained units, block text and output size. It does not run macros/formulas or perform OCR, visual interpretation or hosted model calls.

Root rejected the initial delivery for incomplete fixtures, inconsistent coverage, sparse-sheet expansion and unsafe package/output handling. Follow-ups repaired those issues. A final root review fixed negative shared-string indices that could otherwise borrow unrelated Excel text. Nine focused tests pass. This is a candidate adapter, not integration into My material or proof of arbitrary-file semantic understanding.

Published worker interface: `coordination/briefs/hosted-foundation-20261024/CONTRACT.md`. XLSX `coverage.discoveredUnits` may be null after a cap with explicit unknown-tail warnings; consumers must not interpret null as zero or full coverage.

## Checks and evidence

- `full-tests.txt`: 551/551 full regression tests passed before the final negative-shared-string edge-case patch.
- `extraction-tests.txt`: final extraction suite 9/9 passed after that patch.
- `identity-tests.txt`: identity/repository/actual HTTP/real RSA fixture checks 11/11 passed, including bounded clock skew, wrong signing key/audience, expiration and stale-save rejection.
- `live-account-test.json`: actual deployed two-account acceptance passed; accountsCreated=2, accountsDeleted=2, temporaryKeyDeleted=true, realFirebaseSignaturesVerified=true and all cloud CRUD/isolation/conflict checks true.
- `cloud-probe.json`: earlier real synthetic Firestore adapter checks; includes a dated pre-setup Auth diagnostic, not current authentication status. `identity-setup.json` is the later authoritative configuration receipt.
- `cloud-run-probe.json`: anonymous403, operator health200 with persistenceVerified=true, invalid Firebase token401.
- `cloud-run-deploy.json`, `cloud-run-limits.json`, `cloud-run-iam.json`, `firestore-database.json`: actual resource receipts.
- Deployment staging copies only allowlisted server modules and pinned dependencies. No full-repository upload, model assets, private workspace or local credentials are in the build context.

An early live account check exposed small issuer/server clock drift missed by synthetic fixtures; the bounded clock-skew fix was tested and deployed before final live acceptance. Temporary API keys can need propagation time; the test handles only that specific bounded retry and always attempts cleanup. Earlier failures are not acceptance evidence.

Independent auth review and its correction are in `../hosted-auth-20261024/`. The initial origin fail-open finding was incorrect and withdrawn after checking the actual predicate. Valid remaining gates are revoked/disabled account policy, browser client integration and full application migration. Real deployed two-account tests now close the earlier production-composition evidence gap for this narrow API.

No new UI build was required by this backend-only package. Browser observation, device/audio acceptance and learner validation were not performed. The existing browser restriction and deleted-schedule state remain unchanged.

## Managed services decision

Read `../google-managed-services-20261024/README.md` for official-source comparisons and a no-promotional-credit cost worksheet. Adopt Auth/Firestore/GCS/Cloud Run for this small pilot. Add Cloud Tasks only when the hosted document worker exists and idempotency/cancellation are tested. Use Secret Manager when the runtime actually needs named provider secrets. Benchmark Document AI against native/Docling before adoption; current researched Document AI locations do not include Johannesburg. Do not imply that global model endpoints process learner material in South Africa. Defer Cloud SQL and managed RAG until a measured need outweighs migration, cost and regional complexity.

Language/ML research is delivered at `../language-ml-research-wave2/README.md`. Use pretrained baselines before considering training; no Kaggle job or model training was started. Microphone interaction, multilingual speech and continuous SASL are not implemented by these research packages.

## Next connected implementation

1. Add a real client login/session/recovery flow and explicit local-versus-account mode. Decide same-origin hosting before configuring browser access. Add disabled/revoked-user verification before broader exposure, per-user quotas and email verification/recovery tests.
2. Migrate sources, immutable revisions, lesson drafts/history and progress into owner-scoped repository contracts. Test two accounts across read/write/delete/export, reload and restart. Do not attach legacy global routes directly to the hosted API.
3. Connect the native extraction adapter through a bounded job worker. Store structured blocks and coverage separately from reviewed lesson inputs; support selecting/reviewing material beyond the old four-page contract. Add OCR and selected-figure interpretation as separate provenance-bearing stages after fixture benchmarks and processing consent.
4. Mount a bounded model gateway with explicit provider disclosure, anchored retrieval, schema/citation checks, budget reservation and no silent paid fallback. Adopt LangGraph only for measured durable workflow needs, with idempotent side effects and review before publication.
5. Finish the source → lesson → motor → practice → evidence → resume flow against hosted accounts; then reuse the same contracts for pump. Evaluate this with real learners and capture clips only within authorized observation permissions.

Judging: Product—actual hosted isolation/CRUD evidence; Usability—conflicts cannot silently overwrite records; Sustainability—managed durable storage and bounded runtime; Intelligence—native evidence separated from interpretation. Creativity, Impact and Presentation still need a coherent learner demonstration and human evidence. Infrastructure is not proof of learning gains or traction.
