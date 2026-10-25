# Opportunities package B

**Status:** isolated metadata and presentation package; root route/API mounting and human acceptance are still pending.

## Need and judging evidence

- **Product / Impact:** a learner needs a concise way to discover study funding and entry opportunities without mistaking an aggregator post for the provider's current rules. Acceptance evidence is a visible provider link, source-check date, deadline or explicit unknown, and readable requirements.
- **Intelligence:** programme text may narrow discovery results by exact word overlap with listed disciplines or requirements. This is a transparent text match, not a hiring score, eligibility decision, or prediction.
- **Usability / Presentation:** cards use plain labels, visible deadlines, checked dates, and secure external links. Screen-reader and device acceptance remain open.

## Included

- `studio/server/opportunities/index.mjs` exports `listOpportunities({now, programme, records} = {})` and `isPublicHttpsUrl`.
- `studio/src/opportunities/Opportunities.tsx` exports the default stateless React view.
- `data/opportunities-20261025/source-evidence.json` records the bounded public source review.
- `studio/tests/opportunities.test.mjs` exercises date transitions, no-deadline behavior, deduplication, unsafe URLs, text relevance and rendered source labels.

The seed contains two official-source programmes with different 2027 deadline cohorts, plus a Graduates24 directory entry that remains `unknown` and `discovery-only`. StudentRoom is linked as a discovery page on a source-verified Funza Lushaka entry. The Northern Cape entry links to StudentRoom's general bursary category because its 2027 repost showed a conflicting earlier deadline; the official provider page is used for the displayed facts.

## Data and safety boundaries

- No arbitrary URL crawling or fetching. Records are curated metadata and each entry displays the checked date.
- A missing closing date forces `status: unknown`; closing dates are evaluated against the caller's injected `now`.
- Official records explicitly marked closed stay closed. Discovery-only records stay unknown. Records checked more than seven days before the supplied `now` are marked stale and unknown; future check timestamps are discarded.
- Duplicate matching removes only known tracking parameters (`utm_*`, common click IDs); meaningful listing query parameters are retained.
- Only public HTTPS links without credentials or unusual ports are accepted by the package. This checks link shape, not destination trustworthiness.
- Unknown, secondary-source and requirement-matching labels remain visible. The matching is not eligibility, award, or hiring evidence.
- No personal data, full copied articles, automation, application workflow, or employer endorsement is included.

## Evidence and gaps

The official Northern Cape page was opened and checked for date and eligibility text. Funza Lushaka's official site search result provided the 2027 dates and age cap; direct retrieval timed out in this research pass, so rechecking the live page remains necessary. Secondary listings were inspected only to establish discovery links. See `data/opportunities-20261025/source-evidence.json`.

The component is not mounted in a route and the package is not connected to the authenticated/public-metadata API. Root owns those integration surfaces. No browser, learner, accessibility-device, or application acceptance was performed.
