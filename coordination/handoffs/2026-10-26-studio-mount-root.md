# KAIRO integration candidate handoff — 26 October 2026

Owner: `codex-fresh-coordinator-20261026-a` (candidate execution session `codex-candidate-release-20261026-a`; client Codex; model and effort `unknown` because not exposed).

## Need and judging criteria

Product and Usability: the learner must retain the selected part and reviewed source context while moving from studio guidance into a source-backed question. Presentation and Creativity: use KAIRO and the existing C identity with the shared teacher.

## Candidate and changes

Candidate branch `codex/full-integration-candidate-20261026`, based on main `7e94b557b095188cf80d0a125d6be4967374bd95`. Integrated exact reviewed heads from #127, #129 and #143. Mounted `StudioActionArc` in `studio/src/learning-flow/StudioCompanion.tsx`: actions select prepared explain/predict/reflection guidance, and source questions require a current reviewed lesson before focusing the existing question field. The UI does not submit provider work; existing explicit consent and submit controls remain. “Look inside” is gated on a selected part. The callback closes the arc before it updates the guide intent. Test and full evidence are in `docs/studio-mount-20261026/`.

The existing `SourceWorkspace` remains the real source review/save workflow. PR #143's controlled layout is kept as a leaf package because replacing the existing host was unnecessary. The presentation-state adapter, `KairoActionMenu`, and `TeachingCard` remain unmounted.

## Checks

Focused tests passed 14/14, TypeScript passed, and the production Vite build passed with 2,356 modules and the existing >500 kB advisory. Focused extraction/upload/security checks passed 29/30; only Tesseract executable availability failed. Office extraction cases passed with the candidate-only junction to the existing OCR venv.

A full parallel `node --test tests/*.test.mjs` run before the OCR environment link exited 1 and logged Vite dependency-scan restarts and port 24678 collisions. It has not been rerun after linking the environment. No browser, keyboard, device, screen-reader or human acceptance was completed for this candidate.

## Remaining work and limits

Complete the suite in its intended CI environment with Tesseract available, review this mounted flow in browser and keyboard use, complete independent source review, and evaluate private release gates. No deployment, user acceptance or release readiness is claimed. The LearnHarness reuse audit remains separate; no upstream code or weights were added.
