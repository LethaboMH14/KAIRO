# Issue #49 — SQL JOIN trace studio worker handoff, 25 October 2026

- Session: `gpt6-kairo-sql-joins-20261025-1005-d`; client ChatGPT; model GPT-6; effort unknown.
- Base main commit: `0fabfdf9b8515cab8ff4100228a6a1df672491c6`.
- Branch: `worker/issue-49-sql-join-trace-20261025-d`.
- Cooperative GitHub claim: issue #49 comment `6395209583`. **No access to the owner's canonical local SQLite bus; no local registration/claim or claim reconciliation performed.**
- File ownership: new `studio/src/studio-scenarios/sql-join-trace/**`, new `studio/tests/sql-join-trace.test.mjs`, this unique handoff. No changes to main, shared StudioRouter/lesson/progress schemas, styles, dependencies/lockfiles, other studios or existing PRs.

## Why this slice

The pump what-if task already has a draft implementation in PR #55, HTTP trace in #57, binary search in #58. The separate Kaggle evaluation is claimed in #56 and its PR #53 foundation remains unmerged. This SQL join activity is a disjoint Computer Science Studio learning scenario. Learners can predict how INNER and LEFT JOIN produce rows, distinguish unmatched left records and NULL, inspect every left-side match, then record two distinct local attempts.

**Judging relevance:** Product — an actual runnable interaction; Intelligence — explainable deterministic relational consequence, not generic AI output; Usability — native text, tables, labels and keyboard input without 3D. **Learner need:** understand join cardinality and NULL equality without installing a database or relying on sight/motion.

## Exact behaviour

- Prepared three synthetic small relational datasets: duplicate matching right keys, empty right table, and NULL keys on both sides. Nothing is sourced from learner material.
- Pure `traceJoin` simulates the equality `ON left.key = right.key` predicate, with correct SQL NULL non-matching and INNER/LEFT unmatched semantics. Trace rows have a fixed pedagogical order; SQL engines do not guarantee ordering without ORDER BY.
- React reading/keyboard-first component exposes both tables, a prediction of output row count and unmatched left rows, step-by-step trace, comparison and two distinct local-only attempts with a session identifier, timestamp, source kind/revision and explicit `local-unverified` evidence label.
- Standalone Vite preview: `studio/src/studio-scenarios/sql-join-trace/preview.html`. No shared route integration or account persistence.
- Prepared official PostgreSQL reference: https://www.postgresql.org/docs/current/queries-table-expressions.html . The `current` docs URL is not an immutable snapshot; later release should pin a reviewed edition and source/revision contract. The model is an illustrative subset, not a SQL parser or database.

## Verification

- New focused test file covers six join cardinalities, duplicate pairs, NULL equality, empty right table, invalid/forged scenario, bounded predictions, two distinct local attempts, provenance, timestamp/replay, snapshot copying, SSR semantic accessibility markup, and isolated preview structure.
- **At writing:** GitHub Node 24 exact-head CI and production build NOT YET RUN; local Node 22 environment cannot clone GitHub due DNS and does not contain esbuild/studio dependencies. Do not report test counts or success until actual GitHub Actions completes on the latest PR head. No browser/phone/screen-reader test or expert review was performed.
- Synthetic fixture results and SSR checks do not establish real learner improvement or production account security.

## Independent review and next work

1. Check exact-head Node24 full serial suite/build and Python coordination CI; fix any failures. Independent database educator should verify duplicate/NULL/cardinality explanations; UX reviewer should test keyboard, screen-reader, zoom, narrow phone and focus/error announcements in authorised preview.
2. Coordinator/local owner must check canonical bus conflicts and current PR #34 merge policy before any acceptance. Integration into source/revision-bound, authenticated learner progress must be a separate owner-approved adapter contract with #46/#47 and StudioRouter owner. Do not pretend local-only attempts are saved evidence.
3. Next ready review slice: independently evaluate #55 pump, #57 HTTP and #58 binary search under domain/UX gates. Separate future implementation: reviewed source→studio→owner-scoped attempt contract, not a direct shared-router edit in this lane.
4. No cloud spend, Kaggle hosted training, public deployment, IAM change, credentials or user uploads used.
