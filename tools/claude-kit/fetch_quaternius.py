"""Resolve an anonymous free itch.io download; do not pay or create an account."""
from urllib.request import Request,urlopen,build_opener,HTTPCookieProcessor
from urllib.parse import urlencode,urlsplit
from http.cookiejar import CookieJar
from pathlib import Path
from html import unescape
import re,json,zipfile,hashlib
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'assets/reference/claude-kit';page='https://quaternius.itch.io/universal-base-characters'
opener=build_opener(HTTPCookieProcessor(CookieJar()))
def get(url,data=None):return opener.open(Request(url,data=data,headers={'User-Agent':'KAIRO-asset-preparation/1.0','Referer':page}),timeout=120)
try:
 html=get(page).read().decode('utf8');token=re.search(r'name="csrf_token" (?:content|value)="([^"]+)"',html) or re.search(r'"csrf_token":"([^"]+)"',html)
 if not token:raise ValueError('Anonymous CSRF token not found; use official free browser download')
 reply=json.loads(get(page+'/download_url',urlencode({'csrf_token':unescape(token.group(1))}).encode()).read())
 url=reply.get('url','')
 if not url.startswith(page+'/download/'):raise ValueError('No anonymous free download route; no account/payment attempted')
 html=get(url).read().decode('utf8');(ROOT/'tools/claude-kit/quaternius-download.private.html').write_text(html,encoding='utf8')
 files=re.findall(r'data-upload_id="(\d+)"',html)
 print('anonymous_free_page',True,'file_count',len(files),flush=True)
 token=re.search(r'name="csrf_token" (?:content|value)="([^"]+)"',html)
 if not files or not token:raise ValueError('No reviewed free file endpoint')
 reply=json.loads(get(page+'/file/'+files[0],urlencode({'csrf_token':unescape(token.group(1))}).encode()).read())
 target=reply.get('url','')
 if not target.startswith('https://'):raise ValueError('No HTTPS download URL')
 dest=OUT/'quaternius-base-standard.zip'
 with get(target) as response,dest.open('wb') as output:
  count=0
  while chunk:=response.read(1024*1024):
   count+=len(chunk)
   if count>250*1024*1024:raise ValueError('Download size limit exceeded')
   output.write(chunk)
 with zipfile.ZipFile(dest) as z:
  if z.testzip():raise ValueError('ZIP CRC failed')
  for name in z.namelist():
   if not (OUT/name).resolve().is_relative_to(OUT.resolve()):raise ValueError('Unsafe archive path')
  entries=len(z.namelist())
 manifest=ROOT/'coordination/briefs/AVATAR-AND-PATHWAYS/assets.json'
 data=json.loads(manifest.read_text())
 data['items']=[x for x in data['items'] if x['id']!='quaternius-base-standard']
 data['items'].append({'id':'quaternius-base-standard','file':dest.name,'path':str(dest.relative_to(ROOT)).replace('\\','/'),'page':page,'license':'CC0 per official Quaternius pack page','status':'downloaded','bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'archiveFiles':entries,'limit':'Standard tier only; facial controls not yet inspected'})
 manifest.write_text(json.dumps(data,indent=2),encoding='utf8')
 print('Downloaded Standard pack; ZIP CRC passed; entries',entries,flush=True)
except Exception as e:print('quaternius',type(e).__name__,str(e),flush=True)
