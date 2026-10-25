"""Low-resolution motion proof from the packed production .blend, not final ad."""
from pathlib import Path
import bpy,time,json
HERE=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(HERE/'kairo-production-stage.blend'))
scene=bpy.context.scene
scene.render.resolution_x=640;scene.render.resolution_y=360
scene.render.resolution_percentage=100
scene.cycles.samples=4;scene.cycles.use_denoising=True
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
(HERE/'native-frames').mkdir(exist_ok=True)
scene.render.filepath=str(HERE/'native-frames/frame-')
start=time.monotonic()
bpy.ops.render.render(animation=True)
paths=list((HERE/'native-frames').glob('*.png'))
if len(paths)!=48:raise RuntimeError(f'Expected48 frames, got{len(paths)}')
(HERE/'native-animation-render.json').write_text(json.dumps({'frames':len(paths),'size':[640,360],'fps':24,'render_seconds':time.monotonic()-start,'engine':'Cycles CPU4samples denoised','purpose':'Actual authored KAIRO idle/camera animation proof; no lip-sync or final ad claim'},indent=2))
print('NATIVE_MOTION_PROOF_READY')
