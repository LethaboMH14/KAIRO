# TeacherProvider narration cancellation test handoff

Date: 23 October 2026. Agent: `codex-narration-tests-20261023-a`, Codex `gpt-6`, effort `unknown` (the client did not expose the requested `gpt-6-luna` / low setting).

## Scope and changed files

- `studio/tests/narration-cancellation.test.mjs`: 13 deterministic behavior cases against the actual `TeacherProvider.tsx`.
- `studio/tests/narration-fixtures/provider-harness.mjs`: Vite SSR loader plus test-local hook adapter and synthetic speech/audio/network/lifecycle globals.
- `docs/checks/luna-narration-cancellation-20261023.txt`: exact source hash, test command/result, limits and failure detail.

No runtime, router, SourceClassroom, package, lockfile or shared configuration file changed. No dependency was installed.

## Review finding for parent

The failed resume test catches a production state defect. In `TeacherProvider.pause()`, the cloud resume branch calls `audio.current.play().catch(() => setStatus('Press Read to restart narration.'))`, then sets `paused` false regardless of rejection, while `speaking` stays true from the original `onplaying`. The status text is truthful, but the state exposed to controls still says narration is active. The test expects `speaking=false` after a rejected resume and fails against current code. Parent should review and claim `studio/src/teacher/TeacherProvider.tsx` separately if fixing it; this package intentionally does not patch production.

## Checks

From `studio`, `node --test tests/narration-cancellation.test.mjs` completed with **12 passed, 1 failed**. The failing case is the finding above; all remaining cases pass. The provider source SHA-256 at run time was `D341A0BA217AFF3BFE1D2B8D9231B8FDE29485DB9E93FB5F8815FDE27B98D44E`. Full evidence and reproduction are in `docs/checks/luna-narration-cancellation-20261023.txt`.

## What the test actually establishes

The Vite SSR middleware loader imports and invokes the real TSX provider, preserving its actual closures, refs, callbacks and effect cleanup. Only its React hook storage/rerender/effect scheduling is simulated; synthetic browser APIs dispatch deterministic events and deferred promises. This validates provider event/ref behavior. It does not establish React scheduling or concurrent rendering, real React/browser/device speech or audio, visual behavior, route wiring, gesture cancellation or learner acceptance. SourceClassroom cancellation wiring remains inspected code, not exercised by this provider-only suite.

No browser or headless browser was used, no HTTP listener was bound, and no real audio, cloud request, private lesson read, deployment, automation or package install occurred. Mocks are restored per test. Parent review is required before accepting these tests or changing the provider.
