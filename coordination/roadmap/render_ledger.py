from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent
data=json.loads((ROOT/'backlog.json').read_text());wave=json.loads((ROOT/'wave-status.json').read_text())
assert len(data['areas'])==15
ids=[i['id'] for a in data['areas'] for i in a['items']];assert len(ids)==len(set(ids))
lines=['# KAIRO remaining-work checklist','','Recorded 22 October 2026 from the full user-requested 15-area backlog. Original outcomes stay unchecked until their own acceptance is evidenced. Existing prototypes and reviewed foundations are not equivalent to completed product areas.','','## First delegated work packages','']
for w in wave['packages']:
 done=w['status']=='reviewed_done'
 if done:assert w['evidence'] and w['review'],'Reviewed completion needs evidence and reviewer decision'
 lines.append(f"- [{'x' if done else ' '}] {w['id']} — {w['deliverable']} ({w['status']}; {w['task']})")
lines+=['','## Full product outcomes','']
for area in data['areas']:
 lines +=[f"### {area['id']}. {area['title']}",'']
 for item in area['items']:
  done=item['status']=='reviewed_done'
  if done:assert item['evidence'] and item['reviewer']
  lines.append(f"- [{'x' if done else ' '}] {item['id']} {item['title']}")
 lines.append('')
lines+=['## Dependencies and review','','Immediate flow: reviewed Engineering acceptance and character completion; inspectable work/evidence bridge; grounded adaptive practice; broader simulation; permissioned tools; authenticated pilot and measured learner outcomes.','','Existing working baseline: source/OCR review and cited lessons, classroom/CS/Engineering modules, shop case, local progress, teacher voice/rig rehearsal and historical-role preparation. Their current tests and limits are in the individual handoffs. They are not replaced by this remaining-work list.','','Claude retains active character claims. Additional Claude tasks are queued in CLAUDE-DELEGATION.md until its own activity confirms dispatch.']
(ROOT/'BACKLOG.md').write_text('\n'.join(lines)+'\n',encoding='utf8')
print('Rendered',len(ids),'items; reviewed packages:',sum(w['status']=='reviewed_done' for w in wave['packages']))
