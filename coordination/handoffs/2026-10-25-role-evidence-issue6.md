# Issue #6 — source-dated role evidence pathway (25 Oct 2026)

## Session / scope
- GitHub: https://github.com/LethaboMH14/KAIRO/issues/6
- Session: gpt6-role-evidence-20261025-a; ChatGPT / actual GPT-6, effort setting unknown (not exposed).
- Branch: feat/issue-6-role-evidence-20261025-a from main commit 20183faf31fe30bc68e2fc70cb339e7fd24fce79.
- Remote GitHub connector only. **Owner's canonical local SQLite bus was not available or claimed.** The issue comment is the cross-chat ledger. Request coordinator/shared-interface ownership approval before any route, adapter, persistence or CSS edit.
- Exclusive new files: studio/server/role-evidence/index.mjs, studio/src/role-evidence/RoleEvidence.tsx, studio/tests/role-evidence.test.mjs, this handoff. Existing opportunities/pathways and shared files were not edited.

## Learner need / seven judging criteria
Product, Usability, Impact and Intelligence: provide a traceable learner-chosen bridge from a dated primary-provider requirement to a self-reported practice artifact/note, explain the specific KAIRO-authored rubric rows still undocumented, allow correction or removal through an opt-in host, and recommend a small next practice. No invented opening, hiring/ATS/eligibility score, inferred demographic characteristic, employer partnership, automatic application, prohibited crawl, AI-generated fabricated citations or sharing.

## Exact v1 server contract
Import evaluateRoleEvidence({role,evidence=[],now=new Date()}) and isSafeRoleLink(value) from studio/server/role-evidence/index.mjs. Pure, synchronous, no external calls or persistence. Throws TypeError on invalid source, IDs, evidence or limits (caller displays unknown rather than failing open). Pass deterministic "now" as canonical UTC instant/valid YYYY-MM-DD, or a Date.

role = {
  version:1, id:string, title:string, provider:string,
  source:{
    officialUrl:string, checkedAt:string, verification:"official"|"discovery-only",
    status:"open"|"closed"|"unknown", closesAt:string|null
  },
  requirements:[{
    id:string, text:string, providerExcerpt:string, sourceLocator:string,
    priority:"essential"|"preferred"|"unspecified",
    rubric:[{id:string,label:string}],
    practice?:null|{title:string,instructions:string,href:string}
  }]
}

The source URL must be a public HTTPS original-provider page, checkedAt must be dated, and each requirement includes a short manually reviewed quote and page locator. Essential/preferred categories MUST be sourced by a curator; an old free-text opportunity record does **not** establish a priority. Metadata is a dated human-curated summary, **not independently verified live source truth**. Original provider quote accuracy and excerpt use permissions require human review before real records are added; this deliverable seeds **no real current vacancies**. Dates are parsed only if valid and canonical. Seven-day source freshness transitions to stale. Date-only closing deadlines are unknown during the closing day rather than assumed still open or prematurely closed; deadline-ahead-unconfirmed does not confirm an active vacancy.

evidence = [{
  id:string, requirementId:string, rubricIds:string[],
  kind:"project"|"practice"|"credential"|"explanation",
  reviewStatus:"self-reported"|"reported-feedback"|"unknown",
  note:string, reference?:string
}]

Every linked rubric ID must exist in the nominated requirement; duplicates, unknown IDs and unsupported "independently verified" statuses are rejected. Reference is an opaque text identifier, never interpreted as a URL or fetched. The calling workspace must independently replay/version-check a chosen practice record before creating a learner link.

Output = {
  version:1,roleId,title,provider,observedAt,
  source:{officialUrl,checkedAt,closesAt,closingDateOnly,verification,status,state,stale},
  listingState:"closed"|"unknown"|"deadline-ahead-unconfirmed",
  requirements:[{id,text,providerExcerpt,sourceLocator,priority,
    sourceState,status:"unknown"|"partially-documented"|"documented-for-review"|"source-needs-recheck",
    rubric:[{id,label,status:"unknown"|"learner-evidence-recorded",evidenceIds,explanation}],
    evidence,explanation,practice}],
  nextPractice:[{requirementId,priority,missingRubric,title,instructions,href,reason}],
  limitations:string[]
}

Bounds: 30 requirements; 12 rubric rows per requirement; 120 evidence entries; all text length-capped. Practice/internal href must be exactly one of /practice, /sources, /evidence, /pathways, /opportunities, or validated public HTTPS. No HTTP, local/IP, credentialed, unsafe-port or protocol-relative link. Learner notes are plain data. Unlinked skill is **unknown**, not inability; even fully linked rubric is documented-for-review, not passed/hired.

## Exact unmounted UI contract
Default export RoleEvidence({report,onAddEvidence?,onRemoveEvidence?}) from studio/src/role-evidence/RoleEvidence.tsx. Input report is the validated v1 view model. It displays provenance, source checked/closing dates, excerpt and locator, row-specific linked evidence and explicit unknown states, plus voluntary practice suggestions and user-choice safe links. onAddEvidence(draft) emits {requirementId,rubricIds,kind:"explanation",reviewStatus:"self-reported",note}. onRemoveEvidence(evidenceId) requests removal. **Neither callback guarantees storage**: host must validate, generate collision-resistant evidence ID, enforce authenticated owner scope, ask for/save consent and confirm success/error, then re-evaluate. No localStorage, API call, job application, background refresh or router change in component. If callbacks absent, view is read-only.

## Existing integration boundaries
studio/server/opportunities/index.mjs exposes requirements:string[] and source metadata, not verified per-requirement labels/excerpts/rubrics. studio/src/pathways/model.ts holds older learner self-reports and optional replayable practice references, not employer-assessed competencies. Reuse via a new approved, source-reviewed adapter and authenticated revision-bound owner store; do not silently migrate evidence, assume experience, or change existing files in this PR. Provider terms/permissions, account isolation and optional public information refresh are separate review gates. No employer connection requested or implemented.

## Verification / limitations
- Isolated local prototype checks used Node v22.16.0: 9/9 synthetic model tests passed; TypeScript transpileModule parse: 0 diagnostics. Those checks were on an early local prototype; **do not present them as Node 24 or full-suite pass of remote branch**.
- Branch contains its own regression test file for source dates, state, mapping, reversibility, invalid/unsafe data and optional React SSR. Required on a full checkout/CI: Node 24, npm ci from studio/, serial node --test --test-concurrency=1 tests/*.test.mjs, npm run build and UI SSR/human accessibility acceptance.
- Current tools could edit GitHub but container DNS cannot resolve github.com; full checkout/Node24/npm-ci/build/full tests are **pending**. No old handoff pass count was reused.
- No production deployment, browser/microphone/camera testing, paid cloud, private learner records, live provider recheck or hiring results.

## NEXT — coordinator request
Review this isolated PR and approve the interface (or request changes). Create a narrow follow-up issue to validate original-provider sourcing, connect an opt-in authenticated role-evidence route from /opportunities, validate linked replayable artifact revisions, enforce owner-scoped save/delete/correction receipts, and handle stale records. Issue #2/#11 gates CI; Issue #5 gates browser/accessibility/mobile acceptance. Do not silently merge or deploy.
