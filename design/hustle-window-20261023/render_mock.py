"""Original offline concept animatic. No browser capture, external assets or paid calls."""
from pathlib import Path
import json, math, subprocess, wave, io
import fitz
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SPEC = json.loads((HERE / 'timeline.json').read_text())
W, H, FPS = 1280, 720, 24
CHALK, MOSS, SAGE, INK, RUST = '#f5f0e6', '#3e5144', '#a7af91', '#252b28', '#b46d4b'
FONT = str(ROOT / 'studio/src/experience/fonts/Manrope-wght.ttf')
FF = imageio_ffmpeg.get_ffmpeg_exe()

def font(n):
    f = ImageFont.truetype(FONT, n)
    f.set_variation_by_axes([550])
    return f

svg = (ROOT / 'design/brand-master-20261023/master/kairo-lockup-horizontal-chalk.svg').read_bytes()
doc = fitz.open(stream=svg, filetype='svg')
pix = doc[0].get_pixmap(matrix=fitz.Matrix(2, 2), alpha=True)
LOGO = Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGBA')

def txt(d, p, s, size=28, fill=INK):
    d.text(p, s, font=font(size), fill=fill)

def lines(d, p, s, size=28, width=600, fill=INK):
    words, row, rows = s.split(), '', []
    for word in words:
        trial = (row + ' ' + word).strip()
        if d.textlength(trial, font=font(size)) > width and row:
            rows.append(row); row = word
        else:
            row = trial
    if row: rows.append(row)
    for i, row in enumerate(rows): txt(d, (p[0], p[1]+i*(size+9)), row, size, fill)

def card(d, box, fill='white', outline=None):
    d.rounded_rectangle(box, radius=18, fill=fill, outline=outline, width=2)

def ease(x): return 1-(1-max(0,min(1,x)))**3

def logo(im, x, y, width):
    v = LOGO.resize((width, round(LOGO.height*width/LOGO.width)), Image.Resampling.LANCZOS)
    im.paste(v, (x,y), v)

def motor(d, cx, cy, a, r=115):
    d.ellipse((cx-r,cy-r,cx+r,cy+r), fill=MOSS, outline=SAGE, width=12)
    for i in range(8):
        th=i*math.pi/4
        x,y=cx+math.cos(th)*r*.79,cy+math.sin(th)*r*.79
        d.ellipse((x-12,y-12,x+12,y+12),fill=RUST)
    d.ellipse((cx-65,cy-65,cx+65,cy+65),fill=CHALK)
    x,y=math.cos(a)*52,math.sin(a)*52
    d.line((cx-x,cy-y,cx+x,cy+y),fill=RUST,width=15)
    d.ellipse((cx-13,cy-13,cx+13,cy+13),fill=INK)

