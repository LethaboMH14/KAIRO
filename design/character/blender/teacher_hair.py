"""Authors the teacher's locs updo and gold accents on kairo_teacher.blend (original KAIRO geometry).

  run-blender.ps1 -Script teacher_hair.py -BlendFile design/character/blender/kairo_teacher.blend -Out design/character/blender

Half-up locs: a high crown bun of coiled locs; front/top/side locs pulled up into the bun; back locs hanging to the
shoulder blades on a three-bone spring chain; two face-framing locs per temple on two-bone chains; a scalp layer;
small gold loc cuffs and gold hoop earrings. Every loc is a tube whose UVs run along its length so the tiling
twist normal map (textures/hair_twist_normal.png) reads as a two-ply twist. Deterministic (fixed seeds).
"""
import json
import math
import random
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

ARGS = sys.argv[sys.argv.index('--') + 1:]
OUT = Path(ARGS[0]).resolve()
HERE = Path(__file__).resolve().parent
TEXTURES = HERE.parent / 'textures'
RIG = bpy.data.objects['RIG-rain']
HEAD = bpy.data.objects['GEO-rain-head']
BODY = bpy.data.objects['GEO-rain-body']
rng = random.Random(20261022)

LOC_R = 0.0063          # loc radius
SIDES = 6
STEP = 0.009            # ring spacing along a loc
SCALP_OFF = 0.0026      # scalp layer offset
TILE = 0.04             # metres of loc per normal-map tile
PART_Z = 1.535          # half-up parting behind the ears: locs above it go up into the bun, below it they hang
BACK_CLEAR = 0.05       # hanging locs' gap from the body's back: the shirt's fold-down collar flares ~4.5 cm out


# ------------------------------------------------------------------------------------------------ helpers
def bvh_for(obj):
    deps = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(deps)
    mesh = ev.to_mesh()
    verts = [ev.matrix_world @ v.co for v in mesh.vertices]
    polys = [tuple(p.vertices) for p in mesh.polygons]
    ev.to_mesh_clear()
    return BVHTree.FromPolygons(verts, polys), verts


for mod in HEAD.modifiers:
    if mod.type == 'SUBSURF':
        mod.show_viewport = False
HEAD_BVH, HEAD_VERTS = bvh_for(HEAD)
BODY_BVH, _ = bvh_for(BODY)
top = max(HEAD_VERTS, key=lambda v: v.z)
scalp_pts = [v for v in HEAD_VERTS if v.z > 1.50]
H = Vector((0.0, sum(v.y for v in scalp_pts) / len(scalp_pts), 1.50))  # head centre used for scalp projection


def surface_along(direction):
    """Scalp point hit by a ray from the head centre."""
    hit, normal, _, _ = HEAD_BVH.ray_cast(H, direction.normalized(), 0.4)
    if hit is None:
        loc, normal, _, _ = HEAD_BVH.find_nearest(H + direction.normalized() * 0.12)
        return loc, normal
    if normal.dot(direction) < 0:
        normal = -normal
    return hit, normal


def hairline_z(phi_deg):
    """Hairline height by azimuth (0 = front, 180 = back)."""
    table = [(0, 1.581), (30, 1.573), (55, 1.549), (80, 1.516), (100, 1.489), (125, 1.460), (180, 1.430)]
    a = abs(phi_deg)
    for (a0, z0), (a1, z1) in zip(table, table[1:]):
        if a <= a1:
            t = (a - a0) / (a1 - a0)
            return z0 + (z1 - z0) * t
    return table[-1][1]


def azimuth(p):
    return math.degrees(math.atan2(p.x, -(p.y - H.y)))


def in_hair_zone(p):
    if abs(p.x) > 0.112 and 1.40 < p.z < 1.53 and -0.075 < p.y < 0.035:
        return False  # ears
    return p.z > hairline_z(azimuth(p))


def dir_from(phi_deg, z):
    phi = math.radians(phi_deg)
    horiz = Vector((math.sin(phi), -math.cos(phi), 0.0))
    return (horiz * 0.1 + Vector((0, 0, z - H.z))).normalized()


def scalp_point_at(phi_deg, z):
    """Point on the scalp at azimuth phi whose height is close to z (searches the elevation)."""
    best = None
    for k in range(60):
        elev = math.radians(-40 + k * 2.2)
        phi = math.radians(phi_deg)
        d = Vector((math.sin(phi) * math.cos(elev), -math.cos(phi) * math.cos(elev), math.sin(elev)))
        p, n = surface_along(d)
        if best is None or abs(p.z - z) < abs(best[0].z - z):
            best = (p, n)
    return best


