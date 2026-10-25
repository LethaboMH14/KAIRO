"""Convert the CC0 Blender classroom to a browser asset. Original files stay intact."""
import bpy, json
from pathlib import Path
from mathutils import Vector

root = Path(__file__).resolve().parents[1]
out = root / 'studio/public/models/classroom'
out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root / 'assets/reference/classroom/classroom.blend'), load_ui=False)
source = bpy.data.scenes['_mainScene']
bpy.context.window.scene = source
target = bpy.data.scenes.new('KAIRO_Classroom')
cache, anchors = {}, []
for inst in bpy.context.evaluated_depsgraph_get().object_instances:
    obj = inst.object
    if obj.type != 'MESH': continue
    # The original ceiling hides a cutaway inspection. Interior views remain available.
    if any(s in obj.name.lower() for s in ['ceiling', 'dust', 'volume']): continue
    key = obj.original.as_pointer()
    if key not in cache:
        cache[key] = bpy.data.meshes.new_from_object(obj, depsgraph=bpy.context.evaluated_depsgraph_get())
    clone = bpy.data.objects.new(obj.name, cache[key])
    target.collection.objects.link(clone)
    clone.matrix_world = inst.matrix_world.copy()
    if any(s in obj.name.lower() for s in ['board', 'wall', 'floor', 'roof', 'ceil']):
        anchors.append({'name':obj.name,'position':list(inst.matrix_world.translation)})
bpy.context.window.scene = target
for img in bpy.data.images:
    if img.size[0] > 1024 or img.size[1] > 1024:
        ratio = 1024 / max(img.size)
        img.scale(max(1,int(img.size[0]*ratio)),max(1,int(img.size[1]*ratio)))
bpy.ops.export_scene.gltf(filepath=str(out / 'classroom.glb'), export_format='GLB',
    export_animations=False, export_cameras=False, export_lights=False,
    export_image_format='JPEG', export_image_quality=80, export_apply=False)
info = {'source':'https://www.blender.org/download/demo-files/',
    'author':'Christophe Seux','license':'CC0','sourceScene':'_mainScene',
    'objects':len(target.objects),'uniqueMeshes':len(cache),'anchorsBlenderZUp':anchors,
    'conversion':'Realized collection instances; textures capped at 1024; ceiling helpers omitted; glTF Y-up conversion.'}
(out / 'provenance.json').write_text(json.dumps(info,indent=2),encoding='utf-8')
print('KAIRO_EXPORTED',json.dumps({'bytes':(out/'classroom.glb').stat().st_size,**info}))
