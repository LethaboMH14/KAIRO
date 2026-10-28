# Dependency-order reasoning (isolated KAIRO CS Studio preview)

From `studio/`, run `npm ci && npm run dev` with Node 24, then open `/src/studio-scenarios/dependency-order-20261026/preview.html`. This is an independent HTML/ES-module preview; it is **not** mounted in the shared StudioRouter or authenticated learner journey. No API calls or cloud resources are needed.

The learner chooses one dependency edge in each of two fictional task graphs, predicts whether all tasks can finish and which task is scheduled second, explains before reveal, and reads a deterministic Kahn-style topological trace. Alphabetical ready-node tie-break is a **teaching choice**, not a claim that Python's `graphlib.TopologicalSorter` guarantees the same order. Source: https://docs.python.org/3/library/graphlib.html (concept reference, not a learner-uploaded reviewed source).

The exercise stores two **separate, action-only** local attempts in memory; export/import uses a 16 KiB capped JSON format. Strict replay validates known scenario, round order, source ID/revision and expected fields and recomputes outcomes. It does **not** prove who made the attempts or that an edited, structurally valid prediction was originally entered. Do not promote these records as authenticated evidence, grades, or learning gains. Importing restores a completed session or advances to the next round; no silent server persistence.

Focused test: `node --test tests/dependency-order-20261026.test.mjs`. Automated checks do not replace keyboard/screen-reader/200% zoom or subject expert review. Integrate only after coordinator owns shared routing, reviewed-source and consented evidence contracts.
