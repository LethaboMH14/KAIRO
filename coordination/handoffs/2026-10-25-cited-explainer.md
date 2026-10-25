# Handoff: cited explainer reading UI

Owner: `codex-luna-cited-explainer-20261025-a`; client Codex; model `gpt-6.1-sol`; effort unexposed, recorded `unknown`. Isolated worktree `.worktrees/cited-explainer-wave`, branch `codex/cited-explainer-20261025`, based on fetched `main` SHA `1997ba9f046f6d4122169cb26a72e89cc60befd1`.

## Scope and criteria

New files only: `studio/src/cited-explainer-ui/model.ts`, `CitedExplainer.tsx`, `cited-explainer.css`; `studio/tests/cited-explainer-ui.test.mjs`; `docs/cited-explainer-ui-20261025/README.md`; this handoff. Criteria Product, Usability and Presentation. Learner need: source-linked text reading with an optional shared narrator, complete passages, simple controls and clear limits. Acceptance is bounded validation, paused-by-default code-rendered motion, citations visible, text alternative, reduced-motion support and cancellation boundaries.

## Implementation

The component displays one exact passage card with source title and locator, while an expandable view preserves all supplied text. It provides play/pause, previous/next, text-only toggle and explicit shared-reader action. It makes no fetch/storage/export/provider calls and inserts content as React text. The timer estimate is clamped to 4–15 seconds based on 150 wpm. Lesson/revision changes reset the index; navigation/pause/unmount call `onStop`. OS reduced-motion preference initializes a still presentation and prevents requesting motion while active.

This is code-rendered text animation, not a generated video or simulation. No narrator is auto-started. No changes to host, router, provider or source runtime.

## Checks and remaining gaps

- `node --test studio/tests/cited-explainer-ui.test.mjs`: 7/7 passed, including actual React SSR, escaping, invalid data, exact citation text, and reduced-motion initialization.
- Focused TypeScript check of `model.ts` and `CitedExplainer.tsx`: passed.
- `git diff --check`: passed.
- Browser/device, keyboard assistive-tech and human learner validation remain open; root owns SourceClassroom integration and review.
