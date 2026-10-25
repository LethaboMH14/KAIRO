# Cited explainer reading

This stateless-input component presents a supplied lesson title and up to six cited passages as a code-rendered reading sequence. It does not generate video or a simulation. Each passage keeps its exact quote, source title and locator. The shared KAIRO narrator is invoked only when the learner presses “Read this passage with KAIRO”; the animation begins paused.

The component accepts `lessonId`, `revision`, `title`, `passages`, `onRead`, and `onStop`. It rejects empty, malformed, duplicate-ID, oversized, and over-count input as a whole. It never truncates a quote. The all-passages view keeps every supplied quote available as text. Timing is a bounded reading estimate at 150 words per minute, not a learning measure. Lesson/revision changes reset the sequence and stop prior reading; card changes, pause and unmount also stop. OS reduced motion starts in still mode; the text-only control can also disable transition animation.

## Criteria and learner need

- Product: turn a lesson passage into a coherent, source-visible reading sequence.
- Usability: preserve all text, expose source location, offer keyboard-operable playback controls and a still/text view.
- Presentation: animate text in the KAIRO C identity while identifying its limits plainly.

Learner need: read a source-linked explanation with an optional shared narrator and avoid mistaking a code animation for a generated film or validated simulation.

## Evidence boundary

Automated component/model tests are evidence of rendering and validation logic only. Focused SSR/model suite passed 7/7; focused TypeScript check passed. No browser, device, narrator integration, learner study or learning outcome is claimed. Root owns `SourceClassroom` mounting after review.

