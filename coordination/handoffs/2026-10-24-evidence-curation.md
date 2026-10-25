# Selected evidence curation UI handoff

**Task:** `EVIDENCE-CURATION-20261024-001`  
**Owner:** `codex-luna-edited-lesson-review-20261023-a` (Codex, `gpt-6-luna`, `light`)  
**Scope:** `studio/src/evidence-curation-ui/`, `studio/tests/evidence-curation-ui.test.mjs`, `docs/evidence-curation-20261024/`, this handoff.  
**Status:** implementation complete; parent integration/review pending.

## Learner need and judging target

“I can show a few pieces of work without sharing everything or making a CV first.” Improves **Usability** through selection, ordered preview and one explicit action; **Product** through a focused selected-evidence surface; **Impact** by allowing evidence selection without requiring institutional identity or a CV. No learner testing or outcome claims.

## Interface and behavior

Default export `EvidenceCuration`, named type `EvidenceCandidate`, props `{items, storageLabel, onExport}`. Select up to six items, reorder/remove in a preview, preserve claim labels and call the provided `onExport(selectedIds)` only after an explicit enabled “Download selected work” action. State is ephemeral in the mounted component. No storage/network/publishing/provider/router side effects. Parent owns actual item mapping, truthful storage audience and download behavior.

## Changed files

- `studio/src/evidence-curation-ui/EvidenceCuration.tsx`
- `studio/tests/evidence-curation-ui.test.mjs`
- `docs/evidence-curation-20261024/README.md`
- `docs/evidence-curation-20261024/verification.json`
- `coordination/handoffs/2026-10-24-evidence-curation.md`

No root shared contracts/manifests/router/provider/profile records or other worker files changed.

## Checks

- `node --test tests/evidence-curation-ui.test.mjs` from `studio/` — passed, 8 tests, 0 failures. Uses installed Vite to load and SSR-render the actual component; event tests invoke actual element callbacks with ephemeral React state, including cap, reorder, remove and exact export IDs.
- `node_modules/.bin/tsc --noEmit -p tsconfig.json` from `studio/` — not passed. Existing installed type environment reports TS2688 for implicit `jsonwebtoken`, `ms` and `node` type definition files. No install or bypass was attempted.
- `docs/evidence-curation-20261024/verification.json` records these commands and limitations.

## Limits / parent action

This has only synthetic fixtures, static Node SSR and a React element callback harness. It is not browser/device/keyboard/screen-reader acceptance. Parent mounts under My work, passes actual data/storage label, and connects the existing export function. No employer publish, link, verified badge, credential verification or confidentiality guarantee is implemented. Parent review/integration remains required.
