# Practice-pack learner workspace

## Scope and status

This is an isolated learner-facing React workspace for the two authored packs in `studio/src/practice-packs/model.ts`. It is not yet routed into the application. Root owns route integration and aggregate build review.

## Learner flow

- Choose the invented requirements/UAT or digital-support scenario.
- Decision progress text names the current decision; the progress bar counts only decisions already completed.
- Read the fiction notice and the current decision prompt. Revised requirements/case updates appear only after the reducer advances to that step.
- Select one of the authored options in an accessible radio group. Before submission the consumed presenter exposes only option ID and label; answer disposition, demonstrated checks and rationale stay hidden. Explicit hint and submitted-choice feedback are shown after the learner requests or submits them.
- Rejected attempts stay in the reducer history and can be retried. Hints remain visible in that history. Defensible alternatives and escalation choices are still offered.
- Optional reflection appears only at the end and is labelled unassessed. In-progress or completed JSON export passes through `exportRun`, which replays the history.

The run is held in page memory only. Choosing “Leave scenario” or using the host Back action prompts before discarding the run; the browser also prompts on unload after choices, hints or reflection exist. These prompts do not save work. The download message says it was requested and directs the learner to the browser download area; it does not claim that receipt was confirmed.

## Boundaries

The organization and scenario content are invented. Official employer role pages are supplied as task context and do not endorse the exercise. The UI makes no job-readiness, skill-verification or grade claim. It asks for no private records, credentials, passwords, one-time codes or real customer documents. No cloud call or persistent storage is used.

## Contract

Default export: `PracticePackWorkspace` from `studio/src/practice-pack-workspace/PracticePackWorkspace.tsx`; optional `onExit` callback for a future host route. Root may wrap this component from a route after review. The module owns its stylesheet and does not edit shared styles, router, app entrypoint, pack model or manifests.

## Validation

`studio/tests/practice-pack-workspace.test.mjs` checks the consumed pre-answer presenter shape, revised information sequencing, retained escalation options, in-progress export provenance and React server-rendered picker. The focused strict TypeScript check passes with dependency declaration checking skipped. This is not a browser interaction or download-receipt test.
