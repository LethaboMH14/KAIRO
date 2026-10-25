from pathlib import Path
import json,hashlib,zipfile
ROOT=Path(__file__).resolve().parents[2];PACK=ROOT/'coordination/briefs/AVATAR-AND-PATHWAYS'
checks=[]
for item in json.loads((PACK/'assets.json').read_text())['items']:
 p=ROOT/item['path'];assert p.is_file(),item['id']
 assert hashlib.sha256(p.read_bytes()).hexdigest()==item['sha256'],item['id']
 if p.suffix=='.zip':
  with zipfile.ZipFile(p) as z:assert z.testzip() is None,item['id']
 checks.append({'id':item['id'],'sha256':'passed','crc':'passed' if p.suffix=='.zip' else 'not_applicable'})
sources=json.loads((PACK/'sources.json').read_text());assert len({s['id'] for s in sources['sources']})==len(sources['sources'])
skills=json.loads((PACK/'skills.json').read_text())
for s in skills['items']:assert hashlib.sha256((ROOT/s['path']/'SKILL.md').read_bytes()).hexdigest()==s['entrySha256']
mpfb=json.loads((PACK/'mpfb-install.json').read_text());assert mpfb['enabled'] and mpfb['createdMeshes']
rain=json.loads((PACK/'rain-inspection.json').read_text());assert rain['autoExecute'] is False and rain['armatures']
report={'checked':'2026-10-21','assetChecks':checks,'sourceCount':len(sources['sources']),'skillCount':len(skills['items']),'skillHashes':'passed','mpfbMeshCreation':'passed','rainSafeStructuralInspection':'passed','browser':{'url':'http://127.0.0.1:4191/','verified':['FNB historical closure visible','sample coverage 54% to 71% when testing changed to reported review','independent calculation 18 feedback','teacher reference image and seven downloaded assets visible'],'limits':'Standalone review prototype; no real applications or live feed'},'notPerformed':['Final character deformation/export acceptance','SASL validation','Current-vacancy application','Paid tool provisioning']}
(PACK/'verification.json').write_text(json.dumps(report,indent=2),encoding='utf8')
dest=ROOT/'assets/design-reference/pathways/KAIRO-Claude-avatar-and-pathways.zip'
with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED) as z:
 for p in PACK.iterdir():
  if p.is_file() and p.suffix.lower() in ['.md','.json','.html','.png','.txt']:z.write(p,'AVATAR-AND-PATHWAYS/'+p.name)
 z.write(ROOT/'docs/LEARNING-TO-WORK-AND-SME.md','docs/LEARNING-TO-WORK-AND-SME.md')
 z.write(ROOT/'docs/ROLE-PATHWAYS.md','docs/ROLE-PATHWAYS.md')
 z.write(ROOT/'assets/design-reference/pathways/generation-prompt.txt','AVATAR-AND-PATHWAYS/generation-prompt.txt')
with zipfile.ZipFile(dest) as z:
 assert z.testzip() is None
 assert not any('private' in n.lower() or '/.claude/' in n for n in z.namelist())
print(json.dumps({'assetsVerified':len(checks),'skillsVerified':len(skills['items']),'sources':len(sources['sources']),'zip':str(dest.relative_to(ROOT)),'zipBytes':dest.stat().st_size}))
