# Issue #49 — isolated BFS path-trace Studio handoff (25 October 2026)

Session: `gpt6-kairo-bfs-20261025-1104-e`; ChatGPT, GPT-6, effort unknown. GitHub connector remote branch `worker/issue-49-bfs-path-20261025-e` from main `0fabfdf9b8515cab8ff4100228a6a1df672491c6`. Cooperative claim posted to #49; **canonical local SQLite bus not accessible**, no bus claim or local heartbeat asserted.

## Scope and need

Only newly created `studio/src/studio-scenarios/bfs-path-trace/**`, `studio/tests/bfs-path-trace.test.mjs`, and this handoff. Does not touch pump lab/what-if PR #55, HTTP PR #57, binary-search PR #58, SQL JOIN PR #60, Kaggle PR #56, runner #54, #9 acceptance, shared routing, global CSS, lesson contracts, package manifests, credentials or production infrastructure.

Judging: **Product** (actual runnable learner action), **Usability** (native HTML and text/keyboard), **Intelligence** (validated deterministic trace and reasoned attempt). User need: understand why FIFO BFS gives a shortest *fewest-edge* path in a directed, unweighted graph, including unreachable destinations and tie cases.

## Source, evidence and acceptance

Prepared public concept: MIT OpenCourseWare 6.006, Spring 2020, [Lecture 9: Breadth-First Search](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/resources/lecture-9-breadth-first-search/). This is a prepared concept, **not a reviewed learner upload**, and code does not reproduce copyrighted lecture text.

Five bounded authored graphs (branching, cycle/self-loop, disconnected, start=goal, tied shortest paths). Learner selects graph, predicts hops/unreachable and explains, then advances a deterministic queue trace and records up to two different local attempts. Source revision/model version and prediction are recorded locally, explicitly marked `local-unverified`. Shortest path verified against an independent simple-path enumeration oracle; no account writes, network, 3D, recording or hosted service.

Standalone preview: from `studio`, `npm ci` then `npm run dev`; open `/src/studio-scenarios/bfs-path-trace/preview.html`. This preview does not create an authenticated route. Tests: `cd studio && node --test --test-concurrency=1 tests/bfs-path-trace.test.mjs`, then full `node --test --test-concurrency=1 tests/*.test.mjs` and `npm run build`. Python coordination: `python -m unittest discover -s coordination -p test_bus.py -v`. Record actual CI run/commit separately, not a promise.

## Remaining gates

- Independent CS review: BFS queue/visited/parent invariant, directed arrows, shortest-path tie explanation, unweighted-only boundary.
- Independent accessible keyboard/screen-reader/mobile/zoom review in an authorised browser/device; SSR semantics alone are not user validation.
- Coordinator/local owner reconcile canonical SQLite bus scopes; then review #34 conditional merge policy and exact-head CI before any merge.
- Owner-scoped source/revision/attempt contract with #46/#47 must be separately agreed before StudioRouter/lesson integration. Do not label these local attempts as authenticated KAIRO evidence or measured learning gains.
- Kaggle hosted training **NOT EXECUTED**.

NEXT 1: independent review of #55/#57/#58/#60 and this PR for educational/UX correctness and host integration readiness.
NEXT 2: coordinator-approved shared owner/revision-bound attempt persistence adapter after #46/#47, with exclusive shared interface claim.
