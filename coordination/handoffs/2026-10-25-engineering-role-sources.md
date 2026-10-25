# Engineering role sources handoff — 25 October 2026

## Ownership and scope

- Agent: `codex-luna-engineering-role-sources-20261025-b`
- Client/model/effort: Codex / `unknown` / `unknown` (the client did not expose settings)
- Task: `ENGINEERING-ROLE-SOURCES-20261025-B`
- Isolated branch: `codex/engineering-role-sources-20261025`, based on `1997ba9f046f6d4122169cb26a72e89cc60befd1`.
- Owned paths: `studio/data/role-opportunities/engineering.json`, `docs/engineering-role-sources-20261025/README.md`, `studio/tests/engineering-role-sources.test.mjs`, this handoff.
- No opportunity engine, application route, provider, router, or company contact was changed.

## Delivery and acceptance

The package records two primary-source pathways. BMW Group South Africa lists its graduate development programme for engineering graduates and its graduate vacancy filter reported no vacancies on the dated check. Siemens' global graduate programme lists a master's-level engineering pathway and experiential requirements; the page says local position availability varies, so the South African opening remains unknown. Eskom was reviewed and excluded: its current graduate-in-training listing was business enablement, not an engineering graduate role.

**Judging/learner need:** Impact, help engineering learners discover verifiable pathways; Usability, show requirements, status and KAIRO-authored practice distinctly. **Acceptance evidence:** dated official URLs and locators; compact source excerpts (no more than 25 words); requirement IDs referenced by suggested projects; explicit status and uncertainty. The project suggestions are authored learning prompts, not employer requirements or endorsements. They cannot prove degrees, marks, work experience or eligibility.

## Checks

From `studio/`: `node --test --test-reporter=spec tests/engineering-role-sources.test.mjs` — 2/2 passed. Checks validate schema shape, safe official HTTPS host, date, availability enum, unique IDs, excerpt word limit and suggestion-to-requirement mappings; a synthetic negative fixture checks broken mapping and duplicate detection. They do not establish content accuracy or future availability.

## Remaining gaps

This is a two-record research fixture, not a vacancy feed or an exhaustive pathway catalogue. Pages can change; recheck them before learner action. No eligibility determination, learner usability study, company confirmation, application, hiring, partnership, or competence assessment occurred. Before runtime integration, root should map actual evidence conservatively to `missing`, `needs-review`, or `explicitly linked`; no inference about ability should be made from absent records. Independent review and mounting are outside this task.

Evidence retrieval note: Siemens' official English-language page content was surfaced in search/indexed text; a direct open timed out on recheck. Revalidate its requirement details from the live page before integration or learner action.
