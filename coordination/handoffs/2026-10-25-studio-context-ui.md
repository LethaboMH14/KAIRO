# Studio context summary UI handoff

## Scope and branch

Package B owns the new `studio/src/studio-context-ui/`, `studio/tests/studio-context-ui.test.mjs`, `docs/studio-context-ui-20261025/`, and this handoff. Worktree branch: `codex/studio-context-ui-20261025`. Session: `codex-luna-studio-context-20261025-b`; actual model and effort were not exposed, so both were registered as `unknown`.

## Need and criteria

Learners need to see which lesson, selected part, variables and cited source context KAIRO can use before asking. This supports Product (contextual studio flow), Usability (plain missing/changed/unavailable states), Presentation (visible evidence basis) and Intelligence (bounded inspectable context).

## Changes

- Added a stateless `StudioContextPanel` with the published props, distinct `useId` headings, responsive layout, keyboard focus styles and KAIRO naming.
- Ask is disabled and guarded unless context is current, not busy, and has a lesson and citations. Open lesson is disabled and guarded if busy or no lesson exists.
- It does not narrate, create a question, fetch, persist, or mount itself. It complements `CoachPanel` without changing its explanation or voice controls.
- Added documented SSR and callback coverage.

## Evidence

`node --test tests/studio-context-ui.test.mjs` passed 4/4 using existing workspace Node dependencies via `NODE_PATH`; no package install or manifest change. Coverage renders the actual component through React server rendering, checks escaping and supplied context, missing context, actual callback guards, busy/unavailable states and distinct IDs.

## Remaining gaps

The isolated worktree does not have its own `node_modules`, so a worktree-local full build was not run. The focused test used already-installed local dependencies. Root owns context construction, mounting and independent review. Human keyboard/device validation, source-contract validation and end-to-end behavior remain open; passing SSR tests do not establish those outcomes.
