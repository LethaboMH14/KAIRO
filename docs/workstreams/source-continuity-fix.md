# Source workspace continuity fixes

Status: implemented in the isolated source workspace; root review remains pending.

Repair update (2026-10-22): a goal edit now invalidates an in-flight lesson and clears the consumed lesson display. Source commits are built from a successful, current request only. Review-save keeps the separate paste/title draft exactly as entered; source changes consume only the captured draft if it is still byte-for-byte unchanged when the request succeeds. A newer draft typed during a pending request remains intact. Run error and busy finalizers also check operation identity, so an older completion cannot overwrite or clear a newer run's status. Catalog callbacks ignore unmounted state.

`SourceWorkspace` now warns before browser navigation while pasted title/text or edited source pages remain unsaved. Choosing different material prompts for explicit discard confirmation. Opening the pasted passage preserves the passage being submitted; switching away from dirty prior source corrections still asks first. Failed source saves do not replace the selected source or current text, so the dirty state remains visible.

Latest-request guards protect the initial `?source=` load, explicit source selection, upload polling, review saves and lesson generation. Any explicit selection or source edit invalidates older loads; edited text also invalidates pending lesson results and errors. A delayed result therefore cannot make a lesson generated from the saved revision appear current beside newer unsaved corrections. The server's source revision check is unchanged.

The new `studio/src/source-continuity/guards.ts` contains the latest-request gate, dirty-state checks and pure successful-source/goal-edit transitions. Deferred-promise tests cover selection ordering, source-edit invalidation, stale errors and goal-edit invalidation. Consumed-state tests cover review-save draft retention, exact captured-paste consumption, preservation of a newer draft, and refusal to commit stale/error results. Dirty-boundary tests cover clean, changed and pasted material.

Focused checks from `studio/`:

```powershell
node --test tests/source-continuity.test.mjs
npx tsc --noEmit --jsx react-jsx --target ES2022 --lib ES2022,DOM --module ESNext --moduleResolution Bundler --strict --skipLibCheck --allowImportingTsExtensions src/workspace/SourceWorkspace.tsx
```

No full aggregate build, browser acceptance, private data inspection or cloud request is included in this task.
