"""KAIRO advert, beats 4-5 (t = 8.0-16.0 s): the project's own induction-motor GLB, rendered offline.

Reads studio/public/models/engineering/induction-motor.glb (read-only). Writes a transparent PNG plate
sequence to design/kairo-ad-20261024/build/motor/ and motor-projection.json, which holds the exact pixel
positions of the motor's own longitudinal section outline (motorGeometry.json "side") at the first frame,
so the compositor can land the paper diagram line precisely on the 3D cutaway.

Timeline (30 fps, plate frame 1 = advert 8.000 s):
  1-15    hold the front, near-orthographic view that matches the section drawing
  15-75   one orbit to a three-quarter cutaway (dolly-zoom keeps the motor's size steady)
  43-55   select the squirrel cage: soft emission highlight, as the studio does on selection
  79      supply switched on: rotor, fan and bearing cages accelerate (visual speed, not measured rpm)
  75-120  slow push towards the rotor; 120-240 slow drift for the practice/observation beat

Run from the project root:
  tools/blender/blender-4.5.14-windows-x64/blender.exe -b --factory-startup --python design/kairo-ad-20261024/blender/render_motor.py -- [--preview]
"""
import bpy, json, math, sys, time
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path.cwd()
HERE = ROOT / 'design/kairo-ad-20261024'
GLB = ROOT / 'studio/public/models/engineering/induction-motor.glb'
HDR = ROOT / 'studio/public/models/engineering/poly_haven_studio_1k.hdr'
GEOMETRY = ROOT / 'studio/src/engineering/motorGeometry.json'
OUT = HERE / 'build/motor'
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
PREVIEW = '--preview' in ARGS

FPS = 30
FRAMES = 240
W, H = 1200, 1080

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS  # set before import so glTF time maps to 30 fps frames
bpy.ops.import_scene.gltf(filepath=str(GLB))

# Cutaway: show each part's 'cut' variant where one exists, as the studio's cutaway view does.
objs = [o for o in scene.objects if o.type == 'MESH']
has_cut = {o['kairo_node'] for o in objs if o.get('kairo_variant') == 'cut'}
for o in objs:
    if o.get('kairo_variant') == 'full' and o.get('kairo_node') in has_cut and o.get('kairo_spin') is None:
        o.hide_render = True
        o.hide_viewport = True

# Motor centre from visible geometry.
lo = Vector((1e9, 1e9, 1e9)); hi = Vector((-1e9, -1e9, -1e9))
for o in objs:
    if o.hide_render:
        continue
    for c in o.bound_box:
        w = o.matrix_world @ Vector(c)
        lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
centre = (lo + hi) / 2
centre.y = 0.0

# World and lights: soft studio, warm key, cool rim, matching the advert's desk-lamp/screen contrast.
world = bpy.data.worlds.new('advert-world'); scene.world = world
world.use_nodes = True
nt = world.node_tree
env = nt.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(str(HDR))
bg = nt.nodes['Background']; bg.inputs['Strength'].default_value = 0.75
nt.links.new(env.outputs['Color'], bg.inputs['Color'])

