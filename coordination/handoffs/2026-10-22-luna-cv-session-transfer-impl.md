# CV session transfer codec handoff

Owner: `codex-luna-cv-transfer-impl-20261022-a`
Task: `CV-SESSION-TRANSFER-IMPL-001`
Status: implementation delivered for root review; UI integration is outside scope.

## Changed files

- `studio/src/cv-session-transfer/index.ts` — pure v1 JSON codec with exact envelope, bounded parsing/serialization, fresh known-field projection and existing CV model validation.
- `studio/tests/cv-session-transfer.test.mjs` — focused tests for round-trip data preservation, exact envelope, malformed/unknown data, size limits, model validation, hooks/accessors and nonmutation.
- `docs/workstreams/cv-session-transfer.md` — API contract, safety boundaries and scoped commands.

## Behavior and boundaries

Import bounds JavaScript character length and encoded UTF-8 bytes to 128 KiB before parsing. Both inputs and parsed envelope/session/fact/target records reject unknown fields, non-plain prototypes, accessors and sparse/extended arrays. The codec projects documented fields into fresh values before invoking `createCvDraft`, avoiding caller serialization hooks and reusing the existing factual/text/aggregate validation. Confirmed/unconfirmed state and role notes round-trip as data only. Export checks size including the wrapper; a valid model input may be rejected when the full file exceeds the bound.

No UI, File API, storage, profile, cloud, networking or form replacement code was added. The future caller owns user disclosure, `File.size` precheck, explicit replacement, stale-preview invalidation, atomic commit and fresh learner review.

## Verification

- `node --test tests/cv-session-transfer.test.mjs` — 10/10 passed.
- `npx tsc --noEmit -p tsconfig.json` — passed with no diagnostics.

The root 177-test/build snapshot preceded these files and does not include this implementation. No aggregate build or browser acceptance is claimed.
