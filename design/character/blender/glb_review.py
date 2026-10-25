"""Re-imports the exported teacher GLB into an empty Blender scene (export parity) and renders review stills.

  run-blender.ps1 -Script glb_review.py -Out <dir> -Mode <path to kairo-teacher.raw.glb>

Writes <dir>/parity.json (bones, morph names, clips, materials found after re-import) and renders made only from
the GLB: teacher-portrait.png (Idle clip, encouraging face) plus front/face parity stills per expression.
"""
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
import face_shapes as fs  # noqa: E402
import kairo_render as kr  # noqa: E402

ARGS = sys.argv[sys.argv.index('--') + 1:]
OUT = Path(ARGS[0])
GLB = Path(ARGS[1])
OUT.mkdir(parents=True, exist_ok=True)

kr.clear_scene()
bpy.ops.import_scene.gltf(filepath=str(GLB))
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
morphs = {}
for m in meshes:
    if m.data.shape_keys:
        morphs[m.name] = [k.name for k in m.data.shape_keys.key_blocks[1:]]
report = {
    'glb': str(GLB), 'bones': len(arm.data.bones), 'boneNames': [b.name for b in arm.data.bones],
    'meshes': sorted(m.name for m in meshes), 'morphs': morphs, 'actions': sorted(a.name for a in bpy.data.actions),
    'materials': sorted({s.material.name for m in meshes for s in m.material_slots if s.material}),
}


def set_expression(name):
    weights = fs.EXPRESSIONS.get(name, {})
    for m in meshes:
        if not m.data.shape_keys:
            continue
        for k in m.data.shape_keys.key_blocks[1:]:
            k.value = weights.get(k.name, 0.0)


def pose(action_name, frame=0):
    action = bpy.data.actions.get(action_name)
    if action is None:
        return False
    arm.animation_data_create()
    arm.animation_data.action = action
    bpy.context.scene.frame_set(frame)
    return True


kr.setup_world(0.55)
kr.add_lights(Vector((0.0, -0.05, 1.35)))
kr.add_floor()
kr.configure_engine(samples=32)
scene = bpy.context.scene
head = arm.data.bones.get('head')
eye = arm.data.bones.get('eye_l')
face = Vector((0.0, (arm.matrix_world @ eye.head_local).y - 0.02, (arm.matrix_world @ eye.head_local).z - 0.045)) if eye else Vector((0, -0.1, 1.45))


def camera(look, dist, yaw_deg, pitch_deg, size, fov=30.0):
    cam = scene.camera
    if cam is None:
        cam = bpy.data.objects.new('Review camera', bpy.data.cameras.new('Review camera'))
        scene.collection.objects.link(cam)
        scene.camera = cam
    yaw, pitch = math.radians(yaw_deg), math.radians(pitch_deg)
    cam.location = look + Vector((math.sin(yaw) * math.cos(pitch), -math.cos(yaw) * math.cos(pitch), math.sin(pitch))) * dist
    cam.rotation_euler = (look - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.data.sensor_fit = 'VERTICAL'
    cam.data.sensor_height = 36.0
    cam.data.lens = 36.0 / (2 * math.tan(math.radians(fov) / 2))
    cam.data.clip_start = 0.01
    scene.render.resolution_x, scene.render.resolution_y = size


renders = []
report['idleApplied'] = pose('Idle', 0)
set_expression('encouraging')
camera(Vector((0.0, 0.0, 1.22)), 1.55, 24.0, 3.0, (900, 1100))
kr.render_to(OUT / 'teacher-portrait.png')
renders.append('teacher-portrait.png')
for expression in ('neutral', 'encouraging', 'curious', 'focused'):
    set_expression(expression)
    camera(face, 0.34 / (2 * math.tan(math.radians(15))), 0.0, 2.0, (640, 640))
    kr.render_to(OUT / f'parity_face_{expression}.png')
    renders.append(f'parity_face_{expression}.png')
for clip in ('Listen', 'Explain'):
    if pose(clip, 30):
        set_expression('neutral')
        camera(Vector((0.0, 0.0, 0.9)), 3.4, 18.0, 4.0, (640, 960))
        kr.render_to(OUT / f'parity_body_{clip.lower()}.png')
        renders.append(f'parity_body_{clip.lower()}.png')
report['renders'] = renders
(OUT / 'parity.json').write_text(json.dumps(report, indent=1), encoding='utf8')
print('GLB_REVIEW_DONE', report['bones'], sum(len(v) for v in morphs.values()), report['actions'])
