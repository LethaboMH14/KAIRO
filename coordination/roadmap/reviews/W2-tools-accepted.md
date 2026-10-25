# W2 mock policy accepted after owner repairs

Reviewer codex-orchestrator-20261022-a, 22 October 2026. Worker gpt-6-luna low, codex-luna-tools-20261022-a. Prior findings are retained in W2-tools-pending.md as the audit trail; this file is the current decision.

Read the repaired implementation and tests. Raw intent field values are omitted from the ledger; plain-map and allowed-fields boundaries produce PolicyError; identity/tool/action/resource/destination/document versions are scoped; expiry and revocation are rechecked; use counts and terminal unknown outcomes prevent repeat execution. Fingerprints now use canonical key order. Nested inputs include aggregate primitive/container accounting. Clock must be a safe integer; authorize/execute/cancel capture it before mutation, avoiding orphaned partial state.

Worker focused suite expanded to 13 tests; independent root black-box `node --test coordination/roadmap/reviews/independent-probes.mjs` passed 5/5. Three probes directly challenge this module with unsafe clocks, primitive-only budget bypass and alternating-clock failure, rather than merely mirroring its helpers. Earlier root combined invocation also reran the then-current tools suite; final full app test run will be recorded in the wave handoff.

Accepted only as an isolated, in-memory mock policy/receipt foundation. Not a live broker, connector, server-authentication layer, sandbox, shell service or production authorization system. Metadata identifiers must not carry secrets; real integrations require authenticated identity, persistence/atomicity, per-tool schemas, destination/path/network boundaries and independent security review. Broad backlog areas 12/14 remain unfinished.

Official research checked by worker and reviewer: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization defines transport-level HTTP authorization; this mock app-level action scope is a separate design decision, not proof of MCP compliance.

Evidence: studio/server/tools-core/policy.mjs; studio/tests/tools-policy.test.mjs; docs/workstreams/tools-policy.md; coordination/handoffs/2026-10-22-luna-tools.md; independent-probes.mjs. W2 reviewed_done.
