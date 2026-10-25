"""Review renders of the KAIRO teacher source (Eevee, shared KAIRO lights/world).

  run-blender.ps1 -Script render_teacher.py -BlendFile design/character/blender/kairo_teacher.blend -Out <dir> -Mode face|full|all

Faces: neutral, encouraging (front and three-quarter), curious, focused. Full: front, three-quarter, side.
"""
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kairo_render as kr  # noqa: E402
import face_shapes as fs  # noqa: E402

ARGS = sys.argv[sys.argv.index('--') + 1:]
OUT = Path(ARGS[0])
MODE = ARGS[1] if len(ARGS) > 1 else 'all'
OUT.mkdir(parents=True, exist_ok=True)
rig = bpy.data.objects['RIG-rain']
props = rig.pose.bones.get('Properties_Character_Rain')
if props is not None:
    props['Quality'] = 2

for obj in list(bpy.data.objects):
    if obj.type in {'LIGHT', 'CAMERA'}:
        bpy.data.objects.remove(obj, do_unlink=True)
kr.setup_world(0.55)
kr.add_lights(Vector((0.0, -0.05, 1.35)))
kr.add_floor()
kr.configure_engine(samples=32)
scene = bpy.context.scene
eye = rig.data.bones['DEF-Eye.L'].head_local
FACE = Vector((0.0, eye.y - 0.02, eye.z - 0.045))
HEIGHT = 1.65


def orbit(look, dist, yaw_deg, pitch_deg=0.0, lens_fov=30.0, size=(800, 800)):
    cam = scene.camera
    if cam is None:
        cam = bpy.data.objects.new('Review camera', bpy.data.cameras.new('Review camera'))
        scene.collection.objects.link(cam)
        scene.camera = cam
    yaw, pitch = math.radians(yaw_deg), math.radians(pitch_deg)
    offset = Vector((math.sin(yaw) * math.cos(pitch), -math.cos(yaw) * math.cos(pitch), math.sin(pitch))) * dist
    cam.location = look + offset
    cam.rotation_euler = (look - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.data.sensor_fit = 'VERTICAL'
    cam.data.sensor_height = 36.0
    cam.data.lens = 36.0 / (2 * math.tan(math.radians(lens_fov) / 2))
    cam.data.clip_start = 0.01
    scene.render.resolution_x, scene.render.resolution_y = size


def face_dist(frame_h=0.34, fov=30.0):
    return frame_h / (2 * math.tan(math.radians(fov) / 2))


def shot(name, expression=None, yaw=0.0, kind='face'):
    fs.reset_pose(rig)
    if expression:
        fs.apply_expression(rig, expression)
    bpy.context.view_layer.update()
    if kind == 'face':
        orbit(FACE, face_dist(), yaw, 2.0)
    else:
        look = Vector((0.0, 0.0, HEIGHT * 0.52))
        orbit(look, (HEIGHT * 1.12) / (2 * math.tan(math.radians(15))), yaw, 2.0, size=(720, 1080))
    kr.render_to(OUT / f'{name}.png')
    print('SHOT', name, flush=True)


if MODE in ('face', 'all'):
    shot('face_neutral', 'neutral')
    shot('face_encouraging', 'encouraging')
    shot('face_encouraging_34', 'encouraging', yaw=32.0)
    shot('face_curious', 'curious', yaw=-18.0)
    shot('face_focused', 'focused')
if MODE in ('full', 'all'):
    shot('full_front', 'neutral', kind='full')
    shot('full_34', 'neutral', yaw=35.0, kind='full')
print('RENDER_TEACHER_DONE')
