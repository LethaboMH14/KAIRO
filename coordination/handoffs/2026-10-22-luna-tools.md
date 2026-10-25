# LUNA-TOOLS-001 handoff

Date: 22 October 2026  
Owner: `codex-luna-tools-20261022-a` (Codex, gpt-6-luna, low)

Implemented an isolated mock capability-policy demonstrator. Follow-up LUNA-TOOLS-002 fixed independent review findings and added a canonical fingerprint, aggregate nested input budget, and pre-mutation safe-clock checks:

- `studio/server/tools-core/policy.mjs` exports `createPolicyEngine` and stable `PolicyError` codes. Requests are inert previews; explicit authorization creates a queued ticket; execute writes only a mock outcome/receipt. It never invokes commands, network, files, MCP, or an injected function.
- Grants bind user/tool/action/destination/resource/allowed fields/document versions/expiry/revocation/use count. Execute revalidates the live grant so revocation or expiry invalidates queued tickets. Read, execute, upload, publish, and submit are distinct action names.
- Idempotency binds user plus key and an exact intent fingerprint. Duplicate unchanged requests reuse their request/ticket. Changed intent fails. `outcome_unknown` is terminal. Cancellation applies only while queued.
- Inputs, maps, and ledger are bounded; aggregate byte accounting includes primitive values and object/array structure. The ledger omits all raw intent field values (including nested and non-string values), and stable errors contain no values. Plain-object validation and safe-integer clock checks fail closed before state mutation. Authorization and execution use one validated timestamp for the expiry check and resulting ledger entry.
- `studio/tests/tools-policy.test.mjs` covers expired-at-execution grants, one-use exhaustion, malformed maps, nested/non-string secret omission, reordered-key idempotency, aggregate input bounds including primitive arrays, invalid-clock state preservation, alternating-clock consistency, scope expansion, unknown outcome, user mismatch, cancellation, and action separation.
- `docs/workstreams/tools-policy.md` defines the API, limits, MCP OAuth transport versus app consent boundary, and official primary sources checked 22 October 2026.

Validation: `node --test tests/tools-policy.test.mjs` from `studio/` — 13 passed, 0 failed. No root server, package manifest, credential, frontend, or character files were changed. No deployment/integration is included.

Independent review needed: validate contract/code against the user's intended confirmation UI and future persistent identity. This in-memory demonstration is not production authorization, a sandbox, or an actual connector. General tools/terminal work remains incomplete.
