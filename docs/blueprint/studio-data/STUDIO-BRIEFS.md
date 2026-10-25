# Three studio packages for Sonnet 5.5 at high effort

The user proposed this model/effort in Claude. Availability and its actual session setting must be checked in that client; no Claude process is launched by this document. Work on one bounded studio before another. Reuse React/TypeScript, R3F/Three, Drei, Lucide and the existing selected-brand shell, with a published integration boundary. Sonnet implements; independent root/domain review gates acceptance.

## 1. Engineering: the pump room that will not fill the tank

**Scenario:** a motor drives a pump from a source tank through a valve to a destination tank. The learner must reach a target transfer rate without violating the illustrative system constraints. The twist is that “turn up the speed” does not fix every fault.

**Visible experience:** show the motor coupled to a transparent pump casing; flow particles in pipes; tank levels; valve handle; gauges; power/flow plots; an inspection bench with exploded impeller/shaft/seal. Keep the same warm classroom material system. Every glow/particle must correspond to a defined state, not arbitrary decoration.

**Actions:** select and label parts; vary bounded pump speed/valve opening; predict flow before running; take a pressure/flow reading; isolate a blocked line or closed valve in authored fault cases; compare before/after readings; explain which evidence distinguishes candidate causes; export a maintenance-style observation report. A simple repair changes a named case state rather than claiming to perform real maintenance.

