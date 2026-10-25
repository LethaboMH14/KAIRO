"""Restart only the verified KAIRO loopback server; keys remain in child env."""
import json,os,shutil,subprocess,time,urllib.request
from pathlib import Path
r=Path(__file__).resolve().parents[2];base='http://127.0.0.1:4188'
def read(path):
 with urllib.request.urlopen(base+path,timeout=8) as response:return json.load(response)
try:health=read('/api/health')
except urllib.error.URLError as e:
 if getattr(e.reason,'winerror',None)!=10061:raise
 health=None
if health and health.get('runtime')!='local-node-sqlite':raise SystemExit('Refusing to replace an unrecognized server.')
space=read('/api/account/learning-space').get('space') if health else None
inspect="""$p=Get-NetTCPConnection -LocalPort 4188 -State Listen -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess -Unique;if(@($p).Count -ne 1){throw 'Ambiguous listener'};$c=Get-CimInstance Win32_Process -Filter ('ProcessId='+$p);if($c.Name -ne 'node.exe' -or $c.CommandLine -notmatch 'server\\.mjs' -or $c.CommandLine -match '--test'){throw 'Unrecognized process'};Stop-Process -Id $p -Force;Write-Output 'Verified KAIRO loopback process stopped.'"""
if health:
 p=subprocess.run(['powershell.exe','-NoProfile','-Command',inspect],capture_output=True,text=True)
 if p.returncode:raise SystemExit('Local process verification failed; details suppressed.')
env=os.environ.copy();env.update(PORT='4188',KAIRO_CLOUD_ENABLED='1',KAIRO_GOOGLE_PROJECT='kairo-access-20261021',KAIRO_GROQ_FREE_PLAN_CONFIRMED='1',KAIRO_OPENROUTER_FREE_MODEL='openrouter/free')
if space and space.get('cohort') in ('engineering','informatics'):env['KAIRO_LOCAL_CURRICULUM']=space['cohort']
for line in (r/'tools/provider-lab/.env.local').read_text(encoding='utf-8').splitlines():
 if '=' not in line or line.lstrip().startswith('#'):continue
 k,v=line.split('=',1)
 if k.strip() in ('GROQ_API_KEY','OPENROUTER_API_KEY'):env['KAIRO_'+k.strip()]=v.strip().strip('"').strip("'")
log=open(r/'docs/ai-integration-20261025/local-server.txt','ab')
process=subprocess.Popen([shutil.which('node'),'server.mjs'],cwd=r/'studio',env=env,stdin=subprocess.DEVNULL,stdout=log,stderr=log,creationflags=subprocess.CREATE_NO_WINDOW);log.close()
for _ in range(30):
 try:
  status=read('/api/workspace/ai/status')
  result={'pid':process.pid,'port':4188,'ready':True,'configuredProviders':[p['id'] for p in status['providers'] if p['configured']],'browserObserved':False}
  (r/'docs/ai-integration-20261025/local-ready.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result));break
 except Exception:time.sleep(1)
else:raise SystemExit('The local server did not confirm readiness. Inspect the local server log.')
