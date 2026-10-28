# Issue #49 — independent pump challenge acceptance handoff

Session: `gpt6-kairo-pump-qa-20261025-1810-q`; ChatGPT GPT-6; effort unknown. Remote GitHub cooperative claim on issue #49; no access to canonical owner's local SQLite bus, so no atomic local registration or claim. Base main `1997ba9f046f6d4122169cb26a72e89cc60befd1`.

## Judging and learner need
Product correctness, Creativity through prediction and observable consequence, Usability through fail-closed resume, Intelligence through honest prepared-model provenance. Learners need a deterministic, reviewable, non-misleading engineering scenario; maintainers need independently repeatable acceptance against the exact existing candidate, not more standalone studios.

## Owned scope
New `tools/studio-pump-independent-qa/**`, new `.github/workflows/studio-pump-independent-qa.yml`, this unique handoff. No edits to PR #55's actual files, #72's composition, #78 staging, #50 Kaggle, shared app routes/styles/config or active character assets.

## Implementation
A Node 24 black-box acceptance suite and an ephemeral GitHub Actions gate that pins PR #55 head and verifies its seven changed paths before composing the candidate in a temporary CI checkout. Original tests, independent tests and production build are executed there. No authenticated learner account or source revision is inferred from prepared scenarios.

## Evidence boundary
At authoring time: tests **NOT YET EXECUTED**; exact-head CI **PENDING**. Update this section only after inspecting actual workflow runs. Source concept supports valve resistance and curve intersection, not calibrated KAIRO coefficients. Human subject expert, accessibility device tests, learner study and local-bus reconciliation remain open.

## Next dependency-ready tasks
1. Independent engineering/learning-science review of #55's source claim, simulation assumptions, and grading semantics; fix any confirmed discrepancy on the candidate owner's branch.
2. Coordinator-mediated owner-scoped route integration only after #55, #64, #68, #70, #78 and lifecycle contracts pass independent security review and canonical-bus conflict checks. No merge or deployment in this wave.
