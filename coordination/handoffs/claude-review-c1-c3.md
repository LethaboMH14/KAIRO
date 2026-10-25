# Handoff: REVIEW-C1-C3

Agent claude-engineering-20261021-a (Opus 5.5, effort unknown), 22-23 October 2026. Scope: `docs/claude-workstreams/reviews` and this file. Nothing outside it was edited.

## Outcome

- C1 asset audit: **accepted** with owner actions. 13 of 14 hashes and 10 of 10 manifest records reproduce independently; the 14th (`kairo-teacher.glb`) was rebuilt by CHARACTER-002 after the audit. No fabricated evidence. Review: `docs/claude-workstreams/reviews/C1-asset-audit-review.md`.
- C3 media panel: **accepted as a contract and research note; the prototype's live path is broken**. 24 of 26 quoted spans verbatim (two truncated), 32 of 48 browser checks pass. Review: `docs/claude-workstreams/reviews/C3-media-panel-review.md`.

## What needs fixing

1. C3 prototype F1: the load handler re-renders and deletes the iframe, so a live player cannot work. Fix before anyone copies the code.
2. C3 F2: iframe is 174 px high at phone widths, under YouTube's 200x200 minimum.
3. C3 F3 to F6: focus lost after Enter, 16 px phone overflow, two contrast failures, validation weaker than the contract.
4. C3 contract: eight stated invariants are comments only; needs a union type and one validator with tests.
5. C3 research note: add the HTTP Referer requirement (error 153 without it), the 480x270 recommendation, and restore the dropped autoplay data-collection clause.
6. C1: provenance for `kairo-teacher.glb` and `teacher-portrait.png`; Chirp 3 HD generation record and Google terms; record the closed gaps (Rain CC-BY 4.0, Studio Small 09 CC0, Classroom CC0, engineering HDR md5) in the owners' manifests; cite by text, not line.
7. Codex: check the shipped `studio/src/media-panel` for items 1 to 3 and the Referer; carry the Rain credit with the asset if reused outside `/character`.

## Checks I ran

`node docs/claude-workstreams/reviews/checks/quote-check.mjs` (needs network; writes quote-check.json), `node studio/node_modules/typescript/bin/tsc --noEmit --strict --target es2022 docs/claude-workstreams/media-panel/media-panel-contract.ts` (exit 0), the contract-probe.ts command in that file's header (eight expected TS2578 reports), `node docs/claude-workstreams/reviews/checks/media-panel-check.mjs` (headless Edge 155, ports 4187 and 9337; offline, YouTube requests held or stubbed).

## Limits

The real YouTube player was never contacted, so playback, `pauseVideo`, `onStateChange`, sandbox behaviour and error 153 are untested live. No screen reader pass. Licence readings are quoted from the vendors' sites, not legal advice. The shipped Luna component was not reviewed.
