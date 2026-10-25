# Evidence profile and opportunities patterns handoff

**Task:** `PROFILE-PATTERNS-20261024-001`  
**Owner:** `codex-luna-edited-lesson-review-20261023-a` (Codex; `gpt-6-luna`, `light`)  
**Scope:** `docs/profile-patterns-20261024/`; this handoff file  
**State:** bounded research delivered; parent review pending.

**Privacy-copy amendment (2026-10-24):** Root review identified that current browser-local preview data is in a shared app-host/browser workspace, not proven to be isolated to an authenticated learner. The proposal now explicitly says it may be visible to others using that device/app workspace and that an unshared audience is not encryption or confidentiality. “Only you can see this” is reserved for a future authenticated state after owner isolation is verified. The synthetic example remains nonbinding and grants no consent. Follow-up task: `PROFILE-PRIVACY-COPY-20261024-001`.

Follow-up check: a Python validation using the platform default `cp1252` first failed to decode the UTF-8 proposal. Re-running with `encoding='utf-8'` passed: both JSON files parse, the example remains synthetic/nonbinding, shared-host exposure text is present, and the “only you” wording occurs only in the future verified-isolation statement. No runtime files changed.

## Changed files

- `docs/profile-patterns-20261024/README.md` — package status and current-code context.
- `docs/profile-patterns-20261024/comparison.md` — comparison of LinkedIn, GitHub, Behance, Credly/Open Badges and Handshake patterns, trade-offs and proposed small acceptance checks.
- `docs/profile-patterns-20261024/proposal.md` — private learner → selected evidence → explicit consent → limited recipient view; claim vocabulary, module/role distinction, freshness, revocation limits and observable future acceptance checks.
- `docs/profile-patterns-20261024/share-example.json` — explicitly synthetic, nonbinding example with no selected shared item, consent or real learner data.
- `docs/profile-patterns-20261024/sources.md` — 16 official product/help or standards pages with direct URLs and caveats, plus local code references.
- `docs/profile-patterns-20261024/research-evidence.json` — scope, source count, local files, validation and limits.

No runtime, shared schema, router, account/provider, profile or employer-sharing implementation was changed.

## Findings and decisions

- Existing KAIRO progress and portfolio material is browser-local/self-reported; replay checks only support scenario consistency. Role Pathways has local preparation notes and historical/availability-unverified examples, not a live feed, application flow or employer publication.
- Recommend private-by-default preparation and explicit item-level selection with a recipient preview and separate consent. A share view must disclose claim level and limits. Unselected items and personal/course source content stay out.
- Distinguish learner description, practice record, review reported by learner, and issuer credential verified. Do not let course/module identity imply role criteria, enrolment, credit or institutional verification.
- Keep opportunity title/source/checked date/closing date/availability distinct from curriculum identity. A stale advert remains historical and must not appear open by inference.
- Public/link-only work-sample platforms illustrate curation, but their visibility controls and link lifetime are not KAIRO security guarantees. Handshake's employer visibility depends on institutional participation and learner choice. LinkedIn Featured availability pages conflict; do not promise universal access.
- This is a design inference from official documentation, not measured learner preference, a security audit, credential verification, partnership or hiring outcome.

## Evidence and checks

- Read-only KAIRO references: `studio/src/profile/model.ts`, `studio/src/profile/ProgressPage.tsx`, `studio/src/evidence/model.ts`, `studio/src/portfolio-export/model.ts`, `studio/src/pathways/model.ts`, `studio/src/pathways/RolePathways.tsx`, and root package/backlog handoff files listed in `sources.md`.
- Official source pages reviewed: 16, listed with direct links and caveats in `sources.md`.
- JSON validation: `python -c "import json,pathlib; d=json.loads(pathlib.Path('docs/profile-patterns-20261024/share-example.json').read_text()); assert d['syntheticExample'] is True and d['bindingContract'] is False; print('share example JSON valid and explicitly synthetic/nonbinding')"` — passed.
- Manual scope/source review — completed; changes stay within the claim.
- No automated product tests were applicable to this research-only package.

## Remaining limits / parent review

This package does not implement an employer view, consent flow, audience restriction, expiry/revocation service, credential verifier or live opportunity feed. No browser observation, screen-reader/device acceptance, learner/employer validation, legal review or security testing was performed. A future implementation needs owner-scoped data, an approved sharing/retention model, tested revocation at retrieval, and human validation. Root owns any runtime/interface decision and review before integration.
