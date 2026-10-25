# Opportunity freshness inspector

**Date:** 25 October 2026
**Status:** isolated pure utility and deterministic local tests; not mounted in the app.

## Need, judging criteria and acceptance

Learners should not waste time on stale or incomplete funding/work records. This package supports **Product** (expired/stale metadata is distinguished), **Impact** (no invented vacancy or eligibility claim), **Sustainability** (pure offline inspection with no polling/service), and **Intelligence** (explicit date/provenance rules). The observable check is that only well-formed, source-attributed records within the age window, with a future closing instant and requirements, return `current`; every invalid, stale, expired or incomplete case is classified deterministically.

## API and policy

`studio/server/opportunity-freshness/index.mjs` exports:

```js
inspectOpportunity(record, { now, maxAgeDays })
// { status: 'current' | 'expired' | 'needs-check' | 'invalid', reasons: string[], originalUrl: string | null }
```

- `record` is a plain data object with `id`, `title`, `url`, `sourceName`, `checkedAt`, `closesAt` (nullable), and `requirements` (string array). IDs/titles/source names and strings are bounded and non-empty where required.
- Date inputs (`now`, `checkedAt`, non-null `closesAt`) must be canonical `YYYY-MM-DDTHH:mm:ss.sssZ` UTC timestamps that round-trip to the same instant. This rejects date-only values, numeric timezone offsets, impossible dates and timestamps checked in the future.
- `maxAgeDays` defaults to 7 and must be a positive integer through 365. A record exactly at the age boundary is fresh; it becomes stale after that instant. A closing time equal to `now` is expired.
- Missing close time, source name or requirements is `needs-check`. Other malformed fields are `invalid`. `current` requires valid metadata, source attribution, at least one nonempty requirement, a known future closing time and a check no older than the requested maximum.
- `originalUrl` preserves the input string only when it parses as HTTPS without credentials, whitespace/control characters or more than 2,048 characters. Invalid URLs return `null` so a caller cannot accidentally create a link from this result.
- Reason values are stable codes suitable for caller-specific wording. No network request, fetch, scrape, storage, matching, eligibility evaluation or mutation occurs.

**Important semantic boundary:** `current` means “complete, syntactically valid metadata checked recently relative to this supplied clock.” It does **not** prove the provider still offers the opportunity, that any listed requirement is accurate, or that a learner qualifies. The caller must keep original-provider verification, eligibility and programme matching as separate evidence. No role matching or score is implemented here.

## Evidence

Tests use only explicitly synthetic records (`example.org`, synthetic titles). They exercise actual exported utility behavior: successful current classification and exact URL, immutable inputs, inclusive age boundary, closing boundary, future checks, strict UTC dates, missing details, malformed fields, HTTPS/credential rejection, option bounds and age bounds. **12/12 focused tests pass.** No vacancy facts are embedded.

Run from `studio/`:

```powershell
node --test tests/opportunity-freshness-wave.test.mjs
```

## Consumption proposal for the opportunity owner

Existing `studio/server/opportunities/index.mjs` remains the owner of curated records, status normalization, deduplication and programme text discovery. It currently has its own seven-day freshness logic and permits date-only inputs; Package C does not modify or replace that code. The existing owner can call this inspector at its boundary using the already curated record and a deterministic `now`, then map `expired`/`needs-check` to its own public status representation. Before integration, reconcile schema names (`provider` vs `sourceName`, `officialUrl` vs `url`), status semantics and whether no-deadline records are intentionally unknown. Do not call `current` “officially verified”; preserve discovery-only status and limitations. Route/auth/storage integration needs a separate owner claim.

## Limitations

The utility does not contact or validate source websites and cannot detect a provider page changed after `checkedAt`. It does not attest evidence quality or prove eligibility. Synthetic tests establish code behavior only. No browser/device, human clarity, vacancy, accessibility or user acceptance test was performed.
