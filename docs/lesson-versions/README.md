# Lesson version store

This local Node 24 module provides SQLite persistence for reviewed source snapshots and editable lesson drafts. It is a storage primitive for the root-owned server routes; it does not expose HTTP endpoints, migrate legacy JSON records, or approve a source or lesson.

## API

```js
import { ConflictError, createVersionStore } from './lesson-versions/store.mjs';

const versions = createVersionStore(databasePath);
versions.seedSource(source); // true when inserted, false when the ID already exists
versions.getSource(sourceId); // current source snapshot or null
versions.getSource(sourceId, revision); // immutable historical reviewed snapshot or null
versions.reviewSource(sourceId, expectedRevisionOrNull, reviewedSource);
versions.getDraft(lessonId); // { version, document, updatedAt } or null
versions.saveDraft(lessonId, expectedVersion, document); // expectedVersion 0 creates version 1
versions.listDraftVersions(lessonId); // newest first, metadata only
versions.getDraftVersion(lessonId, version); // full envelope or null
versions.close();
```

`ConflictError` has `status: 409` and `code: 'VERSION_CONFLICT'`. Calls are synchronous. All JSON is returned as a parsed copy so callers cannot mutate stored state through a returned object.

## Storage and validation

Reviewed source revision is SHA-256 over `JSON.stringify(reviewedPages)`, matching the existing workspace hash convention. A source marked reviewed must include reviewed pages and a matching revision; a revision without `reviewed: true` is rejected. Reviewed snapshots are keyed by source ID and revision; the current pointer is updated in the same `BEGIN IMMEDIATE` transaction as history insertion. A compare-and-swap accepts `null` only when the source has no reviewed revision. Reusing a revision with different serialized source content is rejected. `seedSource` never overwrites an existing ID, including when the seed is repeated with changed metadata.

Draft history is append-only. An integer compare-and-swap against the current version appends a version and advances the head in one transaction. The first save uses expected version `0`. Drafts require schema version 1, valid 24-character lowercase hexadecimal lesson/source IDs, a 64-character lowercase hexadecimal source revision, and matching `lessonId`.

Source JSON is limited to 220 KiB and draft JSON to 128 KiB. IDs and revisions are checked before SQL access, and all values are bound parameters. SQLite uses WAL mode, foreign keys and a 5 second busy timeout. A stale write raises `ConflictError`; a missing record returns `null`. This module does not validate domain content such as citations, block semantics, source authorization or learner identity. The route/domain layer must validate those before invoking storage.

## Evidence and limits

The focused suite is `node --test studio/tests/lesson-versions.test.mjs`. It covers idempotent seeds, immutable source history, hash validation, database reopen, two-connection review and draft conflicts, draft history, defensive copies, bad identities, JSON bounds and unchanged state after rejected transactions. It does not provide route, browser, device, multi-user authorization or deployment evidence. The implementation is a local pilot storage module.

The work supports **Product** and **Usability** by preserving reviewed source revisions and learner draft history across server restarts. The learner need is to resume a lesson edit against the right source and retrieve earlier work. The observable acceptance check is that reopen returns the same source/draft history and a stale writer receives a conflict. The focused SQLite suite is the available evidence; route integration, human/device validation and end-to-end resume remain open.
