"""Author the KAIRO Engineering Studio teaching motor (task ENG-001).

A three-phase, four-pole squirrel-cage induction motor (TEFC layout) built from
code so every part has a stable ID, an intentional pivot (the shaft axis at the
origin) and a boolean-capped quarter-section variant for the cutaway view.

Run from the project root:

    tools/blender/blender-4.5.14-windows-x64/blender.exe -b --factory-startup \
        --python design/engineering/blender/build_motor.py -- [--render]

Outputs (all inside ENG-001 scopes):
    studio/public/models/engineering/induction-motor.glb   runtime model
    studio/src/engineering/motorGeometry.json               part manifest + 2D sections
    design/engineering/renders/*.png                         optional preview renders

Blender coordinates: shaft along +X (drive end positive), +Z up, front is -Y.
The glTF exporter converts to Y-up, so the front becomes +Z in three.js.
Dimensions are metres and loosely follow an IEC 132-size frame. The geometry is
an educational model, not a manufacturer's drawing.
"""
import bmesh
import bpy
import hashlib
import json
import math
import os
import sys
import time
from mathutils import Matrix, Vector
from mathutils.geometry import tessellate_polygon

TAU = math.tau
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
GLB_PATH = os.path.join(ROOT, "studio", "public", "models", "engineering", "induction-motor.glb")
GEOMETRY_PATH = os.path.join(ROOT, "studio", "src", "engineering", "motorGeometry.json")
RENDER_DIR = os.path.join(ROOT, "design", "engineering", "renders")

# ---------------------------------------------------------------- dimensions
STATOR_SLOTS = 36
ROTOR_BARS = 28
POLES = 4
CORE_HALF = 0.095          # stator and rotor stack: x in [-0.095, 0.095]
BORE_R = 0.058
ROTOR_R = 0.0572           # 0.8 mm air gap
SHAFT_SEAT_R = 0.0184
SKEW = math.radians(10.0)  # rotor bars skewed by one stator slot pitch
SLOT_CENTRE_R = 0.0695     # mean radius of the copper in a stator slot
BEARING_X = 0.170
SHAFT_HEIGHT = 0.132       # axis height above the mounting surface

