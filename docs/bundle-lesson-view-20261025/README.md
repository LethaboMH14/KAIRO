# Multi-source lesson read-only view

This package presents the PR48 schema-v2 lesson envelope without changing existing lesson routes or services. It is intended for the Product and Usability criterion: learners can inspect selected sources, exact supporting excerpts, chapter citations and missing coverage in one plain reading view. The observable acceptance check is that the actual server-rendered component preserves every selected source reference and exact excerpt while unsupported or malformed records fail closed.

## Contract

`BundleLessonView({record, onRead, onStop})` and `parseBundleLessonView(record)` are exported from `studio/src/bundle-lesson-view/`. The parser checks the v2 envelope, source reference uniqueness and revision formats, provider/mode pairing, evidence-to-source revision mapping, exact offset lengths, chapter citations and quiz anchors. It reports a coverage warning when a selected source has no selected evidence or an evidence item is not cited by any chapter.

The view displays the full selected source IDs/revisions, all chapter text, exact excerpt locators/quotes and read-only practice prompts. It never merges the sources into a single source identity. Only an explicit chapter button calls the supplied `onRead`; the component creates no narrator. It calls `onStop` on unmount and when its record identity (`id` plus `bundleRevision`) changes. It creates no network requests, storage writes, quiz submissions, timers, router behavior or provider state.

## Trust boundary and limits

A browser can alter a record after delivery. Parsing checks shape and internal references only; it does not verify owner identity, current source revisions, review status, quote authenticity or bundle digest. The server must authenticate the owner and verify all referenced current/archived source revisions on every read before passing the record to this view. The component cannot prove educational correctness. A missing excerpt is a coverage gap, not evidence that the learner lacks knowledge.

## Check evidence

`node --test --test-reporter=spec tests/bundle-lesson-view.test.mjs` from `studio/` exercises the actual React component through Vite SSR, stable repeated-instance heading IDs, inert escaped source text, exact source/citation rendering, coverage warnings, parser rejection boundaries, provider metadata and explicit read handler behavior. This is automated markup/parser evidence, not browser, keyboard, screen-reader, visual, device, learner or source-authenticity validation.
