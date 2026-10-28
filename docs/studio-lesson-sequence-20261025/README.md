# Studio lesson sequence adapter

Package A, 25 October 2026. This package projects the existing `schemaVersion: 1` motor and pump teaching packs into a bounded learner sequence. It does not replace pack data or mount a studio route.

## Observed input contract

Both current packs contain `id`, `title`, `objective`, `prerequisites[]`, `sourceRefs[]`, `steps[]`, `practice[]`, `evidencePrompt`, and `limitations[]`. Each `sourceRefs` row has `id`, `url`, `locator`, `licenseStatus`, and `checkedAt`. Each step has `id`, `title`, `explanation`, `sourceRefIds[]`, `learnerAction`, nullable `studioCapability`, and `capabilityStatus` (`implemented` or `manual`). The pump pack explicitly says Pump Lab is not mounted and not validated against a real pump. The motor calculator reports synchronous field speed only and its animation exaggerates slip.

The adapter returns `{title, objective, prerequisites, steps, warnings}`. It resolves each step's source IDs into complete source rows (including original locator, URL, date and licence caveat), sets `prompt` and `readingFallback` from the exact `learnerAction`, and preserves the declared capability status. It rejects unknown/missing citations, duplicate identities, unsafe URLs, unsupported capability statuses, empty required text and bounds violations. It does not truncate content. Warnings retain pack limitations verbatim and state that declared capabilities are not independent availability verification. Practice questions and evidence prompts are not projected by this contract; this is a lesson sequence projection, not a full-fidelity pack export.

## Evidence

`studio/tests/studio-lesson-sequence.test.mjs` exercises both actual JSON packs through Vite SSR and synthetic malformed copies. It checks provenance equality, immutability, manual/implemented capability status, the pump limitations, missing/duplicate references, duplicate steps, unsafe URL, unsupported status, overlong text and citation-free steps.

Automated result: 6/6 focused tests passed. Vite emitted a dependency-scan shutdown warning after the SSR module was loaded; it did not fail the tests. No browser, device, route, or learner validation was performed.

## Criteria and acceptance

- Product: present a coherent lesson sequence with cited source records.
- Usability: supply a text fallback using the same action, without implying control.
- Creativity: connect meaningful learner actions to the existing supported activity.
- Intelligence: preserve provenance and capability limits rather than inferring simulation availability.

Learner need: see a useful, source-linked activity instead of decorative 3D. Acceptance met for data projection and focused automated checks. Root still needs to independently review and mount the adapter; real device and learner acceptance remain open.
