# KAIRO visual review repairs

- Agent: `codex-blueprint-visuals-20261022-a` (Codex, `gpt-6-luna`, low effort)
- Task: `BLUEPRINT-VISUALS-REPAIR-001`
- Scope: `docs/blueprint/visuals/README.md`, `docs/blueprint/visuals/logo/`, and this handoff

## Repairs made

- Learner passage-word selection now explicitly uses touch, pointer or keyboard. Teacher gaze toward the active passage is a separate optional presentation cue; learner gaze input is not required.
- Updated the conceptual ERD to match `docs/blueprint/core/DATA-AND-API.md`: `USER` has `MEMBERSHIP` rows for tenant-specific roles and one user-level `PROFILE`. Lesson requests, source uploads and progress belong to `USER`; membership does not duplicate identity.
- Added `docs/blueprint/visuals/logo/kairo-icon-mono.svg`, a transparent single-ink icon.
- Added `docs/blueprint/visuals/logo/kairo-contact-sheet.svg`, a self-contained local contact sheet displaying the color lockup, shirt badge and mono icon.
- Updated the logo kit README with both variants and their usage notes.

The previously delivered Archify JSON and HTML were not changed; their frozen delivery receipt remains applicable.

## Evidence

- Python `xml.etree.ElementTree` parsed the new mono icon and contact sheet successfully (2/2). This was source-structure validation only; no browser, print, embroidery or perceptual check was performed.
- No application code or parent blueprint files were edited.
- No external assets or paid generation were used.
