"""Read official asset pages. Print candidate download paths without signed query strings."""
from html.parser import HTMLParser
from urllib.request import Request,urlopen
from urllib.parse import urljoin,urlsplit
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[2]
class Links(HTMLParser):
    def __init__(self): super().__init__();self.links=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='a' and a.get('href'):self.links.append(a['href'])
sources={'rain-v3':'https://studio.blender.org/characters/rain/v3/','rain-v1':'https://studio.blender.org/characters/rain/v1/','base-meshes':'https://www.blender.org/download/demo-files/','mpfb':'https://extensions.blender.org/add-ons/mpfb/','quaternius':'https://quaternius.itch.io/universal-base-characters'}
report={}
for name,url in sources.items():
    try:
        data=urlopen(Request(url,headers={'User-Agent':'KAIRO-asset-preparation/1.0'}),timeout=45).read().decode('utf8','replace');parser=Links();parser.feed(data)
        links=[urljoin(url,h) for h in parser.links if any(s in h.lower() for s in ['.blend','.zip','/download/','/file/'])]
        report[name]={'page':url,'links':list(dict.fromkeys(links))}
        print(name,json.dumps([urlsplit(x)._replace(query='',fragment='').geturl() for x in links][:12]))
        (ROOT/'tools/claude-kit'/f'{name}-discovery.html').write_text(data,encoding='utf8')
    except Exception as e:report[name]={'page':url,'error':str(e)};print(name,type(e).__name__)
(ROOT/'tools/claude-kit/discovered-downloads.private.json').write_text(json.dumps(report,indent=2),encoding='utf8')
