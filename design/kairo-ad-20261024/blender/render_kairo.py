"""KAIRO advert: the actual KAIRO teacher model, rendered offline with authored clips and Rhubarb mouth shapes.

Reads design/video-production-20261023/kairo-render.glb (the shipped kairo-teacher.glb with meshopt decoded; same
geometry and clips) read-only. Plate frame k = advert time 3.0 + (k-1)/30 s. Writes transparent PNGs to
design/kairo-ad-20261024/build/kairo/.

Performance (NLA over the shipped clips): Idle throughout; Acknowledge on "Meet KAIRO"; Explain on the source line
and on the motor line; Explain on "Keep work you can show"; Acknowledge on the close.
Mouth: build/kairo-lipsync.json (Rhubarb 1.14.0 cues on the placed takes) through the app's own VISEMES weights
(studio/src/character/rig.ts) with the app's 0.07 s cross-fade. This is phoneme-timed from audio, not a
performance-captured or hand-animated lip sync, and it follows whichever voice takes were placed.

  blender -b --factory-startup --python design/kairo-ad-20261024/blender/render_kairo.py -- [--test 25,175,300,470]
"""
import bpy, json, math, sys, time
from pathlib import Path
from mathutils import Vector

ROOT = Path.cwd()
HERE = ROOT / 'design/kairo-ad-20261024'
GLB = ROOT / 'design/video-production-20261023/kairo-render.glb'
HDR = ROOT / 'studio/public/models/character/studio_small_09_1k.hdr'
CUES = HERE / 'build/kairo-lipsync.json'
OUT = HERE / 'build/kairo'
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
TEST = [int(v) for v in ARGS[ARGS.index('--test') + 1].split(',')] if '--test' in ARGS else None
FPS = 30
W, H = 800, 880
LAST = 510  # advert 20.0 s
RANGES = [(10, 389), (435, 510)]  # frames where KAIRO is on screen (3.3-15.9 s, 17.45-20.0 s)

# The app's mouth table (studio/src/character/rig.ts VISEMES), copied verbatim.
VISEMES = {
    'X': {},
    'A': {'mouthPress': 0.6, 'mouthRollLower': 0.12},
    'B': {'jawOpen': 0.1, 'mouthStretchLeft': 0.22, 'mouthStretchRight': 0.22, 'mouthUpperUp': 0.22, 'mouthLowerDown': 0.18},
    'C': {'jawOpen': 0.3, 'mouthStretchLeft': 0.12, 'mouthStretchRight': 0.12, 'mouthLowerDown': 0.25, 'mouthUpperUp': 0.1},
    'D': {'jawOpen': 0.52, 'mouthLowerDown': 0.3, 'mouthUpperUp': 0.1},
    'E': {'jawOpen': 0.26, 'mouthPucker': 0.35, 'mouthFunnel': 0.22},
    'F': {'jawOpen': 0.07, 'mouthPucker': 0.8, 'mouthFunnel': 0.3},
    'G': {'jawOpen': 0.06, 'mouthRollLower': 0.45, 'mouthUpperUp': 0.28},
    'H': {'jawOpen': 0.28, 'mouthLowerDown': 0.15},
}
MOUTH = sorted({k for v in VISEMES.values() for k in v} | {'jawOpen'})
BLINKS = [4.05, 6.9, 9.75, 12.15, 14.9, 18.45, 19.7]

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS
bpy.ops.import_scene.gltf(filepath=str(GLB))
for o in list(scene.objects):
    if o.name.startswith('Icosphere'):
        o.hide_render = True
        o.hide_viewport = True
arm = next(o for o in scene.objects if o.type == 'ARMATURE')
acts = {a.name: a for a in bpy.data.actions}


def t2f(t):
    return (t - 3.0) * FPS + 1


# ---------------------------------------------------------------- body: NLA over the shipped clips
ad = arm.animation_data_create()
ad.action = None
for tr in list(ad.nla_tracks):
    ad.nla_tracks.remove(tr)
base = ad.nla_tracks.new(); base.name = 'idle'
idle = acts['Idle']
s = base.strips.new('idle', -60, idle)
s.repeat = (LAST + 120) / (idle.frame_range[1] - idle.frame_range[0])
s.extrapolation = 'HOLD'


def gesture(name, start_t, action, cut_frames=None, blend_in=8, blend_out=10, hold_until_t=None):
    tr = ad.nla_tracks.new(); tr.name = name
    st = tr.strips.new(name, int(round(t2f(start_t))), action)
    if cut_frames:
        st.action_frame_end = st.action_frame_start + cut_frames
        st.frame_end = st.frame_start + cut_frames
    st.blend_in = blend_in
    st.blend_out = 0 if hold_until_t else blend_out
    st.extrapolation = 'NOTHING'
    if hold_until_t:
        last = action.frame_range[1]
        h = tr.strips.new(name + '-hold', int(st.frame_end), action)
        h.action_frame_start = last - 0.05
        h.action_frame_end = last
        h.frame_end = int(round(t2f(hold_until_t)))
        h.blend_in = 0
        h.blend_out = blend_out
        h.extrapolation = 'NOTHING'
    return st


