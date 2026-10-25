# LUNA-OPPORTUNITY-001 handoff

**Owner:** `codex-luna-opportunity-20261022-b`  
**Checked:** 2026-10-22  
**State:** ready for review

## Delivered

- `docs/workstreams/opportunity-evidence/README.md` — reviewer-facing summary of three role families, official role evidence, proposed portfolio tasks, free self-paced learning, two official experience providers, and open conflicts.
- `docs/workstreams/opportunity-evidence/evidence.json` — source registry, checked and posting/closing dates, status labels, requirements paraphrases, project proposals, resource records, claim-to-source map, and uncertainties.

## Decisions and boundaries

- Used FNB Engineering & Technology Graduate Programme requisition R46838 as the FirstRand employer source. Its official indexed text states a 2026-08-31 close date; it is labeled expired as of 2026-10-22. Direct opening returned no extractable text, which is disclosed.
- Used Discovery's Junior Data Scientist, Business Analyst, and Service Consultant: Digital Support role pages. Their status is unknown because the pages were accessible with Apply actions but no closing date or explicit open/closed state was displayed.
- Kept mLab's CodeTribe experience and WorldSkills South Africa's 2027 competition as separate providers. mLab intake dates and fees remain unknown. WorldSkills' 2027 window is supported by its government announcement; its application form's 2028 age note conflicts in cycle label, so no age-specific eligibility claim is made.
- Marked proposed portfolio projects and numeric targets as proposals. No candidate score, employer guarantee, application action, actual performance result, or completed portfolio project is claimed.
- Used public official pages only. No scraping automation, external communication, applications, paid account, downloads or private data were used.

## Validation evidence

- `python -m json.tool docs/workstreams/opportunity-evidence/evidence.json` passed.
- A follow-up Python validation parsed 15 ISO date fields, confirmed all 9 source records use the snapshot check date 2026-10-22, and found no unresolved source IDs across the claim map, role records and learning resources. Results are saved in `docs/workstreams/opportunity-evidence/validation.json`.
- All employer pages, provider pages and learning resources are directly linked in the pack. The source IDs and claim map identify which source supports each statement.

The coordination inbox was checked before handoff; no task-specific instruction changed the research scope.

## Remaining review points

- Confirm whether the parent wants the pack integrated into any app surface; this handoff only delivers the requested research documents.
- Recheck all posting statuses and deadlines before using this snapshot for an application decision.
