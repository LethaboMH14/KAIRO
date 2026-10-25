# Architecture, integration and decision record

**Status: proposed v1; 22 October 2026.** Intended for an 18+ controlled pilot before general public use. References to current code are observations; every new service below is a target unless explicitly identified as existing.

## 1. What actually exists

| Evidence anchor | Observed behaviour | Consequence |
|---|---|---|
| `studio/src/StudioRouter.tsx`, `TeacherProvider.tsx` | One shared teacher context surrounds lazy routes. `/teacher` is settings/rehearsal, not the Rain lecture integration. | Extend this boundary deliberately; do not create a second global narrator. |
| `studio/src/lecture/LectureStudio.tsx` | Prepared chapters; local storage progress; browser speech or 11-second advance timer. | Replace timer-driven teaching with semantic lesson segments and a shared presentation clock. |
| `studio/src/lecture/LectureScene.tsx` | R3F canvas, room, board, camera positions, reduced-motion mode. | Integrate the delivered character inside the existing Canvas, with measured world-space board targets. |
| `studio/src/character/types.ts` | Version-1 cue/target/audio contract; point, listen, acknowledge; `move` explicitly unsupported. | Keep this stable. A host adapter translates the new teaching events to it. |
| `studio/server/avatar/speech.mjs` | Three English Chirp 3 HD voices, consent flag, MP3 response, per-process limits and memory cache. | This is the migration starting point, not a multilingual production speech gateway. |
| `studio/server/workspace/routes.mjs` | Local uploaded material, extraction subprocess, reviewed-source revision, cited lesson validation, explicit cloud consent. | Preserve source revision integrity; migrate storage and job execution before multi-user hosting. |
| `studio/server.mjs` | Loopback-only host/origin restriction, no multi-user auth; SQLite trace. | A public ingress change alone would be unsafe and insufficient. |
| `studio/server/tools-core/policy.mjs` | Bounded in-memory permission ledger demonstrator. | Reuse invariants, but durable grants/execution isolation still need implementation. |

## 2. Non-negotiable product mechanisms

1. **Evidence stays attached.** Every teaching claim points to an immutable reviewed source span or clearly labelled external reference. Citations mean traceability, not automatic correctness.
2. **One teaching director owns the lesson.** Models suggest bounded actions; validated application logic decides whether they are legal, reachable, relevant and current.
3. **One audio clock owns presentation.** Wall-clock timers and token-arrival times cannot determine where the mouth, caption or pointer belongs.
4. **Interruption is a transaction.** Stopping speech also stops stale gestures, queued writing and provider generation; already committed board state remains understandable.
5. **Every learner gets the task.** 2D reading, keyboard, typed questions, captions and low-data paths provide the same learning objective, with capability differences stated honestly.
6. **Prove learning, then opportunity.** Projects and assessments generate evidence against a rubric. They do not manufacture employability probabilities, university credit or employer endorsement.

## 3. Target topology

### Browser / phone

React/TypeScript shell; R3F/Three.js teacher and scenes; accessible DOM board/read-along; lesson state machine; audio scheduler; caption track; local input/VAD adapter; source selection; device-tier selector; explicit offline packs. Heavy 3D assets load only when requested. Keep per-frame animation in refs and the animation loop, not React state. Use workers for local analysis where measured useful. No provider secrets or arbitrary terminal access in the client.

Keep a stable **scene target registry** containing semantic IDs, labels, units, source revision, object transforms and accessible DOM equivalents. A selected number is `lessonRevision + segmentId + targetId + value + unit + formula context`, never merely `42`. Translate presentation strings without changing the underlying numeric/unit or source identity.

### Authenticated application service

Initially a modular Node service derived from the existing Express app, containerized for Cloud Run; use one web origin or a reviewed BFF/session boundary. Modules: identity and tenant authorization; source registry; teaching director; assessment; learner memory; tool policy; usage ledger. Streaming gateway handles short-lived authenticated voice sessions and cancellation. Keep the source/lesson API separate from the public asset-serving path.

Use **managed identity** for service-to-service calls. Every HTTP route, background job, websocket subscription and media URL rechecks tenant/resource authorization. Do not treat an opaque ID as permission.

### Jobs and persistence

Cloud Tasks (or another reviewed durable queue) submits bounded ingestion, lesson compilation and audio/timing work to private Cloud Run worker services. Storage paths reference opaque object IDs, not developer Desktop paths. Jobs use idempotency keys, retry limits, dead-letter/review state and tenant quotas. Work that outlives a request must not run as an untracked background promise after the response.

