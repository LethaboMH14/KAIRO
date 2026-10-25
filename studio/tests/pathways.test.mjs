import test from 'node:test';
import assert from 'node:assert/strict';
import {roles,coverage,parsePathway,initialPathway,deadlineState,pathwayMarkdown,parsePathwayArtifactLinks,createPathwayArtifactLinkFromProfile,resolvePathwayArtifactLink} from '../src/pathways/model.ts';
import {initialCase,records,transition,caseRecord} from '../src/practice/model.ts';
import {collectArtifacts} from '../src/evidence/model.ts';
const at='2026-10-22T08:00:00.000Z';
function replayableShopRun(id='shop-run-1'){
 let s=initialCase(id,null);
 s=transition(s,{type:'calculate',value:23},at);
 for(const key of Object.keys(records))s=transition(s,{type:'inspect',key},at);
 s=transition(s,{type:'reconcile',difference:2,cause:'damage'},at);
 s=transition(s,{type:'decide',value:'record'},at);
 s=transition(s,{type:'reflect',value:'I compared the stock with the damage record and documented a careful handover.'},at);
 return caseRecord(s);
}
test('empty evidence is unassessed rather than established inability',()=>{
 const s=coverage(roles[0].criteria,{});assert.equal(s.percent,0);assert.equal(s.unassessed,100);assert.equal(s.next[0].id,'analysis');
});
test('an evidence level without a note cannot inflate coverage and later edits remove points',()=>{
 const criteria=roles[0].criteria;
 assert.equal(coverage(criteria,{analysis:{level:'reviewReported',note:' '}}).percent,0);
 const e={analysis:{level:'artifact',note:'Practice run, with query and limitations'},customer:{level:'reviewReported',note:'User reports a review; not verified'}};
 assert.equal(coverage(criteria,e).percent,60);assert.equal(coverage(criteria,e).unassessed,20);
 assert.equal(coverage(criteria,{...e,analysis:{level:'unknown',note:'Withdrawn'}}).percent,40);
});
test('a closed advert stays closed regardless of evidence coverage',()=>{
 const role=roles[0];const evidence=Object.fromEntries(role.criteria.map(c=>[c.id,{level:'reviewReported',note:'Reported review'}]));
 assert.equal(coverage(role.criteria,evidence).percent,100);assert.equal(deadlineState(role.deadline,'2026-10-21'),'closed');
 assert.equal(deadlineState(null,'2026-10-21'),'unknown');assert.equal(deadlineState(role.deadline,'2026-08-31'),'recheck');
});
test('storage rejects forged levels, unknown criteria and oversized notes rather than promoting them',()=>{
 const s=initialPathway();
 for(const evidence of [{analysis:{level:'verified',note:'x'}},{constructor:{level:'self',note:'x'}},{analysis:{level:'self',note:'x'.repeat(1201)}}])assert.throws(()=>parsePathway(JSON.stringify({...s,evidence})));
 assert.throws(()=>parsePathway(JSON.stringify({...s,roleId:'fake'})));
 assert.deepEqual(parsePathway(JSON.stringify(s)),s);
});
test('exports retain primary source, closure and self-report limitations',()=>{
 const output=pathwayMarkdown(initialPathway());assert.match(output,/R46834/);assert.match(output,/2026-08-31/);assert.match(output,/user-entered and unverified/);assert.match(output,/Not an employer\/ATS score/);assert.match(output,/Nothing was submitted/);
});
test('a learner-selected link resolves only to an actually replayed current artifact and round-trips separately',()=>{
 const artifact=collectArtifacts({version:1,lessons:[],cases:[replayableShopRun()]})[0];assert.ok(artifact);
 const profile={version:1,lessons:[],cases:[replayableShopRun()]};const link=createPathwayArtifactLinkFromProfile('graduate','analysis',profile,'shop-run-1',at);
 const saved=parsePathwayArtifactLinks(JSON.stringify({version:1,links:[link]}));
 const resolved=resolvePathwayArtifactLink(saved[0],[artifact]);assert.equal(resolved.artifact?.runId,'shop-run-1');
 const out=pathwayMarkdown({...initialPathway(),evidence:{analysis:{level:'self',note:'My explanation remains here.'}}},[resolved]);
 assert.match(out,/Linked practice:/);assert.match(out,/shop-run-1/);assert.match(out,/practice-artifact-v1/);assert.match(out,/corner-shop-v1/);assert.match(out,/browser-local profile/);assert.match(out,/inspect at \/evidence/);assert.match(out,/My explanation remains here/);
 assert.equal(coverage(roles[0].criteria,initialPathway().evidence).percent,0);
});
test('removed, stale, unknown-role criterion, and unreplayable runs remain rejected or unavailable',()=>{
 const artifact=collectArtifacts({version:1,lessons:[],cases:[replayableShopRun()]})[0];const link=createPathwayArtifactLinkFromProfile('graduate','analysis',{version:1,lessons:[],cases:[replayableShopRun()]},'shop-run-1',at);
 assert.throws(()=>createPathwayArtifactLinkFromProfile('graduate','analysis',{version:1,lessons:[],cases:[]},'shop-run-1',at),/no longer available/);
 const duplicatedProfile={version:1,lessons:[],cases:[replayableShopRun(),replayableShopRun()]};
 assert.throws(()=>createPathwayArtifactLinkFromProfile('graduate','analysis',duplicatedProfile,'shop-run-1',at),/ambiguous/);
 assert.equal(resolvePathwayArtifactLink(link,[]).reason,'This run is no longer available or no longer passes replay checks.');
 assert.match(resolvePathwayArtifactLink({...link,scenarioVersion:'old'},[artifact]).reason,/version changed/);
 assert.throws(()=>createPathwayArtifactLink('graduate','not-a-criterion',artifact,at));
 assert.throws(()=>parsePathwayArtifactLinks(JSON.stringify({version:1,links:[{...link,criterionId:'not-a-criterion'}]})));
 const tampered=replayableShopRun('bad-run');tampered.events[0].value='not the recorded action';
 assert.deepEqual(collectArtifacts({version:1,lessons:[],cases:[tampered]}),[]);
});
test('duplicate and unsupported link records cannot be silently accepted',()=>{
 const artifact=collectArtifacts({version:1,lessons:[],cases:[replayableShopRun()]})[0];const link=createPathwayArtifactLinkFromProfile('graduate','analysis',{version:1,lessons:[],cases:[replayableShopRun()]},'shop-run-1',at);
 assert.throws(()=>parsePathwayArtifactLinks(JSON.stringify({version:2,links:[link]})));
 assert.throws(()=>parsePathwayArtifactLinks(JSON.stringify({version:1,links:[link,link]})));
 const extra=parsePathwayArtifactLinks(JSON.stringify({version:1,links:[{...link,token:'private-extra',unexpected:{x:1}}]}));
 assert.equal(Object.hasOwn(extra[0],'token'),false);assert.equal(Object.hasOwn(extra[0],'unexpected'),false);
 assert.throws(()=>parsePathwayArtifactLinks(JSON.stringify({version:1,links:[{...link,artifactVersion:'x'.repeat(121)}]})));
 assert.throws(()=>parsePathwayArtifactLinks(JSON.stringify({version:1,links:[{...link,scenarioVersion:'x'.repeat(121)}]})));
 assert.throws(()=>parsePathwayArtifactLinks(JSON.stringify({version:1,links:[{...link,linkedAt:'2026-02-30T08:00:00.000Z'}]})));
 assert.throws(()=>parsePathwayArtifactLinks(' '.repeat(32001)));
});
