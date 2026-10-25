# Luna repair handoff: CV draft input validation

- **Task:** `LUNA-CV-DRAFT-ROBUSTNESS-001`
- **Owner/session:** `codex-luna-cv-draft-20261022-d`
- **Model/effort:** `gpt-6-luna` / `low`
- **Scope:** `studio/src/cv-draft`, `studio/tests/cv-draft.test.mjs`, `docs/workstreams/cv-draft.md`, this handoff.

## Repair

Fact and target-requirement arrays now require dense plain arrays with only numeric own entries. Sparse entries, accessors, extra properties and over-counted collections are rejected before item iteration. Root/fact/target objects must use enumerable data properties, and unknown keys remain rejected.

The reducer validates per-field limits and maps accepted caller data into fresh known-shape objects before measuring aggregate UTF-8 input size. It no longer stringifies unvalidated input, so a nested caller-defined `toJSON` is not invoked. The assembled output size limit remains enforced.

## Verification

- `node --test tests/cv-draft.test.mjs` — 9/9 pass, including sparse fact/requirement arrays, over-counted arrays containing `toJSON` hooks, aggregate input limit and aggregate output limit.
- `npx tsc --noEmit --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler --allowImportingTsExtensions src/cv-draft/model.ts` — pass.

## Remaining

No app route/build/browser verification was in scope. The foundation remains unintegrated pending parent review.
