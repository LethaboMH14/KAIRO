# Luna 2: deterministic tests of actual shared narration cancellation

## Objective and boundary

Exercise the actual `studio/src/teacher/TeacherProvider.tsx` with synthetic, deterministic speech/audio/network adapters in Node. Catch stale callback and disposal races without making a cloud request, playing audio, opening a browser or modifying shared production code. Parent owns provider fixes and route integration.

Read AGENTS.md, README.md, docs/KAIRO-PRODUCT-BRIEF.md, coordination/README.md, docs/blueprint/core/README.md, docs/blueprint/experience/README.md, docs/blueprint/experience/BUILD-PLAN.md, both source-rain contract/handoff documents and this directory's README. Inspect TeacherProvider.tsx, teacher/model.ts, avatar/motion.ts, source-classroom/SourceClassroom.tsx and workspace/LessonWorkspace.tsx. `TeacherAPI` is currently private: settings/update/voices/say/stop/pause/status/speaking/paused/caption/audioSignal. Do not export/change it in production for this task.

## Startup and exact ownership

Use a unique identity such as `codex-luna-narration-tests-20261023-<unique-suffix>`. Register actual settings (requested gpt-6-luna/low, not assumed), status and inbox. Create task `NARRATION-CANCEL-TESTS-001` if unused and claim only:

- `studio/tests/narration-cancellation.test.mjs`
- `studio/tests/narration-fixtures/`
- `docs/checks/luna-narration-cancellation-20261023.txt`
- `coordination/handoffs/2026-10-23-luna-narration-cancellation.md`

No shared runtime, router, provider, character, classroom, source-resume, other test, dependency or configuration edits. A failing test is evidence for parent review, not permission to patch the provider. Respect active and blocked claims regardless of timestamp.

## Harness feasibility gate

First inspect installed tools. The project already has Node's test runner, React/ReactDOM, TypeScript and Vite, but no approved React test renderer or DOM emulator dependency. Do not install packages or use a browser as a workaround.

Prefer an existing installed renderer/harness if it truly exists. Otherwise use Vite's Node transform/SSR loading with a strictly test-local import adapter for the provider's React hooks and fake browser media globals. The adapter must execute the real provider function and its actual closures, refs, callbacks and effect cleanup. It may simulate hook storage/rerenders and record effects, but it must not copy `say`, `cloudSay`, `cancel`, disposal logic or a miniature replacement provider. If aliasing React, limit the alias to the provider under test so dependencies/JSX runtime remain compatible. Keep fixture code under your claimed subtree and explain its limits. A hook adapter verifies event/ref logic under simulated lifecycle, not React scheduling/concurrent rendering.

Use fileURLToPath for Windows paths. For Vite, configFile:false, middlewareMode:true, ws:false, appType:custom; close it in finally. Do not bind an HTTP listener, use Playwright/Puppeteer/Edge, open URLs, take screenshots or inspect browser state. SSR/import transformation in Node is permitted; browser observation is not.

If no honest installed-tool harness can execute actual provider behavior, publish a short concrete blocker and reproducible feasibility findings. Do not produce passing tests that merely inspect source strings or exercise a copied controller. Stop dependent implementation rather than silently add dependencies.

## Mock boundary

Fake window event registration/pagehide, speechSynthesis/getVoices/cancel/speak/pause/resume, SpeechSynthesisUtterance, Audio, AudioContext nodes/analyser, URL.createObjectURL/revokeObjectURL, requestAnimationFrame/cancelAnimationFrame, localStorage and fetch. Fetch must fail closed on any unexpected URL; only return synthetic local objects for the provider's expected speech endpoint. Supply consent settings through synthetic localStorage configuration without altering real preferences. No real filesystem source/private lesson reads.

Use controllable deferred promises and manually dispatched events. No wall-clock sleeps or network. Track fetch AbortSignals, audio instances/play/pause/src, object-URL creation/revocation, graph connect/disconnect, cancelled animation frames and provider state/ref snapshots. Restore every overridden global and drain/close the harness in finally/afterEach. Keep tests sequential if globals are shared. Ensure one test cannot pass because another left mocks behind.

## Required behavior matrix

1. Browser voice: say A → replace with B → late A start/end/error callbacks do not change B state. Stop cancels narration; a late callback cannot restart it.
2. Browser pause/resume: calls the appropriate adapter and updates paused state. Stop while paused clears speaking/paused. Missing language voice reports unavailability without calling speak.
3. Cloud consent/language mismatch: produces honest status and makes zero fetch/audio-play calls.
4. Cloud stop while AudioContext resume is delayed: completing old resume starts no fetch or playback.
5. Cloud stop during pending fetch or response.blob: AbortSignal is cancelled; even a mock that ignores abort and resolves late cannot construct/start stale Audio or set speaking true.
6. Cloud replacement A → B with out-of-order completion: only B may play and control status; late A callbacks/errors cannot cancel/dispose B resources.
7. Active cloud stop: audio pauses and detaches, signal energy/time/duration reset, active animation frame cancelled, object URL revoked, audio graph disconnected. Assert stale callbacks do not resurrect state.
8. Cloud pause/resume: actual audio pause/play adapters invoked, no extra speech fetch. Failed resume produces the existing truthful status rather than claiming playback.
9. Chunk transition: stop/replace between chunks prevents any subsequent old-utterance request. Use actual speechChunks input boundaries from avatar/motion.ts rather than a copied chunker.
10. Provider cleanup/pagehide/settings change: invalidates pending work and cancels active playback; cleanup closes AudioContext where the actual effect specifies it.

Some assertions may expose production races. Preserve a minimal deterministic failing test, document expected versus actual behavior, and send parent a precise defect message. Do not weaken an assertion just to make the suite green. Mark untested paths explicitly.

SourceClassroom chapter/view/“I'm stuck”/unmount stop wiring is currently inspected code, not validated by a provider-only harness. Do not claim route integration or real mouth/gesture cancellation acceptance unless you can execute those actual components in the same permitted Node harness. That extension is optional and cannot justify expanding scope or copying route behavior.

## Sequence and evidence

1. Register, read bus/inbox, claim exact paths.
2. Establish harness feasibility with one browser cancellation and one pending-cloud cancellation scenario.
3. Extend the meaningful race matrix, keeping mocks small and deterministic.
4. Run `node --test tests/narration-cancellation.test.mjs` from studio; save actual output/exit status in owned evidence. If fixtures need compilation, use installed Vite/TypeScript in the test process without shared configuration edits.
5. Record environment, actual provider source SHA256 tested, included/pending cases, all failures, mock/lifecycle limits and reproducible commands.
6. Check inbox, publish handoff and notify parent via bus. Complete only the deliverable actually achieved; use block with evidence if no viable harness, or a truthful handoff if implementation defects remain. Passing tests do not authorize deployment.

Keep plain learner wording and selected C branding if quoted; no UI redesign, cloud spend, microphone, signing model, schedule or browser observation is part of this task. Parent independently reviews tests and claims any production fixes separately.
