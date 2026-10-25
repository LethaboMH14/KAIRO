"""Exports the web teacher GLB from a Rain v3 (CC-BY 4.0, Blender Studio) derived .blend.

Blender-only rig features (CloudRig action constraints, B-bone face grid, head lattice, corrective smooth,
driven shape keys) do not survive glTF. This exporter therefore:
  1. rebuilds a clean 70-bone deformation skeleton with Unreal-style names (pelvis, spine_01, upperarm_l ...),
     copying the rest matrices of Rain's DEF bones;
  2. folds every other deform bone's weights into the nearest exported bone (face bones -> head);
  3. bakes facial expressions by posing Rain's own face controls and storing the fully evaluated face
     (armature + lattice + corrective smooth, optional subdivision) as morph targets;
  4. bakes the body corrective shape keys into morph targets the runtime drives from bone angles;
  5. splits the UDIM skin tiles into separate materials with 0-1 UVs.

Run: run-blender.ps1 -Script rain_export.py -BlendFile <teacher source .blend> -Out <dir> -Mode spike|full
Writes <Out>/kairo-teacher.raw.glb, <Out>/export-report.json and keeps nothing else.
"""
import json
import math
import sys
import time
from pathlib import Path

import bpy
from mathutils import Euler, Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
import teacher_clips  # noqa: E402

ARGS = sys.argv[sys.argv.index('--') + 1:]
OUT = Path(ARGS[0])
MODE = ARGS[1] if len(ARGS) > 1 else 'full'
OUT.mkdir(parents=True, exist_ok=True)
STARTED = time.time()

RIG = bpy.data.objects['RIG-rain']

# (export name, Rain source bone, export parent)
SKELETON = [
    ('pelvis', 'DEF-Pelvis', None),
    ('spine_01', 'DEF-Spine1', 'pelvis'),
    ('spine_02', 'DEF-Spine2', 'spine_01'),
    ('spine_03', 'DEF-Spine3', 'spine_02'),
    ('neck_01', 'DEF-Neck', 'spine_03'),
    ('head', 'DEF-Head', 'neck_01'),
    ('eye_l', 'DEF-Eye.L', 'head'),
    ('eye_r', 'DEF-Eye.R', 'head'),
]
for s, S in (('l', 'L'), ('r', 'R')):
    SKELETON += [
        (f'clavicle_{s}', f'DEF-Clavicle.{S}', 'spine_03'),
        (f'upperarm_{s}', f'DEF-Upperarm1.{S}', f'clavicle_{s}'),
        (f'upperarm_twist_01_{s}', f'DEF-Upperarm2.{S}', f'upperarm_{s}'),
        (f'lowerarm_{s}', f'DEF-Forearm1.{S}', f'upperarm_{s}'),
        (f'lowerarm_twist_01_{s}', f'DEF-Forearm2.{S}', f'lowerarm_{s}'),
        (f'hand_{s}', f'DEF-Hand.{S}', f'lowerarm_{s}'),
        (f'thumb_01_{s}', f'DEF-Thumb1.{S}', f'hand_{s}'),
        (f'thumb_02_{s}', f'DEF-Thumb2.{S}', f'thumb_01_{s}'),
        (f'thumb_03_{s}', f'DEF-Thumb3.{S}', f'thumb_02_{s}'),
    ]
    for finger, src in (('index', 'Index'), ('middle', 'Middle'), ('ring', 'Ring'), ('pinky', 'Pinky')):
        SKELETON += [
            (f'{finger}_metacarpal_{s}', f'DEF-{src}1.{S}', f'hand_{s}'),
            (f'{finger}_01_{s}', f'DEF-{src}2.{S}', f'{finger}_metacarpal_{s}'),
            (f'{finger}_02_{s}', f'DEF-{src}3.{S}', f'{finger}_01_{s}'),
            (f'{finger}_03_{s}', f'DEF-{src}4.{S}', f'{finger}_02_{s}'),
        ]
    SKELETON += [
        (f'thigh_{s}', f'DEF-Thigh1.{S}', 'pelvis'),
        (f'thigh_twist_01_{s}', f'DEF-Thigh2.{S}', f'thigh_{s}'),
        (f'calf_{s}', f'DEF-Shin1.{S}', f'thigh_{s}'),
        (f'calf_twist_01_{s}', f'DEF-Shin2.{S}', f'calf_{s}'),
        (f'foot_{s}', f'DEF-Foot.{S}', f'calf_{s}'),
        (f'ball_{s}', f'DEF-Toe.{S}', f'foot_{s}'),
    ]
