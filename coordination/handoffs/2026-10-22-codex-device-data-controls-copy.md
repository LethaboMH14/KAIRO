# Device data controls copy repair handoff

**Task:** `DEVICE-DATA-CONTROLS-COPY-001`  
**Owner:** `codex-device-controls-audit-20261022-a`  
**Status:** Complete; included for root aggregation.

## Changed

In `studio/src/continuity/LearningHome.tsx`, changed the footer sentence:

- Old: “Your work belongs to you. Export a copy whenever you need one.”
- New: “Keep a copy: download saved reading from My learning, lesson notes from an open lesson, and your progress portfolio from Progress.”

The new sentence names existing export routes and avoids implying that all locally saved categories are exportable. No layout, styling, save behavior, storage, export implementation or other copy changed.

`docs/workstreams/device-data-controls-copy.md` records the exact change and remaining limitation: settings and Engineering checkpoints still have no export controls.

## Verification and limits

Source verification confirmed the new sentence is present and the old footer sentence is absent. No tests/build were run for this one-sentence copy repair, as requested. Root's 177-test/build checkpoint passed before this change, so it does not include this copy update.
