"""Download a bounded official-source avatar kit. No downloaded scripts are executed."""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlsplit
from html import unescape
import json,hashlib,zipfile

ROOT=Path(__file__).resolve().parents[2]; OUT=ROOT/'assets/reference/claude-kit';OUT.mkdir(parents=True,exist_ok=True)
discovered=json.loads((ROOT/'tools/claude-kit/discovered-downloads.private.json').read_text(encoding='utf8'))
def candidate(group,part):return next(x for x in discovered[group]['links'] if part in urlsplit(x).path)
items=[
 {'id':'rain-v3','url':candidate('rain-v3','.zip'),'file':'rain-v3.zip','license':'CC-BY-4.0; retain bundled attribution','page':discovered['rain-v3']['page']},
 {'id':'human-base-meshes','url':candidate('base-meshes','human-base-meshes-bundle-v1.4.1.zip'),'file':'human-base-meshes-v1.4.1.zip','license':'CC0','page':discovered['base-meshes']['page']},
 {'id':'ellie-pose-library','url':candidate('base-meshes','ellie-pose-library-v2.0.0.zip'),'file':'ellie-pose-library-v2.0.0.zip','license':'CC-BY; preserve bundle licence','page':discovered['base-meshes']['page']},
 {'id':'mpfb-extension','url':unescape(candidate('mpfb','add-on-mpfb-v2.0.18.zip')),'file':'mpfb-v2.0.18.zip','license':'GPL code / CC0 bundled graphical assets; third-party assets vary','page':discovered['mpfb']['page'],'expectedSha256':'c075b3e9b94b8e5556a5f03f4653602d02ea306de08126e8f55ed6dee28a2dad'},
]
def get(url):return urlopen(Request(url,headers={'User-Agent':'KAIRO-asset-preparation/1.0'}),timeout=90)
for asset in ['studio_small_09','autumn_field_puresky']:
 try:
  data=json.load(get('https://api.polyhaven.com/files/'+asset));entry=data['hdri']['1k']['hdr'];items.append({'id':asset,'url':entry['url'],'file':asset+'_1k.hdr','license':'CC0','page':'https://polyhaven.com/a/'+asset,'expectedMd5':entry.get('md5')})
 except Exception as e:print(asset,'catalogue unavailable',type(e).__name__)
report=[]
for item in items:
 path=OUT/item['file']
 try:
  if not path.exists():
   total=0
   with get(item['url']) as r,path.open('wb') as f:
    while block:=r.read(1024*1024):
     total+=len(block)
     if total>150*1024*1024:raise ValueError('Per-file download limit exceeded')
     f.write(block)
  data=path.read_bytes();sha=hashlib.sha256(data).hexdigest()
  if item.get('expectedSha256') and sha!=item['expectedSha256']:raise ValueError('Official SHA-256 mismatch')
  if item.get('expectedMd5') and hashlib.md5(data).hexdigest()!=item['expectedMd5']:raise ValueError('Provider MD5 mismatch')
  row={k:v for k,v in item.items() if k not in ['url']};row.update({'sourceUrl':urlsplit(item['url'])._replace(query='',fragment='').geturl(),'path':str(path.relative_to(ROOT)).replace('\\','/'),'bytes':len(data),'sha256':sha,'status':'downloaded'})
  if path.suffix=='.zip':
   with zipfile.ZipFile(path) as z:
    bad=z.testzip()
    if bad:raise ValueError('Archive CRC failed')
    if any(n.startswith(('/','\\')) or '..' in Path(n).parts for n in z.namelist()):raise ValueError('Unsafe archive path')
    row['archiveFiles']=len(z.namelist());row['blendFiles']=[n for n in z.namelist() if n.endswith('.blend')][:12]
  report.append(row);print(item['id'],'downloaded',len(data),flush=True)
 except Exception as e:report.append({'id':item['id'],'status':'unavailable','error':str(e),'page':item['page']});print(item['id'],'unavailable',str(e),flush=True)
(ROOT/'coordination/briefs/AVATAR-AND-PATHWAYS/assets.json').write_text(json.dumps({'checked':'2026-10-21','items':report,'note':'Downloaded is not converted, installed or browser-accepted. Rain blend scripts were not executed.'},indent=2),encoding='utf8')
