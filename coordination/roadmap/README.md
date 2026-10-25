# KAIRO execution ledger

Owner/reviewer: codex-orchestrator-20261022-a. Started 22 October 2026 at the user's request. The user requested five Luna 6/light workers and optional Claude Haiku 5.5/low + Sonnet 5.5/low implementation with Opus review.

## Capacity and truthfulness

This runtime exposes four total concurrent slots including the root reviewer, so at most three Luna workers run at once. Five distinct workers are dispatched in dependency-aware waves, not represented as five simultaneous sessions. Requested Luna is mapped to gpt-6-luna with low effort, explicitly supported by the local agent tool. Every worker self-registers its actual model/effort and claims its own scopes.

The local bus is pull-based and cannot launch Claude. CLAUDE-DELEGATION.md is a queued handoff, not proof that Haiku/Sonnet agents ran. Only their own registrations, work, checks and Opus review can establish that. Existing active claims must not be overridden.

## Completion rules

- backlog.json is the complete 15-area item list; BACKLOG.md is its readable rendering.
- An unchecked item is unfinished even when a related prototype exists. Partial foundations are recorded separately.
- Work packages are narrower than backlog outcomes. A checked work package does not automatically complete its parent outcome.
- A worker submits a plan, local code findings, necessary primary-source research, interface, scope, risks and acceptance checks before implementation. Root reviews the plan and final diff/code/tests.
- Completion needs inspected files, actual meaningful checks, evidence paths and reviewer decision. A worker's self-report or a passing mirrored test is insufficient.
- Research facts carry primary URL/check date, applicability and limits; existing code facts use inspected local paths. No gratuitous browsing for a pure code transformation.
- Downloads/licences and installation changes require explicit provenance and authorised scope. No root manifest, new paid service, credential access or external submission by these workers.
- A browser URL policy block is not bypassed by another browser surface, raw CDP or indirect UI execution. Browser acceptance can remain pending while bounded non-UI foundations are reviewed.
- Open requirements remain open across turns. No watcher, recurring automation or perpetual model invocation has been configured.

## First five work packages

| Package | Worker/task | Deliverable | Main areas | Dependencies |
|---|---|---|---|---|
| W1 | Luna evidence / LUNA-EVIDENCE-001 | Replay-derived local practice artifacts, honest rubric/export and boundary checks | 7, 9, 10 | Existing shop/profile record contract |
| W2 | Luna tools_policy / LUNA-TOOLS-001 | Fail-closed mock grant/intent/receipt policy with revocation/idempotency | 12, 14 | Primary MCP research; no real execution |
| W3 | Luna adaptive / LUNA-ADAPTIVE-001 | Transparent versioned practice-event policy and authored evaluation cases | 3, 4, 15 | Primary learning guidance; deterministic clock |
| W4 | Luna worksim / LUNA-WORKSIM-001 | A substantive synthetic business-data work scenario and deterministic assessment | 8, 13 | Root-approved scenario/data/rubric contract |
| W5 | Luna integration / LUNA-EVIDENCE-UI-001 | Learner-facing evidence/work interface using reviewed modules | 7, 8, 9 | W1 and W4 interface approval; router ownership |

Not all 15 areas can be completed by this first batch. Claude continues the character work (1, 2, 5, 6); separate proposed bounded research/design tasks cover video, opportunity sources, export and domain-review preparation. Cloud deployment, recognised qualifications, SASL accuracy and validated learning/employment outcomes require their own implementation and evidence.

See wave-status.json for actual worker/review state, reviews/ for findings, and CLAUDE-DELEGATION.md for the queued Claude plan.
