# Practice milestone card review

This package is a stateless presentation adapter, not an attempt evaluator. Parent supplies the already validated attempt, outcome, assistance state and optional activity counts. The card labels assisted success, unscored reflection, needs-review and unknown assistance without changing them. An optional “Keep my work” callback is not evidence that a save completed.

Judging targets are Product correctness and Usability/Impact through clear, noncredential language. Synthetic test fixtures are not learner or curriculum evidence. Tests do not establish learner validation, a credential, employability or learning gains.

## Source-only mapping audit

Inspected `studio/src/practice/model.ts`, `studio/src/practice/PracticeStudio.tsx`, `studio/src/profile/ProgressPage.tsx` and `studio/src/workspace/learning.ts`.

- The workplace simulator currently records case events and a rule rubric. Those events can be represented as a formative practice record only when the host explicitly maps an event to the published attempt fields; the card does not infer that mapping.
- Attempt `correct` should map to `correct` only for a known keyed check. Open reflection or free-form explanation should map to `unscored`; a weak/incorrect response should remain needs-review. “Met” in a formative rubric must not become external certification.
- Assistance provenance is not uniformly represented in the simulator event model inspected here. In that case host must supply `unknown`, never infer `none` from missing data.
- Source revision must come from the source/lesson record, not the topic label. If source provenance is absent, use an explicit unavailable value rather than inventing a revision.
- Recorded time must be the actual attempt timestamp; invalid/missing time renders “Time not available.” Progression counts should only represent actual recorded activity totals and must not be described as mastery.
- `onKeepWork` is an intent callback. The host must report completion separately; this card never asserts a save or share occurred.

This is a source inspection only. No route integration, browser/device testing, user study or change to the host records is included.
