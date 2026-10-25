# Luna handoff: strict profile consumer audit

- Session: `codex-luna-profile-integrity-20261022-a` (Codex, `gpt-6-luna`, low effort).
- Task: `LUNA-PROFILE-CONSUMER-AUDIT-001`.
- Scope: `docs/workstreams/profile-consumer-audit.md` and this handoff only. Runtime source was read-only.

The consumer trace found no catch-to-empty write after a strict `readProfile()` failure and no uncaught strict profile read in the runtime search. Progress, practice export, and evidence portfolio export handle unreadable profiles explicitly. Role-pathway Markdown can still be exported while its linked practice records are unavailable, but the unavailable status is included. Lesson session notes are a separate local record. The profile's 50-lesson / 20-case retention caps remain the documented persistence boundary; current practice export no longer applies the 20-case cap to its in-memory projection.

One concrete P2 issue: EvidenceWorkspace initializes saved artifacts as an empty list; if strict profile read fails it sets an alert but keeps the list empty, and the practice panel still shows “No saved practice yet.” This combines read failure with a false absence state. The bounded fix is a distinct unreadable/ready state for that panel, while leaving the fictional service exercise available and portfolio export blocked.

Audit source and exact references: `docs/workstreams/profile-consumer-audit.md`. No runtime edits, tests, build, or browser observation were performed.
