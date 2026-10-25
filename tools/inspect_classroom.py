import bpy
import json
from mathutils import Vector
from pathlib import Path

root = Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(root / 'assets/reference/classroom/classroom.blend'), load_ui=False)
print('KAIRO_SCENES', [(s.name, len(s.objects)) for s in bpy.data.scenes])
main = next((s for s in bpy.data.scenes if 'main' in s.name.lower()), bpy.context.scene)
bpy.context.window.scene = main
meshes = []
coordinates = []
for instance in bpy.context.evaluated_depsgraph_get().object_instances:
    if instance.object.type != 'MESH': continue
    meshes.append({'name':instance.object.name,'vertices':len(instance.object.data.vertices)})
    coordinates.extend(instance.matrix_world @ Vector(corner) for corner in instance.object.bound_box)
print('KAIRO_INSPECTION', json.dumps({
    'scene': main.name, 'meshInstances': len(meshes),
    'boundsMin': [min(v[a] for v in coordinates) for a in range(3)],
    'boundsMax': [max(v[a] for v in coordinates) for a in range(3)],
    'cameras': [{'name':o.name,'position':list(o.location),'rotation':list(o.rotation_euler)} for o in main.objects if o.type=='CAMERA'],
    'largest': sorted(meshes,key=lambda o:o['vertices'],reverse=True)[:8],
    'gltfOptions': [p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties if any(w in p.identifier for w in ['instance','image','draco'])]
}))
