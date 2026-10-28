# KAIRO v2 lesson durable record boundary — 25 October 2026

Session `gpt6-kairo-principal-v2record-20261025-a` (GPT-6 effort unknown) on Issue #46. GitHub remote only, no original owner SQLite bus access or atomic claim; user authorised merges after passing tests. Main baseline at branch creation `b6a4be3b36426a73125b98e78fb23d407c8afdb7`.

## Source files
- NEW `studio/server/lesson-v2/record.mjs` constructs a true `schemaVersion:2` record with `sourceRefs`, immutable `bundleRevision`, exact per-citation sourceRevision/locator/UTF16 offsets, bounded evidence/chapter/quiz payload and explicit mode. It rejects v1 `sourceId`/revision masquerading. `verifyLessonV2Record` checks all current+archived review SHA256 and stored citation bytes, titles, edited flags, source anchors on each read. `saveLessonV2Record` checks before/after owner-partitioned create-only write and best-effort rollback on changed/revoked source. If rollback fails, read validation still rejects stale record. Runtime callers must still enforce quotas and any provider consent.
- NEW `studio/tests/lesson-v2-record.test.mjs` covers two-source records, tenant denial, manipulated citations, read-after-write validation, post-write review race, rollback failure, deletion and abort.
- This handoff.

## Honest limitations
This module deliberately is **not mounted** in the live learner workspace router. Current GET /lesson returns v1 records without distinguishing schema; real v2 endpoint must invoke `verifyLessonV2Record` on every read, enforce owner and all revisions, and safely guard draft/edit/studio/passage/quiz consumers. Best-effort rollback is not an atomic cross-document Firestore transaction; a production storage transaction/lease design and independent security review are needed to eliminate the tiny write/rereview window. No provider call, IAM, background worker, personal records, deployment, security credential or payment changes were made. The no-async-local-bus guarantee remains.

## Tests and merge gates
Require exact branch Node24 `npm ci`, serial full tests, Vite production build and Python bus CI. Local isolated prototype result is not claimed. Review the persisted v2 record format and compatibility with the existing v1 read/draft pipeline before mounting. The source/citation checks are deterministic synthetic evidence, not proof of learning outcomes.

## Next tasks
Mount distinct authenticated v2 generation + read with independent versioned schema and safe persistence; do not silently fake legacy v1 sourceId. Add provider consent/quotas, cancellation, retries and source-revision invalidation; decide which v2 editing/passage/studio functionality is supported or explicitly unavailable in accessible UI. Then wire Issue #47 reviewed-source picker to the accepted route, and Issue #5/#10 run synthetic/authenticated/privacy/keyboard/device acceptance. Human approval and test evidence remain necessary before production deployment.
