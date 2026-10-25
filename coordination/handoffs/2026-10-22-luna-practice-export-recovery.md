# Luna handoff: refuse practice export after an unreadable profile

- Session: `codex-luna-profile-integrity-20261022-a` (Codex, `gpt-6-luna`, low effort).
- Task: `LUNA-PRACTICE-EXPORT-RECOVERY-001`.
- Scope: `studio/src/practice/PracticeStudio.tsx`, `studio/src/practice/export-recovery.ts`, `studio/tests/practice-export-recovery.test.mjs`, `docs/workstreams/practice-export-recovery.md`, and this handoff.

## Changed behavior

`preparePracticePortfolioExport` re-reads the saved profile and returns an explicit `unreadable` result without preparing an export if that read fails. On success it projects the current in-memory case into the portfolio in memory and keeps any linked lesson/source excerpt; it never writes profile storage. `PracticeStudio` no longer catches a read failure by substituting `emptyProfile()`. It leaves the current run on screen, states that no portfolio file was prepared, and links to `/progress` for a retry. Successful anchor click wording is “Download requested. Check your browser downloads.” rather than a receipt claim.

The practice-save error copy also no longer tells learners that exporting can rescue unreadable history. No broader saved-case restoration or profile repair was added.

## Verification

- `node --test studio/tests/practice-export-recovery.test.mjs` — 2 tests passed: unreadable reads refuse export and preserve the run; ready export includes the current run and linked source without mutating saved data.
- From `studio/`: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` — exit 0.
- No full build or browser run was performed; root owns aggregate verification.

Browser-local data remains editable, and the adapter makes no claim that clicking a download link means a file was received.
