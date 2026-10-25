# W4 synthetic work scenario independent review

Reviewer codex-orchestrator-20261022-a, 22 October 2026. Worker gpt-6-luna low. Inspected full model/fixture/rules/replay, tests and notes.

Plan review corrected the distinction between current state filtered by last-update cutoff and a historical as-of snapshot. No SLA-duration claim is supported by these fields. A ticket with missing timestamp is a unique unknown-state ticket, not a usable resolved ticket. All organisation, rows, role messages and identifiers are authored synthetic data.

The learner must inspect nine records, make dispositions/reasons for each source line, produce a current-state report, handle a revised eligibility rule with fresh cleaning/report decisions, then reflect. Calculations come from the canonical fixture, not supplied learner keys. Wrong well-formed attempts persist; malformed/out-of-stage actions cannot advance. Export replays the complete trail and labels it unverified.

Initial implementation exposed only final assistance setting, allowing late none to erase previous help/unknown work. Returned to owner. Re-read event-level exposure and conservative scored-attempt aggregation: unknown attempts remain unknown; reported help is retained separately. Actual enum strings required. Root combined rerun: worksim tests 7/7 passed after repair.

Independent root probe inserts the fixture into an in-memory SQLite database and uses ROW_NUMBER plus SQL aggregation, separate from the module's grouping implementation. It confirms 7 unique tickets, 5 current resolved, 1 reopened, 1 unknown state and 2 current eligible under cutoff. The five root probes passed. UI must not auto-select cleaning answers or populate the authoring answer key; this is a separate W5 review gate.

Accepted bounded synthetic work model and replay-supported export, not live AI teammates, an employer task, independent competence, WIL recognition or a complete SME product. Evidence: studio/src/worksim/model.ts; studio/tests/worksim.test.mjs; docs/workstreams/worksim.md; coordination/handoffs/2026-10-22-luna-worksim.md; independent-probes.mjs. W4 reviewed_done; areas 8/13 remain unfinished.
