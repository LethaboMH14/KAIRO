# Lane E handoff: motor and pump lesson contract

Owner: `codex-authoring-studio-20261023-a`, Codex gpt-6, effort unknown. 23 October 2026.

## Scope and judging need

Read-only public interface review of Engineering motor and PUMP-LAB-001, documented in `docs/authoring-studio-20261023/ENGINEERING-ACTIVITY-CONTRACT.md`. It targets Product journey completeness, Creativity via predict/change/observe, Usability across 3D/diagram/reading and exit/resume, and Intelligence through deterministic source-grounded calculation. Learner need: move from a cited motor principle through a bounded prediction and explanatory practice attempt while retaining evidence and resuming.

## Findings and decisions

- EngineeringStudio's only public prop is `onExit`; internal setters are UI state, not reusable callbacks. `synchronousSpeed` is the reusable calculation: Hz 1–400, supported even total poles 2–12, outputs field speed rpm and rev/s. It is not measured shaft speed.
- Existing app calculator defaults to 50 Hz/four poles (1,500 rpm). `FIELD_CHECK` uses 60 Hz/four poles (1,800 rpm) as an example. Source-backed contract explicitly separates these contexts and corrects the DC commutator domain mismatch: use AC induction motor / rotating field.
- DOE sourcebook supports formula and 60 Hz example. Citation: https://www.energy.gov/sites/default/files/2014/04/f15/amo_motors_sourcebook_web.pdf. We found exact primary-source text via web search and used a short quote under 25 words; exact edition/page pin should be reviewed in source ingestion.
- Pump `INTERFACE.md` is proposed, unagreed, and unmounted. Its typed bounded session actions, snapshot/evidence/context hooks are not integration contract yet. Its model reads are illustrative seeded simulated instrument values, not real measurements. No motor adapter exists.
- Proposed command boundary is a discriminated, versioned registry with schema/range/unit validation and deterministic local handlers. No arbitrary JS, arbitrary callbacks, hidden truth or teacher master setter.

## Actual artifact and checks

Created `docs/authoring-studio-20261023/ENGINEERING-ACTIVITY-CONTRACT.md`. This exact file and `coordination/handoffs/2026-10-23-authoring-studio.md` were claimed before editing. No application source, interfaces, package files, router, provider or owner scope changed. No tests/build/browser/device activity performed (documentation-only task; not requested). Evidence is code/docs inspection and the DOE sourcebook search result, not runtime acceptance.

## Remaining work

Root should resolve whether/how this authored contract maps to shared lesson/evidence/resume schemas and separately claim any motor callback or capability-registry implementation paths. Do not integrate pump until owner/root agrees the proposed INTERFACE contract. Human source-span/page review and human keyboard/phone acceptance remain open. No educational gains, mastery, real pump measurement, specialist review, deployment or competition compliance is claimed.
