# ADR 001: first studio runtime

Status: initial implementation decision, 21 October 2026; revisit against browser evidence.

## Decision

Start Computer Science Studio as a React/TypeScript + React Three Fiber application with a Node/Express development server and a real in-memory SQLite query. Its first experience traces a request through interface, API and database, then offers a short assessment. The room, learning objects and animated guide share one scene.

Computer science has the easiest bounded behaviour to verify. An actual request and parameterized SQL query can drive the demonstration immediately. The lecture theatre is the easiest reusable room shell. Engineering follows once a correctly separated teaching model exists; anatomy requires validated assets, and law adds role/dialogue/evaluation work.

## Visual direction

A daylight spatial workshop: porcelain #e8e9e4, ink-blue #182a37, azure #428bc9, mint #75baa6, warm timber #b98c66, and signal coral #dc806b. A broad central 3D viewport carries the experience. Quiet, left-aligned lesson controls sit beside it; a narrow bottom trace makes the sequence understandable. System typography works offline; upgrade typography after the scene direction is reviewed.

The distinctive element is the spatial request path through three architectural objects in a believable room, with a moving packet and an animated guide. Deliberate light and material contrast replace a generic neon dashboard. The initial guide is a licensed premade robot, explicitly temporary; it is not the planned realistic human teacher.

## Tradeoffs

- R3F reuses React state and typed actions. Babylon/PlayCanvas offer broader engine/editor features but would add an engine decision before this first proof.
- A modular code-authored room is lightweight and editable. A downloaded Blender classroom is retained as a reference/next asset source; it is not claimed as already converted or shown.
- The local database is a disposable educational fixture. Cloud Run needs durable external storage for actual learner records.
- No inference or cloud billing is required to run this first interactive slice. Google Cloud adapters can follow project/billing verification.

## Shared contract for other agents

`GET /api/health` returns runtime status. `POST /api/trace` accepts `{ "topic": "database" }` (bounded string), executes a parameterized SELECT and returns `{ rows, sql, parameters, trace, durationMs, provenance }`. Trace events contain `stage`, `label`, `durationMs`, and a result explanation. Browser playback is an explanatory reconstruction of that request, not a representation of cloud deployment.

Only the owning agent edits studio/ during BUILD-001. Other agents should propose changes through the shared bus and claim disjoint scopes. Authentication, cloud calls, source uploads and a production teacher are not implemented by this contract.
