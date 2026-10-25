# Luna handoff: employer closing-date note clarification

- **Task:** `LUNA-FNB-DEADLINE-NOTE-001`
- **Owner/session:** `codex-luna-fnb-deadline-note-20261022-a`
- **Model/effort:** `gpt-6-luna` / `low`
- **Scope:** `data/public/opportunities/fnb-current-review.json`, `docs/workstreams/current-fnb-roles.md`, this handoff.

For the IT Business Analyst R54418 and Trade Support Specialist R54282 entries, added the employer's Important Closing Date Note in meaning: applications will not be accepted on the indicated date and onwards, and should be submitted ahead of the closing date. The research snapshot now explicitly warns not to treat 23 October 2026 as an accepted application date. The employer did not state the timezone or cutoff hour. Live availability remains unknown because direct Workday pages were unreadable.

Validation: Python parsed the JSON and confirmed both records carry the no-applications-on-or-after interpretation and the unspecified timezone/hour caveat. No runtime or application actions.
