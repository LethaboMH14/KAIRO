# KAIRO continuous delivery and product-proof loop

## Purpose and reality boundary
Repeat **learner problem → evidence → bounded build → real use → critical review → verified merge → replan → next scoped task** while an agent session or an authorised event-driven runner is actually executing. GitHub is the durable record shared by separate chats, NOT a push-based messaging system for sleeping chats. Issue #13 is a *simulated* runner foundation, not proof of unattended execution. Any actual dispatcher must authenticate webhooks, use leases, bounded retries, capability-limited sandboxes, budget caps and an explicit reviewed merge policy.

## 0. Coordinator startup, every active session
1. Fetch current `main` HEAD, branch protection if authorised, open PRs and issues, exact-head GitHub Actions results, recent reviews and latest 25 Oct or newer handoffs.
2. Read `AGENTS.md`, `coordination/README.md`, `coordination/swarm/OPERATING-LOOP.md`, conditional merge PR #34 and product-proof PR #40. Read the seven judging-criteria register.
3. Detect already completed/integration-ready work **by actual Git state**, not open issue prose. Confirm local SQLite bus only if truly accessible. Respect unresolved local ownership.
4. Inspect `PRODUCT-RESEARCH-TEAM.md` and `PRODUCT-TEAM-PROMPTS.md`. Distinguish **queued**, **in progress**, **ready for review**, **validated**, **merged**, **release-verified**, **blocked** and **withdrawn**.
5. Create a short GitHub coordination issue comment summarising actual state; never claim other chats read the update.

## 1. Ready-task selection (no spam, no collisions)
For each prospective issue, record: problem ID, actual learner persona and task, severity P0/P1/P2, judge deadline, dependency list, likely effect, evidence gain, test method, exact owned paths, research or tool permission, cost ceiling, difficulty/time proxy and uncertainty.

**Gate order:** P0 privacy/source integrity, broken build, impossible submission/demo; then actual source-to-resume journey; then high-value user/friction, accessibility, content correctness; then differentiated features and unit economics; speculative nice-to-have last. Do not award a high priority solely because an idea sounds impressive or uses AI.

For same-priority ready tasks use a transparent, reviewer-visible heuristic (numbers only directional estimates, NOT scientific model):
```text
priorityScore = 4*learnerSeverity + 3*deadlineUrgency
              + 2*expectedEvidenceGain + 2*validatedUserValue
              - 2*scopeCollisionRisk - 2*estimatedCostRisk
              - implementationUncertainty
```
Values 0–3 with reviewer justification, never make missing user evidence `validatedUserValue=3`. Deadline ties break in favour of real accessibility/complete journey, not a studio concept slide. A blocked task cannot be dispatched regardless of score.

Before assignment:
- Search similar issues and open PRs by feature/path; update existing issue if duplicate.
- Check co-ownership and immutable interface dependencies.
- Assign one worker/session and exact path scope; require claim acceptance in issue comments (a non-atomic cooperative reservation).
- Cap concurrent work to demonstrated capacity. Default operating target: up to **3 code workers, 2 research/experience workers and 1 independent reviewer**; not a promise of actual available runtimes. Research can advance read-only even while its dependent app route is claimed.
- No explicit start from owner or authorised runner means **queued**, not executing.

## 2. Worker task packet (must be runnable from GitHub alone)
```text
TASK / issue URL, repository/main SHA, release deadline:
USER JOB / last observed pain / what is unknown:
BASELINE / source, live current workflow or named competitor:
HYPOTHESIS / alternative explanation and what would falsify:
DELIVERABLE / exact code/docs paths, API contract and licensing:
GUARDRAILS / no production deploy, no private data, provider consent, costs:
ACCEPTANCE / executable automated + device/subject tests where applicable:
EVIDENCE / source issuer/report date/denominator, exact CI run, permitted images/video:
REVIEWER / independent technical plus relevant subject/user critic:
DEPENDS ON / READY or BLOCKED:
NEXT / likely follow-on after retest, no premature issue duplication:
```

A research task is not finished merely because a report has many citations; require a decision (KEEP / CHANGE / STOP) and a safe bounded engineering/prototype/experiment recommendation. An engineering task is not finished because code compiles; require actual behaviour and tests.

## 3. Milestone event and handoff
At material checkpoints (not every message), the worker updates its task issue:
```text
STATUS: PLAN | IMPLEMENTED | TESTED | REVIEW | BLOCKED | ACCEPTED | NEXT
OWNER/session/actual model (unknown when hidden):
BRANCH and exact SHA / changed paths / conflict check:
ONE learner problem and proposed mechanism:
SOURCE verification + contrary source:
TESTS and logs on exact commit / known unrun checks:
ACTUAL APP or COMPETITOR USE (YES/NO, permitted proof link, redacted):
JUDGING criteria affected, with fact vs hypothesis:
COST/SPEED/DEVICE/ACCESS evidence, or unknown:
INDEPENDENT CRITIQUE and what we changed:
RISKS, blockers, root cause:
NEXT two **candidate** dependency-ready tasks (not auto-started):
```
Contributor adds/updates PR, tests, handoff and references from product truth graph. If no available connector can execute required action, disclose precisely and continue safe related work.

