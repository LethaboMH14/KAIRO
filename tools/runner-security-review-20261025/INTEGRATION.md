# Issue #13 independent guard: OWNER INTEGRATION REQUIRED

This is a stacked, separately owned security-repair candidate for PR #96. It is not active until the original owner integrates it into the existing workflow; PR #96 stays RETURN FOR REPAIR.

1. Replace the old first-page-only select invocation in PR #96 with node tools/runner-security-review-20261025/gate.mjs select. Keep the existing GITHUB_TOKEN, KAIRO_AGENT_ENABLED, KAIRO_BUDGET_APPROVED and KAIRO_EXECUTE environment contract. The new selector fetches all relevant schedule/manual attempts and all open PRs, rejects malformed/partial API pages, and emits selected/base_sha/branch.
2. In the write-enabled publish job, immediately BEFORE git push (after commit), call node tools/runner-security-review-20261025/gate.mjs publish. Pass GITHUB_TOKEN from github.token; KAIRO_AGENT_ENABLED and KAIRO_BUDGET_APPROVED from vars; KAIRO_SELECTED_SHA from needs.select.outputs.base_sha and KAIRO_SELECTED_BRANCH from needs.select.outputs.branch. No provider API key may enter the publisher.
3. Before push, run node tools/runner-security-review-20261025/gate.mjs scan-patch with KAIRO_PATCH set to the downloaded patch artifact. The scanner is heuristic, conservative and not a guarantee of private-data absence. Human review remains mandatory.
4. Challenge revocation while generate runs, >100 PR events hiding a manual run, >100 open PRs hiding a generated branch, malformed/torn history pages, budget disable, stale main, and token-bearing patches. Prove NO draft branch is pushed on denial.
5. Obtain independent security review, exact-head Node24 full CI/build/Python bus, authorized no-key dry-run, then owner-configured provider key/spending cap and one real Codex-produced draft PR before calling the worker launched.

Limits: GitHub vars are evaluated per job and final check-to-push has a narrow race. This is not a transactional spend cap or cross-repo lease; stronger guarantees need separately authorized infrastructure. Do not expand output scope beyond tools/kairo-agent-proof-20261025/ without review.
