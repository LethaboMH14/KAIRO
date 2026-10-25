# CV session transfer codec

Status: isolated pure codec; UI integration is not included.

`studio/src/cv-session-transfer/index.ts` implements the approved JSON v1 session contract:

- `createCvSessionFile(input: CvDraftInput): string`
- `parseCvSessionFile(jsonText: string): CvDraftInput`

The exact envelope is `{ format: 'kairo-cv-session', version: 1, session: CvDraftInput }`. It carries the facts and optional role notes as editable applicant-supplied data, preserving both confirmation values. It does not establish authorship, current learner approval or independent verification.

Both paths construct fresh documented-field projections and run the existing `createCvDraft` validator. Caller objects must be plain records with enumerable data properties and dense plain arrays; unsupported fields, accessors, custom prototypes and coercion are rejected before serialization. No caller `toJSON` hook is invoked. Import checks character length and UTF-8 byte length against 128 KiB before `JSON.parse`; export applies the same limit to the complete envelope, so a model-valid session can still be refused if the wrapper exceeds the file limit. No UI, browser file operation, storage, network or automatic replacement is part of this module.

Run the focused validation from `studio/`:

```powershell
node --test tests/cv-session-transfer.test.mjs
npx tsc --noEmit -p tsconfig.json
```

Import callers remain responsible for checking `File.size` before reading a file, disclosing sensitive content, confirming replacement atomically, invalidating stale previews, and requiring fresh learner review before generating a CV from imported facts.
