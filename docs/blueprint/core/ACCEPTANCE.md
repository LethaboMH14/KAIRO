# Use cases, edge conditions and release evidence

Companion [learning inventory](../learning-product/LEARNING-PRODUCT-BLUEPRINT.md) defines learner use cases and the Lean Canvas. This matrix expands technical and adversarial acceptance. **All rows below are proposed requirements, not executed test results.** Test fixtures must be authored/synthetic or rights-cleared, with no personal learner data in CI.

Equivalent reading/keyboard access applies to supported lesson objectives; offline completion applies only to tasks inside a successfully saved, licensed offline pack. Live search, cloud generation, cloud speech and external applications may require connection. Preserve drafts and explain that boundary rather than promising network-independent completion of every task. “No raw audio saved by KAIRO” does not mean a provider retains none: disclose and verify the selected provider's region, processing/retention terms and controls before transmission.

| ID | Trigger / edge case | Required behaviour / evidence |
|---|---|---|
| A01 | First visit; no account/CV | Sample lesson and brief explanation; optional profile; no forced photo, phone or mic. |
| A02 | Social sign-in failure/account recovery | Safe retry/alternative, no account enumeration, session expiry shown; no duplicate identities silently merged. |
| A03 | Under-18 learner enters adult pilot | Clearly ineligible for this pilot; no pretending checkbox alone verifies age or parental authority. Minors programme separately designed. |
| A04 | Wrong/stale university module year | Show source/date/edition, related-match status, confirm or manually correct; no fake institution endorsement. |
| A05 | CV extraction uncertain | Field preview linked to source; learner corrects/confirms; no invented grades/employers/proficiency. |
| A06 | Bad OCR/rotation/handwriting/formula/table | Side-by-side original location; editable text; uncertain symbols visibly reviewed. Unsupported pages don't enter a lesson as facts. |
| A07 | Encrypted/corrupt/oversized file, zip bomb | Refuse or safely terminate with preserved prior source; bounded page/pixel/archive/time/memory; delete temp files. |
| A08 | Edit source during extraction/generation | New revision invalidates stale results and citations; latest user intent wins, not whichever request finishes last. |
| A09 | Conflicting sources/student answers mistaken for memo | Label source and disagreement; ask for clarification/authoritative reference; no fabricated official answer. |
| A10 | Unsupported topic/scene | Grounded reading/diagram lesson with coverage limits; no false simulation or broken room. |
| A11 | Rain GLB/HDR/decoder fails; WebGL lost | Reading/2D immediately usable, retry optional, asset credits retained where displayed; no endless spinner. |
| A12 | 3D load slow/hot/low-memory device | Small asset tier/shadows off/DPR cap or 2D; measure actual device; no phone 60fps claim from laptop-only test. |
| A13 | Dynamic target moves/scales/rotates | Correct world transform and normal; contact/ray target remains meaningful; avoid impossible arm reach. |
| A14 | Tap number appears in several places | Context uses stable target/segment/unit/formula ID; confirm ambiguity; keyboard equivalent selects same target. |
| A15 | Tap while orbiting/double tap/rapid selection | Drag threshold/cancel; one selected target and current response epoch; no camera and accidental ask simultaneously. |
| A16 | Word normalized/translated/code-switched | Map display↔spoken token explicitly; changed word order has its own track; numbers/units preserve meaning. |
| A17 | Rate/pause/seek/stall/device-audio latency | Mouth/caption/gesture resample actual audio clock; no drift/replay of committed board writes. |
| A18 | Visemes for wrong audio/hash/voice | Reject track; neutral/energy-only truthful fallback; no apparent exact sync with stale sample timings. |
| A19 | Provider no word/viseme events | Distinguish capabilities; postanalyse exact audio or use segment timing; never label energy mouth as phoneme timing. |
| A20 | NaN/negative/huge/unsorted timeline | Refuse bounded schema-invalid data before animation; safe neutral pose; no allocation/loop explosion. |
| A21 | I'm stuck during word or board stroke | Stop output immediately, retire epoch, neutral mouth, cancel pending writing, preserve committed state/heard prefix; offer contextual hint. |
| A22 | Simultaneous interrupt/new ask/old error | Old finalizer cannot stop new reply or overwrite hint; one cue terminal result; deterministic reordered-event test. |
| A23 | Stop/revoke mic/route unmount/tab close | Audio buffers flushed, tracks closed, providers cancelled best-effort, no lingering capture or listening indicator mismatch. |
| A24 | Auto-play blocked/audio device unavailable | Explicit Play/Retry and readable lesson; browser permission does not imply audio output succeeds. |
| A25 | Mic denied/unplugged/busy/insecure context | Typed/push-to-talk fallback, specific actionable state, no repeated permission loop. |
| A26 | Noise/echo/two speakers/backchannel/stutter | Configurable turn handling, correct transcript before action; no automatic grading from noise; allow extra response time. |
| A27 | Recognized number/negation/name uncertain | Show transcript/correction/confirmation; don't perform wrong calculation or assess against wrong utterance. |
| A28 | Long silence/mid-thought pause | Ask gently or wait; silence not an answer/consent; Stop and send manually available. |
| A29 | Local-language voice unavailable | Explain per-capability limit; text stays selected language; alternate voice only chosen by learner. No silent language switch. |
| A30 | Nods while typing/reduced motion/SASL | Local subtle acknowledgement, not score/emotion inference; static reduced-motion equivalent; don't corrupt signing grammar. |
| A31 | SASL term/content unreviewed | No invented sign output; reviewed video/text/caption alternative, version/reviewer status and full hands/face visible. |
| A32 | YouTube embed disabled/removed/age/region restriction | Approved link fallback, source/date, learner-controlled playback; no invented transcript or promised availability. |
| A33 | Need video OCR/translation | Only permissioned own/licensed file or supplied frame/transcript enters analysis. Cross-origin iframe pixels are not accessible app data. No generic download/caption scraping shortcut. |
| A34 | Web search includes injection/paywall/stale page | Treat as data, respect allowed access, cite/date/coverage, isolate fetch, don't execute embedded instructions. |
| A35 | Generated animation/HTML | Validated template/data first; future code separate-origin sandbox, no app cookies/host terminal. Clear difference between diagram and simulation. |
| A36 | Offline before/after lesson save | Verified pack manifest, visible capability boundary; cached practice works only within pack; drafts queued and labelled; no fake live answer. |
| A37 | Storage quota/eviction/private browsing | Show save failure/recovery export; never falsely say synced; unsaved work preserved in memory where possible. |
| A38 | Two devices/tabs edit memory/progress | Version conflict resolution, idempotent attempts, no silent overwrites; logout isolates local/private packs. |
| A39 | Reconnect to another service instance | Resume semantic checkpoint and last accepted sequence; dedupe events, new epoch where required; no reliance on affinity. |
| A40 | Provider 429/503/timeout/cost ceiling | Preserve lesson, explain pause, offer saved/local mode; bounded retry/backoff; no double billing loop or unconsented provider switch. |
| A41 | Malicious peer tenant ID/job/signed URL | Denied independently of opaque IDs; stale URLs expire; no leaked paths/stack traces/private snippets. |
| A42 | Delete/account revoke during background job | Fence before commit, cancel/delete derivatives/index/cache; backups expire per stated policy; auditable receipt without unnecessary retained PII. |
| A43 | Tool approval replay/document edited | Version/destination/action/fields/expiry bound; reject stale/reused grant; show new preview rather than autoexecute. |
| A44 | External job/CV application timeout | Pending/unknown status until receipt; don't send twice automatically; explicit preview and consent before sending sensitive fields. |
| A45 | Employer match/ATS claim | Dated criteria coverage and gaps, parseable truthful CV and preview; no “ATS guarantee,” hiring probability or fabricated skill. |
| A46 | Assessment after hints/translation/retry | Preserve assistance level and first attempt; fresh independent changed case; accessibility support not equated with cheating. |
| A47 | Medical/legal/engineering high-impact ambiguity | Educational scope/validated model, expert-reviewed content and escalation; don't produce unsafe operational instructions from hallucinated simulation. |
| A48 | Incentive redemption/fraud/conflicting partner rules | Keep hypothetical until agreement; later identity/eligibility/ledger/idempotent receipt review; no fabricated FNB voucher. |
| A49 | Broken deploy/migration/dependency | Staging tests, pinned digest, safe rollback/restore, no disable-auth workaround; preserve usage/audit data. |
| A50 | Screen reader/keyboard/zoom/caption/colour mode | Same learning objective, visible focus and meaningful labels/order, no canvas-only assessment, no timed gesture required to answer. |

