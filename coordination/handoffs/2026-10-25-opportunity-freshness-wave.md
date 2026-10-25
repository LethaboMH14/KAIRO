# Handoff: Package C opportunity freshness inspector

**Owner:** `codex-opportunity-freshness-20261025-c` · Codex · exposed model `gpt-6`, effort `unknown`
**Task:** `OPPORTUNITY-FRESHNESS-20261025-C`
**Branch:** `codex/opportunity-freshness-20261025-c` (isolated worktree from `a2dfc4f10499bcd32ac45548fc6767094b26c8d2`)
**Criteria:** Product, Impact, Sustainability, Intelligence. Need: help learners avoid stale/unverified listings. Acceptance: pure deterministic classification, actual behavior tests, safe URL return, no role matching/fetching/eligibility claim.

## Ownership check

Canonical bus registration was created under my unique ID; exact Package C paths were claimed before edits. Current inbox was checked through message 141. GitHub issue #6 is an open owner-scoped role-requirements task. Its comments and PR #30 reserve only `studio/server/role-evidence/index.mjs`, `studio/src/role-evidence/RoleEvidence.tsx`, `studio/tests/role-evidence.test.mjs`, and its own handoff. PR #30 is an existing draft. None overlaps this package's exact paths. Existing `studio/server/opportunities/index.mjs` owns live curation and programme filtering; no edits were made there.

## Changed files

- `studio/server/opportunity-freshness/index.mjs` — pure `inspectOpportunity(record,{now,maxAgeDays})` implementation.
- `studio/tests/opportunity-freshness-wave.test.mjs` — Node built-in behavior tests using clearly synthetic records.
- `docs/opportunity-freshness-wave-20261025/README.md` — policy, test command, boundary, and downstream interface reconciliation notes.
- This handoff.

No router/provider/profile/matching implementation, manifests, seeded opportunity records, or existing tests changed.

## Decisions and behavior

The utility accepts only canonical UTC millisecond timestamps. A closing instant at or before `now` is expired; the exact age limit remains fresh, and a future `checkedAt` is invalid. Missing closing time/source attribution/requirements needs re-check. Malformed fields and unsafe URLs fail closed; an invalid URL is returned as `null`. `current` means recent complete metadata only; provider availability, factual verification and learner eligibility remain separate. Default age is seven days, maximum 365.

The current curation module accepts date-only and offset dates, uses its own seven-day stale rule, and sets status as open/closed/unknown; this pure utility must not be integrated by blind schema/status replacement. Opportunity owner should reconcile mapping and semantics under a separately claimed change.

## Checks and publication

Run from `studio/` (Node `v24.18.0`):

```powershell
node --test tests/opportunity-freshness-wave.test.mjs
```

Results: `node --check server/opportunity-freshness/index.mjs` exited 0; focused Node suite **12/12 passed, 0 failed**. The first test invocation used paths prefixed with `studio/` while already in `studio/` and could not locate the files; the corrected command above passed. No other suite or build was run.

`git diff --cached --check` passed before the first commit. Only the four claimed paths were staged and committed as `f362449793cc0c2322774d0574fbc5970d96816a`; the isolated branch was pushed. Draft PR [#74](https://github.com/LethaboMH14/KAIRO/pull/74) targets `main@a2dfc4f10499bcd32ac45548fc6767094b26c8d2` and is attached to this task. Its initial published head was `f362449793cc0c2322774d0574fbc5970d96816a`; this handoff-only accuracy update is part of the same PR branch.

## Limits / next steps

No official vacancy was checked. No fetch/scrape/application, browser, headless browser, cloud/model call, install, live learner data, deployment, or automated refresh was used. Tests do not establish human/device clarity, provider truth, accessibility, eligibility, role relevance or hiring outcomes. Root independently reviews; opportunity owner decides any integration after schema and source-verification reconciliation.
