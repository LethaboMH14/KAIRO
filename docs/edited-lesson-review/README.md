# Edited lesson safety review

**Reviewer:** `codex-luna-edited-lesson-review-20261023-a` (Codex / `gpt-6-luna` / low)  
**Task:** `EDITED-LESSON-REVIEW-001`  
**Status:** checkpoint 0 — contract and legacy baseline reviewed; root's edited-lesson host/routes are not yet present in the inspected checkout. Final findings and test evidence are pending that implementation checkpoint.

This review owns no product code, tests, routes, schemas or shared interfaces. It will inspect the delivered domain/store/host and routes read-only, run their focused existing tests, and report actionable defects to the integration owner. It will not treat this document as implementation acceptance.

## Learner and judging target

The learner needs to make a useful wording or lesson-structure edit, see what changed, and keep the correct reviewed source, question semantics and prior saved work. Product acceptance is that the edited lesson remains usable and source-linked. Usability acceptance is that save/conflict/retry/undo states say what happened and give a clear next action. Intelligence acceptance is that edits do not silently turn an authored explanation into source-supported fact. Sustainability acceptance is that immutable versions and revision references remain interpretable after later edits.

## Review checkpoints

| Area | Evidence to inspect in actual implementation | Observable acceptance |
|---|---|---|
| Source history and CAS | Store review, snapshots, transaction boundaries, expected revision/version on save | Older source and draft versions are immutable; stale writer receives conflict without replacing the newer record |
| Question identity | Draft mapping, question IDs and projection back to native lesson | Reorder/delete/text edits retain the intended native question; answer key, options and support quote cannot silently change |
| Citation anchors | Citation IDs, offsets, split/edit/reorder mapping and host validation | Every retained quote resolves byte-for-byte to the expected source revision/locator; affected or stale anchors cannot appear verified |
| Load/cancel | Host route lifecycle, `AbortSignal` propagation and async state guards | A late response after lesson/source identity changes cannot overwrite the new editor state |
| Save/undo | Save receipt, version identity, busy/conflict/retry and revert implementation | Undo creates a new safe edit or restores the selected prior value without deleting history or changing lesson/source identity |
| HTTP boundary | Route ID/version validation, bounds, status/error mapping and persisted output | Invalid or stale writes fail closed; failures preserve prior records and return learner-usable next actions |
| Accessibility and wording | Actual rendered host copy/semantics plus relevant Node assertions | Busy, conflict, unavailable and retry states are distinguishable; controls expose labels and next action in plain wording |

## Checkpoint 0: current workspace baseline

Read the published contract at `coordination/briefs/editor-build-20261023/CONTRACT.md`, the current `studio/server/workspace/routes.mjs`, `studio/server/workspace/model.mjs`, `studio/src/workspace/types.ts`, `studio/src/source-classroom/session.ts`, `studio/src/source-classroom/SourceClassroom.tsx`, and relevant existing assertions in `studio/tests/workspace.test.mjs`.

At this checkpoint, the new contract deliverables `studio/src/lesson-draft-core/`, `studio/server/lesson-versions/` and `studio/src/lesson-editor-host/` were not present. Existing `routes.mjs` writes reviewed source back to one JSON file without an expected revision argument or retained source snapshot, and the existing review endpoint has no expected-revision compare-and-swap. Existing classroom loading does compare the lesson's source revision with the currently loaded source and checks evidence quotes against the current reviewed pages. Therefore, these legacy files establish a migration baseline only; they are not used as final findings about the new implementation.

The published question mapping rule says native question identity uses a stable `question-<index>` reference, while the draft type exposes only a general `id` and optional question payload. The delivered `draftFromLesson` and `validateDraft` use and enforce the reserved ID convention, and `editDraft` moves IDs with blocks, so that identity mapping is explicit in the current source.

## Checkpoint 1: version store appeared

Worker C's `studio/server/lesson-versions/store.mjs` and `studio/tests/lesson-versions.test.mjs` appeared while the store task was still active. I inspected the code and ran its focused suite from `studio/`:

```text
node --version                         -> v24.18.0
node -e "import('node:sqlite')..."     -> node:sqlite available
node --test tests/lesson-versions.test.mjs -> 6/6 passed
```

Preliminary finding sent to the store owner and integration owner: `validateSource(source)` initially permitted `reviewed: true` with a null/absent revision. The owner changed validation so a reviewed flag requires reviewed pages and a matching hash, and a revision requires the reviewed flag; the store suite now includes a rejection/no-head assertion. Re-run after the final integration checkpoint before treating this as closed.

## Checkpoint 2: domain model appeared

Worker A's `studio/src/lesson-draft-core/model.ts` appeared. Read-only review confirmed the stable question ID convention described above, but found a contract mismatch sent to both Worker A and the integration owner: `editDraft` rejects every `question` text patch, `validateDraft` requires the exact original question prompt, and `draftToLesson` projects the original prompt rather than the draft value. The contract permits clarifying question text while keeping native options, correct key and support quote unchanged; it requires the host to mark the changed text authored/unreviewed. The current implementation therefore cannot produce that allowed change. This needs an owner decision/fix before integration, including a rule preventing an edited prompt from appearing as an unchanged reviewed scored question. No implementation changes were made from this review scope.

I ran the domain test file at this checkpoint:

```text
cd studio && node --test tests/lesson-draft-core.test.mjs -> 5/6 passed, 1 failed
```

The failing assertion is `reflection add, edit, layout and title are retained without inventing a scored answer` at `tests/lesson-draft-core.test.mjs:107`. After the fixture removes all chapter explanation/worked-example blocks, a native question remains. The model's `teaching()` helper counts that question, so it permits a draft whose `draftToLesson` projection has `chapters: []`; the current classroom loader rejects a lesson with no chapters. I reported this to Worker A and the integration owner and requested at least one valid projected explanation/worked-example remain (or another safe, valid projection) plus a regression test. This is an open issue until corrected and retested.

