# SASL communication in both directions

**23 October 2026. Requirement added by user. Status: researched architecture and UI entry; no validated translation model or signed content integrated.** This extends the existing Deaf-led SASL teaching requirement into learner input and communication. It does not convert Rain’s current pointing/explanatory gestures into signing.

## Two different jobs

**Sign → text → optional speech:** the learner explicitly opens a camera session; the device checks framing/lighting and captures hands, upper body and relevant facial movement; a SASL model recognises temporal language; a decoder proposes text with uncertainty and alternatives; the learner corrects/confirms it; only then is it read aloud or submitted as a question. Recognition and translation are separate stages. Never speak a guessed sentence immediately or use the output to submit an application or perform another external action automatically.

**Speech → transcript → reviewed SASL:** the learner explicitly speaks; ASR returns an editable transcript; language and meaning are resolved; a supported, authored signed explanation is selected by a reviewed semantic ID. First release plays a human-signed video with captions/source and speed/replay controls. A later signing avatar requires validated handshape, orientation, movement, location, facial/nonmanual grammar and transitions. Arbitrary text-to-animation requires substantially more evidence than a dictionary of signs. Do not concatenate English words’ signs and call that a SASL translation.

## First useful pilot

Define a small adult-learning communication domain with Deaf co-designers: ask for repetition, clarification, a slower explanation or help with a specific lesson concept. Their review determines the exact phrases and variants; do not invent SASL signs from English labels. Collect or license consented multi-signer examples and human signed responses for that bounded domain. Where a phrase is unsupported, show “I could not recognise that reliably” and preserve text/typed choices. A constrained intent pilot is valuable but must be labelled as such, not universal sign translation.

The classroom currently exposes both directions with honest unavailable states. It does not start a camera, microphone, inference request or signed playback because no validated model/clip has been supplied. The live application already supports captioned text and existing consent-based speech; those remain available while this programme is built.

## Primary sources checked

