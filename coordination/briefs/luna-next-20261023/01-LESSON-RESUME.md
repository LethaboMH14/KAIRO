# Luna 1: revision-aware lesson resume helpers

## Objective and boundary

Implement a small, dependency-free persistence package for the new source classroom. It remembers a chapter and reading preference on this device without misattaching progress to revised material or erasing unreadable saved work. Deliver the isolated package and tests; parent wires it into the route after independent review.

Read AGENTS.md, README.md, docs/KAIRO-PRODUCT-BRIEF.md, coordination/README.md, docs/blueprint/core/README.md, docs/blueprint/experience/README.md, docs/blueprint/experience/BUILD-PLAN.md, coordination/handoffs/2026-10-23-source-rain.md and this directory's README. Inspect `studio/src/source-classroom/{session.ts,SourceClassroom.tsx}`, workspace/types.ts, continuity/progress-restore.ts and its tests. Existing `/learn` notes/progress keys are separate and must stay untouched.

## Startup and exact ownership

Use a unique session ID, for example `codex-luna-rain-resume-20261023-<unique-suffix>`. Register actual client/model/effort, using unknown for settings not exposed. Run status and inbox. Create task `RAIN-RESUME-001` if unused; if already occupied, report rather than take over. Claim only:

- `studio/src/classroom-resume/`
- `studio/tests/classroom-resume.test.mjs`
- `docs/checks/luna-rain-resume-20261023.txt`
- `coordination/handoffs/2026-10-23-luna-rain-resume.md`

No SourceClassroom, session.ts, TeacherProvider, router, workspace types, existing continuity code, packages, lockfiles, configuration or Claude scope edits. Keep parent interfaces unchanged. A new file elsewhere requires a separate nonoverlapping claim and parent agreement.

## Published interface v1

Export from `studio/src/classroom-resume/model.ts`:

```ts
type ResumeLesson = { id: string; sourceId: string; revision: string; chapters: readonly unknown[] };
type ResumeState = { step: number; reading: boolean };
type ResumeResult = {
  state: ResumeState;
  status: 'empty' | 'restored' | 'stale' | 'invalid' | 'unavailable';
  canWrite: boolean;
  message: string;
};
type ResumeStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};
resumeKey(lessonId: string): string;
decodeResume(raw: string | null, lesson: ResumeLesson): ResumeResult;
readResume(storage: ResumeStorage, lesson: ResumeLesson): ResumeResult;
writeResume(storage: ResumeStorage, lesson: ResumeLesson, state: ResumeState,
            permission: ResumeResult): { saved: boolean; message: string };
```

Stored envelope: `{schemaVersion:1,lessonId,sourceId,revision,step,reading}`. Key: `kairo-rain-resume-v1:` + validated 24-character lowercase hexadecimal lesson ID. No source text, question, note, transcript, citation quote, audio, consent or inferred ability is persisted. This package has no window/localStorage access at import time: inject storage. No timestamps or random IDs are needed.

Validate lesson identity (both IDs), nonempty revision at most 128 characters and a nonempty chapter list. Invalid caller lesson context throws a clear argument error before accessing storage. Raw record maximum 4,096 characters. Reject arrays/null/non-object/unsupported versions; require exactly the expected envelope fields, identity match, boolean reading and integer step within current chapter bounds. Do not silently repair out-of-range or unsupported data. `decodeResume` is pure, leaves input alone, and returns fresh state objects.

- No record: `{step:0,reading:true}`, empty, canWrite true, no error message.
- Valid matching envelope: restored, canWrite true, exact cursor/preference.
- Same lesson but a different sourceId/revision: stale, safe reading default, canWrite false, explain source changed and old saved record was left unchanged.
- Wrong lesson ID, malformed record, unsupported version or invalid cursor: invalid, safe reading default, canWrite false, explain saved place could not be read and was left unchanged.
- Storage read throws: unavailable, safe reading default, canWrite false, plain device-storage explanation.

`writeResume` validates new state, requires permission.canWrite and permission.status empty/restored, and re-reads the target key before writing. If the re-read is invalid/stale/unavailable, do not overwrite it. If its valid matching state changed since the caller's permission snapshot, return saved false with a conflict message instead of clobbering another tab. Compare semantic status/state, not object identity. This is best-effort conflict detection; localStorage has no atomic compare-and-set. If storage throws, return saved false. Never report saved true before setItem succeeds. Do not write defaults automatically during restore. Invalid new state returns saved false without mutating storage.

No delete/recovery override is provided. Parent can later design an explicit user-approved reset. Treat saved reading:false as a preference to offer, not authorization to automatically download 3D. No speech/playback state is saved. Refresh must never auto-start narration.

## Implementation sequence

1. Read current code/bus and claim exact paths. Record any interface conflict before editing.
2. Write typed envelope validation and pure decode helpers.
3. Add injected read/write adapter with exception handling and the re-read/conflict guard.
4. Write Node-native TypeScript tests using in-memory synthetic storage and public synthetic IDs; no DOM, React or server needed.
5. Run focused suite, then installed Studio TypeScript check. Save actual commands, exit codes, counts and relevant output in the owned evidence file.
6. Check inbox, write handoff, complete own bus claim with real evidence and notify parent through bus. Do not integrate routes yourself.

## Required meaningful tests

Round trip; missing record; source/lesson/revision mismatch; unsupported schema; malformed JSON; arrays/null; missing/extra fields; oversized record; negative/fractional/NaN/out-of-range cursor (including encode path); nonboolean reading; empty chapter context; invalid IDs; Unicode revision handling within limit; throwing getItem/setItem; denied permission; a corrupt existing record surviving save unchanged; another tab changing a valid cursor between read/save; successful save does not include source/notes/audio/consent content. Make assertions about state and actual storage mutation, not source-code strings. Avoid broad filesystem scans/private data.

Commands from `studio/`: `node --test tests/classroom-resume.test.mjs`, then `./node_modules/.bin/tsc.cmd --noEmit`. Use existing dependencies only. Do not run concurrent aggregate builds; parent owns the stable aggregate checkpoint.

## Acceptance and handoff

All contract exports compile; focused tests pass; no other keys/files are changed; read/write errors retain earlier data; no mounted React/provider/router integration or new dependency. Handoff lists actual model/effort, paths, interface, checks, findings, conflict limitation, storage/privacy boundary and parent integration instructions. Completion is package delivery, not user-facing resume acceptance. Preserve browser restriction and keep the deleted schedule off.
