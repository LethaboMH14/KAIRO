# My Material lesson planning controls — handoff

Worker `codex-luna-material-planner-20261023-g`, Codex / `gpt-6-luna` / low. Task `MATERIAL-PLANNER-001`; owned the component folder, focused test, `docs/material-planner-ui/`, and this handoff.

## Delivered

`studio/src/material-planner-ui/MaterialPlanner.tsx` exports default stateless `MaterialPlanner` with structural props independent of lane A. It offers a labelled, 300-character goal, controlled depth and approach choice buttons, and up to three outline cards. Busy disables controls and guarded callbacks prevent direct handler changes. It displays exact citation locator/quote/source revision only when the host marks the overall source reviewed and the card `reviewed-source`; otherwise it tells the learner to review and save before attaching a citation. Copy labels the preview as a planning outline, not a generated lesson, and states cloud-request choices versus exact local reading.

Fixture card names and quoted passage in tests are explicitly synthetic. No generation, storage, network, provider, narrator, routing, score or model claim was added.

Judging targets: Usability (clear goal/depth/approach choices), Product (honest source-grounded outline), Creativity/Intelligence (inspectable plan without unsupported understanding claims), Impact (exact reading remains available with cloud planning unavailable). Learner need: make a purposeful next lesson plan from reviewed material, without confusing the plan with generated teaching.

## Checks

- `node --test tests/material-planner-ui.test.mjs` from `studio/`: exit 0, **9/9 passed**. Vite middleware SSR loads actual TSX; tests exercise controlled handlers and busy guards, source citation conditions, empty state, escaping, cap, and cloud-unavailable copy.
- `.\node_modules\.bin\tsc.cmd --noEmit` from `studio/`: exit 0, no diagnostics.
- No browser/device/learner checks, installs, network/cloud calls, package changes, route integration or runtime generation acceptance.

Root owns integration, source orchestration and interpretation of `cloudAvailable`. SSR does not establish keyboard focus order, responsive behavior, contrast, or actual learner comprehension.
