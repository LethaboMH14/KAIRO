"""Read-only coursework discovery. Private metadata stays outside public app assets."""
import argparse, hashlib, json, os, re
from collections import Counter
from pathlib import Path

COURSE = re.compile(r'(?<![A-Z])(INF|MNG|AUI|AUE|DSC|ECS|FAC|MNB|ICT)\s*([123]\d{3})(?!\d)',re.I)
FORMATS = {'.pdf','.docx','.txt','.md','.pptx','.xlsx','.png','.jpg','.jpeg','.webp'}
SKIP_DIRS = {'.git','node_modules','.venv','venv','__pycache__','.codex','.agents','.claude','tools'}
PERSONAL = re.compile(r'academic[ _-]*(record|transcript)|proof.*reg|registration|affidavit|home affairs|surname change|certificate|\bcv\b|^statement\.|^all id\b|^id[ _-]',re.I)

def classify(path):
    n=path.name.lower()
    if any(s in n for s in ['answer','solution','draft','final exam lethabo','lethabo','hoaeane','phukuile']):return 'student-work-or-answer-candidate'
    if any(s in n for s in ['exam','paper','assessment','assignment','test','practice']):return 'question-or-assessment-candidate'
    return 'learning-material-candidate'

def allowed_roots(home):
    desktop=home/'Desktop'; roots=[]
    for p in desktop.iterdir():
        if p.is_dir() and (COURSE.search(p.name) or p.name.lower() in ['unisa 2nd year','unisa 3rd year','assingments','assignments']):roots.append(p)
    roots.append(home/'Downloads')
    return roots

def run(home,out):
    paths=set();excluded=0;errors=[]
    for root in allowed_roots(home):
        if not root.exists():continue
        def walk_error(e):errors.append(str(e))
        for directory,dirs,files in os.walk(root,followlinks=False,onerror=walk_error):
            dirs[:]=[d for d in dirs if d not in SKIP_DIRS and not (Path(directory)/d).is_symlink() and (Path(directory)/d).resolve().is_relative_to(root.resolve())]
            for name in files:
                p=Path(directory)/name
                if not p.resolve().is_relative_to(root.resolve()):continue
                if p.suffix.lower() not in FORMATS:continue
                if root.name=='Downloads' and not COURSE.search(str(p.relative_to(root))):continue
                if PERSONAL.search(name):excluded+=1;continue
                if not p.is_symlink():paths.add(p)
    for p in (home/'Desktop').iterdir():
        if p.is_file() and p.suffix.lower() in FORMATS and COURSE.search(p.name) and not PERSONAL.search(p.name):paths.add(p)
    records=[]
    for p in sorted(paths,key=lambda q:str(q).lower()):
        try:
            stat=p.stat();matches=COURSE.findall(str(p));codes=sorted(set((a+b).upper() for a,b in matches))
            records.append({'id':hashlib.sha256(str(p.resolve()).lower().encode()).hexdigest()[:20],
              'path':str(p.resolve()),'bytes':stat.st_size,'modifiedUnix':stat.st_mtime,'extension':p.suffix.lower(),
              'courseCodes':codes,'kind':classify(p),'privacy':'private-local','rights':'user-authorized personal analysis; redistribution not established','contentHashed':False})
        except OSError as e:errors.append(str(e))
    screenshots=home/'Pictures/Screenshots'
    images=[p for p in screenshots.rglob('*') if p.is_file() and p.suffix.lower() in {'.png','.jpg','.jpeg','.webp'} and not p.is_symlink()] if screenshots.exists() else []
    image_records=[{'id':hashlib.sha256(str(p.resolve()).lower().encode()).hexdigest()[:20],'path':str(p.resolve()),'modifiedUnix':p.stat().st_mtime,'bytes':p.stat().st_size,'courseStatus':'unclassified; OCR required'} for p in sorted(images,key=lambda p:str(p))]
    out.mkdir(parents=True,exist_ok=True)
    (out/'inventory.json').write_text(json.dumps({'schemaVersion':1,'sources':records,'screenshots':image_records,'exclusions':excluded,'errors':errors},indent=2),encoding='utf-8')
    summary={'courseFiles':len(records),'screenshotsUnclassified':len(images),'extensions':dict(Counter(r['extension'] for r in records)),
      'courseCodes':dict(sorted(Counter(c for r in records for c in r['courseCodes']).items())),
      'candidateKinds':dict(Counter(r['kind'] for r in records)),'personalRecordsExcludedByFilename':excluded,'readErrors':len(errors),'originalsModified':False,'cloudUploads':0}
    (out/'inventory-summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
    print(json.dumps(summary))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--home',type=Path,default=Path.home());parser.add_argument('--out',type=Path,default=Path('data/private/course-sources'))
    args=parser.parse_args();run(args.home,args.out)
