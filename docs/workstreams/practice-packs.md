# KAIRO authored practice packs: business analysis and digital support

**Scope:** deterministic content and assessment state foundation only. There is no UI integration in this increment.

## Source context versus invented practice

The packs use two employer pages only as a reference for relevant task capabilities:

- [Discovery Business Analyst advert](https://careers.discovery.co.za/job/Sandton-1-Discovery-Place-Business-Analyst-GP-2196/1447995633/) lists requirements elicitation, business process modelling, solution design, testing/UAT, stakeholder engagement and incident analysis.
- [Discovery Service Consultant: Digital Support advert](https://careers.discovery.co.za/job/Sandton-1-Discovery-Place-Service-Consultant-Digital-Support-GP-2196/1448356033/) describes digital-platform troubleshooting, account-security guidance, and logging/tracking/resolving technology incidents.

The employer sources do not describe, assess, endorse or provide the authored scenarios. Both exercises take place inside the invented **Northstar Study Circle**. Characters, requests, app behavior and data are scripted fiction; they do not represent Discovery, FNB, real customers or actual employer assessments. The source links appear in the export as role context only.

## Scenario 1: conflicting requirements and UAT

The fictional sponsor requests progress reporting before purpose, audience, fields, privacy handling or retention have been agreed. The learner may ask stakeholders for clarification or propose a bounded, non-identifying option while leaving approval with the stakeholders. A row-level export is rejected with rationale.

After a valid first decision, the reducer records a scripted revision: the learner representative asks for accessible own-progress access while the sponsor still needs group trends. The small-group rule and retention remain unknown. Learners can choose separate views with policy questions assigned to an owner, or pause the specification for owner decisions. In UAT, they can design synthetic role/accessibility tests while gating release on the missing rule, or withhold sign-off until the rule is testable. The pack accepts reasoned alternatives and has no numeric score.

## Scenario 2: safe digital support

A fictional learner cannot sign in and offers a one-time code. The choices that request a code or bypass verification are recorded as rejected attempts and cannot advance. Safe recovery and escalation when verification is unclear are both accepted.

The reducer then records a case update: a screen reader does not announce the upload control, and the cause is unknown. Learners can reproduce with a synthetic test account and empty file, or offer an accessible route and escalate. They can close only after the learner confirms the route works; otherwise they can keep the case open, state the uncertainty, name an owner and communicate a next update. The scenario never asks for a real password, one-time code, document or personal account detail.

## Assessment and record rules

- Every choice is a structured authored option. Multiple defensible choices can advance; each records only the scenario checks demonstrated by that selected option. All other checks remain unresolved.
- The check labels say **demonstrated-in-selected-choice** or **unresolved**. They describe a replayable practice choice, not an independently verified skill, grade, credential, job-readiness judgment or employer result.
- Hints are tied to the current step and attempt. Rejected attempts and hint use remain in the event history after a retry. There is no action that clears help history.
- The reducer returns concise feedback for the latest hint, choice, or reflection. Feedback is replay-checked with the event history; a later action cannot rewrite earlier support or attempts.
- Reflection is optional, bounded to 1,000 characters and unassessed. There is no keyword matching or automated open-text evaluation.
- Run IDs, event count, reflection length and timestamps are bounded. Timestamps must be real UTC calendar times in order. The reducer blocks skipped steps and unsafe choices.
- Packs and their answer keys are deeply frozen. Export replays the complete event sequence from the pack version's initial state and rejects inconsistent histories; it does not trust stored completion or criterion claims.
- The JSON-ready export includes the scenario version, selected choices, rejected attempts, hints, scripted revision, reflection, criterion checks, official role-context links and explicit `fictional`, `unverified`, `no independent assessment`, `no employer endorsement` and `reflection not assessed` provenance.

## Validation

The scoped suite is `studio/tests/practice-packs.test.mjs`. It covers two accepted BA paths; safety rejection and displayed rationale; revision records; safe support alternatives; help/attempt preservation; export replay; no skipped steps; ambiguous/escalation paths; timestamp, identifier, action and reflection bounds; and immutable content.

## Not included

No page, route, API, employer application action, live vacancy information, assessment of free text, real user data, or promise of work placement is included. A later UI should preserve the same fictional, unverified and privacy boundaries.
