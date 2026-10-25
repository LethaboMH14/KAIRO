# KAIRO offline agent-runner proof of concept — Issue #13

**Not a deployed service or an actual coding-worker adapter.** This folder holds a dependency-free Node ES module with an authenticated event ledger and a *simulation-only* dispatcher. It does not start chat tabs, execute a process, open a network socket, call GitHub or invoke a model. No paid service, IAM permission, repository push token or real learner data is used.

## Focused test

From the repository root, with Node 24 (target runtime):

```sh
node --test --test-concurrency=1 tools/agent-runner/runner.test.mjs
```

The authoring runner initially verified the tests on Node 22.16.0 because Node 24, `studio/`, npm dependencies and internet cloning were unavailable in that execution environment. This is **not** a replacement for required fresh Node 24 `cd studio && npm ci && node --test --test-concurrency=1 tests/*.test.mjs && npm run build` or CI. Do not infer that main or other PR CI is green.

## Contract

- `new OfflineRunner({ directory, secret, allowedRepo, maxConcurrent, maxAttempts, maxDispatches, maxUnits, backoffMs, maxDeliveries, clock })`: caller supplies the webhook secret out of band. Do **not** use a shared production secret in tests. `directory` must be a dedicated local path outside Git.
- `ingest({ headers, rawBody })`: accepts **Buffer bytes as delivered by GitHub**, not re-serialized JSON. Require a single `X-Hub-Signature-256: sha256=<64 hex>`, a valid UUID delivery ID, an exact repository allowlist, maximum 256 KiB body and authenticated SHA-256 HMAC before decoding. Duplicate same-event deliveries return `duplicate`; reused IDs with changed bytes or event names fail closed. Only `issues` events with the `agent-ready` label create a queued task. An issue close blocks a queued/claimed/running task. Bot events and all issue comments are ignored, preventing a self-comment feedback loop.
- `claim({ taskId, owner, branch, scopes })`: human/trusted-coordinator-issued ownership data. It is **not extracted from an untrusted issue body**. The ledger rejects already owned tasks, overlapping subtree claims or duplicate branches. Active review/blocked work keeps its reservation.
- `dispatchSimulation({ units })`: moves one eligible claim to `running`, enforces in-flight, lifetime dispatch and *simulation unit* caps, and returns an attempt-bound receipt. **No worker is called.** The units are not a provider invoice or budget guard for any real provider.
- `reportSimulation({ taskId, owner, dispatchId, result })`: accepts `succeeded`, `retryable_failure` or `fatal_failure`, authenticated by matching the current local owner and opaque attempt receipt. Retry waits bounded exponential time. After `maxAttempts`, enter `dead_letter` for explicit review. A successful report moves to `review`, which is **not merge approval**.
- `pull_request` opened/ready-for-review from the same repository and matching claimed branch can move to `review` and bind the first PR number, but does not dispatch a job. A conflicting PR association fails closed.
- `block({ taskId, owner, reason })`: current worker explicitly marks claimed/running work blocked.
- `snapshot()`: reads locally persisted `ledger.json`, preserving delivery fingerprints and task states across process restart. Raw payload bodies, secret and learner data are never written.

Durability uses a local atomic `mkdir` lock, fsynced replacement of `ledger.json`, and fsync of its parent directory where supported. Simultaneous local callers serialize. If the process crashes leaving `.ledger.lock`, it **stays locked**: investigate process ownership, data integrity and journal before an operator removes it. Never auto-steal a possibly live lock. Do not store this JSON under the canonical `coordination/bus.sqlite3` directory or treat it as that bus.

## Deliberate gaps

This offline reference is **single-directory/single-host**. It does not use a transactional cloud database, ACK GitHub HTTP requests, validate the GitHub actor's current repository permissions, fetch PR/issue metadata from GitHub, attest a worker's identity, enforce actual container resource usage, cancel a real worker, write GitHub comments, or reconcile local SQLite claims. The operator must check actual issue ownership on GitHub and any canonical local bus before assigning work. Signed payloads confirm delivery authenticity, **not that a labeling actor was authorized for real autonomous dispatch**. Never blindly execute instructions from an issue, PR, or model output.

## Separate permission-gated deployment proposal (NOT implemented)

1. Owner approves one repo-scoped GitHub App/webhook installation with **Metadata: read, Issues: read, Pull requests: read**; restricted to configured issue-label and event actions. Owner authorizes a webhook secret created/stored in a managed secret store, with rotation; ingress TLS + raw-byte verification + delivery limits. No write permission is needed for this offline component. To post issue comments or push branches later, obtain separately scoped **Issues: write** and **Contents: write / Pull requests: write** permission after review—never include these silently.
2. Explicitly approve a specific **non-chat** coding worker runtime and sandbox image/version, execution identity, fixed tool/command allowlist, network egress, repo clone permission and synthetic-only test datasets. No access to production secrets, private learner data, GCP production service accounts or existing IAM-private KAIRO Cloud Run.
3. Approve a separately sized, transactional durable queue/database with atomic lease and heartbeat/timeout/recovery semantics, cancellation, audit/retention limits, maximum wall time, workers, tokens, CPU/memory, actual vendor spend quota and cost alert. GitHub retries, concurrent instances and webhook ACK/idempotency should be tested in staging with synthetic deliveries. This local JSON implementation is **not** a cross-host queue.
4. Coordinator checks the remote GitHub claim ledger against canonical local SQLite scopes (if applicable); manually approves any shared interface, worker branch, PR write-back policy, and independent security review. Bot-written events must not retrigger jobs. All merges/releases need separate authorization.

## Product relevance

This addresses **Sustainability** (reproducible bounded engineering work) and **Intelligence** (controlled event-to-agent orchestration). It does not establish any educational learning gain, human/device acceptance, external accessibility certification or fully autonomous operation.
