# LUNA-EVIDENCE-UI-001 integration handoff

**Worker:** `codex-luna-integration-20261022-a`  
**Client/model/effort:** Codex / gpt-6-luna / low  
**Task:** `LUNA-EVIDENCE-UI-001`  
**State:** implementation delivered for root review; browser acceptance pending.

## Scope and changed files

- `studio/src/evidence-workspace/EvidenceWorkspace.tsx` — learner page, profile evidence display, synthetic service simulation flow, and explicit Markdown downloads.
- `studio/src/evidence-workspace/evidence-workspace.css` — responsive KAIRO workspace presentation, focus-visible styling, mobile table scrolling, and form layout.
- `studio/src/evidence-workspace/worksim-presentation.ts` — shared row-choice vocabulary and truthful simulation Markdown rendering.
- `studio/src/StudioRouter.tsx` — lazy `/evidence` route.
- `studio/src/App.tsx` — home studio picker link.
- `studio/tests/evidence-workspace.test.mjs` — artifact projection, decision vocabulary, and replay-valid export formatting checks.
- `docs/workstreams/evidence-workspace.md` — consumer API, storage, status and limitations.
- This handoff.

No profile model/storage, work-simulation model, package manifest, server, external endpoint, or unrelated studio was edited.

## Delivered behavior and decisions

`My practice` reads the exported browser profile API once and passes the result to reviewed `collectArtifacts()`. It never writes the profile. It displays only replay-supported completed shop runs with attempts, first-try rubric results, reflection, and source/scenario details. Empty profile, no eligible artifacts, and profile read error have distinct states. Each artifact exports through `artifactMarkdown()`.

`Service case` consumes only the reviewed worksim `scenario`, `initialState`, `transition`, `assess`, and `exportRun` APIs. It presents all nine source rows and dictionary, requires inspection before cleaning, accepts explicit per-row dispositions and every report metric, and asks for fresh v2 cleaning/report submissions after the changed requirement. Every row gets the same complete revision-specific decision option set; no row fixture values filter choices or reveal an answer. Incorrect attempts remain in the model trail. `acceptedOutcomes()` is not used by the learner UI.

The run exists in page memory and is not automatically persisted to profile or local storage. The learner can export only after `exportRun()` replays a complete valid run. Tabs remain mounted while hidden so switching sections preserves an active run. V2 rework and a new run clear relevant form drafts. Assistance is chosen before the run, captured by model events, shown as learner-reported per-attempt exposure, and included in Markdown along with aggregate unknown count and support values. Scripted manager messages are labeled as authored scenario text.

The page states local self-directed evidence is unverified. The changed-requirement rule is documented as latest current state plus cutoff, not a historical as-of-11:00 snapshot or SLA duration. Local editable history does not verify identity, workplace performance, competence, employer review, or accreditation.

## Checks

From `studio/`:

- `node --test tests/evidence-workspace.test.mjs` — passed, 2/2.
- `node --test tests/evidence.test.mjs tests/worksim.test.mjs` — passed, 13/13 (6 evidence + 7 worksim).
- Scoped strict TypeScript command for `src/evidence-workspace/EvidenceWorkspace.tsx` — passed with exit 0.
- Full app build intentionally not run; root owns one final build and aggregate test pass.
- Browser acceptance pending. The known local-preview URL policy block remains in force; no alternate surface, raw CDP, shell browser, or indirect UI workaround was used.

## Remaining review

Root should inspect the full diff, run the final app build and aggregate suite, and decide whether to accept W5. No deployment, external submission, verified employer score, or browser visual acceptance is claimed.
