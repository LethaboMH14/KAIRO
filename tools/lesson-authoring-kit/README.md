# Offline lesson authoring contract kit

Research spike, 23 October 2026. Not mounted in KAIRO and not an installed editing library. No dependency installation or provider credentials required. Node built-ins only.

From repository root:

```powershell
node --test tools/lesson-authoring-kit/contract.test.mjs
node tools/lesson-authoring-kit/demo.mjs
```

The demo writes only synthetic fixtures to docs/authoring-kit-20261023/demo/: source/lesson/proposal/applied/undone JSON and an escaped static reading-report.html. It is deterministic authoring evidence, not an app recording, live model response or learning experiment. Scripted approval in demo is explicitly not a human approval observation.

Files:
- contract.mjs: strict six-kind block validation, exact citations and native reviewed-source hash, bounded motor calculator activity data, proposed replacement snapshots, base/destination digests, explicit caller approval parameter, cancellation-at-commit and undo as a new version; static HTML report with escaped text.
- lesson.schema.json: draft-2020-12 interchange proposal. Runtime checks also enforce native source hashing, exact span/source identity, bounds between fields, unique IDs, bytes and change approval. JSON Schema is prevalidation only: for example, the answer index still needs checking against the actual option count, and excerpt text must equal its verified citation. The runtime validator is authoritative in this spike. Not copied blindly into a provider-specific responseSchema; no external JSON Schema engine was installed or exercised.
- fixtures.mjs and contract.test.mjs: synthetic source and adversarial/boundary tests.
- demo.mjs: executable source -> draft -> propose -> scripted accept -> escaped report -> new undo revision.
- pipeline.json: proposed multi-step workflow and bounded call policy; not a running scheduler/agent graph.
- prompts/: future adapter task templates as data, not installed agent instructions.

The native source revision is SHA-256(JSON.stringify(reviewedPages)), matching the existing workspace model. Kit proposal digests use a local recursive key-sorted JSON representation. This is not advertised as RFC 8785/JCS compliance or a digital signature. Keep these separate and version a canonicalization change before interoperability.

Known limits: a single current source; no historical snapshot store, ownership/authentication, persistence, atomic CAS save, full edit history, multi-source citations, inline mixed provenance, interactive renderer, studio dispatcher, HTML sandbox, or provider adapter. It does not verify that prose follows a cited passage, that the selected answer is semantically correct, or that an authored activity teaches effectively. A caller-supplied approval string is not authenticated approval; live UI/server must bind it to an explicit authorized event and transactional commit. Source pages here are nonempty and narrower than all possible native extraction states; live migration must support or explicitly reject blank sections.

Do not insert the kit contract directly into existing server lesson routes. Existing fixed chapter/quiz records need a tested, versioned adapter, preserving 24-hex record IDs, exact historical citations and old reading/progress behavior. Route/provider ownership remains separate.