gesture('ack-meet', 3.55, acts['Acknowledge'])
gesture('explain-source', 5.15, acts['Explain'], cut_frames=88, blend_out=12)
# HandPoint is not used: in the app that clip only supplies finger rotations and the arm is solved by runtime IK
# to a real target, so as a full-body strip it would show the rest pose. Explain carries the motor line instead.
gesture('explain-motor', 8.35, acts['Explain'], cut_frames=84, blend_in=10, blend_out=14)
gesture('explain-working', 12.4, acts['Explain'], cut_frames=60, blend_out=12)
gesture('ack-close', 17.78, acts['Acknowledge'], blend_in=6)

# ---------------------------------------------------------------- face: mouth cues, warm smile, blinks
cues = json.loads(CUES.read_text(encoding='utf-8'))['cues'] if CUES.exists() else []


def mouth_at(t, blend=0.07):
    out = {}
    idx = -1
    for i, c in enumerate(cues):
        if c['at'] <= t:
            idx = i
        else:
            break
    if idx < 0:
        return out
    cur = cues[idx]
    if t > cur['end'] + blend:
        return out
    into = min(1.0, (t - cur['at']) / blend)
    for k, v in VISEMES.get(cur['shape'], {}).items():
        out[k] = out.get(k, 0) + v * into
    if into < 1 and idx > 0 and cues[idx - 1]['end'] >= cur['at'] - 1e-3:
        for k, v in VISEMES.get(cues[idx - 1]['shape'], {}).items():
            out[k] = out.get(k, 0) + v * (1 - into)
    return out


def blink_at(t):
    for b in BLINKS:
        u = (t - b) / 0.2
        if 0 <= u <= 1:
            return math.sin(math.pi * u) ** 1.5
    return 0.0


meshes = [o for o in scene.objects if o.type == 'MESH' and o.data.shape_keys]
frames = range(1, LAST + 1)
for o in meshes:
    kb = o.data.shape_keys.key_blocks
    for f in frames:
        t = 3.0 + (f - 1) / FPS
        m = mouth_at(t)
        speaking = bool(m)
        vals = {k: min(1.0, m.get(k, 0.0)) for k in MOUTH}
        vals['mouthSmileLeft'] = 0.22 if not speaking else 0.12
        vals['mouthSmileRight'] = 0.22 if not speaking else 0.12
        b = blink_at(t)
        vals['eyeBlinkLeft'] = b
        vals['eyeBlinkRight'] = b
        for name, v in vals.items():
            if name in kb:
                kb[name].value = v
                kb[name].keyframe_insert('value', frame=f)

# ---------------------------------------------------------------- camera, light, world
look = Vector((0.0, 0.0, 1.30))
cam = bpy.data.objects.new('kairo-cam', bpy.data.cameras.new('kairo-cam'))
scene.collection.objects.link(cam); scene.camera = cam
cam.data.lens = 54; cam.data.sensor_fit = 'VERTICAL'; cam.data.sensor_height = 24; cam.data.clip_start = 0.05
for f, x, d in [(1, 0.55, 2.55), (LAST, 0.62, 2.45)]:  # camera on her left: she faces screen-right
    cam.location = look + Vector((x, -d, 0.12))
    cam.rotation_euler = (look - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.keyframe_insert('location', frame=f); cam.keyframe_insert('rotation_euler', frame=f)

world = bpy.data.worlds.new('kairo-world'); scene.world = world; world.use_nodes = True
env = world.node_tree.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(str(HDR))
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.55
world.node_tree.links.new(env.outputs['Color'], world.node_tree.nodes['Background'].inputs['Color'])


def area(name, loc, energy, color, size):
    light = bpy.data.lights.new(name, 'AREA'); light.energy = energy; light.color = color; light.size = size
    ob = bpy.data.objects.new(name, light); scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (look - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()


area('key-warm', (1.6, -1.9, 2.2), 260, (1.0, 0.86, 0.72), 1.4)   # warm key on the side she faces
area('fill', (-1.4, -2.2, 1.4), 70, (0.95, 0.97, 1.0), 2.0)
area('rim-cool', (-1.2, 1.4, 2.0), 210, (0.70, 0.82, 1.0), 0.9)     # cool rim behind

scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.eevee.taa_render_samples = 16
scene.render.resolution_x = W; scene.render.resolution_y = H
scene.render.resolution_percentage = 50 if TEST else 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'AgX'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(HERE / 'blender/kairo-shot.blend'))

t0 = time.monotonic()
if TEST:
    for f in TEST:
        scene.frame_set(f)
        scene.render.filepath = str(HERE / f'build/test/kairo-{f:04d}.png')
        bpy.ops.render.render(write_still=True)
else:
    for a, b in RANGES:
        scene.frame_start, scene.frame_end = a, b
        scene.render.filepath = str(OUT / 'kairo-')
        bpy.ops.render.render(animation=True)
    (HERE / 'build/kairo-render.json').write_text(json.dumps({
        'ranges': RANGES, 'size': [W, H], 'fps': FPS, 'engine': scene.render.engine, 'taa_samples': 16,
        'render_seconds': round(time.monotonic() - t0, 1), 'blender': bpy.app.version_string,
        'source': 'design/video-production-20261023/kairo-render.glb (decoded copy of studio/public/models/character/kairo-teacher.glb)',
        'mouth': 'Rhubarb cues -> app VISEMES table', 'cues': len(cues)}, indent=1))
print('KAIRO_DONE', round(time.monotonic() - t0, 1))
