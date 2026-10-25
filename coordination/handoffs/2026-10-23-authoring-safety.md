# Authoring safety and revision review handoff

Date: 23 October 2026. Lane D. Agent: `codex-authoring-safety-20261023-d`; client Codex; model gpt-6; effort unknown.

## Scope and files

- Added `docs/authoring-safety-20261023/README.md`.
- Added this handoff.
- Read-only review of current source/lesson routes and validators, passage revision checks, artifact panel/renderer, workspace save behavior, engineering motor model, AI gateway, supplied pasted AI answer and judging criteria. No runtime edits, browser observation, install, external upload, schedule, cloud call or paid service.

## Criterion and need

This lane supports Product (editable source-grounded lessons), Usability (safe editing, keyboard/mobile layouts and save recovery), Presentation (inspectable AI changes), and Intelligence (bounded proposals with explicit provenance). Learners need to revise lessons without losing the exact reviewed material, applying stale changes or letting imported/generated data execute code. The evidence is source inspection and current official OWASP, MDN and IETF documentation. It is not a penetration test, implementation acceptance, device check, domain review or learning-outcome result.

## Main findings

- Current source code hashes reviewed material and binds evidence to source IDs/revisions/offsets. It rejects unknown citation IDs and requires exact quoted support for practice answers, but chapter citations are not entailment checking and do not establish truth.
- The current source review endpoint replaces the latest mutable review and accepts no expected-revision precondition. Immutable source revisions plus a conditional save are needed before concurrent authoring.
- Current upload limits body to 8 MB and allowlists extensions, then invokes an extractor; parser isolation, expanded archive bounds and public authorization are not established by that code.
- Existing artifact rendering is a strong safe baseline: strict text/table JSON and ordinary React text output. Interactive artifacts should use approved components and versioned capability IDs, with no arbitrary HTML/CSS or generated code.
- The gateway prototype is unmounted and explicitly requires a durable ledger for multi-instance serving. Its source-current and cancellation checks are useful patterns, not production status.
- The pasted proposal's open action strings, numeric map, `z.any()`, serialized rich-text state and CSS width lack bounds and do not supply diffs, undo or semantic citation checks. Its DC commutator sample conflicts with the current three-phase induction motor content.

## Decisions proposed

Use a strict discriminated lesson-block schema, finite layout presets and a compiled capability registry with command-specific parameter validators. Every AI edit is a proposal against a captured base hash; apply only after user review and a current-hash check. Save with strong ETag/If-Match or equivalent compare-and-swap; preserve conflicting drafts. Undo creates a new revision. Export/import a validated versioned JSON package with no originals or learner history by default.

## Checks and limitations

Checked current source files and relevant judging matrix. Searched official OWASP, MDN and IETF references on 23 October 2026 and linked them in the report. No tests were run because this was a read-only review. No claim is made that the requirements are implemented or tested in the app. Root independently owns `tools/lesson-authoring-kit`; inspect and integrate this handoff with that work without copying the package into its scope.

## Remaining work

Root should compare the strict schema and conflict requirements to the isolated authoring-kit implementation, then record any deltas in its own review. Future acceptance should cover injection-as-data, invalid capability rejection, exact revision/quote resolution, stale proposal rejection, two-editor conflict preservation, malformed/oversized import behavior, storage write failure, export omissions and iframe boundary probes if HTML is ever considered. Human/device, accessibility and subject-matter review remain separate gates.
