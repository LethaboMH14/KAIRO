# Build the experience without breaking its learning loop

**Contract:** `kairo-experience/1`, 23 October 2026. **Audience:** university/TVET learners aged 18+. The 112 states describe the known intended experience, not every future possible screen. New edge cases extend this versioned inventory. Read the [core architecture](../core/ARCHITECTURE.md), [teaching contract](../core/TEACHING-CONTRACT.md), [data/API](../core/DATA-AND-API.md), [SSDLC threat model](../core/fnb-app-of-year-hackathon-threat-model.md), [acceptance matrix](../core/ACCEPTANCE.md) and [learning design](../learning-product/) with this file.

## Product structure

Six stable destinations: **Home**, **My material**, **Studios**, **Practise**, **My evidence**, **My direction**. Settings and Help remain available. Global search returns an item's type and source so a learner knows what opens. Back returns to the previous context without discarding drafts. The primary action names the next result, not an internal generation process. Avoid learner-facing terms such as agent, model, vector, MCP, pipeline, payload, fallback and provisional confidence; keep technical information in an optional diagnostic view.

First visit does not demand a microphone, CV, disability information or a paid connection. A sample lesson is available before sign-up. Setup asks goal → study/topic → subjects → language → comfort/access → optional profile → teacher. Each preference remains editable. The current app has no production multi-user identity; sample sign-up is not an authentication implementation.

Public marketing is separate from the signed-in shell. On desktop, a restrained moss sidebar anchors the six destinations. On phones, a compact bottom bar presents the most frequent destinations and Settings exposes the rest; Studios and Evidence remain reachable from Home/search. The review preview may show five items; confirm usability at actual viewport sizes before fixing the production breakpoint/navigation count.

## Screen-to-system ownership

| Area | Existing foundation inspected | Proposed implementation boundary |
|---|---|---|
| Shell and start | `StudioRouter.tsx`, `LearningHome.tsx` | Shared app shell, auth-aware navigation, onboarding; preserve old routes during migration |
| Sources | Source workspace, extraction records and reviewed lesson preparation | Source library, extraction jobs, page/text revision review, selection actions and lesson-plan editor |
| Learning | `LessonWorkspace.tsx`, teacher provider, lecture route | Shared lesson session controller, anchored board, cited answer/hint pane, reading-equivalent journey |
| Rain | Separate Rain character build 6; teacher settings uses older rehearsal path | Adapter into shared teacher provider after asset/provenance review; never mount competing playback clocks |
| Studios | Engineering and CS assets/routes | Common studio entry, inspect/explode/operate and trace controls; retain authored model limits |
| Evidence | Practice/case/progress/evidence foundations | Attempt → reasoning → assistance → source/version → feedback → evidence item; no automatic credential |
| Direction | Role pathways/CV local prototypes | Dated role requirement snapshots, explained evidence gaps, project plan, truthful CV, reviewed opportunity draft |
| Preferences | Local preferences and reading fallback | Controlled memory, downloadable content manifests, consent ledger, export/delete and future account sync |

These filenames describe existing foundations, not approved file reservations. Every implementation chat rechecks the bus and claims exact files before editing. Shared providers, router, CSS tokens, schema and package manifests each require explicit ownership.

## Proposed shared interfaces — agree before implementing

Publish a refinement to the existing contracts before anyone writes a dependent adapter. The preview's `screen-contract.json` is a navigation/copy inventory, not a backend API or replacement for the existing data model.

- **Navigation context:** source ID + revision, lesson ID + version, session ID, selected anchor, return destination. URLs do not contain private text or bearer tokens.
- **Lesson session:** explicit idle/preparing/playing/paused/listening/answering/recovering states; one active utterance ID; cancellable generation; a resume cursor and transcript. Only confirmed session state drives visible controls.
- **Source selection:** page, text offsets, stable anchor, reviewed revision and original excerpt. Any correction invalidates or flags dependent lesson/answer anchors; do not silently cite the old wording as the new revision.
- **Speech bundle:** audio hash/format/duration + provider/language + word timings/visemes + board/point/gaze events on the same audio clock. The client rejects stale utterance IDs. Buffer before starting; abort clears queued gestures and board strokes.
- **Download manifest:** content/version/hash/bytes/state; reading, questions, notes and optional audio are distinct items. A finished marker requires verified local bytes. Last successful save is different from a pending sync.
- **Evidence item:** attempt, rubric version, answer, assistance used, provenance, feedback source and review status. Practice completed, evidence generated and competency externally verified are distinct events.
- **Action proposal:** tool identity, purpose, destination, exact inputs, scope, estimated cost when relevant, expiry and approval status. A one-time approval cannot silently authorize a new recipient, file or command.

## Implementation sequence and review gates

### 0. Freeze the selected experience

