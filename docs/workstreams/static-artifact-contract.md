# Static artifact contract v1

**Status:** bounded pure validator/projector implemented; UI rendering and security isolation are not included.  
**Schema:** version 1, static `text` and `table` only.  
**Implementation:** `studio/src/artifact-panel/contract.ts`.

`validateArtifactPanelV1(input)` accepts untrusted in-memory input and returns either `{ ok: true, artifact, serializedBytes }` or `{ ok: false, code }`. A successful result is a fresh exact projection. Unknown fields, accessors, non-plain objects, sparse/decorated arrays, malformed values, unsupported versions, shape mismatches and exceeded limits reject the whole artifact. No caller object is stringified. The projected value is serialized only after all field and count checks, to enforce the final 128 KiB JSON envelope bound.

Limits are centralized in `ARTIFACT_PANEL_LIMITS`: 128 KiB serialized envelope; 200 UTF-8 bytes for title; 100 bytes for stable identifier fields; 32 KiB for text; 500 bytes for provenance label, heading, or cell; 20 columns; 100 rows; and 2,000 total cells. Tables require at least one column and every row must match its width. Empty row sets are valid. String inputs with unpaired UTF-16 surrogates are refused.

The provenance object may contain source ID, revision, page and label. These values are caller-supplied claims only: the validator does not resolve them, open files, verify source content or confer authority. The module does not render HTML, create DOM, load images, follow URLs, persist data, or implement iframe/sandbox controls. Plain text may contain markup-looking characters; any future renderer must insert it as text, not interpret it as HTML.

The schema is intentionally narrower than the design proposal. Image, document, video and interactive variants need separate bounded contracts and runtime review. This validator alone does not establish artifact safety or resource isolation.

Focused test command: `node --test tests/artifact-panel.test.mjs` from `studio/`.
