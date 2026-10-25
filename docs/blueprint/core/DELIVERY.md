# Delivery plan, SDLC and accountable ownership

**Proposal for fresh chats; no implementation wave is silently running.** Read all owner handoffs and current bus status before assigning any files. CHARACTER-002 is closed; stale earlier roadmap entries do not override that owner evidence. `HB-REVIEW-20261022-0910`, `LUNA-REFERENCE-001` and `REVIEW-C1-C3` reservations were still present during this planning run. Do not reclaim them by age or impersonate their owners.

## Work sequence and definition of done

| Gate / work package | Owner proposal and rationale | Dependencies | Evidence to close | Engineering estimate |
|---|---|---|---|---|
| G0 Plan review and scope freeze | Fresh Claude lead challenges this package; fresh Codex lead reconciles contracts. Independent review catches attractive but incompatible designs. | This package | ADR decisions, acknowledged contract version, chosen first lesson, adult pilot and cost envelope. | 1–2 engineer-days |
| G1 Character acceptance and performance tiers | Claude owns visual/rig craft because it authored Rain and its build gates. Codex independently reviews host API and failure paths. | CHARACTER-002 closed; C1 asset audit status resolved | Asset hashes/licences, stable cue contract, LOD plan, no unsupported walking/signing claim; measurements on named devices. | 3–6 days for first integration + 3–7 days LOD/tuning |
| G2 Lesson runtime and single audio clock | Codex owns state/async integration; Claude supplies reachable scene anchors and authored motion. | G0; stable existing character API | Deterministic tests for play/pause/seek/rate/epoch/cue dedupe; real-board lesson/source revision; no second narrator. | 4–7 days |
| G3 Any-text speech bundles | Codex owns provider/worker/cache; Claude owns mapping/visual QA of visemes and expressions. | G2; per-voice capability probe | Actual-audio hashes, timing tracks, quality labels, timeout/denial fallback, no stale cache; numeric timing errors reported. | 4–8 days for one language/provider path |
| G4 Word-timed point/gaze/board + tap-to-ask | Claude owns anchors, choreography and board rendering; Codex owns semantic selection, validation and interruption. | G2–G3 | Spoken-word landing measurements, target/unit correctness, reachable contact/ray fallback, tap/keyboard equivalence, no queued writing after interrupt. | 5–10 days |
| G5 Two-way push-to-talk | Codex owns mic/session/STT; Claude reviews listen cues and turn UI. | G2, capability/privacy decisions | Explicit mic state, editable transcript, number/negation confirmation, Stop, track cleanup, network/cost limits. | 4–7 days |
| G6 Hands-free conversation | Codex owns orchestration/cancel/admission; Claude reviews interaction and natural motion. | G5 stable, native-language turn corpus | VAD/endpoint/backchannel tests, echo/overlap, interruption latency, held-out user study; RTC hosting decision if needed. | 5–10 days after PTT, may expand after testing |
| G7 Multi-user cloud foundation | Codex cloud/backend owner; Claude independently reviews IaC/identity threat cases. | G0, cloud eligibility, security requirements | Auth/tenant/db/private objects/queue, Linux extraction, usage ledger, delete/export/restore, deployment/rollback receipts. | 8–15 days, parallel to isolated visual work |
| G8 Adult learner pilot | Product/domain/language/accessibility reviewers plus both engineering leads | G1–G7 plus critical security/accessibility gates | Consented task completion, correctness, retention/transfer, actual cost/support logs; documented residual risk. | 2–4 calendar weeks including recruitment and delayed tests |
| G9 isiZulu and Setswana refinement | Fluent reviewers own linguistic decisions; engineering implements selected adapters. | Small capability probes and rights; G5 | Separate STT/TTS/translation/word/mouth quality per locale and code-switch case; no blanket multilingual label. | 1–3 engineer-weeks plus reviewer availability, separately per unsupported path |
| G10 SASL authored pilot | Paid Deaf SASL authors/reviewers lead; Claude works on signing-space visuals, Codex on track delivery/access | Co-design, rights and content scope | Approved signed concepts, learner comprehension, grammar/nonmanual correctness, withdrawal/versioning. | Discovery first; small recorded track may take 2–6 weeks; general avatar translation has no credible estimate yet |

These are planning ranges for focused engineers, not elapsed promises or additive quotes. Two engineers can overlap nondependent work; shared interfaces, recruitment, cloud access, rights, phone testing and review can dominate calendar time. A strong controlled English vertical slice could take roughly 2–4 weeks; an adult cloud pilot with tested languages/security/accessibility is more plausibly 6–12+ weeks under the stated staffing assumptions. Six validated studios and general bidirectional SASL are longer separate programmes. Narrow scope for a hackathon demonstration does not justify labelling it production-ready.

## First implementation assignments after Claude review

**Codex A — teaching director.** Claim a new `studio/src/teaching-runtime/` subtree, focused tests, own doc/handoff only. Build pure state and timing adapters against the agreed score. Do not edit `TeacherProvider`, router, lecture files, manifests or the character contract until exact separate ownership is claimed. Publish API and fixture before Claude consumes it.

