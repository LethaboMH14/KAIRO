# Strict profile consumer audit

Read-only source audit by `codex-luna-profile-integrity-20261022-a` (Codex, `gpt-6-luna`, low effort), 22 October 2026. Searched `studio/src` for `readProfile`, `parseProfile`, profile writes, and the `kairo-learning-profile-v1` key; inspected all runtime consumers and their surrounding error/export paths. This is source evidence only; no browser or tests were run.

## Finding

### P2 — Evidence workspace presents an empty-history state after a strict read failure

- Trigger/evidence: `EvidenceWorkspace` initializes `artifacts` as `[]` (`studio/src/evidence-workspace/EvidenceWorkspace.tsx:101-102`). Its mount read catches a strict `readProfile()` error and sets `loadError`, leaving the array empty (`:120-123`). The saved-practice panel always passes that array to `PracticeEvidence` (`:131`), whose zero-item branch says “No saved practice yet” (`:25-26`). The alert above it says the saved records could not be read (`:127`), so the page presents an unreadable-storage error and a false absence statement together.
- Learner consequence: a malformed/unsupported/oversized profile can look like no practice exists, even though the application does not know whether records exist.
- Bounded fix: track loading/readable/unreadable separately; show “Saved practice could not be opened” instead of the empty-history view after failure. Keep the fictional service case available and keep portfolio export blocked by its existing caught `readProfile()` error (`:106-118`).

## Consumer trace

- `studio/src/profile/model.ts:47-59`: runtime `readProfile()` uses strict all-or-nothing parsing; legacy tolerant `parseProfile()` (`:13`) has no runtime consumer in `studio/src` based on the search. `saveStudy` and `saveCase` retain 50 lesson / 20 case records (`:57-58`), an intentional persistence cap also documented in `docs/workstreams/profile-integrity.md`; it is not a newly found export loss.
- `studio/src/profile/ProgressPage.tsx:15-20`: catches read failures into an explicit unreadable recovery screen; export re-reads and does not call its serializer after failure (`studio/src/profile/recovery.ts`). No empty-history success is synthesized.
- `studio/src/practice/PracticeStudio.tsx:21-30`: case-draft restoration is separate; profile write failures are caught, and the export adapter refuses to produce the aggregate portfolio on read failure. It does not fall back to `emptyProfile()`.
- `studio/src/evidence-workspace/EvidenceWorkspace.tsx:106-123`: both portfolio export and initial artifact loading catch strict read failures. Export produces an error rather than downloading an empty profile. The empty panel ambiguity is the finding above.
- `studio/src/pathways/RolePathways.tsx:10-16,26-28`: profile failure sets `profile` to `null`, keeps existing artifact links as unavailable, and gives a read-failure status. Its plan export can continue, but it marks linked artifacts unavailable with the refresh reason rather than pretending the profile is empty; no profile write follows a failed link-creation read.
- `studio/src/workspace/LessonWorkspace.tsx:26-32`: the lesson catches strict profile read/write failure and reports that profile progress was not saved; lesson session notes remain a separate local record and export. The profile write expression is not reached when `readProfile()` throws.
- `studio/src/continuity/LearningHome.tsx:12`: the last-opened lesson lookup catches a profile read error and omits the resume card. The home still renders its other routes and has a My progress link; this is silent degraded context, not an unusable page or data write.

## Export and retention assessment

No remaining runtime consumer found in this source search that catches `readProfile()` and then writes an empty profile. `EvidenceWorkspace` blocks its aggregate practice download if the read fails; `PracticeStudio` does the same for its case export. Role-pathway Markdown may still download when practice history is unreadable, but it explicitly represents those linked artifacts as unavailable. The practice export projection appends/replaces the current case without applying persistence's 20-case cap (`studio/src/practice/export-recovery.ts`), so a full saved history is not silently shortened there. Progress and portfolio renderers export the strict-read profile as currently retained; the deliberate 50/20 persistence caps remain the known retention boundary.

No uncaught strict profile read was identified in the runtime search. Apart from the evidence workspace empty-state ambiguity, catches preserve page operation or display an explicit error; no specific read failure was found that makes a whole route unusable from source inspection alone.