def area(name, loc, energy, color, size):
    light = bpy.data.lights.new(name, 'AREA'); light.energy = energy; light.color = color; light.size = size
    ob = bpy.data.objects.new(name, light); scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (centre - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return ob

area('key-warm', (-0.9, -1.4, 1.2), 140, (1.0, 0.88, 0.74), 1.2)
area('rim-cool', (1.1, 0.9, 0.9), 90, (0.72, 0.84, 1.0), 0.8)
area('fill', (0.4, -1.6, -0.2), 35, (1.0, 0.97, 0.92), 1.5)

# Selection highlight on the squirrel cage, keyed so it rises at frame 43-55.
cage = next(o for o in objs if o.name == 'rotor-cage')
for slot in cage.material_slots:
    mat = slot.material.copy(); slot.material = mat
    bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if bsdf is None:
        continue
    bsdf.inputs['Emission Color'].default_value = (0.62, 0.86, 0.78, 1)
    strength = bsdf.inputs['Emission Strength']
    for frame, value in [(1, 0.0), (43, 0.0), (55, 1.6), (75, 0.9), (240, 0.9)]:
        strength.default_value = value
        strength.keyframe_insert('default_value', frame=frame)

# Rotor spin: angle is the integral of a smooth speed ramp starting at frame 79.
spin = [o for o in objs if o.get('kairo_spin') in ('rotor', 'bearing-cage')]
OMEGA = 2 * math.pi * 0.85  # rad/s: a readable visual speed; the studio labels no shaft rpm here
def rotor_angle(frame):
    t = (frame - 79) / FPS
    if t <= 0:
        return 0.0
    ramp = 1.1
    if t < ramp:  # speed eases from 0 to OMEGA: integral of smoothstep
        u = t / ramp
        return OMEGA * ramp * (u ** 3 - 0.5 * u ** 4)
    return OMEGA * ramp * 0.5 + OMEGA * (t - ramp)
for o in spin:
    factor = 0.42 if o.get('kairo_spin') == 'bearing-cage' else 1.0
    o.rotation_mode = 'XYZ'
    for f in range(1, FRAMES + 1):
        o.rotation_euler = (rotor_angle(f) * factor, 0, 0)
        o.keyframe_insert('rotation_euler', index=0, frame=f)

# Camera: per-frame keys from an explicit easing so every frame is reproducible.
cam = bpy.data.objects.new('advert-camera', bpy.data.cameras.new('advert-camera'))
scene.collection.objects.link(cam); scene.camera = cam
cam.data.sensor_fit = 'HORIZONTAL'; cam.data.sensor_width = 36; cam.data.clip_start = 0.02; cam.data.clip_end = 50

def smooth(u):
    u = min(1.0, max(0.0, u))
    return u * u * u * (u * (6 * u - 15) + 10)

K = 4.6 / 200.0  # distance per mm of lens: constant apparent size during the dolly-zoom
def camera_state(f):
    orbit = smooth((f - 15) / 60)
    az = math.radians(36) * orbit + math.radians(4) * smooth((f - 120) / 120)
    el = math.radians(21) * orbit
    lens = math.exp(math.log(200) + (math.log(48) - math.log(200)) * orbit)
    dist = lens * K * (1 - 0.13 * smooth((f - 75) / 60))
    target = centre + Vector((0.035 * orbit, 0, -0.004 * orbit))
    loc = target + dist * Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    return loc, target, lens

for f in range(1, FRAMES + 1):
    loc, target, lens = camera_state(f)
    cam.location = loc
    cam.rotation_euler = (target - loc).to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = lens
    cam.keyframe_insert('location', frame=f)
    cam.keyframe_insert('rotation_euler', frame=f)
    cam.data.keyframe_insert('lens', frame=f)
for fc in (cam.animation_data.action.fcurves if cam.animation_data else []):
    for k in fc.keyframe_points:
        k.interpolation = 'LINEAR'

# Render settings.
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.eevee.taa_render_samples = 12 if PREVIEW else 24  # 48 measured ~4.2 s/frame on this Intel UHD; 24 halves it
scene.render.resolution_x = W; scene.render.resolution_y = H; scene.render.resolution_percentage = 50 if PREVIEW else 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'AgX - Medium High Contrast'
scene.frame_start = 1; scene.frame_end = FRAMES

# Exact projection of the motor's own longitudinal section (Y = 0 plane) at frame 1.
scene.frame_set(1)
geo = json.loads(GEOMETRY.read_text(encoding='utf-8'))
visible_names = {o.name for o in objs if not o.hide_render}
polylines = []
for mesh in geo['meshes']:
    if mesh['name'] not in visible_names:
        continue
    for line in mesh.get('side', []):
        pts = []
        for i in range(0, len(line), 2):
            world_pt = Vector((line[i] / 1000.0, 0.0, -line[i + 1] / 1000.0))
            p = world_to_camera_view(scene, cam, world_pt)
            pts.append([round(p.x * W, 2), round((1 - p.y) * H, 2)])
        polylines.append({'mesh': mesh['name'], 'part': mesh['part'], 'mm': line, 'px': pts})
OUT.mkdir(parents=True, exist_ok=True)
(HERE / 'build').mkdir(exist_ok=True)
(HERE / 'build/motor-projection.json').write_text(json.dumps({
    'plate_size': [W, H], 'plate_frame': 1, 'advert_time_s': 8.0,
    'note': 'Pixel positions of motorGeometry.json side outlines projected through the frame-1 camera.',
    'polylines': polylines}, indent=1))

# Per-frame pixel position of the squirrel cage's visible centre, for the selection leader line.
cage_px = []
for f in range(1, FRAMES + 1):
    scene.frame_set(f)
    mid = cage.matrix_world @ (sum((Vector(c) for c in cage.bound_box), Vector()) / 8)
    mid = mid + Vector((0.0, -0.045, 0.03))  # front-top face of the cage, where the cut exposes it
    p = world_to_camera_view(scene, cam, mid)
    cage_px.append([round(p.x * W, 1), round((1 - p.y) * H, 1)])
(HERE / 'build/motor-anchors.json').write_text(json.dumps({'rotor_cage_px': cage_px, 'plate_size': [W, H]}))
scene.frame_set(1)

if '--no-render' not in ARGS:
    scene.render.filepath = str(OUT / 'motor-')
    t0 = time.monotonic()
    bpy.ops.render.render(animation=True)
    (HERE / 'build/motor-render.json').write_text(json.dumps({
        'frames': FRAMES, 'size': [W, H], 'fps': FPS, 'engine': scene.render.engine,
        'taa_samples': scene.eevee.taa_render_samples, 'preview': PREVIEW,
        'render_seconds': round(time.monotonic() - t0, 1), 'blender': bpy.app.version_string,
        'source': str(GLB.relative_to(ROOT)).replace('\\', '/')}, indent=1))
bpy.ops.wm.save_as_mainfile(filepath=str(HERE / 'blender/motor-shot.blend'))
print('MOTOR_DONE')
