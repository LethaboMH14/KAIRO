# Progress read and export recovery

The progress page now represents saved profile loading as `loading`, `ready`, or `unreadable` in `studio/src/profile/recovery.ts`. Until a read succeeds, it does not show recommendations, zero-count history, or an export action. On read failure, the page says the saved data was not reset or overwritten, offers a retry, and links back to My material. It performs no storage write or reset.

Portfolio export re-reads the current profile at click time. A read failure changes the page to its unreadable recovery state and produces no file content. A successfully prepared file only reports “Download requested. Check your browser downloads”; anchor activation is not treated as proof the browser saved a download. Profile/case records remain explicitly browser-local and self-reported. Retry counts are not described as observed help; the page separates first-try correctness from last-try correctness and leaves its unverified-practice limits visible.

## Verification

From `studio/`:

```powershell
node --test tests/progress-recovery.test.mjs
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
```

The focused helper suite passed 3 tests; scoped TypeScript exited 0. No full application build or browser run was performed. The root's frozen published preview predates this change; do not claim these edits are included until a later reviewed build.

## Remaining parser limitation

The existing `profile/model.ts` parser drops invalid individual rows while accepting a version-1 top-level profile. This task intentionally did not change that shared parser, so this page can distinguish thrown read/parse failures but cannot report rows the parser silently filtered out. A future parser-contract task should decide whether to surface rejected-row counts without rewriting source storage.