I also confirmed the existing `Progress.attempts[].question` key is a numeric array index (`studio/src/workspace/learning.ts`), and `LessonWorkspace` selects attempts by that index. Because the current `draftToLesson` emits questions in edited block order, editing the quiz order under the same lesson ID can attach a saved answer to a different prompt. Reordering/removal can also make an index out of range. This safety risk was sent to the integration owner and Worker A; the host must preserve or migrate stable question identity and test old attempts across edits without rewriting their meaning.

After further active-owner edits, the next observed domain test snapshot returned 5/7. One failed assertion is the no-op round trip `draftToLesson(draftFromLesson(lesson), lesson)`: the current projection expanded two native chapters into four and moved worked-example text into `explanation`, leaving `example` empty. The same test file then expects four one-block chapters, contradicting its preceding deep-equality expectation. The other failure is the provenance mutation check at `lesson-draft-core.test.mjs:58` (mutation 11); exact current input requires owner investigation. I reported both, including the incompatible test expectations, and asked for a stable checkpoint. Do not treat the 5/7 snapshot as the final result while the owner task remains active.

## Evidence limits

No browser, screenshot, audio, cloud call, dependency install, deployment, or learner/device/screen-reader validation is in scope. Node tests exercise only their named code paths. Static or unit passes will not establish production authentication; the contract describes a local pilot without tenant accounts. Final results must name the actual checked files, command and result, and distinguish automated evidence from human/device acceptance.

## Checkpoint 3: integrated routes, host and learner reading path

Read the updated contract refinement in `coordination/briefs/editor-build-20261023/CONTRACT.md` and inspected the current route implementation, `LessonEditorHost`, `DraftReading`, `SourceClassroom`, the actual route/host/model/store tests, and the current source loader.

Closed earlier snapshot findings against current code:

- The store now keeps immutable reviewed source snapshots and uses compare-and-swap (CAS) for source review and draft writes. `/source/:id/revisions/:revision` returns an exact retained revision; `loadReviewedLesson` requests it when current source differs and validates citation locator, offsets and exact quoted text against that historical page. The integration acceptance test is named “source review uses expected revision and old lesson loads exact historical source after correction.”
- The published refinement supersedes the earlier prompt-edit allowance: scored question wording, options, answer key, support quote and citations are immutable; title can change. The draft model validates the native question association and `draftToLesson` uses the native quiz record. Publishing uses a fresh lesson ID and stores `parentLessonId`, so prior lesson progress keyed by lesson ID is not reassigned to a reordered question. The integration test also checks the original lesson JSON remains unchanged and the copied quiz remains the same.
- The copied lesson carries `editorDocument`; `SourceClassroom` renders that document through `DraftReading`, which retains explanation/worked-example/reflection kinds, card order and layout, source evidence links, and a warning that edited explanations, worked examples and reflections are not independently verified. Therefore the prior checkpoint concern that the live classroom drops the edited document is closed.
- Host tests cover cancellation/abort-ignoring late saves, exact source references through undo/redo, debounced expected-version saves, stale conflict behavior, failure recovery, publication linking, escaping and hiding the answer key.

### Finding — P2: device reading copy and notes do not preserve editor-only content

`SaveReading` hands the published `Lesson` to `addReadingPack`, which copies only `lesson.chapters` and `lesson.reviewWarning` (`studio/src/continuity/model.ts`). `draftToLesson` produces legacy chapters from edited teaching blocks by putting each block’s text in `explanation`, leaving `example` empty, and omitting reflection blocks (`studio/src/lesson-draft-core/model.ts`). The live classroom reads `editorDocument`, but the saved device reading pack and `exportNotes` use only the legacy chapter list. As a result, edited worked examples lose their type/placement in the saved copy, personal reflection blocks and selected layout are omitted, and its warning does not explicitly name worked examples. This is not loss of the original server lesson or quiz, but it is a gap in the “Save reading copy”/export continuity path.

Action for the integration owner: map `editorDocument.blocks` into the saved reading-copy/export format (including kind and authored reflections), or provide a tested adapter; make the saved-copy warning name worked examples as well. Add a regression through a published lesson containing a moved/edited worked example, reflection and nondefault layout. The warning is already correct in the live `DraftReading`; this finding concerns the separate device-copy/export representation.

### Checks and limits

- Root evidence `docs/editor-build-20261023/backend-tests.txt`: **19/19 passed** (5 route integration, 7 domain and 7 version-store assertions).
- Root evidence `docs/editor-build-20261023/host-tests.txt`: **8/8 passed**.
- Reviewer rerun from `studio/`: `node --test tests/lesson-editor-host.test.mjs tests/lesson-draft-core.test.mjs tests/lesson-versions.test.mjs` — **22/22 passed**.
- Reviewer attempted `node --test tests/editor-integration.test.mjs tests/lesson-draft-core.test.mjs tests/lesson-versions.test.mjs` — exit 1 because the sandbox denies test HTTP listeners to `127.0.0.1` (`connect EACCES`, five route cases); the remaining 14 tests passed. This is an execution-environment limitation, not evidence that the routes failed. Root's supplied route-suite evidence is separate and passed.
- No browser, screenshots, device, screen-reader, learner, cloud, paid-call, or deployment validation. These checks establish only the named local automated paths; no educational outcome or production-tenant guarantee is claimed.

Review target: Usability (clear editing, save and recovery next steps), Product (source-grounded edited lesson that remains readable), Intelligence (source anchors and immutable scored practice), and Sustainability (recoverable version history). The P2 continuity finding is open for root integration review; this reviewer made no product changes.
