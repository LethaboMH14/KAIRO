# Luna handoff: current FNB / FirstRand employer role review

- **Task:** `LUNA-FNB-ROLES-20261022`
- **Owner/session:** `codex-luna-fnb-roles-20261022-a`
- **Model/effort:** `gpt-6-luna` / `low`
- **Scope:** `docs/workstreams/current-fnb-roles.md`, `data/public/opportunities/fnb-current-review.json`, this handoff.
- **Status:** read-only, dated official-source research; no runtime changes.

## Findings

The official FNB careers page links to FirstRand Workday. Direct opens of the official Workday portal and advert URLs returned zero readable text lines. The three role details are taken from search-indexed text on the official Workday host; JSON and docs preserve that access boundary.

The indexed records are: IT Business Analyst R54418 (RMB, Johannesburg; listed close 23 October; eight years’ BA/Systems Analysis and Market Risk domain requirements); Trade Support Specialist R54282 (RMB, Johannesburg; listed close 23 October; degree and 3–5 years’ technology/production support; ideal trading exposure); Banking Advisor Private Client R50409 (FNB, Umhlanga/Durban; explicitly not an active vacancy, talent pool; listed end 31 October). The first two live statuses remain unknown because the pages could not be read and their index countdowns conflict with the check date. The third was indexed two months earlier; current pool status is unknown.

Compared these with existing role cards: the FNB Engineering & Technology Graduate Programme R46838 remains expired as of its 31 August close. The new requisitions are separate roles and do not imply a candidate qualifies.

## Evidence and checks

- `data/public/opportunities/fnb-current-review.json` contains source IDs, original URLs, retrieval limitations, short source excerpts, exact status signals, mandatory/preferred criteria, conflict notes and source-to-claim mappings.
- `docs/workstreams/current-fnb-roles.md` provides the human-readable summary and historical-card comparison.
- Parsed `data/public/opportunities/fnb-current-review.json` with Python; checked snapshot/retrieval/deadline ISO dates, quote counts, all source IDs and claim references. All checks passed (3 adverts, 10 claims).

## Limits / next step

No vacancy is called confirmed open. Revisit original Workday pages directly when readable; resolve dates/status before presenting current openings. No aggregator facts, eligibility score, employer contact or application action were used.
