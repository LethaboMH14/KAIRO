# Issue #49 — static-head misconception challenge, remote handoff (26 Oct 2026)

Session: gpt6-i49-static-head-20261026-t11. Model: GPT-6; effort setting unknown. Branch: feat/issue49-pump-static-head-20261026-t11. Base: main fc03149be570cb1bbf4b663f612c3fcbd28f0c76. Scope is five newly added files only: studio/src/studio-scenarios/pump-static-head-trap-20261026/{model.mjs,app.mjs,preview.html}, studio/tests/pump-static-head-trap-20261026.test.mjs, and this handoff.

GitHub Issue #49 has a cooperative remote scope notice; the canonical owner's local SQLite bus is inaccessible here. No atomic local claim was made. Coordinator must reconcile before integration. PR #55 owns the original pump-what-if subtree and dedicated test; neither was touched. PR #53 remains open/unmerged, so no Kaggle work occurred. PR #54 closed unmerged; the draft #96 pilot is not a verified active model runner.

## Learner need and model invariant

A learner may wrongly apply speed-affinity flow scaling to an operating point with significant fixed static lift. This standalone exercise asks for a prediction and written explanation before revealing a deterministic trace, comparison bars and accessible numeric reading table. Round 1 uses modest fixed lift; round 2 uses higher fixed lift. Both offer 80% or 90% hypothetical speed. Predictions and explanations remain separate between the two rounds.

Fictional educational curves (Q in litres/second; H in metres):
- Pump head: H_p = 36*r^2 - 0.012*Q^2.
- System head: H_s = S + 0.010*Q^2; S is 6 or 24.
- Positive-flow intersection exists only if 36*r^2 > S. Otherwise the simplified model has no positive-flow intersection. For positive flow Q = sqrt((36*r^2 - S)/0.022).
- Naive speed-scaled baseline flow is displayed for comparison but is not substituted for the system-curve intersection.

Concept source: Hydraulic Institute, Pump Curves / Affinity Rules, https://datatool.pumps.org/pump-fundamentals/pump-curves (checked 2026-10-26). The source supports affinity relationships, not these invented coefficients. No real equipment has been measured, controlled, validated or recommended. No positive-flow intersection does not mean zero motor power or establish physical safety. Independent engineering/domain review is required.

## Interface and ownership

Standalone Vite development preview at /src/studio-scenarios/pump-static-head-trap-20261026/preview.html. Native controls, focus recovery, mobile layout, reduced-motion CSS, explanatory SVG with a full numeric reading table. No shared router, global CSS, existing scenario, auth, package/lockfile, cloud service, IAM or production deployment was changed. Not mounted in authenticated learner app.

Local optional JSON contains only chosen ratio, prediction and learner-entered explanation, plus pinned version/source revision and explicit local-unverified evidence status. It cannot assert calculated outputs, scores, authenticated ownership or competence. Import validates size, schema, numeric bounds, attempt order and revision; replay recomputes results. No server calls, credentials or private learner material.

## Tests and honest limits

Local Node 22.16.0: node --test tests/pump-static-head-trap-20261026.test.mjs, 14 passed / 0 failed, covering curve algebra, no-intersection, monotonicity, independent attempts, forged result rejection, strict JSON and static HTML accessibility labels. This is not browser/device acceptance. Node24 full repository suite, production Vite build and Python coordination tests must be verified on the exact PR head in GitHub Actions. Record the run SHA and logs before claiming success.

Actual authorised browser, keyboard, screen-reader, mobile and 200%-zoom checks: NOT RUN. Human learning gains, assessed mastery, Kaggle-hosted training and deployment: NOT CLAIMED.

## Judging criteria and next dependency-ready work

Product: standalone complete predict -> reveal -> second attempt -> local save/replay, not authenticated integration. Creativity: reveals difference between affinity curves and fixed-lift operating point. Usability: keyboard/reading design, device evidence pending. Sustainability: deterministic offline compute with no paid inference; operational cost unmeasured. Impact: plausible conceptual misconception, no measured learning improvement. Presentation: explainable trace and 2D view, no authorised screenshot. Intelligence: deterministic mathematical explanation, not learned prediction.

1. Independent domain and accessibility review of this exact diff, plus authorised browser/keyboard/200%-zoom observations. Fix any meaningful defects before acceptance.
2. After #34 policy gates and canonical-bus reconciliation, router/evidence owners can reserve a new, separately reviewed authenticated lesson/source-revision and saved-progress integration scope. Re-run exact integrated CI and device checks. No worker self-merge or production deploy.