# Spring chains authored by teacher_hair.py (driven by the runtime's secondary-motion springs).
SKELETON += [
    ('hair_back_01', 'DEF-KAIRO-HairBack1', 'head'),
    ('hair_back_02', 'DEF-KAIRO-HairBack2', 'hair_back_01'),
    ('hair_back_03', 'DEF-KAIRO-HairBack3', 'hair_back_02'),
    ('hair_side_l_01', 'DEF-KAIRO-HairSide.L1', 'head'),
    ('hair_side_l_02', 'DEF-KAIRO-HairSide.L2', 'hair_side_l_01'),
    ('hair_side_r_01', 'DEF-KAIRO-HairSide.R1', 'head'),
    ('hair_side_r_02', 'DEF-KAIRO-HairSide.R2', 'hair_side_r_01'),
]
SKELETON = [entry for entry in SKELETON if entry[1] in RIG.data.bones]
SRC_TO_EXPORT = {src: name for name, src, _ in SKELETON}

# Face shapes: ARKit-style names, each a list of (control bone, channel, axis, value) posed together.
# Values come from the control limits found by rain_face_probe.py (design/character/rig/face-probe.json).
def side(L, R):
    return L, R


def lr(name_l, name_r, recipe):
    out = {}
    for name, S in ((name_l, 'L'), (name_r, 'R')):
        out[name] = [(bone.replace('{S}', S), ch, ax, val) for bone, ch, ax, val in recipe]
    return out


