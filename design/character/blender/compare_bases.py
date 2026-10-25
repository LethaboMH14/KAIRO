"""Renders candidate character bases under identical cameras, lights and world for rig selection.

Run through run-blender.ps1:
  -Mode rain       -BlendFile <extracted Rain v3.3/rain_v3.2.blend>  (opened with embedded scripts disabled)
  -Mode rehearsal  imports studio/public/models/teacher/teacher.glb (existing CC0 MPFB rehearsal)
  -Mode quaternius imports the extracted Quaternius Standard female glTF (path in KAIRO_QUATERNIUS)
  -Mode mpfb       -BlendFile <MPFB build .blend>
Append "+restyle" to the mode to recolour skin/hair/clothing toward the brief (a direction check only).
Writes <Out>/<mode>_<view>.png and <Out>/<mode>_metrics.json.
"""
import json
import os
import sys
import time
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
import kairo_render as kr  # noqa: E402

ARGS = sys.argv[sys.argv.index('--') + 1:]
OUT = Path(ARGS[0])
MODE = ARGS[1]
BASE, _, EXTRA = MODE.partition('+')
OUT.mkdir(parents=True, exist_ok=True)
ROOT = kr.ROOT

SKIN_TINT = (0.42, 0.27, 0.19)
HAIR_TINT = (0.09, 0.06, 0.05)
SAGE = (0.30, 0.38, 0.27)
CREAM = (0.80, 0.74, 0.62)


def strip_scene_lights_and_cameras():
    for obj in list(bpy.data.objects):
        if obj.type in {'LIGHT', 'CAMERA', 'LIGHT_PROBE'}:
            bpy.data.objects.remove(obj, do_unlink=True)
    bpy.context.scene.camera = None


def renderable_meshes():
    out = []
    for obj in bpy.context.scene.objects:
        if obj.type != 'MESH' or obj.hide_render or not obj.visible_get():
            continue
        if obj.name.startswith(('WGT', 'Review floor')):
            continue
        out.append(obj)
    return out


def bounds(objs):
    deps = bpy.context.evaluated_depsgraph_get()
    lo, hi = Vector((1e9, 1e9, 1e9)), Vector((-1e9, -1e9, -1e9))
    for obj in objs:
        ev = obj.evaluated_get(deps)
        for corner in ev.bound_box:
            w = ev.matrix_world @ Vector(corner)
            lo = Vector(map(min, lo, w))
            hi = Vector(map(max, hi, w))
    return lo, hi


def eye_point(objs, lo, hi):
    deps = bpy.context.evaluated_depsgraph_get()
    eyes = [o for o in objs if 'eye' in o.name.lower() and 'lash' not in o.name.lower() and 'brow' not in o.name.lower()]
    pts = []
    for obj in eyes:
        ev = obj.evaluated_get(deps)
        mesh = ev.to_mesh()
        pts.extend(ev.matrix_world @ v.co for v in mesh.vertices)
        ev.to_mesh_clear()
    if pts:
        c = sum(pts, Vector()) / len(pts)
        return Vector((0.0, c.y, c.z - 0.03))
    return Vector((0.0, (lo.y + hi.y) / 2, hi.z - 0.12))


def counts(objs):
    deps = bpy.context.evaluated_depsgraph_get()
    verts = tris = 0
    morphs = {}
    for obj in objs:
        ev = obj.evaluated_get(deps)
        mesh = ev.to_mesh()
        mesh.calc_loop_triangles()
        verts += len(mesh.vertices)
        tris += len(mesh.loop_triangles)
        ev.to_mesh_clear()
        if obj.data.shape_keys:
            morphs[obj.name] = len(obj.data.shape_keys.key_blocks) - 1
    arms = [o for o in bpy.data.objects if o.type == 'ARMATURE']
    bones = {a.name: {'bones': len(a.data.bones), 'deform': sum(1 for b in a.data.bones if b.use_deform)} for a in arms}
    return {'verts': verts, 'tris': tris, 'meshes': len(objs), 'morphTargets': morphs, 'armatures': bones}


