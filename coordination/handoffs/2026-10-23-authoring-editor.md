# Authoring editor and layout research handoff

Date: 2026-10-23  
Owner: `codex-luna-authoring-editor-20261023-h`  
Registered settings: Codex / `gpt-6-luna` / `low`  
Task: `AUTHORING-EDITOR-001`  
Scope: `docs/authoring-editor-20261023/` and this handoff only.

## Decision

Keep the current KAIRO-owned renderer and controlled material planner. Define the versioned lesson block/layout format, citation identity, migrations and save/conflict rules before adding an editor. If educators later need visual block composition, run an isolated Puck spike against a short allowlist. Evaluate BlockNote core or Tiptap core separately only if editing long prose inside blocks is a demonstrated need. Use a graph editor such as React Flow only for an actually editable node/edge diagram; fixed diagrams should remain static approved renderers.

The current evidence does not justify adding a dependency. Puck and Craft.js are composition tools, not citation validators or durable version systems. Plate, BlockNote and Tiptap are text-editor candidates, not whole-lesson layout solutions. React Flow is a diagram editor, not a course-authoring schema. H5P and Adapt represent separate content/runtime ecosystems and should be investigated only for a standards-based import/export need.

## Files and evidence

- `docs/authoring-editor-20261023/README.md` — detailed candidate matrix, KAIRO ownership boundaries, corrected claims from the supplied AI answer, proposed content/layout JSON, proposal/CAS flow, staged options, judging map, source links and research limits.
- Read-only local inspection: `studio/src/artifact-panel/contract.ts`, `docs/workstreams/static-artifact-contract.md`, `studio/src/static-artifact-view/StaticArtifactView.tsx`, `docs/workstreams/static-artifact-view.md`, `studio/src/material-planner-ui/MaterialPlanner.tsx`, and `docs/material-planner-ui/README.md`.
- Supplied answer read as research data: `C:/Users/USER/.codex/attachments/4f531d44-7cd7-48b5-a0d6-69281b038e44/Pasted text.txt`.
- Official primary documentation for Puck, BlockNote, Tiptap, Lexical, dnd-kit, H5P, Adapt, JSON Forms, Zod, Plate, Craft.js and React Flow is linked in the README. The memo records the checked date as 23 October 2026 and flags version/licence drift.

## Judging relevance and acceptance

Targets are Product (editing should preserve exact source/revision identity), Creativity (compose cited explanations with approved diagrams/studio panels), Usability (keyboard/reflow and explicit change/undo flows), Sustainability (schema survives renderer replacement), Impact (reading works without 3D/cloud), Presentation (distinguish source-supported from authored/generated content) and Intelligence (proposed changes retain exact current citations). Observable acceptance and remaining gaps are listed per criterion in the README.

The recommendation is accepted for research purposes when a reviewer can trace each library capability to a cited official source and see which guarantees remain KAIRO-owned. No implementation, dependency choice, measured performance, learner result, accessibility certification or production architecture approval is claimed.

## Checks and limits

- `python coordination/bus.py status` confirmed `AUTHORING-EDITOR-001` active under this owner; inbox checked after message 78 and was empty.
- Read the current `AGENTS.md`, `coordination/README.md`, full authoring research contract and existing local artifact/planner interfaces before updating the memo.
- Used official documentation/repository pages for current candidate descriptions and license notes; no package install, product code edit, browser observation, benchmark, phone or screen-reader test, API call, cloud generation, paid action, or dependency change was performed.
- Existing details such as exact package sub-dependency licences and hosted-service terms must be rechecked for the pinned versions before adoption. No formal security, legal or accessibility review has been completed.

## Parent review

Review the recommendation and source links in `docs/authoring-editor-20261023/README.md`. If a Puck spike is approved, create a separate task with its own isolated scope and test plan. Keep source provenance, persistence/CAS, safe JSON rendering, version history, access control and device/keyboard acceptance in KAIRO's explicit ownership boundary.
