"""Read-only inspection of the KAIRO render GLB and the motor GLB (no writes)."""
import bpy, sys
from pathlib import Path
ROOT=Path(bpy.path.abspath('//')) if bpy.data.filepath else Path.cwd()
def load(p):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(p))
print('=== KAIRO')
load(Path('design/video-production-20261023/kairo-render.glb'))
for a in bpy.data.actions:
    print('ACTION',a.name,tuple(a.frame_range), 'fcurves', len(a.fcurves) if hasattr(a,'fcurves') else '?')
for o in bpy.context.scene.objects:
    if o.type=='ARMATURE': print('ARM',o.name,len(o.data.bones),'bones', [b.name for b in o.data.bones if 'hand' in b.name.lower() or 'head' in b.name.lower()][:12])
    if o.type=='MESH':
        sk=[k.name for k in o.data.shape_keys.key_blocks] if o.data.shape_keys else []
        print('MESH',o.name,len(o.data.vertices),'shapekeys',len(sk),sk[:60])
import mathutils
mins=[1e9]*3;maxs=[-1e9]*3
for o in bpy.context.scene.objects:
    if o.type=='MESH':
        for c in o.bound_box:
            w=o.matrix_world@mathutils.Vector(c)
            for i in range(3): mins[i]=min(mins[i],w[i]);maxs[i]=max(maxs[i],w[i])
print('KAIRO bounds',mins,maxs)
print('=== MOTOR')
load(Path('studio/public/models/engineering/induction-motor.glb'))
for o in sorted(bpy.context.scene.objects,key=lambda o:o.name):
    ex={k:o[k] for k in o.keys() if k.startswith('kairo')}
    print('OBJ',o.type,o.name,ex, tuple(round(v,3) for v in o.dimensions))
print('MATERIALS',sorted(m.name for m in bpy.data.materials))
