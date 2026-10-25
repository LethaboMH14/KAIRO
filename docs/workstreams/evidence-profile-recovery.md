# Evidence workspace profile-read recovery

The saved-practice panel now distinguishes loading, a successfully read profile, an unreadable profile, and a failure while preparing artifacts. “No saved practice yet” is shown only when the profile read succeeded and replay produced no artifacts. A strict profile read failure instead explains that records were not reset or overwritten and offers a read-only retry.

The retry rereads the browser profile; it does not reset, repair, or write storage. The separate fictional service simulation remains available, and the existing portfolio export still refuses to prepare a file if its strict profile read fails.

## Checks

```powershell
node --test studio/tests/evidence-profile-read-state.test.mjs
```

From `studio/`:

```powershell
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
```

The focused read-state suite passed 3/3; scoped TypeScript exited 0. No full build or browser run was performed.