**Simulation:** begin with a documented educational pump-curve/system-resistance model with units, permitted domain and deterministic answers. Build meshes procedurally or use individually licensed assets; reuse motor only through its published interface. Do not label particles CFD, implement live mains wiring or market the lab as an equipment digital twin. [Modelica Standard Library](https://github.com/modelica/ModelicaStandardLibrary) has mechanical/electrical/fluid/control components under BSD-3-Clause, useful as a reference or later solver route. The library's licence does not automatically license a separate compiler/runtime or prove that our model is physically validated. Export precomputed traces if that serves the lesson before adding a heavy simulation service.

**First package:** one procedural pump circuit; two parameters; three authored fault cases; gauge/plot/reading equivalents; prediction and explanation task; case/reset/session serialization; numerical/model tests. External specialist reviews domain claims before broad educational release.

**Acceptance:** conservation/bounds checks in the chosen simplified model; repeated seed gives identical result; reset restores all state; invalid/nonfinite input rejected; a learner can distinguish two faults from the supplied observations; help used stays in evidence; mobile reading/diagram alternative. Actual frame-time and touch checks remain required.

**Candidate isolated scope:** new `studio/src/pump-lab`, `studio/tests/pump-lab.test.mjs`, `docs/pump-lab`, `assets/pump-lab` after checking claims. Shared router/provider/package manifests are separate root-owned integration tasks. Do not edit active `engineering/` or character files without agreement.

## 2. Health sciences: heart, flow and a trace

**Scenario:** trace one blood cell through the heart and lungs, then connect an authored simplified heartbeat sequence to a waveform. The task is understanding structure and sequence, not diagnosing a patient.

**Visible experience:** anatomically reviewed selectable heart/chambers/vessels; removable layers and a cutaway; selectable route arrows/particles; pause/step a cardiac cycle; a waveform cursor and corresponding authored phase highlight; labels/caption/source panel and keyboard-accessible structure tree. Use pulsing only for a defined teaching event. Do not deform a static anatomy mesh into a purported accurate contraction model without review.

**Actions:** find a named structure; choose the next step in a flow route; compare oxygenation labels; assemble the route; match the authored phase to a diagram/trace; explain a misconception; revisit missed structures. Later, a separate waveform exercise can compare selected public ECG recordings with a domain-reviewed task. Do not claim an ECG-to-mechanical-phase mapping is exact for arbitrary recordings.

**Reusable foundation:** [Open Anatomy Browser](https://github.com/mhalle/oabrowser), [Open Anatomy Atlas](https://github.com/CognitionLabSNUC/open-anatomy-atlas), exact [BodyParts3D/Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy) subsets, and lightweight [Servier diagrams](https://smart.servier.com/). The first two are viewers/software, anatomy data has its own terms, and some Z-Anatomy contributions have NC conditions. Review heart-mesh provenance independently; exclude unclear/restricted parts rather than copying the whole atlas. Whole-body atlases are substantial foundations, not complete health curricula.

**First package:** licensed reviewed heart subset + 8–12 identified structures + one authored route + three retrieval/application tasks + selected source/credits; still-image/diagram mode. If no exact mesh clears rights, deliver original labelled schematic first and keep asset acquisition separate. Do not invent a professional-looking but anatomically wrong mesh.

**Acceptance:** anatomist/educator review; exact label-to-mesh mapping; source/model provenance; no identifying patient data; clear synthetic-versus-recorded trace labels; pause/step/reduce-motion; text equivalents; no clinical diagnosis, treatment recommendation, accreditation claim or unsupported “medical-grade” language. Record device budget and geometry simplification effects.

**Candidate isolated scope:** new `studio/src/health-lab`, `studio/tests/health-lab.test.mjs`, `docs/health-lab`, `assets/health-lab`, pending bus check. No existing Rain/SASL/brand-owner scopes touched.

## 3. Computer science: follow and repair a transaction

**Scenario:** a customer reserves the last item. Two requests arrive together, one response times out, and the learner must preserve an accurate stock balance. A 3D request room becomes something they can break, investigate and fix.

**Visible experience:** existing browser/API/database room; animated request envelopes carrying safe toy fields; request/response timeline; table rows; transaction lock indicator; operation log; side-by-side before/after result; a narrow code/SQL panel tied to the selected event. Let users choose a freeze-frame and see which component owns the state.

**Actions:** send a real bounded request through the existing toy backend; add a latency/failure in an isolated simulator; inspect status/body; select an unsafe concatenated query versus a parameterized example without executing hostile SQL; compare transaction/no-transaction outcomes; retry with an idempotency key; repair the authored workflow and explain evidence. Preview before executing any sandbox code. No arbitrary host terminal or internet access is implied.

**Foundation:** existing `studio/server/trace.mjs`, room and SQLite toy data are stronger than importing a new generic CS scene. New examples use synthetic records. Reuse current behavior through a proposed adapter, without rewriting another owner's files. Model scheduling/queueing, fault injection and event logs are deterministic and labelled when simulated; do not call a decorative animation a real packet capture.

**First package:** one last-item race scenario, seeded deterministic event engine, before/after transaction views, three guided checkpoints, error/retry path and exported explanation. Later add algorithms with pointer/memory diagrams, graph traversal, network routing/DNS/TLS, query plans/indexes, CPU scheduling and Git merge practice as separate lesson templates.

**Acceptance:** invariant stock never below zero in the corrected model; uncorrected example fails for documented reasons; identical input/seed gives identical schedule; retries do not double-spend; timeouts and unknown results stay distinct; no arbitrary SQL/code/files/network execution; accessible event log; real and simulated events labelled. Root separately reviews actual backend integration.

## Suggested build order

1. CS transaction lab if fastest meaningful depth is the priority.
2. Pump lab if engineering demonstrability and strong procedural 3D are the priority.
3. Heart lab if the showcase needs a visibly different field and rights/domain-review time is available.

Relative effort: CS has the least new asset work; pump adds a new authored simulation; health adds the largest asset/terminology/domain-review dependency. Elapsed delivery depends on asset condition, review and device optimization, not just model speed. Do not promise a full health-sciences studio from an atlas download.

## Paste into a separate Claude Code chat

```text
Work in C:\Users\USER\Desktop\fnb app of year hackathon. Use Sonnet 5.5 at high effort if actually available; report actual settings. Read AGENTS.md, coordination/README.md and the product brief. Register a unique session, inspect bus status/inbox, and respect active claims.

Read docs/blueprint/studio-data/README.md, STUDIO-BRIEFS.md, DATA-FOUNDATION.md and catalog.json, plus docs/blueprint/experience/BRAND-DECISION.md and BUILD-PLAN.md. Choose the PUMP LAB as your first bounded studio unless I explicitly select Health or CS instead. Review the proposed scope and source/licence evidence first, then claim exact new nonoverlapping files and implement the first coherent package. Do not stop at a plan.

Keep the selected C identity, warm Chalk/Moss palette, plain learner language and actual meaningful interaction. Build observe → predict → manipulate → inspect evidence → explain → feedback. Use typed deterministic domain state and a source/asset manifest. Label illustrative simulations; do not invent physical or clinical validation. Include reading/diagram/keyboard equivalents and meaningful numerical/state tests. Publish a proposed entry component/scene-target/evidence interface before root integration. Do not edit shared router, provider, active Rain/brand/SASL scopes or manifests without an explicit separate claim/agreement.

Audit exact asset/code/data terms before downloading. Catalogue records are discovery metadata, not ingestion/training approval. No whole-pack anatomy import, Forage answer-key copying, private uploads, arbitrary host terminal, public deployment or unbounded spending. Do not bypass prior denied browser observation. Finish with evidence, clear acceptance limits and a bus handoff for independent review.
```
