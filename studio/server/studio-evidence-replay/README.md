# Pump lab draft replay audit — Issue #49

This module is a **read-only server-side prerequisite** for future KAIRO studio evidence integration. It uses the existing main-branch `pump-lab/session.ts` deterministic action replay and `pump-lab/report.ts` draft evidence constructor; it does **not** introduce a new pump simulation or edit the live host/router. It is separate from the new pump what-if learner activity in PR #55 and the five-studio local review adapter in PR #64.

## What it does

`auditPumpDraft({ snapshot, evidence, expectedSessionId })` checks a bounded, canonical JSON pump snapshot against the existing replay engine, reconstructs the evidence **from the actions**, and compares the full submitted draft evidence object with the recomputed one. Extra source/owner metadata and unknown action fields fail closed. The caller must supply `expectedSessionId` from a **trusted, separate** session binding; taking that value from the submitted snapshot defeats this check.

A consistent draft returns `replayConsistent:true`, status `replayed-local-draft-only`, a SHA-256 fingerprint of the canonical action log, version and bounded count/assistance metadata. It does not return raw notes, action payloads or session IDs. Rejected drafts return only a short machine-readable error code and false verification flags.

**Important:** even a matching SHA-256 and deterministic replay cannot prove who performed the actions. An attacker can author a new self-consistent action log and draft. FNV-1a in the existing draft item is not an authentication MAC; the added SHA-256 is also an unkeyed digest, **not** a signature. Never label this result as server-verified competency, award a credential, or write an authenticated grade.

## Example use (not a mounted API route)

```js
import { auditPumpDraft } from './server/studio-evidence-replay/audit.mjs';
const review = auditPumpDraft({
  snapshot: untrustedSubmittedSnapshot,
  evidence: untrustedSubmittedEvidence,
  expectedSessionId: sessionIdFromTrustedServerSessionRecord,
});
if (!review.replayConsistent) return { status: 'rejected', code: review.code };
// Still NOT authenticated learner evidence. Further owner/source/revision checks required.
```

This module must only run on the **server**: it imports Node crypto/util and must not be bundled into the browser. No production route calls it today; no new persistence or model invocation was added.

## Future authenticated bridge (separate owned task)

A server route must authenticate the current learner; resolve a server-created session ID bound to that owner, lesson, source manifest and exact reviewed source revisions; check retention/consent and owner isolation; replay canonical actions using this adapter; enforce replay idempotency and authoritative grade policy; then store only minimal versioned evidence with provenance. PR #46/#47 lesson/UI contracts and PR #64 local review must be reviewed first. Existing `PumpHost` browser-local `originLessonId` and any client-supplied `sourceRevision` are not trusted authority.

## Test and acceptance

From repo root on **Node 24**:

```sh
node --test studio/tests/studio-evidence-replay.test.mjs
```

Full CI must also run `cd studio && node --test --test-concurrency=1 tests/*.test.mjs && npm run build` and the Python bus isolation suite. Human/device validation is still required for any later UI integration; this isolated module has no visual change. The owner's canonical SQLite bus cannot be inspected through the remote GitHub connector and needs reconciliation before merge.

Judging criteria: **Product** (source-to-studio evidence chain), **Intelligence** (deterministic model-grounded feedback), **Usability** (truthful learner progress) and **Sustainability** (auditable replay). No measured learning impact or expert engineering validation is claimed.
