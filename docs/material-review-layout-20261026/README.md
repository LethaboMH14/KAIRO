# Material review layout

## Purpose and judging link

This isolated package improves **Product** (a clearer source-to-review step), **Usability** (review slots remain available on narrow screens and action gates explain what to do), and supports **Presentation** through a legible, coherent review workbench. The learner need is to compare extracted text with its supplied original, understand coverage warnings, and continue editing without losing their place.

## Controlled interface

`MaterialReviewLayout` accepts `title`, caller-supplied `original` and `reviewed` React nodes, `sourceRevision`, `coverageLabel`, `warnings`, `busy`, `dirty`, `canSave`, `canBuild`, and `onSave`, `onBuild`, `onCancel` callbacks. It does not open or parse files, make network/model calls, mutate a source revision, save, or build a lesson. The host owns those operations and supplies the actual source/editor slots.

On wide screens the two slots render side by side. At widths up to 48rem, Original and Review tabs switch the visible panel; both React slots stay mounted so a host editor's local state is preserved. Keyboard arrows and Home/End move between tabs. Coverage and warnings remain in ordinary visible text. The source revision is available under a disclosure. If no original node is supplied, the component says so without implying document completeness.

Save is enabled only when the host says saving is allowed, the review is dirty, and no action is busy. Build is enabled only when the host allows it, the review has no unsaved edits, and no action is busy. The host remains responsible for authoritative validation and callback outcomes.

## Evidence

- `node --test tests/material-review-layout.test.mjs` from `studio/`: **5/5 passed** with Node v24.18.0. The tests load the actual React module through Vite SSR and check caller slots, fallback, escaping, long text, save/build disabled states, and the mobile/keyboard implementation hooks.
- `harness.html`, `harness.tsx` and `vite-harness-server.mjs` are synthetic browser fixtures. They contain no uploaded/private learner material and make no network or model calls.
- A local browser attempt could not load the loopback fixture. Windows Computer Use then stopped the session because it could not confirm the current URL. No browser callback, phone layout, keyboard interaction or screenshot was observed or recorded. Full details are in `verification.json`.
- GitHub branch `codex/material-review-layout-20261026-chat3` was created from current `main` at `fc03149be570cb1bbf4b663f612c3fcbd28f0c76`, but automatic review blocked the first source-file upload. No source files were published and no draft PR was created; see `verification.json` and the handoff.

## Limits and next acceptance

This is a controlled layout component only. It has not been mounted in the real source-review workflow, and its gates have not been checked against the production source-revision/save/build contract. Passing SSR component tests is not browser, human/device or learning validation, deployment, or approval to use private materials. Root must mount it with actual review slots and verify source revision integrity and callback outcomes.


