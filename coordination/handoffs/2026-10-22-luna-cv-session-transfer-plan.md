# CV session transfer plan handoff

Owner: `codex-luna-cv-transfer-20261022-a`
Task: `CV-SESSION-TRANSFER-PLAN-001`
Status: planning complete; no runtime implementation performed.

## Changed files

- `docs/workstreams/cv-session-transfer-plan.md` — proposed v1 JSON contract, bounded validation/import flow, replacement semantics, learner review gate, privacy disclosure, stale-preview invalidation, API proposal and future acceptance cases.

## Repository evidence

- `studio/src/cv-workspace/CvWorkspace.tsx` keeps facts, target-role notes and preview in component state. Its notice says details stay in the tab; the only download serializes `draft.draftText`, which excludes unconfirmed facts and target-role notes. It installs a `beforeunload` warning while work exists.
- `studio/src/cv-workspace/state.ts` demotes edited facts to `unconfirmed`.
- `studio/src/cv-draft/model.ts` validates exact object keys, plain objects, dense arrays, fact IDs, section/origin/confirmation values, text constraints, item counts and serialized input/output sizes. `createCvDraft` intentionally includes only confirmed facts in the draft and leaves requirements outside applicant evidence.

## Decision and next step

Recommended simple explicit replace semantics. Import preserves the saved confirmation enum but sets an ephemeral review gate that prevents preview generation until the learner attests review in this session. This preserves prior state without treating an imported file as present-day consent or verification. Failed/cancelled imports are transactional from the UI's perspective and retain all current values and preview.

The proposed codec API and shared input normalizer are not yet approved implementation interfaces. Root should review the plan, publish/approve the interface and create a separate explicit task/scope before any runtime or UI work. No package, application API, profile storage or external service changes are proposed.

## Checks and remaining work

Planning was based on direct source inspection; no tests were run and no behavior is claimed as implemented or verified. The future implementation must execute the listed acceptance scenarios, with particular attention to bounded pre-parse file handling, atomic refusal, review gating and separate plaintext/session exports.
