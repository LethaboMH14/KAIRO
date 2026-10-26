# Studio integration candidate evidence

Date: 26 October 2026. Candidate branch: `codex/full-integration-candidate-20261026`, based on `7e94b557b095188cf80d0a125d6be4967374bd95`.

## Judging need and scope

- **Product:** preserve reviewed source context while a learner moves into contextual teaching.
- **Usability:** offer bounded studio actions, disable actions without their required context, and close the action arc before changing the guide response.
- **Presentation / Creativity:** keep the selected KAIRO identity and existing shared teacher in the studio.

The real `SourceWorkspace` already supports source review and saving. The imported `MaterialReviewLayout` remains a standalone controlled alternative; it was not substituted for the existing workflow.

## Candidate contents

- Integrated exact reviewed PR #127 presentation-state adapter, PR #129 action UI, and PR #143 material-review layout package.
- Mounted `StudioActionArc` in the actual `StudioCompanion`. Explain, predict and reflection actions use prepared KAIRO guidance; “look inside” requires a selected part; “ask from the cited lesson” requires a current reviewed lesson and focuses the existing question field. Selecting an action never dispatches a model request. Existing explicit provider consent remains required.
- Corrected the arc to close before the parent selection callback. Added a regression assertion plus a host-mount guard to the actual-module SSR test.

The standalone `KairoActionMenu`, `TeachingCard`, material-review layout and pure presentation-state adapter remain unmounted. The source and lesson record flow remains owned by the existing source workflow and backend.

## Verification

- `node --test tests/kairo-presentation-state.test.mjs tests/studio-action-ui.test.mjs tests/material-review-layout.test.mjs`: 14 passed, 0 failed after mounting the arc.
- `node node_modules/typescript/bin/tsc -b --pretty false`: passed with no diagnostics after mounting.
- `node node_modules/vite/bin/vite.js build`: passed after mounting, 2,356 modules transformed; existing advisory reports chunks over 500 kB.
- Focused extraction/upload/security checks with the documented OCR Python environment: 29 passed, 1 failed. Only the Tesseract executable availability check failed because `tesseract` is not installed; DOCX/XLSX/PPTX/PDF extraction and upload checks passed. The candidate links to the existing OCR venv through a candidate-only junction; no packages were installed for that venv.
- A full `node --test tests/*.test.mjs` run before connecting the OCR environment exited 1. It logged Vite dependency-scan restarts and port 24678 collisions while test files ran concurrently. The complete suite has not been rerun after the environment link; no full-suite pass is claimed.
- No end-to-end browser, keyboard, device, screen-reader or human acceptance is claimed for this candidate. Prior synthetic browser evidence does not cover this candidate's full journey.

## Remaining gates

Resolve the Tesseract prerequisite and run the complete suite in the intended CI environment, review the mounted studio in browser and keyboard flows, get independent source review, and evaluate private release gates. No deployment or promotion is included.
