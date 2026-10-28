import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {makeRoleLink,parseRoleLinks,persistRoleLink,roleGapRows} from '../src/role-gap-host/model.ts';
const role=JSON.parse(readFileSync(new URL('../data/role-opportunities/engineering.json',import.meta.url),'utf8')).roles[0];
const artifacts=[{runId:'synthetic-run',scenarioVersion:'v1',title:'Synthetic replay fixture'}],skill=role.requirements.find(r=>r.kind==='skill'),formal=role.requirements.find(r=>r.kind==='qualification');
test('current explicit practice links are distinct from formal requirement evidence',()=>{
 const link=makeRoleLink(role,skill.id,artifacts,'synthetic-run','2026-10-25T00:00:00.000Z'),rows=roleGapRows(role,[link],artifacts);
 assert.equal(rows.find(r=>r.id===skill.id).evidenceStatus,'linked');assert.equal(rows.find(r=>r.id===formal.id).evidenceStatus,'needs-review');
 assert.throws(()=>makeRoleLink(role,formal.id,artifacts,'synthetic-run',link.linkedAt),/cannot establish/);
 assert.match(rows.find(r=>r.id===skill.id).evidenceLabel,/not verified competence/);
});
test('removed, ambiguous, changed scenario and source revisions never retain linked status',()=>{
 const link=makeRoleLink(role,skill.id,artifacts,'synthetic-run','2026-10-25T00:00:00.000Z');
 for(const records of [[],[...artifacts,...artifacts],[{...artifacts[0],scenarioVersion:'v2'}]])assert.equal(roleGapRows(role,[link],records).find(r=>r.id===skill.id).evidenceStatus,'needs-review');
 for(const changed of [{...role,checkedAt:'2026-10-26'},{...role,requirements:role.requirements.map(r=>r.id===skill.id?{...r,label:'Changed requirement'}:r)}])assert.equal(roleGapRows(changed,[link],artifacts).find(r=>r.id===skill.id).evidenceStatus,'needs-review');
 assert.throws(()=>makeRoleLink(role,skill.id,[...artifacts,...artifacts],'synthetic-run',link.linkedAt),/unambiguous/);
});
test('malformed saved records are rejected instead of overwritten as empty history',()=>{
 assert.deepEqual(parseRoleLinks(null),[]);for(const raw of ['{bad',JSON.stringify({schemaVersion:2,links:[]}),JSON.stringify({schemaVersion:1,links:[{}]})])assert.throws(()=>parseRoleLinks(raw));
 const link=makeRoleLink(role,skill.id,artifacts,'synthetic-run','2026-10-25T00:00:00.000Z');assert.deepEqual(parseRoleLinks(JSON.stringify({schemaVersion:1,links:[link]})),[link]);assert.throws(()=>parseRoleLinks(JSON.stringify({schemaVersion:1,links:[link,link]})),/Ambiguous/);
});
test('guarded persistence serializes writers, rejects stale snapshots and never writes without lock support',async()=>{
 let raw=null,writes=0,tail=Promise.resolve();const storage={getItem:()=>raw,setItem:(_key,value)=>{raw=value;writes++;}};
 const withLock=work=>{const result=tail.then(work);tail=result.catch(()=>{});return result;};
 const link=makeRoleLink(role,skill.id,artifacts,'synthetic-run','2026-10-25T00:00:00.000Z');
 const results=await Promise.allSettled([persistRoleLink({storage,expectedRaw:null,link,withLock}),persistRoleLink({storage,expectedRaw:null,link,withLock})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(writes,1);assert.equal(parseRoleLinks(raw).length,1);
 await assert.rejects(persistRoleLink({storage,expectedRaw:raw,link,withLock:null}),/cannot coordinate safe/);assert.equal(writes,1);
});
