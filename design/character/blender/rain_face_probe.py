"""Probes every Rain face control channel: poses it to its limit, measures how the evaluated face deforms
(in head-bone space, subdivision off) and renders a Workbench thumbnail. Embedded scripts stay disabled.

Run: run-blender.ps1 -Script rain_face_probe.py -BlendFile <rain_v3.2.blend> -Out <dir>
Writes <Out>/face_probe.json and <Out>/probe/<control>_<channel>_<sign>.png
"""
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Euler, Matrix, Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kairo_render as kr  # noqa: E402

ARGS = sys.argv[sys.argv.index('--') + 1:]
OUT = Path(ARGS[0])
(OUT / 'probe').mkdir(parents=True, exist_ok=True)
rig = bpy.data.objects['RIG-rain']
FACE_MESHES = ['GEO-rain-head', 'GEO-rain-eyelashes', 'GEO-rain-eyebrows', 'GEO-rain-gums_lower', 'GEO-rain-gums_upper', 'GEO-rain-tongue']
CONTROLS = ['MSTR-Mouth', 'MSTR-LowerLip', 'MSTR-UpperLip', 'MSTR-Jaw', 'ACT-Lip_Roll_Upper', 'ACT-Lip_Roll_Lower',
            'ACT-Cheek_Outer.L', 'ACT-Sneer.L', 'CTR-Nose_Bottom', 'SK-Lip_Puff_Upper', 'SK-Lip_Puff_Lower', 'ACT-Cheek_Inner.L',
            'MSTR-Eyebrow.L', 'ACT-Eyering_Upper.L', 'ACT-Eyering_Lower.L', 'MSTR-Eyering_Upper.L', 'MSTR-Eyering_Lower.L',
            'ACT-Eyelid_Upper.L', 'ACT-Eyelid_Lower.L', 'ACT-Lips_Corner.L', 'SK-Cheek_Puff.L', 'MSTR-Head_Lower', 'MSTR-Head_Upper',
            'MSTR-Eyering.L', 'MSTR-Eye.L']

for name in FACE_MESHES:
    obj = bpy.data.objects.get(name)
    if obj:
        for mod in obj.modifiers:
            if mod.type == 'SUBSURF':
                mod.show_viewport = False


def limits(pb):
    loc = [[-0.01, 0.01] for _ in range(3)]
    rot = [[-0.4, 0.4] for _ in range(3)]
    scl = [[0.7, 1.3] for _ in range(3)]
    for c in pb.constraints:
        if c.type == 'LIMIT_LOCATION':
            for i, ax in enumerate('xyz'):
                lo = getattr(c, 'min_' + ax) if getattr(c, 'use_min_' + ax) else None
                hi = getattr(c, 'max_' + ax) if getattr(c, 'use_max_' + ax) else None
                if lo is not None or hi is not None:
                    loc[i] = [lo if lo is not None else -(hi or 0.01), hi if hi is not None else -(lo or -0.01)]
        if c.type == 'LIMIT_ROTATION':
            for i, ax in enumerate('xyz'):
                if getattr(c, 'use_limit_' + ax):
                    rot[i] = [getattr(c, 'min_' + ax), getattr(c, 'max_' + ax)]
        if c.type == 'LIMIT_SCALE':
            for i, ax in enumerate('xyz'):
                if getattr(c, 'use_min_' + ax) or getattr(c, 'use_max_' + ax):
                    scl[i] = [getattr(c, 'min_' + ax), getattr(c, 'max_' + ax)]
    return loc, rot, scl


def head_matrix_inv():
    return (rig.matrix_world @ rig.pose.bones['DEF-Head'].matrix).inverted()


def capture():
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    inv = head_matrix_inv()
    data = {}
    for name in FACE_MESHES:
        obj = bpy.data.objects.get(name)
        if not obj:
            continue
        ev = obj.evaluated_get(deps)
        mesh = ev.to_mesh()
        mw = ev.matrix_world
        data[name] = [inv @ (mw @ v.co) for v in mesh.vertices]
        ev.to_mesh_clear()
    return data


