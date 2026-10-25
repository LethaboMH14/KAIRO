"""Render the existing authored KAIRO source in Blender, without browser capture."""
from pathlib import Path
import sys,json,hashlib,math
import bpy
from mathutils import Vector

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
SOURCE=HERE/'kairo-render.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
sys.path.insert(0,str(ROOT/'design/character/blender'))
import kairo_render as kr

scene=bpy.context.scene
actions=[a.name for a in bpy.data.actions]
arms=[o for o in scene.objects if o.type=='ARMATURE']
if not arms: raise RuntimeError('Authored KAIRO source contains no armature')
arm=arms[0]
action=next((a for a in bpy.data.actions if a.name.lower()=='idle'),None)
if action:
    arm.animation_data_create();arm.animation_data.action=action
    for track in arm.animation_data.nla_tracks: track.mute=True
for obj in scene.objects:
    if obj.type=='MESH' and obj.data.shape_keys:
        for key in obj.data.shape_keys.key_blocks[1:]:
            key.value=.2 if key.name=='mouthSmile' else 0
scene.frame_start=1;scene.frame_end=48;scene.render.fps=24
scene.frame_set(8)
kr.setup_world(.32)
kr.add_lights(Vector((0,0,1.3)))
for o in list(scene.objects):
    if o.type=='CAMERA': bpy.data.objects.remove(o,do_unlink=True)
cam=bpy.data.objects.new('KAIRO production camera',bpy.data.cameras.new('KAIRO production camera'))
scene.collection.objects.link(cam);scene.camera=cam
look=Vector((0,0,1.22))
for frame,loc in [(1,(.5,-3.8,1.55)),(48,(.35,-3.6,1.5))]:
    cam.location=loc
    cam.rotation_euler=(look-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.keyframe_insert(data_path='location',frame=frame)
    cam.keyframe_insert(data_path='rotation_euler',frame=frame)
cam.data.lens=60;cam.data.clip_start=.01
scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=8
scene.cycles.use_denoising=True
scene.render.resolution_x=960;scene.render.resolution_y=540;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.render.film_transparent=True
scene.frame_set(8)
scene.render.filepath=str(HERE/'kairo-production-frame.png')
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(HERE/'kairo-production-stage.blend'))
bpy.ops.render.render(write_still=True)
report={'source':str(SOURCE.relative_to(ROOT)),'source_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'blender_version':bpy.app.version_string,'armature':arm.name,'source_actions':actions,'idle_applied':bool(action),'render_size':[960,540],'engine':'Cycles CPU','samples':8,'prepared_timeline_frames':48,'prepared_fps':24,'rendered_frames':[8],'note':'One real authored-asset lighting/compositing proof frame. Two-second camera move prepared, full animation not rendered. No lip-sync/performance acceptance.','credit':'Teacher based on Rain Rig (CC) Blender Foundation | studio.blender.org, CC-BY 4.0. KAIRO modifications; see source asset credits.'}
(HERE/'blender-verification.json').write_text(json.dumps(report,indent=2))
print('KAIRO_PRODUCTION_FRAME_READY')
