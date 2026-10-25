# Bundle lesson view polish handoff

**Task:** `BUNDLE-LESSON-VIEW-POLISH-20261026-A`

**Agent:** `codex-luna-bundle-view-polish-20261026-a`

**Client/model/effort:** Codex / `gpt-6-luna` / low

**Date:** 26 October 2026

**Branch:** `codex/bundle-lesson-view-polish-20261026-a`

## Need and judging criteria

This improves Product, Usability and Presentation for a learner reading a multi-source lesson: the primary explanation and exact citation evidence should remain easy to scan, with technical record IDs available on demand. A host that already owns practice should be able to avoid a redundant preview without changing the standalone component default.

## Changed files and interface

- `studio/src/bundle-lesson-view/BundleLessonView.tsx`
  - Added optional `showPracticePreview?: boolean`, default `true`.
  - `false` omits only the read-only practice prompt preview.
  - Moved source IDs/revisions under native “Source details” disclosures in both selected-source and excerpt sections.
  - Reworded coverage warnings to use source labels/locations instead of raw identifiers.
  - Kept quote text, locators, citation anchors, parser checks, and KAIRO reading controls intact.
- `studio/tests/bundle-lesson-view.test.mjs`
  - Added actual SSR coverage for default/disabled preview, unchanged remainder markup, visible quotes/locators/citation anchor, and source-detail disclosures.
  - Updated assertions to verify readable coverage warnings without raw record IDs.
- `docs/lesson-view-polish-20261026/README.md`
  - Recorded the interface, acceptance checks, verification and limitations.

Root owns passing `showPracticePreview={false}` from `BundleClassroom`; this package does not edit or mount that host. No router, provider, service, manifest, or lockfile changes.

## Checks

- `node --test tests/bundle-lesson-view.test.mjs`: **8/8 passed** against the actual component using Vite SSR and React static markup.
- `npm run build`: exit 0; TypeScript passed and Vite built in 49.30 seconds. Vite emitted a non-failing advisory that some chunks exceed 500 kB.
- Test/build evidence is recorded in `docs/lesson-view-polish-20261026/verification.txt`.
- Worktree base was `origin/main` at `63927423958830e63397a944e639202c392b9708`.

## Evidence boundaries and next step

Automated SSR/parser/build checks do not establish browser, keyboard, screen-reader, phone, learner or host-mount acceptance. The preview is read-only and does not grade, submit, or save answers. The component's parser still does not replace server-side owner/source-revision verification on each read.

Draft PR review is requested; do not merge or deploy from this handoff. Root may pass the opt-out prop in the existing host after importing/reviewing this component change.
