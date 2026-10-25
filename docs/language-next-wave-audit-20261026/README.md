# Language and listening audit (26 October 2026)

**Scope:** read-only review of current `ListeningQuestion`, transcript state/review, transcription API and shared narrator, plus a new offline test file which invokes those real modules. No application runtime file was changed. No microphone, camera, model, provider or cloud request was made; the local route test used an injected synthetic transcriber and loopback only.

## Criterion, learner need and acceptance evidence

- **Usability:** learners need a clear, reversible recording flow and a typed route. Evidence: actual `ListeningQuestion` interactions tested recording replacement, empty/oversize files, consent revoke, stale responses, edit/reconfirm and typed fallback.
- **Impact:** learners need control over whether selected audio leaves their device and honest cancellation/retention wording. Evidence: the real API route required provider consent and propagated a disconnected client as an abort to the injected transcriber. Two client-side privacy/usability gaps below reproduce in the current component.
- **Intelligence:** learners and judges need language and transcript claims bounded to what was checked. Evidence: selectable languages are labeled unverified, the state machine rejects a response with mismatched locale/source, and transcript submission requires explicit confirmation of the current text.

This audit is not browser/device acceptance, a provider test, language-quality validation, learner validation or a production security review.

## Files and current revision

- New actual-module tests: `studio/tests/listening-next-wave-audit.test.mjs`.
- Source reviewed without edits: `studio/src/ai-personalisation/ListeningQuestion.tsx`, `studio/src/listening-core/transcriptState.ts`, `studio/src/listening-core/TranscriptReview.tsx`, `studio/server/ai-runtime/service.mjs`, `studio/server/ai-runtime/gateway.mjs`, `studio/server/listening-core/transcription.mjs`, `studio/src/learning-flow/StudioCompanion.tsx`, `studio/src/teacher/TeacherProvider.tsx`.
- Base: `origin/main` SHA `63927423958830e63397a944e639202c392b9708`.
- Test command from `studio/`: `node --test tests/listening-next-wave-audit.test.mjs`.

## Findings for root

The two UI defects below were reproduced on the audit base `63927423958830e63397a944e639202c392b9708`. In the follow-up, root added a consent reset and empty-file guard in its canonical working copy of `ListeningQuestion.tsx` (SHA-256 `16B313D1B9852E04F0718E020165093EC6DF20549EAA1AC5AA63620D3BE23E0D`). The tests now assert the desired behavior and passed against that source snapshot. Root's source edit remains outside this audit branch. Refreshed `origin/main` is `c4b9ab2` and does not yet include the repair, so the two desired-state tests are expected to fail against this PR's current base until root integrates the source change.

### P1 — Recording replacement carried forward prior consent (root working-copy repair; integration pending)

In `ListeningQuestion.tsx` line 13, the file input change handler calls `cancel()` and sets the new file, but leaves the `consent` state unchanged. The actual-component test selects one file, checks “Send this recording to Groq”, selects a different file and observes that consent stays checked and Transcribe stays enabled. The checkbox wording is specific to “this recording”, so an earlier choice follows a replacement recording without a fresh confirmation.

**Proposed repair for root-owned integration:** when the selected file changes, reset provider consent to false (including clearing/reselecting the input); bind the consent to the file selection if that better fits the component. Add a passing desired-state test that replacement disables Transcribe until consent is checked again.

### P2 — Zero-byte file passed UI preflight and was sent to the route (root working-copy repair; integration pending)

At `ListeningQuestion.tsx` lines 10 and 13, the client blocks only absent files and files larger than 8 MiB. The actual-component reproduction shows an empty `audio/wav` file leaves Transcribe enabled and invokes the route. The real route rejects an empty body in `service.mjs` line 37, and `transcription.mjs` lines 29–40 independently rejects `blob.size < 1`; therefore no provider transcription proceeds, but the learner gets a remote-request failure instead of clear local guidance.

**Proposed repair for root-owned integration:** disable Transcribe for `file.size === 0` and render a direct message to choose a non-empty recording. Keep server and adapter validation as defense in depth.

