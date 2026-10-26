# Source and domain review boundary — KAIRO Sensor Detective

**Status:** conceptual source identified; scenario assumptions and pedagogical correctness **NOT independently expert reviewed**. The two measurement cards, their pressures and exact-reference assumptions are **fictional** and are not actual pump telemetry, certified calibrations, pressure-system limits, or diagnostic advice.

- NIST, *A Careful Consideration of the Calibration Concept* (2001): https://www.nist.gov/publications/careful-consideration-calibration-concept-0 — supports the distinction between measurand, systematic error, calibration and uncertainty. It does **not** endorse this KAIRO challenge or these numbers.
- NIST Engineering Statistics Handbook, *Calibration*: https://www.itl.nist.gov/div898/handbook/mpc/section3/mpc3.htm — discusses comparing an instrument with a reference to address bias. No traceability is asserted for this synthetic model.

## Explicit simplified invariants

For each fictional round, a reference is stipulated to be exact and contemporaneous; a zero-check reports a known additive offset; the suspect reading equals reference + offset. Thus corrected reading = suspect − zero-check, and process change = reference − baseline. In the two selected cases, either the offset alone is nonzero or the reference change alone is nonzero; real systems may have both, measurement uncertainty, nonlinear response, sensor lag or reference faults. No operator action is recommended.

## Reviewer questions before integration

1. Are the simplified measurement assumptions stated clearly enough to avoid teaching that reference readings are infallible?
2. Are offset and actual-change diagnoses unambiguous **only under the displayed assumptions**?
3. Does the accessible reading table match the SVG in actual mobile/screen-reader observation?
4. Can a learner complete and resume the exercise using keyboard alone, including 200% zoom and reduced motion?
5. Is any integration into source-linked authenticated lessons accompanied by server-verified source/revision and genuine evidence ownership? This isolated preview provides neither.