**Claude A — Rain lecture adapter.** Claim exact lecture scene/component files and a new adapter subtree after verifying availability. Place Rain in the existing canvas, register measured board targets and test contact/ray/eye lines. Preserve CC-BY credit. No audio-provider/server edits. Expose deliberate targets and capabilities; do not add fake walking.

**Codex B — speech bundle worker.** After A's API acknowledgement, claim new server speech-bundle module, worker tooling and tests. Provider capability probe first; exact-audio timing, cache scope and cancellation next. Shared speech-router/package files require own explicit reservation.

**Claude B — word-action choreography and board.** Consume measured timing from B, never hand-code word timestamps from sentence length. Add board stroke/reveal and point pre-roll in a separate new subtree, with snapshot/target fixtures. Make the learner UI warm, clear and quiet; avoid operational model/version vocabulary on normal lesson screens.

**Codex C — identity/data/cloud.** Isolated `infra/` and backend foundation tasks with own shared-config claims as needed. Stage synthetic fixtures before importing selected private material. No host CLI exposed to learners.

**Joint review.** Integration owner holds shared router/provider/lockfile only when needed, performs one aggregate after sources stabilize, then records semantic/browser/phone/audio acceptance separately. A build green light is not a deployment or domain-quality approval.

## Parallel work discipline

At most three workers plus one root reviewer in this runtime. Earlier request for five workers does not increase available slots. Use actual registered model/effort, or unknown; suggested Luna/Haiku/Sonnet tasks are not evidence those models are available. The fresh Claude lead chooses the actual available model settings and records them. Never assign another session's identity.

Good light-worker tasks: pure envelope validators; synthetic fixtures; local URL adapter tests; asset manifest/hash checks; deterministic schedule tests; source/rights catalogues; documentation/link checks. Complex cancellation, tenancy/security, model choice and integration stay with a senior reviewer. An owner reviews fixes, an independent root checks actual wiring, and every task returns evidence before the next package. Do not keep spawning busywork or create recurring automation.

## SDLC with SSDLC embedded

| Phase | Product/engineering output | Secure-development output | Exit decision |
|---|---|---|---|
| Discover | Adult learner jobs, device/language constraints, first objective and buyer assumptions | Data inventory, responsible parties, source/content/speaker rights, misuse cases | Clear problem, consent scope and testable benefit hypothesis |
| Define | Prioritized use cases, Lean Canvas, acceptance criteria, support assumptions | Risk register, threat model, ASVS control mapping, retention/budget limits | Review accepts bounded pilot scope |
| Design | C4, ERD, APIs, teaching score, responsive flows, fallback UX, ADRs | Trust/tenant boundaries, capability policy, secrets and IaC plan | Both leads acknowledge one contract version |
| Implement | Small owned modules, versioned migrations/fixtures, offline paths | Secure code review, locked deps, no raw model code, least privilege, parser isolation | Unit/component/contract checks and independent wiring review |
| Verify | Integrated lessons, correct calculations, phone/audio/accessibility trials | Negative auth, injection/SSRF, races, cost abuse, restore/delete, dependency/secret scan | Evidence-based pilot readiness and residual risk acceptance |
| Release | Versioned build/image, rollout cohort, training/support, rollback | Separate identities/envs, safe configuration, audit and incident contacts | Controlled release; no private data in public demo |
| Operate | Latency/quality/cost metrics, user feedback, curriculum updates | Vulnerability response, access review, credential rotation, deletion and breach process | Repair/regression, periodic re-evaluation and guarded scale |

## Product words and visual direction

Preserve the user's ivory/cream/olive, charcoal text and restrained warm accent. Use calm daylight, legible contrast, generous board space and a teacher whose face/hands remain clear. One primary task per screen; progressive disclosure for citations/settings. Prefer **Your material**, **Check the text**, **Start this lesson**, **Ask about this**, **I'm stuck**, **Try it**, **Save notes**, **Continue where you stopped**. Avoid model narration, promises of mastery, invented urgency or internal architecture terms on learner screens.

Teaching layout: source/board as main work surface; teacher full or compact at the side; persistent captions and Pause/Stop; a small question composer; an expandable source reference. Phone uses board/text first with compact teacher or portrait. Listening indicator stays visible; mic is never implied by an idle animation. Themes may alter surfaces but cannot hide focus, error, consent or source support.

The logo files are an original provisional design. Claude may propose refinements, but shirt use must preserve readability at small texture size, UV placement, mipmapping and garment deformation. Patch should not clip skin/hair or obscure Rain attribution. Actual texture export belongs to a future claimed character task, not this documentation delivery.

## Scope after the first slice

Extend the same score/target/evidence contract to Engineering and Computer Science before commissioning more beautiful rooms. Engineering needs validated domain equations/interactions; CS needs executable inspectable tasks and code/data reasoning; health/law/mining need domain reviewers and scope limits. Media search/video, motion explainers, CV/opportunity tools and SME workflows share policy and provenance, but each needs its own release criteria. Preserve the whole ambition without pretending all domains can be generated correctly from a prompt alone.