def reset(pb):
    pb.location = (0, 0, 0)
    pb.scale = (1, 1, 1)
    if pb.rotation_mode == 'QUATERNION':
        pb.rotation_quaternion = (1, 0, 0, 0)
    elif pb.rotation_mode == 'AXIS_ANGLE':
        pb.rotation_axis_angle = (0, 0, 1, 0)
    else:
        pb.rotation_euler = (0, 0, 0)


def set_rot(pb, axis, value):
    e = Euler((0, 0, 0), 'XYZ')
    e[axis] = value
    if pb.rotation_mode == 'QUATERNION':
        pb.rotation_quaternion = e.to_quaternion()
    elif pb.rotation_mode == 'AXIS_ANGLE':
        q = e.to_quaternion()
        ax, ang = q.to_axis_angle()
        pb.rotation_axis_angle = (ang, *ax)
    else:
        rot = Euler((0, 0, 0), pb.rotation_mode)
        rot[axis] = value
        pb.rotation_euler = rot


for pb in rig.pose.bones:
    reset(pb)
neutral = capture()

scene = bpy.context.scene
scene.render.engine = 'BLENDER_WORKBENCH'
scene.display.shading.light = 'STUDIO'
scene.display.shading.color_type = 'MATERIAL'
for obj in list(bpy.data.objects):
    if obj.type in {'CAMERA', 'LIGHT'}:
        bpy.data.objects.remove(obj, do_unlink=True)
eyes = bpy.data.objects['GEO-rain-eyes']
deps = bpy.context.evaluated_depsgraph_get()
ev = eyes.evaluated_get(deps)
m = ev.to_mesh()
c = sum((ev.matrix_world @ v.co for v in m.vertices), Vector()) / len(m.vertices)
ev.to_mesh_clear()
face_point = Vector((0.0, c.y, c.z - 0.035))
kr.place_camera('face', 1.65, face_point, fov_deg=30.0, aspect=(320, 320))
bpy.context.scene.camera.location.y -= 0.0
kr.render_to(OUT / 'probe' / '_neutral.png')

results = []
for name in CONTROLS:
    pb = rig.pose.bones.get(name)
    if pb is None:
        continue
    loc, rot, scl = limits(pb)
    channels = []
    for i in range(3):
        if not pb.lock_location[i]:
            channels += [('loc', i, loc[i][0]), ('loc', i, loc[i][1])]
        if not pb.lock_rotation[i]:
            channels += [('rot', i, rot[i][0]), ('rot', i, rot[i][1])]
    for kind, axis, value in channels:
        if abs(value) < 1e-6:
            continue
        reset(pb)
        if kind == 'loc':
            p = list(pb.location)
            p[axis] = value
            pb.location = p
        else:
            set_rot(pb, axis, value)
        posed = capture()
        disp = {}
        best = (0.0, None)
        for mesh_name, verts in posed.items():
            base = neutral[mesh_name]
            d = [(a - b).length for a, b in zip(verts, base)]
            mx = max(d) if d else 0.0
            disp[mesh_name] = round(mx * 1000, 2)
            if mesh_name == 'GEO-rain-head' and d:
                moved = [i for i, x in enumerate(d) if x > 0.3 * mx and mx > 1e-5]
                if moved:
                    cen = sum((base[i] for i in moved), Vector()) / len(moved)
                    best = (mx, [round(v, 4) for v in cen])
        tag = f"{name}_{kind}{'xyz'[axis]}_{'neg' if value < 0 else 'pos'}"
        png = None
        if disp.get('GEO-rain-head', 0) > 0.5 or disp.get('GEO-rain-eyelashes', 0) > 0.5:
            png = tag + '.png'
            kr.render_to(OUT / 'probe' / png)
        results.append({'control': name, 'kind': kind, 'axis': 'xyz'[axis], 'value': round(value, 5), 'rot_mode': pb.rotation_mode,
                        'max_mm': disp, 'head_centroid_head_space': best[1], 'thumb': png})
    reset(pb)

(OUT / 'face_probe.json').write_text(json.dumps(results, indent=1), encoding='utf8')
print('PROBE_DONE', len(results))
