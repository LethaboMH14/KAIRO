# Issue #5 handoff — synthetic learner journey acceptance

Session `gpt6-issue5-journey-20261025-0538-sast`; actual GPT-6, effort level unknown. Remote GitHub connector, not owner's canonical checkout. No claim on the live SQLite coordination bus. No private deployment, browser observation, microphone or camera used.

**Base:** `main` `20183faf31fe30bc68e2fc70cb339e7fd24fce79`. **Branch:** `test/issue-5-synthetic-journey-20261025`.

## Scope and first deliverable

- `studio/acceptance/journey-matrix.mjs`: J01–J08 route scenarios, A01–A07 accessibility intentions, 360/430/768/1280px widths.
- `studio/tests/journey-acceptance-preflight.test.mjs`: source/route assertions with Node built-ins and a fail-closed browser policy check. It is not a live browser suite.
- `studio/acceptance/journey-browser.mjs`: **future** guarded Playwright runner restricted to explicit fresh permission, disposable synthetic loopback, no cross-origin browser calls and empty permissions. Current browser denial remains; runner **was not executed** beyond its denial guard.
- `docs/journey-acceptance-20261025/README.md`: reproducible navigation/device matrix and honest pending/human checks.
- This new handoff. No app runtime, source interfaces, package manifests/lockfiles, CI, secrets, infrastructure or local bus were edited.

## Actual results, clear limitations

Read repo instructions, 25 Oct handoff/architecture, router and concrete UI components; current issue and PR/branch ledger. Available isolated Linux sandbox: Node **v22.16.0**, not required Node 24; no repository clone because DNS access to github.com is unavailable. Local staging of the **new files** ran `node --check` on all 3 JS modules and `node --test --test-concurrency=1 --test-name-pattern='synthetic journey inventory|mobile/tablet/desktop|browser observation' tests/journey-acceptance-preflight.test.mjs`: **3 passed, 0 failed**. Guarded browser script directly invoked without approval: **exit 78**, explicit `BLOCKED: browser observation denied`, no browser opened. Tests which require actual app source were not run in the sandbox. Checked-in-source static markers can be reviewed remotely but are not executed Node 24 tests.

**NOT RUN:** Node 24 `npm ci`, full serial `tests/*.test.mjs`, `npm run build`, UI browser actions, keyboard/focus, captions with speech, 200% native text zoom, viewport overflow, screen-reader/contrast, device, screenshot, download and recovery. Do not recycle 741/741 from older integration handoff as new results. No defect was filed from unobserved behaviour. No paid cloud, IAM, private user data, production deployment or dependency install.

## Dependencies and next work

Issue #5 is independent of unmerged PR #1 and separate CI repair #15/#2. A new explicit browser authorization and isolated disposable synthetic workspace are required before any real Playwright operation; a separate pinned permissive dependency review is required. Coordinate any new shared UI/interface fixes with coordinator; no unseen local bus claims may be assumed.

**Next unblocked task:** full Node 24 checkout-based source preflight/serial suite/build in an authorized CI or local workspace. After browser restriction is actually lifted, run synthetic journey and manual screen-reader/native zoom on physical devices; file scenario-ID defect only with reproduction evidence. Criteria served: Product (continuity), Usability (keyboard/captions/recovery), Sustainability (reproducible checks), Presentation (truthful evidence).

No auto-merge or deployment requested.