FACE_SHAPES = {}
FACE_SHAPES.update(lr('eyeBlinkLeft', 'eyeBlinkRight', [('ACT-Eyelid_Upper.{S}', 'loc', 1, -0.040), ('ACT-Eyelid_Lower.{S}', 'loc', 1, 0.004)]))
FACE_SHAPES.update(lr('eyeWideLeft', 'eyeWideRight', [('ACT-Eyelid_Upper.{S}', 'loc', 1, 0.016)]))
FACE_SHAPES.update(lr('eyeSquintLeft', 'eyeSquintRight', [('ACT-Eyelid_Lower.{S}', 'loc', 1, 0.012), ('ACT-Eyering_Lower.{S}', 'loc', 1, 0.0055)]))
FACE_SHAPES.update(lr('browDownLeft', 'browDownRight', [('MSTR-Eyebrow.{S}', 'loc', 1, -0.0085)]))
FACE_SHAPES.update(lr('browOuterUpLeft', 'browOuterUpRight', [('MSTR-Eyebrow.{S}', 'loc', 1, 0.004), ('MSTR-Eyebrow.{S}', 'rot', 2, 0.22)]))
FACE_SHAPES.update(lr('browInnerUpLeft', 'browInnerUpRight', [('MSTR-Eyebrow.{S}', 'loc', 1, 0.006), ('MSTR-Eyebrow.{S}', 'rot', 2, -0.22)]))
FACE_SHAPES.update(lr('mouthSmileLeft', 'mouthSmileRight', [('ACT-Lips_Corner.{S}', 'loc', 1, 0.026), ('ACT-Lips_Corner.{S}', 'loc', 2, 0.012), ('ACT-Cheek_Outer.{S}', 'loc', 1, 0.022)]))
FACE_SHAPES.update(lr('mouthFrownLeft', 'mouthFrownRight', [('ACT-Lips_Corner.{S}', 'loc', 1, -0.016)]))
FACE_SHAPES.update(lr('mouthStretchLeft', 'mouthStretchRight', [('ACT-Lips_Corner.{S}', 'loc', 2, 0.04)]))
FACE_SHAPES.update(lr('cheekSquintLeft', 'cheekSquintRight', [('ACT-Eyering_Lower.{S}', 'loc', 1, 0.0078), ('ACT-Cheek_Outer.{S}', 'loc', 1, 0.03)]))
FACE_SHAPES.update(lr('noseSneerLeft', 'noseSneerRight', [('ACT-Sneer.{S}', 'loc', 1, 0.02), ('ACT-Cheek_Inner.{S}', 'loc', 1, 0.012)]))
FACE_SHAPES.update({
    'jawOpen': [('MSTR-Jaw', 'rot', 0, 0.40)],
    'mouthUpperUp': [('MSTR-UpperLip', 'loc', 1, 0.0085)],
    'mouthLowerDown': [('MSTR-LowerLip', 'loc', 1, -0.0085)],
    'mouthPucker': [('ACT-Lips_Corner.L', 'loc', 2, -0.015), ('ACT-Lips_Corner.R', 'loc', 2, -0.015), ('MSTR-Mouth', 'loc', 2, -0.006)],
    'mouthFunnel': [('ACT-Lips_Corner.L', 'loc', 2, -0.012), ('ACT-Lips_Corner.R', 'loc', 2, -0.012), ('MSTR-Jaw', 'rot', 0, 0.10), ('ACT-Lip_Roll_Upper', 'rot', 0, -0.6), ('ACT-Lip_Roll_Lower', 'rot', 0, -0.6)],
    'mouthRollUpper': [('ACT-Lip_Roll_Upper', 'rot', 0, 1.0)],
    'mouthRollLower': [('ACT-Lip_Roll_Lower', 'rot', 0, 1.0)],
    'mouthPress': [('ACT-Lip_Roll_Upper', 'rot', 0, 0.35), ('ACT-Lip_Roll_Lower', 'rot', 0, 0.35), ('MSTR-Jaw', 'rot', 0, -0.05)],
    'cheekPuff': [('SK-Cheek_Puff.L', 'loc', 1, 0.02), ('SK-Cheek_Puff.R', 'loc', 1, 0.02)],
})
SPIKE_SHAPES = ['eyeBlinkLeft', 'eyeBlinkRight', 'browInnerUpLeft', 'browInnerUpRight', 'mouthSmileLeft', 'mouthSmileRight', 'jawOpen', 'mouthUpperUp', 'mouthPucker']

# Only correctives on skin that stays visible outside the clothing are exported (driven by the runtime).
CORRECTIVE_PREFIXES = ('Finger', 'XZ_Wrist', 'FingerBends')

FACE_MESHES = {'GEO-rain-head', 'GEO-rain-eyelashes', 'GEO-rain-eyebrows', 'GEO-rain-gums_lower', 'GEO-rain-gums_upper', 'GEO-rain-tongue'}
# Source mesh -> (subdivision level baked into the export, export name)
MESHES = {
    'GEO-rain-head': (1, 'Teacher_Head'),
    'GEO-rain-body': (1, 'Teacher_Body'),
    'GEO-rain-eyes': (1, 'Teacher_Eyes'),
    'GEO-rain-eyebrows': (1, 'Teacher_Brows'),
    'GEO-rain-eyelashes': (1, 'Teacher_Lashes'),
    'GEO-rain-gums_upper': (0, 'Teacher_TeethUpper'),
    'GEO-rain-gums_lower': (0, 'Teacher_TeethLower'),
    'GEO-rain-tongue': (0, 'Teacher_Tongue'),
}
EXTRA_SOURCES = [o.name for o in bpy.data.objects if o.get('kairo_export')]  # authored hair/clothes carry this property
for name in EXTRA_SOURCES:
    MESHES[name] = (int(bpy.data.objects[name].get('kairo_subsurf', 0)), bpy.data.objects[name]['kairo_export'])


