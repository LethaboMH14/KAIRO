"""Replace the old scratch narration with the app's exact default Google voice."""
from pathlib import Path
import subprocess,json,wave,re,hashlib
import imageio_ffmpeg

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
FF=imageio_ffmpeg.get_ffmpeg_exe()
generation=json.loads((HERE/'voice/generation.json').read_text())
old=ROOT/'design/hustle-cinematic-20261023'
parts=[{'file':str(old/'voice-fitted-0.wav'),'start':0,'end':3,'caption':'I read it. Can I explain it?','speaker':'Learner placeholder, not the user'}]+[{**c,'file':str(HERE/c['file']),'speaker':'KAIRO / Aoede UK synthetic'} for c in generation['calls']]
timing=[]
for i,c in enumerate(parts):
    info=subprocess.run([FF,'-i',c['file']],capture_output=True,text=True).stderr
    match=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',info)
    if not match:raise RuntimeError('Cannot read audio duration')
    raw=int(match[1])*3600+int(match[2])*60+float(match[3]);slot=c['end']-c['start']
    tempo=max(1,raw/(slot-.08))
    if tempo>1.25:raise RuntimeError(f'Clip {i} needs editorial shortening rather than fast speech: {tempo}')
    dst=HERE/'voice'/f'slot-{i}.wav'
    subprocess.run([FF,'-y','-loglevel','error','-i',c['file'],'-af',f'atempo={tempo},apad,atrim=duration={slot}','-ar','48000','-ac','1','-c:a','pcm_s16le',str(dst)],check=True)
    timing.append({'speaker':c['speaker'],'slot_seconds':slot,'source_seconds':raw,'tempo':tempo})
for start,name in [(0,'voice-cut-20s.wav'),(1,'kairo-narration-17s.wav')]:
    with wave.open(str(HERE/'voice'/name),'wb') as target:
        target.setnchannels(1);target.setsampwidth(2);target.setframerate(48000)
        for i in range(start,6):
            with wave.open(str(HERE/'voice'/f'slot-{i}.wav')) as source:target.writeframes(source.readframes(source.getnframes()))
    subprocess.run([FF,'-y','-loglevel','error','-i',str(HERE/'voice'/name),'-c:a','libmp3lame','-b:a','192k',str(HERE/'voice'/name.replace('.wav','.mp3'))],check=True)
output=HERE/'kairo-aoede-20s-production-preview.mp4'
font='../../studio/src/experience/fonts/Manrope-wght.ttf'
filters=f"[0:v]setpts=N/(24*TB),drawbox=x=0:y=0:w=iw:h=42:color=0x172820:t=fill,drawtext=fontfile={font}:text='KAIRO / Aoede voice production preview':x=24:y=10:fontsize=20:fontcolor=white,drawtext=fontfile={font}:text='Learner voice is a placeholder':x=800:y=12:fontsize=18:fontcolor=white:enable='lt(t,3)'[v]"
subprocess.run([FF,'-y','-loglevel','error','-f','concat','-safe','0','-i',str(old/'shots.txt'),'-i',str(HERE/'voice/voice-cut-20s.wav'),'-filter_complex',filters,'-map','[v]','-map','1:a','-c:v','libx264','-preset','fast','-crf','20','-r','24','-frames:v','480','-c:a','aac','-b:a','192k','-t','20','-movflags','+faststart',str(output)],cwd=HERE,check=True)
reader=imageio_ffmpeg.read_frames(str(output));meta=next(reader);reader.close()
frames,seconds=imageio_ffmpeg.count_frames_and_secs(str(output))
assert frames==480 and meta['duration']==20,(frames,meta)
subprocess.run([FF,'-loglevel','error','-i',str(output),'-f','null','-'],check=True)
report={'voice':generation['voice'],'characters_generated':generation['characters'],'calls':len(generation['calls']),'timing':timing,'metadata':meta,'decoded_frames':frames,'decode':'passed','sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'limits':['Still-plate camera mock, not actual product/3D performance','Learner voice placeholder, not user recording','Final app-selected voice was not observed; uses configured cloud default','No human listening/phone playback or final upload acceptance']}
(HERE/'voice-cut-verification.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'output':str(output),'voice':generation['voice'],'duration':meta['duration'],'frames':frames,'timing':timing}))
