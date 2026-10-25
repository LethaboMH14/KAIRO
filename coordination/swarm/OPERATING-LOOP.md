# Operating loop: task → work → verification → replanning

## A. Before each worker executes
1. Check fresh default-branch SHA, open issues and PRs, latest 25 Oct or newer handoffs and CI run status. Do not rely on another chat's cached notes.
2. Read your assigned Issue #2–#11 and dependencies. Post a claim comment with session ID, branch, exact paths and intended outputs. Coordinator checks conflicting scopes; this is not an atomic remote lock.
3. If in the owner's canonical local checkout, inspect/register/claim the live `coordination/bus.py` state BEFORE editing; remote-only chats cannot do so.
4. Collect approved official docs/source data only. Inspect licenses and dependencies before installing skills/tools. Protect secrets and private learner material.
5. Make a small, verifiable change on your own branch. Do not edit `main`.

## B. At each milestone (each real interaction/runner iteration)
Post a comment on your issue with this structure:

```text
STATUS: PLAN | IMPLEMENTED | TESTED | BLOCKED | REVIEW | NEXT
SESSION: <unique id>; MODEL/EFFORT: <actual or unknown>
BRANCH/SHA: <branch and commit>
SCOPE: <exact files touched or proposed>
ACCEPTANCE: <criterion and learner benefit>
TESTS: <commands and actual pass/fail; CI URL>
REVIEW: <findings and reviewer>
BLOCKERS: <exact missing permission/dependency or none>
NEXT: <dependent task and issue number, with scope>
CLOUD/COST: <none, or read-only findings and required approval>
```

GitHub issue comments are visible to other chats **when they next query GitHub**; comments do not push an instruction into a sleeping ordinary chat. GitHub webhooks can wake a separately deployed coding agent runner, not arbitrary chat tabs.

## C. Integrator/reviewer cycle
- Read latest PR diff/CI. Check main HEAD was not changed since work began. Inspect file ownership and bus constraints.
- Reject invented results, duplicated work, surprising dependencies, unsafe network/scraping behaviour, leaked secrets and unreviewed generated code/skills.
- Validate unit, integration, contract, security and browser/device tests where authorised. Treat `not run` as unverified.
- Fix/test root causes of failing checks. Re-run real CI; record job/run URL and commit.
- Require independent review of changes to auth, cloud, payments, privacy, migrations and agent execution policies.
- Merge only when successful acceptance/ownership checks and user-approved release policy permit it. `main` must not become a testing sandbox.
- Update issue state and current handoff with accepted capabilities versus remaining human/device/provider verification.

## D. Continuous replanning algorithm
At each accepted wave: 
1. Refresh newest handoff, CI, open issues/PRs and `coordination/roadmap/BACKLOG.md`.
2. Build a dependency graph; label tasks `ready`, `blocked`, `under review`, `done (evidenced)`.
3. Rank P0 broken security, data loss, failed build/CI and user journey blockers first; P1 core product (source→lesson→KAIRO/reading→practice→evidence→resume); then P2 advanced/optional capabilities.
4. Spawn/assign only non-overlapping ready tasks up to resource/cost quotas. Do not imply unlimited active workers.
5. Turn newly found defects/beneficial features into bounded GitHub issues with owner, exact file scopes, testable acceptance and dependencies; avoid duplicating older completed work.
6. Continue until the product milestones are accepted. New requests require fresh issue/cost/access scope. A chat stops when its turn ends; a deployed scheduler is required to auto-launch further turns.

## E. Trigger strategy
- NOW: manual copies of WORKER-PROMPTS.md into separate chats; each reads/issues comments at actual work boundaries.
- Lightweight monitoring: hourly ChatGPT task can check GitHub and alert the owner **only** when meaningful status changes or blockers appear. It cannot drive those other chats.
- Full automation: event-driven coordinator service receives GitHub issue/PR webhooks, stores jobs/leasing in separate Firestore (or transactional equivalent), enqueues Cloud Tasks, launches authenticated coding sessions in isolated sandboxes, records results in issue comments, and handles retries/merge review. Authenticate signatures, make workers idempotent, bound concurrency and budget. Do not configure triggers to recursively respond to their own comments indefinitely.
- Never let automatic tools trigger a public Cloud Run IAM change, production deployment, paid cloud resource, applicant submission or sensitive data export without separate approval.

## F. Initial task and dependency map
| Role | Issue | Earliest useful work | Depends on |
|---|---|---|---|
| CI and toolchain | [#2](https://github.com/LethaboMH14/KAIRO/issues/2) | fix real PR #1 failing CI | PR #1 head and logs |
| RAG integration | [#3](https://github.com/LethaboMH14/KAIRO/issues/3) | API contract, then integration | PR #1 retrieval primitive |
| Persistent index | [#4](https://github.com/LethaboMH14/KAIRO/issues/4) | evaluation fixtures and design | RAG revision contract |
| Browser QA | [#5](https://github.com/LethaboMH14/KAIRO/issues/5) | permitted synthetic accessibility/device harness | independent |
| Careers | [#6](https://github.com/LethaboMH14/KAIRO/issues/6) | dated requirement-to-evidence model | existing opportunities |
| Speech | [#7](https://github.com/LethaboMH14/KAIRO/issues/7) | consent/cancellation/voice evaluation | existing listening adapter |
| Cloud | [#8](https://github.com/LethaboMH14/KAIRO/issues/8) | read-only access/cost/region preflight | access actually verified |
| 3D teacher | [#9](https://github.com/LethaboMH14/KAIRO/issues/9) | benchmark/fallback/claim check | CHARACTER-002 rights |
| Security | [#10](https://github.com/LethaboMH14/KAIRO/issues/10) | owner/retention/consent tests | independent |
| Integration | [#11](https://github.com/LethaboMH14/KAIRO/issues/11) | review evidence and PR boundaries | issues/CI |

## G. Cloud connector access truth
GitHub is verified with repository push and PR/issue permissions. Hugging Face is authenticated as LethaboMH14 with read-repo, read-MCP and jobs scopes; this does not automatically imply permission to publish spaces/models. Google Drive connected is **not** the same as an authenticated Google Cloud Run/Firebase administration connector. A Firebase integration is available for the user to connect. No general Azure subscription/resource mutation access was verified in this chat; Azure Cosmos DB guidance may be available, but it is not an Azure resource-management authorization. Local Google Cloud/Azure CLI may be used in an appropriately authorised environment, with separate least-privilege identities. General permission to explore clouds is not approval to create paid resources or alter public IAM.

## H. Current first-wave gate
[PR #1](https://github.com/LethaboMH14/KAIRO/pull/1) is draft and unmerged; run [40157365360](https://github.com/LethaboMH14/KAIRO/actions/runs/40157365360) has **failed** app CI, **passed** coordination Python tests. Do not merge until #2 resolves failures and new CI/independent code review passes. Its multi-source retrieval helper is not yet wired into lesson UI/API. Other work can proceed in independent branches.