MATERIAL_SPECS = {
    # name: (sRGB base colour, metallic, roughness) - fallback PBR values;
    # the studio replaces them at runtime by material name.
    "paint-graphite": ("#2b3f47", 0.25, 0.5),
    "steel-lamination": ("#5d6668", 0.8, 0.42),
    "copper-winding": ("#b7794f", 1.0, 0.33),
    "insulation": ("#d8cfb6", 0.0, 0.75),
    "aluminium-cast": ("#b9bec1", 1.0, 0.42),
    "steel-shaft": ("#c6cbce", 1.0, 0.24),
    "steel-dark": ("#7b8287", 1.0, 0.38),
    "steel-bearing": ("#d7dbde", 1.0, 0.14),
    "polymer-fan": ("#2a3337", 0.0, 0.55),
    "polymer-black": ("#1c2124", 0.0, 0.6),
    "brass": ("#b38a4c", 1.0, 0.32),
    "section-cut": ("#e8e9e4", 0.0, 0.6),
}
MATS = {}
COLLECTION = None
ROOT_EMPTY = None


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_rgba(value):
    value = value.lstrip("#")
    return tuple(srgb_to_linear(int(value[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1.0,)


def make_materials():
    for name, (colour, metallic, roughness) in MATERIAL_SPECS.items():
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        bsdf.inputs["Base Color"].default_value = hex_rgba(colour)
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        mat.diffuse_color = hex_rgba(colour)
        MATS[name] = mat


# ---------------------------------------------------------------- bmesh primitives
def finish(bm):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def transform(bm, matrix):
    bmesh.ops.transform(bm, matrix=matrix, verts=bm.verts)
    return bm


def mirror_x(bm):
    transform(bm, Matrix.Scale(-1.0, 4, (1.0, 0.0, 0.0)))
    bmesh.ops.reverse_faces(bm, faces=bm.faces)
    return finish(bm)


def ring_point(x, r, a):
    return Vector((x, r * math.cos(a), r * math.sin(a)))


def revolve_closed(profile, n, a0=0.0):
    """Revolve a closed (x, r) polygon with r > 0 around the X axis."""
    bm = bmesh.new()
    rings = [[bm.verts.new(ring_point(x, r, a0 + TAU * j / n)) for j in range(n)] for (x, r) in profile]
    for i in range(len(rings)):
        a, b = rings[i], rings[(i + 1) % len(rings)]
        for j in range(n):
            k = (j + 1) % n
            bm.faces.new((a[j], a[k], b[k], b[j]))
    return finish(bm)


def revolve_open(profile, n, a0=0.0):
    """Revolve an (x, r) polyline whose first and last points lie on the axis."""
    bm = bmesh.new()
    rings = []
    for (x, r) in profile:
        if r < 1e-9:
            rings.append(bm.verts.new((x, 0.0, 0.0)))
        else:
            rings.append([bm.verts.new(ring_point(x, r, a0 + TAU * j / n)) for j in range(n)])
    for i in range(len(rings) - 1):
        a, b = rings[i], rings[i + 1]
        for j in range(n):
            k = (j + 1) % n
            if isinstance(a, list) and isinstance(b, list):
                bm.faces.new((a[j], a[k], b[k], b[j]))
            elif isinstance(a, list):
                bm.faces.new((a[j], a[k], b))
            else:
                bm.faces.new((a, b[k], b[j]))
    return finish(bm)


def extrude(loops, ws, twist=None):
    """Extrude 2D (u, v) loops along w; the first loop is the outline, the rest are holes."""
    bm = bmesh.new()
    stations = []
    for w in ws:
        angle = twist(w) if twist else 0.0
        ca, sa = math.cos(angle), math.sin(angle)
        stations.append([[bm.verts.new((u * ca - v * sa, u * sa + v * ca, w)) for (u, v) in loop] for loop in loops])
    for s in range(len(ws) - 1):
        for li, loop in enumerate(loops):
            a, b = stations[s][li], stations[s + 1][li]
            for j in range(len(loop)):
                k = (j + 1) % len(loop)
                bm.faces.new((a[j], a[k], b[k], b[j]))
    triangles = tessellate_polygon([[Vector((u, v, 0.0)) for (u, v) in loop] for loop in loops])
    first = [v for loop in stations[0] for v in loop]
    last = [v for loop in stations[-1] for v in loop]
    for (a, b, c) in triangles:
        bm.faces.new((first[a], first[b], first[c]))
        bm.faces.new((last[a], last[b], last[c]))
    return finish(bm)


# (u, v, w) -> (X, Y, Z) = (w, u, v): extrude along the shaft axis
TO_SHAFT = Matrix(((0, 0, 1, 0), (1, 0, 0, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
# turns a part modelled along +X so that it points up (+Z): (x, 0, 0) -> (0, 0, x)
UP_FROM_X = Matrix.Rotation(-math.pi / 2, 4, "Y")


def merge(dst, src):
    vmap = {v: dst.verts.new(v.co) for v in src.verts}
    for f in src.faces:
        dst.faces.new([vmap[v] for v in f.verts])
    src.free()
    return dst


def prism_x(loops, xs, twist=None):
    return transform(extrude(loops, xs, twist), TO_SHAFT)


def radial_plate(profile_xr, thickness, angle):
    """A plate whose (x, r) outline is extruded tangentially, then turned to angle."""
    bm = extrude([profile_xr], [-thickness / 2, thickness / 2])
    return transform(bm, Matrix.Rotation(angle, 4, "X"))


def box(lo, hi, matrix=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    size = Vector(hi) - Vector(lo)
    centre = (Vector(hi) + Vector(lo)) / 2
    for v in bm.verts:
        v.co = Vector((v.co.x * size.x, v.co.y * size.y, v.co.z * size.z)) + centre
    if matrix is not None:
        transform(bm, matrix)
    return finish(bm)


def circle(r, n, centre=(0.0, 0.0), a0=0.0):
    return [(centre[0] + r * math.cos(a0 + TAU * i / n), centre[1] + r * math.sin(a0 + TAU * i / n)) for i in range(n)]


def cylinder_x(x0, x1, r, n=32):
    return revolve_open([(x0, 0.0), (x0, r), (x1, r), (x1, 0.0)], n)


def sphere(centre, radius, u=18, v=12):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=radius)
    bmesh.ops.translate(bm, vec=Vector(centre), verts=bm.verts)
    return finish(bm)


def sweep(path, radius, sides=8):
    """A capped tube along a polyline using parallel-transport frames."""
    bm = bmesh.new()
    pts = [Vector(p) for p in path]
    tangents = []
    for i in range(len(pts)):
        if i == 0:
            t = pts[1] - pts[0]
        elif i == len(pts) - 1:
            t = pts[-1] - pts[-2]
        else:
            t = pts[i + 1] - pts[i - 1]
        tangents.append(t.normalized())
    ref = Vector((0.0, 0.0, 1.0)) if abs(tangents[0].z) < 0.9 else Vector((0.0, 1.0, 0.0))
    normal = (ref - tangents[0] * ref.dot(tangents[0])).normalized()
    rings = []
    for i, p in enumerate(pts):
        if i:
            normal = tangents[i - 1].rotation_difference(tangents[i]) @ normal
            normal = (normal - tangents[i] * normal.dot(tangents[i])).normalized()
        binormal = tangents[i].cross(normal)
        rings.append([bm.verts.new(p + radius * (math.cos(TAU * j / sides) * normal + math.sin(TAU * j / sides) * binormal)) for j in range(sides)])
    for i in range(len(rings) - 1):
        a, b = rings[i], rings[i + 1]
        for j in range(sides):
            k = (j + 1) % sides
            bm.faces.new((a[j], a[k], b[k], b[j]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])
    return finish(bm)


def bevel_edges(bm, width, segments=2, min_angle=40.0):
    edges = [e for e in bm.edges if e.is_manifold and e.calc_face_angle(0.0) > math.radians(min_angle)]
    if edges:
        bmesh.ops.bevel(bm, geom=edges, offset=width, offset_type="OFFSET", segments=segments,
                        profile=0.5, affect="EDGES", clamp_overlap=True)
    return finish(bm)


def hexagon_x(x0, x1, circumradius, centre_yz):
    loop = circle(circumradius, 6, centre_yz, math.radians(30))
    return prism_x([loop], [x0, x1])


# ---------------------------------------------------------------- objects
class Solid:
    """Accumulates bmesh pieces; each piece keeps its own material slot."""

    def __init__(self):
        self.bm = bmesh.new()
        self.materials = []

    def add(self, piece, material):
        if material not in self.materials:
            self.materials.append(material)
        index = self.materials.index(material)
        vmap = {v: self.bm.verts.new(v.co) for v in piece.verts}
        for f in piece.faces:
            self.bm.faces.new([vmap[v] for v in f.verts]).material_index = index
        piece.free()
        return self


def make_object(name, solid, part, node, variant="full", spin=""):
    mesh = bpy.data.meshes.new(name)
    solid.bm.to_mesh(mesh)
    solid.bm.free()
    for material in solid.materials:
        mesh.materials.append(MATS[material])
    obj = bpy.data.objects.new(name, mesh)
    COLLECTION.objects.link(obj)
    obj.parent = ROOT_EMPTY
    obj["kairo_part"] = part
    obj["kairo_node"] = node
    obj["kairo_variant"] = variant
    if spin:
        obj["kairo_spin"] = spin
    return obj


def apply_modifier(obj, modifier):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = bpy.data.meshes.new_from_object(evaluated, preserve_all_data_layers=True, depsgraph=depsgraph)
    obj.modifiers.remove(modifier)
    old = obj.data
    obj.data = mesh
    bpy.data.meshes.remove(old)
    mesh.name = obj.name


def boolean(obj, operand, operation="DIFFERENCE", material_mode="INDEX", use_self=False):
    modifier = obj.modifiers.new("boolean", "BOOLEAN")
    modifier.operation = operation
    modifier.operand_type = "OBJECT"
    modifier.object = operand
    modifier.solver = "EXACT"
    modifier.use_self = use_self
    modifier.material_mode = material_mode
    apply_modifier(obj, modifier)


def helper_object(name, bm, material=None):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    if material:
        mesh.materials.append(MATS[material])
    obj = bpy.data.objects.new(name, mesh)
    COLLECTION.objects.link(obj)
    return obj


def remove_object(obj):
    mesh = obj.data
    bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.meshes.remove(mesh)


def self_union(obj):
    """Resolve overlapping components into one clean solid."""
    far = helper_object("far", box((5, 5, 5), (5.01, 5.01, 5.01)))
    boolean(obj, far, use_self=True)
    remove_object(far)


def subtract(obj, bm):
    cutter = helper_object(obj.name + "-cutter", bm)
    boolean(obj, cutter, use_self=True)
    remove_object(cutter)


def finish_shading(obj, angle=50.0):
    obj.data.shade_smooth()
    obj.data.set_sharp_from_angle(angle=math.radians(angle))


# ---------------------------------------------------------------- parts
def build_housing():
    s = Solid()
    shell = revolve_closed([
        (-0.150, 0.0940), (0.150, 0.0940), (0.150, 0.1100), (0.1405, 0.1100), (0.1392, 0.1060),
        (-0.1392, 0.1060), (-0.1405, 0.1100), (-0.150, 0.1100)], 144)
    s.add(bevel_edges(shell, 0.0008), "paint-graphite")
    fin = [(-0.1360, 0.1040), (0.1360, 0.1040), (0.1360, 0.1100), (0.1240, 0.1215), (-0.1240, 0.1215), (-0.1360, 0.1100)]
    for k in range(36):
        deg = 5 + 10 * k
        if 60 < deg < 120 or 215 < deg < 325:
            continue  # flat band for the terminal box; feet underneath
        s.add(bevel_edges(radial_plate(fin, 0.0036, math.radians(deg)), 0.0007), "paint-graphite")
    # terminal-box pad, shaped to the shell
    arc = [(0.102 * math.cos(math.radians(a)), 0.102 * math.sin(math.radians(a))) for a in range(58, 123, 4)]
    pad = [(0.054, 0.112)] + [(0.054, 0.0865)] + arc[1:-1] + [(-0.054, 0.0865), (-0.054, 0.112)]
    s.add(bevel_edges(prism_x([pad[::-1]], [-0.046, 0.076]), 0.001), "paint-graphite")
    # feet: a pedestal web under the shell and a drilled plate
    for xf in (-0.105, 0.105):
        web_arc = [(0.100 * math.cos(math.radians(a)), 0.100 * math.sin(math.radians(a))) for a in range(316, 223, -6)]
        web = [(0.075, -0.118)] + web_arc + [(-0.075, -0.118)]
        s.add(bevel_edges(prism_x([web], [xf - 0.016, xf + 0.016]), 0.001), "paint-graphite")
        s.add(bevel_edges(box((xf - 0.024, -0.104, -SHAFT_HEIGHT), (xf + 0.024, 0.104, -0.116)), 0.0012), "paint-graphite")
    # end-shield bolt lugs on both flanges
    for sign in (-1, 1):
        x0, x1 = sorted((sign * 0.138, sign * 0.150))
        for deg in (45, 135, 225, 315):
            a = math.radians(deg)
            centre = (0.1155 * math.cos(a), 0.1155 * math.sin(a))
            s.add(prism_x([circle(0.0065, 20, centre)], [x0, x1]), "paint-graphite")
            s.add(box((x0, 0.104, -0.0065), (x1, 0.1155, 0.0065), Matrix.Rotation(a, 4, "X")), "paint-graphite")
    obj = make_object("housing", s, "housing", "housing")
    self_union(obj)
    holes = bmesh.new()
    for xf in (-0.105, 0.105):
        for yf in (-0.086, 0.086):
            merge(holes, transform(cylinder_x(-0.15, -0.10, 0.0058, 20), Matrix.Translation((xf, yf, 0.0)) @ UP_FROM_X))
    subtract(obj, holes)
    return [obj]


def build_terminal_box():
    s = Solid()
    s.add(bevel_edges(box((-0.040, -0.050, 0.111), (0.070, 0.050, 0.166)), 0.002, 2), "paint-graphite")
    base = make_object("terminal-box", s, "terminal-box", "terminal-box")
    subtract(base, box((-0.0355, -0.0455, 0.1155), (0.0655, 0.0455, 0.175)))
    extra = Solid()
    # cable gland on the front wall
    gland = transform(cylinder_x(0.0, 0.016, 0.0092, 28), Matrix.Translation((0.015, -0.049, 0.1385)) @ Matrix.Rotation(-math.pi / 2, 4, "Z"))
    extra.add(gland, "polymer-black")
    nut = transform(hexagon_x(0.0, 0.006, 0.0118, (0.0, 0.0)), Matrix.Translation((0.015, -0.051, 0.1385)) @ Matrix.Rotation(-math.pi / 2, 4, "Z"))
    extra.add(nut, "polymer-black")
    # terminal board with six studs; star links on the back row
    extra.add(bevel_edges(box((-0.022, -0.030, 0.1150), (0.052, 0.030, 0.1290)), 0.0012), "insulation")
    for x in (-0.008, 0.015, 0.038):
        for y in (-0.013, 0.013):
            place = Matrix.Translation((x, y, 0.0)) @ UP_FROM_X
            extra.add(transform(cylinder_x(0.1290, 0.1455, 0.0028, 16), place), "brass")
            extra.add(transform(hexagon_x(0.1310, 0.1350, 0.0052, (0.0, 0.0)), place), "brass")
    extra.add(bevel_edges(box((-0.0135, 0.0095, 0.1352), (0.0435, 0.0165, 0.1372)), 0.0004), "brass")
    extras = make_object("terminal-box-fittings", extra, "terminal-box", "terminal-box")
    join_into(base, extras)
    self_union(base)
    lid = Solid()
    lid.add(bevel_edges(box((-0.042, -0.052, 0.166), (0.072, 0.052, 0.1715)), 0.0018, 2), "paint-graphite")
    for x in (-0.034, 0.064):
        for y in (-0.044, 0.044):
            lid.add(transform(cylinder_x(0.1715, 0.1745, 0.0034, 16), Matrix.Translation((x, y, 0.0)) @ UP_FROM_X), "steel-dark")
    lid_obj = make_object("terminal-box-lid", lid, "terminal-box", "terminal-box-lid")
    return [base, lid_obj]


def join_into(target, other):
    """Append other's mesh to target (keeps per-face materials)."""
    bm = bmesh.new()
    bm.from_mesh(target.data)
    offset = len(target.data.materials)
    for mat in other.data.materials:
        target.data.materials.append(mat)
    other_bm = bmesh.new()
    other_bm.from_mesh(other.data)
    vmap = {v: bm.verts.new(v.co) for v in other_bm.verts}
    for f in other_bm.faces:
        bm.faces.new([vmap[v] for v in f.verts]).material_index = f.material_index + offset
    other_bm.free()
    bm.to_mesh(target.data)
    bm.free()
    remove_object(other)


def stator_bore_loop():
    pts = []
    for k in range(STATOR_SLOTS):
        phi = TAU * k / STATOR_SLOTS
        local = [(0.0580, -0.00125), (0.0593, -0.00125), (0.0598, -0.00275), (0.0755, -0.00375)]
        local += [(0.0755 + 0.00375 * math.cos(math.radians(d)), 0.00375 * math.sin(math.radians(d))) for d in (-60, -30, 0, 30, 60)]
        local += [(0.0755, 0.00375), (0.0598, 0.00275), (0.0593, 0.00125), (0.0580, 0.00125)]
        pts += [(u * math.cos(phi) - v * math.sin(phi), u * math.sin(phi) + v * math.cos(phi)) for (u, v) in local]
        a0 = phi + math.asin(0.00125 / BORE_R)
        a1 = phi + TAU / STATOR_SLOTS - math.asin(0.00125 / BORE_R)
        pts += [(BORE_R * math.cos(a0 + (a1 - a0) * i / 4), BORE_R * math.sin(a0 + (a1 - a0) * i / 4)) for i in range(1, 4)]
    return pts


def build_stator_core():
    s = Solid()
    s.add(prism_x([circle(0.0938, 144), stator_bore_loop()], [-CORE_HALF, CORE_HALF]), "steel-lamination")
    return [make_object("stator-core", s, "stator-core", "stator-core")]


def slot_phase(k):
    """Single-layer, four-pole, 36-slot winding: three slots per phase belt."""
    return ["U+", "W-", "V+", "U-", "W+", "V-"][(k // 3) % 6]


def slot_local_to_yz(points, phi):
    return [(u * math.cos(phi) - v * math.sin(phi), u * math.sin(phi) + v * math.cos(phi)) for (u, v) in points]


def end_turn_path(slot_a, slot_b, tier, nest, sign):
    pa = TAU * slot_a / STATOR_SLOTS
    pb = TAU * slot_b / STATOR_SLOTS
    if pb <= pa:
        pb += TAU
    x0 = 0.0960
    lift = 0.010 + 0.008 * tier + 0.003 * nest
    dr = 0.004 * tier + 0.0012 * nest
    path = [(x0, SLOT_CENTRE_R, pa), (x0 + 0.006, SLOT_CENTRE_R, pa)]
    for i in range(1, 22):
        t = i / 22
        phi = pa + (pb - pa) * (t - math.sin(TAU * t) / TAU)
        path.append((x0 + 0.006 + lift * math.sin(math.pi * t), SLOT_CENTRE_R + dr * math.sin(math.pi * t), phi))
    path += [(x0 + 0.006, SLOT_CENTRE_R, pb), (x0, SLOT_CENTRE_R, pb)]
    return [(sign * x, r * math.cos(phi), r * math.sin(phi)) for (x, r, phi) in path]


def winding_coils():
    """Concentric coil groups (pitches 7, 9, 11) for each phase and pole pair."""
    coils = []
    for phase, start, tier in (("u", 0, 0), ("v", 6, 1), ("w", 12, 2)):
        for pair in (0, 18):
            go = [start + pair + i for i in range(3)]
            back = [(start + pair + 9 + i) % STATOR_SLOTS for i in range(3)]
            for nest, (a, b) in enumerate(zip(go[::-1], back)):
                coils.append((phase, a, b, tier, nest))
    return coils


def build_windings():
    conductor = [(0.0602, -0.00257), (0.0753, -0.0035)]
    conductor += [(0.0755 + 0.00345 * math.cos(math.radians(d)), 0.00345 * math.sin(math.radians(d))) for d in (-60, -30, 0, 30, 60)]
    conductor += [(0.0753, 0.0035), (0.0602, 0.00257)]
    wedge = [(0.05935, -0.0012), (0.0597, -0.0026), (0.0601, -0.00265), (0.0601, 0.00265), (0.0597, 0.0026), (0.05935, 0.0012)]
    phases = {p: Solid() for p in "uvw"}
    insulation = Solid()
    for k in range(STATOR_SLOTS):
        phi = TAU * k / STATOR_SLOTS
        phase = slot_phase(k)[0].lower()
        phases[phase].add(prism_x([slot_local_to_yz(conductor, phi)], [-0.0965, 0.0965]), "copper-winding")
        insulation.add(prism_x([slot_local_to_yz(wedge, phi)], [-0.0962, 0.0962]), "insulation")
    for (phase, a, b, tier, nest) in winding_coils():
        for sign in (1, -1):
            phases[phase].add(sweep(end_turn_path(a, b, tier, nest, sign), 0.0024, 8), "copper-winding")
    objects = []
    for phase in "uvw":
        obj = make_object(f"stator-windings_{phase}", phases[phase], "stator-windings", "stator-windings")
        obj["kairo_phase"] = phase.upper()
        self_union(obj)
        objects.append(obj)
    objects.append(make_object("stator-windings_insulation", insulation, "stator-windings", "stator-windings"))
    return objects


def rotor_outline(surface_r, neck_half, circle_r, circle_c):
    pts = []
    meet = circle_c + math.sqrt(circle_r ** 2 - neck_half ** 2)
    alpha = math.degrees(math.atan2(neck_half, meet - circle_c))
    for k in range(ROTOR_BARS):
        theta = TAU * k / ROTOR_BARS
        local = [(surface_r, -neck_half), (meet, -neck_half)]
        steps = 12
        for i in range(1, steps):
            d = -alpha - (360 - 2 * alpha) * i / steps
            local.append((circle_c + circle_r * math.cos(math.radians(d)), circle_r * math.sin(math.radians(d))))
        local += [(meet, neck_half), (surface_r, neck_half)]
        pts += slot_local_to_yz(local, theta)
        a0 = theta + math.asin(neck_half / surface_r)
        a1 = theta + TAU / ROTOR_BARS - math.asin(neck_half / surface_r)
        pts += [(surface_r * math.cos(a0 + (a1 - a0) * i / 5), surface_r * math.sin(a0 + (a1 - a0) * i / 5)) for i in range(1, 5)]
    return pts


def skew(x):
    return SKEW * x / (2 * CORE_HALF)


def build_rotor():
    stations = [-CORE_HALF + 2 * CORE_HALF * i / 8 for i in range(9)]
    core = Solid()
    holes = [circle(0.0185, 64)] + [circle(0.0052, 24, (0.0262 * math.cos(a), 0.0262 * math.sin(a))) for a in [math.radians(22.5 + 45 * i) for i in range(8)]]
    core.add(prism_x([rotor_outline(ROTOR_R, 0.0015, 0.0033, 0.0510)] + holes, stations, skew), "steel-lamination")
    core_obj = make_object("rotor-core", core, "rotor-core", "rotor-assembly", spin="rotor")
    cage = Solid()
    for k in range(ROTOR_BARS):
        theta = TAU * k / ROTOR_BARS
        meet = 0.0510 + math.sqrt(0.0032 ** 2 - 0.00138 ** 2)
        alpha = math.degrees(math.atan2(0.00138, meet - 0.0510))
        local = [(0.05712, -0.00138), (meet, -0.00138)]
        for i in range(1, 12):
            d = -alpha - (360 - 2 * alpha) * i / 12
            local.append((0.0510 + 0.0032 * math.cos(math.radians(d)), 0.0032 * math.sin(math.radians(d))))
        local += [(meet, 0.00138), (0.05712, 0.00138)]
        bar_loop = slot_local_to_yz(local, theta)
        xs = [-0.0975 + 0.195 * i / 8 for i in range(9)]
        cage.add(prism_x([bar_loop[::-1]], xs, skew), "aluminium-cast")
    ring = [(0.0950, 0.0335), (0.1085, 0.0335), (0.1085, 0.0547), (0.1067, 0.0565), (0.0950, 0.0565)]
    blade = [(0.1080, 0.0360), (0.1195, 0.0378), (0.1195, 0.0508), (0.1080, 0.0540)]
    for sign in (1, -1):
        r = revolve_closed(ring, 112)
        if sign < 0:
            mirror_x(r)
        cage.add(r, "aluminium-cast")
        for i in range(8):
            b = radial_plate(blade, 0.003, math.radians(11.25 + 45 * i))
            if sign < 0:
                mirror_x(b)
            cage.add(b, "aluminium-cast")
    cage_obj = make_object("rotor-cage", cage, "rotor-cage", "rotor-assembly", spin="rotor")
    self_union(cage_obj)
    return [core_obj, cage_obj]


def build_shaft():
    s = Solid()
    s.add(revolve_open([
        (-0.2680, 0.0), (-0.2680, 0.0108), (-0.2668, 0.0120), (-0.2000, 0.0120), (-0.2000, 0.0142),
        (-0.1992, 0.0150), (-0.1500, 0.0150), (-0.1500, 0.0168), (-0.1490, 0.0176), (-0.1150, 0.0176),
        (-0.1150, 0.0184), (0.1150, 0.0184), (0.1150, 0.0176), (0.1490, 0.0176), (0.1500, 0.0168),
        (0.1500, 0.0150), (0.1920, 0.0150), (0.1928, 0.0140), (0.2988, 0.0140), (0.3000, 0.0128),
        (0.3000, 0.0)], 64), "steel-shaft")
    obj = make_object("shaft", s, "shaft", "rotor-assembly", spin="rotor")
    subtract(obj, box((0.2080, -0.0040, 0.0105), (0.2860, 0.0040, 0.0200)))
    key = Solid()
    key.add(bevel_edges(box((0.2085, -0.00395, 0.0106), (0.2855, 0.00395, 0.0175)), 0.0006), "steel-dark")
    key_obj = make_object("shaft_key", key, "shaft", "rotor-assembly", spin="rotor")
    return [obj, key_obj]


def groove(centre_r, radius, a_from, a_to, steps, outward):
    pts = []
    for i in range(steps + 1):
        a = math.radians(a_from + (a_to - a_from) * i / steps)
        pts.append((radius * math.sin(a), centre_r + (radius if outward else -radius) * math.cos(a)))
    return pts


def build_bearing(node, xc):
    inner = [(-0.0074, 0.01505), (0.0074, 0.01505), (0.0080, 0.01565), (0.0080, 0.0189), (0.0074, 0.0195)]
    inner += groove(0.0231, 0.0049, 42.3, -42.3, 10, False)
    inner += [(-0.0074, 0.0195), (-0.0080, 0.0189), (-0.0080, 0.01565)]
    outer = [(-0.0074, 0.0310), (0.0074, 0.0310), (0.0080, 0.0304), (0.0080, 0.0271), (0.0074, 0.0265)]
    outer += groove(0.0231, 0.0049, 46.0, -46.0, 10, True)
    outer += [(-0.0074, 0.0265), (-0.0080, 0.0271), (-0.0080, 0.0304)]
    shift = lambda prof: [(x + xc, r) for (x, r) in prof]
    objs = []
    s = Solid().add(revolve_closed(shift(outer), 72), "steel-bearing")
    objs.append(make_object(f"{node}_outer", s, node, node))
    s = Solid().add(revolve_closed(shift(inner), 72), "steel-bearing")
    objs.append(make_object(f"{node}_inner", s, node, node, spin="rotor"))
    s = Solid()
    for k in range(9):
        a = TAU * k / 9
        s.add(sphere((xc, 0.0231 * math.cos(a), 0.0231 * math.sin(a)), 0.0047), "steel-bearing")
    for side in (-1, 1):
        x0 = xc + side * 0.0048
        x1 = xc + side * 0.0058
        s.add(revolve_closed([(min(x0, x1), 0.0212), (max(x0, x1), 0.0212), (max(x0, x1), 0.0250), (min(x0, x1), 0.0250)], 72), "steel-dark")
    objs.append(make_object(f"{node}_balls", s, node, node, spin="bearing-cage"))
    return objs


def build_end_shield(node, sign):
    s = Solid()
    body = revolve_closed([
        (0.1435, 0.0880), (0.1435, 0.0935), (0.1500, 0.0935), (0.1500, 0.1100), (0.1570, 0.1100),
        (0.1600, 0.1070), (0.1600, 0.0920), (0.1740, 0.0470), (0.1840, 0.0420), (0.1880, 0.0380),
        (0.1880, 0.0165), (0.1810, 0.0165), (0.1810, 0.0310), (0.1580, 0.0310), (0.1580, 0.0400),
        (0.1660, 0.0440), (0.1530, 0.0870)], 128)
    s.add(bevel_edges(body, 0.0007), "paint-graphite")
    rib = [(0.1585, 0.1040), (0.1650, 0.1040), (0.1860, 0.0440), (0.1750, 0.0440)]
    for i in range(6):
        s.add(bevel_edges(radial_plate(rib, 0.004, math.radians(30 + 60 * i)), 0.0006), "paint-graphite")
    for deg in (45, 135, 225, 315):
        a = math.radians(deg)
        centre = (0.1155 * math.cos(a), 0.1155 * math.sin(a))
        s.add(prism_x([circle(0.0065, 20, centre)], [0.150, 0.160]), "paint-graphite")
        s.add(box((0.150, 0.104, -0.0065), (0.160, 0.1155, 0.0065), Matrix.Rotation(a, 4, "X")), "paint-graphite")
        s.add(bevel_edges(hexagon_x(0.160, 0.1658, 0.0056, centre), 0.0004), "steel-dark")
    if sign < 0:
        mirror_x(s.bm)
    obj = make_object(node, s, node, node)
    self_union(obj)
    return [obj]


def build_fan():
    s = Solid()
    s.add(revolve_closed([(-0.2365, 0.0121), (-0.2055, 0.0121), (-0.2055, 0.0198), (-0.2065, 0.0206), (-0.2355, 0.0206), (-0.2365, 0.0196)], 48), "polymer-fan")
    s.add(revolve_closed([(-0.2095, 0.0200), (-0.2060, 0.0200), (-0.2060, 0.0905), (-0.2095, 0.0905)], 96), "polymer-fan")
    blade = [(-0.2365, 0.0200), (-0.2060, 0.0200), (-0.2060, 0.0960), (-0.2290, 0.0960), (-0.2365, 0.0885)]
    for i in range(10):
        s.add(bevel_edges(radial_plate(blade, 0.0032, TAU * i / 10), 0.0005), "polymer-fan")
    obj = make_object("fan", s, "fan", "fan", spin="rotor")
    self_union(obj)
    return [obj]


def build_fan_cover():
    s = Solid()
    outer_arc = [(-0.250 - 0.012 * math.sin(math.radians(a)), 0.1102 + 0.012 * math.cos(math.radians(a))) for a in (15, 30, 45, 60, 75)]
    inner_arc = [(-0.250 - 0.0098 * math.sin(math.radians(a)), 0.1102 + 0.0098 * math.cos(math.radians(a))) for a in (75, 60, 45, 30, 15)]
    profile = [(-0.1480, 0.1200), (-0.1480, 0.1222), (-0.2500, 0.1222)] + outer_arc + [
        (-0.2620, 0.1102), (-0.2620, 0.1050), (-0.2598, 0.1050), (-0.2598, 0.1102)] + inner_arc + [(-0.2500, 0.1200)]
    s.add(revolve_closed(profile, 144), "paint-graphite")
    s.add(revolve_open([(-0.2620, 0.0), (-0.2620, 0.0240), (-0.2598, 0.0240), (-0.2598, 0.0)], 48), "paint-graphite")
    for r0 in (0.030, 0.041, 0.052, 0.063, 0.074, 0.085, 0.096):
        s.add(revolve_closed([(-0.2620, r0), (-0.2598, r0), (-0.2598, r0 + 0.005), (-0.2620, r0 + 0.005)], 112), "paint-graphite")
    for i in range(6):
        s.add(box((-0.2621, 0.0225, -0.0021), (-0.2597, 0.1065, 0.0021), Matrix.Rotation(math.radians(30 + 60 * i), 4, "X")), "paint-graphite")
    obj = make_object("fan-cover", s, "fan-cover", "fan-cover")
    self_union(obj)
    return [obj]


# ---------------------------------------------------------------- cutaway
CUTTABLE_TRANSFER = {"housing", "terminal-box", "terminal-box-lid", "end-shield-de", "end-shield-nde", "fan-cover"}
CUTTABLE_INDEX = {"stator-core", "stator-windings_u", "stator-windings_v", "stator-windings_w", "stator-windings_insulation"}


def make_cut_variants(objects):
    cutter = helper_object("quarter-cutter", box((-0.6, -0.6, 0.0), (0.6, 0.0, 0.6)), "section-cut")
    cuts = []
    for obj in objects:
        if obj.name not in CUTTABLE_TRANSFER | CUTTABLE_INDEX:
            continue
        copy = obj.copy()
        copy.data = obj.data.copy()
        copy.name = obj.name + "_cut"
        COLLECTION.objects.link(copy)
        copy["kairo_variant"] = "cut"
        boolean(copy, cutter, material_mode="TRANSFER" if obj.name in CUTTABLE_TRANSFER else "INDEX")
        finish_shading(copy)
        cuts.append(copy)
    remove_object(cutter)
    return cuts


# ---------------------------------------------------------------- 2D sections
def section_loops(obj, plane_co, plane_no, project):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    result = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], dist=1e-7,
                                    plane_co=plane_co, plane_no=plane_no, clear_inner=False, clear_outer=False)
    edges = [e for e in result["geom_cut"] if isinstance(e, bmesh.types.BMEdge)]
    neighbours = {}
    for e in edges:
        a, b = e.verts
        neighbours.setdefault(a, []).append(b)
        neighbours.setdefault(b, []).append(a)
    seen = set()
    loops = []
    for start in list(neighbours):
        if start in seen:
            continue
        loop = [start]
        seen.add(start)
        previous, current = None, start
        while True:
            options = [n for n in neighbours[current] if n is not previous and n not in seen]
            if not options:
                break
            previous, current = current, options[0]
            seen.add(current)
            loop.append(current)
        if len(loop) >= 3:
            pts = []
            for v in loop:
                u, w = project(v.co)
                pts += [round(u * 1000, 2), round(-w * 1000, 2)]
            loops.append(pts)
    bm.free()
    return loops


def triangle_count(mesh):
    return sum(len(p.vertices) - 2 for p in mesh.polygons)


def three_bbox(obj):
    xs = [v.co.x for v in obj.data.vertices]
    ys = [v.co.y for v in obj.data.vertices]
    zs = [v.co.z for v in obj.data.vertices]
    lo = [min(xs), min(zs), -max(ys)]
    hi = [max(xs), max(zs), -min(ys)]
    return {"min": [round(c, 5) for c in lo], "max": [round(c, 5) for c in hi]}


def write_geometry(objects, glb_sha):
    meshes = []
    for obj in sorted(objects, key=lambda o: o.name):
        entry = {
            "name": obj.name,
            "part": obj["kairo_part"],
            "node": obj["kairo_node"],
            "variant": obj["kairo_variant"],
            "spin": obj.get("kairo_spin", ""),
            "materials": [m.name for m in obj.data.materials],
            "triangles": triangle_count(obj.data),
            "bbox": three_bbox(obj),
        }
        if "kairo_phase" in obj:
            entry["phase"] = obj["kairo_phase"]
        if obj["kairo_variant"] == "full":
            entry["side"] = section_loops(obj, Vector((0.0, 1e-5, 0.0)), Vector((0.0, 1.0, 0.0)), lambda c: (c.x, c.z))
            entry["end"] = section_loops(obj, Vector((5e-4, 0.0, 0.0)), Vector((1.0, 0.0, 0.0)), lambda c: (c.y, c.z))
        meshes.append(entry)
    slots = [{"index": k, "angleDeg": round(360.0 * k / STATOR_SLOTS, 3), "phase": slot_phase(k)[0], "sign": 1 if slot_phase(k)[1] == "+" else -1}
             for k in range(STATOR_SLOTS)]
    data = {
        "generator": "design/engineering/blender/build_motor.py",
        "blender": bpy.app.version_string,
        "glb": "/models/engineering/induction-motor.glb",
        "glbSha256": glb_sha,
        "units": "metres in bbox; millimetres in sections (y down)",
        "axes": "three.js: +X drive end, +Y up, +Z front; shaft axis on the X axis",
        "machine": {"type": "three-phase squirrel-cage induction motor", "poles": POLES, "statorSlots": STATOR_SLOTS,
                    "rotorBars": ROTOR_BARS, "skewDeg": math.degrees(SKEW), "slotCentreRadiusMm": SLOT_CENTRE_R * 1000,
                    "boreRadiusMm": BORE_R * 1000, "rotorRadiusMm": ROTOR_R * 1000, "shaftHeightMm": SHAFT_HEIGHT * 1000},
        "slots": slots,
        "meshes": meshes,
        "totals": {"meshes": len(meshes), "triangles": sum(m["triangles"] for m in meshes)},
    }
    os.makedirs(os.path.dirname(GEOMETRY_PATH), exist_ok=True)
    with open(GEOMETRY_PATH, "w", encoding="utf-8") as fh:
        json.dump(data, fh, separators=(",", ":"))
        fh.write("\n")


# ---------------------------------------------------------------- export and preview
def export_glb():
    op = bpy.ops.export_scene.gltf.get_rna_type()
    names = {p.identifier for p in op.properties}
    options = dict(filepath=GLB_PATH, export_format="GLB", use_selection=False, export_yup=True, export_apply=False,
                   export_texcoords=False, export_normals=True, export_tangents=False, export_materials="EXPORT",
                   export_extras=True, export_cameras=False, export_lights=False, export_animations=False)
    bpy.ops.export_scene.gltf(**{k: v for k, v in options.items() if k in names or k == "filepath"})
    with open(GLB_PATH, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def render_previews(objects):
    os.makedirs(RENDER_DIR, exist_ok=True)
    scene = bpy.context.scene
    scene.render.resolution_x, scene.render.resolution_y = 1400, 900
    world = bpy.data.worlds.new("preview-world")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.78, 0.8, 0.78, 1.0)
    scene.world = world
    cam = bpy.data.objects.new("preview-camera", bpy.data.cameras.new("preview-camera"))
    COLLECTION.objects.link(cam)
    cam.data.lens = 50
    scene.camera = cam
    sun = bpy.data.objects.new("preview-sun", bpy.data.lights.new("preview-sun", "SUN"))
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(50), math.radians(10), math.radians(35))
    COLLECTION.objects.link(sun)
    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_WORKBENCH"):
        try:
            scene.render.engine = engine
            if engine == "BLENDER_WORKBENCH":
                scene.display.shading.light = "STUDIO"
                scene.display.shading.color_type = "MATERIAL"
            for view, location in (("front", (0.62, -0.78, 0.40)), ("drive-end", (0.85, -0.22, 0.22))):
                cam.location = location
                look_at(cam, (0.0, 0.0, 0.0))
                for variant in ("full", "cut"):
                    cut_names = {o.name[:-4] for o in objects if o["kairo_variant"] == "cut"}
                    for o in objects:
                        if variant == "full":
                            hidden = o["kairo_variant"] == "cut"
                        else:
                            hidden = o["kairo_variant"] == "full" and o.name in cut_names
                        o.hide_render = hidden
                    scene.render.filepath = os.path.join(RENDER_DIR, f"motor-{view}-{variant}.png")
                    bpy.ops.render.render(write_still=True)
            print("RENDERED", engine)
            return
        except Exception as error:  # Eevee needs a GPU context; fall back to Workbench
            print("RENDER-FALLBACK", engine, error)


def main():
    global COLLECTION, ROOT_EMPTY
    started = time.time()
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    COLLECTION = bpy.context.scene.collection
    ROOT_EMPTY = bpy.data.objects.new("induction-motor", None)
    COLLECTION.objects.link(ROOT_EMPTY)
    ROOT_EMPTY["kairo_model"] = "three-phase squirrel-cage induction motor (educational geometry)"
    make_materials()
    objects = []
    for builder in (build_housing, build_terminal_box, build_stator_core, build_windings, build_rotor, build_shaft,
                    lambda: build_bearing("bearing-de", BEARING_X), lambda: build_bearing("bearing-nde", -BEARING_X),
                    lambda: build_end_shield("end-shield-de", 1), lambda: build_end_shield("end-shield-nde", -1),
                    build_fan, build_fan_cover):
        made = builder()
        for obj in made:
            finish_shading(obj)
        objects += made
        print("BUILT", [o.name for o in made], f"{time.time() - started:.1f}s")
    objects += make_cut_variants(objects)
    print("CUT", f"{time.time() - started:.1f}s")
    os.makedirs(os.path.dirname(GLB_PATH), exist_ok=True)
    sha = export_glb()
    write_geometry(objects, sha)
    print("EXPORTED", GLB_PATH, os.path.getsize(GLB_PATH), sha)
    print("TRIANGLES", sum(triangle_count(o.data) for o in objects))
    if "--render" in ARGS:
        render_previews(objects)
    print("DONE", f"{time.time() - started:.1f}s")


main()
