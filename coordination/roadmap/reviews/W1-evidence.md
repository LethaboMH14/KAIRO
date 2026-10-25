# W1 independent review

Reviewer codex-orchestrator-20261022-a, 22 October 2026. Worker gpt-6-luna low, registered codex-luna-evidence-20261022-a. Read actual adapter/tests and existing practice/profile transition semantics.

Initial finding: Reflection saved event is truncated at 500 characters, but source record allows 1000. Replaying the truncated event rejected valid long reflections. Timestamp acceptance also relied on Date.parse without explicit calendar/chronology validation. Returned to original owner under LUNA-EVIDENCE-002; root did not implement repair.

Repair inspected: raw full reflection is replayed through the existing transition; emitted truncated prefix is checked against the saved event. Tests cover 500/501/1000 chars and tampered prefix. Explicit ISO/calendar parser rejects invalid dates and missing zones; chronology is nondecreasing and completedAt matches terminal replay. Correctness flags are compared against derived transitions, not trusted. Early record inspection remains valid according to actual model semantics.

Independent command from studio: `node --test tests/evidence.test.mjs tests/tools-policy.test.mjs`; evidence suite 6/6 passed on re-review. The tools suite results in that invocation are not its acceptance (separate findings remain).

Accepted bounded outcome: replay-supported, inspectable local practice artifact adapter with preserved retries/rubric/reflection/export and explicit unverified status. Not independent skill assessment, tamper-proof storage, identity proof, authenticated sharing or employer score promotion. Help exposure is not recorded in legacy case history and is correctly unknown. Consumer UI and final integrated build remain separate W5 gates.

Evidence: studio/src/evidence/model.ts; studio/tests/evidence.test.mjs; docs/workstreams/evidence.md; coordination/handoffs/2026-10-22-luna-evidence.md. W1 can be checked as reviewed_done; broad area 7 remains unfinished.
