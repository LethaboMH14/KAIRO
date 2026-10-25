# W2 independent review findings

Reviewer codex-orchestrator-20261022-a, 22 October 2026. Worker gpt-6-luna low. This is mock policy only; no execution service or sandbox was authorised or delivered.

Initial inspected findings: credential-name regex omitted nested/non-string secrets; malformed allowedFields could throw raw TypeError before validation; map inputs accepted non-map values; invalid clock could fail open; idempotency used key-order-sensitive JSON text. Missing explicit execute-time expiry and one-use exhaustion regression tests.

Owner repaired payload retention (all raw field values now omitted), map validation, finite clock validation and expiry/use-count tests. Independent read confirmed these repairs; targeted suite expanded from 7 to 10 tests. Acceptance still withheld because request fingerprint remained JSON.stringify rather than canonical serialization, aggregate nested input bounds were absent, and time was validated after some state changes.

Returned for a final bounded owner repair: canonical fingerprints with key-order test; aggregate node/byte limits; safe integer clock captured before mutations with atomic failure test. Root did not edit the implementation. Reviewer acceptance and final test result will be recorded separately. Broad backlog items 12/14 remain open regardless of mock acceptance.