def chaikin(points, rounds=2):
    for _ in range(rounds):
        out = [points[0]]
        for a, b in zip(points, points[1:]):
            out.append(a.lerp(b, 0.25))
            out.append(a.lerp(b, 0.75))
        out.append(points[-1])
        points = out
    return points


def resample(points, step):
    out = [points[0]]
    acc = 0.0
    for a, b in zip(points, points[1:]):
        seg = (b - a).length
        if seg < 1e-9:
            continue
        t = step - acc
        while t <= seg:
            out.append(a.lerp(b, t / seg))
            t += step
        acc = (acc + seg) % step
    if (out[-1] - points[-1]).length > step * 0.3:
        out.append(points[-1])
    return out


def push_clear(points, bvh, clearance, keep_first=1):
    """Moves points out along the surface normal so they stay at least `clearance` from a surface."""
    out = []
    for i, p in enumerate(points):
        if i < keep_first:
            out.append(p)
            continue
        loc, normal, _, dist = bvh.find_nearest(p)
        if loc is not None and dist < clearance:
            away = (p - loc)
            if away.length < 1e-6:
                away = normal
            p = loc + away.normalized() * clearance
        out.append(p)
    return out


class TubeBuilder:
    def __init__(self, name):
        self.name = name
        self.verts, self.faces, self.uvs, self.groups, self.colors = [], [], [], [], []

    def add(self, points, radius_fn, weight_fn, shade, twist_phase=0.0):
        pts = resample(points, STEP)
        if len(pts) < 3:
            return
        lengths = [0.0]
        for a, b in zip(pts, pts[1:]):
            lengths.append(lengths[-1] + (b - a).length)
        total = lengths[-1]
        tangent = (pts[1] - pts[0]).normalized()
        normal = tangent.orthogonal().normalized()
        start = len(self.verts)
        rings = []
        for i, p in enumerate(pts):
            t_next = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
            # parallel transport
            axis = tangent.cross(t_next)
            if axis.length > 1e-8:
                angle = math.asin(min(1.0, axis.length))
                normal = Matrix.Rotation(angle, 3, axis.normalized()) @ normal
            tangent = t_next
            binormal = tangent.cross(normal).normalized()
            s = lengths[i] / max(total, 1e-6)
            r = radius_fn(s, total)
            ring = []
            for k in range(SIDES + 1):  # duplicate seam column for clean UVs
                a = 2 * math.pi * k / SIDES + twist_phase
                offset = (normal * math.cos(a) + binormal * math.sin(a)) * r
                ring.append(len(self.verts))
                self.verts.append(p + offset)
                self.uvs.append((k / SIDES, lengths[i] / TILE))
                self.groups.append(weight_fn(p, s))
                self.colors.append(shade)
            rings.append(ring)
        for ra, rb in zip(rings, rings[1:]):
            for k in range(SIDES):
                self.faces.append((ra[k], ra[k + 1], rb[k + 1], rb[k]))
        # rounded tip: collapse the last ring to a point
        tip = len(self.verts)
        self.verts.append(pts[-1] + tangent * radius_fn(1.0, total) * 0.6)
        self.uvs.append((0.5, (total + 0.003) / TILE))
        self.groups.append(weight_fn(pts[-1], 1.0))
        self.colors.append(shade)
        last = rings[-1]
        for k in range(SIDES):
            self.faces.append((last[k], last[k + 1], tip))

    def build(self, material, extra_materials=()):
        mesh = bpy.data.meshes.new(self.name)
        mesh.from_pydata([tuple(v) for v in self.verts], [], self.faces)
        uv = mesh.uv_layers.new(name='UVMap')
        for poly in mesh.polygons:
            for li in poly.loop_indices:
                uv.data[li].uv = self.uvs[mesh.loops[li].vertex_index]
        col = mesh.color_attributes.new('Col', 'BYTE_COLOR', 'POINT')
        for i, c in enumerate(self.colors):
            col.data[i].color = (c, c, c, 1.0)
        for poly in mesh.polygons:
            poly.use_smooth = True
        mesh.materials.append(material)
        for m in extra_materials:
            mesh.materials.append(m)
        obj = bpy.data.objects.new(self.name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        names = sorted({g for gw in self.groups for g in gw})
        vgs = {n: obj.vertex_groups.new(name=n) for n in names}
        for i, gw in enumerate(self.groups):
            for n, w in gw.items():
                if w > 0:
                    vgs[n].add([i], w, 'REPLACE')
        attach(obj)
        return obj


def attach(obj):
    obj.parent = RIG
    obj.matrix_parent_inverse = RIG.matrix_world.inverted()
    mod = obj.modifiers.new('Armature', 'ARMATURE')
    mod.object = RIG


# ------------------------------------------------------------------------------------------------ bones
HAIR_BONES = {}


def add_hair_bones():
    bpy.context.view_layer.objects.active = RIG
    RIG.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = RIG.data.edit_bones
    head = eb['DEF-Head']

    def chain(prefix, points):
        parent = head
        names = []
        for i, (a, b) in enumerate(zip(points, points[1:])):
            b_ = eb.new(f'{prefix}{i + 1}')
            b_.head, b_.tail = a, b
            b_.parent = parent
            b_.use_connect = False
            b_.use_deform = True
            parent = b_
            names.append(b_.name)
        return names

    back_y = H.y + 0.085
    HAIR_BONES['back'] = chain('DEF-KAIRO-HairBack', [Vector((0, back_y, 1.445)), Vector((0, back_y + 0.012, 1.355)),
                                                     Vector((0, back_y + 0.018, 1.265)), Vector((0, back_y + 0.02, 1.175))])
    for side, sx in (('L', 1), ('R', -1)):
        HAIR_BONES['side_' + side] = chain(f'DEF-KAIRO-HairSide.{side}', [Vector((0.094 * sx, -0.074, 1.475)), Vector((0.099 * sx, -0.07, 1.395)),
                                                                         Vector((0.104 * sx, -0.064, 1.310))])
    bpy.ops.object.mode_set(mode='OBJECT')
    # Rename so Blender's .L/.R mirror convention stays (bones were created with the suffix in the prefix).
    for side in ('L', 'R'):
        for name in HAIR_BONES['side_' + side]:
            pass


def chain_weights(chain_names, top_z, bottom_z):
    """Weight function along a vertical chain: head above top_z, then blended per bone by height."""
    n = len(chain_names)
    seg = (top_z - bottom_z) / n

    def fn(p, s):
        if p.z >= top_z:
            return {'DEF-Head': 1.0}
        f = (top_z - p.z) / seg
        i = int(min(n - 1, math.floor(f)))
        frac = f - i
        if i == 0 and frac < 0.35:
            w = frac / 0.35
            return {'DEF-Head': 1 - w, chain_names[0]: w}
        if i < n - 1 and frac > 0.65:
            w = (frac - 0.65) / 0.35
            return {chain_names[i]: 1 - w, chain_names[i + 1]: w}
        return {chain_names[i]: 1.0}
    return fn


def head_weight(p, s):
    return {'DEF-Head': 1.0}


# ------------------------------------------------------------------------------------------------ materials
def hair_material():
    mat = bpy.data.materials.get('KAIRO_Hair') or bpy.data.materials.new('KAIRO_Hair')
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    attr = nt.nodes.new('ShaderNodeVertexColor')
    attr.layer_name = 'Col'
    mix = nt.nodes.new('ShaderNodeMix')
    mix.data_type, mix.blend_type = 'RGBA', 'MULTIPLY'
    mix.inputs['Factor'].default_value = 1.0
    mix.inputs['A'].default_value = (0.020, 0.013, 0.009, 1.0)
    nt.links.new(attr.outputs['Color'], mix.inputs['B'])
    nt.links.new(mix.outputs['Result'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.5
    bsdf.inputs['Specular IOR Level'].default_value = 0.3
    nrm_path = TEXTURES / 'hair_twist_normal.png'
    if nrm_path.exists():
        tex = nt.nodes.new('ShaderNodeTexImage')
        tex.image = bpy.data.images.load(str(nrm_path), check_existing=True)
        tex.image.colorspace_settings.name = 'Non-Color'
        nmap = nt.nodes.new('ShaderNodeNormalMap')
        nmap.inputs['Strength'].default_value = 1.0
        nt.links.new(tex.outputs['Color'], nmap.inputs['Color'])
        nt.links.new(nmap.outputs['Normal'], bsdf.inputs['Normal'])
    return mat


def flat_material(name, color, roughness, metallic=0.0, coat=0.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    if coat:
        bsdf.inputs['Coat Weight'].default_value = coat
    return mat


# ------------------------------------------------------------------------------------------------ geometry
def scalp_layer(material):
    """Dark hair layer over the scalp inside the hairline, offset from the skin."""
    deps = bpy.context.evaluated_depsgraph_get()
    ev = HEAD.evaluated_get(deps)
    src = ev.to_mesh()
    bm = bmesh.new()
    bm.from_mesh(src)
    ev.to_mesh_clear()
    bm.transform(HEAD.matrix_world)
    bm.normal_update()
    keep = [f for f in bm.faces if all(in_hair_zone(v.co) for v in f.verts)]
    drop = [f for f in bm.faces if f not in set(keep)]
    bmesh.ops.delete(bm, geom=drop, context='FACES')
    loose = [v for v in bm.verts if not v.link_faces]
    bmesh.ops.delete(bm, geom=loose, context='VERTS')
    bm.normal_update()
    for v in bm.verts:
        v.co += v.normal * SCALP_OFF
    mesh = bpy.data.meshes.new('KAIRO_HairScalp')
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.clear()
    mesh.materials.append(material)
    for p in mesh.polygons:
        p.use_smooth = True
        p.material_index = 0
    obj = bpy.data.objects.new('KAIRO_HairScalp', mesh)
    bpy.context.scene.collection.objects.link(obj)
    vg = obj.vertex_groups.new(name='DEF-Head')
    vg.add(list(range(len(mesh.vertices))), 1.0, 'REPLACE')
    attach(obj)
    return obj


def bun_frame():
    centre = Vector((0.0, top.y + 0.016, top.z + 0.022))
    return centre


def updo_start_z(phi):
    """Root height of an updo loc: the hairline in front, rising behind the ears to the half-up parting."""
    a = abs(phi)
    if a <= 108.0:
        return hairline_z(phi)
    t = min(1.0, (a - 108.0) / 30.0)
    t = t * t * (3 - 2 * t)
    return hairline_z(phi) * (1 - t) + PART_Z * t


def updo_loc(builder, phi, start_z, r):
    """One loc from its root at azimuth phi over the scalp into the base of the bun; r supplies its randomness."""
    centre = bun_frame()
    base_r = 0.030
    s, n = scalp_point_at(phi, start_z)
    start = s + n * (SCALP_OFF + LOC_R * 0.9)
    a = math.radians(phi)
    end = centre + Vector((math.sin(a) * base_r, -math.cos(a) * base_r * 0.9, -0.012))
    pts = []
    d0, d1 = (start - H).normalized(), (end - H).normalized()
    for i in range(14):
        t = i / 13
        d = d0.slerp(d1, t) if hasattr(d0, 'slerp') else d0.lerp(d1, t).normalized()
        p, nn = surface_along(d)
        lift = SCALP_OFF + LOC_R * (0.9 + 1.1 * t)
        pts.append(p + nn * lift)
    pts[-1] = end
    pts = chaikin(pts, 2)
    shade = 0.85 + r.random() * 0.3
    scale = r.uniform(0.9, 1.1)
    builder.add(pts, lambda s, total, k=scale: LOC_R * k * (0.94 + 0.06 * math.sin(s * 9)), head_weight, shade, r.random() * 6.28)


def updo_locs(builder):
    count = 0
    for row, (dz, step, jitter) in enumerate(((0.003, 7.4, 0.0), (0.020, 8.6, 3.7), (0.040, 10.5, 1.6))):
        phi = -108.0 + jitter
        while phi <= 108.0:
            updo_loc(builder, phi, hairline_z(phi) + dz, rng)
            count += 1
            phi += step + rng.uniform(-1.0, 1.0)
    # Back of the crown: locs rooted along the half-up parting and gathered up into the back of the bun, so no bare
    # scalp shows between the bun and the hanging locs. Their own seed leaves every other loc as in earlier builds.
    back = random.Random(20261023)
    for dz, step, jitter in ((0.002, 8.0, 0.0), (0.019, 9.2, 4.0), (0.037, 10.8, 2.0)):
        phi = 108.0 + step * 0.5 + jitter
        while phi <= 252.0 - step * 0.5:
            a = phi if phi <= 180.0 else phi - 360.0
            updo_loc(builder, a, updo_start_z(a) + dz, back)
            count += 1
            phi += step + back.uniform(-1.0, 1.0)
    return count


def bun(builder, core_material):
    centre = bun_frame()
    coils = 11
    for c in range(coils):
        turns = 1.6 + rng.random() * 0.8
        phase = c * 2 * math.pi / coils + rng.random() * 0.4
        tilt = rng.uniform(-0.25, 0.25)
        pts = []
        steps = 90
        for i in range(steps):
            t = i / (steps - 1)
            ang = phase + t * turns * 2 * math.pi
            h = t * 0.068
            rad = 0.056 * math.sqrt(max(0.0, 1 - (h / 0.072) ** 2)) * (0.92 + 0.08 * math.sin(c + t * 5))
            p = centre + Vector((math.cos(ang) * rad, math.sin(ang) * rad * 0.92, h - 0.006 + tilt * rad * math.sin(ang)))
            pts.append(p)
        builder.add(pts, lambda s, total: LOC_R * 1.12, head_weight, 0.85 + rng.random() * 0.3, rng.random() * 6.28)
    # Core so no gaps show between coils.
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, radius=1.0, location=centre + Vector((0, 0, 0.026)))
    core = bpy.context.active_object
    core.name = 'KAIRO_HairBunCore'
    core.scale = (0.05, 0.047, 0.038)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    core.data.materials.append(core_material)
    for p in core.data.polygons:
        p.use_smooth = True
    vg = core.vertex_groups.new(name='DEF-Head')
    vg.add(list(range(len(core.data.vertices))), 1.0, 'REPLACE')
    attach(core)
    return coils, core


def back_locs(builder):
    chain = HAIR_BONES['back']
    wfn = chain_weights(chain, 1.445, 1.175)
    count = 0
    for z0, spread, step in ((1.455, 64, 9.0), (1.49, 58, 10.0), (1.525, 48, 11.0)):
        phi = 180.0 - spread
        while phi <= 180.0 + spread:
            ph = phi if phi <= 180 else phi - 360
            s, n = scalp_point_at(ph, z0)
            start = s + n * (SCALP_OFF + LOC_R)
            length = 0.24 + rng.random() * 0.08
            pts = [start]
            # Follow the back of the head down to the occiput, then hang with clearance from neck and back.
            p = start
            for i in range(40):
                p = p + Vector((0, 0.004, -0.009))
                pts.append(p)
                if p.z < 1.42:
                    break
            # Hang: gather gradually toward the centre line (no sideways step where the loc leaves the head). A ray
            # that passes beside the neck misses the body, and a miss must not push the loc out.
            drop, xs, ys = [], [], []
            hang = 0.0
            while hang < length:
                hang += 0.012
                x = p.x * (1 - 0.3 * hang / length)
                hit, _, _, _ = BODY_BVH.ray_cast(Vector((x, 0.6, p.z - hang)), Vector((0, -1, 0)), 1.2)
                drop.append(hang)
                xs.append(x)
                ys.append(hit.y + BACK_CLEAR + LOC_R if hit is not None else p.y)
            # Drape: once clear of the back a loc never steps back in, and it leans out at most 0.6 m per metre of
            # drop ahead of the shoulder blades instead of stepping out.
            for i in range(len(ys)):
                ys[i] = max(ys[i], ys[i - 1] if i else p.y)
            for i in range(len(ys) - 2, -1, -1):
                ys[i] = max(ys[i], ys[i + 1] - 0.6 * 0.012)
            for hang, x, y in zip(drop, xs, ys):
                pts.append(Vector((x, y + 0.003 * math.sin(hang * 30 + p.x * 50), p.z - hang)))
            pts = push_clear(chaikin(pts, 2), HEAD_BVH, SCALP_OFF + LOC_R, keep_first=2)
            pts = push_clear(pts, BODY_BVH, BACK_CLEAR - 0.004 + LOC_R, keep_first=4)
            builder.add(pts, lambda s, total: LOC_R * (1.0 - 0.18 * s), wfn, 0.85 + rng.random() * 0.3, rng.random() * 6.28)
            count += 1
            phi += step + rng.uniform(-1.5, 1.5)
    return count


def face_framing(builder):
    count = 0
    for side, sx in (('L', 1), ('R', -1)):
        chain = HAIR_BONES['side_' + side]
        wfn = chain_weights(chain, 1.475, 1.310)
        for k, (phi, drop) in enumerate(((68.0, 0.0), (80.0, 0.012))):
            s, n = scalp_point_at(phi * sx, hairline_z(phi) + 0.006)
            start = s + n * (SCALP_OFF + LOC_R)
            guide = [start,
                     Vector((0.100 * sx + 0.004 * k * sx, -0.076 + 0.006 * k, 1.478 - drop)),
                     Vector((0.112 * sx + 0.004 * k * sx, -0.070 + 0.006 * k, 1.41 - drop)),
                     Vector((0.118 * sx + 0.004 * k * sx, -0.064 + 0.006 * k, 1.34 - drop)),
                     Vector((0.120 * sx + 0.004 * k * sx, -0.060 + 0.006 * k, 1.285 - drop))]
            pts = chaikin(guide, 3)
            pts = push_clear(pts, HEAD_BVH, 0.016 + LOC_R, keep_first=1)
            builder.add(pts, lambda s, total: LOC_R * (1.0 - 0.15 * s), wfn, 0.9 + rng.random() * 0.2, rng.random() * 6.28)
            count += 1
    return count


def gold_accents(gold):
    made = []
    # Earrings: small hoops under each ear lobe (lowest ear vertex).
    for sx in (1, -1):
        ear = [v for v in HEAD_VERTS if v.x * sx > 0.105 and -0.07 < v.y < 0.03 and 1.38 < v.z < 1.50]
        if not ear:
            continue
        lobe = min(ear, key=lambda v: v.z)
        bpy.ops.mesh.primitive_torus_add(major_radius=0.0085, minor_radius=0.00105, major_segments=28, minor_segments=8,
                                         location=lobe + Vector((0.0015 * sx, 0.0, -0.0075)), rotation=(0, math.pi / 2, 0))
        ring = bpy.context.active_object
        ring.name = 'KAIRO_Earring.' + ('L' if sx > 0 else 'R')
        made.append(ring)
    for obj in made:
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        obj.data.materials.append(gold)
        for p in obj.data.polygons:
            p.use_smooth = True
        vg = obj.vertex_groups.new(name='DEF-Head')
        vg.add(list(range(len(obj.data.vertices))), 1.0, 'REPLACE')
        attach(obj)
    return [o.name for o in made]


def join(objs, name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = name
    obj.data.name = name
    return obj


def main():
    report = {'headCentre': list(H), 'crownTop': list(top)}
    for name in [o.name for o in bpy.data.objects if o.name.startswith('KAIRO_Hair') or o.name.startswith('KAIRO_Earring')]:
        bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
    add_hair_bones()
    hair = hair_material()
    scalp_mat = flat_material('KAIRO_HairScalp', (0.02, 0.014, 0.01), 0.8)
    gold = flat_material('KAIRO_Gold', (1.0, 0.72, 0.36), 0.22, metallic=1.0)
    scalp = scalp_layer(scalp_mat)
    up = TubeBuilder('KAIRO_HairUpdo')
    report['updoLocs'] = updo_locs(up)
    report['bunCoils'], core = bun(up, scalp_mat)
    updo = up.build(hair)
    back = TubeBuilder('KAIRO_HairBack')
    report['backLocs'] = back_locs(back)
    back_obj = back.build(hair)
    side = TubeBuilder('KAIRO_HairFrame')
    report['frameLocs'] = face_framing(side)
    side_obj = side.build(hair)
    report['earrings'] = gold_accents(gold)
    # Export markers read by rain_export.py: (export mesh name, subdivision level).
    for obj, export_name in ((scalp, 'Teacher_HairScalp'), (updo, 'Teacher_HairUpdo'), (core, 'Teacher_HairBunCore'),
                             (back_obj, 'Teacher_HairBack'), (side_obj, 'Teacher_HairFrame')):
        obj['kairo_export'] = export_name
        obj['kairo_subsurf'] = 0
    for name in report['earrings']:
        bpy.data.objects[name]['kairo_export'] = 'Teacher_' + name.replace('KAIRO_', '').replace('.', '')
        bpy.data.objects[name]['kairo_subsurf'] = 0
    report['vertices'] = {o.name: len(o.data.vertices) for o in (scalp, updo, core, back_obj, side_obj)}
    report['hairBones'] = HAIR_BONES
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath, compress=True)
    (OUT / 'hair-report.json').write_text(json.dumps(report, indent=1, default=str), encoding='utf8')
    print('HAIR_DONE', json.dumps({k: report[k] for k in ('updoLocs', 'bunCoils', 'backLocs', 'frameLocs', 'vertices')}))


main()
