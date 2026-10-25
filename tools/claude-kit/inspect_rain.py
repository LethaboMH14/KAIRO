"""Inspect the source without allowing any bundled Blender scripts to execute."""
import bpy,json,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];dest=ROOT/'assets/reference/claude-kit/rain-inspection'
dest.mkdir(exist_ok=True)
with zipfile.ZipFile(ROOT/'assets/reference/claude-kit/rain-v3.zip') as z:
 name=next(n for n in z.namelist() if n.endswith('.blend'))
 z.extract(name,dest)
bpy.ops.wm.open_mainfile(filepath=str(dest/name),use_scripts=False)
report={'file':name,'autoExecute':False,'note':'Structural inspection only. Rig scripts were not executed; deformation/export acceptance remains.','armatures':[{'name':o.name,'bones':len(o.data.bones)} for o in bpy.data.objects if o.type=='ARMATURE'],'meshes':[{'name':o.name,'vertices':len(o.data.vertices),'shapeKeys':list(o.data.shape_keys.key_blocks.keys()) if o.data.shape_keys else []} for o in bpy.data.objects if o.type=='MESH'],'textBlocks':[t.name for t in bpy.data.texts],'actions':[a.name for a in bpy.data.actions]}
(ROOT/'coordination/briefs/AVATAR-AND-PATHWAYS/rain-inspection.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print('RAIN_INSPECTED',len(report['armatures']),len(report['meshes']),len(report['textBlocks']))
