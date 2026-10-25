# Luna handoff: truthful CV text foundation

- **Task:** `LUNA-CV-DRAFT-001`
- **Owner/session:** `codex-luna-cv-draft-20261022-d`
- **Model/effort:** `gpt-6-luna` / `low`
- **Scope:** `studio/src/cv-draft`, `studio/tests/cv-draft.test.mjs`, `docs/workstreams/cv-draft.md`, this handoff.
- **Status:** focused text model and tests; not routed or integrated with applicant profile data.

## Changes

- Added `createCvDraft` with applicant-selected sections, exact applicant wording and explicit confirmation status. Only applicant-confirmed facts enter plain-text draft output; each is labeled as applicant-provided/confirmed but not independently verified.
- Excluded unconfirmed facts with a warning. Kept optional applicant-supplied target-role requirements separate from draft text and marked them unverified. Labeled practice as applicant-reported.
- Added conservative missing-information warnings and strict allow-lists, text boundaries, and 128 KiB aggregate input/output limits. Plain-text filtering is a formatting boundary, not a security guarantee or truth check. There is no ATS score, auto-inference, network/model call, persistence or file effect.
- Documented the official career-service references and their limits in `docs/workstreams/cv-draft.md`.

## Checks

- `node --test tests/cv-draft.test.mjs` — 7/7 pass.
- `npx tsc --noEmit --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler --allowImportingTsExtensions src/cv-draft/model.ts` — pass.
- Official resume guidance pages opened and checked on 22 October 2026; doc claims were kept to their current page wording.

## Remaining

- Independent code review and later integration decision remain. No route, profile workflow, browser export or ATS behavior was implemented or verified. Applicant review is still needed before any future use of generated text.
