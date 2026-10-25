# Evidence profile and opportunities patterns

**Status:** source-based product proposal, not a feature implementation. Researched 2026-10-24. No learner, employer, school or partner data was accessed.

## Deliverables

- `comparison.md` compares official documentation for LinkedIn, GitHub, Behance, Credly/Open Badges, and Handshake.
- `proposal.md` proposes a private learner → explicitly selected evidence → consented employer view, keeping preparation notes, course/module context, role criteria, and job opportunities distinct.
- `share-example.json` is a synthetic, nonbinding shape example. It is not a runtime contract, a credential, or an Open Badges object.
- `sources.md` records direct official URLs, checked date, claims used, and known caveats.

## Read against current KAIRO

The current progress page reads browser-local study and practice records, offers a portfolio export, and labels it self-reported and unverified. The evidence exporter replay-checks authored scenario rules but explicitly does not prove identity, real-world work or competence. Role Pathways offers self-reported preparation notes, links replayable local practice without upgrading the evidence level, exports a plan and says no application, CV upload or profile publication runs from that page. Its current examples include historical/closed or availability-unverified adverts; the page says live opportunity feeds are planned.

Relevant read-only code: `studio/src/profile/model.ts`, `studio/src/profile/ProgressPage.tsx`, `studio/src/evidence/model.ts`, `studio/src/portfolio-export/model.ts`, `studio/src/pathways/model.ts`, `studio/src/pathways/RolePathways.tsx`. Root's `docs/account-wave-20261024/NEXT-PACKAGES.md` identifies opportunity freshness and data lifecycle as follow-up work. Nothing in this proposal changes those files or claims that employer sharing exists.

## Research limits

Comparisons describe documented product patterns, not usability tests, independent security audits, endorsements, or evidence of better hiring outcomes. Platform terms and UI details can change. The Handshake model depends on an institution's participation and approval; it is not transferable as a claim that KAIRO has university or employer relationships. Open Badges is a formal issuer/verifier standard, not a label KAIRO can apply to ordinary practice.

The acceptance checks in `proposal.md` are future review criteria. No learner/employer validation, legal review, credential issuance/verification, employer view, live opportunity source, browser observation, or runtime implementation occurred in this research package.
