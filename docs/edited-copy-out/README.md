# Edited lesson copy-out

The device reading pack keeps the published lesson's edited block order and kinds in an optional `editedReading` projection. It validates the projection at save and reopen, bounds it to 40 blocks and 128 KiB, accepts native block IDs (including split IDs with `~`, `.` or `:`), and emits only learner-facing text, titles, layout, options and known citation IDs. Question answer keys and support quotes are validated as needed for safe extraction, then omitted from the saved projection and exports.

Saved copies use a linear reading page. The recorded Reading, Split view or Practice arrangement is shown as metadata; it does not imply the original interactive layout was reconstructed. Personal reflections are labelled ungraded. Source passage labels include their citation IDs so a block's references resolve in the same download. Existing packs without `editedReading` retain the previous chapter rendering and Markdown format.

`exportNotes` keeps its existing lesson progress argument and preserves the separate quiz attempt record, reading notes and source passages. Device reading notes remain separate from lesson quiz progress.

## Evidence

- `studio/tests/edited-copy-out.test.mjs`: actual `addReadingPack` → `parseMemory` → `packMarkdown` and `exportNotes` path; split ID, block ordering, question option/key handling, reflection label, citation labels, preserved notes/attempts/source quotes, legacy pack compatibility and hostile/oversized input rejection.
- Focused result: `node --test tests/edited-copy-out.test.mjs` — 3/3 passed on Node v24.18.0.
- Root reports aggregate suite 525/525 passing and production build/typecheck running under root ownership. A separate narrow tsc command was inconclusive because installed dependency declaration errors (`GPUTexture`, `ReactSVG`) surfaced; no Worker E source diagnostic remained after allowing `.ts` imports.

## Acceptance boundary

This is automated local data-path evidence. It does not establish browser/device usability, accessibility acceptance, learner outcomes, or production deployment readiness. It supports Product and Usability by preserving an edited lesson in the learner's saved copy; the observable checks are safe ordered projection, readable labels, citation resolution, and legacy compatibility.
