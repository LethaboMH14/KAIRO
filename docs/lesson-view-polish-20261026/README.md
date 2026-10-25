# Bundle lesson view polish

**Date:** 26 October 2026

**Package:** Worker A from `coordination/briefs/full-wave-20261025/NEXT-WAVE-20261026.md`

**Judging criteria:** Product, Usability, Presentation

**Learner need:** A learner opening a multi-source lesson should be able to read the explanation, locate exact source passages, and find citation anchors without first scanning record hashes or a duplicate set of practice questions.

## Change

`BundleLessonView` now accepts optional `showPracticePreview?: boolean`, defaulting to `true` for standalone compatibility. Setting it to `false` removes only the read-only practice-preview section. It does not change parsing, chapter content, source excerpts, locator text, citation links, read controls, or source coverage validation. The host can use this prop when it already owns the practice interaction; mounting and prop selection remain root-owned.

Selected-source IDs/revisions and excerpt source IDs/revisions are presented inside native, keyboard-accessible `<details>` disclosures labelled “Source details.” Exact excerpts, locators, and chapter citation links stay visible. Coverage warnings now use readable source titles/labels and excerpt locations instead of surfacing raw record identifiers.

The preview still clearly says it does not submit answers or record a score. Hiding this preview does not imply a completed practice attempt, mastery, or progress save.

## Observable acceptance

- Default SSR output includes “Practice prompts.”
- SSR with `showPracticePreview={false}` omits only that preview; the remaining HTML is byte-equal to default output after removing the preview section.
- Exact quotation, locator, and clickable citation anchor remain in the output with the preview disabled.
- Both source identifiers/revisions remain available under native “Source details” disclosures; repeated instances still have unique labelled IDs and anchors.
- Source coverage warning copy does not expose the raw source/evidence IDs.
- Existing malformed-record, citation, coverage, explicit KAIRO read-control, escaping and duplicate-instance behavior remains covered by the actual component SSR/parser tests.

## Verification

- `node --test tests/bundle-lesson-view.test.mjs` — **8/8 passed** against the actual component through Vite SSR and `renderToStaticMarkup`.
- `npm run build` — exit 0; TypeScript passed and Vite built in 49.30 seconds. Vite emitted its existing advisory that some chunks exceed 500 kB; it did not fail the build.
- No browser/device/human usability validation was performed. No host, router, provider, package manifest, or production path was changed.

See [`verification.txt`](verification.txt) for the focused test output and recorded production build result.

See [`coordination/handoffs/2026-10-26-bundle-lesson-view-polish-luna.md`](../../coordination/handoffs/2026-10-26-bundle-lesson-view-polish-luna.md) for commit, PR and integration notes.
