# Role evidence journey audit handoff

**Task:** `ROLE-NEXT-WAVE-AUDIT-20261026-A`

**Agent:** `codex-luna-role-next-wave-audit-20261026-a`

**Client/model/effort:** Codex / `gpt-6-luna` / low

**Date:** 26 October 2026

**Branch:** `codex/role-next-wave-audit-20261026-a`

## Need and criteria

An engineering learner needs to inspect a dated source requirement, distinguish a linked practice record from proof of skill, carry a chosen requirement into useful study, and preserve applicant control over CV facts. This audit supports Product, Usability, Intelligence and Presentation. It documents five concrete gaps with source locations and proposed acceptance; it does not change application behavior.

## Delivered files

- `docs/role-next-wave-audit-20261026/README.md`: five prioritized findings, exact source references, proposed interfaces/acceptance and current safety boundaries.
- `docs/role-next-wave-audit-20261026/browser-result.json`: route/title/action evidence from a synthetic local browser context.
- `docs/role-next-wave-audit-20261026/capture.mjs`: repeatable isolated capture with local GET-only allowlist, off-origin/non-GET/model-like blocking and a no-contact/no-prefilled-input screenshot guard.
- `docs/role-next-wave-audit-20261026/*.png`: local synthetic route screenshots; no real-person data was entered.
- `docs/role-next-wave-audit-20261026/verification.txt`: test and browser result summary.
- `studio/tests/role-next-wave-audit.test.mjs`: four actual-module baseline tests using `roleGapRows`, `EvidenceGapPanel`, `RolePathways`, `createCvDraft` and `CvWorkspace` via Vite SSR.

## Findings for root review

1. `roleGapRows` drops stored source excerpts before the learner panel, leaving only paraphrased labels and a provider link.
2. `roleGapRows` can still label an existing skill link `linked` when `requirementsReviewed` has become false, even though the host correctly disables new actions.
3. “Use this as my learning goal” writes a free-text goal and role title; its My material link does not preserve the requirement/source context.
4. `/pathways` puts the BMW/Siemens engineering role bridge above a separate historical FNB rubric with its own evidence coverage.
5. `/cv` starts blank and only accepts manually pasted role notes; that is a privacy boundary, but no explicit voluntary context handoff exists.

Stored BMW and Siemens availability both remain `unknown`; no provider pages were freshly opened. The historical FNB graduate record remains explicitly labeled closed with its past deadline. The CV contract still correctly excludes target requirements from plain-text applicant claims.

## Checks and limitations

- New actual-module tests: 4/4 passed.
- New plus existing role-gap, pathway, CV and engineering-source suites: 20/20 passed.
- Local synthetic route check: `/direction`, `/pathways`, `/cv` all returned 200; errors 0; blocked requests 0; no contact-like text or prefilled inputs. One requirement chooser click changed only local UI state; no save/POST, external page, model, cloud console, or application action was used.
- No production build was run because no runtime source changed. No phone/device/human usability or live provider availability is claimed.

Source inspection began at `1310eba7ef18be3ff4cf2591613474a61deb5389`. Before publication, `origin/main` advanced to `c4b9ab22900bb37d573eaa6c29cb6d3e91a76813` (PR119); a path diff confirmed none of the audited role, pathway, CV, evidence-panel or role-data files changed. The publication branch is rebased on that current main. This package is ready for independent source/runtime review; none of the proposed interfaces are implemented here.
