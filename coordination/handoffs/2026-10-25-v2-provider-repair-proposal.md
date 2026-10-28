# Handoff: PR 48 provider metadata repair proposal

Owner: `codex-luna-v2-provider-proposal-20261025-a`; client Codex; model `gpt-6.1-sol`; effort unexposed, recorded `unknown`. Scope: proposal/evidence docs only. No edits or claims on `studio/server/lesson-v2/record.mjs` or `studio/tests/lesson-v2-record.test.mjs`.

## Ownership and source state

GitHub issue #46 is open; PR #48 is open/draft at head `21d3389820cc108d9b62a4a8f8f12dc6e6d23eb8`. The PR author owns its exclusive record/test paths; review explicitly asks that owner to add the exact persisted-provider guard and negative regression. This worker did not claim those remote paths. Local canonical bus showed no matching lesson-v2 claim, but the PR/owner review remains the governing ownership evidence.

## Need, criteria, proposal

Product and Intelligence need: stored v2 records must retain trustworthy generation-mode/provider metadata when read. The proposal requires a whitelisted provider for `cloud-v2`, allows the existing optional model field only as a nonblank string <=160 chars, forbids provider/model on local records, and rejects malformed model constructor input rather than silently dropping it. The exact unified diff and test cases are in `docs/v2-provider-repair-proposal-20261025/README.md`.

## Evidence

- Actual PR module was copied to private docs scratch; only its relative imports were rewritten to absolute file URLs for the exact PR-head dependencies. Original module source SHA-256 before path rewrites: `64601D6B27CFF82CD601723ADA312E63EAA57F9A136BA70A8E711B3C01D527BD`.
- Existing PR tests against actual PR worktree: 8/8 pass.
- Proposal scratch proof against actual original copy and patched copy: 4/4 pass. It demonstrates forged cloud provider/model and local provider/model acceptance in the original guard, and fail-closed behavior under the proposed hunk.
- No source files changed; no provider or cloud calls made.

## Remaining work

Original owner to apply the proposal in their claimed paths and rerun exact-head full CI. PR remains unmounted; route/version compatibility and provider attribution for fallback are separate open design gates. No production fix, CI rerun, merge or release is claimed.
