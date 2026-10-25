# KAIRO — production blueprint and fresh-chat entry point

**23 October experience update:** the user confirmed the rounded continuous-path K-like mark, geometric KAIRO lettering and flowing line patterns, called **C** in their supplied reference. The architectural/serif alternative is reserved for a later use. Earlier logo proposals in this pack are superseded by the [confirmed brand decision](../experience/BRAND-DECISION.md). Do not implement an old logo based on its letter or filename.

The [complete experience package](../experience/README.md) now adds a **112-state clickable app prototype, seven guided journeys, six visual boards, exact screen wording/actions and a staged build plan** covering start, material review, teaching, studios, practice, evidence, direction, all settings and recovery. [Open the prototype](../../../design/app-experience-20261023/index.html). It incorporates saved images from the existing Rain/engineering/CS work; new screen integrations and future capabilities remain proposals. Read this package before changing learner-facing screens or continuing visual implementation.

**Design baseline: 22 October 2026, Africa/Johannesburg. Version 1.0 proposal for independent Claude review.** This is an implementation-ready design package, not a claim that the proposed services, learning outcomes or voice capabilities already work. User confirmed an **18+ university/TVET pilot**, with minors a later separately designed release. The recurring 30-minute automation was deleted at the user's request; do not recreate it.

KAIRO Access turns a source into something a learner can understand, explore, practise and prove. The central experience is a warm, expressive Rain-based teacher who can point at the learner's actual material, stop when interrupted and help them solve a problem. The product should succeed in a plain reading view as well as in a beautiful room.

## Read in this order

1. [Architecture and decisions](ARCHITECTURE.md): actual baseline, target topology, trade-offs, flows and domain boundaries.
2. [Teaching and voice contracts](TEACHING-CONTRACT.md): exact-word gestures, tap-to-ask, interruption, speech bundles and cancellation.
3. [Data model and API](DATA-AND-API.md): proposed ERD semantics, schema constraints, identity, tenancy, storage and endpoints.
4. [Delivery, SDLC and ownership](DELIVERY.md): dependency gates, estimates, bounded Codex/Claude tasks and release evidence.
5. [Security threat model](fnb-app-of-year-hackathon-threat-model.md): code evidence, target threats, SSDLC and residual risk.
6. [Use-case and edge-case acceptance matrix](ACCEPTANCE.md): testable normal, failure and accessibility behaviour.
7. [Cloud preparation runbook](CLOUD-RUNBOOK.md): region/budget/identity gates, deployment migration and rollback.
8. [Fresh Codex and Claude prompts](FRESH-CHAT-PROMPTS.md): copy one into a new chat in this folder.
9. [Model and learning operations](MODEL-AND-LEARNING-OPS.md): task routing, adaptation, controlled memory, evaluation and justified fine-tuning.

Companion workstreams:

- [Speech, models, languages and cloud research](../speech-cloud/): primary-source model cards, licensing, language-specific capabilities and cost assumptions.
- [Learning design, use cases and Lean Canvas](../learning-product/): adult pilot, pedagogy, validation and commercial hypotheses.
- [Editable diagrams and original logo proposal](../visuals/): proposed architecture, use cases, ERD, sequence/state diagrams and vector shirt badge.
- [Research ledger](RESEARCH.md): primary sources checked by root and what they actually support.
- [Pack verification](verification.json): checks performed on this package. Document checks are not application acceptance.

## The first demonstrable vertical slice

Open one reviewed database or economics lesson in the lecture theatre. Rain explains a sentence and points at its anchored figure. The learner taps that figure or presses **I'm stuck**. Speech, mouth and unfinished board actions stop together; Rain looks towards the learner and gives a source-backed hint. The learner answers a small problem, sees why the answer was assessed that way, and resumes at the right place. A selected supported language can change without losing the source link. The same activity works with keyboard, captions and reading view.

This slice precedes an always-listening agent, autonomous code execution, six complete studios, arbitrary generated worlds or general SASL translation. Those remain in the staged design, with clear contracts and acceptance gates.

## Important corrected baseline

`CHARACTER-002` is **complete**, according to its owner and bus message 37. Read `coordination/handoffs/claude-character.md` and `docs/character/verification.md`; the earlier condition to wait for closure is satisfied. Rain is still isolated from the shared lecture and teacher routes. The delivered asset is 3,424,844 bytes with 77 joints, 31 facial shapes, five clips and no walking capability. Only three sample audio files have precomputed mouth timings; live speech currently uses energy fallback.

Owner evidence reports 22–26 fps on one Intel UHD laptop in a muted headless test, not a phone or real-audio user study. Current work must improve smoothness rather than rebrand those numbers as production performance. Attribution and provenance need independent C1 sign-off. Fresh implementation should recheck file hashes and bus state; this package does not overwrite active reservations.

The current app is a loopback local prototype, with JSON/SQLite/browser records, bounded cloud calls and no production multi-user authorization. The cloud target in these documents is **proposed**, not already deployed. Existing Google/Azure account observations must be dated; remaining credits and expiry are not assumed current.

## How to review this plan

Claude should challenge decisions with code evidence, cost calculations and primary sources, then produce a redlined refinement and one jointly accepted contract version. Changes to a future contract are proposals until acknowledged; no agent should implement against a silently edited interface. Independent clinical, legal, engineering or SASL expertise is required where domain correctness demands it.

No finite document can enumerate every future edge case. This pack defines the known inventory, boundary tests, adversarial tests, pilot feedback and incident loop that must keep expanding it.
