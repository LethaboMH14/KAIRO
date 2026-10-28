# Lesson readiness panel

Package B adds a stateless, presentation-only `LessonReadinessPanel`. It supplements the existing `LessonStartPanel`, which owns reading entry and resume lifecycle. This package does not mount a route or call a provider, router, store, or editor.

## Need and judging criteria

- **Product:** learners need to see the objective, lesson steps and their source locators before beginning.
- **Usability:** learners need clear fixes when the source changed, is unavailable, or a step lacks a valid citation.
- **Presentation:** the panel follows KAIRO's chalk, moss, sage and copper identity with plain learner wording.

## Contract and acceptance

The component accepts the published `LessonReadinessPanelProps` and renders a named region, cited step list, coverage warnings and explicit edit/start/check-source actions. Starting is disabled unless the source is reviewed, the panel is idle, there is at least one step, and every step has citation IDs present in the supplied sources. The callback also checks this gate if invoked directly. Unknown IDs render as missing evidence; blank or duplicate source/step IDs block starting. The prepared-interactive label describes a prepared activity alongside reading.

Acceptance is an actual React component rendered through the installed Vite SSR test harness. The focused cases cover ready, changed, unavailable, busy, empty, missing and mismatched citations, blank/duplicate IDs, prepared-interactive wording, coverage/error rendering, escaped learner text, and direct invocation of the same start gate wired to the button. This package does not claim browser, device or human acceptance.

## Run

From `studio/`:

```powershell
node --test --test-concurrency=1 tests/lesson-readiness-wave.test.mjs
npm run build
```

See `CHECKS.txt` for the actual command results from this delivery.
