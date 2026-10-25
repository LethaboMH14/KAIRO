# LUNA-EVIDENCE-001 and repair handoff

Agent `codex-luna-evidence-20261022-a`, Codex, `gpt-6-luna` / low. Scope: `studio/src/evidence/`, `studio/tests/evidence.test.mjs`, `docs/workstreams/evidence.md`, and this handoff.

## Delivered

- Added the deterministic adapter API in `studio/src/evidence/model.ts`: `summarizeCase(record: unknown): PracticeArtifact | null`, `collectArtifacts(profile: unknown): PracticeArtifact[]`, and `artifactMarkdown(artifact): string`.
- The adapter replays supported `corner-shop-v1` events through the existing transition function, accepts valid inspection-before-calculation ordering, derives correctness, checks full completion and matching reflection/timestamp, and retains wrong attempts and retries.
- `PracticeArtifact` includes artifact/source/scenario versions, run and lesson IDs, title, completion time, replay-derived rubric checks, attempts, contributor reflection, and limitations. It clearly labels the source as browser-local and status as `local self-directed practice, unverified`.
- Help exposure is described as unknown because the current model does not record it. Mutable local event history and timestamps are explicitly documented as unverified; the adapter makes no employer score, independent-review, competence, or accreditation claim.
- Added four focused tests for successful replay and retries, valid event ordering, forged completion/correctness, malformed and oversized input, timestamp boundaries, unknown versions, and stable Markdown output.
- Added the API and limits note at `docs/workstreams/evidence.md`.

## Checks

- `node --test tests/evidence.test.mjs` from `studio/`: passed, 4 tests.
- `npm run build` was started, but the command wrapper returned after 30 seconds without a final status. It printed the Vite transform start on its first invocation and no TypeScript diagnostics. Per root's request, no further full build was launched; root will run the final build after all workers finish.

## LUNA-EVIDENCE-002 repair

Root review found that replaying a reflection from its 500-character event payload rejected valid records whose saved reflection was 501–1,000 characters. The replay now uses the full saved reflection and verifies that the transition's truncated event exactly matches the stored event. Regression cases cover 500, 501 and 1,000 characters plus a changed event prefix.

Timestamp checks now require an explicit ISO instant with timezone, validate the calendar date and clock/offset fields, require nondecreasing event times, and require `completedAt` to equal the terminal reflection event time. These checks validate consistency and format only; editable local timestamps are still not proof of when actions occurred.

- `node --test tests/evidence.test.mjs` from `studio/`: passed, 6 tests after the repair.
- No full app build was run for the repair, per root's request.

## Remaining work

Consumer integration is intentionally not included. Root should review the exported contract before connecting the adapter to any profile or pathways surface. Browser storage remains editable; replay checks internal consistency only and cannot establish identity or independently verify actions.
