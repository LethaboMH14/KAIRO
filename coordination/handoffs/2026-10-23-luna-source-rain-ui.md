# Source Rain reading pane handoff

Owner: `codex-luna-source-rain-ui-20261023-a`, Codex `gpt-6-luna`, low effort. 23 October 2026.

Implemented the stateless `LessonReading` component in `studio/src/source-classroom-ui/LessonReading.tsx` with scoped styles in `studio/src/source-classroom-ui/lesson-reading.css`. It consumes the existing `Lesson` type from `studio/src/workspace/types.ts` and follows the v1 props from `2026-10-23-source-rain-contract.md`.

The pane provides native chapter navigation, explanation narration callback, an “I’m stuck” callback, the active chapter explanation and example, and only that chapter’s linked source evidence. Evidence retains the exact quote and locator, shows character offsets and the lesson’s reviewed revision, and marks edited evidence. Capability copy labels the vertex mode as an AI draft and the remaining mode as local source reading. No router, provider, network, or persistence code was added.

Validation: `studio/node_modules/.bin/tsc.cmd --noEmit` exited 0 for the Studio TypeScript project. Browser behavior and source-session integration were not checked; root owns those paths and integration.

Next step: root can import the default export from `source-classroom-ui/LessonReading` and connect the three callbacks to the shared classroom controller. The component uses `Lesson` from the existing workspace type module; adjust only if the source session publishes a deliberately different public type.
