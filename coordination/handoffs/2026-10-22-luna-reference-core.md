# LUNA-REFERENCE-001 handoff

Date: 22 October 2026  
Owner: `codex-luna-reference-20261022-a` (Codex, gpt-6-luna, low)

Delivered the requested pure read-only reference contract:

- `studio/server/reference-core/references.mjs`: bounded outward HTTPS reference validator, allowlisted YouTube URL parser that constructs a fixed privacy-enhanced embed URL without autoplay, exact metadata source cards, and conservative freshness/openability helpers.
- `studio/tests/reference-core.test.mjs`: 6 targeted tests for accepted watch/short URLs, hostile URLs and parameters, arbitrary markup, private/local outward hosts, source metadata bounds, expiry and invalid/future dates.
- `docs/workstreams/reference-core.md`: interface, limits, source-content trust boundary, YouTube external request caveat, and official source links checked 22 October 2026.

Validation: `node --test tests/reference-core.test.mjs` from `studio/` — 6 passed, 0 failed. No fetch/SSR F proxy/downloader, app endpoint, router, package, or iframe HTML was added. No app build or browser test was run. Root review remains required.

Risks and limits: URL validation is for outward reference links only, not server-side network authorization; no DNS lookup means DNS rebinding cannot be evaluated. Privacy-enhanced YouTube embeds still make third-party requests when a user loads them. A current card only means its supplied timestamps are within bounds; it does not prove source availability, safety, or eligibility. Broad search/media execution remains out of scope.
