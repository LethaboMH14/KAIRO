# Independent root-design review of the learning blueprint

**Task:** BLUEPRINT-LEARNING-REVIEW-001  
**Reviewer:** codex-luna-learn-review-20261022-a (gpt-6-luna, low)  
**Date:** 22 October 2026  
**Scope:** Read-only comparison of the learning-product blueprint against root architecture, teaching, data/API, delivery, acceptance, cloud runbook and threat-model documents. Only this review note and the learning handoff were in scope for edits.

## Findings and resolution status

### R1 — Voice-retention language needs to distinguish KAIRO storage from provider processing — resolved

**Priority: P1 privacy wording.** In the use-case table, LP-15 says audio is “transient unless opted in,” and LP-16 says “voice not retained.” Those statements can be read as guarantees across an external speech provider. Root design requires checking provider data location/retention and says raw audio is off by default, with a final retention policy still to be agreed. The current blueprint otherwise correctly calls for capability and privacy review, but these two acceptance statements are too absolute for unknown provider terms.

Recommended wording for a future blueprint edit: “KAIRO does not record or persist raw microphone audio by default. Before a provider receives audio, disclose its processing/retention terms and region, obtain the required consent, and enable only an evaluated capability; make no zero-retention promise unless the provider contract and configuration establish it.”

**Resolution:** LP-15 and LP-16 now state the no-app-recording/persistence default separately from provider processing; they require region and retention review, disclosure, and consent before sending audio, and prohibit zero-retention claims without verified provider terms/configuration.

Relevant root evidence: CLOUD-RUNBOOK provider location/retention review; DATA-AND-API retention proposal; threat-model T11 voice privacy and API-to-provider boundary.

### R2 — Global offline-equivalence statement is overbroad — resolved

**Priority: P2 acceptance scope.** The opening of “Teaching-use-case inventory” requires every use case to complete equivalently when the network is unavailable. That is not achievable for live course discovery, online video, cloud-generated answers or opportunity freshness. The root design instead defines explicit, licensed, versioned offline packs; online-only material should be labeled unavailable or saved as a draft when offline.

Recommended wording for a future blueprint edit: require equivalent completion only for a task explicitly included in an available offline pack. For network-dependent tasks, require clear offline status, preserved work, and a safe resume/fallback path without presenting stale results as live.

**Resolution:** The use-case introduction now limits equivalent offline completion to tasks in available, licensed packs. Live network-dependent functions must show pending/unavailable state, preserve drafts where appropriate, and resume safely without representing stale results as live.

Relevant root evidence: ARCHITECTURE offline-pack boundary; DATA-AND-API retention/sync and conflict behavior; ACCEPTANCE A36–A40; CLOUD-RUNBOOK local/private boundary.

## Requirement coverage

| Requested area | Coverage in blueprint |
|---|---|
| Product and Lean Canvas | All nine blocks; customer, channel, revenue and advantage are explicitly hypotheses with validation evidence. |
| Adult university/TVET learner flow | Scope is 18+ pilot; onboarding, goals, institution/module discovery, source review, optional profile/CV and evidence are described. |
| Teaching avatar, Rain and lip sync | Rain status is accurately marked not integrated; LP-12 acceptance requires asset/rights/audio/locale tests. Timed speech section separates word/phrase alignment from phoneme/viseme timing. |
| Two-way multilingual teaching | Separate input, teaching, source, answer, caption, assessment and voice fields; Setswana and isiZulu each have distinct review/evaluation paths. |
| SASL | Separate Deaf-led authored/validated pathway; no spoken-ASR, ASL, generic gesture or unreviewed generated-sign claim. |
| User-specific interaction requirements | LP-15–18 cover spoken word and gaze/point/board, tap-number explanation, immediate mid-sentence “I'm stuck” interrupt with heard-prefix/checkpoint and learner-chosen semantic resume, authored nods without emotion inference, and phone low-data completion without 3D. |
| Public video and visual lessons | LP-13/14 cover dated, attributed, timestamped video links and bounded interactive model use with access alternatives and failure paths. |
| Adaptive learning and mastery | Transparent, objective/task/language/support-level evidence; delayed recall and changed-context reassessment; no single opaque ability/employability score. |
| Learning-to-work and employer/FNB incentives | Synthetic tasks, provenance-backed artifacts and dated criteria mapping; no job outcome claim; employer/FNB sponsorship remains hypothetical pending agreement. |
| Pedagogy and evaluation | IES/EEF/CAST rationale with population limitations; text-first comparison, delayed retention, transfer, language/access testing and synthetic workplace protocol. |
| Production authorization/status | Stage H now recognizes broad authorization while accurately saying not implemented/accepted and requiring a reviewed deployment plan within verified credit/budget plus separate security/privacy/compliance/rights/acceptance gates. |

## Alignment review

The repaired “I'm stuck” interaction now aligns with the root teaching contract: stop output immediately, cancel stale cues/actions, preserve the heard prefix and committed board state, then resume only after learner choice at a semantic boundary. Word timing remains distinct from phoneme/viseme timing. The production-status wording does not imply that cloud deployment or production acceptance has occurred.

No runtime or root architecture file was changed. No browser, deployment, model or cloud action was performed.
