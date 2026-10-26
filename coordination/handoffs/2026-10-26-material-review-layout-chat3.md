# Material review layout handoff — 26 October 2026

Owner `codex-material-review-layout-20261026-chat3`; client Codex; model `GPT-6`; effort `unknown` (not exposed). Evidence is in `docs/material-review-layout-20261026/verification.json`.

## Judging link and learner need

- **Product:** source-review completeness and clarity. Learners need to compare the original source with extracted text before it supports a lesson.
- **Usability:** discoverable coverage/warnings and explicit Save review / Build lesson gates, including a narrow-screen tab alternative that retains editor state.
- **Presentation:** calm C-palette workbench with long text, source revision and status kept legible.

## Files and interface

- `studio/src/material-review-layout/MaterialReviewLayout.tsx` and `material-review-layout.css`: controlled component accepting the brief's exact title, original/reviewed ReactNode slots, source revision, coverage, warnings, busy/dirty/save/build flags and three callbacks. The host owns data, persistence and lesson creation.
- `studio/tests/material-review-layout.test.mjs`: actual React/Vite SSR tests for mounted slots, fallback, escaping, long text and action gates; a bounded source/CSS check covers mobile and keyboard hooks.
- `docs/material-review-layout-20261026/`: synthetic-only browser harness, verification record and package explanation.

Desktop uses an original/review split. Under 48rem the component switches between labelled Original/Review tabs while both React subtrees remain mounted. Save is gated on `canSave && dirty && !busy`. Build is gated on `canBuild && !dirty && !busy`. Warnings and coverage remain visible; the advanced revision is disclosed under a native details control. No SourceWorkspace, route, upload, parser, backend, provider or manifest code was changed.

## Checks and limits

`node --test tests/material-review-layout.test.mjs` from `studio/` passed **5/5** on Node v24.18.0. Exact evidence and browser limitations are recorded in `docs/material-review-layout-20261026/verification.json`.

The local browser attempt did not load the loopback fixture; Computer Use then stopped its session because the active Windows browser URL could not be verified. There is no browser interaction or screenshot evidence. Actual callback behavior, state retention after typing across tabs, phone layout and desktop visual balance therefore remain open. Do not describe this as mounted or human/device accepted.

After the user explicitly approved the named GitHub destination, the same connected Contents API published the nine claimed files to branch `codex/material-review-layout-20261026-chat3` and draft PR [#143](https://github.com/LethaboMH14/KAIRO/pull/143) was opened. The first upload attempt had been rejected by automatic review; no alternate route was used. At PR creation, head was `06b86e5b4ba74007fdb7e2361c8680b8bc9f017b`, current `main` was `7e94b557b095188cf80d0a125d6be4967374bd95`, and merge base was `fc03149be570cb1bbf4b663f612c3fcbd28f0c76`. The branch was six commits behind; those intervening commits changed documentation only and did not overlap this package. The PR remains draft and unmerged.

## Next dependency

Root mounts the component around the real private source/extraction/editor slots, validates save/build outcomes against the current source revision and then performs the desktop/mobile/keyboard acceptance pass with actual screenshots. Root owns all workflow integration and merge/deploy decisions.
