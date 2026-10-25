# First isolated build wave — 25 October 2026

## Delivered
- GitHub Actions runs the serial Node 24 application suite, production TypeScript/Vite build and Python coordination-bus tests.
- New `studio/server/owner-retrieval/corpus.mjs` selects exact cited evidence from one to eight explicitly chosen, owner-scoped reviewed documents. It enforces immutable SHA-256 revisions, checks for mid-request updates, bounds results and honours cancellation.
- Five focused tests cover citations, other-owner rejection, stale/tampered records, selection limits and abort.

## Coordination boundary
The canonical `coordination/bus.sqlite3` is only on the owner's computer. This GitHub-connected session **could not inspect or claim the live bus**; it has not modified the bus database, existing routes, shared service interfaces, production deployments or credentials. Before integrating, the owner should check for active overlapping local claims and follow AGENTS.md.

## Verification
Focused equivalent tests ran locally with Node 22 type-stripping and a temporary test-only substitute for the existing TypeScript evidence selector: 5/5 passed. This is **not** equivalent to the actual repository suite. The PR's GitHub Actions job with Node 24 and the real selector is the definitive validation. No hosted application/browser test or deployment occurred.

## Next product gates
1. Wire explicit multi-source selection into authenticated routes and UI with owner and revision checks. Keep third-party provider consent per operation.
2. Introduce measured persistent indexing, region/data retention, revision invalidation and retrieval evaluations against lexical baseline.
3. Validate browser/device usability, privacy/deletion/recovery, full learner flow and external judge access.
4. Do not claim this stand-alone primitive is fully integrated multi-document RAG.
