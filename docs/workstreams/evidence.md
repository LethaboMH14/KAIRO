# Practice evidence adapter

## Contract

`studio/src/evidence/model.ts` exports three pure functions:

- `summarizeCase(record: unknown): PracticeArtifact | null` validates and replays one supported `corner-shop-v1` case record. It accepts any event order that the case state machine accepts, including inspecting before calculating.
- `collectArtifacts(profile: unknown): PracticeArtifact[]` accepts only profile version 1 with no more than 20 case records. Invalid individual records are omitted; an invalid profile envelope produces an empty list.
- `artifactMarkdown(artifact: PracticeArtifact): string` renders stable Markdown with no generated-at timestamp.

The exported artifact carries its own `artifactVersion`, source, scenario version, run and lesson IDs, title, completion time, replay-derived rubric checks, recorded attempt trail, contributor reflection, and limitations. It states `local self-directed practice, unverified`. It does not produce an employer score, verified skill claim, independent reviewer statement, or accreditation.

## Replay and boundaries

Eligibility comes from replaying each supported event through the existing practice transition function and comparing the resulting kind, value, time, and derived correctness to the stored event. The replay must end in `complete`; the replayed reflection and completion timestamp must match the record. A completion flag by itself is insufficient. The expected-stock check, reconciliation check and decision check must each finish met. Wrong attempts remain visible and affect first-try counts.

Records with unsupported scenario versions, malformed fields, invalid timestamps, excessive strings, more than 200 events, or more than 20 profile case records are rejected. Reflection replay uses the full saved reflection while checking that its first 500 characters match the event trail, supporting the model's 1,000-character limit. Event times must be explicit ISO instants with valid calendar values, occur in nondecreasing order, and end at the saved completion time. They remain editable with the browser-local profile. Help exposure is unknown because the current event model does not record it. A user can construct a fully consistent false event history, so replay is a consistency check, not tamper-proof proof of learner identity, actions, or competence.

## Evidence

`studio/tests/evidence.test.mjs` covers successful replay, wrong-attempt retention, inspection-before-calculation, forged completion/correctness, unknown versions, malformed and oversized records, strict timestamp rules, profile bounds, 500/501/1,000-character reflections and tampered prefixes, and stable Markdown rendering.

Run from `studio/` with `node --test tests/evidence.test.mjs`.
