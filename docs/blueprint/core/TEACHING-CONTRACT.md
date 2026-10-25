# Teaching score, speech and interruption contract

**Proposed contract `kairo-teaching/1`, not an implemented API.** Preserve `studio/src/character/types.ts` v1; use an adapter. Codex and Claude must review this document and publish any revised version before implementing shared interfaces.

## 1. Semantic lesson score

The score is a small versioned graph: objective → explanation → prediction/question → exploration → check → corrective branch → evidence → next step. Each segment has a stable ID, immutable lesson/source revision, locale, source spans, display text, speakable text, assessment intent and optional scene actions. IDs survive style changes; a content edit creates a revision. A lesson can have multiple modality tracks, not one voice narration copied into every language.

Example proposal (illustrative IDs, not provider data):

```json
{
  "schema": "kairo-teaching/1",
  "lessonId": "lesson-demo",
  "revision": "revision-demo",
  "segmentId": "segment-savings",
  "locale": "en-ZA",
  "text": "The multiplier is four when the marginal propensity to save is one quarter.",
  "sourceRefs": ["span-reviewed-17"],
  "targets": ["board.multiplier.value", "board.mps.value"],
  "actions": [
    {"id":"gaze-1","kind":"gaze","targetId":"board.multiplier.value","anchor":{"tokenId":"word-four","phase":"arrive"}},
    {"id":"point-1","kind":"point","targetId":"board.multiplier.value","anchor":{"tokenId":"word-four","phase":"arrive"}},
    {"id":"write-1","kind":"boardReveal","targetId":"board.multiplier.value","anchor":{"tokenId":"word-four","phase":"commit"}}
  ]
}
```

`tokenId` is assigned by the lesson compiler and matched to the actual spoken track. It is not a guessed character offset. Display text, speech-normalized text (e.g. `0.25` → “one quarter”), translation and SSML each need an explicit mapping. Offset unit must be declared (Unicode code points or UTF-16); never mix units across JS/provider responses. A translated sentence can have a different word order and action schedule.

## 2. Speech bundle

Bundle identity: tenant/access scope + source and lesson revision + exact normalized spoken-text hash + locale + voice/model/version + prosody/rate parameters + pronunciation lexicon version + timing extractor version. Hash the actual returned audio separately. Regenerating, translating, editing or replacing audio invalidates its timing track.

Proposed data:

```text
SpeechBundleV1
  bundleId, lessonRevision, segmentId, locale, voiceId, providerRevision
  textHash, audioHash, audioObjectId, durationSeconds, sampleRate, channels
  wordTrack: {tokenId,startSeconds,endSeconds,origin,confidence?}[]
  mouthTrack: {startSeconds,endSeconds,shape,weight,origin}[]
  timingMode: provider | aligned | phonetic-estimate | energy-only
  sourceRefs[], createdAt, expiresAt, accessScope, licenceRecordId
```

All timestamps are finite, nonnegative and within the audio duration; end ≥ start. Segment order must be monotonic; bounded overlap for cross-fading mouth shapes is intentional, with a documented maximum. Silence closes the mouth. Timings cannot outlive the audio asset or refer to a different hash. Limit JSON bytes/events/duration before decode. Untrusted timing shapes are mapped through a known vocabulary, never applied as arbitrary morph/property names.

**Word timing and visemes are different tracks.** Word boundaries anchor a concept or board action. Mouth shapes approximate visual phonemes. Provider word events do not establish viseme support; Rhubarb mouth output does not establish exact word boundaries. A general Google SSML timepoint feature does not mean a chosen Chirp voice returns it. Verify each voice/locale/mode combination.

## 3. Producing any-text mouth movement

1. Validate selected text, locale, consent, authorisation and remaining quota.
2. Normalize text for speech while preserving source/display mapping; escape generated SSML through a small allowlist and do not allow arbitrary remote `<audio>` resources.
3. Synthesize bounded semantic chunks. For the initial reliable slice, finish the chunk before playback and cache within its permitted scope.
4. Prefer verified provider word/viseme events for that locale/voice; otherwise analyse the exact audio in a bounded isolated worker. Existing Rhubarb is reusable: English recognizer for English; language-independent phonetic mode is a candidate for other speech, with lower precision, not a native-language recognizer.
5. Map shapes into Rain's A–H/X controls with smoothing, clamping and an explicit neutral pose. Azure's 22 viseme IDs need a tested mapping; copying IDs to Rain is incorrect. Blendshape output likewise needs a rig adapter rather than assuming ARKit names.
6. Compute word alignment using a separately verified provider word track or supported aligner. Where unavailable, allow segment-level pointing/reveal and disclose that the finer timing is estimated.
7. Validate bundle; begin only when audio and the required look-ahead are ready. If analysis times out, offer natural audio with energy-only mouth and accessible text; do not relabel that as phoneme-timed.

For live conversation, stream short clauses with bounded look-ahead only after the non-streaming slice is correct. A word's action cannot arrive exactly on an audio word already played before the timing packet arrived. Delay the audio slightly, prefetch, or degrade honestly. Avoid talking over a reasoning error simply to reduce latency. [Rhubarb primary repository](https://github.com/DanielSWolf/rhubarb-lip-sync), [Azure visemes](https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/how-to-speech-synthesis-viseme), [Google Chirp 3 HD modes](https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd).

## 4. One shared presentation clock

Use the audio sample/playback clock as source of truth. For existing HTML audio, `currentTime` provides the presentation position; for a scheduled AudioWorklet pipeline, use sample position and the output latency mapping. React render times and `setTimeout` are not the clock. Seek/pause/playback-rate changes resample all tracks from audio time. `requestAnimationFrame` interpolates pose for display but does not independently advance the lesson.

