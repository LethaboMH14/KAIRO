# KAIRO blueprint and identity

**Status: proposed future design.** These diagrams describe a target architecture and experience for KAIRO Access. They do not claim the current local prototype already implements this architecture, accessibility behavior, speech alignment, cloud service or security posture. The confirmed pilot audience is adults aged 18 and over.

Start with the [target architecture visual](kairo-target-architecture.html), then use the editable diagrams below to inspect the wider platform, data, and interruption behavior. Source files are Mermaid and JSON. Treat the [logo kit](logo/README.md) as provisional pending user selection and trademark review.

## C4-style context

```mermaid
flowchart LR
  learner[Adult learner<br/>18+ pilot] -->|source, voice, touch, keyboard| access[KAIRO Access<br/>interactive learning]
  staff[Educator / pilot operator] -->|curated material and support| access
  access -->|consented, policy-filtered requests| providers[Managed speech and AI providers]
  access -->|approved external action only| tools[Restricted tool runner]
  access -->|private records and media| data[(KAIRO tenant data)]
  deaf[Deaf SASL authors and reviewers] -->|reviewed signed-language assets| access
```

## C4-style container view

```mermaid
flowchart LR
  subgraph client[Client device]
    ui[React experience]
    spatial[Three.js / R3F scene]
    fallback[Lightweight 2D, transcript and captions]
    ui --> spatial
    ui --> fallback
  end
  subgraph kairo[KAIRO-controlled application boundary]
    edge[Authenticated API]
    orchestrator[Session and lesson orchestrator]
    queue[Durable job queue]
    workers[Ingestion and lesson workers]
    records[(PostgreSQL tenant records)]
    objects[(Private object storage)]
    runner[Restricted, allowlisted tool runner]
    edge --> orchestrator
    orchestrator --> records
    orchestrator --> objects
    orchestrator --> queue
    queue --> workers
    workers --> records
    workers --> objects
    orchestrator --> runner
  end
  subgraph providers[External provider boundary]
    ai[Managed model adapter<br/>Google first candidate]
    speech[Managed speech adapter<br/>Azure speech candidate]
  end
  ui -->|HTTPS and scoped session| edge
  orchestrator -->|policy-filtered calls| ai
  orchestrator -->|consented speech calls| speech
```

**Platform choices are candidates.** The target keeps 3D rendering on the client; it does not assume cloud GPU video. Ingestion, OCR, lesson packaging and other long-running tasks run asynchronously. Managed services sit behind adapters so provider choice, consent, cost and fallback can be reviewed independently. Tenant isolation, retention, encryption, deletion, monitoring and provider terms need implementation decisions and validation before deployment.

## Learner use cases

```mermaid
flowchart LR
  learner((Adult learner)) --> source[Provide supported source or question]
  learner --> explore[Explore scene, simulation or 2D alternative]
  learner --> interrupt[Interrupt teacher mid-sentence]
  learner --> point[Select a passage word<br/>touch, pointer or keyboard]
  learner --> number[Tap a number in the lesson]
  learner --> access[Choose captions, keyboard, touch or SASL]
  source --> lesson[Receive traceable lesson and source references]
  explore --> explain[Ask contextual question or request another explanation]
  interrupt --> hint[Get a short hint and a resumable checkpoint]
  point --> exact[Hear the exact selected word explained]
  number --> context[Hear what that selected number represents]
  access --> modes[Use low-data phone mode and accessible alternatives]
  teacher((Animated teacher)) --> gazeCue[Optional teacher gaze cue toward the active passage]
  gazeCue --> point
  reviewer[Deaf SASL authors and reviewers] --> signed[Use authored, reviewed SASL content]
```

### Interaction rules

- A word anchor identifies a transcript word and its source span. Learners select a passage word with touch, pointer or keyboard. Teacher gaze toward the active passage is a separate optional presentation cue; learner gaze input is not required by this design. Word anchors are separate from viseme or mouth-shape animation data. Word-to-audio alignment must be measured on actual voices and languages; no precise timing is promised before that evidence exists.
- A mid-sentence interruption is one atomic turn change: cancel the current generation and playback, checkpoint the learner's place, and only then present a short hint. Stale work must not append after the new turn.
- The teacher can show small listening nods while the learner types or speaks. Keep these subtle, interruptible and disabled or reduced with motion preferences.
- The phone route should minimize transfer and avoid requiring 3D assets. Offer text, captions, compressed audio where available, and resumable downloads. Measure actual data use before stating a target.
- SASL material is authored with Deaf contributors and reviewed by Deaf reviewers. Generated or unreviewed signing is not represented as validated SASL.