**Codex:** own navigation/copy inventory, shared state boundaries and integration review. **Claude:** independently critique visual hierarchy, Rain staging, source-board relationship and reachable paths; propose improvements without silently changing contracts. Both should challenge the 112-state inventory and reduce unnecessary screens when a contextual drawer is better. Do not build 112 disconnected pages.

Deliverable: agreed identity, seven journeys, common shell, route migration map, component inventory and versioned changes. User review of the selected screens precedes wide live-screen replacement.

### 1. Foundations and a truthful home

Claim shell/router/tokens explicitly. Build selected logo assets as a separate design task; keep prototype reconstruction identifiable until master acceptance. Add local Manrope, accessible focus, responsive navigation and plain copy. Keep existing `/engineering`, `/sources`, `/learn`, `/teacher` deep links working; the CS route currently occupies `/`, so do not silently replace the root without a redirect/navigation decision.

Production identity is a separate secured gate: session handling, tenant/owner checks, 18+ consent, verification/recovery, abuse limits, revocation and account lifecycle. Until it exists, label the app a local pilot and avoid fake sign-in success.

**Acceptance:** selected palette and logo match the reference; no broken current routes; accessible keyboard path; phone navigation; empty and resumed Home states; no private data exposed by a route alone.

### 2. Material → reviewed lesson → notes

Build the entire first learning loop before polishing peripheral pages. Keep extraction progress cancellable and resumable, original/source review side by side on desktop and tabbed on phone. Offer scanned image, PDF/document, pasted text and permitted reference input only where the parser actually supports them. Unknown file formats show an honest error, not a misleading success.

Passage actions: explain, ask, translate, highlight, note and star/bookmark; only show a signed explanation where reviewed SASL material exists. Use keyboard-accessible selection menus; right-click is an enhancement. Translation is a separate reviewed derivative, never a replacement for the original. A lesson goal should identify source coverage and missing prerequisites.

**Acceptance:** unclear OCR can be corrected; page/revision citations survive; failed extraction does not lose prior work; saved notes can be exported and reopened; source edits flag stale lessons. No private upload occurs without an explicit destination/consent design.

### 3. Rain teaches one real reviewed lesson

**Claude candidate work:** rig staging, expression/gaze calibration, authored pointing and writing animations, face/body blending, lighting and shirt badge. **Codex candidate work:** shared teacher adapter, lesson state machine, audio-clock scheduling, anchor mapping, cancellation and reading-equivalent interactions. These are proposed responsibilities, not claims that Claude is currently working or has acknowledged them.

CHARACTER-002 is recorded complete in the current character handoff. Independently recheck asset hashes, attribution and review gates. Existing Rain has 77 joints, 31 facial shapes and five clips, no walk or validated SASL. Historical 22–26 fps on one laptop is not a phone performance target or acceptance result. Start with a fixed safe teaching position; design poses/travel paths only when supported. Do not promise that she can touch arbitrary UI or physically walk with absent clips.

Exact-word pointing uses the selected anchor's actual scene or screen coordinates and the speech timeline, with a clear fallback highlight if a target is offscreen or unreachable. An “I’m stuck” event cancels voice, mouth, queued writing and pointing together; returns gaze; provides one smaller step; then resumes at a meaningful checkpoint rather than repeating the entire lesson. Typed questions keep the same anchor. Small listening nods are subtle state-driven gestures, never proof that an unavailable service heard the learner.

**Acceptance:** audio/viseme/gesture alignment measured on supported devices, cancel under delayed responses, resize-safe anchors, keyboard tap-to-ask, reduced motion, captions, no competing utterance, reading parity and an explicit answer when source evidence is insufficient. Validate real audio and avatar interaction with people; muted rendering is not enough.

### 4. Arbitrary speech and two-way conversation

Reuse the speech/cloud research and cost gates. Test actual isiZulu and Setswana recognition, pronunciation, code-switching, subject vocabulary and voice consent independently; do not infer one provider's availability from a language dropdown. Offer text-only throughout. Accent, pace and voice are preferences, not inferred ethnic identity.

Push-to-talk first: explain destination and cost → request microphone once → visible listening → stop/edit transcript → send → answer → resume. Then consider interruptible streaming after latency, echo/noise, false interruption, tab-background, disconnect, denied permission, headset/device changes and speech cancellation all pass. Cloud budgets must have hard limits and fallbacks; user-authorized credits do not justify unbounded runtime costs.

**Acceptance:** word timing for arbitrary lesson text, interruption safety, stale transcript/utterance rejection, provider-error recovery, native-speaker review, explicit retention settings, no hidden always-on recording. No arbitrary translation-to-SASL release without the separate Deaf-led authoring/review programme.

### 5. Studios, practical work and evidence

Apply the same shell and teacher controls around the current engineering/CS scenes. Preserve rotate/inspect/explode/operate and source/rubric labels. Render only one heavy room/teacher scene at once; suspend inactive render loops. A still-image/diagram or reading option is a first-class view, not a broken 3D screen.

