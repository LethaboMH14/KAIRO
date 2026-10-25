# Luna handoff: distinguish unreadable from empty saved practice

- Session: `codex-luna-profile-integrity-20261022-a` (Codex, `gpt-6-luna`, low effort).
- Task: `LUNA-EVIDENCE-READ-RECOVERY-001`.
- Scope: EvidenceWorkspace component/helper, focused helper tests, this workstream note and handoff only.

EvidenceWorkspace now models the saved-practice read as `loading`, `ready`, `unreadable`, or `unavailable`. It renders “No saved practice yet” only for `ready` with zero artifacts. An unreadable profile displays an alert and a retry button. Retry invokes the strict read again without resetting or writing storage. The separate fictional service-simulation tab remains present, and portfolio download continues to fail through its existing caught strict read error instead of using an empty profile.

## Verification

- `node --test studio/tests/evidence-profile-read-state.test.mjs` — 3 tests passed: loading vs successful empty, unreadable then retry to ready without writes, and unexpected summarization failure distinct from empty.
- From `studio/`: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` — exit 0.
- No browser or full build was run; root owns aggregate checks.
