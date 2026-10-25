# KAIRO guarded autonomous Codex worker — real GitHub Actions adapter

**Issue #13.** This is the **real execution adapter** for the separate offline simulation in [PR #28](https://github.com/LethaboMH14/KAIRO/pull/28). It does not overwrite that worker's files or use the canonical local SQLite bus. It runs only after this workflow is reviewed and merged into the default branch, and **only when a valid Codex API secret exists**. No ordinary ChatGPT chat is awakened.

## Actual execution chain

1. GitHub Actions `.github/workflows/autonomous-codex-worker.yml`: hourly best-effort schedule, explicit manual dispatch or `agent-ready` label on an allowlisted issue. No model invocation on a PR test event.
2. Separate selector with `contents:read`, `issues:read`, `pull-requests:read`, `actions:read` fetches latest main, issue/PR status, dependency PR merge and 24h workflow history. Only code-reviewed issue IDs 49 (studio) and 50 (ML) are enabled. ML #50 requires [PR #53](https://github.com/LethaboMH14/KAIRO/pull/53) merged first. Existing open task PRs and blocked issues are skipped. At most **two task attempts per rolling 24h**; the script does not guarantee a monetary spend cap.
3. Generation job checks secret, checks out the exact main commit **without persisted Git credentials**, uses a small generated prompt listing hard-coded file paths, and calls the *official* `openai/codex-action@v1` with `:workspace` sandbox, sudo dropped and API key handled by its proxy. The model receives **no GitHub write token**. Model responses / issue text are never themselves trusted as GitHub authorisation.
4. The patch stage rejects changed files outside owned paths, symlinks, deletions, binaries, more than 20 files, any file >64 KiB, patch >128 KiB or >900 added lines. It produces a patch artifact, not a merge.
5. A **different GitHub job** receives the patch but no provider API secret, verifies the exact main SHA is unchanged and rechecks paths, then attempts to publish a **draft PR** on an `agent/issue-<number>-<run>` branch. The built-in, repo-scoped `GITHUB_TOKEN` is used only for code/PR/issue writeback. Human/independent reviewers and standard CI must validate. No automatic merge or deployment.
6. After a draft PR, coordinator reviews under PR #34, applies actual device/UX/education review where relevant and only then performs a validated merge. Next job is selected on the next scheduled run from the allowlist; do not claim a perpetually running worker or unlimited automatic task invention.

## OWNER ACTION NEEDED TO TURN ON REAL MODEL EXECUTION

These settings cannot be created by the current GitHub ChatGPT connector. **Never paste credentials in chat or a PR.**

**A. Configure a dedicated, low-budget OpenAI API project key:** GitHub repository → Settings → Secrets and variables → Actions → New repository secret → Name `KAIRO_CODEX_API_KEY` → paste the API key directly into GitHub's secret field. OpenAI API usage is billed **separately** from ChatGPT Plus. Set a strict project spend limit/budget/alerts and revoke/rotate if needed. The workflow does not turn on paid inference without this secret. Alternatively, switching to an appropriately configured Azure Responses endpoint is possible, but requires a separately reviewed change and Azure credentials.

**B. Allow bot draft PRs:** GitHub repository → Settings → Actions → General → Workflow permissions → enable **Allow GitHub Actions to create and approve pull requests**. This runner **never calls the approval or merge APIs**; GitHub may block PR creation without this setting. Its authenticated branch might be pushed before the API refusal, in which case the run comments on the issue with the recovery branch.

**C. Release and verify:** Once independent review + CI pass, merge this workflow PR into main, then use Actions → **KAIRO autonomous coding worker (guarded)** → Run workflow. Confirm (not assume) that the run has a real `Run real Codex coding session` step, a nonempty validated patch and a draft PR. With no key the workflow reports **BLOCKED — missing secret**, and no provider is called. Confirm external OpenAI API spend and concurrent-run limits, then observe next scheduled run and PR. The task issue is not finished until this actual end-to-end result is evidenced.

No permissions to production Cloud Run, Google Cloud IAM, Azure subscriptions, external employer systems, private learner records, Kaggle submissions or private coursework are provided by the workflow.

## Important limitations

- GitHub Actions cron is best-effort, not a guaranteed realtime scheduler; max two attempted model jobs/day is a resource throttle, not an actual dollar cap or spend guarantee.
- GH-issued GITHUB_TOKEN bot PRs can require manual approval to run PR CI. User-configured GitHub Actions "create PR" permission may be off by default. A GitHub App can later enable a more capable, audited path.
- The two task lanes are versioned. Adding more autonomous task classes or modifying file scopes requires a **reviewed PR**; do not let prompt text silently expand claims.
- Current #49 job generates a self-contained pump what-if studio experience only; it does not edit `StudioRouter` without separate issue ownership/review. #50 runs model-development experiments in the existing Kaggle lab, but the GitHub job **does not authenticate to Kaggle or claim hosted Kaggle training**.
- The existing offline HMAC/durable simulation is separate; this native GitHub Actions runner needs no incoming custom webhook server. Real multi-worker cross-host leasing, budget telemetry, cancellation/restart and autonomous queue creation remain future #13 hardening tasks, not achievements of this bounded adapter.
- The model can read public repo source but no live canonical bus status. If actual user/owner claims conflict, coordinator must mark the task blocked via GitHub before model invocation.
- Protect API keys, account/source data, app integrity and merge policy; file allowlists are defence in depth but do not turn generated code into independently verified code.

## Tests

From repository root on Node 24:

```bash
node --test tools/agent-runner-live/*.test.mjs
```

PR test workflow runs same tests automatically. Full KAIRO application CI and independent security review must also pass. Until an actual scheduled/manual execution creates a draft PR, **status is implementation ready, not running**.

## Future improvements after a verified real job

- Issue #13: use GitHub App installation with transactional idempotency and task leases; add executor cancellation and hard provider budget gates.
- Test no-credential, denied-GitHub-PR-write, model timeout and patch injection scenarios on the exact workflow.
- Add new reviewed task scopes for owner-approved learner RAG/UI, source privacy repairs, accessibility, genuine model/training benchmarks, and infrastructure-only tasks after conflicts are reconciled.
- Create a reproducible evidence ledger of which issued tasks received a real run (workflow ID, model, output), were reviewed and ultimately merged. Never equate an API call, passing CI and observed student benefit.
