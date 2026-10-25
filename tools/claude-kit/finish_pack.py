"""Build explicit inventories and extend the standalone, offline review prototype."""
from pathlib import Path
import json,hashlib
ROOT=Path(__file__).resolve().parents[2];PACK=ROOT/'coordination/briefs/AVATAR-AND-PATHWAYS'
p=PACK/'sources.json';data=json.loads(p.read_text(encoding='utf8'))
new=[
 ('EMP-FNB-GRAD','https://firstrand.wd3.myworkdayjobs.com/en-GB/FRB/job/Johannesburg/FNB-Graduate-Programme_R46834?q=graduate','FNB / FirstRand','historical_employer_job',['Relevant final-year BSc/Commerce fields, academic results/transcript, analysis and customer/team delivery appear in the advert.'],'Closed: stated deadline 2026-08-31. Historical preparation only; not an open opportunity.'),
 ('EMP-FNB-DATA','https://firstrand.wd3.myworkdayjobs.com/en-US/FRB/job/Data-Analyst-II_R48624','FNB / FirstRand','historical_employer_job',['Describes data flows, data quality, root-cause analysis and stakeholder work.'],'Indexed closing date 2026-04-28; historical role evidence, not a graduate vacancy.'),
 ('EMP-FNB-BA','https://firstrand.wd3.myworkdayjobs.com/en-US/FRB/job/Randburg/Business-Analyst-1_R37730','FNB / FirstRand','employer_job_excerpt',['Describes eliciting and validating business requirements and translating them into solution requirements.'],'Primary search excerpt verified; full requirements and current availability not established.'),
 ('EMP-FNB-CONTEXT','https://www.fnb.co.za/careers/graduates.html','FNB','employer_programme',['Graduate programme context includes projects, communication, business writing and stakeholder work.'],'Programme context/diaries, not a current open vacancy or universal mandatory criteria.'),
 ('TOOLS-YOUTUBE','https://developers.google.com/youtube/iframe_api_reference','Google','technical_documentation',['Supports embedding and controlling a YouTube player.'],'Provider playback, identity, attribution and embed restrictions still apply.'),
 ('TOOLS-LINKEDIN','https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access','LinkedIn / Microsoft','technical_documentation',['API access is scoped by product and permission.'],'Sign-in permissions are not general profile editing, recruitment or job application access.'),
 ('LEARN-SQL','https://www.postgresql.org/docs/current/tutorial-sql.html','PostgreSQL','official_tutorial',['Tutorial includes tables, queries, joins and aggregation.'],'Learning resource; content does not independently establish workplace competence.'),
 ('LEARN-GITHUB','https://skills.github.com/','GitHub','official_learning_portal',['Redirects to GitHub Learn.'],'Check current courses, account needs and access before assigning.')]
for id,url,publisher,kind,facts,limit in new:
 data['sources']=[s for s in data['sources'] if s['id']!=id]
 data['sources'].append(dict(id=id,url=url,publisher=publisher,kind=kind,status='checked_2026-10-21',facts=facts,limit=limit))
data['unresolved']=[s for s in data['unresolved'] if s['requested']!='FNB graduate requirements']
p.write_text(json.dumps(data,indent=2,ensure_ascii=False),encoding='utf8')
template=ROOT/'tools/claude-kit/review.template.html';html=template.read_text(encoding='utf8')
if "id:'fnb'" not in html:
 html=html.replace('const roles=[',"const roles=[{id:'fnb',label:'FNB preparation',source:'EMP-FNB-GRAD',title:'Build evidence for a banking career.',kind:'Historical advert · closed 31 August 2026',requirements:['Relevant final-year background, academic results/transcript and analytical ability appear in R46834.','Customer understanding, planning and team delivery connect preparation to real tasks.'],task:'Resolve a synthetic service-quality case: clarify requirements, reconcile data, test a solution and present limitations.',outputs:['Requirements and acceptance criteria','Executed SQL checks and reviewed artifact','Honest contribution log and tailored project/CV draft']},")
