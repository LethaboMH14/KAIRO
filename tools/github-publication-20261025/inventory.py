import json,os
from collections import Counter
from pathlib import Path
r=Path(__file__).resolve().parents[2]
skip={'.git','node_modules','.terraform','__pycache__','.venv','.venv-ocr','.cache','blender','private','stage'}
files=[];sizes=Counter()
for home,dirs,names in os.walk(r):
 dirs[:]=[d for d in dirs if d not in skip and not d.startswith('.venv')]
 for name in names:
  p=Path(home)/name;rel=p.relative_to(r).as_posix()
  if p.is_symlink():continue
  n=p.stat().st_size;files.append({'path':rel,'bytes':n});sizes[rel.split('/')[0]]+=n
out={'candidates':len(files),'bytes':sum(sizes.values()),'topFolders':sizes.most_common(),'largeFiles':sorted([f for f in files if f['bytes']>10_000_000],key=lambda f:-f['bytes']),'databaseFiles':[f['path'] for f in files if Path(f['path']).suffix.lower() in ('.db','.sqlite','.sqlite3')],'credentialLikePaths':[f['path'] for f in files if any(s in Path(f['path']).name.lower() for s in ('.env','credentials','token','credential','secret'))]}
(r/'docs/github-publication-20261025').mkdir(exist_ok=True)
(r/'docs/github-publication-20261025/inventory.local.json').write_text(json.dumps(out,indent=2),encoding='utf-8')
print(json.dumps(out,indent=2))
