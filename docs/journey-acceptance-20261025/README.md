# Issue #5 — synthetic learner journey and device acceptance, 25 October 2026

## Status and safety boundary

**Implemented:** `studio/acceptance/journey-matrix.mjs` identifies J01–J08, A01–A07 and four viewport profiles. `studio/tests/journey-acceptance-preflight.test.mjs` checks actual source/route anchors and fails closed when the browser runner is invoked without approval. `studio/acceptance/journey-browser.mjs` provides a **future** restricted, non-destructive, isolated-local Playwright runner. Code review and static preflight are not real-device acceptance.

**Not performed:** No browser opened, navigated, captured, listened, or granted microphone/camera permissions. Earlier browser-observation permission denial remains in force. No screenshot diffs, actual browser keyboard passes, contrast audit, screen-reader pass, native 200% text-only zoom, mobile-device test, offline shutdown/restart drill or private hosted-site check is claimed. No account was created or signed in. No cloud resources or paid calls.

## Verified route map and synthetic journey

| ID | Route | Intended observation (requires future authorized browser run) |
| --- | --- | --- |
| J01 | `/account` | Account boundary visible, no credential or account mutation |
| J02 | `/sources` | Choose stock-control public sample, not uploaded private document |
| J03 | `/sources` | Read, affirm review, save revision and create local *extractive* lesson without an AI call |
| J04 | `/classroom?lesson=<synthetic ID>` | Start reading, visible chapter/caption alternative, stop narrator, reduced motion and reading/3D; save reading copy |
| J05 | `/studios` | Prepared rooms identified as prepared examples, not generated from source |
| J06 | `/classroom?lesson=<same ID>` | Practise against linked source without assuming mastery or unassisted score |
| J07 | `/classroom?lesson=<same ID>&tab=evidence` | Enter synthetic note, request Markdown, verify contents and reload without losing note |
| J08 | `/saved` | Saved reading copy visible for continuity; full offline resilience still separate |

All app routes and component markers were read from the 25 Oct `main` sources. Routes are *code evidence*, not proof that clicking them works in an actual browser. Matrix IDs are stable; skip any destructive, privileged or real-user variant.

## Accessibility/device matrix (all browser/human results pending)

| ID | Check | Measurable acceptance | Actual result |
| --- | --- | --- | --- |
| A01 | Keyboard | Tab/Shift+Tab meaningful, skip link reaches content, modal Escape and return focus, visible focus/no trap | **Not run** |
| A02 | Caption / speech | Narration text visible without sound, Stop stops speech, no microphone prompt | **Not run** |
| A03 | 200% text zoom | Browser-native 200% text zoom, controls reachable, no clipped labels/overlap or horizontal two-axis scrolling | **Not run**; root-font scaling in code is a proxy, not native zoom |
| A04 | Motion | OS reduced-motion preference honored, manual checkbox available, task does not require 3D animation | **Not run** |
| A05 | Screen reader | NVDA/Firefox or VoiceOver/Safari names/roles/states, headings, announcements, source locators | **Not run** |
| A06 | Responsive | 360×780, 430×932, 768×1024, 1280×800; no obscured primary action/horizontal overflow; physical devices separately | **Not run** |
| A07 | Download/recovery | Markdown includes synthetic note and source revision, reload preserves work; blocked storage/corrupt cursor and offline reconnect | **Not run** |
| A08 | Contrast | Measure WCAG AA contrast on text, status, controls, focus and accessible diagram alternatives, light/dark | **Not run** |
| A09 | Visual diff | Only with renewed screen-observation consent, compare approved redacted synthetic viewport screenshots | **Not run**; screenshot capture intentionally absent |

## Reproduction and baseline

In a *complete* checkout under Node 24, from `studio/`: `npm ci`, `node --test --test-concurrency=1 tests/journey-acceptance-preflight.test.mjs`, then `node --test --test-concurrency=1 tests/*.test.mjs` and `npm run build`. Log versions, commit SHA, exact stdout/stderr and exit codes. Preflight passing proves **only** source/manifest markers, not navigation or accessibility.

The optional Playwright script is guarded **before** importing the package. **Do not run it while prior browser denial is active.** If owner explicitly replaces that denial, first coordinate a disposable synthetic-only isolated server, new scope and approved Playwright pinned provenance. No dependency is installed by this PR. The runner accepts only `http://127.0.0.1:<port>` with explicit authorization flags, blocks cross-origin browser requests, dismisses dialogs, creates an empty context with no device permissions, and captures no screenshots/audio. Never point it at IAM-private Cloud Run or other sites. Approval must be real; setting flags does not itself grant permission.

Scenario output is JSON with IDs, `PASS`/`FAIL`; a failure ends dependent stages and remaining checks are **not run**. Runner does not validate native 200% zoom, human screen-reader order, mobile Safari/Android, real contrast, full offline shutdown, language/voice accuracy or learning outcomes.

## Defect template and handoff

A reproduced defect must supply ID, exact base/branch/commit, Node/browser/OS versions, synthetic fixture, viewport/motion settings, numbered steps, expected vs actual result, relevant error and permission status. Redact sensitive content. **No browser defects filed**: there is no authorized browser run or observed reproducible failure. Existing source/resume/export/offline tests cover some contracts but do not replace device evaluation.

Judging needs: Product (connected flow), Usability (alternatives and recovery), Sustainability (repeatable acceptance), Presentation (honest proof). Deliverable = acceptance harness and pending measurement plan, **not** a confirmed usability outcome.
