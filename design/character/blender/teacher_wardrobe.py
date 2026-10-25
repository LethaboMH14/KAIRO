"""Authors the teacher's clothing on kairo_teacher.blend (original KAIRO geometry derived from the body surface).

  run-blender.ps1 -Script teacher_wardrobe.py -BlendFile design/character/blender/kairo_teacher.blend -Out design/character/blender

Sage button-up shirt (rolled sleeves, fold-down collar, buttons, flap pockets) tucked into cream high-waisted
straight-leg trousers; Rain's sneakers recoloured. Each garment starts as a region of the subdivided body surface,
so it inherits the body's skin weights, is offset outward and relaxed with a clearance constraint (fabric bridges
concave areas instead of shrink-wrapping), then gets constructed details. Body skin under clothing is masked.
"""
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

ARGS = sys.argv[sys.argv.index('--') + 1:]
OUT = Path(ARGS[0]).resolve()
RIG = bpy.data.objects['RIG-rain']
BODY = bpy.data.objects['GEO-rain-body']
TEXTURES = Path(__file__).resolve().parent.parent / 'textures'

WAIST_Z = 0.985          # shirt hem (tucked) and trouser waistband reference
TROUSER_TOP = 1.035
TROUSER_HEM = 0.112
CUFF_X = 0.405           # rolled sleeve edge along the T-pose arm (|x|)
SHOULDER_X = 0.165


def bone_head(name):
    return RIG.matrix_world @ RIG.data.bones[name].head_local


NECK_Z = bone_head('DEF-Neck').z


def neckline_z(co):
    # Back and sides sit 3 cm up the neck: the top of the shoulders beside the neck rises above the neck bone, and
    # a lower line left that ridge as bare skin framed by the collar. Blends over the side of the neck into the V.
    back = NECK_Z + 0.030
    front = NECK_Z - 0.040 + 0.75 * abs(co.x)      # open V at the front
    t = min(1.0, max(0.0, (co.y + 0.045) / 0.03))
    t = t * t * (3 - 2 * t)
    return front + (back - front) * t


def shirt_region(co):
    ax = abs(co.x)
    if ax > SHOULDER_X:                              # arm (T-pose arms run along X)
        return ax <= CUFF_X and co.z > 1.10
    return WAIST_Z - 0.03 <= co.z <= neckline_z(co)


def trouser_region(co):
    return TROUSER_HEM <= co.z <= TROUSER_TOP and abs(co.x) < 0.24


def shirt_offset(co):
    ax = abs(co.x)
    if ax > SHOULDER_X:
        return 0.0065 + 0.004 * max(0.0, (ax - 0.30) / 0.1)
    if co.z < TROUSER_TOP:
        return 0.0055                                  # tucked part stays inside the waistband
    blouse = max(0.0, min(1.0, (1.12 - co.z) / 0.085))
    return 0.0085 + 0.006 * blouse


def trouser_offset(co):
    if co.z > WAIST_Z:
        return 0.026                                   # waistband sits over the tucked shirt
    if co.z > 0.70 and abs(co.x) < 0.07:
        return 0.016 if co.y < 0.02 else 0.019         # easy front rise and a back seam that bridges
    if co.z > 0.86:
        return 0.011
    return 0.008


# ------------------------------------------------------------------------------------------------ body copy
def body_copy(name):
    obj = BODY.copy()
    obj.data = BODY.data.copy()
    obj.name = name
    obj.data.name = name
    bpy.context.scene.collection.objects.link(obj)
    world = obj.matrix_world.copy()
    obj.parent = None
    obj.matrix_world = world
    obj.animation_data_clear()
    if obj.data.shape_keys:
        obj.shape_key_clear()
    for mod in list(obj.modifiers):
        obj.modifiers.remove(mod)
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    sub = obj.modifiers.new('Subdivision', 'SUBSURF')
    sub.levels = 1
    bpy.ops.object.modifier_apply(modifier='Subdivision')
    obj.data.materials.clear()
    return obj


