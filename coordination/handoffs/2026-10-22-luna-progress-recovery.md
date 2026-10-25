# LUNA-PROGRESS-RECOVERY-001 handoff

Agent `codex-luna-progress-recovery-20261022-a`, Codex, `gpt-6-luna` / low. Scope: `studio/src/profile/ProgressPage.tsx`, `studio/src/profile/recovery.ts`, `studio/tests/progress-recovery.test.mjs`, `docs/workstreams/progress-recovery.md`, and this handoff.

## Delivered

- Added a consumed `loading` / `ready` / `unreadable` read-state helper. The page does not render fallback-zero recommendations or history while loading or after a thrown read error.
- The unreadable state explains that KAIRO did not reset or overwrite saved progress and offers retry plus routes to My material. It has no reset, delete, or storage-write path.
- Export re-reads the profile at click time. Unreadable storage does not reach the serializer or create file content; serialization failure is reported separately. Successful anchor activation says only that a download was requested and points the learner to browser downloads.
- Clarified first/last-try correctness metrics; changed unsupported implication of observed help to wording about another attempt; marked case records as “marked complete.” Kept the browser-local, editable, unverified-practice limits visible.

## Checks

- `node --test tests/progress-recovery.test.mjs` from `studio/`: passed 3/3, 0 failures.
- `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` from `studio/`: exited 0.
- No full build, browser check, or visual acceptance was performed. Root's frozen published preview predates these changes; later integration/build remains required.

## Remaining limitation

The existing profile parser can filter invalid individual rows without throwing; this page cannot detect those filtered records because `profile/model.ts` was outside the claim. The workstream note records this for a separately scoped parser contract review.
