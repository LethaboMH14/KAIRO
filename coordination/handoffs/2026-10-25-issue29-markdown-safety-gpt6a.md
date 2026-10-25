# Issue #29 — local portfolio Markdown integrity (25 October 2026)

Session: `gpt6-kairo-principal-20261025-0545a`; ChatGPT, GPT-6, effort unknown. This is a remote GitHub connector worker, **not** the owner's canonical local checkout. I did not run, register with or claim paths on the owner's SQLite bus. Issue #29 records a cooperative GitHub scope; reconcile against local claims before merging.

## User need and judging effect

Product / Intelligence / Usability: self-reported practice records and extracted passages must not masquerade as KAIRO-issued certification, an official claim, trusted link or new headings in a downloadable Markdown portfolio. Authored headings, actual source attribution and unverified disclaimers remain.

## Files changed

- `studio/src/portfolio-export/markdown-safety.ts`: shared context-specific Markdown literal-text escaping for untrusted text, including HTML entities, links/images, headings, rules, lists, code and blockquote markers.
- `studio/src/profile/model.ts`: escapes user-supplied lesson/case titles, IDs, event fields and reflections within existing `portfolioMarkdown`; authored sections preserved.
- `studio/src/practice/export-recovery.ts`: escapes the linked lesson title/revision and source citation fields before appending them to the existing practice portfolio.
- `studio/tests/portfolio-markdown-safety.test.mjs`: five unit checks and two integration-level regression checks for the existing export helpers.
- This handoff.

No changes to HTML/JSON portfolio logic, storage, auth, APIs, model gateways, credentials, deployments, CI workflows or build scripts.

## Actual verification

- Local isolated source of the new pure escaping helper: `cd /mnt/data/kairo-issue29/studio && node --experimental-strip-types --test --test-concurrency=1 tests/portfolio-markdown-safety.test.mjs` — **5/5 helper-focused cases passed, 0 failed**, Node v22.16.0. Local test fixture was helper-only; do **not** treat this as the committed seven-case test file or a full repository run.
- The committed `studio/tests/portfolio-markdown-safety.test.mjs` includes **seven** cases, including two integration cases importing live KAIRO TS modules. They have **not** run in this environment, which does not contain a complete clone of the repository or Node 24.
- Required next: full Node 24 serial suite (`cd studio && node --test --test-concurrency=1 tests/*.test.mjs`), `npm run build`, Python bus tests via the integrated CI workflow. Review CI logs and fix regressions before claiming accepted.

## Limits and follow-up

This guards Markdown *presentation integrity*, not factual truth or local-device tampering. A locally generated text file remains self-reported and unverified, and can be manually edited after export. Avoid claiming signed, accredited, verified or employer-endorsed skill evidence. Client-provided lesson citation fields require server-side revision/owner validation in the actual learner flow; this task does not change that.

Integration dependency: the GitHub CI workflow is in draft PR #1 and its repair stack #15/#17, not the current main baseline. This issue should not block their review or merge. Do not deploy or merge without owner-side bus scope reconciliation and independent review.
