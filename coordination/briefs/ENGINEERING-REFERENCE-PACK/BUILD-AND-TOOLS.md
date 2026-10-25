# Engineering implementation handoff

Use `PASTE-INTO-CLAUDE-DESIGN.md` as the self-contained creative/build brief. Attach both numbered PNGs. Their images are generated design targets, not usable motor meshes or a rigged character. The formula and exact behaviour in the brief take precedence over illustrative image details. This pack refines the earlier Engineering brief: use the consistent induction-motor example and synchronous-field-speed exercise rather than the optional unrelated DC-load exercise.

## Existing project: install status

React 19.2, Three.js 0.180, R3F 9.4, Drei 10.7, TypeScript 5.9, Vite and Node are already in `studio/package.json`. Portable Blender 4.5.14 is recorded in `tools/blender-install.json`. Use the existing package-lock and environment; no replacement app scaffold, global engine install or broad dependency update is needed.

Seven skills were installed into this project's `.claude/skills/` using the bundled skill installer. Claude Code should discover them on its next turn/session in this checkout. They are not thereby installed into Claude Design's browser runtime. If skills do not appear, start/reload the Code session in this root and inspect the client's supported skill discovery; do not install duplicate copies blindly.

| Skill | Source | Purpose |
|---|---|---|
| frontend-design | anthropics/skills | visual hierarchy, deliberate materials/typography, responsive craft |
| threejs-fundamentals | CloudAI-X/threejs-skills | hierarchy, coordinates, renderer, resource cleanup |
| threejs-interaction | same | selection, raycasting, camera and input |
| threejs-animation | same | clip/mixer behaviour and time-based motion |
| threejs-materials | same | physically based materials |
| threejs-lighting | same | shadows and environment lighting |
| threejs-loaders | same | model loading, caching and missing-asset handling |

The community Three.js pack is not an official Three.js package. Its current examples target r186; this app uses r180. Check against installed type declarations and official documentation, retain R3F's renderer/loop ownership, and do not paste a second vanilla renderer or upgrade the app to follow an example. Source revisions and per-file SHA-256 values are in `installed-skills.json`. Inspection found Markdown guidance files and Anthropic's licence, with no downloaded executable skill scripts. Guidance is not a guarantee of correct output.

Pinned upstream revisions:

- CloudAI-X/threejs-skills: `0e181866f095b5f06d005133876e926515390d95`
- anthropics/skills: `dbd4588f9e1033efb41dad4bef2f7947c8993d44`

`tools/install_engineering_skills.ps1` checks/restores these pinned skills using the local bundled installer when available. It does not overwrite an existing skill directory. A fresh clone with missing npm dependencies can use:

```powershell
Set-Location studio
npm ci
npm run build
```

Do this only after the actual Code session registers and claims its allowed work. Shared dependency changes require coordination; the initial motor/GLB workflow needs no new library. Use `npm run dev` on an unoccupied local port for implementation preview, or coordinate the existing preview. Never kill an unknown process to take a port.

## Tools by job

| Job | Use | Concrete output |
|---|---|---|
| Browser scene | R3F + Three.js + Drei | one Canvas owned by the Engineering module |
| Motor geometry | licensed multipart asset, or Blender/Python | Y-up GLB, metres, named independent parts and stable pivots |
| Rotation/explosion | R3F useFrame and refs, delta-based damping | deterministic transforms; exact reassembly |
| Avatar | licensed rigged GLB + AnimationMixer/useAnimations | real skeleton and matching idle/point/explain clips |
| Optional VRM | @pixiv/three-vrm, only if the chosen asset is VRM | requires coordinated dependency claim and compatibility check |
| Lighting | supplied CC0 1K HDRI with environment lighting | reflections; background remains actual workshop geometry |
| Audio | user-initiated browser speech for a prototype | captions first; no claimed viseme lip sync |
| Asset optimization | Blender decimation/texture resizing; optional glTF Transform | retained semantic part nodes and lower runtime cost |
| Checks | TypeScript build, browser interactions and renderer metrics | measured evidence and honest unmeasured fields |

The reference HDRI is downloaded to `assets/design-reference/engineering/poly_haven_studio_1k.hdr`, 1,682,195 bytes. Author Greg Zaal, Poly Haven, CC0; SHA-256 in `asset-manifest.json`. Claude can copy it into its engineering-owned runtime folder after claiming ENG-001. No image texture can substitute for a motor mesh or avatar skeleton.

Quaternius Universal Base Characters is a candidate free rigged-human starting point, not a downloaded or customized instructor in this pack. Only part of its full pack is free. Verify the exact selected file and licence; do not purchase the Source tier automatically. The mockup's instructor requires asset selection/customization, clothing, rig and compatible gestures to approach that target. Existing RobotExpressive can remain a clearly identified temporary guide if needed.

No physics engine, paid model generator, paid avatar API or new cloud service is necessary for the initial prototype. Google credits do not cover Claude subscriptions or third-party asset subscriptions. Optional AI motor Q&A requires a separate source/context/backend task; the existing prepared CS guide endpoint is not a motor backend.

## Ordered implementation

1. Read CLAUDE.md, AGENTS.md, the bus protocol, the integration contract and this pack. Register the actual Code session and claim ENG-001. Do not register the browser Design session as a local worker.
2. Build one real motor and one successful part-selection interaction. Prove the ID-to-mesh mapping.
3. Add exact assembly transforms, explosion reversal, cutaway, assembled-only operation and keyboard controls.
4. Add the stated assessment and independent calculation examples; validate NaN/zero/invalid pole handling.
5. Add materials, environment lighting and optimized workshop assets. Preserve semantic part boundaries during optimization.
6. Add the optional avatar only when an actual rig and matching clips exist. Keep a functional guide-off/captions-only path.
7. Test desktop and phone layouts, reduced motion, 2D/WebGL fallback, fast slider reversals, selection after explosion, pause, and repeated entry/exit. Record devices, errors, timings and frame measurements.
8. Deliver the default engineering component, scoped CSS, asset sources/licences, part/camera/clip manifests and evidence handoff. Codex integrates the router after review.

## Primary references checked 21 October 2026

- [Anthropic Design workflow](https://support.claude.com/en/articles/14604416-get-started-with-claude-design)
- [Claude Code skills and project locations](https://code.claude.com/docs/en/skills)
- [Anthropic frontend-design source](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
- [Community Three.js skill source](https://github.com/CloudAI-X/threejs-skills)
- [R3F performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [Three.js glTF loader](https://threejs.org/docs/pages/GLTFLoader.html)
- [glTF Transform CLI](https://gltf-transform.dev/cli)
- [Poly Haven Studio HDRI](https://polyhaven.com/a/poly_haven_studio) and [CC0 terms](https://polyhaven.com/license)
- [Quaternius Universal Base Characters](https://quaternius.com/packs/universalbasecharacters.html)
- [VRM runtime and separate sample-asset licensing](https://github.com/pixiv/three-vrm)
- [ABB variable-speed motor teaching slides: frequency, poles and field speed](https://library.e.abb.com/public/3062d575ad5aca7085257c1300657012/9AKK105713A9851_M_Baldor_Session_6_Variable_Speed_Motors.pdf)

Performance budgets are design targets until measured. Suggested first pass: desktop hero scene under about 200k visible triangles and 150 draw calls, 1–2K textures, lazy-loaded optional guide, capped DPR, adaptive shadows and no idle render loop when nothing moves. Adjust to real measured hardware instead of claiming a universal frame rate.