def log(*parts):
    print('[rain_export %.1fs]' % (time.time() - STARTED), *parts, flush=True)


# --------------------------------------------------------------------------------------------- pose helpers
def reset_pose():
    for pb in RIG.pose.bones:
        pb.location = (0, 0, 0)
        pb.scale = (1, 1, 1)
        if pb.rotation_mode == 'QUATERNION':
            pb.rotation_quaternion = (1, 0, 0, 0)
        elif pb.rotation_mode == 'AXIS_ANGLE':
            pb.rotation_axis_angle = (0, 0, 1, 0)
        else:
            pb.rotation_euler = (0, 0, 0)


def apply_recipe(recipe, weight=1.0):
    for bone, channel, axis, value in recipe:
        pb = RIG.pose.bones[bone]
        if channel == 'loc':
            loc = list(pb.location)
            loc[axis] += value * weight
            pb.location = loc
        else:
            e = Euler((0, 0, 0), 'XYZ')
            e[axis] = value * weight
            if pb.rotation_mode == 'QUATERNION':
                pb.rotation_quaternion = pb.rotation_quaternion @ e.to_quaternion()
            elif pb.rotation_mode == 'AXIS_ANGLE':
                q = e.to_quaternion()
                ax, ang = q.to_axis_angle()
                pb.rotation_axis_angle = (ang, *ax)
            else:
                r = pb.rotation_euler.copy()
                r[axis] += value * weight
                pb.rotation_euler = r


def set_subsurf(obj, level):
    # Rain drives subdivision levels from its "Quality" property; mute that so the export level sticks.
    if obj.animation_data:
        for drv in obj.animation_data.drivers:
            if drv.data_path.startswith('modifiers["Subdivision"]'):
                drv.mute = True
    for mod in obj.modifiers:
        if mod.type == 'SUBSURF':
            mod.levels = level
            mod.show_viewport = level > 0


def evaluated_world_coords(obj):
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(deps)
    mesh = ev.to_mesh()
    mw = ev.matrix_world
    coords = [mw @ v.co for v in mesh.vertices]
    ev.to_mesh_clear()
    return coords


# --------------------------------------------------------------------------------------------- skeleton
def build_armature():
    data = bpy.data.armatures.new('KAIRO_Teacher_Rig')
    arm = bpy.data.objects.new('KAIRO_Teacher_Rig', data)
    bpy.context.scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    for name, src, parent in SKELETON:
        sb = RIG.data.bones[src]
        eb = data.edit_bones.new(name)
        eb.head = RIG.matrix_world @ sb.head_local
        eb.tail = RIG.matrix_world @ sb.tail_local
        # Copy roll by aligning the edit bone's Z axis with the source bone's Z axis.
        z_axis = (RIG.matrix_world.to_3x3() @ sb.matrix_local.to_3x3()).col[2]
        eb.align_roll(z_axis)
        eb.use_deform = True
        if parent:
            eb.parent = data.edit_bones[parent]
            eb.use_connect = False
    bpy.ops.object.mode_set(mode='OBJECT')
    return arm


def bone_weight_map():
    """Every Rain deform bone -> the export bone that receives its weights."""
    segs = {}
    for name, src, _ in SKELETON:
        b = RIG.data.bones[src]
        segs[name] = (RIG.matrix_world @ b.head_local, RIG.matrix_world @ b.tail_local)
    mapping = {}
    for b in RIG.data.bones:
        if not b.use_deform:
            continue
        if b.name in SRC_TO_EXPORT:
            mapping[b.name] = SRC_TO_EXPORT[b.name]
            continue
        head = RIG.matrix_world @ b.head_local
        mid = (head + RIG.matrix_world @ b.tail_local) / 2
        if mid.z > 1.36 and abs(mid.x) < 0.13:
            mapping[b.name] = 'head'
            continue
        suffix = '_l' if b.name.endswith('.L') else '_r' if b.name.endswith('.R') else None
        best, best_d = None, 1e9
        for name, (h, t) in segs.items():
            if name.startswith('eye_'):
                continue
            if suffix and (name.endswith('_l') or name.endswith('_r')) and not name.endswith(suffix):
                continue
            d = (mid - closest_on_segment(mid, h, t)).length
            if d < best_d:
                best, best_d = name, d
        mapping[b.name] = best
    return mapping


