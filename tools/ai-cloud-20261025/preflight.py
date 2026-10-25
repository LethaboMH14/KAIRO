"""Read-only cloud metadata. Never emit raw configuration or credential values."""
import json, subprocess, shutil
from pathlib import Path
r=Path(__file__).resolve().parents[2]
cmd=shutil.which('gcloud.cmd') or shutil.which('gcloud')
if not cmd: raise SystemExit('Google Cloud CLI is unavailable.')
p=subprocess.run([cmd,'run','services','describe','kairo-app','--project=kairo-access-20261021','--region=africa-south1','--format=json','--quiet'],capture_output=True,text=True,encoding='utf-8')
if p.returncode: raise SystemExit('Cloud metadata read failed; raw output suppressed.')
v=json.loads(p.stdout);spec=v.get('spec',{}).get('template',{}).get('spec',{});container=spec.get('containers',[{}])[0]
allowed={'KAIRO_CLOUD_ENABLED','KAIRO_GOOGLE_MODEL','KAIRO_GOOGLE_LOCATION','KAIRO_GOOGLE_PROJECT','KAIRO_SEMANTIC_RETRIEVAL','KAIRO_GROQ_FREE_PLAN_CONFIRMED'}
env={e['name']:e.get('value') for e in container.get('env',[]) if e.get('name') in allowed and 'value' in e}
summary={'project':'kairo-access-20261021','region':'africa-south1','service':'kairo-app','readyRevision':v.get('status',{}).get('latestReadyRevisionName'),'url':v.get('status',{}).get('url'),'nonsecretModelSettings':env,'configuredEnvironmentNames':[e.get('name') for e in container.get('env',[])],'resources':container.get('resources',{}),'concurrency':spec.get('containerConcurrency'),'serviceAccount':spec.get('serviceAccountName'),'terraformAvailable':bool(shutil.which('terraform')),'kubectlAvailable':bool(shutil.which('kubectl'))}
out=r/'docs/ai-integration-20261025/cloud-preflight.json';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(summary,indent=2),encoding='utf-8');print(json.dumps(summary,indent=2))
