# W5 integration review findings

Reviewer codex-orchestrator-20261022-a, 22 October 2026. Worker gpt-6-luna low.

Initial source review found decisionOptions filtered each source row by the actual fixture and hard-coded duplicate row IDs. That effectively revealed correct cleaning decisions rather than requiring the learner to choose them. Blocked acceptance and returned to owner: every row must show the full revision-appropriate choice set, unless an explicitly labelled and recorded guided mode is later designed (out of scope here).

Also requested: fresh cleaning/report drafts when the rule changes; clear new-run form state; preserve service work while changing tabs; remove a nonexistent Save-this-run instruction; include event-level assistance and unknown/reported-help summary in export; use a real completed shop fixture rather than an ignore decision that cannot finish.

Root did not implement these changes. Browser acceptance remains pending because the prior URL-policy rejection must not be bypassed. Passing model tests cannot establish UI interaction acceptance. Final code/build decision to follow after owner repairs and handoff.
