# Atomic local-v1 source/lesson Firestore fence — 25 October 2026

Session gpt6-kairo-chief-fenced-save-20261025-a; GPT-6, thinking effort unknown. Branch feat/source-fenced-local-lesson-20261025-chief from main 1997ba9f046f6d4122169cb26a72e89cc60befd1. Cooperative remote scope on issue #46; original owner's canonical SQLite coordination bus is NOT remotely accessible. No local claim invented.

## Changed files and contract

- NEW studio/server/learner-repository/fenced-lesson-save.mjs
- NEW studio/tests/fenced-lesson-save.test.mjs
- This handoff

No shared router/adapter/manifest edits; PR #71 continues to own v1 routes and PR #48 continues to own v2 records. The new createFencedLocalLessonWriter({firestore}) takes Firebase Admin Firestore and exposes save(authenticatedUid, localV1Lesson, {signal}). It uses the current owner-hashed Firestore schema and reads current reviewed source and archived exact SHA256 revision INSIDE the same Firestore transaction that create-only writes the lesson. Concurrent changed source/archive invalidates the transaction read, forcing a retry/check instead of persisting a stale lesson. Immutable revision, owner, content hash, title and record identity are validated. Cloud-v2, cloud-v1 and local-v2 are forbidden until their own provider/consent/multi-source design is reviewed.

## Validated vs unverified

Synthetic tests simulate optimistic transaction read version retries, create-only collisions, re-review, revoke, archive deletion, identity tampering, owner isolation, cancellation and malformed input. They do not establish actual Firestore backend behavior until independently tested against an authorized Firestore emulator/staging instance. No production service, secret, API request or learner material is used.

Important: this is NOT wired to the live v1 /generate route; it is a prerequisite primitive, not the completed learner workflow. Later source change after a successful transaction may stale a saved lesson; every read/passage/draft/resume consumer must independently revalidate current source. Abort after commit cannot undo persisted data. It does not atomically account for usage quota, refunds, cloud calls, v2 bundles or cross-record side effects. The caller must authenticate UID and validate educational citations separately.

## Acceptance and dependencies

Exact HEAD Node24 serial studio suite, TypeScript/Vite production build and Python coordination bus tests are required, plus independent storage-security review under merged conditional merge policy #34. No UI/device evidence claimed for this backend-only isolated helper; full learner journey acceptance remains open. Next two actions: (1) PR #71 owner mounts this atomic v1 save primitive via a narrowly reviewed repository interface, with end-to-end race tests; (2) PR #48 owner closes stored cloud provider/consent provenance and multi-source transaction design. Judges: Product, Intelligence and Sustainability gain a security prerequisite only; Creativity, Usability, Impact and Presentation outcomes are unknown.

## Wave-2 review and repair

Distinct coordinator session `gpt6-kairo-wave2-integrator-20261025-a` read exact previous PR head `75670c47` and official Firestore transaction documentation. Documented findings in PR review #5644646642. The guard now requires archived title to match the current reviewed source title, normalizes Firestore `ALREADY_EXISTS` (gRPC code 6) to 409 while preserving other errors, and runs added adversarial coverage for forged archival metadata, actual error-code form, and unrelated provider/storage failure. These are narrow same-owned-file repairs; they do **not** mount the helper, test a real Firestore emulator, obtain independent third-party signoff or waive the user-facing journey gates. Request exact repaired-head CI and independent corrected-diff security review before merge.
