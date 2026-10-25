# Source-to-lesson continuity audit handoff

Owner: `codex-luna-lesson-continuity-audit-20261022-a`
Task: `LESSON-SOURCE-CONTINUITY-AUDIT-001`
Status: source-only audit complete; no runtime changes.

## Findings

1. `SourceWorkspace.tsx:10-11,26,32,36` keeps unsaved pasted content and edited page text in component state without a navigation warning. Recommend a `beforeunload` prompt for nonempty unsaved paste or dirty source text, cleared only after successful save/selection.
2. `SourceWorkspace.tsx:36-37` allows source edits while generation is pending. The response unconditionally sets the created lesson, even if those edits made the displayed source dirty. The API correctly ties output to the saved revision, but the card can look current. Recommend invalidating/suppressing stale generation results or disabling source editing while the request runs.
3. `SourceWorkspace.tsx:15-17` loads a query-string source asynchronously and commits it through `select` without checking whether the learner selected another source in the meantime. Recommend cancel/generation guarding the deep-link result after explicit selection.

The audit also found the existing saved-revision check, evidence-bound citation validation, revision-keyed passage annotations, and local lesson-note restoration/export paths consistent at source level. Details and paths are in `docs/workstreams/lesson-source-continuity-audit.md`.

## Limits and next step

No private course data was opened. No network requests, model calls, runtime edits, tests, build or browser checks were performed. Root can choose whether to address the three bounded findings in separately claimed runtime scopes; no implementation is claimed here.
