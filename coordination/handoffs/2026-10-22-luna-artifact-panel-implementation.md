# Static artifact validator handoff

**Task:** `ARTIFACT-PANEL-001`  
**Session:** `codex-luna-artifactpanel-20261022-a`  
**Model/effort:** Codex `gpt-6-luna`, low  
**Scope:** `studio/src/artifact-panel/contract.ts`, `studio/tests/artifact-panel.test.mjs`, `docs/workstreams/static-artifact-contract.md`, and this handoff.

## Delivered

Implemented a pure strict validator/projector for schema version 1 `text` and `table` artifact records, following the approved subset in `coordination/handoffs/2026-10-22-heartbeat-0147.md`. It checks exact own-data object shapes, conservative identifiers, UTF-8 lengths, Unicode validity, dense primitive arrays, table dimensions and total serialized envelope size. It projects known fields into fresh objects and returns safe reason codes on refusal. Provenance remains caller-claimed metadata and is not independently resolved or verified.

The validator does not stringify input until after all field and structure checks; only the fresh projection is serialized for the final byte limit. Tests cover normal cases, unknown/missing/mismatched fields, accessors, coercions, exotic objects, symbol keys, sparse/decorated arrays, invalid Unicode, identifier/page errors, bounds and throwing proxy traps.

## Checks and limitations

From `studio/`, `node --test tests/artifact-panel.test.mjs` passed 7/7, and a scoped strict TypeScript check of `src/artifact-panel/contract.ts` passed with the installed compiler and `--skipLibCheck`. The repository context did not provide a verified Git diff-check result, so none is claimed. No renderer, iframe, image loader, network, persistence, route, manifest or browser sandbox work is included. This validator is not a security isolation claim; root owns future UI integration and browser acceptance.

## Next step

Root should review the exact projection and limits before consumer integration. Future renderer work must use text nodes/React escaping and retain independent payload/rendering bounds. Additional media and interactive artifact variants need separately reviewed contracts.
