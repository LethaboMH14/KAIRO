# Browser profile integrity

`parseProfile(raw)` remains the tolerant legacy helper for compatibility. Browser storage now uses `parseProfileStrict(raw)` through `readProfile()`: missing storage (`null`) means a new empty profile, while an empty string, malformed/unknown envelope, invalid record, duplicate lesson/case ID, over-cap nested history, or input over one million JS characters is rejected as a whole. No invalid row is filtered and no array is truncated by this read path. Errors do not echo stored profile text.

`writeProfile()` validates and projects the supported version-1 fields before making one `localStorage.setItem` call. Format must be a primitive supported string; boxed/coercible values are rejected. Lesson, case, attempt, and event arrays must be dense, so sparse JavaScript arrays cannot serialize into null holes. Unknown extra fields are dropped from the projection; documented lessons, cases, attempts and events are either all accepted or refused. Validation/serialization refusal makes no storage write. A browser quota/storage exception is allowed to propagate, leaving recovery to the calling screen. The progress recovery page catches strict read failures and continues to show its unreadable state; it does not reset or replace the stored value.

## Intentional legacy retention behavior

This strict read/write change does not alter `saveStudy` and `saveCase`: those helpers intentionally retain the latest 50 distinct lesson records and 20 case records. Existing `parseProfile` also remains tolerant and can omit invalid entries or truncate nested arrays when directly called. Do not present those helper-level retention caps as a recovery feature or claim this task changed them. Strict reads reject storage that would otherwise be silently shortened by the legacy parser.

## Checks

From the repository root:

```powershell
node --test studio/tests/profile-integrity.test.mjs
node --test studio/tests/practice.test.mjs studio/tests/pathways.test.mjs studio/tests/evidence-workspace.test.mjs studio/tests/progress-recovery.test.mjs studio/tests/profile-integrity.test.mjs
```

From `studio/`:

```powershell
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
```

The focused profile suite passes 9 tests; the combined profile + consumer/recovery suite passes 29 tests; scoped TypeScript exits 0. No full build or browser run was performed. PracticeStudio has a separate catch that falls back to an empty profile for its download; it is out of this claim and needs a separately scoped repair before strict read can be considered fully adopted by all export surfaces.
