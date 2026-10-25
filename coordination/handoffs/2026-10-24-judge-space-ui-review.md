# Handoff: student space component rendering review

Agent `codex-judge-engineering-20261024-a`; actual model/effort not exposed, registered as unknown. Task `JUDGE-SPACE-UI-001`.

## Need and acceptance

Criteria: Product and Usability (right cohort navigation and practical next actions), Intelligence (source-linked module content and honest authored mappings), Presentation (coherent programme-specific studio list). Need: each synthetic account owner should see modules and studios that match their own course profile. Acceptance: actual StudentHome/Studios rendering distinguishes engineering and informatics, shows the right module IDs and citation/source/lesson actions, avoids implying grades, excludes unrelated cohort studios/stock classroom card, and escapes unsafe user text.

## Changed files in owned scope

- `studio/tests/student-space-ui.test.mjs`: five Vite SSR behavioral tests against the actual components and production curriculum JSON/model.
- `docs/judge-space-ui-review-20261024/README.md`: method, outcome, criteria, and limitations.
- `docs/judge-space-ui-review-20261024/CHECKS.txt`: command and results.

## Evidence

`node --test tests/student-space-ui.test.mjs` passed 5/5. Both records come from the actual JSON packs and are normalized with `studentSpace()`. All visible module codes/titles and official citation hrefs are checked. Prepared source/lesson actions, activity routes, no-marks wording, unsafe string escaping, and cohort-specific Studios contents are asserted. Engineering excludes Computer Science and classroom stock-control; informatics excludes Engineering, Pump Investigation, and classroom stock-control. The common source action remains.

No app/runtime/server/provider/router changes were made. `StudioRouter.tsx` was read-only reviewed; the route guard itself was not driven in this component suite. There was no browser/device/user acceptance. Root owns account-separation and route-guard integration verification and any fixes. No enrolment, attainment, or learning-benefit claim follows from SSR tests.
