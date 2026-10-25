import bpy,addon_utils,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
exec(compile((Path(__file__).parent/'enable_mpfb.py').read_text(),str(Path(__file__).parent/'enable_mpfb.py'),'exec'))
module=sys.modules.get('bl_ext.kairo_local.mpfb')
report={'blender':bpy.app.version_string,'moduleImport':module is not None,'enabled':addon_utils.check('bl_ext.kairo_local.mpfb')[1],'path':str(Path(module.__file__)) if module else None,'globalProfileChanged':False}
before=set(bpy.data.objects.keys())
result=bpy.ops.mpfb.create_human()
created=[o for o in bpy.data.objects if o.name not in before and o.type=='MESH']
report['createHumanResult']=list(result)
report['createdMeshes']=[{'name':o.name,'vertices':len(o.data.vertices),'polygons':len(o.data.polygons)} for o in created]
if not created:raise RuntimeError('MPFB enabled but no human mesh was created')
(ROOT/'coordination/briefs/AVATAR-AND-PATHWAYS/mpfb-install.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print('KAIRO_MPFB_RESULT',json.dumps(report))
if not report['enabled']:raise RuntimeError('MPFB did not enable')
