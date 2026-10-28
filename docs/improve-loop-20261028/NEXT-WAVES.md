# KAIRO improve loop — next waves (ready to dispatch)

Base: branch `claude/improve-loop-20261028`, worktree `C:\Users\USER\Desktop\kairo-improve-loop`. Read PLAN.md for the shared contract, caveat rule and per-lane brief fields.

## Wave 1b: blocked on stale bus claims (user decision)
L4 (material review and lesson creation) and L6 (navigation layering and studio openings) are fully specified in PLAN.md. Their files are still reserved on the canonical bus by 26 Oct sessions that have stopped:
- `SUBMISSION-INTEGRATION-20261026` (owner `codex-midnight-release-20261026`): `sourceworkspace.tsx`, `sourceclassroom.tsx` and others.
- `STUDIO-MOUNT-090-FRESH2` (owner `codex-fresh-coordinator-20261026-a`): `engineeringstudio.tsx`, `learning-flow.css`, `studiocompanion.tsx`, `pumphost.tsx` and others.
These can start only after those owners release the claims, or after the user coordinates recovery as AGENTS.md requires.

## Wave 1c: pre-existing test failures (claimable now)
On the untouched submission commit 49af96c, 31 test cases fail in 7 files: ci-python-toolchain 2, ingestion-edgecases 4, material-ingestion 9, native-extraction 2, security-upload-abuse 4, source-workflow-ui 9, studio-lesson-sequence 1. The same 31 fail after wave 1a.
- Example: source-workflow-ui renders `SourceReader` without `TeacherProvider` and fails with "TeacherProvider is required".
- **Update (28 Oct, 19:30):** the natural-voice session is fixing source-workflow-ui (it adds the TeacherProvider wrapper) and studio-lesson-sequence (it adds the motor source `title`) on `fix/145-ci-20261028` for PR #145. Those 10 cases are no longer in this lane. The rest pass on GitHub CI and look environmental to this Windows machine, so they need only a local-environment note.
- Lane T1 (Haiku, medium): fix the test harnesses only (wrap renders in their providers, and skip with a reason when a Python toolchain is absent). Change no product code unless a failure is a real product bug; report any such bug instead of fixing it.
- Acceptance: the full suite reaches 0 failures, or each remaining failure is documented with its cause.

## Wave 2: multilanguage, voice and KAIRO interactivity (needs its own plan loop)
- **Interface language:** extract navigation, buttons and status strings into a message catalogue, then add a language switch. Ship only languages whose strings a fluent reviewer has checked. Keep "unverified draft" labels on machine-drafted lesson text. Start with isiZulu and Afrikaans for the navigation chrome.
- **Voice conversation:** the classroom says "Microphone conversation is not enabled yet". The hosted app has a configured Groq dictation path with consent. Plan push-to-talk input for "Ask KAIRO" that reuses the reasoning-listening-bridge, using English first and an editable transcript.
- **Live KAIRO answers:** "Ask about this example" currently returns prepared text only. Route it through the existing cited-passage AI service when consent is given and the service is configured. Keep the prepared answer as the fallback, and label which of the two the learner is seeing.
- **Copy simplification (D12):** run a plain-language pass on the primary screens: sources upload limits, classroom footers and the shape-lesson outline.
- **Performance (D13):** deduplicate `/api/account/status` with a shared in-flight promise.
