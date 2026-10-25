# Opportunities wave handoff — 25 October 2026

## Ownership

- Agent: `codex-luna-opportunities-20261025-b`
- Client/model/effort: Codex / `gpt-6-luna` / low
- Scope: `studio/server/opportunities/`, `studio/src/opportunities/`, `studio/tests/opportunities.test.mjs`, `data/opportunities-20261025/`, `docs/opportunities-wave-20261025/`, this handoff.
- Interface: conforms to `coordination/briefs/ai-integration-20261025/INTERFACES.md`; no route, shared server, provider, or root configuration edits.

## Delivery

- Added `listOpportunities({now, programme, records} = {})` with input bounds, ISO date normalization, ID/canonical-source deduplication, deadline state, fail-closed public HTTPS URL checks, explicit discovery-only state and plain text discipline/requirement filtering.
- Added stateless `Opportunities({records, limitations})` React UI and scoped CSS. Dates, source check freshness, uncertainty, requirements, and primary/discovery links are visible.
- Added public-source evidence and research limits at `data/opportunities-20261025/source-evidence.json` and `docs/opportunities-wave-20261025/README.md`.

## Evidence reviewed

- Official Northern Cape Premier bursary page: `https://www.northerncape.gov.za/bursary/`. It showed the 2027 programme and 31 October 2026 close, along with Northern Cape residency and age 18–30 requirements. StudentRoom's repost showed a conflicting 30 September date, so the record points to the official provider page and the discovery URL is only StudentRoom's general bursary category.
- Official Funza Lushaka page: `https://www.funzalushaka.doe.gov.za/`. The official search-index text showed 2027 open date 1 October 2026, new applicant close 31 January 2027, returning bursar close 30 November 2026, and first-time applicant age cap 30. Direct retrieval timed out; recheck the live provider page before a learner acts.
- StudentRoom listing: `https://www.studentroom.co.za/funza-lushaka-bursaries-2027-applications-now-open/`.
- Graduates24 directory: `https://www.graduates24.com/bursaries`; its package record is explicitly `discovery-only` and `unknown`, without a vacancy claim.

## Checks

- `node --test --test-reporter=spec tests/opportunities.test.mjs` from `studio/`: 9/9 pass after review hardening. Tests cover deadline transitions, closed/discovery-only status preservation, stale/future checks, invalid record arrays, query-aware deduplication, unsafe URLs in server and UI validators, text relevance and rendering.
- `npx tsc -b` from `studio/`: previously passed before root integration work. Latest check fails at `studio/src/workspace/SourceWorkspace.tsx:146` with `TS2657: JSX expressions must have one parent element`. This file is outside this package's claim and was not edited.

## Remaining work

- Root reviews and mounts the component on `/opportunities` and connects the route to the approved metadata API contract.
- Fix or review the current unrelated `SourceWorkspace.tsx:146` TypeScript error before relying on a whole-project build result.
- Recheck all source dates at integration time; there is no live refresh or scheduler.
- Human keyboard, screen-reader, phone, and learner task acceptance remain open. No eligibility, award, hiring, traction, or learning outcome is claimed.
