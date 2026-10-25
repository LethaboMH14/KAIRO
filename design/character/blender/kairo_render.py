"""Shared camera, light and render helpers for KAIRO character renders.

Every candidate and every build is framed by the same rules, so comparison images differ only in the
model: the full-body shot fits the model's height, the three-quarter shot orbits 35 degrees, and the
face shot is centred on the supplied head point with a fixed 0.36 m frame height.
"""
import math
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[3]
STUDIO_HDR = ROOT / 'studio/public/models/engineering/poly_haven_studio_1k.hdr'


def clear_scene():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)


def setup_world(strength=0.9, hdr=STUDIO_HDR):
    scene = bpy.context.scene
    world = bpy.data.worlds.new('KAIRO review world') if scene.world is None else scene.world
    scene.world = world
    world.use_nodes = True
    nodes, links = world.node_tree.nodes, world.node_tree.links
    nodes.clear()
    out = nodes.new('ShaderNodeOutputWorld')
    bg = nodes.new('ShaderNodeBackground')
    bg.inputs['Strength'].default_value = strength
    if hdr and Path(hdr).exists():
        env = nodes.new('ShaderNodeTexEnvironment')
        env.image = bpy.data.images.load(str(hdr), check_existing=True)
        links.new(env.outputs['Color'], bg.inputs['Color'])
    else:
        bg.inputs['Color'].default_value = (0.8, 0.82, 0.8, 1)
    links.new(bg.outputs['Background'], out.inputs['Surface'])


def add_lights(target=Vector((0, 0, 1.2))):
    """Warm key, cool fill and rim. Character faces -Y, so the key sits in front-left (-Y, +X)."""
    made = []
    for name, loc, energy, color, size in (
        ('Key', (1.6, -2.4, 2.6), 380.0, (1.0, 0.93, 0.84), 1.6),
        ('Fill', (-2.2, -1.8, 1.7), 140.0, (0.86, 0.92, 1.0), 2.4),
        ('Rim', (0.6, 2.4, 2.4), 260.0, (1.0, 0.97, 0.92), 1.0),
    ):
        data = bpy.data.lights.new(name, 'AREA')
        data.energy, data.color, data.size = energy, color, size
        light = bpy.data.objects.new(name, data)
        bpy.context.scene.collection.objects.link(light)
        light.location = loc
        direction = target - Vector(loc)
        light.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
        made.append(light)
    return made


def add_floor(size=8.0, color=(0.58, 0.6, 0.57, 1)):
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = 'Review floor'
    mat = bpy.data.materials.new('Review floor')
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value = 0.85
    floor.data.materials.append(mat)
    return floor


def camera_for(view, height, head, fov_deg=30.0):
    """Returns (location, look_at, lens) for a named view. Character faces -Y."""
    sensor = 36.0
    lens = sensor / (2 * math.tan(math.radians(fov_deg) / 2))
    if view == 'face':
        frame_h = 0.36
        dist = frame_h / (2 * math.tan(math.radians(fov_deg) / 2))
        look = Vector(head)
        return look + Vector((0.0, -dist, 0.0)), look, lens
    frame_h = height * 1.12
    dist = frame_h / (2 * math.tan(math.radians(fov_deg) / 2))
    look = Vector((0.0, 0.0, height * 0.52))
    if view == 'front':
        return look + Vector((0.0, -dist, 0.05)), look, lens
    if view == 'three_quarter':
        ang = math.radians(35.0)
        return look + Vector((math.sin(ang) * dist, -math.cos(ang) * dist, 0.05)), look, lens
    if view == 'side':
        return look + Vector((dist, 0.0, 0.05)), look, lens
    if view == 'upper':
        frame_h = height * 0.62
        dist = frame_h / (2 * math.tan(math.radians(fov_deg) / 2))
        look = Vector((0.0, 0.0, height * 0.72))
        ang = math.radians(20.0)
        return look + Vector((math.sin(ang) * dist, -math.cos(ang) * dist, 0.02)), look, lens
    raise ValueError(view)


def place_camera(view, height, head, fov_deg=30.0, aspect=(900, 1200)):
    scene = bpy.context.scene
    cam_obj = scene.camera
    if cam_obj is None:
        cam_obj = bpy.data.objects.new('Review camera', bpy.data.cameras.new('Review camera'))
        scene.collection.objects.link(cam_obj)
        scene.camera = cam_obj
    loc, look, lens = camera_for(view, height, head, fov_deg)
    cam_obj.location = loc
    cam_obj.rotation_euler = (look - loc).to_track_quat('-Z', 'Y').to_euler()
    cam_obj.data.lens = lens
    cam_obj.data.sensor_fit = 'VERTICAL'
    cam_obj.data.sensor_height = 36.0
    cam_obj.data.clip_start = 0.01
    scene.render.resolution_x, scene.render.resolution_y = aspect
    scene.render.resolution_percentage = 100
    return cam_obj


def configure_engine(prefer='BLENDER_EEVEE_NEXT', samples=32):
    scene = bpy.context.scene
    try:
        scene.render.engine = prefer
    except TypeError:
        scene.render.engine = 'BLENDER_EEVEE'
    if scene.render.engine.startswith('BLENDER_EEVEE'):
        scene.eevee.taa_render_samples = samples
        try:
            scene.eevee.use_shadows = True
        except AttributeError:
            pass
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Base Contrast'
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = 'PNG'
    return scene.render.engine


def render_to(path):
    scene = bpy.context.scene
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    return path
