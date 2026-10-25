# Luna work simulation handoff

**Worker:** `codex-luna-worksim-20261022-a`  
**Client/model/effort:** Codex / gpt-6-luna / low  
**Task:** `LUNA-WORKSIM-001`  
**State:** implementation delivered for independent root review; no learner UI integration claimed.

## Scope and files

- `studio/src/worksim/model.ts` — pure TypeScript scenario, immutable synthetic fixture, data dictionary, v1/v2 rules, state transitions, fixture-derived assessment, event replay, and export.
- `studio/tests/worksim.test.mjs` — focused deterministic behavior and boundary tests.
- `docs/workstreams/worksim.md` — learner brief, fixture, dictionary, role/change text, accepted outcomes, integration API, rubric and limitations.
- `coordination/handoffs/2026-10-22-luna-worksim.md` — this handoff.

No router, UI, profile, package, manifest, lockfile, server, or external service was changed. The authored manager dialogue is labeled simulated; it is not a live AI teammate.

## Scenario and decisions

The fictional Asterline Support Services queue has nine source lines and seven ticket IDs. It contains two superseded duplicate rows, one ticket without a timestamp, one current ticket with a missing resolution code, and one with unknown customer verification. All records and identifiers are invented and provenance-tagged.

The first task cleans latest current rows and reports current state and missing values. After a correct report, a simulated manager changes the rule: choose the latest valid row per ticket first, then apply a strict 11:00 Johannesburg last-update cutoff, verification, and resolution-code requirements. This is explicitly not a historical as-of report or SLA-compliance result. V2 uses public mutually exclusive precedence. The model computes expected report values from the private frozen fixture; callers cannot pass an answer key.

The learner must inspect all rows, submit per-row disposition/reason decisions and complete metric objects for both revisions, and add a reflection. V2 requires fresh revision-tagged cleaning and reporting submissions. Wrong but well-formed attempts remain in history. Assistance starts as `unknown`; every event retains the setting reported at that time. Assessment/export derive a conservative summary from scored attempts, preserve any reported hint or worked example, and keep the overall exposure unknown if any scored attempt was unknown. This is learner-reported exposure, not independent observation.

## Interface for integration

`studio/src/worksim/model.ts` exports `scenario`, `WORKSIM_VERSION`, `WORKSIM_STATUS`, `initialState(runId)`, `transition(state, action, atISO)`, `assess(state)`, `acceptedOutcomes()`, and `exportRun(input)`.

`WorkSimAction` variants:

- `inspect-row { sourceRowId }`
- `submit-cleaning { revision: 'shift-close-v1' | 'morning-cutoff-v2', decisions: RowDecision[] }`
- `submit-report { revision, values: ReportValues }`
- `set-assistance { exposure }`
- `reflect { value }`

The exported `WorkSimState` exposes phase, inspected row IDs, full events, current assistance exposure, reflection, completion time, and feedback. Each event stores the learner-reported assistance setting at that point. `assess` and `WorkSimExport` include an aggregate from scored attempts: any unknown attempt keeps the summary unknown, and reported hint/worked-example use remains separately listed even after later setting changes. These are reports, not independently observed facts. Timestamps are supplied by the caller, strict ISO/calendar parsed, finite, and nondecreasing. `exportRun` replays a completed history and returns a stable `WorkSimExport` or `null`.

## Verification evidence

From `studio/`, `node --test tests/worksim.test.mjs` passed **7/7 tests**. Coverage includes computed canonical totals, duplicates/missing values, inspection and stage ordering, revision-specific rework, invalid and nonfinite report input, malformed/out-of-order timestamps, retry preservation, assistance changes before and after scored work, actual enum-type validation, replay rejection, and honest export boundaries.

The isolated model TypeScript check passed with:

```powershell
.\node_modules\.bin\tsc --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --strict --skipLibCheck src/worksim/model.ts
```

The accepted outcomes are documented in `docs/workstreams/worksim.md`: v1 `{uniqueTickets:7,resolvedCurrent:5,reopenedCurrent:1,unknownCurrent:1,duplicateRows:2,missingResolutionCodes:1,missingCustomerVerification:1,missingTimestamps:1}`; v2 `{eligibleResolved:2,excludedAfterCutoff:1,excludedUnverified:1,excludedMissingResolutionCode:1,reopened:1,unknownTimestamp:1,duplicateRows:2}`. Unique ticket count includes the quarantined unknown-state ticket; duplicate count is nine raw rows minus seven distinct ticket IDs.

## Limits and next step

No browser integration or full studio build was run; root owns those checks. The scenario assesses compliance with authored deterministic rules, not independent skill or employment competence. Local history and timestamps are editable. Assistance may remain unknown. Review the module and this handoff before UI integration; do not treat a successful model run as a verified work credential.