def multiply_after_textures(mat, keywords, tint):
    """Insert a multiply after image textures whose image name contains a keyword."""
    if not mat or not mat.use_nodes:
        return 0
    nt, done = mat.node_tree, 0
    for node in list(nt.nodes):
        if node.type != 'TEX_IMAGE' or not node.image:
            continue
        if not any(k in node.image.name.lower() for k in keywords):
            continue
        links = [l for l in nt.links if l.from_node == node and l.from_socket.name == 'Color']
        if not links:
            continue
        mix = nt.nodes.new('ShaderNodeMix')
        mix.data_type, mix.blend_type = 'RGBA', 'MULTIPLY'
        mix.inputs['Factor'].default_value = 1.0
        mix.inputs['B'].default_value = (*tint, 1.0)
        nt.links.new(node.outputs['Color'], mix.inputs['A'])
        for link in links:
            to = link.to_socket
            nt.links.remove(link)
            nt.links.new(mix.outputs['Result'], to)
        done += 1
    return done


def set_flat_color(mat, color):
    if not mat or not mat.use_nodes:
        return False
    for node in mat.node_tree.nodes:
        if node.type == 'BSDF_PRINCIPLED':
            sock = node.inputs['Base Color']
            for link in list(sock.links):
                mat.node_tree.links.remove(link)
            sock.default_value = (*color, 1.0)
            return True
    return False


def flat_material(name, color, roughness):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Roughness'].default_value = roughness
    return mat


def hue_shift_after_textures(mat, keywords, hue, sat, val):
    if not mat or not mat.use_nodes:
        return 0
    nt, done = mat.node_tree, 0
    for node in list(nt.nodes):
        if node.type == 'TEX_IMAGE' and node.image and any(k in node.image.name.lower() for k in keywords):
            links = [l for l in nt.links if l.from_node == node and l.from_socket.name == 'Color']
            hsv = nt.nodes.new('ShaderNodeHueSaturation')
            hsv.inputs['Hue'].default_value, hsv.inputs['Saturation'].default_value, hsv.inputs['Value'].default_value = hue, sat, val
            nt.links.new(node.outputs['Color'], hsv.inputs['Color'])
            for link in links:
                to = link.to_socket
                nt.links.remove(link)
                nt.links.new(hsv.outputs['Color'], to)
            done += 1
    return done


def restyle_rain_v2(objs):
    """Closer direction check: brown eyes, dark brows, sage top, cream trousers, no scarf. Rain's face shape is unchanged."""
    log = []
    dark = flat_material('preview-dark-hair', (0.022, 0.016, 0.012), 0.55)
    sage = flat_material('preview-sage', (0.085, 0.13, 0.075), 0.8)
    cream = flat_material('preview-cream', (0.6, 0.53, 0.4), 0.85)
    for obj in list(objs):
        name = obj.name.lower()
        if 'scarf' in name:
            bpy.data.objects.remove(obj, do_unlink=True)
            log.append((name, 'removed'))
            continue
        if any(k in name for k in ('body', 'head', 'hands')):
            for slot in obj.material_slots:
                log.append((obj.name, 'skin', multiply_after_textures(slot.material, ('body_diffuse', 'hands_diffuse', 'diffuse'), SKIN_TINT)))
        elif any(k in name for k in ('eyebrows', 'eyelashes')):
            for slot in obj.material_slots:
                slot.material = dark
            log.append((obj.name, 'dark'))
        elif 'hair' in name:
            for slot in obj.material_slots:
                log.append((obj.name, 'hair', multiply_after_textures(slot.material, ('hair',), HAIR_TINT)))
        elif name.endswith('eyes'):
            for slot in obj.material_slots:
                log.append((obj.name, 'iris', hue_shift_after_textures(slot.material, ('eyes',), 0.98, 1.0, 0.7)))
        elif 'top' in name:
            for slot in obj.material_slots:
                slot.material = sage
            log.append((obj.name, 'sage'))
        elif 'jeans' in name:
            for slot in obj.material_slots:
                slot.material = cream
            log.append((obj.name, 'cream'))
    return log


def restyle_rain(objs):
    log = []
    for obj in objs:
        name = obj.name.lower()
        for slot in obj.material_slots:
            mat = slot.material
            if mat is None:
                continue
            if any(k in name for k in ('body', 'head', 'hands')):
                log.append((obj.name, mat.name, 'skin', multiply_after_textures(mat, ('body_diffuse', 'hands_diffuse', 'diffuse'), SKIN_TINT)))
            elif any(k in name for k in ('hair', 'eyebrow', 'eyelash')):
                log.append((obj.name, mat.name, 'hair', multiply_after_textures(mat, ('hair',), HAIR_TINT) or set_flat_color(mat, HAIR_TINT)))
            elif 'top' in name:
                log.append((obj.name, mat.name, 'top', set_flat_color(mat, SAGE)))
            elif 'jeans' in name:
                log.append((obj.name, mat.name, 'trousers', multiply_after_textures(mat, ('jeans',), (1.6, 1.4, 1.1)) or set_flat_color(mat, CREAM)))
        if 'scarf' in name:
            obj.hide_render = True
            log.append((obj.name, '', 'hidden', True))
    return log


