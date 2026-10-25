# Student space UI review evidence

## Judging need

Product and Usability: a learner should land in a space that matches the account-owned programme and exposes useful next actions. Intelligence: module references and activity links should be traceable, while KAIRO enrichment remains distinct from prescribed course work. The review checks actual rendering for both cohorts; it does not establish learner usefulness or attainment.

## Method

`studio/tests/student-space-ui.test.mjs` runs the actual `StudentHome` export from `StudentSpace.tsx` and the actual `Studios` component through Vite server-side rendering. It constructs component props using the production `studentSpace()` function and both shipped curriculum JSON files. For `Studios`, a Vite transform injects only the hook result; the component implementation remains the production module. No browser or app source edits were made.

## Results

Run: `node --test tests/student-space-ui.test.mjs` from `studio/`.

Result: 5 tests passed, 0 failed.

The checks cover all actual module codes/titles and their official citation links, each cohort's synthetic student ID and programme, prepared lesson/source links, related activity links, explicit no-marks disclosure, and escaped hostile identity/module strings. Engineering lists only Engineering and Pump Investigation among cohort-specific studio cards; it does not show Computer Science or the stock-control classroom card. Informatics lists Computer Science and does not show Engineering, Pump Investigation, or the classroom stock-control card. Both retain the common source action.

## Limits

This is deterministic SSR component evidence with synthetic enrolment-shaped data. It does not test authenticated cloud account resolution, HTTP status/error states, the full `StudioRouter` route guard, browser accessibility/layout, device behavior, user usefulness, course completeness, learning gains, or institutional integration. Root retains responsibility for account separation and integration acceptance. Activity associations remain KAIRO-authored enrichment, not prescribed university exercises.
