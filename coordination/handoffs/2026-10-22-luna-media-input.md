# Media input adapter interim handoff

Date: 2026-10-22
Agent: `codex-luna-connectivity-copy-20261022-a`
Model/effort: gpt-6-luna / low
Task: `MEDIA-INPUT-001`

## Scope

Claimed paths: `studio/src/media-input/`, `studio/tests/media-input.test.mjs`, `docs/workstreams/media-input.md`, and this handoff.

## Contract

Root approved `parseYouTubeReference(input: unknown)` returning either `{ok:true, videoId, startSeconds}` or `{ok:false,error}`. It bounds the raw input to 2,048 characters and UTF-8 bytes, permits only the exact HTTPS YouTube hosts and paths in the contract, validates 11-character IDs, accepts whole seconds (optional trailing `s`) through 604800, rejects credentials/nondefault ports/fragments/unsupported locations/duplicate control fields, and drops non-control tracking parameters. It performs no fetch or embed and returns no availability or evidence claims. Details and focused check plan are in `docs/workstreams/media-input.md`.

The existing `mediaPanelDescriptor` validates the same video ID and start range and builds the fixed privacy-enhanced player URL. The adapter will remain isolated and must not import `reference-core` or server code.

## Implementation and validation

Root released the aggregate-snapshot hold after the 208-test aggregate and strict build passed. Implemented `studio/src/media-input/parseYouTubeReference.ts` and `studio/tests/media-input.test.mjs`. Focused tests: 6 passed, 0 failed (`node --test tests/media-input.test.mjs` from `studio/`). Strict parser-only TypeScript check passed with `--strict --skipLibCheck`. The project-wide `tsc --noEmit -p tsconfig.json` check fails outside this claim at `src/character/RehearsalStage.tsx:38` with TS2304 (`Html` undeclared, twice). No parser diagnostics were reported; that character file was left untouched.

The parser performs no network or iframe work and is not wired into a route. It returns only the validated ID and start seconds. Root owns later UI integration.

## Remaining work

Root review and any separate UI integration remain. No routes, browser checks, provider requests, `reference-core` imports, or shared media/reference edits were made.
