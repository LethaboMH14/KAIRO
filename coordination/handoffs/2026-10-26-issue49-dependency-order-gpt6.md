# Issue #49 — isolated dependency-order Computer Science Studio (26 October 2026)

- Session: \`gpt6-i49-dependency-order-20261026-t11\`; ChatGPT GPT-6, effort unknown.
- Starting main: \`1310eba7ef18be3ff4cf2591613474a61deb5389\`; isolated branch \`feat/issue49-dependency-order-20261026-t11\`.
- Cooperative remote scope posted to issue #49 before code. Owner-local coordination/bus.sqlite3 is **not accessible** in the GitHub connector; no local atomic claim or inbox inspection was performed. Coordinator must reconcile before integration.
- Criteria: **Product** (real practice, two rounds), **Creativity** (change a prerequisite and see consequences), **Usability** (native keyboard controls, text trace), **Intelligence** (deterministic explainable algorithm, not ML).
- Learner need: understand why adding a task dependency can reorder a schedule or block completion.
- New-only files: \`studio/src/studio-scenarios/dependency-order-20261026/{model.mjs,app.mjs,preview.html,README.md}\`; \`studio/tests/dependency-order-20261026.test.mjs\`; this handoff.
- Interface: \`solve(scenarioId,choiceId)\` recomputes alphabetical Kahn trace; \`recordAttempt\`, \`exportSession\`, \`importSession\` enforce action-only local schema, fixed source ID/revision, ordered rounds, no imported scores or certification fields.
- Domain source: https://docs.python.org/3/library/graphlib.html (prepared concept reference). Task graphs are authored fiction, not actual source-revision-linked lessons or real infrastructure instructions.
- Local test evidence: Node **22.16.0** \`node --test studio/tests/dependency-order-20261026.test.mjs\`: **14/14 PASS**, 0 failed. \`node --check\` on app/model passed. This is local fallback only; Node24 GitHub CI must be verified separately. No local npm install/full build, real browser, screen reader, keyboard device or phone test was performed.
- Source/replay limitations: JSON can be altered into another structurally valid prediction; no authenticated learner identity, tamper-proof audit, certified competence or measured learning gain. No Kaggle execution, training, provider calls, merge, deployment or IAM changes.
- Next ready task A: independent CS-domain review of graph semantics and explicit tie-break (no shared-file edits).
- Next ready task B: independent keyboard/screen-reader/200% zoom inspection of standalone preview with authorized device access; route/source/evidence integration remains **blocked** pending coordinator scope, PR #34 acceptance and separate source/security reviews.
