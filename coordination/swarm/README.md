# KAIRO multi-chat engineering launch — 25 October 2026

**Mission:** complete and continuously improve KAIRO Access as a functioning, source-grounded, accessible learning product. Orchestration exists to ship the product; it is not the deliverable.

## Read first in every chat
1. [Project README](../../README.md), [AGENTS.md](../../AGENTS.md), [coordination README](../README.md).
2. [Latest integration handoff](../handoffs/2026-10-25-ai-integration.md), [architecture](../../docs/ai-integration-20261025/ARCHITECTURE.md).
3. [Backlog](../roadmap/BACKLOG.md), but **cross-check all older entries against later handoffs**.
4. This file, [prompt kit](WORKER-PROMPTS.md), [loop](OPERATING-LOOP.md).
5. Current GitHub open issues and PRs, especially [PR #1](https://github.com/LethaboMH14/KAIRO/pull/1).

## What exists
Node 24 / React 19 / TypeScript / Vite / Three.js + Express + Firestore + private Cloud Storage + Cloud Run + documented Google, Groq and OpenRouter gateway. At the last recorded checkpoint, serial app regression had 741 passes; this was **before** first GitHub CI. KAIRO remains IAM-private. No real learner gains, language quality, browser/device acceptance or cross-source indexed RAG are proven.

**Important current blocker:** [PR #1](https://github.com/LethaboMH14/KAIRO/pull/1) adds GitHub Actions and an unintegrated owner-scoped multi-source retrieval primitive. First CI run [40157365360](https://github.com/LethaboMH14/KAIRO/actions/runs/40157365360) FAILED in app tests because extraction tests relied on missing Python/OCR packages and a Windows-only interpreter path on Ubuntu; coordination Python tests PASSED. Never say PR #1 is green or merged until checked.

## Team launch order
- Open coordinator chat with role `COORDINATOR` from WORKER-PROMPTS.
- Immediately open independent worker chats for CI [#2](https://github.com/LethaboMH14/KAIRO/issues/2), browser QA [#5](https://github.com/LethaboMH14/KAIRO/issues/5), careers [#6](https://github.com/LethaboMH14/KAIRO/issues/6), cloud [#8](https://github.com/LethaboMH14/KAIRO/issues/8), privacy [#10](https://github.com/LethaboMH14/KAIRO/issues/10).
- Additional focused workers: retrieval integration [#3](https://github.com/LethaboMH14/KAIRO/issues/3) once its PR dependency/interface is understood; index [#4](https://github.com/LethaboMH14/KAIRO/issues/4); voice [#7](https://github.com/LethaboMH14/KAIRO/issues/7); avatar/studios [#9](https://github.com/LethaboMH14/KAIRO/issues/9); integration/release [#11](https://github.com/LethaboMH14/KAIRO/issues/11).
- These are **roles and queued issues**, not evidence that the chats/agents have started. Individual chats only act when invoked; for unattended execution configure a real agent runner/Work task with appropriate triggers.

## Cross-chat communication: GitHub is the remote ledger
Each agent must:
- Post an initial **claim comment** on its issue: unique session ID, actual model/effort if exposed, branch, exact file paths/subtrees, dependencies and intended acceptance. Do not assume the claim is exclusive until the coordinator checks concurrent issue claims.
- Inspect PRs, issue comments and current commit SHA before editing; negotiate shared routers, manifests, schemas, global CSS and interfaces **before** changes.
- Work only in its own feature branch/worktree. Add scoped tests and measurable evidence. Commit/push, create draft PR, link PR to issue.
- Post an issue status comment at meaningful milestones: `PLAN`, `IMPLEMENTED`, `TESTED`, `BLOCKED`, `REVIEW`, `NEXT`. Include branch/SHA, exact tests, limitations, and precise proposed next work.
- On finished work, update the issue and propose the next dependency-ready issue. If no current issue remains in the 25 October list, derive the next bounded item from the 15-area backlog and recent failures, obtain coordinator scope allocation, then create an issue with testable acceptance.
- Re-read inbox/issue/PR state at the beginning and end of every actual session/turn. **Never** claim silent/background work or that another chat read a message.

### Canonical local SQLite limitation
The live `coordination/bus.sqlite3` lives on the owner's local machine. A remote GitHub-connected chat cannot inspect it. Agents in the **same canonical local checkout** must additionally use `python coordination/bus.py status`, register, claim exact paths and obey the local locks before edits (per AGENTS.md). Other chats cannot invent bus registrations or override those locks. A remote GitHub issue claim is cooperative, **not an atomic lock**; coordinator must resolve conflicts. Work in isolated branches and avoid overlapping files until claims reconcile.

## Priority quality and security rules
- Product journey first: authenticated owner → source → reviewed extraction → cited lesson → KAIRO / reading → studio → practice → evidence → resume. Keep work truly functional and source/revision correct.
- Commit real tests, not self-certified claims. CI: Node 24 `npm ci`, serial `node --test --test-concurrency=1 tests/*.test.mjs`, `npm run build`, Python isolated coordination tests, plus scoped integration/device/browser checks where permitted.
- A failed/skipped test is not green. Require independent review and explicit acceptance for cross-domain integrations. Update test/evidence ledger with actual run IDs.
- Never use real learner/private data in GitHub or unrestricted tests; provider consent, owner isolation, quotas and retention must be preserved. Never fabricate educational efficacy, competencies, endorsements, vacancies, accessibility or SASL accuracy.
- Browser/microphone/camera permission denials in project handoffs remain binding. No circumvention by alternative tooling. Human acceptance remains human.
- Research/install permissively **within approved isolated environments**: check provenance, version, licence, security and dependencies. No arbitrary skill scripts, exposed secrets, unbounded network scraping or copyrighted asset copying.
- Existing Cloud Run is IAM-private. **No public IAM, production deployment, Terraform apply, paid resource, provider billing change, new secret, external employer action, or automatic main merge** without the specific owner's release approval. A statement of general cloud access is not itself evidence of account authentication or budget.
- Deploy/test accounts and API keys must use dedicated least-privilege identities. Do not paste credentials into any chat/issue/PR.
- If a connector or runtime cannot execute a step, report the blocker and continue other safe, independent work.

## Success condition, not a stopping condition
Every issue moves: `queued → claimed → in progress → draft PR → CI/review → verified/accepted → integrated`, or `blocked` with accountable owner and prerequisite. Release proof includes a complete learner flow with device, accessibility, privacy and cost evidence. Replan after each accepted wave against all 15 backlog areas, not just the first ten issues. Never mark a broad area complete because a foundation module exists.
