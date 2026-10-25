"""Builds the editable KAIRO teacher source from Rain v3 (Blender Studio, CC-BY 4.0).

  run-blender.ps1 -Script build_teacher.py -BlendFile <extracted Rain v3.3/rain_v3.2.blend> -Out design/character/blender -Mode build

Stages (each a function below, all deterministic):
  1. identity   - landmark-anchored deformation fields: fuller lips, broader softer nose, lifted cheekbones,
                  slightly longer adult chin/jaw; a gentle adult figure (bust/hips). Fields are evaluated at each
                  vertex's basis position and added to every shape key, so Rain's rig expressions carry over.
  2. materials  - KAIRO skin (recoloured textures), brown eyes, dark brows/lashes, teeth, gums.
  3. wardrobe   - remove Rain's hair, hairband, scarf; hair and clothes are authored by teacher_hair.py and
                  teacher_wardrobe.py (run as later stages on the saved file).
The result is saved as kairo_teacher.blend next to this script, with image paths relative to design/character.
"""
import json
import shutil
import sys
from pathlib import Path

import bpy
import numpy as np

ARGS = sys.argv[sys.argv.index('--') + 1:]
OUT = Path(ARGS[0]).resolve()
MODE = ARGS[1] if len(ARGS) > 1 else 'build'
HERE = Path(__file__).resolve().parent
CHARACTER = HERE.parent
TEXTURES = CHARACTER / 'textures'
RAIN_TEXTURES = Path(bpy.data.filepath).parent / 'textures'

# ------------------------------------------------------------------------------------------------ 1. identity
# (centre, radii, displacement) in world metres for the character's LEFT side (+X); mirrored automatically when
# the centre is off-axis. Rain faces -Y; +Z is up. Landmarks come from Rain's DEF face bones (rig/landmarks.json).
FACE_FIELDS = [
    # Fuller lips: upper lip forward and a touch up, lower lip forward and down, corners slightly wider.
    ((0.0, -0.156, 1.396), (0.030, 0.020, 0.010), (0.0, -0.0022, 0.0012)),
    ((0.0, -0.149, 1.380), (0.026, 0.020, 0.010), (0.0, -0.0025, -0.0013)),
    ((0.028, -0.132, 1.388), (0.012, 0.015, 0.010), (0.0022, 0.0, 0.0)),
    # Broader alae and a softer, rounder nose tip.
    ((0.022, -0.142, 1.423), (0.014, 0.020, 0.012), (0.0032, 0.0005, 0.0)),
    ((0.0, -0.170, 1.430), (0.012, 0.012, 0.012), (0.0, 0.0015, -0.0008)),
    # Lifted, fuller cheekbones.
    ((0.072, -0.118, 1.452), (0.022, 0.022, 0.018), (0.0018, -0.0028, 0.0015)),
    # Longer adult chin and lower face, a gently narrower jaw and slimmer lower cheeks.
    ((0.0, -0.135, 1.360), (0.035, 0.040, 0.020), (0.0, -0.0012, -0.0055)),
    ((0.050, -0.100, 1.370), (0.030, 0.040, 0.025), (0.0, 0.0, -0.0020)),
    ((0.080, -0.070, 1.390), (0.025, 0.030, 0.025), (-0.0020, 0.0, 0.0)),
    ((0.065, -0.100, 1.405), (0.025, 0.030, 0.022), (-0.0018, 0.0006, 0.0)),
    ((0.085, -0.080, 1.430), (0.030, 0.050, 0.040), (-0.0025, 0.0, 0.0)),
]
# Brows: thinner (vertical spread around each column's centre line), a soft arch peaking two-thirds out.
BROW_THIN = 0.68
BROW_ARCH = (0.050, 0.018, 0.0020)  # (x of peak, width, lift) in metres
BODY_FIELDS = [
    # Fuller bust and hips for an adult figure; small enough that Rain's skinning still holds.
    ((0.048, -0.085, 1.160), (0.050, 0.040, 0.050), (0.0015, -0.0060, 0.0)),
    ((0.120, 0.000, 0.860), (0.060, 0.080, 0.080), (0.0050, 0.0, 0.0)),
    ((0.090, 0.020, 0.800), (0.060, 0.060, 0.080), (0.0020, 0.0050, 0.0)),
    # Glutes: more rounded volume backwards, a little lower, with a soft fold into the thighs.
    ((0.062, 0.070, 0.815), (0.060, 0.055, 0.070), (0.0035, 0.0170, -0.0030)),
    ((0.068, 0.062, 0.748), (0.058, 0.050, 0.032), (0.0010, 0.0060, 0.0)),
]
FACE_OBJECTS = ['GEO-rain-head', 'GEO-rain-eyebrows', 'GEO-rain-eyelashes', 'GEO-rain-gums_upper', 'GEO-rain-gums_lower', 'GEO-rain-tongue']
BODY_OBJECTS = ['GEO-rain-body', 'GEO-rain-body_nomask', 'GEO-rain-top', 'GEO-rain-jeans']


