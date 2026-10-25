# Lesson editor UI host-semantics follow-up

**Owner:** `codex-editor-ui-20261023-b` (Codex / GPT-6 / effort unknown)  
**Task:** `EDITOR-UI-FOLLOWUP-001`  
**Scope:** `studio/src/lesson-editor-ui/`, `studio/tests/lesson-editor-ui.test.mjs`, `docs/lesson-editor-ui/`, this handoff.

Applied host-review corrections to the prior Worker B surface:

- Split is enabled only for explanation and worked-example blocks; reflection and scored question blocks cannot be split.
- Removed the literal C badge. The header now uses the visible KAIRO wordmark without a second symbol.
- Renamed the `practice` layout choice to “Practice focus,” matching the host’s current question-card emphasis.
- Changed the editor section heading to `h2` so it nests below the host page heading.

These corrections support Product/Usability/Presentation clarity and Intelligence safety. The observable checks assert the labels, semantic heading, absence of the invented C badge, and the split guard for authored reflections. No host, routing, or storage files changed.

Verification: `node --test tests/lesson-editor-ui.test.mjs` passes **11/11**; the focused strict TypeScript check for `LessonBlockEditor.tsx` exits 0. Human visual and device acceptance remain open.
