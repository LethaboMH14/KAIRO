from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,urljoin
from urllib.request import Request,urlopen
import json,zipfile,hashlib
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/reference/claude-kit'
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if t=='a' and a.get('href'):self.links.append(a['href'])
manifest=ROOT/'coordination/briefs/AVATAR-AND-PATHWAYS/assets.json';report=json.loads(manifest.read_text(encoding='utf8'))
for name,file in [('human-base-meshes','human-base-meshes-v1.4.1.zip'),('ellie-pose-library','ellie-pose-library-v2.0.0.zip')]:
 p=OUT/file
 if zipfile.is_zipfile(p):continue
 parser=Links();parser.feed(p.read_text(encoding='utf8',errors='replace'))
 candidates=[urljoin('https://www.blender.org/',u) for u in parser.links if urlsplit(u).hostname in ['download.blender.org','mirror.blender.org'] and urlsplit(u).path.endswith('.zip') and not urlsplit(u).query]
 print(name,'candidates',[(urlsplit(u).hostname,urlsplit(u).path) for u in candidates],flush=True)
 if not candidates:continue
 landing=p.with_suffix('.landing.html')
 if not landing.exists():p.rename(landing)
 with urlopen(Request(candidates[0],headers={'User-Agent':'KAIRO-asset-preparation/1.0'}),timeout=120) as r,p.open('wb') as f:
  size=0
  while block:=r.read(1024*1024):
   size+=len(block)
   if size>100*1024*1024:raise ValueError('Download limit')
   f.write(block)
 with zipfile.ZipFile(p) as z:
  if z.testzip():raise ValueError('CRC')
  blends=[n for n in z.namelist() if n.endswith('.blend')]
 data=p.read_bytes();item={'id':name,'status':'downloaded','file':file,'path':str(p.relative_to(ROOT)).replace('\\','/'),'sourceUrl':candidates[0],'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'blendFiles':blends,'page':'https://www.blender.org/download/demo-files/','license':'CC0' if name=='human-base-meshes' else 'CC-BY; preserve bundled terms'}
 report['items']=[x for x in report['items'] if x['id']!=name]+[item];print(name,'downloaded',len(data),flush=True)
manifest.write_text(json.dumps(report,indent=2),encoding='utf8')
