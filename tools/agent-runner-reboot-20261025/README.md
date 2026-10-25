# Issue #13 — KAIRO guarded coding pilot

Replaces closed-unmerged PR #54 using an exclusively new workflow and runtime. Only the new tools/kairo-agent-proof-20261025/ output path may be generated in this first real model test.

Activation is deliberately fail closed. On GitHub create an OpenAI API project with a provider-side spending limit (ChatGPT subscription is not API billing); add its key directly as the repository Actions secret KAIRO_CODEX_API_KEY. Create repository variables KAIRO_AGENT_ENABLED=true and KAIRO_BUDGET_APPROVED=true only after the key, budget and workflow have independent review. Add agent-approved label to Issue #13. Enable Actions creating pull requests if currently disabled. Do not paste keys into chats.

After independent review and merging to main, run GitHub Actions > KAIRO scoped coding pilot > Run workflow with execute=true. Scheduled dispatch daily is best effort. All executions, including manual, are limited to one preceding workflow dispatch per rolling 24 hours; GitHub reruns are denied. A generated draft PR and real Codex run step are the only proof of true unattended coding. No model is invoked if no key/switch/label is available.

Codex runs under drop-sudo :workspace on an ephemeral GitHub runner without persisted GitHub checkout credentials. The separate draft publisher has no provider API key, verifies the exact main SHA and patch scope/mode/size, and never merges or deploys. Canonical local SQLite coordination bus is not remotely accessible.

Known limits: no atomic monetary cap without external provider project budget; GitHub Actions token's ability to create draft PRs may need owner settings; daily history is a conservative throttle, not an atomic cross-repository lease. Do not expand the generated path allowlist without a separately reviewed PR. Missing credential means NOT ACTIVE, regardless of green CI.

Tests: node --test tools/agent-runner-reboot-20261025/*.test.mjs