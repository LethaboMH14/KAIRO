# CV session UI source review

Review scope: source-only inspection of `studio/src/cv-workspace/CvWorkspace.tsx` and `studio/src/cv-workspace/session.ts` after root's UI integration. No runtime files were changed; no build, tests or browser interactions were run for this review.

## Findings

No blocking source issue found for the requested boundaries.

- **Privacy disclosure:** `CvWorkspace.tsx:30-31` distinguishes the confirmed-text export from the editable JSON and says the latter includes personal details, unconfirmed entries and role notes, and should be kept private. It also discloses that unfinished entry-field text is not part of the saved file.
- **Pre-read bounds:** `session.ts:8-14` checks the `size` field against the 128 KiB limit before calling `file.text()`. The pure codec then checks both JavaScript character length and UTF-8 byte length before `JSON.parse`.
- **Fresh review:** `session.ts:20-22` maps every imported fact to `unconfirmed`, preserving wording, section, ID and role notes while requiring learner reconfirmation before inclusion in the CV.
- **Explicit replace/cancel:** `CvWorkspace.tsx:31` stages parsed input and exposes explicit “Replace current session” and “Cancel opening file” actions. The replacement message discloses that current facts, role notes and unfinished text will be replaced.
- **Atomic refusal and preview invalidation:** `chooseSession` at `CvWorkspace.tsx:23` only updates error/staging state on failure, leaving form state and preview alone. Successful replacement calls `changed()` before setting the imported fields (`24`); `changed()` invalidates reads, clears staged input and invalidates the preview (`20`).
- **Async races:** `session.ts:5-15` uses a generation token to discard stale file reads/errors. The UI invalidates that token when edits occur (`CvWorkspace.tsx:20`), when a new file is selected (`session.ts:9` increments), on cancel (`CvWorkspace.tsx:31`) and on unmount (`CvWorkspace.tsx:19`).

## Limits

This is a source review only. It does not establish rendered disclosure, actual browser file behavior, React interaction behavior, or aggregate build/test status. Those remain root's integration checks.
