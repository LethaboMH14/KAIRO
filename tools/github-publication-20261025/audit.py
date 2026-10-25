"""Audit publication candidates; never print credential content."""
import json,re,subprocess
from collections import Counter
from pathlib import Path
r=Path(__file__).resolve().parents[2]
raw=subprocess.check_output(['git','ls-files','-z','--cached','--others','--exclude-standard'],cwd=r)
paths=sorted(set(x.decode('utf-8') for x in raw.split(b'\0') if x))
rules={
 'provider-key':re.compile(rb'(?:gsk_[A-Za-z0-9]{25,}|sk-or-v1-[A-Za-z0-9]{30,}|sk-proj-[A-Za-z0-9_-]{30,})'),
 'github-token':re.compile(rb'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})'),
 'private-key':re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
 'google-access-token':re.compile(rb'ya29\.[A-Za-z0-9_.-]{40,}'),
 'aws-access-key':re.compile(rb'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b'),
}
findings=[];files=[];folders=Counter();scanned=0
known=[]
provider=r/'tools/provider-lab/.env.local'
if provider.exists():
 for line in provider.read_text(encoding='utf-8').splitlines():
  if '=' in line and not line.lstrip().startswith('#'):
   k,v=line.split('=',1);v=v.strip().strip('"').strip("'")
   if 'API_KEY' in k and len(v)>=16:known.append(v.encode())
judges=r/'tools/connected_release/judge-credentials.local.json'
if judges.exists():
 for account in json.loads(judges.read_text(encoding='utf-8')).get('accounts',[]):
  if isinstance(account.get('password'),str) and len(account['password'])>=8:known.append(account['password'].encode())
for rel in paths:
 p=r/rel
 if not p.is_file():continue
 size=p.stat().st_size;files.append({'path':rel,'bytes':size});folders[rel.split('/')[0]]+=size
 if size>20_000_000:continue
 b=p.read_bytes()
 if b'\0' in b[:8192]:continue
 try:b.decode('utf-8')
 except UnicodeDecodeError:continue
 scanned+=1
 if any(secret in b for secret in known):findings.append({'path':rel,'kind':'known-local-credential'})
 for kind,rx in rules.items():
  for match in rx.finditer(b):findings.append({'path':rel,'line':b[:match.start()].count(b'\n')+1,'kind':kind})
report={'files':len(files),'bytes':sum(folders.values()),'textFilesScanned':scanned,'folders':folders.most_common(),'largest':sorted(files,key=lambda f:-f['bytes'])[:20],'overGitHubLimit':[f for f in files if f['bytes']>=100*1024*1024],'secretFindings':findings}
out=r/'docs/github-publication-20261025/audit.local.json';out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))
if findings or report['overGitHubLimit']:raise SystemExit(1)
