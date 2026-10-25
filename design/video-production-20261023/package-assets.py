from pathlib import Path
import json,subprocess,zipfile,hashlib
import imageio_ffmpeg

HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1]
report=HERE/'native-animation-render.json'
if not report.exists():raise RuntimeError('Native animation render has not finished')
data=json.loads(report.read_text());assert data['frames']==48
FF=imageio_ffmpeg.get_ffmpeg_exe()
output=HERE/'kairo-native-motion-test.mp4'
font='../../studio/src/experience/fonts/Manrope-wght.ttf'
vf=f"format=rgb24,drawbox=x=0:y=0:w=iw:h=28:color=0x172820:t=fill,drawtext=fontfile={font}:text='KAIRO / Native animation proof - no lip sync':x=12:y=6:fontsize=14:fontcolor=white,drawbox=x=0:y=330:w=iw:h=30:color=0x172820:t=fill,drawtext=fontfile={font}:text='Based on Rain Rig - Blender Foundation - CC BY 4.0 - KAIRO modifications':x=10:y=339:fontsize=10:fontcolor=white,format=yuv420p"
subprocess.run([FF,'-y','-loglevel','error','-framerate','24','-start_number','1','-i','native-frames/frame-%04d.png','-vf',vf,'-frames:v','48','-c:v','libx264','-crf','18','-preset','fast','-movflags','+faststart',str(output)],cwd=HERE,check=True)
frames,seconds=imageio_ffmpeg.count_frames_and_secs(str(output));assert frames==48 and seconds==2
data.update(encoded_output=output.name,decoded_frames=frames,decoded_seconds=seconds)
report.write_text(json.dumps(data,indent=2))
files=[HERE/'kairo-aoede-20s-production-preview.mp4',output,HERE/'kairo-production-stage.blend',HERE/'kairo-production-frame.png',HERE/'voice/kairo-narration-17s.mp3',HERE/'voice/voice-cut-20s.mp3',ROOT/'docs/video-production-20261023/README.md',ROOT/'docs/video-production-20261023/LUMA-PASTE-FIRST.txt',ROOT/'docs/video-production-20261023/CLAUDE-CONTINUE.md',ROOT/'design/brand-master-20261023/master/kairo-lockup-horizontal-chalk.svg',ROOT/'studio/public/models/character/CREDITS.txt']
bundle=HERE/'kairo-production-assets.zip'
with zipfile.ZipFile(bundle,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for file in files:z.write(file,str(file.relative_to(ROOT)))
with zipfile.ZipFile(bundle) as z:assert z.testzip() is None
manifest={'bundle':bundle.name,'bytes':bundle.stat().st_size,'zip_crc':'passed','files':[str(p.relative_to(ROOT)) for p in files],'sha256':hashlib.sha256(bundle.read_bytes()).hexdigest(),'excluded':'User screenshots and any personal face/voice references are excluded from the shareable bundle.'}
(HERE/'package-verification.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({'bundle':str(bundle),'bytes':bundle.stat().st_size,'native_clip_seconds':seconds,'native_frames':frames,'zip_crc':'passed'}))
