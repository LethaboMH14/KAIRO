import json,re,subprocess
from pathlib import Path
r=Path(__file__).resolve().parents[2]
files=set(p.decode('utf-8') for p in subprocess.check_output(['git','ls-files','-z'],cwd=r).split(b'\0') if p)
denied=[p for p in files if re.search(r'(^|/)(node_modules|\.terraform|\.venv[^/]*|private|\.cache|\.probe-data)(/|$)',p) or p.endswith(('.local.json','.local','.pem','.tfstate','.sqlite','.sqlite3')) or ('/.env' in '/'+p and not p.endswith('.example'))]
missing=[]
for prefix in ['studio/src','studio/server','studio/public','studio/data','studio/tests']:
 for path in (r/prefix).rglob('*'):
  if path.is_file() and path.suffix!='.tsbuildinfo' and '__pycache__' not in path.parts:
   rel=path.relative_to(r).as_posix()
   if rel not in files:missing.append(rel)
required=['README.md','LICENSE','.gitignore','studio/package.json','studio/package-lock.json','studio/server.mjs','coordination/bus.py','tools/material_ingestion/extract.py','tools/github-publication-20261025/requirements-extraction.txt']
missing += [p for p in required if p not in files]
report={'stagedFiles':len(files),'privatePaths':denied,'missingApplicationFiles':missing,'sourceCoveragePassed':not missing,'privatePathCheckPassed':not denied}
(r/'docs/github-publication-20261025/index-check.local.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report,indent=2))
if denied or missing:raise SystemExit(1)
