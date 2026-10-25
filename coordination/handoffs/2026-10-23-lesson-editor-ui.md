# Worker B handoff: stateless lesson block editor UI

**Session:** `codex-editor-ui-20261023-b`  
**Client/model/effort:** Codex / GPT-6 / unknown  
**Task:** `EDITOR-UI-001`  
**Scope:** `studio/src/lesson-editor-ui/`, `studio/tests/lesson-editor-ui.test.mjs`, `docs/lesson-editor-ui/`, this handoff.

## Result

Added the default `LessonBlockEditor` component and its scoped stylesheet. It consumes Worker A’s published types via type-only imports and emits controlled `DraftAction` callbacks. It supports lesson title and block title/text edits, layout selection, block selection, reflection creation, cursor-based splitting, movement and deletion. New reflection/split IDs use `block-` plus `crypto.randomUUID()`.

It labels source, generated and authored provenance and displays citation IDs without inventing source previews. Scored question text is read-only and its event handler refuses direct text-edit calls; its title stays editable, split is disabled, and learners can add an ungraded reflection. Busy state disables controls and guards callbacks. The layout adapts from a block rail beside the lesson paper to a stacked mobile view, with 44px minimum action targets and keyboard focus styling.

## Judging map

See `docs/lesson-editor-ui/README.md` for the criterion/subquestion, learner need, acceptance check and evidence/gap record for all seven criteria. Evidence supports implemented component behavior and local checks only. It does not establish host persistence, complete journey, human/device accessibility, visual acceptance, learning gains, traction, or market impact.

## Verification

- `cd studio; node --test tests/lesson-editor-ui.test.mjs` — **10/10 passed**. Vite SSR loaded the actual component; checks rendered markup and invoked input, selection, layout, move, delete, split, reflection, busy, and question guards.
- Focused strict TypeScript check of `src/lesson-editor-ui/LessonBlockEditor.tsx` — **exit 0**.
- Workspace-wide TypeScript check — **exit 1** on `lesson-draft-core/model.ts:91` and unresolved in-progress imports `lesson-editor-host/LessonEditorHost` and `original-material-ui/OriginalMaterial`. No diagnostic names the Worker B source.
- No browser, screenshot, device, network, cloud, or learner validation was performed. The Vite dependency-scan shutdown warning may appear as SSR closes; the focused suite itself passes.

## Host integration

Import the default component from `studio/src/lesson-editor-ui/LessonBlockEditor.tsx` and provide the contracted `draft`, `onAction`, `busy`, `selectedId` and `onSelect` props. The host remains responsible for applying actions, validating the entire draft against the immutable lesson/source, preserving question associations and progress, undo/version history, persistence and live preview. Add the component to the parent-owned host only after its safety and source-revision checks are in place. Browser/device and end-to-end acceptance remain open.
