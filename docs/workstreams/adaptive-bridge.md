# Adaptive observation bridge

This pure adapter maps recorded workspace quiz attempts into the versioned adaptive policy schema. It does not edit or persist profile records, change lesson UI, or issue recommendations itself.

## Existing record boundary

The workspace `Lesson` carries an immutable lesson ID and the reviewed source revision. `Progress.Attempt` currently stores a quiz question index, selected option, a local correctness flag, and a timestamp. It does not store help exposure, an event ID, task/rubric revisions, concept, or task context. The browser opens a citation after a wrong answer, but the record does not show whether the learner read it. Therefore missing help is `unknown`, never inferred from the selected answer or UI state.

The profile stores attempts by lesson ID, not the source revision on each event. `buildAdaptiveObservations` requires `attemptsLessonId` to match the supplied reviewed lesson descriptor and labels the resulting revision basis as a caller assertion. The bridge cannot independently prove the caller loaded the correct immutable lesson snapshot.

## Contract

`studio/src/adaptive-bridge/adapter.ts` exports `buildAdaptiveObservations(input: unknown)`. The input contains:

- `attemptsLessonId`, the caller-provided lesson binding;
- a reviewed lesson descriptor with lesson ID, source revision, question count, and `reviewStatus: 'reviewed'`;
- one reviewed task descriptor per attempted question, explicitly binding question index, concept ID, unique task ID, source/task/rubric revisions, context key, option count, expected choice, reviewer ID, review timestamp, and review status;
- recorded attempt rows in chronological order.

The adapter derives correctness from recorded `choice === expectedChoice`. If a stored correctness flag disagrees, that row is rejected. If the choice is absent but a device-stored correctness flag exists, the row is returned in `unassessed` with `gradeProvenance: 'device-recorded-unverified'`; it is never emitted as a policy observation. An attempt with no recorded help field is emitted with `helpExposure: 'unknown'`. The existing profile records contain no help field, so their successes cannot be treated as independent evidence.

Only reviewed quiz attempts are emitted, always as `assessmentKind: 'practice'`. The bridge never creates delayed-recall or transfer events from elapsed time, retries, or a correct answer. Missing descriptors, mismatched lesson/source binding, malformed dates, conflicting grades, duplicate task IDs, repeated question descriptors, duplicate event IDs, and exact duplicate rows without explicit IDs make the whole batch ineligible; `observations` is empty and rejection reasons identify the affected records.

If a recorder supplies an `eventId`, the adapter preserves it and rejects collisions. Otherwise it derives a deterministic 64-bit content ID and checks for collisions. Identical no-ID attempt rows are quarantined together as possible duplicate imports instead of being counted as repeated practice. Same-timestamp rows with different choices/tasks remain distinct. Task IDs must be unique across question bindings so repeated task identity cannot appear to be a new task.

## Review and privacy boundaries

The expected choice and review metadata are caller-supplied assertions. This adapter validates their shape and their correspondence to a lesson/question; it cannot certify reviewer identity, content quality, learner identity, or unedited local history. Its outputs are unverified local evidence and should only be passed to the policy when `recommendationReady` is true. If the result contains any unassessed record or rejection, no partial observations are emitted.

No private coursework fixtures are included. The tests use authored synthetic lesson/task records and test matching, provenance gaps, duplicates, invalid data, and fail-closed behavior.

## Verification and next step

Run from `studio/` with `node --test tests/adaptive-bridge.test.mjs`. The bridge is not connected to `LessonWorkspace` or profile persistence. A consumer needs a reviewed task catalogue and an explicit, reviewable caller binding before it can invoke this API.
