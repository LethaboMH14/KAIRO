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

- `node --test tests/kairo-presentation-state.test.mjs tests/studio-action-ui.test.mjs tests/material-review-layout.test.mjs`: 14 passed, 0 failed after mounting.
- `node node_modules/typescript/bin/tsc -b --pretty false`: passed with no diagnostics after mounting.
- `node node_modules/vite/bin/vite.js build`: passed after mounting, 2,356 modules transformed; existing advisory reports chunks over 500 kB.
- Synthetic HTTP/SSR integration suites for owner-safe lesson create/edit/practice/resume, reviewed-source lesson evidence and source review: **11 passed, 0 failed**. This is application-level synthetic evidence, not browser acceptance.
- Focused extraction/upload/security suite with process-local `KAIRO_PYTHON` and Tesseract `PATH`: **28 passed, 2 failed**. The Python dependency probe exceeded its 20-second limit under host load; the reordered-XLSX worksheet-name assertion returned `null` rather than its expected record. The executable-availability check passed.
- A separate smoke of the real learner OCR worker timed out after 35 seconds against the same synthetic marker. A previous environment owner recorded a successful canonical-worktree smoke, but this candidate rerun did not complete; this candidate evidence does not claim OCR smoke success.
- Full `node --test tests/*.test.mjs` has not been rerun after the process environment repair. An earlier parallel run exited 1 and reported Vite dependency-scan restarts and port 24678 collisions.
- Browser, keyboard, device, screen-reader or human acceptance was not performed for this candidate. The existing denied-browser boundary remains in force.

## Remaining gates

Resolve the environment-sensitive Python/import and OCR timeouts and the XLSX regression, run the complete suite in the intended CI environment, review this mounted flow in browser/keyboard use when the denied-browser boundary is lifted, get independent source review, then evaluate private release gates. No deployment or promotion is included.
