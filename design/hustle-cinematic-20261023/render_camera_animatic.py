"""Offline editorial camera motion from concept stills; not animated avatar/3D proof."""
from pathlib import Path
import json, subprocess, wave, hashlib
import imageio_ffmpeg

HERE=Path(__file__).resolve().parent
FF=imageio_ffmpeg.get_ffmpeg_exe()
SPEC=json.loads((HERE/'timeline.json').read_text())
FONT='../../studio/src/experience/fonts/Manrope-wght.ttf'

def run(args):
    subprocess.run([FF,'-y','-loglevel','error',*args],cwd=HERE,check=True)

def title(text,x,y,size=22,color='white'):
    # Spec text deliberately avoids special filter syntax and unescaped colons.
    return f"drawtext=fontfile={FONT}:text='{text}':x={x}:y={y}:fontsize={size}:fontcolor={color}:shadowcolor=black@0.6:shadowx=1:shadowy=2"

timing=[]
for i,s in enumerate(SPEC['segments']):
    duration=s['end']-s['start']; frames=round(duration*SPEC['fps'])
    src=HERE/f'voice-{i}.wav'; clean=HERE/f'voice-clean-{i}.wav'
    run(['-i',str(src),'-af','silenceremove=start_periods=1:start_silence=0.03:start_threshold=-45dB:stop_periods=-1:stop_duration=0.28:stop_threshold=-45dB','-ar','48000','-ac','1',str(clean)])
    with wave.open(str(clean)) as f: spoken=f.getnframes()/f.getframerate()
    tempo=max(1,spoken/(duration-.12))
    fitted=HERE/f'voice-fitted-{i}.wav'
    run(['-i',str(clean),'-af',f'atempo={tempo},apad,atrim=duration={duration}','-ar','48000','-ac','1',str(fitted)])
    timing.append({'scene':i+1,'slot':duration,'trimmed_speech_seconds':spoken,'tempo':tempo})
    x,y,w,h=s['crop']
    # The source contact sheet is not true 16:9 per panel. Preserve its aspect;
    # a blurred extension fills the widescreen matte without stretching faces.
    start=f'crop={w}:{h}:{x}:{y},split[bg][fg];[bg]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,gblur=sigma=24[back];[fg]scale=1280:650:force_original_aspect_ratio=decrease[front];[back][front]overlay=(W-w)/2:(H-h)/2'
    zoom=f'1+0.045*on/{frames}' if s['zoom']=='in' else f'1.045-0.045*on/{frames}'
    filters=start+f",zoompan=z='{zoom}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d={frames}:s=1280x720:fps=24"
    filters+=',drawbox=x=0:y=0:w=iw:h=42:color=0x172820@0.92:t=fill'
    filters+=','+title('KAIRO / CINEMATIC CONCEPT',24,10,19)
    filters+=','+title('Illustrated stills / not live app footage',780,11,18)
    # Persistent questions remain at the edge. Future/validation labels are explicit.
    filters+=',drawbox=x=0:y=678:w=iw:h=42:color=0x172820@0.94:t=fill'
    footer='Questions / NSFAS?  Bursaries?  Which role?  SASL support - in development'
    if i==1: footer='Engineering learners / Concept avatar placeholder / Other studios shown as vision'
    if i==3: footer='Practice milestone / Level-up concept / not certified competence / SASL in development'
    if i==4: footer='NEXT / PROPOSED - Employer visibility and rewards - No confirmed partnership'
    filters+=','+title(footer,30,689,17)
    # Burned-in phrase captions remain separate from the generated plate copy.
    caption=s['caption'].replace(':',' -')
    caption_file=HERE/f'caption-{i}.txt';caption_file.write_text(caption,encoding='utf-8')
    filters+=",drawbox=x=22:y=627:w=1236:h=43:color=0x172820@0.88:t=fill"
    filters+=f",drawtext=fontfile={FONT}:textfile=caption-{i}.txt:x=(w-text_w)/2:y=636:fontsize=24:fontcolor=0xf5f0e6"
    filters+=',fade=t=in:st=0:d=0.12,format=yuv420p'
    run(['-i','kairo-cinematic-storyboard.png','-i',str(fitted),'-filter_complex',filters,'-frames:v',str(frames),'-c:v','libx264','-preset','fast','-crf','20','-c:a','aac','-b:a','128k','-t',str(duration),'-movflags','+faststart',f'shot-{i}.mp4'])

(HERE/'shots.txt').write_text('\n'.join(f"file 'shot-{i}.mp4'" for i in range(6)),encoding='utf-8')
output=HERE/'kairo-cinematic-20s-camera-mock.mp4'
with wave.open(str(HERE/'scratch-narration.wav'),'wb') as out:
    out.setnchannels(1);out.setsampwidth(2);out.setframerate(48000)
    for i in range(6):
        with wave.open(str(HERE/f'voice-fitted-{i}.wav')) as src:
            out.writeframes(src.readframes(src.getnframes()))
# Rebuild frame timestamps rather than concatenate AAC priming delays. Audio is
# assembled as PCM once and encoded once; six encoded clips otherwise add 20ms.
run(['-f','concat','-safe','0','-i','shots.txt','-i','scratch-narration.wav','-filter_complex','[0:v]setpts=N/(24*TB)[v]','-map','[v]','-map','1:a','-r','24','-c:v','libx264','-preset','fast','-crf','20','-c:a','aac','-b:a','128k','-frames:v','480','-t','20','-movflags','+faststart',str(output)])
reader=imageio_ffmpeg.read_frames(str(output));meta=next(reader);reader.close()
if meta['duration']!=20 or meta['fps']!=24: raise RuntimeError(f'Unexpected output timing: {meta}')
run(['-i',str(output),'-f','null','-']) # Decode every frame and audio packet.
decoded_frames,decoded_seconds=imageio_ffmpeg.count_frames_and_secs(str(output))
if decoded_frames!=480: raise RuntimeError(f'Unexpected decoded frame count: {decoded_frames}')
run(['-ss','11.5','-i',str(output),'-frames:v','1','video-check-frame.png'])
verify={'kind':SPEC['kind'],'metadata':meta,'planned_frames':480,'audio':timing,'full_decode':'passed','bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'limits':['Static concept plates with editorial zoom; no moving 3D or avatar performance','Scratch TTS, not final voice','Requires authorised real product/presenter footage','No browser/device/user or final upload acceptance']}
verify.update(decoded_frame_count=decoded_frames,decoded_video_seconds=decoded_seconds)
(HERE/'verification.json').write_text(json.dumps(verify,indent=2),encoding='utf-8')
(HERE/'voiceover.txt').write_text('\n'.join(s['caption'] for s in SPEC['segments']),encoding='utf-8')
captions=[{'text':s['caption'],'startMs':s['start']*1000,'endMs':s['end']*1000,'timestampMs':None,'confidence':None} for s in SPEC['segments']]
(HERE/'captions.json').write_text(json.dumps(captions,indent=2),encoding='utf-8')
print(json.dumps({'output':str(output),'metadata':meta,'full_decode':'passed'}))
