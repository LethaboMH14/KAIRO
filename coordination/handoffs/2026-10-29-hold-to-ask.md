# Hold to ask: live push-to-talk in source passage help

- Agent: `claude-hold-to-ask-20261029-a` (Claude, model claude-opus-5-5, effort unknown)
- Bus task: `HOLD-TO-ASK-20261029`
- Branch: `claude/nice-hypatia-1679fa`, based on main `c35aa70` (wave 2, #149)
- Criteria: Usability (ask by voice without typing or preparing a file) and Intelligence (the question reaches cited passage help). Learner need: say a confusing point about the selected passage while reading.

## What changed

- `studio/src/hold-to-ask/model.ts` (new)
  - `createHoldToAsk`: push-to-talk controller. `press(consent)` is the only call that opens the microphone. `release()` stops the recording and sends the clip to the injected `EnglishTranscriber`. `cancel()` and `dispose()` close the microphone.
  - Letting go before the microphone opens cancels the capture. The late stream is stopped and nothing is recorded. This guards a gap in `createAudioCapture`: `stop()` before `getUserMedia` resolves would otherwise leave recording on until the 60 s limit.
  - A recording shorter than 400 ms is discarded locally.
  - A transcript over 300 characters (the field limit) is reported, not shortened.
  - `holdToAskAvailability`: `hidden` when Permissions-Policy blocks the microphone. This takes precedence. The other states are `checking`, `not-configured`, `unsupported` and `ready`.
  - `placeVoiceQuestion`: shared Keep/Replace rule. An empty field takes the transcript; typed words stay and the transcript becomes pending.
- `studio/src/hold-to-ask/HoldToAsk.tsx` (new)
  - `useGroqTranscriber()` reads `/api/workspace/ai/status`, as `ClassroomReasoningPractice` does, and builds `createGroqReasoningTranscriber`. It returns `null` when Groq is absent.
  - The control renders a consent checkbox, a "Hold to ask" button and an always-visible notice. The notice covers English only, language not verified, never asked automatically, and transcript-not-audio retention.
  - Supported input: pointer hold (with pointer capture), or holding Space or Enter. Escape cancels, and losing focus while holding cancels.
- `studio/src/hold-to-ask/hold-to-ask.css` (new): small `kh-` styles. Touch callout and selection are off on the button.
- `studio/src/teacher/SourceReader.tsx` (CRLF kept)
  - Mounts `HoldToAsk` under the question field. It is keyed per source, revision and passage segment, so a passage change cancels it.
  - The existing Keep/Replace group moves above the recorded-file `ListeningQuestion`, so it shows next to the field for both paths.
  - Both voice paths use `placeVoiceQuestion`. Nothing calls `ask()`.
- `studio/tests/hold-to-ask.test.mjs` (new, 7 tests). The tests use the real `createAudioCapture` with a fake microphone and the real Groq bridge with a recording fetch.

## Checks (actual results)

- `npx tsc -b` (studio): exit 0.
- `node --test tests/hold-to-ask.test.mjs`: 7/7 pass. Tests cover:
  - No microphone on mount or without consent.
  - Press, release and transcript fill, with exactly one request (to `/api/workspace/listening`) and none to `/passage`.
  - Release before the microphone opens.
  - Short tap and Escape.
  - Over-long transcript.
  - Blocked policy renders nothing.
  - Not-configured note, and a disabled button before consent.
- Related suites pass: `source-workflow-ui` 11/11, `hosted-dictation-policy` 2/2, `learner-reasoning-ui` 7/7, `learner-reasoning-ui-review` 7/7, `reasoning-listening-bridge` 7/7.
- Full suite (`node --test tests/*.test.mjs`, Windows): 1067 tests, 1046 pass, 21 fail. All 21 are the known Python/OCR extraction tests, which pass on GitHub CI.
- Browser check on a local production build. Setup: a detached worktree at `C:/Users/USER/Desktop/kairo-hold-to-ask-check` (outside dot-folders), `vite build`, then `KAIRO_LOCAL_CURRICULUM=engineering`, `PORT=4190` and `node studio/server.mjs --production` with an isolated synthetic workspace. The test material was the synthetic motor passage.
  - No Groq key, so `/api/workspace/ai/status` lists Google only. The reader shows "Hold-to-ask voice questions are not configured here. Type your question instead." No button.
  - Same page in a same-origin iframe with `allow="microphone 'none'"`. `document.permissionsPolicy.allowsFeature('microphone')` is false, and no hold-to-ask control or text renders. The recorded-file note still shows, because upload needs no microphone.
  - Extra: the ready path in a real DOM, in an iframe with only the status response, the listening response and the microphone stubbed (synthetic).
    - Before consent the button is disabled and the microphone is not opened.
    - Pointer hold then release fills the field with the transcript, and the field stays editable. The requests were `/api/workspace/listening` only, with no `/passage`.
    - With typed text, the transcript shows "Replace my typed question / Keep mine".
    - Holding Space with key repeat sends one request. Escape cancels: "Cancelled. Nothing was sent."
  - No console errors.
  - Screenshots are in the session notes folder, not committed.

## Not verified or open

- No real microphone or Groq transcription was exercised. The audio path is covered by fakes and stubs only.
- Not checked on a touch device or at 375 px. No screen-reader pass.
- Screen-reader virtual-cursor activation sends a click, not a hold, so those users cannot hold-to-ask. A toggle mode would be a follow-up. Typing and the recorded-file path remain.
- Each source reader now sends two `/api/workspace/ai/status` requests: one from `ListeningQuestion` and one from hold-to-ask. A shared status hook would remove one.
- Without Groq, two "not configured" lines show (hold-to-ask and voice file). This is honest but repetitive.
- English only. The Groq bridge rejects other locales.
