# KAIRO — two-pump arrangement reasoning (prepared educational model)

**Source check date:** 2026-10-26. **Review status:** public-source concept check by implementation worker; **independent engineering review pending**. No manufacturer approved this model. Invented coefficients are for teaching only, not real pump sizing, efficiency, cavitation, control or safety decisions.

## Checked public concepts

1. Grundfos, Pump curves: https://www.grundfos.com/au/learn/research-and-insights/pump-curves — two identical series pumps add head at the same flow (vertical curve combination); parallel pumps add flow at the same head (horizontal combination). These rules do not mean actual system flow doubles.
2. U.S. Department of Energy, Optimize Parallel Pumping Systems: https://www.energy.gov/sites/default/files/2014/05/f16/optimize_parallel_pumping.pdf — adding a parallel pump shifts the operating point with the system curve, and the flow increase can be much less than 100%.

## Fictional teaching assumptions

Single pump: H_single(Q) = 24 - 0.1 Q². System: H_system(Q) = S + k Q², where H is metres and Q is L/s. S is 6 m or 14 m, and the learner chooses k from 0.02, 0.08, 0.18 m/(L/s)². Both pumps are identical; only this simple curve is modelled, with no real-world pump efficiency or unmodelled losses.

Series: H_series(Q) = 48 - 0.2 Q². Parallel: H_parallel(Q) = 24 - 0.025 Q², because each parallel pump carries half of the total flow.

The closed-form operating points are:
- Q_single² = (24 - S) / (0.1 + k)
- Q_series² = (48 - S) / (0.2 + k)
- Q_parallel² = (24 - S) / (0.025 + k)

All six prepared combinations have positive intersections. The solver checks combined pump head equals system head at each intersection. Different lift/resistance combinations change which two-pump arrangement produces the larger flow. This is a deterministic educational demonstration, **not manufacturer data**. The sourceRevision is an internal teaching-model revision, not a cryptographic hash of a publisher's page.

## Evidence and access boundary

Standalone preview provides native keyboard prediction and explanation, SVG bars with an equivalent numerical table, two independent rounds and action-only local JSON export/import. No automatic storage, user identity, lesson linking, authenticated save, model training or external calls. Evidence is explicitly local-unverified. Independent engineering, phone and screen-reader review are required before mounting or promoting learning evidence.