def expand(fields):
    out = []
    for c, r, d in fields:
        out.append((np.array(c), np.array(r), np.array(d)))
        if abs(c[0]) > 1e-6:
            out.append((np.array((-c[0], c[1], c[2])), np.array(r), np.array((-d[0], d[1], d[2]))))
    return out


def field_displacement(points, fields):
    disp = np.zeros_like(points)
    for c, r, d in fields:
        q = (points - c) / r
        w = np.exp(-0.5 * (q * q).sum(axis=1))
        disp += w[:, None] * d
    return disp


def warp_object(obj, fields):
    mesh = obj.data
    mw = np.array(obj.matrix_world)
    inv = np.linalg.inv(mw)
    n = len(mesh.vertices)
    if n == 0:
        return 0.0

    def to_world(local):
        return local @ mw[:3, :3].T + mw[:3, 3]

    def to_local(world):
        return world @ inv[:3, :3].T + inv[:3, 3]

    keys = mesh.shape_keys.key_blocks if mesh.shape_keys else None
    basis = np.zeros(n * 3)
    if keys:
        keys[0].data.foreach_get('co', basis)
    else:
        mesh.vertices.foreach_get('co', basis)
    basis = basis.reshape(n, 3)
    world_basis = to_world(basis)
    disp_world = field_displacement(world_basis, fields)
    disp_local = to_local(world_basis + disp_world) - basis
    if keys:
        buf = np.zeros(n * 3)
        for kb in keys:
            kb.data.foreach_get('co', buf)
            kb.data.foreach_set('co', (buf.reshape(n, 3) + disp_local).ravel())
    mesh.vertices.foreach_get('co', buf := np.zeros(n * 3))
    mesh.vertices.foreach_set('co', (buf.reshape(n, 3) + disp_local).ravel())
    mesh.update()
    return float(np.abs(disp_world).max())


def reshape_brows(report):
    """Thins the brow mesh vertically about its own centre line and adds a gentle arch (world space, half mesh)."""
    obj = bpy.data.objects.get('GEO-rain-eyebrows')
    if obj is None:
        return
    mesh = obj.data
    n = len(mesh.vertices)
    mw = np.array(obj.matrix_world)
    inv = np.linalg.inv(mw)
    co = np.zeros(n * 3)
    mesh.vertices.foreach_get('co', co)
    co = co.reshape(n, 3)
    world = co @ mw[:3, :3].T + mw[:3, 3]
    ax = np.abs(world[:, 0])
    bins = np.round(ax / 0.004).astype(int)
    centre = np.zeros(n)
    for b in np.unique(bins):
        sel = bins == b
        centre[sel] = world[sel, 2].mean()
    world[:, 2] = centre + (world[:, 2] - centre) * BROW_THIN
    peak, width, lift = BROW_ARCH
    world[:, 2] += lift * np.exp(-0.5 * ((ax - peak) / width) ** 2)
    local = world @ inv[:3, :3].T + inv[:3, 3]
    mesh.vertices.foreach_set('co', local.ravel())
    mesh.update()
    report['brows'] = {'thin': BROW_THIN, 'arch': BROW_ARCH}