## 4. Independent review and merge
- Review actual diff and *current* exact commit, not copied author assurances. See PR #34 for conditional merge authority.
- Separate **merge of a scoped internal helper** from **proof of a user-visible feature**, **hosted release**, **judge-ready demonstration**, **customer benefit** and **commercial validation**.
- Fail on known P0/P1 security/privacy/source ownership problems, false citations or modified/skipped tests. If an affected UI/flow cannot be exercised on an *authorised* real browser/device, leave relevant acceptance blocked; never evade denial via alternate tools.
- Challenge a claimed improvement with free/stronger alternatives and an accessibility/low-data path where it materially affects product; improve or de-scope if the alternative wins.
- Before coordinator merges, verify independent reviewer, actual CI for final combined candidate, dependency order, rollback and record evidence under PR #34. No automatic production deployment, paid provisioning, public IAM, source upload, employment applications or unconsented recording.

## 5. **Immediate replan after EACH accepted task**
1. Re-query GitHub to detect new commits, reviews, issue claims and current blocked/ready dependencies.
2. Close or relabel accepted issue only for its actual scope; distinguish merge from product complete.
3. Mark affected claims `code-implemented` / `exact-head-ci-passed` / `observed` only when evidence exists; invalidate stale tests or screen recordings on changed flows.
4. Identify the next two *candidate* tasks:
   - **Repair task**: highest severity remaining failure found by QA/critic, with reproducer; or
   - **Value task**: smallest improvement addressing observed learner friction/stronger competitor; or
   - **Evidence task**: shortest safe test that can prove/disprove a market/learning/cost assumption.
5. De-duplicate against existing issues/PRs and active scopes. Select the highest-ranked **ready** issue; if none, ask reviewer for a smaller separately claimable interface or a read-only data validation task.
6. Assign to an active available worker **through an explicit communication mechanism** and record the claim. If all workers inactive, set issue `ready for next session`; do not pretend an ordinary chat woke up.
7. Publish one concise change summary, risk/confidence, next chosen task and decision owner to Issue #11 or a coordination handoff. Continue to another bounded task during this running session if resources, permissions and test time allow.
8. Inspect the impact of the last change after integration; record regressions and negative results and feed them to the next cycle.

## 6. Agent and product failure recovery
- Worker unreachable: retain task claim; coordinator cannot steal active canonical bus lock. Seek owner release/recovery according to AGENTS.md. A remote cooperative GitHub claim can be reassigned after documenting inactivity, but cannot override a local bus claim.
- PR fails CI: return to same author for root cause or assign narrowly disjoint reproducer; no 'skip' policy, no false green.
- Judge cannot start: treat as P0 UX blocker, focus first-screen/login/access route, maintain lawful IAM. Never silently make private Cloud Run public.
- Research finds no demand/advantage: narrow feature promise or stop; do not fabricate supportive quotes or launch a vanity advertising feature.
- Costs break price: cap premium usage, meter actual invoices, redesign experience/offer and do not sell unbounded service.
- Live provider or browser permission unavailable: report **not tested**; use synthetic contract tests but keep human/device check outstanding.
- Endless task generation: de-dup by root-cause/paths, require a measurable acceptance, max 2 proposed next issues, one accepted task at a time per worker.

## 7. Readiness and observable KPIs
**Delivery:** merged reproducible regression-safe PRs; open P0 bug count; time to first successful source-linked practice; real phone accessibility/parity; no leaked owner source; judge access with permitted proof.
**Product:** cold-user comprehension, task completion, domain accuracy, actual non-manipulated resume and assisted/independent attempt provenance; honest n/denominator and competitor baseline.
**Commercial:** cost per *completed* real/assumed task clearly separated, P90 cost, support hours, pipeline stage by real named buyer, signed scope and payment evidence. No revenue without invoices.
**Organisation:** work-in-progress limit, task duplication rate, merge reversions, actual independent reviews and stale claims; count verified outcomes rather than GitHub issue totals.

## 8. Real current handoffs
- Product-proof PR #40 adds the research-to-evidence strategy, v2 canvas, scenario calculator and a dedicated team.
- Conditional coordinator authority PR #34 remains separate.
- Existing engineering issues #2–#14 and source-selection #16/#31; product #35–#39 and new truth/queue #43–#44.
- Latest repo `main` must be fetched each session: do not assume a previously open PR stays unmerged.
- User-supplied 2026 programme records **26 October 2026 23:59** submission and 20s pitch; verify actual event portal/time zone. Under deadline pressure prioritise verifiably usable task + compliant evidence over broad unfinished models.
