# Worker A handoff: lesson draft core

Date: 23 October 2026  
Agent: `codex-draft-core-20261023-a`  
Client/model/effort: Codex / GPT-6 / unknown  
Task: `LESSON-DRAFT-CORE-001`

## Scope and files

- `studio/src/lesson-draft-core/types.ts`
- `studio/src/lesson-draft-core/model.ts`
- `studio/tests/lesson-draft-core.test.mjs`
- `docs/lesson-draft-core/README.md`
- `docs/lesson-draft-core/verification.json`
- This handoff

The shared types were published early for editor integration. Exports are `DraftBlock`, `LessonDraft`, `DraftAction`, `NativeLesson`, `draftFromLesson`, `validateDraft`, `editDraft`, and `draftToLesson`.

## Behavior and decisions

`draftFromLesson` maps explanation and worked-example blocks to stable `chapter-<index>-<kind>` IDs and quiz blocks to immutable `question-<index>` associations. `validateDraft` clones accepted values, rejects unknown properties and invalid identity/revision/citation/resource data, checks chapter citation mappings, and requires block provenance to agree with whether native content was edited. A `source` origin is accepted only when the entire block text is a contiguous substring of one of its cited evidence quotes.

Question prompt, option strings/order, answer key, support quote, citation IDs and native explanation remain bound to the immutable lesson argument. Question blocks may be reordered or removed and their display title can be edited; question wording and split operations are rejected. `draftToLesson` copies original quiz records by stable ID, preserving their explanation and scoring semantics.

Split block IDs preserve their original chapter mapping as `chapter-<index>-<kind>~<newId>`. If native teaching blocks remain unchanged and in original order, projection returns the exact original chapter structure. After a teaching edit, move, split, or deletion, it emits one readable chapter per remaining explanation/worked-example block in current order, with text in the legacy explanation field and validated citations. This preserves move/delete/split behavior in the legacy reader without reviving deleted blocks or fabricating filler content. Reflections remain in the draft only and never create questions or evidence.

The host's publish route must assign a new lesson ID, `parentLessonId`, draft version, and full `editorDocument`; the original lesson record and its numeric-index local progress stay intact. Projection itself preserves identity for adapter checks and does not authorize replacing the original.

## Criteria, need, acceptance and evidence

- **Product: complete solution / does what it claims.** Need: a learner's edits must remain tied to the reviewed source version and must not silently change assessment meaning. Acceptance: actual exports preserve lesson/source/revision identity, evidence IDs, and stable question associations through edits, moves, splits, and deletion. Evidence: `studio/tests/lesson-draft-core.test.mjs` (8/8) and `docs/lesson-draft-core/verification.json`.
- **Usability: clear/simple next action and recovery.** Need: editor operations should have bounded, explicit domain actions and reject unsafe changes. Acceptance: immutable edit actions cover layout, title, move, delete, split, and reflection with tested validation. Evidence: same focused suite. UI clarity and device accessibility remain untested here.
- **Intelligence: source-conditioned interaction with transparent policy.** Need: safe practice must remain attached to its original source anchor and key. Acceptance: changed prompts/keys/quotes/citations reject; native quiz explanations remain unchanged. Evidence: same focused suite. No prediction or learning gain is claimed.

## Checks

- `node --test tests/lesson-draft-core.test.mjs` from `studio`: pass, 8 tests, 0 failures.
- Focused strict TypeScript check of the two owned source files: pass, 0 diagnostics. Exact command is recorded in `docs/lesson-draft-core/verification.json`.

## Remaining work and limits

The root owns server routes, source/workspace host, published lesson identity and the reader integration. Durable draft storage/CAS, UI integration, resume behavior, browser/keyboard/device acceptance, and human learner validation are not established by this package. Domain tests are not release acceptance or educational validation.
