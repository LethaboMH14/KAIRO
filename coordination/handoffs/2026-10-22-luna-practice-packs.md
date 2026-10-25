# LUNA-PRACTICE-PACKS-001 handoff

**Owner:** `codex-luna-opportunity-20261022-b`  
**State:** ready for root review  
**Scope:** authored content and deterministic state/assessment foundation; no UI.

## Changed files

- `studio/src/practice-packs/model.ts` — two deeply frozen fictional packs, source role context, shared reducer, hint/revision/choice/reflection history, user-visible reducer feedback, strict UTC timestamp and input bounds, history replay, and JSON-ready unverified export.
- `studio/tests/practice-packs.test.mjs` — scoped safety, displayed rationale, ambiguity, replay, sequencing and retention coverage.
- `docs/workstreams/practice-packs.md` — reviewer-facing scenario and source boundaries, assessment behavior and limits.

## Decisions

- Employer pages are cited only for role capabilities. Both authored scenarios name the invented Northstar Study Circle, and explicitly disclaim employer assessment/endorsement.
- Each step supports more than one defensible answer where asking for information, pausing or escalating is sound. Choices record only scenario checks demonstrated by that response; the export leaves other checks unresolved and includes no score.
- The business-analysis case logs a scripted revised requirement. The support case logs a revised accessibility issue with unknown cause.
- Credential requests, verification bypass, identifiable data exports and unsupported diagnosis are rejected with rationale and retained as attempts. No real credentials, account details or documents are requested.
- Hints remain in the event stream and are tied to the step attempt. Reflection is bounded but unassessed.
- The active reducer feedback is persisted and validated during replay, so unsafe-choice rationale and hint text are immediately available to the caller without altering history.
- Export replays all recorded actions from the frozen pack and rejects event, sequence, timestamp or final-state mismatch. It emits explicit fictional and unverified provenance.

## Checks

- `node --test tests/practice-packs.test.mjs` from `studio/`: 9 passed after adding reducer-feedback assertions.
- `npx tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler --allowImportingTsExtensions src/practice-packs/model.ts` from `studio/`: passed.
- A first focused TypeScript invocation without `--skipLibCheck` stopped on missing `GPUTexture` names in the installed Three.js type declarations; the focused check passed when dependency declaration checking was skipped. No full build or browser run was performed.

## Remaining work

- Root review of scenario wording, check labels and export contract.
- UI integration and broader application acceptance are outside this claim.
