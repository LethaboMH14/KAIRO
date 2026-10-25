# Pathway practice links handoff

- Task: `LUNA-PATHWAY-LINKS-001`
- Agent/session: `codex-luna-pathwaylinks-20261022-a` (Codex, gpt-6-luna, low)
- Scope: `studio/src/pathways`, `studio/tests/pathways.test.mjs`, `docs/workstreams/pathway-evidence-links.md`, and this handoff.

## Changes

Added a separate versioned key for explicit links from a known selected role criterion to a completed replay-supported practice artifact. The UI requires choosing and confirming a run. The saved reference includes role/criterion, run ID, artifact version, scenario version, title, source and link timestamp. It shows stale or missing runs as unavailable, preserves saved links until the learner removes them, and provides `/evidence` as a general route without claiming a per-run URL.

The confirmation path re-reads browser-local profile data and replays it through `collectArtifacts` before writing. Duplicate run IDs are rejected as ambiguous. Focus/storage refreshes and export-time replay checks update the displayed/exported status. Markdown includes linked artifact provenance. Coverage scoring still consumes only the original manual evidence level and note; no role eligibility, source, deadline or employer status changed. Link parsing bounds serialized size and version lengths, accepts canonical UTC timestamps only after calendar round-trip validation, and projects only the declared fields.

## Checks

- `node --test tests/pathways.test.mjs` from `studio/`: 8 passed, 0 failed.
- Scoped TypeScript check for `src/pathways/model.ts` and `src/pathways/RolePathways.tsx`: `npx tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --allowImportingTsExtensions ...`: exit 0.
- Tests include extra-field stripping, oversized artifact/scenario versions, oversized serialized records, and impossible calendar rollover.
- No full application build or browser verification was run.

## Limits

The practice record and link live in editable local browser storage. Replay validates the authored scenario's recorded transitions, not learner identity or real-world competence. The `/evidence` destination is a workspace-level link; the evidence page currently has no run-specific deep link.
