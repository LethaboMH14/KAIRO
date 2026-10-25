# Worker A handoff: learning FlowRail

Date: 24 October 2026  
Owner: `codex-flow-rail-20261024-a`  
Client/model/effort: Codex / `gpt-6` / `unknown`  
Task: `LEARNING-FLOW-RAIL-001`

## Need and criterion

Learners need a clear location in the material → lesson → studio → evidence → direction path, with their module and lesson context visible. This improves Product journey clarity, Usability, Sustainability through a reusable stateless component, and Presentation through the selected KAIRO identity and plain labels.

## Changes and interface

- `studio/src/learning-flow-ui/FlowRail.tsx` exports default `FlowRail` and `FlowStage` as specified in the shared contract. Props are `current`, optional `moduleLabel`/`lessonTitle`, and caller-supplied `items`.
- `studio/src/learning-flow-ui/flow-rail.css` provides compact Chalk/Moss/Ink styling, visible focus, responsive wrapping and reduced-motion-aware transition.
- `studio/tests/learning-flow-ui.test.mjs` loads the actual TSX through Vite SSR and checks safe links, current-stage semantics, unsupported destinations and escaping.
- `docs/learning-flow-ui-20261024/README.md` records the criterion, learner need, evidence and remaining gaps.

Only single-slash app-relative destinations without control characters or backslashes become anchors. Protocol-relative and external URLs, malformed paths, and missing links remain noninteractive text. The component has no router, provider, state, fetch, storage, browser-global usage or added dependencies.

## Checks and actual evidence

From `studio/`, `node --test tests/learning-flow-ui.test.mjs` completed with **4 passed, 0 failed**. The first test invocation accidentally used the package script's repository-wide glob; that run was interrupted and is not evidence. The direct focused command is the recorded result. An initial Vite dependency-scan shutdown warning was eliminated by setting `optimizeDeps.noDiscovery` and empty entries in this isolated SSR harness.

## Remaining work and limits

Root owns integration and must pass actual module-aware destinations, connect the rail to the appropriate routes and verify return-to-lesson/evidence context, then run aggregate build/integration acceptance. SSR is not browser or device evidence. Keyboard/device usability, human validation, learning impact, traction and official judging results remain untested. This component does not claim them.
