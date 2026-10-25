# OFFLINE-MOTION-004 — PostgreSQL offline and original module explainers

23 October 2026. Owner `codex-offline-motion-20261023-d`, Codex, actual model/effort unknown/unknown. Claimed only `docs/blueprint/offline-motion`, `design/module-motion-20261023` and this handoff. No app/provider/router/core schema, other chat files or cloud service changed.

## What is delivered

- `docs/blueprint/offline-motion/README.md`, `OFFLINE-PG.md`, `MODULES.md`, `MOTION-RESEARCH.md`, `NEXT-TASKS.md`: PGlite/pgvector/storage versus model distinction; device tiers; permissions/versioned packs/sync/worker guidance; module-to-2D/3D mapping; YouTube references with evidence limits; official motion/audio/export docs; bounded next tasks and Claude instructions.
- `pg-spike/package.json` and its own lockfile: exact `@electric-sql/pglite` 0.5.11 / `@electric-sql/pglite-pgvector` 0.0.12. Official npm versions checked with authorised network execution after the restricted lookup failed DNS. Install used `--ignore-scripts --no-audit --no-fund` in this isolated folder; no existing app manifest/lockfile changed.
- `pg-spike/probe.mjs` plus `pg-verification.json`: actual local PGlite/WASM extension load, vector search, filtered retrieval, filesystem persistence close/reopen and deletion exclusion. `.probe-data` holds synthetic fixtures only; ignored with node_modules in nested .gitignore.
- `design/module-motion-20261023/index.html`, CSS, `lesson.js`, `app.js`, `test.cjs`: original standalone interactive economics demand/supply, FAC1502-style accounting transaction and INF-style retry/idempotency models. Parameter controls, step/silent play/pause/scrub, prediction, worked explanation, optional browser voice, local Markdown export. Native SVG/JS; no external media, generated image, private module text or additional motion dependency.

## Evidence and limits

PGlite reports PostgreSQL 18.6 WASM under Node v24.18.0. Synthetic 3D vectors—not actual ML embeddings—were used. Exactly filtered fixture results and reopened persistence passed. The recorded full probe took 28,895 ms including initialisation/reopen; not a query-latency or phone/browser benchmark. No embedding/generation checkpoint installed; no IndexedDB/multi-tab/browser acceptance, actual text-semantic evaluation or production integration. pgvector is not an ML model, and database persistence alone is not an offline tutor.

`node --test design/module-motion-20261023/test.cjs`: 5 passed (equilibrium equations, accounting invariants, replay semantics, bounded parameters, three DOM-stub views). `node --check .../app.js`: passed. Six local document links checked, none missing. No live app changes, so no aggregate app rebuild/test needed for this package.

The demo is an authored illustration, not official UNISA material, a full module, a real SQL/network engine, automatically graded free text, a rendered MP4 or an exact-word audio/visual timeline. Browser narration depends on installed voices and may require network; it is explicitly not guaranteed offline. Reading/captions remain available. Word/audio integration should use the existing shared controller once the contract owner agrees, not this prototype's standalone browser speech object.

YouTube domain search found Y6mOBK5peDU and 7wuYBfE131U, both describing Claude/Remotion explainers. Direct retrieval failed (cache miss); playback, tutorial steps, timestamps, source and reuse not verified. No media/transcript downloaded. Official PGlite, Transformers.js, Motion, Motion Canvas audio/time-event and Remotion Player/caption/licence docs informed the technical proposal. No claim to have watched or copied the reference videos. Prototype arithmetic, scripts and graphics are original.

Module mapping uses the existing local code inventory and selected official UNISA listings. Presence is not current enrolment. DSC2608 and higher ECS exact coverage remain pending source confirmation; MNB was user-mentioned but absent from that summary. No syllabus coverage inferred from a prefix or private paper copied into public data.

## Coordination

Root should reconcile this proposal with core DATA-AND-API/TEACHING-CONTRACT and the active source-to-Rain contract before any production store/presentation changes. Claude/Sonnet can implement isolated reusable 2D templates; Luna can audit module/source metadata and pure numerical/state tests under new exact claims. This document does not start workers, assign occupied files, imply message receipt or recreate the cancelled schedule.

Prior denied browser observation was not bypassed by another surface. No screenshots, browser automation or actual audio/device test were performed. New local artifact may be opened for user review; acceptance remains pending.