def frame(t):
    idx=next((i for i,s in enumerate(SPEC['segments']) if s['start']<=t<s['end']),5)
    s=SPEC['segments'][idx]; u=t-s['start']
    dark=idx in (1,5)
    im=Image.new('RGB',(W,H),MOSS if dark else CHALK); d=ImageDraw.Draw(im)
    fg=CHALK if dark else INK
    txt(d,(42,22),'KAIRO / HUSTLE WINDOW',19,fg)
    txt(d,(652,25),'CONCEPT ANIMATIC · illustrated, not live app footage',17,fg)
    d.line((42,65,1238,65),fill=SAGE,width=1)
    if idx==0:
        txt(d,(58,95),'Studying is only the start.',45)
        # Original presenter stand-in; replace with the user's own recorded shot.
        card(d,(58,185,540,560),SAGE)
        d.ellipse((205,231,297,323),fill=CHALK)
        d.rounded_rectangle((158,330,345,495),radius=45,fill=MOSS)
        d.polygon([(275,375),(440,375),(415,495),(248,495)],fill=CHALK)
        d.line((95,499,492,499),fill=INK,width=8)
        txt(d,(86,518),'YOUR RECORDED SHOT HERE',20)
        labels=[('Dense notes','I read it. Do I understand it?'),('Assignment due','I need to try this myself.'),('No lab today','How can I practise?')]
        for j,(title,body) in enumerate(labels):
            z=ease((u-j*.65)/.55); x=620+int((1-z)*660); y=183+j*126
            card(d,(x,y,x+590,y+108),'white')
            txt(d,(x+22,y+12),title,28,RUST); txt(d,(x+22,y+58),body,23)
    elif idx==1:
        p=ease(u/.7); width=500+int(50*p)
        logo(im,(W-width)//2,155,width)
        txt(d,(365,355),'Your interactive learning companion.',30,CHALK)
        txt(d,(470,417),'FOR ENGINEERING LEARNERS',19,SAGE)
        txt(d,(385,500),'Read it. See it. Try it.',40,CHALK)
    elif idx==2:
        txt(d,(58,95),'Turn material into understanding.',43)
        card(d,(58,187,540,565),'white')
        txt(d,(84,210),'01 / CHECK THE SOURCE',20,MOSS)
        txt(d,(84,258),'AC induction motor',34)
        lines(d,(84,317),'A rotating magnetic field induces current in the rotor.',27,420)
        d.line((85,433,510,433),fill=SAGE,width=2)
        txt(d,(84,455),'Source reference stays beside the idea.',21)
        txt(d,(84,499),'ILLUSTRATIVE LESSON',16,RUST)
        d.line((565,367,654,367),fill=MOSS,width=4)
        d.polygon([(654,367),(639,357),(639,377)],fill=MOSS)
        motor(d,900,334,u*2)
        txt(d,(697,483),'Explore the rotating field.',29,MOSS)
        txt(d,(696,532),'50 Hz · 4 poles → field speed 1500 r/min',20)
    elif idx==3:
        txt(d,(58,95),'Can you explain what changes?',43)
        motor(d,267,352,u*1.6)
        txt(d,(100,514),'TRY → OBSERVE → EXPLAIN',20,MOSS)
        card(d,(495,187,1220,565),'white')
        txt(d,(522,211),'02 / PUT IT INTO PRACTICE',20,MOSS)
        lines(d,(522,257),'If frequency rises, what happens to the field speed?',32,650)
        for j,text in enumerate(['Make a prediction','Show your working','Keep evidence of your practice']):
            active=u>(j*.75)
            d.ellipse((525,390+j*47,545,410+j*47),fill=MOSS if active else SAGE)
            txt(d,(564,383+j*47),text,24)
        txt(d,(522,536),'CONCEPT WORKFLOW · not a certified skills assessment',15,RUST)
    elif idx==4:
        txt(d,(58,95),'Let your learning open doors.',43)
        card(d,(58,182,343,226),MOSS)
        txt(d,(77,188),'NEXT / PROPOSED',24,CHALK)
        card(d,(58,263,562,491),'white')
        txt(d,(84,284),'SKILLS YOU CAN SHOW',23,MOSS)
        lines(d,(84,337),'A profile built around practical evidence.',34,445)
        card(d,(688,263,1220,491),'white')
        txt(d,(714,284),'RECOGNISE THE PROGRESS',23,MOSS)
        lines(d,(714,337),'Employer visibility. Proposed learning rewards.',32,470)
        d.line((585,376,665,376),fill=MOSS,width=4)
        d.polygon([(665,376),(650,366),(650,386)],fill=MOSS)
        txt(d,(60,532),'Future features · no confirmed rewards partnership or job placement',23,RUST)
    else:
        logo(im,345,153,590)
        txt(d,(267,355),'Put knowledge to work.',57,CHALK)
        txt(d,(420,465),'Bring your material. Meet KAIRO.',27,SAGE)
        txt(d,(447,533),'READ IT. SEE IT. TRY IT.',22,CHALK)
    # Burned-in captions, readable without sound.
    d.rectangle((0,615,W,H),fill=INK)
    f=font(27); tw=d.textlength(s['caption'],font=f)
    d.text(((W-tw)/2,638),s['caption'],font=f,fill=CHALK)
    d.rectangle((0,709,int(W*t/20),719),fill=SAGE)
    return im

def make_audio():
    out=[]; timing=[]
    for i,s in enumerate(SPEC['segments']):
        src=HERE/'voice'/f'segment-{i}.wav'; dst=HERE/'voice'/f'fitted-{i}.wav'
        with wave.open(str(src)) as f: duration=f.getnframes()/f.getframerate()
        target=s['end']-s['start']; tempo=max(.85,duration/(target-.12))
        subprocess.run([FF,'-y','-loglevel','error','-i',str(src),'-af',f'atempo={tempo},apad,atrim=duration={target}', '-ar','48000','-ac','1','-c:a','pcm_s16le',str(dst)],check=True)
        with wave.open(str(dst)) as f: out.append(f.readframes(f.getnframes()))
        timing.append({'scene':s['scene'],'original_seconds':duration,'tempo':tempo,'slot_seconds':target})
    with wave.open(str(HERE/'scratch-narration.wav'),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(48000);f.writeframes(b''.join(out))
    return timing

if __name__=='__main__':
    timing=make_audio()
    output=HERE/'kairo-hustle-20s-mock.mp4'
    args=[FF,'-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-', '-i',str(HERE/'scratch-narration.wav'),'-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-t','20','-movflags','+faststart',str(output)]
    p=subprocess.Popen(args,stdin=subprocess.PIPE)
    for n in range(20*FPS): p.stdin.write(frame(n/FPS).tobytes())
    p.stdin.close()
    if p.wait(): raise RuntimeError('Video encoding failed')
    board=Image.new('RGB',(1280,1224),CHALK);bd=ImageDraw.Draw(board)
    for i,t in enumerate([2.8,5.7,9.1,13.4,16.4,19]):
        im=frame(t).resize((620,349),Image.Resampling.LANCZOS)
        x=10+(i%2)*640;y=12+(i//2)*408
        board.paste(im,(x,y));txt(bd,(x+8,y+358),f"{SPEC['segments'][i]['start']:02}–{SPEC['segments'][i]['end']:02}s / {SPEC['segments'][i]['scene'].upper()}",22)
    board.save(HERE/'storyboard.jpg',quality=94)
    def stamp(t): return f'00:00:{int(t):02},000'
    (HERE/'captions.srt').write_text('\n\n'.join(f"{i+1}\n{stamp(s['start'])} --> {stamp(s['end'])}\n{s['caption']}" for i,s in enumerate(SPEC['segments'])),encoding='utf-8')
    (HERE/'voiceover.txt').write_text('\n'.join(s['caption'] for s in SPEC['segments']),encoding='utf-8')
    reader=imageio_ffmpeg.read_frames(str(output));meta=next(reader);reader.close()
    verification={'output':output.name,'frame_count_rendered':480,'metadata':meta,'audio_timing':timing,'limitations':['Illustrated concept; not actual app footage','Offline Windows scratch voice; not user recording','Final upload format and AI-media eligibility not confirmed','Future employer and rewards features visibly labelled proposed'],'assets':['Original PIL drawings','Selected C brand master SVG','Local Manrope font']}
    (HERE/'render-verification.json').write_text(json.dumps(verification,indent=2),encoding='utf-8')
    print(json.dumps({'output':str(output),'bytes':output.stat().st_size,'metadata':meta},default=str))