def restyle_generic(objs):
    log = []
    for obj in objs:
        for slot in obj.material_slots:
            mat = slot.material
            if mat is None:
                continue
            low = (obj.name + ' ' + mat.name).lower()
            if any(k in low for k in ('hair', 'brow', 'lash', 'ponytail')):
                log.append((obj.name, mat.name, 'hair', multiply_after_textures(mat, ('',), HAIR_TINT) or set_flat_color(mat, HAIR_TINT)))
            elif any(k in low for k in ('suit', 'cloth', 'shirt', 'top')):
                log.append((obj.name, mat.name, 'clothes', set_flat_color(mat, SAGE)))
            elif any(k in low for k in ('human', 'body', 'skin', 'superhero')) and 'eye' not in low and 'teeth' not in low:
                log.append((obj.name, mat.name, 'skin', multiply_after_textures(mat, ('',), SKIN_TINT) or set_flat_color(mat, SKIN_TINT)))
    return log


def load_candidate():
    if BASE == 'rehearsal':
        kr.clear_scene()
        bpy.ops.import_scene.gltf(filepath=str(ROOT / 'studio/public/models/teacher/teacher.glb'))
        return {'source': 'studio/public/models/teacher/teacher.glb', 'licence': 'CC0-1.0 (TalkingHead MPFB example)'}
    if BASE == 'quaternius':
        kr.clear_scene()
        bpy.ops.import_scene.gltf(filepath=os.environ['KAIRO_QUATERNIUS'])
        return {'source': 'Quaternius Universal Base Characters Standard, Superhero_Female_FullBody', 'licence': 'CC0-1.0'}
    if BASE == 'rain':
        return {'source': 'Rain v3.3 rain_v3.2.blend (Blender Studio)', 'licence': 'CC-BY-4.0', 'scriptsExecuted': False}
    if BASE == 'mpfb':
        return {'source': 'KAIRO MPFB 2.0.18 build', 'licence': 'CC0 core assets'}
    raise SystemExit('unknown mode ' + MODE)


def main():
    started = time.time()
    meta = load_candidate()
    strip_scene_lights_and_cameras()
    kr.setup_world(0.8)
    objs = renderable_meshes()
    lo, hi = bounds(objs)
    height = hi.z - lo.z
    # Normalise so the feet stand on z=0 without changing scale.
    if abs(lo.z) > 1e-3:
        for obj in bpy.context.scene.objects:
            if obj.parent is None and obj.type in {'MESH', 'ARMATURE', 'EMPTY'}:
                obj.location.z -= lo.z
        bpy.context.view_layer.update()
        lo, hi = bounds(objs)
    head = eye_point(objs, lo, hi)
    restyle_log = []
    if EXTRA == 'restyle':
        restyle_log = restyle_rain(objs) if BASE == 'rain' else restyle_generic(objs)
    elif EXTRA == 'restyle2' and BASE == 'rain':
        restyle_log = restyle_rain_v2(objs)
        objs = renderable_meshes()
    kr.add_lights(Vector((0.0, 0.0, height * 0.75)))
    kr.add_floor()
    engine = kr.configure_engine(samples=24)
    shots = {}
    for view, size in (('front', (720, 1080)), ('three_quarter', (720, 1080)), ('face', (720, 720))):
        kr.place_camera(view, height, head, aspect=size)
        path = OUT / f'{BASE}{"_" + EXTRA if EXTRA else ""}_{view}.png'
        kr.render_to(path)
        shots[view] = path.name
    metrics = dict(meta, mode=MODE, engine=engine, heightM=round(height, 4), headPoint=[round(v, 4) for v in head],
                   counts=counts(objs), shots=shots, restyle=restyle_log, seconds=round(time.time() - started, 1))
    (OUT / f'{BASE}{"_" + EXTRA if EXTRA else ""}_metrics.json').write_text(json.dumps(metrics, indent=1), encoding='utf8')
    print('COMPARE_DONE', MODE, round(height, 3), metrics['counts']['tris'])


main()
