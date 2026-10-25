# Luna repair handoff: strict profile primitive and dense-array validation

- Session: `codex-luna-profile-integrity-20261022-a` (Codex, `gpt-6-luna`, low effort).
- Task: `LUNA-PROFILE-INTEGRITY-REPAIR-001`, a new claim after the original integrity task was completed.
- Scope: `studio/src/profile/model.ts`, `studio/tests/profile-integrity.test.mjs`, `docs/workstreams/profile-integrity.md`, and this handoff.

Root review found two input-validation gaps in the strict write projection. Format validation converted arbitrary values to strings and then retained the original value as a typed format. It now requires a primitive string directly matching `example` or `passage`. The array `.map()` validators also skipped holes in sparse arrays; strict validation now checks density for lessons, cases, nested attempts, and nested events before projection.

Regression coverage rejects boxed/coercible formats, each sparse collection, and confirms a rejected sparse write leaves the previous localStorage value unchanged and issues zero storage writes. The workstream document now records these limits.

## Verification

- `node --test studio/tests/profile-integrity.test.mjs` — 9 tests passed.
- `node --test studio/tests/practice.test.mjs studio/tests/pathways.test.mjs studio/tests/evidence-workspace.test.mjs studio/tests/progress-recovery.test.mjs studio/tests/profile-integrity.test.mjs` — 29 tests passed.
- From `studio/`: `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` — exit 0.
- No full application build or browser run was performed; root owns aggregate verification.

Browser storage remains user-editable and strict parsing does not establish trustworthy authorship. PracticeStudio's independent read-failure export fallback remains a separate bounded repair.
