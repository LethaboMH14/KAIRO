# Source-to-lesson continuity audit

Scope: read-only review of `SourceWorkspace`, `SourceReader`, `LessonWorkspace`, passage/source APIs and lesson validation. No private data or course originals were opened. No network, model, browser, runtime edits, build or tests were used.

## Findings

### 1. In-progress source text can be lost without a navigation warning

`studio/src/workspace/SourceWorkspace.tsx:10-11,26,32,36` keeps pasted title/text and edited extracted pages only in component state until the user explicitly opens/reviews and saves them through the source API. There is no `beforeunload` warning in the component. Navigating through the header links at line 28 while pasted material or an edited source is present discards that unsaved work. An upload that has completed extraction is saved by the API, but later page corrections remain client-side until “Save reviewed text”.

Bounded fix: derive an unsaved-work flag for nonempty pasted content/title and source text differing from the currently saved page snapshot; show a before-unload warning while it is true, and clear it only after successful source creation/review or explicit selection of another source. Do not warn for unchanged loaded sources.

### 2. A lesson response can appear after its source has become dirty

The generation buttons at `SourceWorkspace.tsx:37` capture the selected source ID and saved revision. The source editor remains enabled at line 36 while `busy` is set. Editing clears `created` at line 36, but the in-flight `/generate` completion unconditionally calls `setCreated` inside `run` at line 37. If a learner edits reviewed text while generation is pending, the server correctly generates from the saved revision, but the resulting lesson card appears beside the learner's now-dirty text with no visible revision distinction. The card can therefore be mistaken for a lesson based on the latest edits.

Bounded fix: invalidate generation on source text edits and suppress any completion whose captured source ID/revision no longer matches the selected, clean reviewed source; alternatively disable source editing until generation completes. Keep the server's revision check as the final guard.

### 3. Deep-linked source loading can overwrite a newer learner selection

On mount, `SourceWorkspace.tsx:15-16` starts `/source/:id` from the query string and later passes its result directly to `select`. Learner actions such as choosing paste mode and opening a passage are available before that request finishes. If the deep-link request resolves afterward, `select` at line 17 replaces the newer source choice without a new learner action.

Bounded fix: give initial deep-link loading a generation/cancellation token and ignore its result after any explicit source-selection action, or delay interaction until that initial load finishes.

## Paths that preserve source identity and evidence

- The client submits `sourceId` and the saved `revision` for generation (`SourceWorkspace.tsx:37`); the server rejects unreviewed or revision-mismatched requests (`studio/server/workspace/routes.mjs:67-68`). A generated lesson stores that revision and the exact evidence snapshot (`routes.mjs:70-79`). Later source edits therefore do not mutate an existing lesson's evidence.
- `validateLesson` restricts citations to IDs from the supplied evidence and checks each question's support quote against a cited excerpt (`studio/server/workspace/model.mjs:24-40`). Local lessons use exact excerpts with a source-recognition question explicitly described as not measuring subject mastery (`model.mjs:44-49`). The lesson UI labels generated content as an AI draft and retains coverage/review warnings (`LessonWorkspace.tsx:40,45`).
- Lesson notes and attempts are keyed by lesson ID and restored/saved locally (`LessonWorkspace.tsx:27,31,47`); markdown export includes the lesson revision, evidence passages, notes and attempts (`studio/src/workspace/learning.ts:12-13`). SourceReader annotations are keyed by source/lesson revision and evidence or section (`studio/src/teacher/model.ts:22-25`), and passage help uses request IDs plus source revision checks (`SourceReader.tsx` request lifecycle; `studio/server/workspace/passages.mjs:5-25`).

These observations are source-level only; actual browser navigation, download, annotation and stale-response behavior were not exercised.
