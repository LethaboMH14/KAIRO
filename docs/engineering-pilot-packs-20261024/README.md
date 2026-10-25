# Engineering pilot teaching packs

Two original, source-cited content packs for an induction-motor field-speed lesson and a centrifugal-pump pressure/flow lesson. The JSON follows the exact version 1 shape published in `coordination/briefs/account-wave-20261024/CONTRACT.md`. It is authored explanatory content, not official curriculum, assessment, or equipment instruction.

## Files

- `motor-field-speed.json` — predict and calculate synchronous field speed; distinguish that from rotor speed/slip.
- `centrifugal-pump-pressure-flow.json` — predict, take a simulated reading, compare pressure sections, and explain what the evidence supports in the teaching model.
- `FEATURE-SUPPORTEDNESS.md` — current code evidence and explicit route/model boundaries for every action status.
- `validate.mjs` — dependency-free Node validator for exact schema shape, required fields, reference links, and supportedness enum; includes three deliberately invalid inputs.
- `validation-evidence.json` — output written by running the validator.

## Sources and reuse

Substantive physics explanations are paraphrases supported by the references recorded beside each pack. Locators include PDF navigation and printed page identifiers where available. Source reuse status is item-specific: where permission was not confirmed, only a citation and factual paraphrase are present; source wording and figures are not reproduced. The packs do not bundle source documents.

The NPTEL IIT Kharagpur course outline locates the rotating-field and induction-motor topics; an NPTEL induction-machine chapter defines slip. The U.S. Department of Energy handbook describes centrifugal-pump curves, system curves, and their operating-point intersection. The Hydraulic Institute Pump Fundamentals material documents affinity-rule assumptions and how speed/valve changes shift the operating point. All sources were checked on 2026-10-24 (Africa/Johannesburg local date); JSON evidence timestamps are UTC.

## Check

From repository root run:

```powershell
node docs/engineering-pilot-packs-20261024/validate.mjs
```

This is a structural check of the authored JSON and rejection tests, not independent engineering review. The Pump Lab package says it is not mounted in the app and its model is not validated against real equipment. No route, source-to-tool bridge, browser or device view, learner evaluation, screen-reader acceptance, formal accreditation, or real-equipment applicability is claimed. Root review and any engineering-specialist review remain open.