def closest_on_segment(p, a, b):
    ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-12)))
    return a + ab * t


# --------------------------------------------------------------------------------------------- meshes
def export_copy(src, level, export_name, weight_map, arm, report):
    set_subsurf(src, level)
    for mod in src.modifiers:
        if mod.type == 'ARMATURE':
            mod.show_viewport = True
    reset_pose()
    bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get()
    ev = src.evaluated_get(deps)
    mesh = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=deps)
    mesh.name = export_name
    mesh.transform(src.matrix_world)
    keep_colour = 'Hair' in export_name
    # Remove by name with a fresh lookup each time: removing through references taken before the first removal
    # deletes the wrong layers (on the head and body it removed UVMap instead of SSS, so the GLB lost its skin UVs).
    for name in [a.name for a in mesh.color_attributes]:
        if keep_colour and name == 'Col':
            continue
        attr = mesh.color_attributes.get(name)
        if attr is not None:
            mesh.color_attributes.remove(attr)
    if mesh.uv_layers:
        mesh.uv_layers.active_index = 0
        mesh.uv_layers[0].active_render = True
    obj = bpy.data.objects.new(export_name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    # The copied deform layer still indexes the source's vertex groups: recreate them in the same order so the
    # indices are valid, read and merge the weights, then clear every group (which also clears the old entries).
    src_names = [vg.name for vg in src.vertex_groups]
    for name in src_names:
        obj.vertex_groups.new(name=name)
    per_vertex = []
    for v in mesh.vertices:
        acc = {}
        for g in v.groups:
            if g.group >= len(src_names) or g.weight <= 0.0:
                continue
            target = weight_map.get(src_names[g.group])
            if target:
                acc[target] = acc.get(target, 0.0) + g.weight
        per_vertex.append(acc)
    obj.vertex_groups.clear()
    groups = {}
    unweighted = 0
    for idx, acc in enumerate(per_vertex):
        if not acc:
            unweighted += 1
            acc = {nearest_bone_for_vertex(mesh.vertices[idx].co, arm): 1.0}
        top = sorted(acc.items(), key=lambda kv: -kv[1])[:4]
        total = sum(w for _, w in top) or 1.0
        for name, w in top:
            vg = groups.get(name) or obj.vertex_groups.new(name=name)
            groups[name] = vg
            vg.add([idx], w / total, 'REPLACE')
    obj.parent = arm
    mod = obj.modifiers.new('Armature', 'ARMATURE')
    mod.object = arm
    report['meshes'][export_name] = {'source': src.name, 'subdivision': level, 'vertices': len(mesh.vertices),
                                     'uvMaps': [uv.name for uv in mesh.uv_layers],
                                     'triangles': sum(len(p.vertices) - 2 for p in mesh.polygons), 'unweighted_fixed': unweighted,
                                     'bones_used': sorted(groups.keys())}
    return obj


_SEG_CACHE = {}


def nearest_bone_for_vertex(co, arm):
    if not _SEG_CACHE:
        for b in arm.data.bones:
            _SEG_CACHE[b.name] = (arm.matrix_world @ b.head_local, arm.matrix_world @ b.tail_local)
    best, best_d = 'pelvis', 1e9
    for name, (h, t) in _SEG_CACHE.items():
        d = (co - closest_on_segment(co, h, t)).length
        if d < best_d:
            best, best_d = name, d
    return best


def bake_face_shapes(pairs, shape_names, report):
    """pairs: list of (source object, export object) sharing vertex order."""
    for src, dst in pairs:
        dst.shape_key_add(name='Basis', from_mix=False)
    reset_pose()
    neutral = {src.name: evaluated_world_coords(src) for src, _ in pairs}
    for shape in shape_names:
        reset_pose()
        apply_recipe(FACE_SHAPES[shape])
        moved = {}
        for src, dst in pairs:
            coords = evaluated_world_coords(src)
            base = neutral[src.name]
            if len(coords) != len(dst.data.vertices):
                raise RuntimeError(f'vertex count changed for {src.name} in {shape}')
            mx = max((a - b).length for a, b in zip(coords, base)) if coords else 0.0
            moved[dst.name] = round(mx * 1000, 2)
            if mx < 1e-5:
                continue
            key = dst.shape_key_add(name=shape, from_mix=False)
            basis = dst.data.shape_keys.key_blocks['Basis'].data
            for i, (a, b) in enumerate(zip(coords, base)):
                key.data[i].co = basis[i].co + (a - b)
        report['face_shapes'][shape] = moved
    reset_pose()
    for _, dst in pairs:
        if dst.data.shape_keys and len(dst.data.shape_keys.key_blocks) == 1:
            dst.shape_key_clear()


def bake_body_correctives(src, dst, report):
    """Transfers driven corrective shape keys (evaluated through the modifier stack) as morph targets."""
    keys = src.data.shape_keys
    if not keys:
        return
    names = [k.name for k in keys.key_blocks[1:] if not k.name.endswith('_bkp') and k.name.startswith(CORRECTIVE_PREFIXES)]
    saved = {k.name: k.value for k in keys.key_blocks}
    if keys.animation_data:
        for d in keys.animation_data.drivers:
            d.mute = True
    for k in keys.key_blocks[1:]:
        k.value = 0.0
    reset_pose()
    base = evaluated_world_coords(src)
    if not dst.data.shape_keys:
        dst.shape_key_add(name='Basis', from_mix=False)
    basis = dst.data.shape_keys.key_blocks['Basis'].data
    for name in names:
        keys.key_blocks[name].value = 1.0
        coords = evaluated_world_coords(src)
        keys.key_blocks[name].value = 0.0
        mx = max((a - b).length for a, b in zip(coords, base))
        if mx < 2e-4:
            continue
        key = dst.shape_key_add(name='cor_' + name, from_mix=False)
        for i, (a, b) in enumerate(zip(coords, base)):
            key.data[i].co = basis[i].co + (a - b)
        report['correctives'].setdefault(dst.name, {})[name] = round(mx * 1000, 2)
    if keys.animation_data:
        for d in keys.animation_data.drivers:
            d.mute = False
    for k in keys.key_blocks:
        k.value = saved.get(k.name, k.value)


# --------------------------------------------------------------------------------------------- materials / UV tiles
def split_udim_tiles(obj, tile_materials, report):
    """Moves faces whose UVs sit in UDIM tile k into material tile_materials[k] and shifts their UVs to 0-1."""
    mesh = obj.data
    uv = mesh.uv_layers.active.data if mesh.uv_layers else None
    if uv is None:
        return
    slots = {}
    mesh.materials.clear()
    counts = {}
    for poly in mesh.polygons:
        u = sum(uv[i].uv.x for i in poly.loop_indices) / poly.loop_total
        tile = int(math.floor(u))
        mat = tile_materials.get(tile, tile_materials.get('default'))
        if mat.name not in slots:
            mesh.materials.append(mat)
            slots[mat.name] = len(mesh.materials) - 1
        poly.material_index = slots[mat.name]
        for i in poly.loop_indices:
            uv[i].uv.x -= tile
        counts[tile] = counts.get(tile, 0) + 1
    report['uv_tiles'][obj.name] = counts


def principled(name, color=(0.8, 0.8, 0.8), image=None, roughness=0.5, metallic=0.0, coat=0.0, alpha_image=False):
    existing = bpy.data.materials.get(name)
    if existing is not None:
        existing.name = name + '.source'      # keep the Blender review material; the export gets the clean name
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    if coat:
        bsdf.inputs['Coat Weight'].default_value = coat
        bsdf.inputs['Coat Roughness'].default_value = 0.05
    if image is not None:
        tex = nt.nodes.new('ShaderNodeTexImage')
        tex.image = image
        nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
        if alpha_image:
            nt.links.new(tex.outputs['Alpha'], bsdf.inputs['Alpha'])
            mat.blend_method = 'HASHED'
    return mat


def load_image(path):
    img = bpy.data.images.load(str(path), check_existing=True)
    return img


# --------------------------------------------------------------------------------------------- pose review
def render_pose_sheet(arm, exported, report):
    """Workbench renders of each clip's key poses (front and side) using the exported skeleton and meshes."""
    import math as _m
    scene = bpy.context.scene
    for obj in bpy.data.objects:
        if obj.type == 'MESH' and obj not in exported.values():
            obj.hide_render = True
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'STUDIO'
    scene.display.shading.color_type = 'MATERIAL'
    scene.render.resolution_x, scene.render.resolution_y = 360, 540
    cam = bpy.data.objects.new('PoseCam', bpy.data.cameras.new('PoseCam'))
    scene.collection.objects.link(cam)
    scene.camera = cam
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = 1.95
    look = Vector((0, 0, 0.92))
    out = OUT / 'poses'
    out.mkdir(exist_ok=True)
    shots = []
    for track in arm.animation_data.nla_tracks:
        action = track.strips[0].action
        arm.animation_data.action = action
        frames = sorted({int(action.frame_range[0]), int((action.frame_range[0] + action.frame_range[1]) / 2)})
        for frame in frames:
            scene.frame_set(frame)
            for view, yaw in (('front', 0.0), ('side', 90.0), ('back', 180.0), ('backq', 140.0)):
                a = _m.radians(yaw)
                cam.location = look + Vector((_m.sin(a) * 4, -_m.cos(a) * 4, 0.1))
                cam.rotation_euler = (look - cam.location).to_track_quat('-Z', 'Y').to_euler()
                path = out / f'{action.name}_{frame:03d}_{view}.png'
                scene.render.filepath = str(path)
                bpy.ops.render.render(write_still=True)
                shots.append(path.name)
    arm.animation_data.action = None
    report['poseShots'] = shots


# --------------------------------------------------------------------------------------------- main
def main():
    report = {'mode': MODE, 'source': bpy.data.filepath, 'skeleton': [n for n, _, _ in SKELETON], 'meshes': {}, 'face_shapes': {},
              'correctives': {}, 'uv_tiles': {}}
    web = Path(__file__).resolve().parent.parent / 'textures' / 'web'
    rain_tex = Path(bpy.data.filepath).parent / 'textures'

    def tex(key, default_name):
        candidate = web / f'{key}.png'
        return load_image(candidate if candidate.exists() else rain_tex / default_name)

    reset_pose()
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            for mod in obj.modifiers:
                if mod.type == 'SUBSURF':
                    mod.show_viewport = False
    arm = build_armature()
    weight_map = bone_weight_map()
    report['weight_map_sample'] = {k: v for k, v in list(weight_map.items())[:40]}

    exported = {}
    for src_name, (level, export_name) in MESHES.items():
        src = bpy.data.objects.get(src_name)
        if src is None:
            continue
        exported[src_name] = export_copy(src, level, export_name, weight_map, arm, report)
        log('mesh', export_name, report['meshes'][export_name]['vertices'])

    shapes = SPIKE_SHAPES if MODE == 'spike' else ([] if MODE == 'poses' else list(FACE_SHAPES.keys()))
    face_pairs = [(bpy.data.objects[s], exported[s]) for s in exported if s in FACE_MESHES]
    # Subdivision levels must match between the export copy and the evaluated source.
    for src, _ in face_pairs:
        set_subsurf(src, MESHES[src.name][0])
    bake_face_shapes(face_pairs, shapes, report)
    log('face shapes', len(shapes))
    if MODE == 'full' and 'GEO-rain-body' in exported:
        set_subsurf(bpy.data.objects['GEO-rain-body'], MESHES['GEO-rain-body'][0])
        bake_body_correctives(bpy.data.objects['GEO-rain-body'], exported['GEO-rain-body'], report)
        log('body correctives', len(report['correctives'].get('Teacher_Body', {})))

    # Materials: the source already carries KAIRO materials per mesh (build_teacher.py split Rain's UDIM skin into
    # head/body/hands with 0-1 UVs). Swap texture-bearing ones for web-sized copies; keep the simple ones.
    swaps = {
        'KAIRO_Skin_Head': principled('KAIRO_Skin_Head', image=tex('skin_head', 'TEX-rain_body_diffuse.1003.png'), roughness=0.5),
        'KAIRO_Skin_Body': principled('KAIRO_Skin_Body', image=tex('skin_body', 'TEX-rain_body_diffuse.1001.png'), roughness=0.55),
        'KAIRO_Skin_Hands': principled('KAIRO_Skin_Hands', image=tex('skin_hands', 'TEX-rain_body_diffuse.1002.png'), roughness=0.52),
        'KAIRO_Eyes': principled('KAIRO_Eyes', image=tex('eyes', 'TEX-rain_eyes.png'), roughness=0.3, coat=0.6),
    }
    for src_name, obj in exported.items():
        mats = obj.data.materials
        for i, mat in enumerate(mats):
            if mat is None:
                continue
            base = mat.name.split('.')[0]
            if base in swaps and mat is not swaps[base]:
                mats[i] = swaps[base]
        report['uv_tiles'][obj.name] = sorted({int(math.floor(l.uv.x)) for l in obj.data.uv_layers.active.data}) if obj.data.uv_layers else []

    # Teaching clips (KAIRO-authored, teacher_clips.py) on the export skeleton.
    if MODE in ('full', 'poses'):
        bpy.context.scene.render.fps = teacher_clips.FPS
        bpy.context.scene.render.fps_base = 1.0
        # Rain's face-rig actions drive action constraints in Blender only; they must not become glTF clips.
        for action in list(bpy.data.actions):
            bpy.data.actions.remove(action)
        report['clips'] = teacher_clips.author_clips(arm)
    if MODE == 'poses':
        render_pose_sheet(arm, exported, report)
        (OUT / 'export-report.json').write_text(json.dumps(report, indent=1, default=str), encoding='utf8')
        log('POSES_DONE')
        return

    # Export
    for obj in bpy.context.scene.objects:
        obj.select_set(False)
    arm.select_set(True)
    for obj in exported.values():
        obj.select_set(True)
    bpy.context.view_layer.objects.active = arm
    target = OUT / 'kairo-teacher.raw.glb'
    bpy.ops.export_scene.gltf(
        filepath=str(target), export_format='GLB', use_selection=True,
        export_skins=True, export_influence_nb=4, export_all_influences=False,
        export_morph=True, export_morph_normal=True, export_morph_tangent=False, export_try_sparse_sk=True,
        export_animations=MODE == 'full', export_animation_mode='ACTIONS', export_force_sampling=True, export_frame_step=1,
        export_optimize_animation_size=True, export_anim_single_armature=True, export_reset_pose_bones=True,
        export_anim_slide_to_zero=True, export_bake_animation=False,
        export_vertex_color='MATERIAL', export_all_vertex_colors=False, export_active_vertex_color_when_no_material=False,
        export_apply=False, export_yup=True, export_texcoords=True, export_normals=True,
        export_tangents=False, export_materials='EXPORT', export_image_format='AUTO', export_extras=False,
        export_def_bones=False)
    report['glb_bytes'] = target.stat().st_size
    report['seconds'] = round(time.time() - STARTED, 1)
    (OUT / 'export-report.json').write_text(json.dumps(report, indent=1, default=str), encoding='utf8')
    log('EXPORT_DONE', target, report['glb_bytes'])


main()
