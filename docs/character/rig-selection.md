# Base selection: Rain v3 vs MPFB vs Quaternius

**Decision:** build the teacher on Rain v3. On 21 October 2026 the user chose Rain in chat, after seeing the same-camera comparison in `design/character/comparison/base-comparison-sheet.png`. The evidence below is why Rain was viable and what it cost. MPFB stays a documented alternative identity path, and its spike is reproducible.

## Same-camera comparison

| | Rain v3 (Blender Studio) | MPFB rehearsal (existing CC0) | MPFB 2.0.18 new build | Quaternius Standard |
|---|---|---|---|---|
| **Licence** | CC-BY 4.0, credit required | CC0 | CC0 core assets | CC0 |
| **Look** | Soft, sculpted, animated-film | Realistic, game-like | Realistic base mesh | Stylised low-poly "superhero" body |
| **Height (rest)** | 1.649 m | 1.783 m | 1.644 m | not rendered |
| **Rendered triangles** (viewport subdivision) | 79,594 | 83,686 | n/a | n/a |
| **Bones / deforming** | 2,166 / 392 | 67 / 67 | 53 (game_engine rig) | 65 joints (glTF) |
| **Face controls** | CloudRig face, measured below | 15 ARKit-style morphs | 34 FACS-like expression units (african set) | none: no morph targets |
| **Fingers** | yes, with driven correctives | yes | yes | yes |
| **Survives glTF as authored?** | No: B-bones, head lattice, corrective smooth and action-constraint face rig are Blender-only | Yes | Yes | Yes |

Renders: `design/character/comparison/*.png`. Metrics: `*_metrics.json`. All cameras, lights and the world are identical (`design/character/blender/compare_bases.py`).

## Rain's face, measured

`design/character/blender/rain_face_probe.py` posed every face control channel to its limit, with embedded scripts disabled. It measured the evaluated face in head-bone space and rendered a thumbnail of each. 173 of 192 channel extremes deform the face. Data is in `design/character/rig/face-probe.json` and the sheet in `design/character/comparison/rain-face-control-probe.png`.

The usable controls map cleanly onto ARKit-style shapes:

| Shape | Rain control | Max movement |
|---|---|---|
| Blink | `ACT-Eyelid_Upper.*` | 39 mm skin, 45 mm lashes |
| Smile | `ACT-Lips_Corner.*` Y | 34 mm |
| Wide mouth | `ACT-Lips_Corner.*` Z | 51 mm |
| Jaw | `MSTR-Jaw` | 45 mm |
| Upper and lower lip | `MSTR-UpperLip`, `MSTR-LowerLip` | 10–14 mm |
| Cheeks | `ACT-Cheek_Outer` | 20 mm |
| Brows | `MSTR-Eyebrow` | 10–25 mm |
| Sneer, puff, lip roll | various | — |

## How the Blender-only rig was carried to the web

1. **Export spike (bake 9 face shapes, export, load):** passed in 33 s.
2. **Face shapes:** each of 31 shapes is a recipe on Rain's own controls (`face_shapes.py`). The fully evaluated face (armature, lattice, corrective smooth, one subdivision level) is stored as a morph target.
3. **Skeleton:** 70 deform joints are copied from Rain's DEF bones with Unreal-style names, plus 7 authored hair spring bones. All other deform weights are folded into the nearest exported joint; face bones go to `head`.
4. **Correctives:** Rain's driven finger correctives are exported as `cor_*` morphs and re-driven at runtime from joint angles.
5. **Textures:** UDIM skin tiles are split into head, body and hands materials with 0–1 UVs.

The final web GLB is 2.9–3.3 MB after meshopt and WebP (see `asset-manifest.json`).

## Why not the others

- **MPFB:** the most technically convenient (CC0, clean rig, exportable FACS units, original identity). Its look is realistic rather than the soft animated-film style the user asked for, and a scripted pipeline cannot sculpt that style into it.
- **Quaternius Standard:** no facial controls at all (no blink, jaw or expression morphs), so the required facial range would mean authoring every face shape from scratch.
