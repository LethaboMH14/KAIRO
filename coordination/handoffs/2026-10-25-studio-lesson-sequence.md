# Handoff: cited studio lesson sequence

Owner: `codex-luna-studio-sequence-wave-20261025-a` (Codex; model `gpt-6.1-sol`; effort unexposed, recorded as `unknown`). Worktree: `.worktrees/studio-sequence-wave-a` at base `a2dfc4f10499bcd32ac45548fc6767094b26c8d2`.

## Scope and criteria

Package A improves Product (coherent cited activity), Usability (same-action reading fallback), Creativity (actions linked to real studio affordances) and Intelligence (source/capability boundaries). Learner need: understand what to do and inspect exact supporting records instead of seeing decorative 3D. Acceptance: both packs project without provenance loss; missing refs reject; focused tests pass.

## Changes

- `studio/src/studio-lesson-sequence/index.ts`: dependency-free pure projection/validation for the existing v1 pack schema.
- `studio/tests/studio-lesson-sequence.test.mjs`: actual motor and pump pack tests plus malformed pack cases.
- `docs/studio-lesson-sequence-20261025/README.md`: observed schema, projection boundary, evidence and gaps.

The output contains title/objective/prerequisites, sequence steps (id/title/explanation/prompt/sourceRefs/capabilityStatus/readingFallback), and warnings. It carries full existing citation records and pack limitations. It does not project `practice` or `evidencePrompt`, so it must not be treated as a complete pack export. Declared capabilities are not verified availability; Pump Lab is explicitly not mounted. No existing pack, host, physics, provider, router or manifest was changed.

## Checks and remaining work

- `node --test studio/tests/studio-lesson-sequence.test.mjs`: 6/6 passed against actual packs. Vite emitted a dependency-scan shutdown warning after tests while closing SSR.
- Browser/device, route integration, and human learner validation remain open.
- Root to review and integrate; no deployment or readiness claim.
