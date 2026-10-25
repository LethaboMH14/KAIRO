# StudioGuide presentation component

`StudioGuide` is a stateless React presentation for the existing deterministic studio coach. A learner needs clear context, a readable response and prompt, deliberate coaching choices, visible KAIRO text/captions, narration controls and an inspectable source boundary beside the studio activity.

The component accepts the existing `CoachResponse`, `CoachIntent` and `coachFor` model contract. It delegates four intents and all read, pause, stop and access actions to host callbacks. The root can place its teacher visual in the `visual` slot; otherwise the panel shows a simple KAIRO portrait placeholder. Text remains visible independent of narration. Citations appear in a disclosure and only absolute HTTPS links without embedded credentials are rendered as links.

## Judging evidence target

- **Product:** present contextual teaching beside a supported studio task; acceptance is the supplied context and actual current coach response render together.
- **Usability:** give the learner four plain help choices and readable text with keyboard-focusable narration/access controls; acceptance is SSR and callback coverage against the actual component.
- **Presentation and Creativity:** make KAIRO and the current activity visible while leaving the experiment's visual to the host; acceptance is the fallback and injected visual both render.
- **Sustainability:** keep the package stateless and reusable; acceptance is every interaction delegated through explicit props.
- **Intelligence:** show the bounded, authored response, scope and citations; acceptance rejects unsafe links and preserves the authored-scope text. This is not a model or prediction claim.

## Check

From `studio/`, run `node --test tests/studio-guide-ui.test.mjs`. Results are recorded in [CHECKS.txt](CHECKS.txt). The tests load the real component and current coach through Vite SSR and exercise markup, escaping, link filtering, visual fallback and all callbacks.

## Remaining work

The root integration owner must mount the component, pass real module/lesson/selection context and shared teacher-provider state, connect the access callback, and provide any avatar visual. This package has no host integration, runtime speech, language switching, camera behavior, browser/device review, usability study or learning validation. No new dependencies were added.
