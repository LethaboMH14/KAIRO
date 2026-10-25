# Worker E: edited reading copy-out

**Session:** `codex-edited-copyout-20261023-a` (Codex, GPT-6; effort unavailable/unknown)  
**Claim:** `EDITED-COPY-OUT-001`  
**Criterion and need:** Product and Usability — learners need a saved copy that retains the edited teaching order, reflections and source traceability when they leave the live lesson.

## Changes

- `studio/src/continuity/model.ts` adds optional safe `editedReading` projection, validation and Markdown serialization. It preserves the recorded layout, ordered block kinds, text, options and citation IDs, and strips editor-only fields, answer keys and support quotes. Validation is bounded to 40 blocks and 128 KiB and accepts native split IDs containing `~`, `.` or `:`.
- `studio/src/continuity/LearningHome.tsx` renders saved edited blocks in order, labels block kinds and personal reflections as ungraded, displays layout metadata, options and citation IDs, and labels source passages with available citation IDs.
- `studio/src/continuity/continuity.css` styles the added reading projection.
- `studio/src/workspace/learning.ts` exports the edited projection while retaining existing progress/attempt and exact source passage output.
- `studio/tests/edited-copy-out.test.mjs` executes the actual save → parse → Markdown/export flow, plus legacy and hostile-input cases.
- `docs/edited-copy-out/README.md` records the behavior and evidence.

`packMarkdown` source passage headings now prefix citation IDs when present; citation-less legacy packs keep the prior locator-only heading. The saved page remains a simple linear reading view and says which original arrangement was recorded. Existing lesson progress remains separate from device reading notes.

## Evidence

- `node --test tests/edited-copy-out.test.mjs` — **3/3 passed**, Node v24.18.0.
- Covers edited published-copy fixture → `addReadingPack` → `parseMemory` → `packMarkdown` / `exportNotes`, including split ID, order, options without key/supportQuote, ungraded reflection, resolvable citation IDs, notes, attempt records, source quotes, legacy pack behavior, unknown/executable fields, foreign citations, 41 blocks and oversized UTF-8 text.
- Root reports aggregate suite **525/525 passed**; root-owned production build/typecheck is running. A standalone narrow tsc invocation encountered unrelated installed dependency declaration issues (`GPUTexture`, `ReactSVG`); after allowing `.ts` imports it reported no Worker E source diagnostic.

## Remaining gaps

Automated data-path and rendering-source checks do not establish human/device usability, screen-reader acceptance, learner outcomes or production readiness. The copy remains browser-local under existing continuity semantics. No browser observation, cloud/model call, deployment or dependency change was made.
