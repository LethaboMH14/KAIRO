# My Material — Lane A lesson brief and source-linked cards

Date: 23 October 2026. This package is a pure deterministic planner. Root owns `SourceWorkspace` and all request, UI, server and runtime integration.

## Interface

`MaterialBrief = {goal:string;depth:'short'|'standard'|'deep';approach:'read'|'worked'|'practice'}`  
`MaterialCard = {title:string;steps:string[];citation:{locator:string;quote:string;sourceId:string;revision:string}|null;status:'draft'|'reviewed-source'}`

`buildMaterialCards(source: Source|null, texts: string[], brief: MaterialBrief): MaterialCard[]` accepts the existing `Source` type as read-only. It emits up to three nonempty page cards with deterministic learner actions. Citations are attached only when the source is reviewed, source ID and revision are present and well formed, the current editor text exactly equals each saved reviewed page, and the original/reviewed page locators match at the same index. The quote is a bounded contiguous substring of that exact reviewed page. Empty text is omitted. Dirty, reordered, unreviewed, missing-revision or unmapped pages remain draft with `citation: null`.

`compileMaterialGoal(brief)` gives the learner's goal first position and appends concise selected depth and approach instructions. It preserves those selections within the 300-character server goal limit by truncating the learner goal only when needed; the suffix remains. It never claims that local generation uses the goal. The current local generator builds from excerpts without a goal parameter; root can send the compiled goal only through the cloud request after its own review and integration decision.

The citation gate compares current `texts` to the supplied `Source.reviewedPages`, and checks locator alignment. It does not compute or authenticate the revision itself. The caller must provide the current trusted `Source`; existing request/source revision gates remain root-owned.

## Authored examples (not learner source or evidence)

These examples show possible labels and actions. They are illustrative planning copy only: no real learner material, source quote, machine specification, pump sequence or validated engineering instruction is represented.

### Motor reading card — authored illustration

- **Title:** Read · Motor passage · supplied page locator
- **Steps:** Find the parameter the learner wants to understand; copy its value and unit only if the learner's reviewed passage states them; list any missing detail to check.
- **Citation/status:** `null` / `draft` until actual reviewed learner material is supplied and remains unchanged.

### Pump worked card — authored illustration

- **Title:** Work through · Pump passage · supplied page locator
- **Steps:** Find an example or procedure in the reviewed passage; follow only the steps explicitly stated there; note details that need checking in the source.
- **Citation/status:** `null` / `draft` until actual reviewed learner material is supplied and remains unchanged. This card does not establish a pump model, flow order, safe operating procedure or simulation.

## Evidence and judging map

| Criterion | Learner need | Observable check | Result | Remaining gap |
|---|---|---|---|---|
| Product | Work from the learner's current material | Reviewed unchanged text receives exact quote, locator, source ID and revision; stale/mismatched text gets no citation | Focused suite: 7/7 | Root must connect it to source review and actual requests; no learner/domain validation |
| Usability | See a clear next action matching goal and chosen depth/approach | Read/worked/practice steps are deterministic; goal is retained first and selected options always appear within 300 characters | Focused suite: 7/7 | No UI integration or novice observation |
| Creativity | Turn a passage into a useful activity without invented subject content | Cards contain only safe actions over source statements; authored motor/pump examples are explicitly non-evidence | Source examples and tests | No authored simulation or subject-matter review |
| Intelligence | Know exactly which source version supports a card | Current text, source review, revision presence and page locator alignment gate citation creation | Focused suite: 7/7 | The function does not independently authenticate the revision hash or source semantics |
| Impact | Continue through a readable activity without voice/3D dependence | Each card provides text steps | Pure output only | No learner study or outcome measure |
| Sustainability | Reuse an existing contract without new dependencies | Type-only `Source` import; no package/config edits | Installed TypeScript check | Root review and integration remain |
| Presentation | Explain a truthful material-to-activity path | Docs distinguish authored examples, draft cards and reviewed source cards | This README/handoff | No demo or browser/device acceptance |

