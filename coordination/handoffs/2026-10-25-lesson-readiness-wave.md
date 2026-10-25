# Package B handoff: lesson readiness UI

## Delivery

Added a stateless `LessonReadinessPanel` in `studio/src/lesson-readiness-ui/` with the published props. It renders the objective, lesson steps, source titles and locators, coverage warnings, an error alert, and edit/start/check-source controls. A step with no citation IDs or an unknown ID is incomplete. Blank or duplicate source/step IDs also fail closed. The start callback rechecks the same gate if directly invoked. Start stays disabled unless the source is reviewed, the panel is idle, there is at least one step, and all citation IDs map uniquely to supplied sources.

The panel supplements `LessonStartPanel`: that component continues to own the reading/resume lifecycle. No route, provider, storage, editor, or router code changed. Prepared-interactive copy says to explore the prepared activity alongside reading.

## Judging criteria, need, acceptance

- **Product:** learner need is to understand what the lesson will cover and inspect its evidence before starting. Acceptance check: visible objective and ordered steps with matching source title/locator; start is disabled for invalid evidence.
- **Usability:** learner need is to know what to fix when a source is stale or a citation is absent. Acceptance check: explicit changed/unavailable/empty/missing states and safe start gate.
- **Presentation:** learner need is a calm, consistent KAIRO surface. Acceptance check: C identity palette, responsive layout, visible focus outline, minimum 44px controls and plain wording.

## Evidence and boundaries

Actual component SSR tests: see `docs/lesson-readiness-wave-20261025/CHECKS.txt`. `npm run build` result is recorded there. The test harness verifies rendered semantics and fail-closed states; it does not dispatch DOM events. No browser, headless, device or human validation occurred. No user/learning outcomes are measured. Route mounting remains with the root owner after review.

Live GitHub PR/claim scope could not be checked because `gh pr list` returned `error connecting to api.github.com` in this environment. The fresh PR52 picker package noted by root does not overlap these new files. Check PR scopes again when GitHub is reachable.
