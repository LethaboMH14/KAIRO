"""Prepare the CC0 MPFB model without changing the downloaded original."""
import bpy, json, math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'studio/public/models/teacher'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'assets/reference/teacher/mpfb-original.glb'))
keep = {'Basis', 'jawOpen', 'mouthSmileLeft', 'mouthSmileRight', 'eyeBlinkLeft', 'eyeBlinkRight', 'browInnerUp', 'browDownLeft', 'browDownRight', 'mouthFunnel', 'mouthPucker', 'mouthClose', 'eyeLookInLeft', 'eyeLookInRight', 'eyeLookOutLeft', 'eyeLookOutRight'}
for obj in list(bpy.data.objects):
    if obj.type != 'MESH': continue
    if obj.data.shape_keys:
        for key in list(obj.data.shape_keys.key_blocks):
            if key.name not in keep: obj.shape_key_remove(key)
    for p in obj.data.polygons: p.use_smooth = True
for img in bpy.data.images:
    if img.size[0] > 1024 or img.size[1] > 1024:
        ratio = 1024 / max(img.size)
        img.scale(max(1, int(img.size[0]*ratio)), max(1, int(img.size[1]*ratio)))
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'teacher.glb'), export_format='GLB', export_animations=False, export_morph_normal=False, export_morph_tangent=False, export_image_format='AUTO', export_extras=True)
report = {'meshes':[], 'bones':[]}
for obj in bpy.data.objects:
    if obj.type == 'MESH': report['meshes'].append({'name':obj.name,'vertices':len(obj.data.vertices),'morphs':list(obj.data.shape_keys.key_blocks.keys()) if obj.data.shape_keys else []})
    if obj.type == 'ARMATURE': report['bones'] = list(obj.data.bones.keys())
(OUT/'rig-report.json').write_text(json.dumps(report,indent=2))

# An offline render lets the developer inspect the actual model rather than its marketing image.
scene=bpy.context.scene
scene.render.engine='CYCLES'; scene.cycles.samples=12
scene.render.resolution_x=720; scene.render.resolution_y=900; scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Studio'); scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.72,.74,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.6
bpy.ops.object.camera_add(location=(0,-3.7,1.0))
cam=bpy.context.object; cam.rotation_euler=(Vector((0,0,1.0))-cam.location).to_track_quat('-Z','Y').to_euler(); scene.camera=cam; cam.data.type='ORTHO'; cam.data.ortho_scale=2.1
for location,power,size in [((2,-3,3),380,3),((-2,-2,1),180,3)]:
    bpy.ops.object.light_add(type='AREA',location=location); light=bpy.context.object; light.data.energy=power; light.data.shape='DISK'; light.data.size=size; light.rotation_euler=(Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(ROOT/'assets/reference/teacher/model-inspection.png')
bpy.ops.render.render(write_still=True)
