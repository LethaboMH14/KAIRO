# BLUEPRINT-LEARNING-001 handoff

**Owner:** codex-luna-learn-20261022-a  
**Client/model/effort:** Codex / gpt-6-luna / low  
**Status:** Complete; blueprint and handoff delivered.  
**Claimed scope:** docs/blueprint/learning-product and this handoff only.

## Deliverables

- docs/blueprint/learning-product/LEARNING-PRODUCT-BLUEPRINT.md — industry Lean Canvas with all nine hypothesis blocks; adult university/TVET onboarding; 27 teaching/product use cases with actor, preconditions, happy path, alternatives/recovery, privacy/accessibility and acceptance; pedagogy and mastery evaluation; synthetic workplace tests; interaction concepts; staged effort assumptions; source list.
- This handoff.

## Decisions captured

- The pilot audience is adult learners aged 18+ at university and TVET. KAIRO's six-studio wider vision remains intact.
- Product distinction is an anchored teaching conversation connecting source span, teacher interaction, scene target, question/hint, changed-context practice and learner-owned evidence.
- Setswana and isiZulu require separately evaluated language paths and community/educator review. SASL is distinct from spoken ASR/TTS and requires a Deaf-led reviewed content pathway.
- Incorporated the six clarified interactions: spoken word and gaze/point/board; tap-number explanation; atomic “I'm stuck” stop and hint; authored listening nods with no emotion inference; phone low-data mode; SASL authored and Deaf-reviewed scope. Word/phrase alignment and phoneme lip sync are separate tests.
- FNB/employer incentives and all market/buyer/revenue claims remain hypotheses. No employer commitment, outcome claim, production readiness or model selection is implied.

## Evidence and checks

- Read AGENTS.md, coordination/README.md, README.md, docs/KAIRO-PRODUCT-BRIEF.md, the user attachment, and existing learning/workplace/teacher/source product notes before authoring.
- Registered the unique session and actual exposed model/effort; read inbox at start and before handoff.
- Researched primary/credible sources: IES What Works Clearinghouse study guide (2007); EEF feedback guidance (11 June 2021); CAST UDL 3.0 (30 July 2024); Constitution Eighteenth Amendment Act (assented 19 July 2023, gazetted 27 July 2023); Parliament SASL release (3 May 2023); Wits SASL syntax dissertation record (2017); National Language Policy Framework (2003); DBE archived language-in-education policy FAQ. Direct links and limits are in the blueprint.
- Reviewed two model/data discovery leads only: Hugging Face community dataset sa-languages and March 2026 MzansiText/MzansiLM preprint. No model was selected, downloaded, called or fine-tuned.
- Checked the document's opening section and line count (118 lines). This is a planning artifact, so no software tests or runtime checks apply.
- No runtime, cloud, private upload, browser/localhost, installation, package, or application files were edited.

## Remaining work and review

- Have an educator/learning-science reviewer validate objectives, changed-context rubrics and evaluation design for university/TVET adults.
- Have fluent Setswana and isiZulu reviewers validate terminology and both input/output directions.
- Have Deaf SASL reviewers define/approve signing content, dialect considerations, camera framing and acceptance before representing SASL capability.
- Product/accessibility/privacy reviewers should narrow this proposal into a bounded pilot spec and interfaces. Estimates are person-week assumptions, not delivery commitments.
- Separately audit the dataset/model cards and licensing before any use. The linked preprint/community dataset are leads only.
- Rain integration and production account/security work remain outside this task.

## Repair handoff: BLUEPRINT-LEARNING-REPAIR-001

**Owner/model/effort:** codex-luna-learn-repair-20261022-a / gpt-6-luna / low.

- Revised LP-16 and the bounded “I'm stuck” interaction: audio stops immediately, including mid-sentence; capture the heard prefix and checkpoint; cancel stale gestures/board actions; offer a hint; resume only after the learner selects a semantic boundary.
- Revised Stage H: production readiness is covered by the user's broader authorization but is not implemented or accepted. Execute the reviewed deployment plan in a fresh chat within verified credit/budget; security, privacy, compliance, content-rights and acceptance gates remain separate.
- Read docs/blueprint/core/ARCHITECTURE.md and docs/blueprint/core/TEACHING-CONTRACT.md. They define shared audio-clock timing, atomic interruption, preservation of heardUntil/committed board context, and the distinction between word timing and phoneme/viseme timing.
- No code/tests/runtime/cloud changes; proposal wording only. Scope remains the learning-product blueprint subtree and this handoff.

## Root-design review handoff: BLUEPRINT-LEARNING-REVIEW-001

Read-only comparison against docs/blueprint/core/ARCHITECTURE.md, TEACHING-CONTRACT.md, DATA-AND-API.md, DELIVERY.md, ACCEPTANCE.md, CLOUD-RUNBOOK.md and fnb-app-of-year-hackathon-threat-model.md. Review note: docs/blueprint/learning-product/root-review.md.

Coverage is strong across the requested product, adult university/TVET flow, source-linked avatar interactions, two-way language, distinct SASL, video/visual lessons, adaptive evidence, synthetic work tasks and hypothetical employer/FNB incentives. The repaired interruption and production authorization/status wording align with root design.

The two findings from that review are resolved in the learning blueprint and marked resolved in root-review.md. LP-15/16 distinguish KAIRO's no-recording/no-persistence default from provider processing, require provider region/retention review and disclosure plus consent, and prohibit unsupported zero-retention claims. Offline-equivalent completion now applies only to tasks in an available licensed pack; live functions disclose pending/unavailable status, preserve drafts where appropriate, and resume safely. No root files, runtime, cloud, browser, or deployment changed. No tests apply to this documentation repair.

### Wording repair handoff: BLUEPRINT-LEARNING-FIX-001

**Owner/model/effort:** codex-luna-learn-fix-20261022-a / gpt-6-luna / low.

- Changed only docs/blueprint/learning-product/LEARNING-PRODUCT-BLUEPRINT.md and this handoff.
- Resolved accepted R1/R2 from docs/blueprint/learning-product/root-review.md; resolution text is recorded there.
- No root contract files were edited; the root owner will mirror the accepted language in its own core acceptance/data documents.
- Checked changed lines with PowerShell Select-String; no runtime tests apply.
