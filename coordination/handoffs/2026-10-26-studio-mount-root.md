# KAIRO integration candidate handoff — 26 October 2026

Owner: `codex-fresh-coordinator-20261026-a` (candidate execution session `codex-candidate-release-20261026-a`; client Codex; model and effort `unknown` because not exposed).

## Need and judging criteria

Product and Usability: the learner must retain the selected part and reviewed source context while moving from studio guidance into a source-backed question. Presentation and Creativity: use KAIRO and the existing C identity with the shared teacher.

## Candidate and changes

Candidate branch `codex/full-integration-candidate-20261026` at `a114a2a`, based on main `7e94b557b095188cf80d0a125d6be4967374bd95`. Integrated exact reviewed heads from #127, #129 and #143. Mounted `StudioActionArc` in `studio/src/learning-flow/StudioCompanion.tsx`: actions select prepared explain/predict/reflection guidance, and source questions require a current reviewed lesson before focusing the existing question field. The UI does not submit provider work; existing explicit consent and submit controls remain. “Look inside” is gated on a selected part. The callback closes the arc before it updates the guide intent. Test and evidence are in `docs/studio-mount-20261026/`.

The existing `SourceWorkspace` remains the real source-review/save workflow. PR #143's controlled layout is kept as a leaf package because replacing the existing host was unnecessary. The presentation-state adapter, `KairoActionMenu`, and `TeachingCard` remain unmounted.

## Checks

Focused state/UI/review tests passed 14/14; TypeScript and production Vite build passed. Existing synthetic HTTP/SSR source, lesson, practice and resume checks passed 11/11. Focused extraction/upload/security checks passed 28/30 with process-local Tesseract discovery; the Python dependency probe timed out at 20 seconds under host load and a reordered-XLSX assertion failed. The candidate OCR smoke timed out after 35 seconds. Earlier canonical runtime evidence is not substituted for these candidate results.

The full suite has not been rerun after the process environment repair. An earlier parallel full-suite run exited 1 with Vite dependency-scan/port 24678 collisions. No browser, keyboard, device, screen-reader or human acceptance was completed for this candidate; the denied-browser boundary remains in place.

## Remaining work and limits

Resolve the extraction environment timeouts and XLSX failure, run the complete suite in CI, obtain browser/keyboard review once authorized, complete independent source review, and evaluate private release gates. No deployment, user acceptance or release readiness is claimed. The LearnHarness reuse audit remains separate; no upstream code or weights were added.
