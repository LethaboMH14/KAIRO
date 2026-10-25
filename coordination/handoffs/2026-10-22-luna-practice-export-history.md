# Luna repair handoff: keep full saved history in practice export

- Session: `codex-luna-profile-integrity-20261022-a` (Codex, `gpt-6-luna`, low effort).
- Task: `LUNA-PRACTICE-EXPORT-HISTORY-001`.
- Scope: `studio/src/practice/export-recovery.ts`, `studio/tests/practice-export-recovery.test.mjs`, `docs/workstreams/practice-export-recovery.md`, and this handoff.

Root review found that the export adapter reused `saveCase()`, which intentionally applies a 20-case storage retention cap. That could silently remove a prior record from an export when 20 records were saved and the current run had a new ID. The adapter now constructs a read-only export projection directly: replace the saved item when the run ID matches, otherwise append the current run without applying the persistence cap. It never writes the projected cases back to storage.

## Verification

- `node --test studio/tests/practice-export-recovery.test.mjs` — 4 tests passed, including full-20-plus-new (21 retained) and matching-ID replacement (one current record, no duplicate).
- From `studio/`: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` — exit 0.
- No full build or browser run was performed; root owns aggregate verification.

The exported history remains browser-local and editable. This projection preserves included records but does not claim tamper-proof authorship or verified competence.
