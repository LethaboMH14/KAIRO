# Luna handoff: bounded raw local-progress copy helper

- Session: `codex-luna-profile-integrity-20261022-a` (Codex, `gpt-6-luna`, low effort).
- Task: `LUNA-PROFILE-RAW-RECOVERY-001`.
- Scope: `studio/src/profile-recovery`, `studio/tests/profile-raw-recovery.test.mjs`, `docs/workstreams/profile-raw-recovery.md`, and this handoff. ProgressPage integration remains outside this task.

`prepareRawProgressRecovery(storage?)` makes one read of the fixed `PROFILE_KEY` and returns `ready`, `missing`, `unavailable`, or `too-large`. The ready envelope is versioned JSON with the fixed storage key and exact original string in `rawValue`; the original is never parsed or normalized. JSON string escaping preserves isolated surrogates when the envelope is parsed. The helper contains no storage writes, network, logs or download action.

Bounds are 1,000,000 JavaScript string units before encoding and 6,100,000 UTF-8 bytes for the serialized JSON envelope. Over-limit results omit the original text. Any future caller must disclose possible personal data and wait for an explicit local download action; no automatic export or UI integration was added here.

## Verification

- `node --test studio/tests/profile-raw-recovery.test.mjs` — 4 tests passed.
- From `studio/`: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` — exit 0.
- No browser or full build was performed; root owns aggregate verification.