Proposed canonical transactional store: PostgreSQL, with an explicit managed-service budget decision; `pgvector` can share it when retrieval scale warrants it. Private object storage holds originals, derived text, media and manifests with retention labels. Public bucket/CDN holds only licensed generic assets. Never put private lessons into a globally shared speech cache.

Use a transactional outbox to publish durable jobs/events after DB commit. No dual-write assumption that DB success means queue success. Exactly-once effects are implemented through deduplication and transaction constraints, not promised by transport.

### Model and speech adapters

Start with the existing Google project for bounded generation and managed speech where the required locale is verified. Azure Speech is a language/quality/timing option behind the same adapter; it is not automatic multi-cloud mirroring. Local South African models are evaluation candidates behind an identical capability contract. See speech-cloud research for exact IDs, licences and cost scenarios.

Capability matrix keys: `locale`, `sttMode`, `ttsVoice`, `streaming`, `wordTiming`, `visemeTiming`, `translation`, `region`, `retention`, `licence`, `launchStage`, `lastVerified`. Validate this tuple, not just the provider's brand. Text translation support does not establish usable TTS, STT or SASL support.

## 4. Core end-to-end flows

### Welcome to first lesson

Public KAIRO landing → Access explanation → sign in → brief optional profile (language, study goal, institution/year/module, accessibility/device preference) → choose curated material or upload/paste → review extraction → accept proposed goal/lesson outline → lesson. Collect only what this flow needs; CV/photo/bio are optional and can wait. Show profile and extracted skills for correction; never infer race, disability or ethnicity from voice, name or image.

Institution/module discovery is a **suggestion workflow**: search authoritative institution year-specific catalogues; save URL, retrieved date and course edition; show options for learner confirmation. Do not silently overwrite a student's course or scrape authenticated university portals. Course and website terms determine permitted fetching and reuse.

### Source to composed lesson

Authorize upload → quarantine → file signature and size/type checks → malware/archive/decompression/time limits → OCR/text/layout extraction → editable review with original image/page location → immutable reviewed revision → retrieve relevant spans → generate structured lesson → validate citations, numeric examples and required concepts → compile scene actions from approved templates → learner preview → audio preparation → presentation. An unsupported topic receives a useful diagram/text lesson instead of a fabricated simulation.

**World Composer v1** chooses from versioned scene manifests and executable domain models. It may instantiate a database table, a circuit or a cashflow chart using validated parameters. It does not run code emitted by an LLM inside the app's origin. On-demand custom interactive code later runs in a separate-origin sandbox with a narrow message API and reviewed capability grant.

### Teaching and conversation

Reviewed lesson segment → grounded response plan → structured claim/action validation → speech bundle → audio clock → coordinated gaze/hand/board/captions. Learner input snapshots relevant board/lesson/source state. Voice turns use STT finalization and explicit confidence repair. An interruption cancels the previous generation epoch before the next response can commit. The learner's actual heard prefix and board state remain part of context.

### Practice to work readiness

Concept check → authored/synthetic practical task → rubric-scored evidence with tool/version/dataset metadata → explain gaps → target next practice → learner-approved portfolio/CV export. Role matching shows requirement coverage and unknowns, using dated job evidence. Keep interest, eligibility, self-report and verified performance distinct. Opportunity applications use a preview and per-destination approval, with receipt/status rather than invented success. FNB incentives require a real partner contract, eligibility rules, fraud controls and redemption accounting; until then only a labelled concept.

## 5. Architectural decisions and rejected shortcuts

