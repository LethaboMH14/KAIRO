# Module chooser UI — isolated package handoff

Original implementation: 2026-10-23. Final verification refresh: 2026-10-24. Current worker registration `codex-luna-module-chooser-20261023-d`, Codex / `gpt-6-luna` / `Light` as exposed in the user's app screenshot (not inferred as `low`). Verification task `MODULE-CHOOSER-FINAL-VERIFY-001` claims only the chooser folder, its focused test, and this handoff. The original implementation and review-repair tasks are complete.

## Judging targets and result

Targets: Usability (clear relevant choices and next action), Product (relevant workspace), Impact (private study without a mandatory CV). Learner need: choose a reviewed module when useful, or begin with own material privately. SSR acceptance: relevant reviewed choices only, both year choices remain reachable, selections cannot self-assert institutional verification, and private material start is visible.

`studio/src/module-chooser-ui/ModuleChooser.tsx` is a stateless props-only component with local compatible `Programme`, `CurriculumModule` and `LearnerContext` types. It does not import an unfinished curriculum package. It presents no needs-review rows; requires code, valid non-null catalogue year, original-reviewed provenance, matching institution/programme and HTTPS source; and retains source locator/date context. Programme changes clear incompatible selections. Year options derive from all valid modules for that programme, while visible modules derive from selected year; switching year retains only compatible selections. Learner changes emit `self-declared`, never `institution-verified`. Private study and `/sources` remain available without programme or CV.

Fixture titles and `SYNTH-*` codes in the test file are explicitly synthetic test data, not university facts or curriculum evidence. No readiness score, official curricula, verified enrolment, learning outcome, or fixed route integration is claimed.

## Checks

- From `studio/`: `node --test tests/module-chooser-ui.test.mjs` — exit 0, **10/10 passed**. Covers actual Vite SSR component rendering, programme/year selection and retained options, shared module once, review filtering, selection clearing and self-declared output, private material start, text escaping, no visible percentage claim, source/date context, invalid code/year/institution/unsafe link suppression, native labels/empty state and start callback.
- From `studio/`: `.\node_modules\.bin\tsc.cmd --noEmit` — exit 0, no diagnostics. Current check was rerun after coordination reported the separate signing fix.
- No browser/device/screen-reader/camera/cloud validation, installs, route integration, or learner validation. SSR does not establish focus order, visual contrast or usability in practice.

## Parent review

Import this package only after root reviews the local types against the eventual pure curriculum validator. Parent owns router/profile/auth/storage and any server authorization. Visibility filtering is not security; callbacks and selected context do not establish enrolment or access rights. No shared files were changed.

## Review repair — 2026-10-23

This follow-up is under `MODULE-CHOOSER-REVIEW-REPAIR-001`, registration `codex-module-chooser-repair-20261023-z` (Codex, `gpt-6-luna`, low). The user-provided app screenshot showed GPT-6 Luna / Light; the initial registration was corrected to match it. The original `MODULE-CHOOSER-001` remains completed under its original owner; this repair reuses only its three file paths.

Changes in `ModuleChooser.tsx` use one reviewed-record predicate for visible choices and emitted selections. It requires a nonempty exact code, integer catalogue year at least 1900, original-reviewed source provenance, programme and institution alignment, a valid HTTPS URL with a host and no embedded credentials, a nonempty locator, a parseable checked date, and a positive integer study year. Emitted module IDs are filtered against that full eligibility set and selected year, so stale/unknown/incompatible IDs cannot survive callbacks. The chooser continues to force `verification: 'self-declared'`.

The test already extracts learner text after removing `style` and `script` nodes. Its copy assertions now demonstrate the distinction: CSS `max-width:100%` is excluded, while visible `Readiness 80%` remains detectable. Year-filter regression tests exercise both current years, show both options remain available in either state, and confirm changing years retains only matching selections. Invalid-record cases include missing code/year, mismatched institution, non-HTTPS, malformed HTTPS and credentialed HTTPS.

### Current checks

- Fresh rerun from `studio/` on 2026-10-24: `node --test tests/module-chooser-ui.test.mjs` — exit 0, **10/10 passed**. It rendered the actual component through Vite SSR and invoked React element callbacks, including both year-switch directions and the copy-extraction positive/negative checks. Vite emitted dependency-scan shutdown warnings while the test server closed; the test process still exited 0.
- Fresh rerun from `studio/` on 2026-10-24: ` .\\node_modules\\.bin\\tsc.cmd --noEmit` — exit 0, no diagnostics.
- The focused run covers the learner copy guard after excluding style/script content, `max-width:100%` CSS exclusion, visible readiness percentage detection, source-link checks, invalid reviewed-record suppression, year retention, private study, callbacks, escaping and native labels/empty state.
- No browser, device, screen-reader or learner validation was performed. SSR checks do not establish visual contrast, real keyboard behavior or accessibility certification.

Root may now review and integrate the isolated chooser. No router/provider/auth/manifests/shared files were changed. Programme filtering is a relevance aid and grants no access or institutional verification.