## Required evidence layers

1. Pure deterministic clock/cancellation/schema/policy tests with fake scheduler and deliberate reorder, duplicate and late events.
2. Integration tests with actual backend storage/queue/auth synthetic tenants and known provider fixtures, plus a small separately budgeted live capability probe.
3. Scene/rig geometry and asset checks, followed by real rendering and visual review on named devices. A DOM snapshot is not audio or 3D acceptance.
4. Real audio-device tests: first-audio, stop-to-silence, word/viseme error, seek/rate, echo, headphones/speaker, mic revoke and dropout. Muted headless timing is only one limited measurement.
5. Manual keyboard/screen-reader/touch/reduced-motion and native-language/Deaf review. Automated accessibility scans cannot establish equivalence alone.
6. Learning evaluation against accessible text-first material, with held-out changed tasks and delayed recall; blind/domain review where practical. Engagement is not educational efficacy.
7. Operational tests: admission/usage reservations, provider failure, cold start, queue retry, restore, export/deletion, concurrent sessions, tracing without PII.

Existing browser observation denial remains in force for this task. No current localhost/browser acceptance was performed by this planning package; do not evade it through CDP, a headless runner, another connector or proxy. A future authorized review records the actual acceptance method and scope.

## Media constraints supported by primary documentation

YouTube's [IFrame API](https://developers.google.com/youtube/iframe_api_reference) supports controlled embedded playback, not arbitrary access to frames/transcripts. Its [minimum functionality](https://developers.google.com/youtube/terms/required-minimum-functionality) includes player identity and display requirements; retain the provider's player/attribution rather than disguising it. Review [developer policies](https://developers.google.com/youtube/terms/developer-policies) before transcript extraction, dubbing, caching or other transformations. For analysis/dubbing, start with the learner's own or licensed media and an explicit processing scope. A link to a video is not permission to download or train on it.
