# CV workspace source review

Read-only source review by `codex-luna-profile-integrity-20261022-a` (Codex, `gpt-6-luna`, low effort), 22 October 2026. Inspected `CvWorkspace.tsx`, `state.ts`, its CSS, the CV draft model, the `/cv` route, the home link and `docs/continuity/cv-workspace.md`. This is source evidence only; no browser or user interaction was exercised.

## Findings

### P2 — Download feedback can leave a contradictory stale message

- Evidence: `studio/src/cv-workspace/CvWorkspace.tsx:17` sets success feedback after the anchor click, while the catch sets an error without clearing that success message. Line 28 renders the error as `role="alert"` and the message as `role="status"` at the same time. A failed retry can therefore leave “Download requested” visible next to “could not request the download.” The inverse can occur after retrying successfully because success does not clear a prior download error.
- Learner consequence: the latest action has two competing outcomes, including two different assistive-technology announcements.
- Bounded fix: clear both feedback fields at the start of each download attempt, then set exactly one result; alternatively replace the two strings with one discriminated download state.
- Preserve: “Download requested” remains the successful wording; it must not imply a browser receipt.

## Reviewed boundaries with no source defect identified

- Draft edits and confirmation changes invalidate the prior draft (`CvWorkspace.tsx:14,22,24-26`); text/category edits reset confirmation in `state.ts:3-6`.
- Export is gated on a reviewed draft and includes only confirmed details; applicant facts, role notes, and ATS limits are stated in the page/model (`CvWorkspace.tsx:20,25,27-29`; `cv-draft/model.ts:96-116`). No misleading employer upload or ATS pass claim was found.
- Labels wrap their controls or use `htmlFor`; entry removal has an ordinal accessible name, and the page has a skip link and named navigation (`CvWorkspace.tsx:18,22,24`).
- CSS stacks the two-column workbench at `max-width:800px` and defines visible focus styling (`cv-workspace.css:1`). Actual keyboard behavior and phone-sized rendering remain unverified.
- The route is lazy-loaded at `/cv` (`studio/src/studiorouter.tsx:15-17`) and the home page exposes “Build my CV draft” (`studio/src/continuity/LearningHome.tsx:23`).
- Draft details are intentionally tab-local; `beforeunload` protection is present in source (`CvWorkspace.tsx:11-13`). Exact browser warning behavior was not tested.

No runtime files were changed. No tests, build, browser, or interaction checks were run because this task was source-only.
