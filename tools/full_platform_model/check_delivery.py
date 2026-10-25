"""Bounded checks: installed guidance, full-vision coverage and independently recomputed amounts."""
import json, re, hashlib
from pathlib import Path
from cost_model import ROOT, OUT, result
data=result()
canvas=(OUT/'LEAN-CANVAS.md').read_text(encoding='utf-8')
parts=re.findall(r'## (\d+)\. ([^\n]+)\n\n(.*?)(?=\n## |\n---|\Z)',canvas,re.S)
assert len(parts)==9
assert len(parts[0][2].strip().split('\n\n'))==2
for term in ['personal','multimodal','SASL','NSFAS','bursar','employer','Company','R59','R149']:
    assert term.lower() in canvas.lower(),term
folder=OUT/'paste-ready';files=sorted(folder.glob('*.txt'));assert len(files)==9
for f,(_,title,body) in zip(files,parts):f.write_text(body.strip()+'\n',encoding='utf-8')
record=json.loads((Path(__file__).parent/'skill-review/source.json').read_text())
hashes={}
for name in record['skills']:
    base=Path('C:/Users/USER/.codex/skills')/name
    expected=[x.split('/'+name+'/',1)[1] for x in record['files'] if '/'+name+'/' in x]
    for rel in expected:
        dest=base/rel;source=Path(__file__).parent/'skill-review'/name/rel
        assert dest.is_file(),str(dest)
        assert dest.read_bytes()==source.read_bytes(),str(dest)
        hashes[str(dest)]=hashlib.sha256(dest.read_bytes()).hexdigest()
assert 250*59*12+15000==192000
assert 50*149*12+15000==104400
assert 250*35*12+6000==111000
assert abs(data['custom_training_quote_ex_vat']*(1-.3)-50000)<1e-6
assert abs(data['mixed_run_rates'][0]['recurring_revenue_ex_vat']-82166.08695652174)<1e-6
report={'nine_fields':'PASS','problem_two_paragraphs':'PASS','full_journey_terms':'PASS',
 'pricing_and_cost_checks':data['checks'],'installed_files_match_reviewed_commit':hashes,
 'no_app_feature_deployment':'This task installs guidance and prepares researched docs/cost envelope only.'}
(Path(__file__).parent/'verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='installed_files_match_reviewed_commit'},indent=2))
print('Verified installed Markdown files:',len(hashes))
