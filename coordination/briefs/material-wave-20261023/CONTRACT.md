# My Material delivery contract v1 — 23 October 2026

Root owns SourceWorkspace.tsx, material-flow.css, orchestration, request gates and integration. No worker owns router, provider, server, existing types, manifests, lockfiles, source-continuity or pump-lab. Recheck bus; register actual settings; claim only your named package, test, docs and handoff. Browser observation remains forbidden; no headless, screenshots, HTTP page capture, cloud calls, installation, paid generation or schedule. KAIRO is the teacher; selected C colours and Manrope. No arbitrary HTML/JS execution.

Three parallel workers: two existing chats requested as gpt-6-luna/low and one research subagent gpt-6-luna/low. Each self-reports actual settings. Root independently reviews. No extra workers.

## A — lesson brief and source-linked cards
Own studio/src/material-lesson-plan/, studio/tests/material-lesson-plan.test.mjs, docs/material-lesson-plan/, coordination/handoffs/2026-10-23-material-lesson-plan.md.
Export from model.ts:
`type MaterialBrief={goal:string;depth:'short'|'standard'|'deep';approach:'read'|'worked'|'practice'}`;
`type MaterialCard={title:string;steps:string[];citation:{locator:string;quote:string;sourceId:string;revision:string}|null;status:'draft'|'reviewed-source'}`;
`buildMaterialCards(source:Source|null, texts:string[], brief:MaterialBrief):MaterialCard[]`;
`compileMaterialGoal(brief:MaterialBrief):string` (bounded <=300 chars, goal takes precedence, do not silently promise local generator consumes it).
Import Source read-only from workspace/types. Pure deterministic, no model call. Three cards maximum, actual readable titles/steps; exact quote from reviewed page only when unmodified current text and source reviewed+revision. Empty pages no invented quote. Dirty/missing revision => null citation + draft. No claims semantic intelligence, learning styles, mastery or automatic studio conversion. Include realistic motor and pump sample title/steps in docs, distinguish authored example from learner source. Test input preservation, wrong revision/dirty/page mapping, empty sources, goal bounds and options.

## B — material lesson controls UI
Own studio/src/material-planner-ui/, studio/tests/material-planner-ui.test.mjs, docs/material-planner-ui/, coordination/handoffs/2026-10-23-material-planner-ui.md.
Export default `MaterialPlanner` from MaterialPlanner.tsx. Props are structural and independent of A imports:
`{brief:{goal:string;depth:'short'|'standard'|'deep';approach:'read'|'worked'|'practice'},onChange:(brief:same)=>void,cards:{title:string;steps:string[];citation:{locator:string;quote:string;sourceId:string;revision:string}|null;status:'draft'|'reviewed-source'}[],busy:boolean,reviewed:boolean,cloudAvailable:boolean}`.
Stateless controlled panel. Label goal; choice buttons depth and approach; show cards with exact citation details or 'Review and save your source to attach a citation.' Preview label explains this is a planning outline, not generated lesson. Brief applies to cloud request only; local reading uses exact excerpts. No generation buttons owned here, no storage/network/teacher/router. Plain warmth, paper/moss, compact mobile, no fake AI scores. busy prevents changes in callbacks. SSR rendered tests plus meaningful handler tests where harness permits, real component not string-only assertions.

## C — tool and authoring research
Own docs/material-authoring-research-20261023/ and coordination/handoffs/2026-10-23-material-authoring-research.md. Read-only product source. Research official primary docs for H5P, Adapt Learning, JSON Forms, Tiptap (or Lexical), plus existing artifact-panel and lesson planner. Compare licences, install/integration effort, editing, accessibility, safe embedding, citations, source revisions, export, offline, costs. Recommend smallest useful approach now versus later; no install or new runtime. Provide source URLs and dated verification, strict authored JSON blocks + allowlisted React renderers preferred until sandbox architecture reviewed. Give a concrete title/steps/citation example using an existing public source and exact quote checked online; separate general physics source from authored simulation parameters. Do not fetch private user material. Deliver useful decision memo, not a giant platform migration.

## Acceptance across packages
Product/Usability: learner knows review -> edit brief -> create -> learn. Creativity: useful source-linked activities, not decorative cards. Intelligence: explicit source-conditioned rules with explanation, not trained adaptation. Impact: reading and short path usable without voice/3D; not validated learning gain. Sustainability: reusable contract/no new dependencies. Presentation: truthful clear demo states. Evidence: exact tests and changed files; gaps include browser/device/learner/domain review. Each worker checks inbox before handoff and completes/releases its claim.
