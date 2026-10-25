# AI release staging handoff — 25 October 2026

## Ownership

- Agent: `codex-luna-ai-release-20261025-d`
- Client/model/effort: Codex / `gpt-6-luna` / low
- Scope: `tools/ai-release-20261025/`, `docs/ai-release-20261025/`, this handoff.
- No existing staging script, server, UI, package manifest, or lockfile was edited.

## Delivery

- Added an explicit allowlist stage script, Node 24 Dockerfile, and local static module/dependency validator.
- Stages actual `learner-entry.mjs` import dependencies plus `ai-runtime`, opportunities, extraction coverage, listening core, the TypeScript event/evidence/draft validators and their type/UI dependencies, curriculum JSON, built `dist`, and the Python material-extraction entrypoint.
- Includes only three explicitly named opportunity research/fixture JSON files. The FNB/RMB snapshots declare unknown live status and are not consumed as vacancy data by the current runtime helper.
- Source/reviewer-facing delivery and gaps: `docs/ai-release-20261025/README.md`.

## Checks and exact commands

- `.\tools\ai-release-20261025\stage.ps1` from repository root: exit 0; 142 files; 71,268,831 bytes; generated a SHA-256 manifest at `tools/ai-release-20261025/stage-evidence.json`.
- `node tools/ai-release-20261025/validate-stage.mjs tools/ai-release-20261025/stage`: exit 0; Node major 24; 32 source module files checked; 35 files reached from hosted and feature entries; 2 `dist/index.html` asset references found and resolved.
- The stage script also invokes the same validator and fails if its exit code is nonzero.
- Existing build output inspection found the opportunities page and extraction/source workspace in `studio/dist`; the listening review UI is not present in the current bundle.

## Import/runtime map

The validator rooted the actual hosted closure at `studio/server/learner-entry.mjs`, plus explicit new feature entries for opportunities, extraction coverage and listening. It resolves the Node 24 TypeScript imports under `studio/src/` and checks each non-builtin package root against the staged production manifest. The Docker context retains the `/app/studio` runtime path so `learner-workspace/extraction.mjs` can resolve `/app/tools/material_ingestion/extract.py` and `student-space/model.mjs` can resolve `studio/data/student-spaces`.

## Gaps and next owner

- Root owns test execution, TypeScript/frontend build, integration, container build/review, cloud preflight, deployment, IAM, and release acceptance.
- No Docker build was run; it would install Python/npm packages and requires the root-owned build path.
- No runtime server boot, credentials, model call, cloud call, public access, IAM edit, or deployment was performed.
- `listOpportunities` seed data is in code; the archived FNB/RMB public snapshots included as fixture/reference files are deliberately not fed into the active vacancy list.
- The existing built UI lacks the new listening review panel. Stage source availability alone does not make it visible.