## Proposed data model (ERD)

```mermaid
erDiagram
  TENANT ||--o{ MEMBERSHIP : grants
  USER ||--o{ MEMBERSHIP : joins
  USER ||--o| PROFILE : has
  TENANT ||--o{ SOURCE : owns
  USER ||--o{ SOURCE : uploads
  SOURCE ||--|{ SOURCE_VERSION : versions
  USER ||--o{ LESSON : requests
  SOURCE_VERSION ||--o{ LESSON : grounds
  LESSON ||--o{ JOB : produces
  LESSON ||--o{ LEARNING_SESSION : supports
  LEARNING_SESSION ||--o{ TURN : contains
  TURN ||--o{ TRANSCRIPT_SEGMENT : records
  TRANSCRIPT_SEGMENT ||--o{ WORD_ANCHOR : aligns
  LESSON ||--o{ SCENE_STATE : configures
  LEARNING_SESSION ||--o{ ASSESSMENT_EVENT : records
  USER ||--o{ PROGRESS_RECORD : accumulates
  LESSON ||--o{ PROGRESS_RECORD : informs
  TENANT ||--o{ MEDIA_ASSET : stores
  TENANT ||--o{ PROVIDER_CONSENT : grants
  LESSON ||--o{ SIGNED_LANGUAGE_ASSET : may_include
  TENANT ||--o{ AUDIT_EVENT : records
```

Identity follows the proposed core data model: one `USER` may have memberships in multiple `TENANT`s; `MEMBERSHIP` carries tenant-specific role and status; and `PROFILE` is attached to the user, not copied once per membership. Tenant-owned records retain `tenant_id` and server-side authorization. A membership joins a person to an organization; it does not create another person identity.

Every tenant-owned row carries a tenant key and is accessed through a server-checked tenant scope. Object references are private identifiers, not public URLs. `WORD_ANCHOR` stores text identity and optional measured audio offsets; viseme timing belongs to a separate animation track. A SASL asset records authorship and Deaf-review provenance. This is a proposed conceptual model, not a migration-ready schema.

## Interruption sequence

```mermaid
sequenceDiagram
  actor Learner
  participant UI as KAIRO client
  participant API as Session orchestrator
  participant Gen as Lesson / speech generation
  participant Store as Session store
  Learner->>UI: Interrupt with "I'm stuck" (voice, text or tap)
  UI->>UI: Atomically advance turn epoch; stop local playback
  UI->>API: Interrupt(turn_id, new_epoch, checkpoint)
  API->>Store: Save checkpoint; mark prior turn cancelled
  API->>Gen: Cancel prior generation and speech work
  Gen-->>API: Cancellation acknowledged or stale result
  API->>API: Reject output from prior epoch
  API->>Store: Append short hint to the new turn
  API-->>UI: Hint + resumable position
  UI-->>Learner: Show and speak hint; keep captions available
```

Cancellation across a network is best-effort, so the server also checks the epoch before persisting or returning generated output. If cancellation acknowledgment is late, stale output is discarded. The client keeps the checkpoint usable if speech or network calls fail.

## Interruption lifecycle

```mermaid
stateDiagram-v2
  [*] --> Teaching
  Teaching --> InterruptRequested : learner says / taps "I'm stuck"
  InterruptRequested --> PlaybackStopped : stop local audio and advance epoch
  PlaybackStopped --> CheckpointSaved : save current place
  CheckpointSaved --> CancellingPriorTurn : cancel generation and speech
  CancellingPriorTurn --> HintReady : cancellation confirmed
  CancellingPriorTurn --> HintReady : timeout; prior epoch fenced
  HintReady --> Teaching : deliver concise hint; resume on learner choice
  Teaching --> Paused : learner pauses or leaves
  Paused --> Teaching : resume from saved checkpoint
  InterruptRequested --> RecoverableError : checkpoint cannot be saved
  RecoverableError --> Paused : retain local recovery point
```

## Local prototype boundary

The repository currently has a local development application with a computer-science request trace, Lecture Theatre, Engineering Studio, source extraction and cited lessons, browser-local progress, a workplace case, pathway preparation, and a teacher rig/voice rehearsal. Optional Google services require explicit consent. Those facts describe the current local prototype; they do not demonstrate this target's tenant architecture, production security, exact word timing, SASL quality, phone data budget, or measured educational benefit.

## Validation status

The standalone architecture specification is checked by the Archify renderer in showcase mode and delivered as a frozen HTML artifact. That validates diagram structure and composition only. No browser-size, device, accessibility, provider, security, timing or perceptual review is claimed. Those remain acceptance work.
