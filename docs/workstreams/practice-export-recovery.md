# Practice portfolio export recovery

The shop practice screen now prepares an aggregate portfolio only after `readProfile()` succeeds. A strict profile read error returns an unreadable state: the download is not prepared, the page does not substitute an empty profile, and it links to My progress so the learner can retry. The current run stays in React state; the export adapter reads saved history and adds the current run only in memory. It does not write or repair browser storage. For export projection, a matching run ID replaces its saved entry; a new run is appended without applying `saveCase()`'s 20-case retention cap. Thus a full saved history remains visible alongside a new current run in the exported copy.

If preparation succeeds and the browser anchor click is requested, the UI says “Download requested. Check your browser downloads.” It does not claim the browser completed a download. A profile read failure is explained separately from a download request. Saving a practice action can also fail; the screen now says the current run remains open and points learners to check My progress, rather than implying export will bypass unreadable history.

The portfolio remains browser-local, self-directed, editable practice. This repair does not establish independent assessment, accreditation, secure authorship, or successful file receipt.

## Checks

```powershell
node --test studio/tests/practice-export-recovery.test.mjs
```

From `studio/`:

```powershell
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
```

The focused adapter suite passes 4/4, including a full 20-case saved history plus a new run and replacement of a matching run ID; scoped TypeScript exits 0. No full build or browser run was performed; root owns aggregate checks.