if 'id="fit-demo"' not in html:
 panel='''<article class="card" id="fit-demo" style="margin-top:25px"><span class="tag warn">Illustrative rubric · not your profile or FNB scoring</span><h2>What evidence can you show?</h2><p>Change the sample evidence below. Weights are KAIRO design choices. Qualifications and deadline gates stay separate.</p><div id="fit-inputs"></div><div id="fit-result" class="feedback" aria-live="polite"></div><p class="tiny">Historical FNB graduate advert: CLOSED. A high coverage score cannot reopen it. Unknown evidence does not mean no ability.</p><a href="FNB-ROLE-AND-TOOLS.md">Full role, work-simulation and permissioned-tools specification ↗</a></article>'''
 html=html.replace('<section class="pane" role="tabpanel" id="opportunities"',panel+'<section class="pane" role="tabpanel" id="opportunities"')
 # Keep the new card inside Employer evidence, rather than visible on every tab.
 html=html.replace('</section>\n'+panel,panel+'</section>\n')
 html=html.replace('</script>', '''
const fitCriteria=[['SQL practice',2,'artifact'],['Analysis',2,'reviewed'],['Communication',1,'self'],['Testing',1,'unknown']];
const fitPoints={unknown:0,self:.25,artifact:.5,reviewed:1};
$('#fit-inputs').innerHTML=fitCriteria.map(([name,weight,state],i)=>`<p><label for="fit-${i}">${name} · weight ${weight}</label> <select id="fit-${i}">${Object.keys(fitPoints).map(k=>`<option value="${k}" ${k===state?'selected':''}>${k}</option>`).join('')}</select></p>`).join('');
function updateFit(){let earned=0,total=0,unknown=0;fitCriteria.forEach(([,w],i)=>{const state=$('#fit-'+i).value;total+=w;earned+=w*fitPoints[state];if(state==='unknown')unknown+=w;});$('#fit-result').textContent=`${Math.round(100*earned/total)}% KAIRO evidence coverage · ${Math.round(100*unknown/total)}% unassessed weight. Not a hiring probability, ATS result or eligibility decision.`;}
document.querySelectorAll('#fit-inputs select').forEach(s=>s.onchange=updateFit);updateFit();
</script>''')
template.write_text(html,encoding='utf8')
skills=[]
for path in sorted((ROOT/'.claude/skills').iterdir()):
 if not (path/'SKILL.md').exists():continue
 name=path.name;origin='existing project skill';revision=None;license='See bundled source/licence'
 if name in ['pdf','docx','webapp-testing']:
  origin='https://github.com/anthropics/skills';revision='dbd4588f9e1033efb41dad4bef2f7947c8993d44';license='Anthropic source-available service terms' if name in ['pdf','docx'] else 'Apache-2.0'
 elif name in ['threejs-shaders','threejs-postprocessing']:
  origin='https://github.com/CloudAI-X/threejs-skills';revision='0e181866f095b5f06d005133876e926515390d95'
 elif name=='remotion-best-practices':origin='https://github.com/remotion-dev/skills';revision='039e8a2fc78b67efc228d5645367838b85818a1c'
 elif name=='kairo-avatar-production':origin='KAIRO project-authored';license='Project guidance'
 skills.append(dict(name=name,path=str(path.relative_to(ROOT)).replace('\\','/'),origin=origin,revision=revision,license=license,entrySha256=hashlib.sha256((path/'SKILL.md').read_bytes()).hexdigest(),fileCount=sum(1 for p in path.rglob('*') if p.is_file())))
(PACK/'skills.json').write_text(json.dumps({'checked':'2026-10-21','scope':'Project-local Claude Code guidance; not browser Design runtime tools','items':skills},indent=2),encoding='utf8')
print('Source registry, FNB explorer and skill inventory prepared.')