### P2 — Cancellation status can sound stronger than the end-to-end guarantee

The browser component aborts its fetch on consent revocation and ignores a late response (`ListeningQuestion.tsx` lines 8–10); `service.mjs` aborts on response close, and the gateway races work against its abort signal (`gateway.mjs` lines 24–39). The synthetic route test confirms the abort reaches the injected transcriber. A remote provider can still process a request that it received before cancellation if upstream work does not stop immediately. The transcript panel says “Transcription cancelled and transcript cleared” (`TranscriptReview.tsx` line 26) without the “already sent work may still finish” qualification used by the separate studio-help Stop control (`StudioCompanion.tsx` line 33).

**Proposed repair for root review:** use wording such as “Stopped waiting and cleared this transcript. Audio already sent may still be processed.” This reflects the control actually available at the client/server boundary.

### P2 — Transcript retention duration and deletion are not clear in the listening flow

The panel says audio is not retained and the transcript is retained in a private AI request record (`ListeningQuestion.tsx` line 13). The gateway stores the completed request result, including the transcription result, under an `ai_req_…` progress key (`gateway.mjs` lines 21–36). This flow does not explain a retention period or expose deletion of that record. The account progress API has generic record deletion, but this component does not show the record key or provide a transcript-record deletion action. Confirm policy/lifecycle before changing the claim or exposing cleanup.

### No defect found in these checked behaviors

- **Consent revoke while in flight:** the actual UI aborts the request, clears the draft and ignores a late response; the actual server route aborts its injected work on client disconnect. This proves cancellation propagation in tested code, not guaranteed cancellation inside a remote provider.
- **Oversize/empty audio defenses:** UI blocks over-8-MiB files; the actual transcription adapter rejects empty and over-limit bytes before invoking its injected fetch. Zero-byte UI handling is the separate preflight defect above.
- **Mismatched/late results:** `transcriptState.ts` lines 43–56 rejects wrong source/locale and ignores stale request IDs/phases. Actual component tests cover mismatched locale and a late result after revocation.
- **Transcript edits:** lines 64–72 return edited text to `needs-confirmation`, clear `confirmedText`, and allow submission only after reconfirmation; actual UI test verifies that sequence.
- **Typed alternative:** `StudioCompanion.tsx` line 33 keeps a normal question textarea and passes a focus callback; the listening panel’s typed alternative also calls that callback. The component test confirms the callback path.
- **Route leave:** `ListeningQuestion.tsx` line 8 aborts active transcription in effect cleanup; actual component test verifies the signal is aborted and a late result cannot submit.
- **Language wording:** the menu entries are explicitly `unverified`; the API adapter validates ISO 639-1 shape, not model quality/support. Invalid `zz` is rejected before fetch. No listed language is established as validated by this audit; keep the current labels and do not infer translation or language-quality capability.
- **Shared narrator:** `StudioCompanion.tsx` line 33 routes guide/answer speech through `useTeacher()` and the shared `teacher.say`, `pause`, and `stop` actions; `TeacherProvider.tsx` exposes the single provider API. `ListeningQuestion` itself does not create a second narrator.

## Test evidence

`node --test tests/listening-next-wave-audit.test.mjs` passed **11/11** against root's canonical `ListeningQuestion.tsx` snapshot recorded above. For this verification only, the Vite root was temporarily pointed to the canonical source; the committed test loads the component from its own checkout. The suite uses the actual component, actual Express AI route with an injected fake transcriber, and production `createGroqTranscriber` with injected fetch. Synthetic data only; no real audio, model, provider, or cloud call. The loopback route test needed local loopback permission; it completed successfully. `git diff --check` passed. Re-run against the PR branch after root's source change is integrated.

## Remaining gaps

- Root owns the `ListeningQuestion` fixes; this branch intentionally contains tests/docs only. Current `origin/main` has not integrated the source snapshot these desired-state tests target.
- Remote provider behavior after cancellation and actual transcript retention/deletion lifetime need owner/policy confirmation.
- No browser/device, assistive technology, language competence, SASL, or learner acceptance was evaluated.
