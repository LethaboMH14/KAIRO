# B1 bundle lesson view handoff — 25 October 2026

## Ownership

- Agent/session: `codex-luna-bundle-lesson-view-20261025-b`; Codex; model and effort `unknown` (not exposed by the client).
- Task: `BUNDLE-LESSON-VIEW-20261025-B1`.
- Isolated branch: `codex/bundle-lesson-view-20261025`, based on canonical `a2dfc4f10499bcd32ac45548fc6767094b26c8d2` (includes the committed PR48 schema-v2 lineage `ef53479`).
- Exact claimed paths: `studio/src/bundle-lesson-view/`, `studio/tests/bundle-lesson-view.test.mjs`, `docs/bundle-lesson-view-20261025/`, and this handoff.
- Root retains route/service/provider mounting. This package changed no existing entry point or manifest.

## Delivery

Added a stateless, read-only `BundleLessonView` and pure `parseBundleLessonView(record)` for the schema-v2 multi-source record. The parser rejects malformed/mixed-v1 shapes, repeated source/evidence references, unsupported provider-mode metadata, evidence with a mismatched selected source/revision or offsets, chapters with missing citations, and malformed quiz anchors. It preserves all refs separately and marks selected sources without evidence and evidence not referenced by chapters. The view displays all source IDs/revisions, chapter citation links, exact locator/quote evidence and read-only practice prompts. Explicit read buttons call the parent `onRead`; cleanup calls parent `onStop` on unmount or record identity change. No local narrator, timer, network, storage, quiz mutation or router behavior is introduced.

**Judging need:** Product/Usability, make source-linked multi-document lessons inspectable without hiding missing coverage. **Acceptance evidence:** actual SSR preserves the separate references and quoted spans; parser tests reject invalid shapes and mappings; explicit-read handler invokes only a parsed chapter. This validates presentation contract only, not source ownership/authenticity or learning value.

## Tests

From `studio/`, `node --test --test-reporter=spec tests/bundle-lesson-view.test.mjs`: 5/5 passed. Covered parser acceptance and rejection, coverage flags, actual React SSR, repeated instance IDs, HTML escaping and read action boundary. No browser/headless or device acceptance performed.

## Import and remaining work

Root can import `{ BundleLessonView, parseBundleLessonView }` from `studio/src/bundle-lesson-view/index.ts` and pass only records already verified by the owner-authenticated server. Record identity is `id + bundleRevision`; server verification must still run on every read. Keyboard/screen-reader/visual review, route integration, server ownership/revision checks, and end-to-end multi-source use remain outside this package and unvalidated.

TypeScript project check: 
px tsc -b --pretty false from studio/ exited 0 on the final source.
