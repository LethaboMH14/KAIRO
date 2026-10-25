# Luna handoff: strict browser profile integrity

- Session: `codex-luna-profile-integrity-20261022-a` (Codex, `gpt-6-luna`, low effort).
- Task: `LUNA-PROFILE-INTEGRITY-001`.
- Scope: `studio/src/profile/model.ts`, `studio/src/profile/recovery.ts`, `studio/src/profile/ProgressPage.tsx`, `studio/tests/profile-integrity.test.mjs`, `docs/workstreams/profile-integrity.md`, and this handoff.

## Delivered

`readProfile()` now uses an all-or-nothing version-1 parser. Only absent storage (`null`) creates an empty profile; empty, malformed, unsupported, oversized, duplicate-ID, invalid-row, and over-cap nested histories fail closed. The legacy `parseProfile()` remains tolerant for compatibility. `writeProfile()` validates/projects documented fields before one storage write, drops unknown properties, and leaves the original value untouched when validation or serialization fails. Storage quota errors continue to propagate to the screen-level recovery path.

Progress recovery already consumes strict reads and does not reset or overwrite unreadable raw storage. Deliberate `saveStudy` and `saveCase` caps (50 lessons and 20 cases) remain unchanged and are documented separately. The adjacent PracticeStudio export fallback was identified but not changed under this claim; root requested that it be handled in a separate exact-scope task.

## Verification

- `node --test studio/tests/profile-integrity.test.mjs` — 7 tests passed.
- `node --test studio/tests/practice.test.mjs studio/tests/pathways.test.mjs studio/tests/evidence-workspace.test.mjs studio/tests/progress-recovery.test.mjs studio/tests/profile-integrity.test.mjs` — 27 tests passed.
- From `studio/`: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` — exit 0.
- No full application build or browser run was performed; root owns aggregate build and independent review.

## Limitations and next step

Browser-local records remain user-editable and are not tamper-proof. Strict validation preserves supported data without asserting independent verification. Follow up separately on `studio/src/practice/PracticeStudio.tsx`: if reading the profile fails, refuse portfolio export, keep the current in-memory run and raw storage unchanged, and direct the learner to `/progress` to retry. Do not substitute `emptyProfile()` or claim an anchor click proves a completed download.
