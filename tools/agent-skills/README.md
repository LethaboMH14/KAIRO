# KAIRO agent-skills: offline audit and isolated review (#14)

**Status (25 October 2026):** versioned registry with eleven pinned upstream candidates. **All eleven are proposed, not approved**, so no third-party installation is available by default. Upstream GitHub commit refs and licence files were individually inspected at the cited revisions. Repository licences do not authorize model weights, assets or third-party services.

The Python 3.11+ standard-library harness never downloads archives, invokes shell commands, installs packages, executes scripts or touches global skill directories. It only stages reviewed .md/.txt/.json data in a separate local workspace.

## Read-only inventory and plan

    python tools/agent-skills/harness.py inventory
    python tools/agent-skills/harness.py plan --id threejs-guides
    python -m unittest discover -s tools/agent-skills/tests -v

The versioned registry documents immutable upstream repository + full SHA commit, licence evidence URL at that commit, compatibility, permissions, budget/network, review and rollback. Entries remain discovery candidates, not automatic dependencies.

## Audited local ZIP workflow

Promotion from proposed to approved requires a separately reviewed GitHub issue/PR with named reviewer and approval ticket. An approved entry must carry SHA-256 of an entire local ZIP, SHA-256 for every included text file including SKILL.md, pinned origin and licence URL, zero network, zero dollar budget and only read-local-files/write-isolated-sandbox permissions. Explicit authorization is required for any higher-risk operation. The ZIP must be locally reviewed and supplied by the operator; this tool cannot fetch it.

    python tools/agent-skills/harness.py init --workspace /existing/workspace
    python tools/agent-skills/harness.py stage --id APPROVED-ID --bundle /local/reviewed.zip --ticket APPROVAL-TICKET --workspace /existing/workspace
    python tools/agent-skills/harness.py verify --id APPROVED-ID --workspace /existing/workspace
    python tools/agent-skills/harness.py rollback --id APPROVED-ID --workspace /existing/workspace

init creates a marker under .kairo-agent-skills-sandbox. stage hashes the ZIP before writing, rejects path escape/absolute/Windows paths, hidden paths, symlinks, scripts, duplicate case, unsupported member types, ZIP bombs, unauthorized permissions, mismatched hashes and existing targets. It uses a temporary directory followed by a rename. verify compares actual file hashes, stage manifest and current registry. rollback refuses modified stages to prevent destructive cleanup. Stage never executes SKILL.md instructions: Markdown remains untrusted guidance until independently reviewed for prompt injection.

## Cross-chat contract

1. Missing capability -> proposal: post exact commit/path/licence/permissions/compatibility/network/budget, use case, tests, rollback and safer alternatives on the issue.
2. Independent security/coordinator review -> approval: land a reviewed registry version with full ZIP and per-file hashes, named approval and narrowly scoped permissions.
3. Approved offline sandbox stage -> check: explicit local invocation of plan/init/stage/verify, then bounded synthetic tests. Code-bearing archives require a different, separately reviewed environment and are blocked here.
4. Share reproducible result -> rollback: report commit SHA, toolchain, test output, hash evidence, limitations and next allocation in the issue/PR and handoff.

Existing tools/install_engineering_skills.ps1 uses a bundled installer to copy pinned GitHub skills into .claude/skills; pinned refs alone do not guarantee vetted content. Do not run or modify that script in this issue. Integration with coordination/swarm prompts, task runner, package manifests, cloud or CI workflows requires coordinator-approved shared ownership. PR #12 owns coordination/swarm.

## Limitations

A digest confirms consistency with reviewed bytes, not harmlessness of Markdown. Branch review controls protect the registry trust boundary. This harness does not evaluate binary dependencies or native executables, hostile filesystem races, model licences/weights, browser/device acceptance, remote tools, cloud IAM or educational impact. Known browser and microphone denials and IAM-private hosting remain unchanged.