Practice asks for reasoning and records hints. Feedback references the rubric and source; uncertainty is visible. Each saved project explains the scenario, data licence, assumptions, tests, result and next improvement. Synthetic/public case data is labelled. AI teammates are roles in a simulation, not real employer assessors.

**Acceptance:** correct authored examples, no scientific overclaim, independence/assistance labels, evidence revision history, honest progress, export semantics, accessible equivalents and no invented credentials.

### 6. Direction, roles and opportunities

Only add live requirements after retrieving original employer sources with dates. For FNB and any other company, store the real vacancy and requirement snapshot, distinguish essential/preferred criteria, show evidence coverage and missing/unknown requirements, and explain any scoring rubric before displaying a percentage. Requirements vary by vacancy; do not treat the sample role in the prototype as researched FNB criteria.

Build learning/project paths around the gaps and learner goals. Include WIL, supervised volunteering, hackathons, public projects and networking, with source freshness and eligibility checks. A CV builder confirms each claim, uses simple headings and parsable text, and never promises ATS success. An application journey previews exact recipient, form fields and attached CV; autofill, upload and submit are distinct permissions. Unknown submission results must be reconciled before retry to avoid duplicates.

**Acceptance:** expired/scam listings handled, documented requirement provenance, explainable gaps, no demographic ranking, learner correction, accessible external-browser handoff, reviewed submission evidence and explicit external-action confirmation. Do not publish applications/profile changes from a design preview.

### 7. Offline continuity, memory and production controls

Prioritise text, sources permitted for offline storage, notes and authored checks. Make downloads opt-in, atomic and verifiable; expose storage and data limits. New answers and live content must clearly request a connection. Queue only safe idempotent writes; never replay an external submission or payment on reconnect. Account switching/sign-out must isolate cached private material; sensitive information must not be accidentally exposed on a shared device.

Memory is inspectable: learner-confirmed goals/preferences plus dated attempt history with purpose and retention. Keep inferred suggestions separate from facts; allow correction, export and deletion. A model cannot silently turn one confused answer into a permanent ability label. A deletion/export workflow needs real server-side authorisation and backup/retention semantics; no fake success screens.

**Acceptance:** cold/offline restart, network flapping, partial download, storage eviction, stale cache, version conflict, device clock drift, denied persistence, two tabs, revoked session, shared device, refresh and migration tests. Production security work covers OWASP/API/AI threats, upload/parser isolation, SSRF, XSS, injection, CSRF, rate limiting, tenant isolation, secrets, provider scope, tool allowlists, audit redaction and incident/rollback operations as specified by the core SSDLC. Do not advertise “quantum safe” without a concrete protocol/provider threat model and validated migration; indiscriminate cryptographic changes do not fix application authorisation.

## Component inventory

Common shell, breadcrumbs/back context, page header, primary-action footer, card, form field with inline validation, selection menu, source-page viewer, reviewed-text editor, job progress/error, lesson plan, teacher stage, anchored board, captions/transport, question/transcript pane, source drawer, diagram/video panel, practice response/rubric, evidence record, role requirement table, project brief, CV preview, external-action review, download manager, memory inspector, consent/provider sheet and conflict resolver.

Prefer shared stateful components with content/configuration for variants. A modal is for a short decision; long source review or settings deserves a route. Browser back and assistive technology must know whether focus is in a modal, drawer or full page. Keep source/evidence content structured rather than injecting model-generated HTML into trusted application chrome.

## Performance and inclusive interaction targets to validate

44 px minimum touch controls; readable text at 200% zoom; explicit focus order and accessible names; visible keyboard focus; no required hover/drag; no motion-only explanation; captions/keyboard parity; colour-independent feedback. Target WCAG 2.2 AA through actual testing, not this checklist alone. Support text zoom without clipping action labels. Screen-reader reading order follows source → explanation → action, even when a decorative room is displayed.

For a room, measure download bytes, first usable teaching time, frame time, memory and thermal behaviour on actual low-end phones and laptops. Choose automatic quality tiers from measured capability and user data preference, not user agent guesses alone. No rigid fps claim or byte budget is asserted by the current prototype. Set and test numerical budgets in the performance ADR before production release.

## Review and handoff procedure

Claude reads the confirmed reference, opens the seven journeys, identifies unnecessary steps, unclear labels, wrong assumptions and consistency/accessibility issues, then leaves a redlined proposal with exact screen IDs and testable changes. Codex reviews state/data/security consequences and updates the contract version only when agreed. Both check the bus before reserving work; reserve shared interfaces separately, publish changes, then let adapters proceed. Do not assume a queued bus message was read.

Run one aggregate live build/test when claimed shared code is stable; add focused state-machine/integration tests where failures matter. Preview checks only verify the 112 local render states, links, assets and absence of network/microphone/persistence APIs. Browser acceptance is still pending; prior denied observation must not be bypassed. Keep implementation checks separate from real learner, educator, employer and Deaf-user validation.
