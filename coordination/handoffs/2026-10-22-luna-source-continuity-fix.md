# Source workspace continuity fix handoff

Owner: `codex-luna-source-continuity-fix-20261022-a`
Task: `SOURCE-CONTINUITY-FIX-001`
Status: scoped implementation delivered for root review.

## Changed files

- `studio/src/workspace/SourceWorkspace.tsx` — unsaved-work warning, explicit discard prompt, latest source-load/review/upload/generation guards, stale lesson result/error suppression.
- `studio/src/source-continuity/guards.ts` — reusable request generation gate and unsaved-text boundary checks.
- `studio/tests/source-continuity.test.mjs` — five focused dirty-boundary and deferred-promise race tests.
- `docs/workstreams/source-continuity-fix.md` — behavior, constraints and scoped checks.

## Decisions and behavior

Source edits or a nonempty pasted draft now trigger `beforeunload`. Selecting another source asks before discarding dirty corrections or pasted work. Successful selection clears the old content; failed review/save preserves it. Editing source text invalidates in-flight lesson results and errors, while each lesson is still requested with the source's saved revision. Initial deep-link loading cannot commit after a newer user action. Upload and source review responses use the same latest-request guard, and unmount invalidates outstanding operations.

No server routes, source schemas, citations, model calls, private data, cloud behavior or other files were changed. The server-side revision validation remains the final source identity check.

## Verification and remaining work

- `node --test tests/source-continuity.test.mjs` — 5/5 passed.
- Scoped TypeScript check for `SourceWorkspace.tsx` and its imports — passed without diagnostics.
- No full build or browser verification was run. Root review and any interaction acceptance remain outstanding.
