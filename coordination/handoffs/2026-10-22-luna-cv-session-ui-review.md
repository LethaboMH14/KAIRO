# CV session UI source review handoff

Owner: `codex-luna-cv-session-ui-review-20261022-a`
Task: `CV-SESSION-UI-REVIEW-001`
Status: source review complete; no runtime edits.

## Scope and result

Reviewed `studio/src/cv-workspace/CvWorkspace.tsx` and `studio/src/cv-workspace/session.ts` against the requested privacy, size-before-read, bounded parser, atomic refusal, async stale result, explicit replace/cancel, fresh imported confirmations and stale preview requirements. No blocking source issue found.

The component discloses that editable JSON includes personal details, unconfirmed facts and role notes and must be kept private. Reader size-checks before `file.text()`. Codec is bounded before parsing. Imports stage before explicit replacement; parser/read failures leave the current form and preview intact. Successful replacement clears preview and converts every imported confirmation to `unconfirmed`. Generation tokens discard stale read results/errors, and edits/cancel/unmount invalidate pending reads.

## Evidence and limits

Exact source pointers and reasoning are in `docs/workstreams/cv-session-ui-review.md`. No runtime source was modified. No tests, build or browser interaction were performed; this review is not interaction acceptance.
