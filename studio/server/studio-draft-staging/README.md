# Consent-gated, owner-scoped local pump draft staging (Issue #49)

**Status: isolated server module, not mounted in a route.** This is a small prerequisite for the authenticated source → lesson → pump practice → private draft → resume journey. It does **not** save verified evidence, grade a learner, verify who performed the pump actions, issue credentials, or claim domain-certified simulation accuracy.

## Interface and trust boundary

`stageLocalPumpDraft({repository,ownerId,lessonId,expectedSessionId,consent,preflight,clock})` accepts the **existing** owner-scoped `createLearnerRepository` contract, whose `get(uid,kind,id)` and `put(uid,kind,id,value,{create:true})` methods isolate users and implement atomic create-only compare-and-swap. The server route must derive `ownerId` from verified authentication, not the request body; it must separately establish an actual expected session binding. `consent` must be exactly `true` and be recorded by an explicit UI action; this module **does not display or collect consent itself**.

`preflight` must be a **trusted server-built callback**, not client JSON, that independently runs the deterministic pump replay and current owner/revision checks. This module validates the `kairo-pump-integration-preflight/1` output contract from the isolated PR #72 rehearsal and rejects any result that is not `reviewable-local-draft-only` with `replayConsistent:true`, `ownerSourceLinked:true`, and all identity, competency, verified-save and publishable flags **false**. It independently rereads the owner-scoped v1 lesson, current reviewed source and immutable source revision; it rechecks current source once more before staging. The server must still reconcile actual source changes at the time of later use: **this is not an atomic multi-record transaction**.

The saved record is minimal: model/case/replay digest, source revision, lesson ID, action count, timestamp of consent, explicit `local-unverified` and permanent `canSaveVerifiedEvidence:false` / `publishable:false` flags. It never stores raw answers, notes, original source passages, session ID, owner UID or model-generated content. The deterministic 24-hex draft key is derived from trusted owner, lesson, session and replay/revision identifiers, but those raw identifiers are not stored. The repository already stores the record in an owner-specific partition; do not expose its contents in unauthenticated routes.

On duplicate submission, the repository's atomic `create:true` returns 409; the module reads the existing owner-scoped record and accepts **only the same immutable metadata**, disregarding the new consent timestamp. Conflicting writes fail closed. No updates, deletes, grades or promotion to a verified record occur here.

## Use only after integration review

```js
import {stageLocalPumpDraft} from './studio/server/studio-draft-staging/index.mjs';

// Inside an authenticated route with verified request identity and explicit
// consent, AFTER PR #72's independently reviewed composition is accepted:
const result=await stageLocalPumpDraft({
  repository,ownerId:verifiedIdentity.uid,lessonId:trustedLessonId,
  expectedSessionId:trustedSessionId,consent:explicitConsent===true,
  preflight:()=>preflightLocalPumpEvidence({
    repository,ownerId:verifiedIdentity.uid,lessonId:trustedLessonId,
    expectedSessionId:trustedSessionId,snapshot,evidence
  })
});
// result.status === 'local-unverified'; never treat as an accredited result.
```

This example is **not an existing deployed route**; the callback named above belongs to a draft CI composition tool in PR #72, not to main. It must not be imported from a draft PR into production without independent review and a separately assigned integration scope.

## Tests and release gates

```bash
cd studio
node --test tests/studio-draft-staging.test.mjs
# and after dependency install, full serial suite + production build:
node --test --test-concurrency=1 tests/*.test.mjs
npm run build
```

Tests use a synthetic owner-scoped in-memory repository and a synthetic preflight callback; they do **not** use real Firebase credentials or learner records. They cover create-only storage, duplicate/retry/concurrent idempotency, absent consent, forged trust elevation, redacted preflight errors, cross-owner denial, source review/revision tampering, cross-read revision race and conflicting existing records.

**Before any merge:** inspect exact-head Node24 CI, independent security/privacy review, #34 conditional merge policy and canonical local SQLite ownership (not remotely accessible). Before any real route: independently accept/merge #55/#64/#68/#70/#72 in a coordinated stack, confirm authenticated session/consent binding, rate limit and quota, source/revision changes during commit, delete/recovery UX, and real device accessibility. No production IAM, provider credentials, Kaggle run, billing or deployment is authorized by this module.
