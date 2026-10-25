# KAIRO My Material — Lane A handoff

Date: 23 October 2026  
Agent: `codex-luna-material-cards-20261023-a`  
Client/model/effort: Codex / `gpt-6` / `unknown` (requested gpt-6-luna/low was not exposed).  
Task: `MATERIAL-LESSON-PLAN-A-001`; exact package, test, docs and handoff paths claimed before edits.

## Changed files

- `studio/src/material-lesson-plan/model.ts`
- `studio/tests/material-lesson-plan.test.mjs`
- `docs/material-lesson-plan/README.md`
- `docs/material-lesson-plan/verification.md`
- this handoff

No SourceWorkspace, CSS, router, provider, server, existing shared type, request gate, manifest or lockfile was changed.

## Delivered interface and behavior

The package exports `MaterialBrief`, `MaterialCard`, `buildMaterialCards(source, texts, brief)` and `compileMaterialGoal(brief)`. `Source` is a type-only import from the existing workspace contract.

Cards use the current editor text and source title/locator for at most three readable page outlines. A citation appears only when the source is reviewed and has a nonempty source ID/revision, current texts match the saved `reviewedPages` exactly, page counts align, and original/reviewed locators match at each index. The citation quote is a bounded exact substring from that saved reviewed page. Dirty or reordered text, missing revision, unreviewed state or mismapped pages produces draft cards with no citation. Blank pages produce no cards. Inputs remain unchanged.

`compileMaterialGoal` keeps a nonempty learner goal first, then appends concise depth and approach guidance within 300 characters. When space is tight, the goal is truncated to reserve space for both selections. Defaults vary deterministically by selected approach/depth. The helper does not issue requests or assert that local generation consumes the goal; current local generation uses exact excerpts without a goal parameter.

## Judging evidence

| Criterion | Learner need | Observable acceptance | Actual result | Remaining gap |
|---|---|---|---|---|
| Product | Cards refer to the learner's current reviewed text | Exact quote, source ID/revision and page locator only when text and page mapping match | Tests cover exact citation plus dirty/stale/reordered/mismapped gates; suite 7/7 | No root integration or learner/domain validation |
| Usability | A readable action follows the learner's own goal and selected approach | Read/worked/practice steps and goal-first bounded compiled goal | Tests prove options change the compiled goal and total stays ≤300 | No controls or novice observation in this package |
| Creativity | Material becomes a useful task without fake content | Cards provide bounded text actions; motor/pump examples are authored illustrations with null citations | README labels both as non-evidence | No authored simulation or SME review |
| Intelligence | Source context is visible and limited | Review, revision presence, exact current text and locator mapping gate citations | Tests validate these provided values | Function does not independently hash/authenticate revision or verify semantics |
| Impact | Reading path remains available without voice/3D | Cards are text steps | Pure output only | No learning/outcome evidence |
| Sustainability | Reuse existing `Source` without extra dependencies | Type-only import and no config changes | TypeScript check passes | Root review/integration required |
| Presentation | Demonstrate a truthful review → activity transition | Draft/reviewed-source states and explicit authored example labels | Evidence README and handoff | No browser/device/demo acceptance |

## Checks

From `studio/`:

- `node --test tests/material-lesson-plan.test.mjs` — exit 0; 7 passed, 0 failed.
- `.\node_modules\.bin\tsc.cmd --noEmit` — exit 0; no diagnostics.

All test page contents, titles and locators are synthetic. No browser/headless browser, screenshot, HTTP capture, network/cloud call, audio, install, device or learner testing was performed.

## Root review notes

The package consumes the existing `Source` fields without changing their contract. The caller must pass the current source and editor text after root's existing request/revision gate. The card planner does not verify revision hashes or source meaning. Root owns connecting the compiled goal to the cloud request and deciding local-mode copy; docs explicitly note that current local generation does not consume the goal. Review source citations and sample wording before integration.

