# Lesson version store handoff

**Owner:** `codex-version-store-20261023-a` (Codex, registered model `gpt-6`, effort `unknown`)
**Task:** `LESSON-VERSIONS-001`
**Scope:** `studio/server/lesson-versions/`, `studio/tests/lesson-versions.test.mjs`, `docs/lesson-versions/`, this handoff.

## Delivered

- Added `studio/server/lesson-versions/store.mjs`, a synchronous Node built-in `node:sqlite` store with source seeding, current and historical source reads, reviewed-source compare-and-swap, draft compare-and-swap, append-only draft versions and close.
- Source snapshots are keyed by `(sourceId, revision)`; the current pointer and immutable snapshot write share one SQLite transaction. Reviewed revisions must equal SHA-256 of `JSON.stringify(reviewedPages)`, matching the existing native workspace hash function. Duplicate IDs never overwrite seed content. Hash reuse with different source JSON is rejected.
- Draft saves require schema version 1, matching lesson ID, valid source ID and source revision hash. JSON size limits are 220 KiB for sources and 128 KiB for drafts. IDs/revisions are checked before bound SQL statements. `ConflictError` exposes HTTP status 409 for the route layer.
- A follow-up read-only review found and closed an inconsistent seed case: a source cannot claim `reviewed: true` without reviewed pages and a matching revision, and an unreviewed source cannot carry a revision. Regression coverage confirms rejected seeds create no source head.
- Published the API contract to the coordination bus as message 84 for root integration.

## Judging need and evidence

This improves **Product** and **Usability**: learners need a reliable way to resume editing against the reviewed source and retrieve earlier drafts. Acceptance is observable by reopening the SQLite file and retrieving the exact history, and by receiving a 409 conflict for stale writes. Evidence: `node --test studio/tests/lesson-versions.test.mjs` on Node v24.18.0 passed 6/6, covering two-connection races, reopen, immutable snapshots, size/identity rejection and rollback state. Remaining gaps: root route integration, application-level resume acceptance, human/device validation and production multi-user authorization are not established.

## Files

- `studio/server/lesson-versions/store.mjs`
- `studio/tests/lesson-versions.test.mjs`
- `docs/lesson-versions/README.md`
- `coordination/handoffs/2026-10-23-lesson-versions.md`

## Integration notes and limits

The shared API is exported from `../server/lesson-versions/store.mjs` relative to route modules. `createVersionStore(databasePath)` accepts a local filesystem path. `seedSource(source)` returns `true` only for a newly inserted source; repeat or conflicting seeds return `false`, preserving the first record. `getSource(id, revision?)` returns a defensive copy or `null`. `reviewSource(id, expectedRevision|null, nextSource)` requires the next snapshot to have `reviewed: true`, a `reviewedPages` array, and a matching SHA-256 revision. `getDraft(lessonId)` returns `{version, document, updatedAt}` or `null`. `saveDraft(lessonId, expectedVersion, document)` uses expected version 0 for first save. Draft history list is newest first. `ConflictError.status` is 409.

The store does not duplicate lesson-draft-core validation, validate learner identity/authorization, migrate legacy JSON, or define routes. The caller must validate domain content and filesystem path policy. No manifest, route, provider, browser, headless, capture, cloud or deployment changes were made.
