# Purposeful studio environments

These are art/interaction briefs, not six newly implemented spaces. Keep one shared teacher/action interface and per-domain logic. The library is a composition system: reusable architecture, lighting, props, validated calculations and reviewed activity templates. Not every source deserves a new world or a 3D object.

| Studio | Visual direction | One meaningful first interaction | Logic / asset route |
|---|---|---|---|
| Lecture | Daylit learning atelier, warm surfaces, sage accents, uncluttered board | Select a source idea; teacher points, rewrites one step, then asks a transfer question | Existing CC0 classroom; authored board/diagrams and current immutable lesson evidence |
| Engineering | Precise workshop, neutral metal, warm workbench, restrained technical overlays | Inspect/explode/cut a motor, adjust a valid parameter and explain the field-speed consequence | Claude's existing isolated Engineering assets and calculations; only integrate after owner acceptance |
| Computer Science | Tangible systems lab, calm blue/amber data routes | Follow a request, inspect JSON/SQL boundaries, change an input and diagnose a failure | Existing local API/SQLite trace, code-authored models, actual execution evidence |
| Law and Advocacy | Quiet courtroom/consultation room, timber/stone, readable evidence desk | Build an argument from a case packet, challenge a claim and cite the relevant evidence | Code-authored room and licensed props; jurisdiction/date-specific reviewed cases; do not invent legal outcomes |
| Anatomy and Health | Bright clinical teaching lab, clear layers and restrained labels | Select a structure, connect function to a reviewed question and explain uncertainty | Evaluate licensed anatomy datasets separately; do not download a multi-GB dataset without verifying per-asset licence, attribution and educational accuracy; no clinical competence or diagnosis claims |
| Industrial and Mining | Legible cutaway plant, service routes, safety zones and control desk | Trace a process, identify a fault from provided evidence and compare bounded scenarios | Code-authored geometry initially; equipment data and simulation assumptions need industry review; a visual plant is not a validated digital twin |

## Backgrounds and supporting assets

- The existing classroom and engineering HDRI are already in the project; reuse their recorded provenance instead of duplicating large libraries.
- New Poly Haven 1k studio and outdoor HDRIs are lighting/background assets. They do not provide navigable room geometry. Their hashes/download status are in assets.json.
- Rain, MPFB, Blender base meshes and the pose bundle are character-production ingredients. They do not automatically assemble a teaching room.
- Quaternius and other asset packs can supply modest geometry/animations where the specific licence and available free tier are verified. Retargeting is a conversion task, not a checkbox.
- The precise skills/versions supplied are in skills.json. Shader/postprocessing guidance is available, but visual quality should begin with framing, material response, exposure and restrained lighting.

## Art and motion requirements

Use coherent scale, eye height, light direction, shadow softness, contact and colour. Keep the explanation's focal point brighter/clearer than decorative architecture. Use depth to clarify relationships; do not obscure text behind volumetric effects, floating panels or a character. Respect the learner's camera and provide useful presets rather than constant camera travel.

The teacher shares the lesson's state: attentive when the learner acts, explanatory when guiding, quiet while the learner reads or reasons. Select a gesture because it clarifies a specific target. Define reachable points, safe walking anchors and occlusion expectations. Test the actual exported fingers, face, hair and clothing under close-up lighting.

Provide a mobile composition for each activity. A smaller screen may use a portrait/bust teacher beside a diagram while keeping the same task and evidence, instead of shrinking a desktop room. Allow a fully readable path. Budget loading, render time, audio generation and model calls independently.

## Tools and what they do

- Blender + project-local MPFB: create/adapt the human, skin/rig, expressions, material sources and export.
- Existing Three.js/R3F/Drei: runtime scene, camera, picking, targets and animation blending. Do not add a parallel engine just for an avatar.
- Optional animation retargeting/IK: add under an owned dependency/interface task only after validating the chosen rig. Keep original source clips and licences.
- Google HD TTS: already verified synthesis path; Azure local voices require a separate reviewed adapter. Neither voice provider defines the character's identity.
- Remotion authoring skill: educational motion templates and optional Player/export pipeline. The skill is installed independently of any app dependency; do not execute arbitrary generated composition code in a learner session.
- PDF/DOCX skills and existing OCR: source review, application/document output and portfolio exports. Test reading order and extracted text, not just visual appearance.
- Browser QA: installed testing guidance for Claude, plus whatever browser tools its environment actually exposes. Codex must continue to use its authorised browser-control tool. Headless no-WebGL success is not 3D acceptance.

## Reference scene acceptance

Each studio should explain: why this space exists; the source-grounded principle; what the learner can change; what is actually calculated; the source/evidence behind feedback; what the teacher can act on; and how the same task works without 3D. Save a short real interaction recording or screenshots with the state before and after. Never present a concept render as implementation evidence.