For a point that must **land** on a spoken word, schedule the arm's start earlier by its measured reach duration; gaze can precede the point slightly. Record semantic `arrive` versus `start` versus `commit`. Board writing similarly needs stroke duration/look-ahead. If the target is unreachable, don't stretch the arm: use ray pointing or a visible board emphasis, with the accessible target preserved. A long derivation should be revealed in meaningful steps, not scrawled instantaneously while claiming natural handwriting.

After a point completes, the host decides whether its validated board action commits and then sends acknowledge. Character completion alone never authorizes business or board changes. Writing is a new board-renderer track; the delivered rig has no writing clip. Ship clean vector stroke/reveal first; hand-to-pen IK requires collision/contact and timing tests before claiming she physically writes.

## 5. Cancellation and turn state

Session states: `ready → preparing → teaching → listening → transcribing → thinking → replying → teaching/ready`; `paused`, `reconnecting`, `budgetPaused`, `error` are explicit recoverable states. Microphone permission has a separate state; speaking permission is not recording permission.

Each event carries `(sessionId, sessionEpoch, turnId, responseId, segmentId, sequence, eventId)`. Server authorizes resource scope; client rejects stale epoch/turn/segment and duplicate/out-of-order sequence. A reconnect has a new connection ID but the same semantic session/checkpoint. Provider adapters translate cancellation best-effort; costs already incurred still reconcile.

**Atomic interrupt sequence:**

1. From explicit **I'm stuck**, Stop, user speech or route/language/source change, increment the generation epoch synchronously.
2. Stop/gate output audio immediately; flush queued chunks; abort provider/HTTP work; zero the audio signal and close mouth. Stop recording too if the action is session stop or permission revocation.
3. Cancel pending motion and board actions; each accepted cue gets at most one terminal result. Retain already committed board actions; do not replay them on reconnect.
4. Record `heardUntil` based on playback position, committed board state, selected target and source revision. Keep full generated text separately from the heard transcript.
5. Transition to a comfortable listen/neutral pose, turn gaze toward camera without a sudden snap; reduced motion uses a static equivalent.
6. Ask a short contextual repair or provide a small hint; keep **Try yourself**, **Show a step**, **Explain another way**, **Read it**, **Resume** available.
7. Resume deliberately from a semantic boundary or rebuild a short summary. Do not auto-repeat the whole lecture or assume unheard text was learned.

Typed text is never sent on every keystroke. Local typing/focus activity may trigger infrequent small listening nods; it does not infer emotion, confidence or comprehension. Voice activity may trigger listen pose, but random noise must not be scored as an answer. Nods pause while SASL is signing where they could change linguistic meaning, and respect reduced motion.

## 6. Tap to ask and grounded actions

Every interactive target has a visible focus state and keyboard action equivalent. Hit testing maps 3D target IDs to the accessible DOM item. Touch selection should not accidentally orbit the camera; hold/drag thresholds and cancellation are tested. The context snapshot includes selected value, unit, surrounding equation/chart axes, current parameters, earlier learner answer and source spans. A stale target/source revision asks for reselection; it cannot silently explain another object.

The response planner can propose only: `say`, `point`, `gaze`, `boardReveal`, `highlight`, `askCheck`, `openApprovedDiagram`, `offerVideo`, `suggestPractice`. A policy validator checks target existence/reachability, maximum action count, timing budget and evidence. No raw code, arbitrary URLs, network instructions or credential-bearing tool calls inside a lesson score.

## 7. Microphone and natural conversation

Ship push-to-talk/press-to-send with editable transcript first. Then optional hands-free with explicit ongoing mic status, local VAD where feasible, echo cancellation, bounded audio frames, max utterance length, endpointing and Stop control. `getUserMedia` requires permission and a secure context; device permissions may be revoked mid-session. Do not record by default, and close tracks on exit. [Browser API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

Keep listening, transcribing, thinking and speaking visibly distinct. Recognizer uncertainty → confirm a word/number before explaining or assessing it. Backchannels (“okay”, “mm-hm”) versus interruption need local-language evaluation; silence is not consent or a correct answer. No emotion recognition or ethnic/accent inference is needed. Choice of voice is an individual preference, not a claim about an avatar's ethnicity.

LiveKit Agents and Pipecat are candidate orchestration implementations, not both required. Compare real measured cancellation, supported-language turn detection, dependencies, hosting and licence before choosing. LiveKit exposes turn/interruption concepts; its documented defaults are not KAIRO's tested settings. [Turn handling](https://docs.livekit.io/agents/logic/turns/). Keep an adapter so typed/push-to-talk works without RTC infrastructure.

## 8. SASL modality contract

SASL is a language track with its own grammar, spatial reference, facial/nonmanual markers and timing. Spoken isiZulu or Setswana translated word-for-word into gestures is not SASL. The existing 30 hand correctives and teaching gestures are not evidence of usable signing.

First release: a small domain-specific set of phrases/explanations authored with paid Deaf SASL reviewers, validated for comprehension, and offered as reviewed human video where that provides the best access. Each item records sign variety, meaning, context, author/reviewer consent, rights, version and review status. Keep hands/face visible, full signing space, controllable speed/replay and independent captions. A signing avatar is a later motion-capture/retargeting and comprehension project, not a generic pose-model checkbox.

An unknown phrase must route to text/captions/interpreter material rather than synthesize unreviewed signs. Bidirectional camera-based SASL understanding is a separate research project with distinct consent/data risks, not implied by SASL output. No automatic learner-camera activation. General sign datasets in ASL/BSL do not establish SASL validity.
