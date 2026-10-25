# CV session transfer plan

Status: proposed design only. No runtime or UI changes are authorized by this plan.

## Why this is needed

`studio/src/cv-workspace/CvWorkspace.tsx` holds the working session in component state. Its notice says details remain in the tab, and its current download is `draft.draftText`, which contains only confirmed facts. Unconfirmed facts and target-role notes are consequently lost when the tab is left. `beforeunload` warns about this loss, but does not recover the session. `studio/src/cv-draft/model.ts` already validates applicant facts, role requirements, text and aggregate serialized sizes, and its generated CV output deliberately excludes unconfirmed facts and treats role requirements as unverified.

Add an explicit user-controlled JSON session file. Export represents the editable workbench, not the generated CV. There is no automatic browser storage, profile write, server call, upload or cloud sync. Continue to label CV claims as applicant-provided and independently unverified.

## Proposed wire contract

Use one exact, versioned envelope, with no timestamps, preview, generated text, evidence labels, hidden metadata or arbitrary extension bag:

```json
{
  "format": "kairo-cv-session",
  "version": 1,
  "session": {
    "facts": [
      {
        "id": "fact-example",
        "section": "education",
        "text": "BCom, in progress",
        "providedBy": "applicant",
        "confirmation": "unconfirmed"
      }
    ],
    "targetRoleRequirements": {
      "label": "Analyst role",
      "requirements": ["Excel"]
    }
  }
}
```

`targetRoleRequirements` is omitted when both role fields are empty; otherwise both label and newline-separated requirements are included. Keep original confirmation values, including `unconfirmed`, because they represent the learner's saved state. The file must not contain the generated preview or imply that any detail has been verified. The contract version is independent of `kairo-cv-draft-v1`; unknown versions fail closed. A future incompatible shape gets a new version and an explicit migration, never silent guessing.

Recommend an all-or-nothing **Replace current session** import. Before replacement, show that importing replaces every current fact and role note, and require a second explicit action. Do not merge or deduplicate: IDs can collide, ordering and conflicting confirmation states are ambiguous, and a merge can silently produce a different CV. If the current form is nonempty, preserve it unless the file has passed every check and the learner confirms replacement. Any refusal or error leaves every current field and preview untouched.

After a successful import, retain each fact's prior confirmation value but put the session behind an `importNeedsReview` gate. Explain that the file is editable applicant-supplied data and KAIRO cannot establish who created it or whether it changed. Require a clear “I reviewed these imported details” action before enabling draft generation; individual edit behavior continues to set that fact to `unconfirmed` through `editFact`. Reconfirmation is the learner's present attestation, not independent verification. Until the gate is cleared, do not show a current generated preview. This ephemeral gate is UI/session state and is not serialized; re-import therefore always requires review again.

## Validation and state transition

1. The user explicitly chooses a local JSON file. Check `File.size` against a fixed maximum (recommend 128 KiB) before `File.text()`; reject larger files before reading/parsing. Do not accept pasted JavaScript, URL fetches or object URLs as import data.
2. Parse JSON in a `try` block. Parsing is only the syntax step; JSON is untrusted data. Reject root arrays/null, wrong `format`, unsupported `version`, missing/extra keys and wrong container/value types. Do not coerce numbers, booleans, nulls, arrays or objects to text.
3. Project into a new known-shape object by explicitly copying only the allowed envelope, session, fact, and target-role fields. Reject unknown keys rather than retaining them. This avoids prototype-bearing objects, getters, extra properties and prototype pollution paths. Bound file bytes before parse, then enforce exact keys, dense arrays, maximum fact/requirement counts, UTF-8 byte limits, IDs, sections, origin, confirmation enum, plain-text restrictions and aggregate input size with the existing `createCvDraft` validation rules. JSON.parse cannot produce accessors, but keep the model validator's plain-object, descriptor, dense-array and exact-key defenses for any non-JSON caller too.
4. Build prospective React state in local variables. Validate the projected session with the existing model contract before opening/committing the replacement. The model currently validates `CvDraftInput` and returns a `CvDraft`; implementation should factor or expose a shared input normalizer/validator, or perform equivalent projection validation without inferring data back from generated output. Do not use `draft.evidenceLabels` or draft text to reconstruct facts: unconfirmed facts are intentionally absent there.
5. Show a review/replace confirmation using only safe, bounded counts and the selected filename as text. On confirmation, atomically set facts, target fields, clear unsaved input fields and old preview, then set `importNeedsReview=true`. On cancel or any parse/schema/limit/validation error, change only the error/status message; retain the complete current form and current preview.
6. Export validates the current session shape and size, serializes the known projection as `application/json`, and requests a download with an unmistakable name such as `KAIRO-cv-session-v1.json`. Tell the learner the file contains all applicant-entered facts, including unconfirmed items, plus any role notes; it may contain sensitive contact/personal information and must be stored/shared deliberately. Keep the current text CV download separate and clearly labeled as confirmed preview text only.