1. [Google MediaPipe Hand Landmarker for Web](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js), checked 23 October: JavaScript hand landmark detection via `@mediapipe/tasks-vision`. The web guide describes video/image processing; frame inference must not stall the main UI. Treat it as a feature extractor, not a SASL translator. Use upper-body/face landmarks as required by the linguistic design rather than hands alone.
2. [MediaPipe Gesture Recognizer](https://developers.google.com/edge/mediapipe/solutions/vision/gesture_recognizer), checked 23 October: gesture categories and landmarks. A built-in hand-gesture classifier is not proof of continuous SASL comprehension. Training a few gestures does not establish sentence translation.
3. [Maswao construction repository](https://github.com/dsfsi/maswo-south-african-sign-language-dataset), checked 23 October: describes a weakly aligned SASL text/video construction pipeline. The README identifies interpreter privacy and YouTube licensing restrictions; original clips are not redistributed. Its visible licence section does not establish a clear commercial runtime/training grant for every underlying video. It is a research lead, not approved training input. Record code licence, source-video rights, performer consent and annotation quality separately. Do not run its downloader or reconstruct a video corpus by default.
4. [SADiLaR resources](https://sadilar.org/en/resources/), checked 23 October: discovery portal for language resources. Each candidate item needs its own language/content/rights inspection. A corpus with “spoken and signed” in its title is not sufficient evidence that its downloadable content supports this SASL task.

No dataset, trained weight, webcam capture or bulk video download was performed for this design/integration task. This research does not assert measured accuracy or completeness.

## Proposed technical boundary

`User action → permission sheet → local capture → bounded frame queue → worker features → temporal SASL model → uncertainty gate → editable text → explicit confirm → shared teacher question/TTS`.

Keep one camera stream and a small bounded buffer; drop stale frames rather than accumulate latency. Resize and sample based on measured device capacity. Feature extraction should run in a worker where the selected API/platform supports it. Pin and self-host reviewed WASM/models; do not fetch unversioned weights from a CDN at session time. Evaluate CPU/WASM before a paid GPU service; test thermal load and cancellation on actual phones. Capture is off by default and visibly stops on Stop, permission revocation, pagehide, route exit, error and disconnect from any chosen remote service.

Model choice is an experiment, not settled branding. Compare a small temporal classifier for the bounded intent pilot with a temporal convolution/recurrent/transformer sequence model where actual data supports it. ONNX Runtime Web or the provider's reviewed runtime can be considered after model export/operations are checked. A language model may help formulate a confirmed meaning in readable language but cannot silently repair an uncertain sign sequence into a confident new meaning.

Signed output is a separate `SignedContentManifest`: locale `sfs`/SASL label, semantic ID, lesson/source revision, domain, performer permissions, reviewer identity/role, review date/version, clip hash/bytes/duration/captions, regional variants and expiry/review state. Only reviewed, permitted, matching content can play. If no match exists, say so and offer text. An avatar asset has additional rig/motion/facial validation and must not share the conversational gesture controller while signing unless the controllers explicitly coordinate.

## Data/contract proposal for review

- `SigningSession`: user/device consent scope, start/stop, mode, model version; no raw video stored by default.
- `RecognitionCandidate`: language, span/time, proposed text/semantic ID, confidence calibration version, alternatives and unknown spans. No invented universal confidence threshold.
- `ConfirmedUtterance`: learner-confirmed edited text and optional source anchor; downstream teacher APIs accept this, not raw unconfirmed predictions.
- `SignedContent`: reviewed manifest above, playback status and source relationship.
- `EvaluationRun`: data provenance, signer-disjoint split, device/domain breakdown, metrics, reviewer feedback and release decision.

This is a proposed addition to the core API/ERD, not a silent schema change. Publish a versioned contract and get acknowledgment from the integrating owner before implementation. Do not store face embeddings or identify signers. Consent to communicate is not consent to train, retain or publish a recording. Landmark sequences can remain sensitive and must be covered by retention/deletion/export rules.

## Evaluation and failure cases

Use signer-disjoint held-out data with varied handedness, skin tone, camera position, motion speed, background, clothing, occlusion and device quality. Evaluate regional vocabulary, facial/nonmanual features, code-switching/fingerspelling and out-of-domain negatives. Include people for whom the chosen capture approach is unsuitable; provide a different interaction rather than misclassifying them.

Measure false accept/reject, out-of-domain abstention, per-intent recall, signer/device breakdown, calibrated uncertainty, correction rate and end-to-end latency. For continuous recognition add sequence error/meaning review; generic text similarity scores alone do not establish communication safety. For signed output, fluent Deaf reviewers assess meaning, grammar, comprehension and comfort, not just whether the avatar moved. Numerical release thresholds are agreed with reviewers using evidence before pilot release.

Test missing one/both hands, face out of frame, low light, mirrored preview versus model coordinates, long pauses, a second person, tab background, stream/device loss, permission denial, stale worker result, model mismatch, no signed clip, unsupported phrase and interrupted playback. Unknown must stay unknown. In education, preserve the source link and question context across all modalities. Do not market the first pilot for emergency, medical, legal or interpreter replacement use.

## Work packages proposed for Claude

1. **SASL-RIGHTS-001:** candidate resource table with original links, actual licence text, permitted use, consent, task/language/coverage and gaps. Deliver research only; no bulk downloads or training until input rights are established.
2. **SASL-CAPTURE-001:** new isolated capture/worker package with explicit camera UI, no automatic recording/upload, stop/cleanup/stale-result tests, and a “tracking only” label while no recogniser is available. Pin runtime and model hash after selecting the exact primary source. Does not touch shared provider/router without an agreed interface/claim.
3. **SASL-INTENT-001:** bounded-domain training/evaluation after dataset and co-design gates; documented split, baseline, abstention and per-signer evidence. No headline general-translation accuracy from training samples.
4. **SASL-OUTPUT-001:** reviewed signed-content manifest/player; no clips represented as reviewed without actual reviewers. Later avatar motion work is separate from conversational Rain gestures.
5. **SASL-INTEGRATE-001:** learner-confirmed recognition into the shared question path; transcript-confirmed speech into available signed content; exact permission/cancellation and accessible text parity tests.

These are suggested future claims, not active workers or asserted community participation. Co-design/review requires real people and cannot be simulated by Claude or Codex.
