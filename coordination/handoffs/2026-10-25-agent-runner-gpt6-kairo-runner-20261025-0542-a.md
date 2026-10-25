# Issue #13 offline coding worker bridge — handoff (25 October 2026)

- Session: `gpt6-kairo-runner-20261025-0542-a` — ChatGPT GPT-6; reasoning effort **unknown** (not exposed). Remote GitHub connector, NOT the owner's canonical local checkout.
- Issue: https://github.com/LethaboMH14/KAIRO/issues/13
- Branch: `feat/issue-13-offline-agent-runner-20261025-gpt6a`; base `main` at `20183faf31fe30bc68e2fc70cb339e7fd24fce79`.
- Scope: `tools/agent-runner/runner.mjs`, `tools/agent-runner/runner.test.mjs`, `tools/agent-runner/README.md`, and this uniquely named handoff only.
- Source and test commits: `86ad6918`, `2c0bd379`, docs `2cf7660`, final safety patches `502ecb3` and `fb273fb`; the **latest** patch/test head before handoff is `fb273fba1ccd8537c350388de26b4d8fcb2627b7`. Check subsequent branch HEAD on review.
- Coordination: issue #13 plan/status comments; remote claim is **not** an atomic task lock. Canonical `coordination/bus.sqlite3` was not accessible; no agent registration/status/claim was performed there. Other open PRs #1,#12,#15,#17 touched different owned paths. Coordinator must still reconcile local scopes before integration.

## Delivery and acceptance evidence

| Criterion / need | Implemented behavior | Actual test evidence | Unproven boundary |
|---|---|---|---|
| Sustainability — durable, reproducible work | Verify HMAC-SHA256 on exact raw bytes; exact repo; UUID delivery id/digest dedup; bounded event storage | Forged signature, changed bytes, duplicate header, restart replay, collision tests | No authenticated public HTTP ingress |
| Intelligence — safe assignment | Issue readiness label, immutable claim owner/branch, path subtree overlap rejection, serialized directory lock | Owner takeover, parent-child overlap, duplicate branch, simultaneous claim tests | No GitHub actor permission lookup or cross-host lease |
| Sustainability — bounded failures | Simulation receipt for running, concurrency/unit caps, backoff/dead-letter, no commands or network calls | Deterministic retries across restart, stale owner/attempt receipt, budget cap | Not real coding-worker execution or provider spend accounting |
| Safety — feedback boundary | Ignore bot/comment feedback, link same-repo PR to active branch for review, close blocks work | Bot/comment/fork branch, PR collision, issue closed, unknown actor/path rejection | No merge authorization, reviewer attestation or real runner isolation |

## Commands actually executed locally

```sh
node --check /mnt/data/kairo-runner/tools/agent-runner/runner.mjs
node --test --test-concurrency=1 /mnt/data/kairo-runner/tools/agent-runner/runner.test.mjs
```

After latest security patches: **9 tests, 9 pass, 0 fail, 0 skip**, Node **v22.16.0**, approximately 309 ms. Synthetic fixture only; HMAC test secret is dummy. GitHub source and tests were committed via connector, because the local container cannot resolve `github.com` for `git clone`. The local test source matches the branch implementation functionally; GitHub CI has **not** independently run this branch.

**NOT RUN:** Node 24, `cd studio && npm ci`, `node --test --test-concurrency=1 tests/*.test.mjs`, `npm run build`. Reason: local environment lacks Node 24 and the full Studio repo; network DNS for GitHub unavailable. Earlier reported 741/741 belong to the prior integration, not this branch. PR #1's previous GitHub Actions run failed and remains a separate CI gate. No browser/microphone/camera invocation.

## Contract and decisions

- `OfflineRunner` reads/writes a dedicated `ledger.json` under caller-supplied directory using exclusive local `mkdir` lock and fsynced atomic replacement. Stale locks are **never stolen automatically**. No automatic filesystem cleanup of possible live owner claims.
- Canonical bus and remote GitHub issue claims remain **separate**; this prototype does not replace/reconcile either automatically. An issue/PR title/body is *data*, not executable instructions or trusted scope allocation.
- `dispatchSimulation` emits a receipt but **never starts an actual worker**. ChatGPT tabs are not automatically woken; no webhook listener or agent runtime is deployed.
- A successful simulation/review result does not approve merging, paid cloud access, new skills, signing, IAM, release or real learner use.

## Exact next permissions for real deployment (separate review required)

1. Owner authorization for one repository-scoped GitHub App with **Metadata/Issues/Pull requests: read** and exact webhook event/label policy, rotated webhook signing secret stored only in approved secret manager. Actual event actor permission lookup and TLS ingress design.
2. Owner-approved **real non-chat coding runtime** with pinned sandbox image, least-privilege read-only checkout identity, network allowlist, execution/CPU/memory/wall-clock caps, logging retention and synthetic fixtures; isolated from production credentials and private learner records.
3. Approved transactional cross-host queue with idempotency, leases, crash/recovery, cancellation and cost quotas. Local JSON is not cloud-safe distributed task storage.
4. Separate explicit permissions for any future GitHub **Issues: write, Contents: write, Pull requests: write**, scoped branch protections and independent security review; **no bot push** or automatic merges under current authorization. No new Cloud Run deployment/billing/IAM change from this PR.
5. Coordinator resolves concurrent GitHub claims against the owner's canonical local SQLite bus before any shared-scope work. Remote issue comments cannot atomically reserve local paths.

## Blockers, review and next

- **Blockers:** full Node 24 Studio/CI gate unverified; no permitted GitHub webhook endpoint or coding worker runtime/credentials; canonical local bus unavailable; independent security review outstanding.
- **Review request:** replay/collision semantics, lock/crash handling, same-repo PR/actor verification, budget cap and future trust boundary. No claim this offline JSON ledger is production-ready.
- **NEXT unblocked independent backlog issue:** #14 `tools/agent-skills/` audited versioned registry and dry-run sandbox, **only after its own agent's ownership check**, without sharing #13's runtime source. The real worker adapter extension of #13 is blocked pending the specific approvals above.
