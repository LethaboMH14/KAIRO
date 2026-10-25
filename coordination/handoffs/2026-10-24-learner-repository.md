# Worker A handoff: durable learner repository

- Session: `codex-cloud-repository-20261024-a` (Codex, GPT-6, effort unavailable/registered `unknown`).
- Task: `CLOUD-REPO-001`; exact claimed scopes: `studio/server/learner-repository/`, `studio/tests/learner-repository.test.mjs`, `docs/learner-repository-20261024/`, and this handoff.
- Judging criteria: Product (learner can return to owned work) and Sustainability (repeatable durable data boundary). Need: a learner's source, lesson, draft, import job and progress records must persist privately and be resumable. Acceptance evidence: actual repository module exercised through injected bounded adapters, including cross-owner isolation, CAS, bounds and blob integrity.

Implemented `createLearnerRepository({firestore,bucket})` in `studio/server/learner-repository/index.mjs`. Public methods are `get(uid,kind,id)`, `list(uid,kind,{limit=100})`, `put(uid,kind,id,value,{version,create=false})`, `remove(uid,kind,id,{version})`, `putBlob(uid,id,bytes,{contentType})`, `getBlob(uid,id)`, and `removeBlob(uid,id)`. Records use owner-keyed Firestore paths, repeat and validate the owner/kind/ID envelope, and use transactional random UUID versions. Original objects use owner-keyed paths, generation-match-zero writes and SHA-256/length verification. No SDK initialization, credentials, environment reads, signed URLs, network calls, or deployment were added.

Changed files:

- `studio/server/learner-repository/index.mjs`
- `studio/tests/learner-repository.test.mjs`
- `docs/learner-repository-20261024/README.md`
- `coordination/handoffs/2026-10-24-learner-repository.md`

Review correction: authenticated UIDs now enforce the contract's 1–128 character limit, reject U+0000–U+001F and U+007F, and are hashed exactly as supplied after a nonblank check. Record values must be plain JSON objects; nulls, arrays, scalars and non-plain objects are rejected. Focused negative cases cover these boundaries, including proving that a valid whitespace-padded UID is not rewritten.

Checks: `node --test studio/tests/learner-repository.test.mjs` passed 3/3 on Node (actual module; deterministic in-memory adapters and synthetic payloads). No cloud or browser test was run.

Limits and next step: root owns `firebase-admin` installation, routes, authentication and hosted integration. Root should review the Firestore/Storage adapter compatibility against the installed Admin SDK, then run two synthetic authenticated identities through real test-project Firestore/Storage and verify full restore/resume wiring. Separate calls are not a multi-record transaction. This evidence does not establish live cloud correctness, browser/device acceptance, deployment, or release readiness.
