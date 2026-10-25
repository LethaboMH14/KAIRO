# Service queue reconciliation simulation

## Purpose and limits

This is a framework-neutral, deterministic work simulation for practising small-queue data cleaning and requirement changes. `studio/src/worksim/model.ts` contains the authored brief, data dictionary, immutable nine-row fixture, state machine, checks, and export. There is no UI, network access, dependency, live AI call, or employer connection. “Simulated manager” messages are authored scenario text. Every organization, ticket, row ID, timestamp, and record is invented; the fixture is not bank, employer, or customer data and carries no employer endorsement.

Completion means the local run met this scenario's own rules. It does not verify employment competence, workplace performance, or accreditation.

## Learner brief and data dictionary

The learner acts as a service-operations analyst for fictional **Asterline Support Services**. First, prepare a shift-close current-state report. Inspect all source lines, keep the latest timestamped row for each ticket, exclude older duplicates, and quarantine any ticket with no timestamped row. Then report counts for unique tickets, resolved current states, reopened current states, unknown current states, duplicate source rows, and missing values on the one current row per ticket.

Each row has a synthetic `sourceRowId`, synthetic `ticketId`, `status` (`resolved` or `reopened`), a Johannesburg `updatedAt` timestamp (or `null`), a `resolutionCode` (or `null`), `customerVerified` (`true`, `false`, or `null`), and a fabricated source-line provenance label. `null` means missing or unknown; it must not be silently converted to a negative value. Repeated ticket IDs are candidate duplicates. The latest valid timestamp wins. A ticket with only undated rows remains one unique ticket in the report, with unknown state.

| Source row | Ticket | Status | Updated at (+02:00) | Resolution code | Customer verified |
| --- | --- | --- | --- | --- | --- |
| ROW-101 | TKT-210 | resolved | 10:05 | FIX | true |
| ROW-102 | TKT-210 | resolved | 10:10 | FIX | true |
| ROW-103 | TKT-211 | resolved | 10:30 | missing | true |
| ROW-104 | TKT-212 | resolved | 10:45 | RESET | unknown |
| ROW-105 | TKT-213 | resolved | 10:55 | FIX | true |
| ROW-106 | TKT-213 | reopened | 11:20 | FIX | false |
| ROW-107 | TKT-214 | resolved | 11:15 | FIX | true |
| ROW-108 | TKT-215 | resolved | missing | FIX | true |
| ROW-109 | TKT-216 | resolved | 10:50 | FIX | true |

Source provenance for each row is `fabricated queue export, line <sourceRowId suffix>`; all nine rows are embedded in the exported `scenario.records` fixture.

## Requirement change and accepted outcomes

After a correct v1 report, the authored **Simulated manager** message changes the task. The new report must choose the latest valid row per ticket first, then count only current rows that are resolved, customer-verified, have a nonblank resolution code, and were last updated strictly before **11:00 Johannesburg time**. This is a latest-row eligibility filter, not an as-of-11:00 snapshot and not an SLA-compliance result.

For v2, each unique ticket receives exactly one category with this visible precedence: unknown timestamp; reopened; at or after cutoff; unverified or unknown verification; missing resolution code; eligible. This makes the categories mutually exclusive. In particular, TKT-213 is reopened because its latest row is 11:20; the earlier 10:55 resolved row is a superseded duplicate. The changed requirement therefore requires a second cleaning submission and a separately revision-tagged report.

`acceptedOutcomes()` computes these results from the canonical fixture and published rules. They are not supplied to a transition as an answer key:

| V1 shift-close field | Accepted value | Meaning |
| --- | ---: | --- |
| `uniqueTickets` | 7 | Includes TKT-215, whose state is unknown because its only row is undated. |
| `resolvedCurrent` | 5 | Current latest row is resolved. |
| `reopenedCurrent` | 1 | Current latest row is reopened. |
| `unknownCurrent` | 1 | No timestamped row can establish the current state. |
| `duplicateRows` | 2 | Nine raw source rows minus seven distinct ticket IDs. |
| `missingResolutionCodes` | 1 | Missing on the current row for TKT-211. |
| `missingCustomerVerification` | 1 | Unknown on the current row for TKT-212. |
| `missingTimestamps` | 1 | The current row for TKT-215 has no timestamp. |

| V2 morning-cutoff field | Accepted value |
| --- | ---: |
| `eligibleResolved` | 2 |
| `excludedAfterCutoff` | 1 |
| `excludedUnverified` | 1 |
| `excludedMissingResolutionCode` | 1 |
| `reopened` | 1 |
| `unknownTimestamp` | 1 |
| `duplicateRows` | 2 |

The six v2 per-ticket categories sum to seven unique tickets; `duplicateRows` counts the two additional source lines separately.

## State and exported API

- `WORKSIM_VERSION` and `scenario` identify the rules, fixture, authored role messages, and rubric.
- `initialState(runId)` creates an isolated `WorkSimState`. The default assistance exposure is `unknown`.
- `WorkSimAction` is a discriminated union: `inspect-row`, `submit-cleaning`, `submit-report`, `set-assistance`, and `reflect`.
- `transition(state, action, at)` is pure. The caller supplies an ISO timestamp; invalid dates and out-of-order actions are rejected. Valid learner retries are appended with their computed correctness.
- `assess(state)` derives first-attempt/latest rubric status and a conservative assistance summary from the event history.
- `acceptedOutcomes()` computes the fixture's accepted report values for transparent documentation and review.
- `exportRun(unknown)` replays and validates a completed event history, then returns `WorkSimExport` or `null`. It includes attempts, reflection, assistance exposure, rubric, an explicit unverified status, and limitations.

The learner must inspect all nine rows, submit one disposition/reason for every source row in each revision, and supply all report fields as bounded nonnegative integers. Unsupported stages/revisions, missing or repeated row decisions, incomplete metrics, nonfinite values, and malformed timestamps cannot advance the run. A v1 answer cannot satisfy the v2 task. Invalid input is rejected; wrong but well-formed submissions remain in the event history as retries.

Assistance is recorded as `none`, `hint`, `worked-example`, or `unknown` on every event. Scored attempts retain the setting that was in effect when submitted, so a later `none` setting cannot erase earlier reported help or make prior unknown exposure appear independent. `assess` and the export summarize scored attempts conservatively: any unknown scored attempt keeps the overall exposure unknown, while separately retaining any reported hint or worked example. These are learner reports, not observations or proof of whether help was used. The export says `local self-directed simulation, unverified` and makes no employment-competence claim.

## Verification

Run the focused model tests from `studio/`:

```powershell
node --test tests/worksim.test.mjs
```

The tests cover fixture-derived accepted totals, duplicates and missing values, required inspection and stage order, revision-specific rework, malformed and nonfinite inputs, timestamp validation/order, retry preservation, assistance changes before and after scored work, replay validation, and truthful export boundaries. Root owns the full application build.
