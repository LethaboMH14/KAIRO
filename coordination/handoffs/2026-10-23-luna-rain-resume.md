# Luna source classroom resume helpers — handoff

Date: 2026-10-23 (Africa/Johannesburg)

## Worker and ownership

- Registered as `codex-rain-resume-20261023-b`, client Codex, actual exposed model `gpt-6`, effort `unknown` (not exposed). Requested `gpt-6-luna` / low was unavailable in this session and was not assumed.
- Task: `RAIN-RESUME-001`; exact owned paths: `studio/src/classroom-resume/`, `studio/tests/classroom-resume.test.mjs`, `docs/checks/luna-rain-resume-20261023.txt`, this handoff.
- Read the required KAIRO product/coordination documents and source Rain baseline. Registered, checked status/inbox, claimed before edits, and checked the inbox again at handoff. No new inbox messages arrived after event 49.

## Delivered interface

`studio/src/classroom-resume/model.ts` exports the published v1 `ResumeLesson`, `ResumeState`, `ResumeResult`, `ResumeStorage`, `resumeKey`, `decodeResume`, `readResume` and `writeResume` APIs. The adapter has no import-time browser storage access. It validates the 24-character lower-hex IDs, revision length and nonempty chapter list; only accepts an exact schema-v1 envelope up to 4,096 characters; and saves the lesson/source/revision identity with chapter index and reading preference only.

Missing records return an in-memory default. Malformed and wrong-lesson records return `invalid`; valid records for changed source/revision return `stale`; storage read failures return `unavailable`. These states cannot authorize writes. The save path validates the new cursor, re-reads the key and compares semantic permission snapshots before writing. It preserves invalid/stale content and refuses to overwrite a changed valid cursor. Save success is returned only after `setItem` succeeds.

No source text, question, note, transcript, citation quote, audio, consent or inferred ability is persisted. A saved `reading: false` remains a preference only; this package starts no speech or 3D. No deletion/recovery override was added.

## Checks and evidence

- `node --test tests/classroom-resume.test.mjs` from `studio/`: exit 0, 13/13 passed.
- `.\node_modules\.bin\tsc.cmd --noEmit` from `studio/`: exit 0, no diagnostics.
- Detailed outputs, counts, scope and limits: `docs/checks/luna-rain-resume-20261023.txt`.

## Parent review / integration

The package is intentionally not mounted. Before integration, claim `SourceClassroom.tsx` separately and restore only after `loadReviewedLesson` has verified the lesson and reviewed source. Explicit valid URL step should take precedence over saved chapter. Avoid saving defaults before restore resolves; do not auto-start narration or mount saved 3D preference on constrained devices. Keep existing `/learn` notes/progress storage separate. Recheck bus ownership before claiming any runtime files.

The read-then-write check is best effort: localStorage has no atomic compare-and-set, so another tab can write in the small gap after the read. Tests use Node and synthetic storage; no browser, React route, device, audio or learning acceptance is claimed. No router, provider, classroom component, workspace type, continuity module, manifest, configuration or Claude-owned file changed.