def relax(bm, base, normals, min_off, iterations, factor, pinned=()):
    pinned = set(pinned)
    for _ in range(iterations):
        new = {}
        for v in bm.verts:
            if not v.link_edges:
                continue
            avg = Vector()
            for e in v.link_edges:
                avg += e.other_vert(v).co
            avg /= len(v.link_edges)
            f = factor * (0.15 if v in pinned or v.is_boundary else 1.0)
            new[v] = v.co.lerp(avg, f)
        for v, co in new.items():
            b, n = base[v.index], normals[v.index]
            d = (co - b).dot(n)
            if d < min_off[v.index]:
                co = co + n * (min_off[v.index] - d)
            v.co = co


def garment(name, region_fn, offset_fn, iterations):
    obj = body_copy(name)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.transform(obj.matrix_world)
    obj.matrix_world = Matrix.Identity(4)
    keep = {f for f in bm.faces if all(region_fn(v.co) for v in f.verts)}
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f not in keep], context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bm.verts.index_update()
    bm.normal_update()
    base = [v.co.copy() for v in bm.verts]
    normals = [v.normal.copy() for v in bm.verts]
    offs = [offset_fn(v.co) for v in bm.verts]
    for v in bm.verts:
        v.co = v.co + v.normal * offs[v.index]
    relax(bm, base, normals, [o * 0.75 for o in offs], iterations, 0.5)
    return obj, bm


def boundary_loops(bm):
    edges = [e for e in bm.edges if e.is_boundary]
    adjacency = {}
    for e in edges:
        a, b = e.verts
        adjacency.setdefault(a, []).append(b)
        adjacency.setdefault(b, []).append(a)
    seen, loops = set(), []
    for start in adjacency:
        if start in seen:
            continue
        loop = [start]
        seen.add(start)
        prev, cur = None, start
        while True:
            nxt = [n for n in adjacency[cur] if n != prev and n not in seen]
            if not nxt:
                break
            prev, cur = cur, nxt[0]
            loop.append(cur)
            seen.add(cur)
        loops.append(loop)
    return loops


def centroid(points):
    return sum(points, Vector()) / len(points)


def copy_weights(bm, deform, src_vert, dst_vert):
    dst_vert[deform].clear()
    for k, w in src_vert[deform].items():
        dst_vert[deform][k] = w


def ring_strip(bm, deform, loop, offsets_fn, closed=True, mat_index=0):
    """Builds rings of new verts from a boundary loop: offsets_fn(vert, ring_index) -> position."""
    rings = [loop]
    ring_count = offsets_fn(None, None)
    for r in range(1, ring_count):
        ring = []
        for v in loop:
            nv = bm.verts.new(offsets_fn(v, r))
            copy_weights(bm, deform, v, nv)
            ring.append(nv)
        # Relax each constructed ring along its length so cuffs and collars get clean, even edges.
        n_ring = len(ring)
        for _ in range(4):
            pos = [nv.co.copy() for nv in ring]
            for i in range(n_ring):
                a, b = pos[(i - 1) % n_ring], pos[(i + 1) % n_ring]
                if not closed and i in (0, n_ring - 1):
                    continue
                ring[i].co = pos[i] * 0.5 + (a + b) * 0.25
        rings.append(ring)
    n = len(loop)
    for ra, rb in zip(rings, rings[1:]):
        for i in range(n if closed else n - 1):
            j = (i + 1) % n
            try:
                f = bm.faces.new((ra[i], ra[j], rb[j], rb[i]))
                f.material_index = mat_index
                f.smooth = True
            except ValueError:
                pass
    return rings


