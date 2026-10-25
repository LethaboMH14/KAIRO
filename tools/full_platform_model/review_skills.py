"""Read-only remote skill review; download text evidence, never execute remote code."""
import json, urllib.request
from pathlib import Path
OUT=Path(__file__).parent/'skill-review';OUT.mkdir(exist_ok=True)
repo='wshobson/agents'
names=['startup-financial-modeling','market-sizing-analysis','startup-metrics-framework']
def get(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'KAIRO-skill-review'}),timeout=40) as r:return r.read()
meta=json.loads(get('https://api.github.com/repos/'+repo))
commit=json.loads(get('https://api.github.com/repos/'+repo+'/commits/main'))['sha']
tree=json.loads(get('https://api.github.com/repos/'+repo+'/git/trees/'+commit+'?recursive=1'))
base='plugins/startup-business-analyst/skills/'
files=[x['path'] for x in tree['tree'] if x['type']=='blob' and any(x['path'].startswith(base+n+'/') for n in names)]
for file in files:
    if not file.endswith('.md'):continue
    dest=OUT/file.removeprefix(base);dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_bytes(get('https://raw.githubusercontent.com/'+repo+'/'+commit+'/'+file))
record=dict(repo=repo,commit=commit,stars=meta['stargazers_count'],license=(meta.get('license') or {}).get('spdx_id'),
            skills=names,files=files,executed_remote_code=False)
(OUT/'source.json').write_text(json.dumps(record,indent=2),encoding='utf-8')
print(json.dumps(record,indent=2))
