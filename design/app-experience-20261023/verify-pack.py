"""Local file/document checks; never opens a browser or remote connection."""
from pathlib import Path
import hashlib,json,re
ROOT=Path(__file__).resolve().parents[2]
DESIGN=Path(__file__).resolve().parent
DOCS=ROOT/'docs/blueprint/experience'
issues=[]
links=0
for file in [*DOCS.glob('*.md'),ROOT/'docs/blueprint/core/README.md',ROOT/'docs/blueprint/core/FRESH-CHAT-PROMPTS.md']:
    for target in re.findall(r'\]\(([^)]+)\)',file.read_text(encoding='utf-8')):
        if re.match(r'\w+://',target) or target.startswith('#'):continue
        dest=(file.parent/target.split('#')[0]).resolve()
        links+=1
        if not dest.exists():issues.append(f'{file.relative_to(ROOT)}: {target}')
boards=[]
for file in sorted((DESIGN/'boards').glob('*.png')):
    boards.append({'path':file.relative_to(ROOT).as_posix(),'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'kind':'generated visual direction, not application acceptance'})
(DESIGN/'boards/manifest.json').write_text(json.dumps({'schema':'kairo-experience-boards/1','selectedReference':'assets/brand-reference.png','authority':'Clickable screen wording and specification supersede incidental generated image text, dates, personal names and capability/privacy claims.','boards':boards},indent=2)+'\n',encoding='utf-8')
core=ROOT/'docs/blueprint/core/verification.json'
data=json.loads(core.read_text(encoding='utf-8'))
data['experienceUpdate']={'date':'2026-10-23','contract':'kairo-experience/1','screenStates':112,'journeys':7,'visualBoards':6,'checks':'design/app-experience-20261023/verification.json','brand':'Selected rounded pathmark and geometric wordmark; earlier proposal superseded. Final vector master pending.','productionAppChanged':False,'browserAcceptance':'pending; prior observation denial respected'}
for item in data.get('files',[]):
    if item.get('path') in ['docs/blueprint/core/README.md','docs/blueprint/core/FRESH-CHAT-PROMPTS.md']:
        content=(ROOT/item['path']).read_bytes();item['bytes']=len(content);item['sha256']=hashlib.sha256(content).hexdigest()
core.write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
result={'markdownLinksChecked':links,'missingLinks':issues,'boardCount':len(boards),'passed':not issues and len(boards)==6,'browserUsed':False}
(DESIGN/'pack-verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,indent=2))
raise SystemExit(0 if result['passed'] else 1)