Do not automatically import a previously confirmed state as newly attested. Preserve the saved enum for editing and transparency, but gate preview generation until current-session review. Do not call the application server or external services as part of export/import.

## Preview and failure behavior

Any successful import invalidates the old preview and its download button. Existing `changed()` already clears preview after edits; import must do the same. If the user cancels, preserve the preview and all input values. If any validation or read fails, preserve them as well, report a plain actionable error, and avoid partially applying facts or role notes. A user can export a backup first, but export is never an automatic side effect of import.

The existing `beforeunload` warning should remain while there is work. After adding transfer controls, explain the distinction between “Download CV text” and “Download session file” and do not imply that either is saved to a KAIRO account. A successful session download is only a browser download request, not proof that the user retained the file.

## Proposed implementation boundary

When approved as a new task, keep the model/codec in `studio/src/cv-draft` and controls/state transitions in `studio/src/cv-workspace`. The codec API proposal is:

```ts
export type CvSessionV1 = {
  format: 'kairo-cv-session';
  version: 1;
  session: CvDraftInput;
};

export function createCvSessionFile(input: CvDraftInput): string;
export function parseCvSessionFile(jsonText: string): CvDraftInput;
```

`createCvSessionFile` validates and serializes a known-shape projection. `parseCvSessionFile` accepts bounded text only, parses JSON, verifies the envelope/version/exact fields, projects to plain known-shape input and applies the same CV input validation. Keep file-size checking before `File.text()` in the UI. It may be useful to refactor `createCvDraft` to share a `normalizeCvDraftInput(unknown): CvDraftInput` helper, but that is a proposed API change and must be explicitly scoped/approved before implementation. UI owns the import review gate; the file contract does not claim a verified identity or trust imported `confirmation` as current consent.

## Verification cases for a later implementation

- Round-trip confirmed and unconfirmed facts, their order and IDs, all supported sections, and role label/requirements; exact semantic values survive export then import.
- Empty session and omitted role notes round-trip without inventing a role.
- Imported previously-confirmed facts remain marked as saved, but preview remains disabled until the learner reviews; a changed imported fact becomes unconfirmed.
- File over the byte limit is rejected before parsing; malformed JSON, a primitive/array root, wrong envelope, unsupported version and every level of unknown key fail closed.
- Wrong field types, nulls, coercible values, sparse/oversized lists, duplicate/invalid IDs, unsupported sections/origin/confirmation, unsafe text and UTF-8 byte-limit overflows reject without coercion.
- A valid import into a nonempty form requires explicit replacement; cancel leaves facts, role notes, unsaved entry, preview and download availability unchanged.
- Any failed parse/read/schema/validation attempt leaves the same state intact. Successful replacement updates all session fields together, clears unsaved entry and invalidates preview.
- Export contains only the versioned editable-session schema; it includes unconfirmed applicant facts and notes, but excludes generated CV text, verification claims, profile/account identifiers and unrelated state.
- Existing confirmed-plaintext export still contains confirmed preview text only and its copy remains distinct from session JSON.

These are acceptance scenarios for implementation, not checks run by this planning task.
