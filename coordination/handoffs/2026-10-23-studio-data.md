# STUDIO-DATA-PLAN-003 — three studios and the curated data foundation

23 October 2026. Owner `codex-studio-data-20261023-c`, Codex, model/effort unknown/unknown. Scope: `docs/blueprint/studio-data` and this handoff only. No runtime, shared schema, private corpus, router, provider, active Claude scope or cloud resource changed.

## Deliverables

- `README.md`: recommendation and evidence-backed source/rights summary.
- `STUDIO-BRIEFS.md`: pump fault lab, heart/circulation lab, CS transaction/retry lab; concrete actions/tasks/data/assets/acceptance, relative dependencies and a separate Sonnet 5.5/high startup prompt. Model setting is user-requested; actual availability/session must be verified in Claude.
- `DATA-FOUNDATION.md`: inspected current inventory, fragmented storage, exact proposed collections and ingestion/review/rights/index pipeline; source→lesson spec→representation→speech/actions→practice/evidence; explicit adaptation/ML and timing boundaries. Extends existing core plans, not a silently deployed schema.
- `catalog.json`: 13 public research metadata leads with original URLs, observed licence notes, separate discovery/publicRag/redistribute/train states. All substantive content uses remain unapproved in this staging catalogue; Forage and current OpenStax A&P commercial reuse are explicitly blocked without further permission.
- `build_registry.py` and `research-registry.sqlite`: actual local SQLite/FTS5 search over those research records only. No embeddings, downloaded assets/content, private data, runtime integration or production authorisation claim. The CLI denies unknown/unreviewed content purposes and does not execute retrieved instructions.
- `test_registry.py`: five meaningful validation/permission/query tests; `verification.json` records results and limits.

## Verified local state

Metadata-only read: 26 extracted private JSON documents / 108 chunks; six app source records, three flagged reviewed; three saved lessons. The older inventory summary lists 537 course files and 2,091 unclassified screenshots; those are not all processed/reviewed resources. `source_index.py` is bounded lexical retrieval; workspace routes store local JSON. Existing employer snapshots/model catalogues/asset provenance are useful but not a unified cloud/vector platform.

No private text, file names, source content, credentials or learner profiles copied into the new registry. No corpus upload or retraining. This snapshot is dated and counts may change in concurrent work.

## Primary-source findings

Open Anatomy Project and Open Anatomy Atlas provide reusable viewer/atlas foundations, not a whole health curriculum or physiological simulator. The latter is a candidate requiring independent maturity/build review. Z-Anatomy top-level attribution includes separately licensed NC inner-ear and kidney contributions; inspect exact heart meshes rather than importing the entire collection. Current official OpenStax A&P 2e preface states CC BY-NC-SA 4.0; do not infer commercial clearance. PTB-XL 1.0.3 official indexed dataset page states CC BY 4.0; direct page requests timed out; no waveform acquired or checksum validated. Servier is an illustration discovery source; selected item/site terms still need capture.

Modelica Standard Library has mechanical/electrical/fluid/control components and BSD-3-Clause library licensing; solver/runtime licensing and our own model validation are separate. Forage official catalogue describes self-paced job simulations and certificates as extracurricular activity; no task/video/answer reuse grant established. Its terms page yielded no readable substantive terms in this check, so rights are unresolved. Microsoft Credentials and IBM SkillsBuild are provider-discovery routes; exact eligibility/cost/programme terms remain item-specific.

## Checks and corrections

`python docs/blueprint/studio-data/build_registry.py --build`: 13 records built.
`python -m unittest discover -s docs/blueprint/studio-data -p test_registry.py -v`: 5 passed.
`--query heart`: returns original source metadata; `--purpose publicRag` for anatomy returns no cleared records, as intended.

Initial test exposed an incorrect expectation that a SQL-looking query could not match an ordinary word (“resources”); corrected the assertion to verify the database remains usable. Also explicitly closed SQLite connections for Windows temporary-file cleanup. Final five tests pass. No application build needed because application code was untouched. No browser/phone/audio/domain acceptance, cloud deployment or automated schedule.

## Suggested division for next chats

Existing Claude owns BRAND-MASTER-001, CLASSROOM-STAGE-001 and SASL-RIGHTS-001 at this check; do not assign a new studio worker those files. New Sonnet chat should own ONE isolated pump/health/CS subtree, propose the entry/target/evidence contract and deliver a small functional learning loop. Root handles shared runtime, data contracts, ownership/consent/permission enforcement and integration review. Luna can classify/public-metadata audit, validate manifests and implement bounded pure import/index/review helpers under separate claims. No new agent was started or impersonated by this package.

Read existing core DATA-AND-API/MODEL-AND-LEARNING-OPS before proposing a production registry. Adopt a single acknowledged version and migration path; don't create competing canonical stores or private global vectors. The local registry is a useful first research artefact and deliberately not advertised as production RAG completion.
