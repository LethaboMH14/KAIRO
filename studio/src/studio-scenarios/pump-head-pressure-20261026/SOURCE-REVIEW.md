# KAIRO Head–Gauge Pressure Challenge — source review (26 October 2026)

**Status:** public concept checked against the linked text; **independent engineering subject review pending**. No expert sign-off, device test, learner trial, live measurement or operational validation is claimed.

## Learner objective

Given a *fictional stationary open column* of constant-density fluid, change either the vertical depth or assumed density, commit a directional and numeric gauge-pressure prediction, explain it, and compare the prediction with a deterministic calculation. Round 2 is independent of round 1. The 2D comparison has a complete numeric reading alternative.

## Checked source concept and model boundary

- OpenStax, *University Physics Volume 1*, §14.1, “Fluids, Density, and Pressure”: https://openstax.org/books/university-physics-volume-1/pages/14-1-fluids-density-and-pressure . For a fluid at rest with constant density, the pressure relative to the open surface is `Δp = ρgh`. The full expression includes surface pressure `p0`; this challenge reports **gauge** pressure `p − p0`, not absolute pressure.
- KAIRO internal `docs/pump-lab/MODEL.md`, contract `kairo-pump-lab-model/1`: the existing illustrative water model uses metres of head, kPa gauge, rounded density `1000 kg/m³`, and standard gravity `9.80665 m/s²`. This new activity does not modify or duplicate its dynamic pump curve; the density variation is a separate static-fluid teaching exercise.

Calculation: `gauge_kPa = density_kg_per_m3 × 9.80665_m_per_s2 × vertical_depth_m / 1000`. Results are displayed to 2 decimals, while comparisons use the unrounded result. Numeric learner predictions are one decimal place and count as close when within 1 kPa. No score or model result is stored in the exported action record.

## Deliberate fictional cases

1. Starting depth 3 m, assumed density 1000 kg/m³; learner changes depth to 2, 4 or 6 m.
2. Starting depth 5 m, assumed density 1000 kg/m³; learner changes density to 800, 1000 or 1200 kg/m³. These are *invented constant densities*, not named chemicals or fluids for handling.

Assumptions: open free surface; zero surface gauge pressure; stationary column; uniform gravity; constant density in each scenario; vertical depth; no flow, velocity head, friction, pump performance or transient effects. A depth of 5 m is not necessarily a pump total dynamic head. The activity is **not** an equipment operation, diagnosis, pressure-vessel design or safety calculator.

## Integrity, accessibility and evidence

- Revision `openstax-14-1-pump-model-20261026/1`; all exports explicitly `local-unverified`.
- Two ordered attempts with user predictions/explanations committed before reveal. Imported JSON is bounded, exact-schema and action-only; all results are recomputed. No owner identity, success flag or authenticated learning record can be supplied.
- Native labelled controls, fieldset/legend, focus on revealed heading, live error/status, semantic result table, and decorative 2D SVG marked hidden from assistive technology. No server/network/credential calls.
- Browser, keyboard, screen-reader, mobile, zoom and reduced-motion behaviour **require authorised human/device verification**; static markup and automated tests do not establish those outcomes.
- Product/Intelligence: deterministic concept→prediction→trace. Usability/Presentation: native inputs, chart and reading table. Sustainability: standalone local arithmetic; actual cost measurements not performed. Impact: learning gains not measured.

## Acceptance and next owners

Independent domain reviewer should verify the gauge/absolute distinction, assumptions, rounding and examples. Accessibility reviewer should exercise both rounds, error/retry, focus recovery, JSON import/export, 200% zoom and keyboard/screen-reader on an authorised device. The StudioRouter/source/consent owner must separately decide whether and how to integrate a reviewed challenge into authenticated source/revision→practice→resume; this draft does not edit their files. Respect PR #34 merge gates.
