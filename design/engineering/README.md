# Engineering Studio motor: authoring notes

`blender/build_motor.py` builds the teaching motor from code in Blender 4.5.14. It is a three-phase, four-pole squirrel-cage induction motor with a TEFC layout, sized loosely like an IEC 132 frame. It contains no third-party geometry.

```powershell
tools/blender/blender-4.5.14-windows-x64/blender.exe -b --factory-startup --python design/engineering/blender/build_motor.py -- --render
```

Each run takes about 1–2 minutes and rewrites:
- `studio/public/models/engineering/induction-motor.glb`
- `studio/src/engineering/motorGeometry.json`, which holds the per-mesh manifest, bounding boxes, the 2D section outlines sliced from the same meshes, and the slot table
- `renders/*.png`, but only with `--render` (Eevee previews; not used at runtime)

Run `node --test "docs/engineering/checks/*.test.mjs"` afterwards. `model.test.mjs` fails if the GLB and manifest drift apart.

## Conventions

- **Axes:** Blender +X is the drive end, +Z is up and −Y is the front. The glTF export is Y-up, so three.js sees +X drive end, +Y up and +Z front. Units are metres.
- **Pivots:** every object is authored in place with an identity transform, so every pivot lies on the shaft axis. Explode offsets and rotation are applied at runtime from that assembled pose.
- **Node extras:** `kairo_part` is the selectable part ID, `kairo_node` is the explode and transform group, `kairo_variant` is `full` or `cut`, `kairo_spin` is `rotor`, `bearing-cage` or empty, and `kairo_phase` is U, V or W on the winding meshes.
- **Cutaway variants:** each one is a boolean (Exact solver) minus the front-top quadrant, so the cut faces are capped. Cast parts take the `section-cut` material, which gets a drafting hatch at runtime. Cores and windings keep their own material in section.
- **Material names:** the studio replaces materials by name (see `studio/src/engineering/materials.ts`). The exported PBR values are only fallbacks.
- **Winding:** 36 slots, single-layer concentric coils, three slots per phase belt. The phase belts run U+, W−, V+, U−, W+, V− (twice). The magnetic axes are U 55°, V 115° and W 175° mechanical; `fieldMath.test.mjs` checks them against the slot table.