# ------------------------------------------------------------------------------------------------ shirt
def build_shirt(report):
    obj, bm = garment('KAIRO_Shirt', shirt_region, shirt_offset, 24)
    deform = bm.verts.layers.deform.verify()
    loops = boundary_loops(bm)
    info = []
    for loop in loops:
        c = centroid([v.co for v in loop])
        kind = 'sleeve' if abs(c.x) > 0.3 else ('collar' if c.z > 1.15 else 'hem')
        info.append((kind, len(loop), [round(x, 3) for x in c]))
        if kind == 'sleeve':
            side = 1 if c.x > 0 else -1
            axis = Vector((side, 0, 0))

            def cuff(v, r, c=c, axis=axis):
                if v is None:
                    return 6
                radial = (v.co - c) - axis * (v.co - c).dot(axis)
                radial.normalize()
                lip = [(0, 0), (0.0032, 0.002), (0.007, -0.006), (0.0088, -0.020), (0.0078, -0.034), (0.0036, -0.041)]
                out, along = lip[r]
                return v.co + radial * out + axis * along
            ring_strip(bm, deform, loop, cuff)
        elif kind == 'collar':
            cy = c.y
            up = Vector((0, 0, 1))

            def collar(v, r, cy=cy):
                if v is None:
                    return 5
                o = Vector((v.co.x, v.co.y - cy, 0.0))
                o.normalize()
                front = max(0.0, min(1.0, (0.05 - abs(v.co.x)) / 0.05)) * (1.0 if v.co.y < cy else 0.0)
                shape = [(0, 0), (-0.002, 0.011), (0.004, 0.015), (0.021, 0.006), (0.036 + 0.008 * front, -0.012 - 0.022 * front)]
                out, rise = shape[r]
                return v.co + o * out + up * rise
            ring_strip(bm, deform, loop, collar)
    bm.normal_update()
    shirt_bvh = BVHTree.FromBMesh(bm)
    # Buttons down the front placket and two flap pockets, snapped to the shirt surface.
    extras = []
    for k in range(5):
        z = NECK_Z - 0.052 - k * 0.052
        hit, n, _, _ = shirt_bvh.ray_cast(Vector((0.0, -0.5, z)), Vector((0, 1, 0)), 1.0)
        if hit is not None:
            extras.append(('button', hit, n))
    for sx in (1, -1):
        hit, n, _, _ = shirt_bvh.ray_cast(Vector((0.058 * sx, -0.5, NECK_Z - 0.105)), Vector((0, 1, 0)), 1.0)
        if hit is not None:
            extras.append(('pocket', hit, n))
    kd = KDTree(len(bm.verts))
    for v in bm.verts:
        kd.insert(v.co, v.index)
    kd.balance()
    bm.verts.ensure_lookup_table()
    nears = [bm.verts[kd.find(p)[1]] for _, p, _ in extras]  # resolve before new verts invalidate the table
    for (kind, p, n), near in zip(extras, nears):
        if n.y > 0:
            n = -n
        if kind == 'button':
            add_disc(bm, deform, near, p + n * 0.0012, n, 0.0052, 0.0018, mat_index=1)
        else:
            add_pocket(bm, deform, near, shirt_bvh, p, n)
    bm.to_mesh(obj.data)
    bm.free()
    report['shirt'] = {'boundaryLoops': info, 'vertices': len(obj.data.vertices), 'details': [e[0] for e in extras]}
    return obj


def add_disc(bm, deform, near, centre, normal, radius, depth, mat_index):
    t = normal.orthogonal().normalized()
    b = normal.cross(t).normalized()
    seg = 12
    top, bot = [], []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        d = (t * math.cos(a) + b * math.sin(a)) * radius
        for ring, off in ((top, depth), (bot, 0.0)):
            nv = bm.verts.new(centre + d + normal * off)
            copy_weights(bm, deform, near, nv)
            ring.append(nv)
    cap = bm.faces.new(top)
    cap.material_index = mat_index
    for i in range(seg):
        j = (i + 1) % seg
        f = bm.faces.new((bot[i], bot[j], top[j], top[i]))
        f.material_index = mat_index
        f.smooth = True