def stage_identity(report):
    reshape_brows(report)
    face, body = expand(FACE_FIELDS), expand(BODY_FIELDS)
    moved = {}
    for name in FACE_OBJECTS:
        obj = bpy.data.objects.get(name)
        if obj:
            moved[name] = round(warp_object(obj, face) * 1000, 2)
    for name in BODY_OBJECTS:
        obj = bpy.data.objects.get(name)
        if obj:
            moved[name] = round(warp_object(obj, body) * 1000, 2)
    report['identityMaxDisplacementMm'] = moved
    report['faceFields'] = FACE_FIELDS
    report['bodyFields'] = BODY_FIELDS


# ------------------------------------------------------------------------------------------------ 2. materials
def image(path):
    img = bpy.data.images.load(str(path), check_existing=True)
    return img


def new_principled(name, base=None, color=(0.8, 0.8, 0.8), roughness=0.5, rough_image=None, sss=0.0, coat=0.0, coat_rough=0.05, sheen=0.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Roughness'].default_value = roughness
    if base is not None:
        tex = nt.nodes.new('ShaderNodeTexImage')
        tex.image = base
        nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    if rough_image is not None:
        rt = nt.nodes.new('ShaderNodeTexImage')
        rt.image = rough_image
        rt.image.colorspace_settings.name = 'Non-Color'
        nt.links.new(rt.outputs['Color'], bsdf.inputs['Roughness'])
    if sss:
        bsdf.inputs['Subsurface Weight'].default_value = sss
        bsdf.inputs['Subsurface Radius'].default_value = (1.0, 0.4, 0.25)
        bsdf.inputs['Subsurface Scale'].default_value = 0.006
    if coat:
        bsdf.inputs['Coat Weight'].default_value = coat
        bsdf.inputs['Coat Roughness'].default_value = coat_rough
    if sheen:
        bsdf.inputs['Sheen Weight'].default_value = sheen
        bsdf.inputs['Sheen Roughness'].default_value = 0.6
    return mat


def assign(obj_name, mats_by_index):
    obj = bpy.data.objects.get(obj_name)
    if not obj:
        return
    obj.data.materials.clear()
    for m in mats_by_index:
        obj.data.materials.append(m)


def stage_materials(report):
    head_img, body_img, hands_img = image(TEXTURES / 'skin_head.png'), image(TEXTURES / 'skin_body.png'), image(TEXTURES / 'skin_hands.png')
    # Rain's skin is one UDIM material; give the head/body/hands their own materials and 0-1 UVs.
    head_mat = new_principled('KAIRO_Skin_Head', head_img, roughness=0.5, sss=0.04)
    body_mat = new_principled('KAIRO_Skin_Body', body_img, roughness=0.55, sss=0.04)
    hands_mat = new_principled('KAIRO_Skin_Hands', hands_img, roughness=0.52, sss=0.04)
    for name, tiles in (('GEO-rain-head', {2: head_mat}), ('GEO-rain-body', {0: body_mat, 1: hands_mat}), ('GEO-rain-body_nomask', {0: body_mat, 1: hands_mat})):
        obj = bpy.data.objects.get(name)
        if obj is None:
            continue
        mesh = obj.data
        uv = mesh.uv_layers.active.data
        mesh.materials.clear()
        order = []
        for tile, mat in sorted(tiles.items()):
            mesh.materials.append(mat)
            order.append(tile)
        for poly in mesh.polygons:
            u = sum(uv[i].uv.x for i in poly.loop_indices) / poly.loop_total
            tile = int(u // 1)
            slot = order.index(tile) if tile in order else 0
            poly.material_index = slot
            for i in poly.loop_indices:
                uv[i].uv.x -= tile
    eyes = new_principled('KAIRO_Eyes', image(TEXTURES / 'eyes.png'), roughness=0.3, coat=0.6, coat_rough=0.06)
    assign('GEO-rain-eyes', [eyes])
    brows = new_principled('KAIRO_Brows', color=(0.012, 0.008, 0.006), roughness=0.92)
    brows.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = 0.15
    lashes = new_principled('KAIRO_Lashes', color=(0.005, 0.004, 0.003), roughness=0.85)
    lashes.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = 0.2
    assign('GEO-rain-eyebrows', [brows])
    assign('GEO-rain-eyelashes', [lashes])
    gums = new_principled('KAIRO_Gums', color=(0.36, 0.12, 0.11), roughness=0.45, sss=0.2)
    teeth = new_principled('KAIRO_Teeth', color=(0.84, 0.81, 0.74), roughness=0.22, coat=0.4)
    for name in ('GEO-rain-gums_upper', 'GEO-rain-gums_lower'):
        obj = bpy.data.objects.get(name)
        if obj:
            old = [m.name if m else '' for m in obj.data.materials]
            idx = [1 if 'teeth' in old[p.material_index] else 0 for p in obj.data.polygons]
            assign(name, [gums, teeth])
            for p, i in zip(obj.data.polygons, idx):
                p.material_index = i
    assign('GEO-rain-tongue', [new_principled('KAIRO_Tongue', color=(0.48, 0.17, 0.16), roughness=0.35, sss=0.25)])
    report['materials'] = [m.name for m in bpy.data.materials if m.name.startswith('KAIRO_')]


# ------------------------------------------------------------------------------------------------ 3. wardrobe prep
def stage_strip_rain_styling(report):
    removed = []
    for name in ('GEO-rain-hair_main', 'GEO-rain-hair_ponytail', 'GEO-rain-hair_strand', 'GEO-rain-hairband', 'GEO-rain-scarf', 'GEO-rain-eyes_viewport'):
        obj = bpy.data.objects.get(name)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)
            removed.append(name)
    report['removed'] = removed


def main():
    report = {'source': 'Rain v3.3 rain_v3.2.blend (Blender Studio, CC-BY 4.0)', 'mode': MODE}
    bpy.ops.file.make_paths_absolute()  # Rain's //textures paths must survive saving to a new folder
    stage_identity(report)
    stage_materials(report)
    stage_strip_rain_styling(report)
    # Credit travels with the source file.
    credit = bpy.data.texts.get('KAIRO_CREDITS') or bpy.data.texts.new('KAIRO_CREDITS')
    credit.from_string('KAIRO teacher: derived from Rain Rig (CC) Blender Foundation | studio.blender.org, CC-BY 4.0. '
                       'Changes: face and figure reshaped, skin/eye textures recoloured, hair and clothing replaced. '
                       'cloudrig.py in this file is part of Blender Studio CloudRig (GPL).')
    target = OUT / 'kairo_teacher.blend'
    bpy.data.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(target), relative_remap=False, compress=True)
    # Point remaining Rain images at a copy inside design/character so the source is self-contained.
    keep = CHARACTER / 'textures' / 'rain-source'
    keep.mkdir(parents=True, exist_ok=True)
    copied = []
    for img in bpy.data.images:
        if img.source in {'FILE', 'TILED'} and img.filepath and 'rain' in img.filepath.lower() and img.users:
            src = Path(bpy.path.abspath(img.filepath.replace('<UDIM>', '1001')))
            if img.source == 'TILED':
                for tile in img.tiles:
                    t = Path(bpy.path.abspath(img.filepath.replace('<UDIM>', str(tile.number))))
                    if t.exists():
                        shutil.copy2(t, keep / t.name)
                        copied.append(t.name)
            elif src.exists():
                shutil.copy2(src, keep / src.name)
                copied.append(src.name)
            img.filepath = str(keep / Path(img.filepath).name)
    bpy.ops.file.make_paths_relative()
    bpy.ops.wm.save_as_mainfile(filepath=str(target), compress=True)
    report['copiedRainTextures'] = sorted(set(copied))
    report['saved'] = str(target)
    (OUT / 'build-report.json').write_text(json.dumps(report, indent=1), encoding='utf8')
    print('BUILD_DONE', target)


main()
