# Give Claude this reference pack

1. Attach **01-engineering-studio-target.png** and **02-engineering-interactions.png** from `assets/design-reference/engineering/` to your Claude Design prompt. These show the overall studio, guide, controls and interaction states.
2. Open **PASTE-INTO-CLAUDE-DESIGN.md** and paste its entire contents into the prompt box. Replace the setup-guidance text currently shown in your screenshot; that text describes a workflow but does not contain the actual product brief.
3. Keep your chosen model. In the supplied screenshot it is **Opus 5.5**. Its effort setting is not visible; do not infer it. Start building in the available Design runtime. No prompt has been submitted on your behalf during creation of this pack.
4. When ready for local implementation, open Claude Code in the KAIRO project and use the existing `CLAUDE-ENGINEERING-CODE-PROMPT.md`, plus this newer pack. The code agent must claim ENG-001. Give it BUILD-AND-TOOLS.md, installed-skills.json and the integration contract. Browser Design does not automatically get the checkout or the locally installed skills.

The image files are generated visual targets, not exported GLB models or a rigged avatar. The instructor's appearance is a target that needs a licensed rig/customization. Work toward that material and lighting quality, but judge working geometry, accessible interactions and measured performance separately. The guide is optional; the motor lesson must work without it.

The separate **KAIRO-engineering-reference-pack.zip** is a portable handoff containing the brief, references, interaction contract, skill provenance and small CC0 HDRI. The two PNGs plus pasted prompt are sufficient to start Design. Keep the HDRI and build/provenance files for implementation if the browser cannot use those formats. Skills are installed locally already; no additional paid generator/account is required for the initial prototype.

## What each image means

- Image 01: visual target for the workshop, motor presentation, optional instructor and scene-level controls. On-device rendering quality remains to be achieved, not guaranteed by this image.
- Image 02: inspect/explode/guide/mobile states. Its diagram and part arrangement are illustrative; the build brief defines exact semantic parts, the motor type, calculation boundaries and avatar behaviour.

## Image generation record

Generated with the built-in image tool, rather than a paid third-party 3D generator. Prompt direction 1: a polished realistic daylight workshop with an exploded multipart motor, copper/PBR materials, restrained KAIRO controls and an optional sage-jacket instructor. Prompt direction 2: a matching four-panel interaction board covering inspect, explode, instructor poses and phone/reduced-motion assessment. A targeted correction makes the quiz ask which part holds the windings, because housing and stator are both stationary. Generated images are design references, not evidence of implemented features.
