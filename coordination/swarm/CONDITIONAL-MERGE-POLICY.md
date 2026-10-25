# KAIRO conditional merge authority — owner direction, 25 October 2026

## Decision and scope

**The owner now authorises the designated Chief Engineering Coordinator to merge KAIRO pull requests into `main` without asking for separate approval for each merge, but ONLY after the evidence-based gates below pass.** This supersedes previous blanket "ask owner before any merge" wording; all other AGENTS.md safeguards remain. No specific PR is pre-approved by this policy.

The coordinator is accountable for acceptance, independent critique, dependency order, integrated QA and honest communication. Workers and release reviewers can recommend acceptance, but cannot represent themselves as the coordinator. GitHub login identity may be shared across chats; an issue comment alone does not prove an independent review. The coordinator must personally verify evidence before invoking the GitHub merge operation.

**This is MERGE authority, not blanket DEPLOY authority.** It does **not** authorise public IAM, production deployment or live traffic promotion, paid/cloud provisioning or billing, adding secrets, actual learner data processing, irreversible DB changes, external applications/submissions, unauthorised recording or bypassing previous tool/browser-policy denials. Those still require specific owner approval and actual provider/tool permission. Merging application code to `main` does not mean the hosted IAM-private Cloud Run service has been updated or is usable by judges.

A merge may occur in an active authorised coding session or deployed, policy-enforcing agent runner. Ordinary ChatGPT chats and GitHub issue comments do not wake one another or work continuously.

## Evidence and acceptance gates (all relevant gates mandatory)

### Gate A — Source/ownership and technical review (every PR)
- Fetch the latest exact PR head SHA, base SHA, current `main`, commit history, diff and current issues. Resolve file-ownership and dependency conflicts; reconcile canonical local bus claims if available and **do not infer** a missing bus file means no claims. Stop if known local ownership cannot be safely reconciled for affected files.
- No pending draft or unresolved high-severity code review; independent technical review **of the actual diff**, not a model's generic recommendation. Prefer a reviewer separate from the coding worker, with recorded identity/session and detailed findings.
- Research official docs, current maintained alternatives, licences, relevant competitors and UX references **when material to the change**. Don't waste cycles shopping for technology on a straightforward verified bug fix. If a stronger solution is practical and demonstrably better, require the worker to improve it before merge.
- Verify contracts, backward compatibility, source/revision citations, consent, data ownership, error handling, failure recovery, performance budgets, privacy, security and source/asset licences. Do not merge unreviewed model/tool supply-chain dependencies.

### Gate B — Reproducible testing (every code PR)
- Require passing CI **on the exact candidate/integrated commit** using the repository's Node 24 serial application test suite, successful TypeScript/Vite production build, Python coordination checks, plus relevant focused tests. No red, skipped, disabled or mocked-away safety tests, and no treating an older green SHA as evidence for a changed head. If the CI workflow does not run on a PR branch, merge the CI foundation first or execute an equivalent reproducible authorised validation on that exact integration commit; record the evidence and limitation.
- Actually read build/test logs (including warnings) and fix meaningful errors. Add regression tests for the real failure, preserve old paths, and challenge tests that only mirror the implementation.
- For security-sensitive changes, explicitly check owner isolation, injection, auth, consent, parser bounds, retention, cancellation and rollback as applicable. No known P0/P1 security/privacy/data-loss defect may remain on affected paths.
- Revalidate the post-merge `main` commit. If CI fails or a serious regression is detected, immediately stop further merges, isolate and revert safely on an authorised branch or use the documented recovery procedure.

### Gate C — Actual user experience and visual evidence (when UI/journey/studio changes)
- Exercise the running, **authorised** application rather than relying on component snapshots or code reading. Use a real synthetic learner account, allowed browser/device runners and the correct current build. Confirm account→reviewed source→cited lesson→KAIRO/reading→studio→practice→evidence→resume as relevant, including refresh, error/retry, keyboard, focus, captions, 200% zoom, mobile widths and reduced-motion/reading fallback.
- Capture timestamped, version-linked actual screenshots or short screen recordings **where permitted**, demonstrating success AND failure recovery; review layout, copy, visual consistency, animation and performance. Do not generate mock screenshots as proof of a real session. Remove credentials, private user info and synthetic account passwords before publishing. For 3D and speech, measure actual audio/visual/clock behaviour on allowed devices; code tests are not a substitute.
- Conduct independent QA/UX critique: compare reference interfaces, identify friction, broken states and needless steps, then repair material defects and repeat the journey. Do not claim "pixel perfect" or "10/10" without real evidence. If browser/device observation is denied or inaccessible, **do not bypass it**; keep that acceptance gate open. An isolated backend/library PR can still merge if its scope does not modify user-visible behaviour and the reviewer documents the remaining UI validation dependency; a user-visible release or end-to-end feature cannot be declared fully accepted without its required real-use evidence.
- Record device/browser matrix, observed outcomes, artefact links, accessibility limits, performance baseline and untested cases.

