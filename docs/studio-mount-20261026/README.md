# Studio integration candidate evidence

Date: 26 October 2026. Candidate branch: `codex/full-integration-candidate-20261026`, based on `7e94b557b095188cf80d0a125d6be4967374bd95`.

## Judging need and scope

- **Product:** keep source context and selected actions coherent for the learner moving from reviewed material into a lesson.
- **Usability:** close the studio action arc before its parent changes the selected panel; keep original and reviewed material visible through the controlled review layout.
- **Presentation / Creativity:** integrate the selected KAIRO studio packages while retaining the C identity and one teacher.

The learner need is to navigate source review and contextual teaching without a selection action being undone by stale panel state.

## Candidate contents

- Integrated exact reviewed PR #127 presentation-state adapter and PR #129 action UI commits.
- Integrated the exact reviewed PR #143 controlled material-review layout package and evidence.
- Corrected `StudioActionArc` so it closes before invoking the parent selection callback. Added a bounded regression assertion to the actual-module SSR test.

These UI packages remain unmounted in the app. The reviewed layout is still not connected to the actual source editor/save/build workflow; action state and KAIRO guide are not wired into a complete new route here.

## Verification

- `node --test tests/kairo-presentation-state.test.mjs tests/studio-action-ui.test.mjs tests/material-review-layout.test.mjs`: 13 passed, 0 failed.
- `node node_modules/typescript/bin/tsc -b --pretty false`: passed with no diagnostics.
- `node node_modules/vite/bin/vite.js build`: passed, 2,354 modules transformed; existing advisory reports chunks over 500 kB.
- Full `node --test tests/*.test.mjs`: failed in this Windows worktree. The ignored OCR virtual environment is absent (`tools/course_sources/.venv-ocr`), so Python and office extraction tests fail; parallel Vite SSR tests also report dependency-scan server restarts and port 24678 collisions. This is not treated as a full-suite pass.
- No end-to-end browser, keyboard, device, screen-reader or human acceptance is claimed for this candidate. Prior synthetic browser evidence does not cover this candidate's complete journey.

## Remaining gates

Mount and test these components in the real source/review/lesson flow, resolve the full-suite environment and parallel-server failures, get independent source review, perform browser and keyboard acceptance, then evaluate private release gates. No deployment or promotion is included.
