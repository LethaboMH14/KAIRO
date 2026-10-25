"""Authorized provider keys to the approved Secret Manager project; never print keys."""
import json,subprocess,shutil
from pathlib import Path
r=Path(__file__).resolve().parents[2];g=shutil.which('gcloud.cmd') or shutil.which('gcloud')
project='kairo-access-20261021';runtime='kairo-app-runtime@'+project+'.iam.gserviceaccount.com'
def call(args,secret=None,allow_failure=False):
 p=subprocess.run([g,*args,'--project='+project,'--quiet'],input=secret,capture_output=True,text=True,encoding='utf-8')
 if p.returncode and not allow_failure:raise SystemExit('Cloud operation failed: '+args[0]+' '+args[1]+'. Raw output suppressed.')
 return p
values={}
for line in (r/'tools/provider-lab/.env.local').read_text(encoding='utf-8').splitlines():
 if '=' in line and not line.lstrip().startswith('#'):
  k,v=line.split('=',1);values[k.strip()]=v.strip().strip('"').strip("'")
report={'keysPrinted':False,'secrets':[]}
call(['services','enable','secretmanager.googleapis.com'])
for name,local,environment in [('kairo-groq-key','GROQ_API_KEY','KAIRO_GROQ_API_KEY'),('kairo-openrouter-key','OPENROUTER_API_KEY','KAIRO_OPENROUTER_API_KEY')]:
 key=values.get(local)
 if not key:continue
 if call(['secrets','describe',name,'--format=value(name)'],allow_failure=True).returncode:call(['secrets','create',name,'--replication-policy=automatic'])
 version=call(['secrets','versions','add',name,'--data-file=-','--format=value(name)'],secret=key).stdout.strip().rsplit('/',1)[-1]
 if not version.isdigit():raise SystemExit('Secret version was not confirmed.')
 call(['secrets','add-iam-policy-binding',name,'--member=serviceAccount:'+runtime,'--role=roles/secretmanager.secretAccessor'])
 report['secrets'].append({'environment':environment,'secret':name,'version':version})
(r/'docs/ai-integration-20261025/provider-secrets.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))
