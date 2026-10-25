# Home export wording repair

## Change

In `studio/src/continuity/LearningHome.tsx`, replace the footer sentence:

> Your work belongs to you. Export a copy whenever you need one.

with:

> Keep a copy: download saved reading from My learning, lesson notes from an open lesson, and your progress portfolio from Progress.

The new sentence points to exports confirmed in the source: reading copy and notes downloads on `/home`, lesson-note exports in the lesson workspace, and the portfolio export on `/progress`. It avoids claiming that every browser-local category can be exported.

## Scope and limitation

This is copy only. It adds no controls and does not change persistence, deletion, export formats, or save behavior. Other local categories (such as teacher preferences and Engineering checkpoints) still do not expose export controls; this footer does not imply they do.

## Validation

Source diff review only. No test or build is needed for this one-sentence copy change.