### Gate D — Seven judging criteria (every user-facing or competition-facing PR)
Use `docs/judging-cloud-20261023/JUDGING-MATRIX.md` and latest organiser programme/rules, checked against primary sources if time-sensitive. For **Product, Creativity, Usability, Sustainability, Impact, Presentation, Intelligence**, state: affected criterion/subquestion; need; demonstrated change; actual evidence or `unknown`; limitation; next experiment. Improve the weakest real evidence, not superficial AI-generated design complexity.
- Product: does the integrated learner task actually finish, save and resume?
- Creativity: meaningful source→interaction→checked evidence, not decoration or unproven novelty.
- Usability: observed task clarity, accessibility, error recovery and readable alternatives.
- Sustainability: reproducibility, regional/privacy suitability, operation and post-credit cost.
- Impact: grounded user need and measured outcomes where available; no invented learning gains or traction.
- Presentation: truthful working demo, reference-quality screens and accessible backup.
- Intelligence: source-grounded explainable behaviour and evaluation against meaningful baseline; no imaginary trained prediction.
This assessment informs design direction; do **not** require fake numerical 10/10 scores or treat user testing, buyer interviews or measured learning gains as automatically established. A scoped improvement may merge despite broader remaining product gaps; never call the whole category complete.

### Gate E — Integration and launch-readiness (every candidate that changes integration)
- Verify feature branches merged in correct **dependency** order, no hidden duplicate features, source contracts and shared narrator stable, and no regressions to current hosted/private identity boundaries.
- Use a permitted synthetic **staging / preview launch** to test boot, route/access and actual learner use *only when one already exists or its provisioning is specifically approved*. A staging launch with dedicated least-privilege synthetic data must not be mistaken for permission to deploy production or change IAM.
- Check resource and provider usage/cost limits; collect reproducible build artifact SHA, environment config contract, rollback instructions and known limitations. Production promotion requires separate explicit approval.
- A backend-only, docs, or tooling PR need not obtain unrelated full human/device/market evaluations; note them as product-level gates in the roadmap. Do not let missing upstream dependencies or a failed relevant check be waived merely to increase throughput.

## Required coordinator merge record
Before invoking merge, leave a comment on the actual PR:

```text
KAIRO CONDITIONAL MERGE DECISION
PR/head/base: <links + immutable SHAs>
Scope & issue/owners: <exact changed areas, claim resolution>
Reviewers: <independent names/session identifiers and findings>
CI & tests: <exact run URLs, commands, pass/fail/skip>
User experience: <actual test environment/device, screenshot/video link if applicable, or N/A with justification>
Judging review: <seven criteria affected, concrete evidence, unknowns>
Security/privacy/operational impacts: <risks, mitigations>
Dependencies: <stacked order and compatibility>
Rollout: merge-to-main only; deployment separately approved?
Rollback: <safe recovery steps>
Decision: ACCEPT / RETURN FOR REPAIR / BLOCKED
Why: <short evidence-backed rationale>
```

Only `ACCEPT` with all applicable gates satisfied authorises the coordinator to merge. Then confirm `main` CI, update issue/handoffs/backlog and assign the next independent ready task. If verification is unavailable, say `BLOCKED` or merge a narrower internal prerequisite PR whose quality gates truly pass; do not fake acceptance.

## First-wave practical order
1. Fix integration stack: [PR #17](https://github.com/LethaboMH14/KAIRO/pull/17) → [PR #15](https://github.com/LethaboMH14/KAIRO/pull/15) → [PR #1](https://github.com/LethaboMH14/KAIRO/pull/1), resolving target/ref status and retesting final commit. Existing green CI on child PRs does not make parent PR #1 green.
2. Review compatibility of multi-source contract/UI [PR #22](https://github.com/LethaboMH14/KAIRO/pull/22) and [PR #26](https://github.com/LethaboMH14/KAIRO/pull/26) against actual authenticated journey. Do not confuse independent helpers with live feature completion.
3. Evaluate isolated privacy, QA, speech, index, careers, studio and cloud PRs with relevant gates and actual evidence. Merge small independently tested foundations without holding them hostage to unrelated untested full-product goals; require real-use proof for features that change the learner experience.
4. Keep release/judge usability, access, language, pricing and evidence gaps open and continue planned work. Authorised merges are intended to keep development moving; do not interpret this as a green light for unbounded spending or continuous agent execution.

## Administration
This instruction is recorded from the owner's 25 October 2026 chat request. Until this file is merged, the same policy is posted on the coordinator/release issue as an immediate remote directive. Repository branch protection, applicable GitHub permissions and provider restrictions continue to apply; if they block a merge, report it, do not circumvent them.
