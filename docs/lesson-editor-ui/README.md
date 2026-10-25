# KAIRO lesson block editor UI

Worker B delivers a stateless editor surface in `studio/src/lesson-editor-ui/`. The default `LessonBlockEditor` accepts the published `LessonDraft` and `DraftAction` types, renders controlled title/text fields and source-link IDs, and reports each edit to its host through `onAction`. It does not save, load, route, or retain lesson documents.

Scored question text is read-only in this slice so a learner cannot change a prompt while leaving its native answer key in place. The block heading can still be edited. Questions cannot be split; a learner can add a separate reflection. Source-link IDs and provenance remain visible while editing.

## Judging evidence

| Criterion | Learner need and acceptance check | Evidence and remaining gap |
|---|---|---|
| Product | Make a source-grounded lesson easier to shape without breaking the host’s lesson identity. | Implemented controlled title/block/layout actions and visible source-link IDs; the host must validate and persist each action. End-to-end editing and resume are not established here. |
| Creativity | Break a difficult explanation into smaller readable pieces. | Split emits a new `block-` + `crypto.randomUUID()` ID and the selected cursor offset. No learning benefit has been measured. |
| Usability | Find a block, edit it, reorder it, or recover from a busy state with keyboard-accessible controls. | SSR and direct-handler checks cover selection, edits, moves, deletion and busy guards; keyboard and touch behavior still need human/device review. |
| Sustainability | Reuse the same UI with the host’s versioned lesson model. | Imports Worker A’s shared types only and has no package changes; route integration and long-term support remain open. |
| Impact | Help learners keep a complex lesson organized and return to their work. | The UI supports lightweight edits and preserves citations in emitted actions; no learner study, return-use evidence, or learning outcome is claimed. |
| Presentation | Keep the editing surface recognizable as KAIRO and clear to a reviewer. | Implemented a KAIRO wordmark, moss/sage/paper palette and Manrope stack; human visual review remains pending. |
| Intelligence | Keep source provenance visible and protect scored practice semantics. | Source/generated/authored labels render; question text is read-only and direct text-edit events are guarded. Domain validation and unchanged native quiz semantics remain Worker A/host responsibilities. |

## Verification

- `node --test tests/lesson-editor-ui.test.mjs` — **11/11 passed**. The suite loads the actual TSX component through installed Vite SSR, renders HTML, and invokes component event handlers with synthetic inputs.
- Focused TypeScript check on `src/lesson-editor-ui/LessonBlockEditor.tsx` with the project’s strict ES2022/DOM/React settings — **exit 0**.
- Workspace-wide `tsc --noEmit --pretty false` — **exit 1** on `lesson-draft-core/model.ts:91` and unresolved in-progress imports `lesson-editor-host/LessonEditorHost` and `original-material-ui/OriginalMaterial`. No diagnostic names the editor UI file.
- No browser, screenshot, device, network, cloud, or learner validation was run. The Vite SSR dependency-scan shutdown warning can appear while the test server closes; the focused suite completed successfully.

The layout option is labeled **Practice focus** to match the host’s current behavior, which emphasizes question cards. Reflection blocks cannot be split into scored content. The lesson heading is an `h2` so it nests under the host page heading.

Source tests: `studio/tests/lesson-editor-ui.test.mjs`. Integration remains with the host owner.