| ADR | Proposed decision and reason | Trade-off / revisit trigger |
|---|---|---|
| 001 | Client-rendered 3D, not cloud-rendered avatar video. Reuses Rain and supports direct interaction. | Device GPU budget matters; measure phone LOD. Remote video only if accessibility/performance evidence justifies cost/latency. |
| 002 | Modular monolith + private workers first, not a Kubernetes microservice fleet. | Boundaries remain separate modules; adopt GKE only for a measured operational need, persistent RTC/SFU requirements or GPU-serving scale. |
| 003 | Cascade STT → grounded text → TTS for initial teaching, with typed and push-to-talk first. | More stages than end-to-end audio models, but source validation, transcript correction, timing and language routing are inspectable. Benchmark realtime speech-to-speech later. |
| 004 | Audio-derived timings or provider events for actual audio; no character-count lip sync. | Adds preparation delay. Cache approved segments and stream only when timing look-ahead is available. |
| 005 | PostgreSQL canonical relational model for tenant/source/revision/evidence/consent. | Managed DB has standing cost. Firestore is a valid alternative for a tightly scoped pilot, but must not create an unreviewed second canonical store. |
| 006 | Managed inference first; local/open weights evaluated in isolated jobs. | API use costs money; self-hosting needs concurrency/quality/licence evidence and can burn trial credit while idle. |
| 007 | One chosen cloud home, deliberate per-feature external adapters. | Cross-cloud speech has latency/egress/data-transfer implications; multi-cloud is portability, not automatic failover without consent. |
| 008 | Source-grounded templates and domain simulators before arbitrary generated worlds. | Less magical coverage initially; greater correctness, repeatability and mobile performance. |
| 009 | Learning memory is explicit structured state, not unlimited raw chat retention. | Learner can edit/delete it; a model's summary is tentative, not a fact about ability/personality. |
| 010 | Reviewed SASL track distinct from spoken-language translation. | Costs authoring/review effort; does not pretend generic hand animation conveys language. |
| 011 | Public assets cache globally; private text/audio caches tenant-scoped with revocation/expiry. | Lower cache hit rate but avoids cross-user disclosure. |
| 012 | Existing version-1 character contract stays stable behind host adapters. | New writing/locomotion/signing capabilities need new version and regression evidence. |

## 6. Smoothness, connectivity and capacity

Performance modes are proposals to benchmark: full teacher on capable devices; lighter mesh/textures with shadows off and capped DPR; 2D portrait/board; text-only. Start low, upgrade on measured frame time with hysteresis, avoid oscillating modes, allow manual override. Do not repeatedly benchmark until a device overheats. Freeze idle loops and stop unused audio/video/cameras on route changes.

Suggested pilot gates (targets, not measured claims): a 100 ms synchronous visual response to buttons, p95 local stop-to-silence ≤200 ms, caption/word-action timing error p95 ≤150 ms, lip shape/audio error p95 ≤120 ms on supported test material; ≥30 fps on named supported low tier or automatic readable fallback. Target first useful text in ≤2 s and first live speech ≤3 s on a defined network; show honest progress if exceeded. Audio/gesture lead times may need adaptation for a slower device. Exact zero-error timing is physically unrealistic; reports must include tolerances and measured devices.

Low-data mode defaults to DOM/text, no autoplay videos, small voice chunks only on request and visible download estimates. An offline pack is an explicit, licensed, versioned snapshot with selected text, diagrams, assessment rules and optionally audio/model assets. Show **Saved for offline use** only after verified storage writes and manifest checks. Offline questions outside the saved material become drafts or deterministic local help; never masquerade stale data as live search.

Cloud Run websocket support is usable for a controlled gateway but connections have request timeouts and reconnect can reach another instance. Persist semantic checkpoints and use resumable sequence IDs; do not depend on in-memory affinity. An open connection also affects compute cost. A future LiveKit/WebRTC transport requires a real RTC hosting/ICE/TURN plan rather than assuming Cloud Run provides an SFU. [Google WebSockets guidance](https://docs.cloud.google.com/run/docs/triggering/websockets).

Start voice admission with a small explicit concurrent-session limit, measure CPU/memory/provider quotas per active turn, then size. Queue preparation work, reserve budget before inference, and release reservations after cancellation/reconciliation. Scale-to-zero and max-instance limits reduce spend but do not constitute complete billing caps.

## 7. Innovation worth pursuing

- **Point to the misunderstanding:** tap a number, sign, line or model part; the teacher keeps its source, unit, state and prior attempts when explaining. A wrong quantity cannot be addressed through a loose screenshot guess.
- **Rehearse the alternative:** change one variable and watch the consequence in a validated simulation; ask the learner to predict before revealing. A counterfactual task can demonstrate understanding beyond copied notes.
- **Trace the explanation:** a compact “Why this?” action exposes the saved source span, the reasoning step and which parts are illustrative, without cluttering normal teaching.
- **Resume from what was heard:** the next hint references the actual audio prefix and committed board state after an interruption. Unheard generated text does not become assumed knowledge.
- **A common teaching score:** speech, DOM board, 3D, captions, accessible text and reviewed SASL use the same semantic lesson graph, with separate modality timing. This is the main reusable platform mechanism.
- **A portable evidence trail:** a learner-controlled proof pack records project artefacts, task conditions, rubrics, corrections and consented sharing. Evidence ownership becomes useful across study, employment and enterprise.

These are design hypotheses and differentiation mechanisms, not claims that no competitor has attempted them. Validate against real learner needs and current competitors before making novelty claims.