def add_pocket(bm, deform, near, bvh, centre, normal):
    """Flap pocket: a raised patch and a flap that follow the chest surface, plus a button."""
    side = Vector((1, 0, 0))
    up = Vector((0, 0, 1))
    w, h = 0.082, 0.090

    def grid(cx, cz, width, height, lift, nx=6, nz=6, point=0.0):
        verts = []
        for j in range(nz + 1):
            row = []
            for i in range(nx + 1):
                u, v = i / nx - 0.5, j / nz
                z = cz - v * height
                if j == nz and point:
                    z -= point * (1 - abs(u) * 2)
                origin = centre + side * (u * width) + Vector((0, 0, z - centre.z)) + Vector((0, -0.3, 0))
                hit, n, _, _ = bvh.ray_cast(origin, Vector((0, 1, 0)), 1.0)
                if hit is None:
                    hit, n = centre, normal
                if n.y > 0:
                    n = -n
                nv = bm.verts.new(hit + n * lift)
                copy_weights(bm, deform, near, nv)
                row.append(nv)
            verts.append(row)
        for j in range(nz):
            for i in range(nx):
                f = bm.faces.new((verts[j][i], verts[j][i + 1], verts[j + 1][i + 1], verts[j + 1][i]))
                f.smooth = True
        return verts
    grid(centre.x, centre.z + 0.03, w, h, 0.0014)
    flap = grid(centre.x, centre.z + 0.034, w + 0.006, 0.026, 0.0032, nx=6, nz=2, point=0.012)
    tip = flap[-1][len(flap[-1]) // 2]
    add_disc(bm, deform, near, tip.co + normal * 0.0006, normal, 0.0042, 0.0016, mat_index=1)


# ------------------------------------------------------------------------------------------------ trousers
def build_trousers(report):
    obj, bm = garment('KAIRO_Trousers', trouser_region, trouser_offset, 34)
    deform = bm.verts.layers.deform.verify()
    flare = 0
    for v in bm.verts:
        if v.co.z > 0.74 or abs(v.co.x) < 0.015:
            continue
        side = 1 if v.co.x > 0 else -1
        hip = bone_head(f'DEF-Thigh1.{"L" if side > 0 else "R"}')
        ankle = bone_head(f'DEF-Foot.{"L" if side > 0 else "R"}')
        axis = (ankle - hip).normalized()
        c = hip + axis * (v.co - hip).dot(axis)
        radial = v.co - c
        r = radial.length
        t = max(0.0, min(1.0, (0.80 - v.co.z) / (0.80 - TROUSER_HEM)))
        target = 0.060 * t + r * (1 - t) if r < 0.060 else r
        p = c + radial.normalized() * max(r, target)
        if side * p.x < 0.010:                       # keep each leg on its own side of the midline
            p.x = 0.010 * side
        v.co = p
        flare += 1
    for loop in boundary_loops(bm):
        c = centroid([v.co for v in loop])
        if c.z < 0.4:                                  # level the hems
            for v in loop:
                v.co.z = TROUSER_HEM
    # Waistband: a slightly raised band at the top edge.
    for v in bm.verts:
        if v.co.z > TROUSER_TOP - 0.032:
            v.co += v.normal * 0.0015
    bm.normal_update()
    bm.to_mesh(obj.data)
    bm.free()
    report['trousers'] = {'vertices': len(obj.data.vertices), 'flaredVertices': flare}
    return obj


# ------------------------------------------------------------------------------------------------ materials, masking
def fabric(name, color, roughness, sheen=0.0, weave=None):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Specular IOR Level'].default_value = 0.3
    if sheen:
        bsdf.inputs['Sheen Weight'].default_value = sheen
        bsdf.inputs['Sheen Tint'].default_value = (*color, 1.0)
    if weave is not None and weave.exists():
        nt = mat.node_tree
        tex = nt.nodes.new('ShaderNodeTexImage')
        tex.image = bpy.data.images.load(str(weave), check_existing=True)
        tex.image.colorspace_settings.name = 'Non-Color'
        mapping = nt.nodes.new('ShaderNodeMapping')
        mapping.inputs['Scale'].default_value = (14.0, 14.0, 1.0)
        coord = nt.nodes.new('ShaderNodeTexCoord')
        nt.links.new(coord.outputs['UV'], mapping.inputs['Vector'])
        nt.links.new(mapping.outputs['Vector'], tex.inputs['Vector'])
        nmap = nt.nodes.new('ShaderNodeNormalMap')
        nmap.inputs['Strength'].default_value = 0.6
        nt.links.new(tex.outputs['Color'], nmap.inputs['Color'])
        nt.links.new(nmap.outputs['Normal'], bsdf.inputs['Normal'])
    return mat


def finish(obj, materials, export_name):
    obj.data.materials.clear()
    for m in materials:
        obj.data.materials.append(m)
    for p in obj.data.polygons:
        p.use_smooth = True
    obj.parent = RIG
    obj.matrix_parent_inverse = RIG.matrix_world.inverted()
    mod = obj.modifiers.new('Armature', 'ARMATURE')
    mod.object = RIG
    obj['kairo_export'] = export_name
    obj['kairo_subsurf'] = 0


def mask_body(report):
    """Hides body skin well inside the clothing so nothing pokes through (export evaluates the Mask modifier)."""
    group = BODY.vertex_groups.get('kairo_covered') or BODY.vertex_groups.new(name='kairo_covered')
    covered = []
    for v in BODY.data.vertices:
        co = BODY.matrix_world @ v.co
        ax = abs(co.x)
        in_shirt = (ax <= CUFF_X - 0.03 and co.z > 1.12) if ax > SHOULDER_X else (WAIST_Z + 0.01 <= co.z <= neckline_z(co) - 0.03)
        in_trousers = TROUSER_HEM + 0.035 <= co.z <= WAIST_Z + 0.02 and ax < 0.24
        if in_shirt or in_trousers:
            covered.append(v.index)
    group.add(covered, 1.0, 'REPLACE')
    for mod in list(BODY.modifiers):
        if mod.type in {'VERTEX_WEIGHT_MIX', 'MASK'}:
            BODY.modifiers.remove(mod)
    if BODY.animation_data:
        for drv in list(BODY.animation_data.drivers):
            if 'mask' in drv.data_path.lower():
                BODY.animation_data.drivers.remove(drv)
    mask = BODY.modifiers.new('KAIRO_Covered', 'MASK')
    mask.vertex_group = 'kairo_covered'
    mask.invert_vertex_group = True
    # Mask before the armature so evaluation order stays deformation-correct.
    while BODY.modifiers.find('KAIRO_Covered') > 0:
        bpy.ops.object.select_all(action='DESELECT')
        bpy.context.view_layer.objects.active = BODY
        bpy.ops.object.modifier_move_up(modifier='KAIRO_Covered')
    report['maskedBodyVertices'] = len(covered)


def recolour_shoes(report):
    shoes = bpy.data.objects.get('GEO-rain-shoes')
    if shoes is None:
        return
    palette = {'shoes': ((0.82, 0.79, 0.72), 0.55, 0.0), 'laces': ((0.86, 0.84, 0.8), 0.7, 0.0),
               'socks': ((0.72, 0.66, 0.55), 0.85, 0.0), 'metal': ((1.0, 0.72, 0.36), 0.25, 1.0)}
    done = []
    for slot in shoes.material_slots:
        if slot.material is None:
            continue
        for key, (color, rough, metal) in palette.items():
            if key in slot.material.name.lower():
                mat = bpy.data.materials.new('KAIRO_Shoes_' + key)
                mat.use_nodes = True
                bsdf = mat.node_tree.nodes['Principled BSDF']
                bsdf.inputs['Base Color'].default_value = (*color, 1.0)
                bsdf.inputs['Roughness'].default_value = rough
                bsdf.inputs['Metallic'].default_value = metal
                slot.material = mat
                done.append(key)
    shoes['kairo_export'] = 'Teacher_Shoes'
    shoes['kairo_subsurf'] = 0
    report['shoes'] = done


def main():
    report = {}
    for name in ('KAIRO_Shirt', 'KAIRO_Trousers'):
        if bpy.data.objects.get(name):
            bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
    for name in ('GEO-rain-top', 'GEO-rain-jeans', 'GEO-rain-body_nomask'):
        if bpy.data.objects.get(name):
            bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
    weave = TEXTURES / 'fabric_weave_normal.png'
    sage = fabric('KAIRO_Shirt', (0.105, 0.150, 0.088), 0.8, sheen=0.12)
    buttons = fabric('KAIRO_Buttons', (0.78, 0.74, 0.64), 0.35)
    cream = fabric('KAIRO_Trousers', (0.62, 0.55, 0.42), 0.86, sheen=0.1)
    shirt = build_shirt(report)
    finish(shirt, [sage, buttons], 'Teacher_Shirt')
    trousers = build_trousers(report)
    finish(trousers, [cream], 'Teacher_Trousers')
    mask_body(report)
    recolour_shoes(report)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath, compress=True)
    (OUT / 'wardrobe-report.json').write_text(json.dumps(report, indent=1), encoding='utf8')
    print('WARDROBE_DONE', json.dumps(report)[:800])


main()
