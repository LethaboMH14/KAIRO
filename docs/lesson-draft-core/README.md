# Editable lesson draft core

This pure TypeScript module converts the existing native `Lesson` shape into an editable `LessonDraft`, validates persisted or incoming draft values against the same immutable lesson, applies bounded immutable block actions, and projects a safe native lesson copy.

The draft keeps lesson ID, source ID, and source revision explicit. Explanations and worked examples carry the exact citation IDs from their native chapter. A block may claim `origin: source` only when its full text appears contiguously in cited evidence; changed prose becomes authored. Question IDs stay `question-<index>`; the prompt, options, answer key, support quote, evidence links, and full explanation remain bound to the original quiz item. A question can be reordered or removed, while wording, split, option, key, quote, and citation changes are rejected. Reflection blocks are authored notes and carry no source citation or scored answer.

Text and title edits set `origin: authored`. Split blocks keep their native chapter association in a stable child ID such as `chapter-0-explanation~block-part`; the source citations are rechecked against that chapter when validating a saved draft. If native teaching blocks remain untouched and in their original order, projection preserves the exact native chapter structure. After a teaching edit, move, split, or deletion, projection emits one readable native chapter per remaining block in current order, placing its text in the explanation field and retaining its citation IDs. This lets the legacy reader handle moved blocks and a surviving worked example without reviving deleted material. The host must mark changed material unreviewed and publish a new lesson ID with `parentLessonId`, draft version, and the full `editorDocument`; the original lesson and its index-based local progress remain untouched. Projection does not authorize overwriting the original.

The accepted draft shape rejects unknown fields, duplicate/invalid IDs, foreign evidence citations, stale lesson/source/revision identities, altered question associations, more than 40 blocks, and payloads over 128 KiB. IDs for the native lesson and source must be 24 hexadecimal characters. Text limits are 120 characters for titles and 2,400 for block text.

## Acceptance evidence

The focused suite imports the actual domain exports and covers native mapping, immutability, unknown keys, identity/revision/source citation guards, question integrity, ordering/deletion, splitting, authored reflections, resource bounds, and native projection. The recorded command and result are in [verification.json](verification.json).

## Judging evidence

- **Product — complete solution / does what it claims:** source and revision identities and citations survive edits; the check is the native projection and rejection tests. This is domain-level evidence, not a completed learner workflow.
- **Usability — easy to use / clear next action:** the shared actions express title, layout, move, remove, split, and reflection operations with validation. Automated domain tests cannot establish that the editor UI is intuitive; human/device validation remains open.
- **Intelligence — source-conditioned response and transparent policy:** question-to-source associations and answer semantics remain fixed; there is no new learner inference, prediction, or learning-gain claim.

Remaining gap: integration, storage/CAS behavior, saved-draft recovery, full UI flow, and human/device acceptance are owned outside this package and are not established by these checks.
