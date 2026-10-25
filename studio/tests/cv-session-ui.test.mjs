import test from 'node:test';
import assert from 'node:assert/strict';
import {createSessionImportReader,sessionForFreshReview} from '../src/cv-workspace/session.ts';
import {createCvSessionFile} from '../src/cv-session-transfer/index.ts';

const session={facts:[{id:'name',section:'contact',text:'Applicant example',providedBy:'applicant',confirmation:'confirmed'}],targetRoleRequirements:{label:'Example role',requirements:['Example requirement']}};
const json=createCvSessionFile(session);
test('oversized file is refused before file reading and invalid content cannot produce a replacement',async()=>{
 let reads=0;const reader=createSessionImportReader();
 await assert.rejects(reader.read({size:131073,text:async()=>{reads++;return json;}}),/128 KiB/);assert.equal(reads,0);
 await assert.rejects(reader.read({size:5,text:async()=>'{bad'}));
});
test('editing or a newer file invalidates an earlier async read, including stale errors',async()=>{
 const reader=createSessionImportReader();let resolve,reject;
 const first=reader.read({size:100,text:()=>new Promise(r=>resolve=r)});
 reader.invalidate();resolve(json);assert.deepEqual(await first,{status:'stale'});
 const old=reader.read({size:100,text:()=>new Promise((_,r)=>reject=r)});
 const latest=await reader.read({size:json.length,text:async()=>json});
 reject(new Error('stale error'));assert.deepEqual(await old,{status:'stale'});assert.equal(latest.status,'ready');
});
test('opening file returns a candidate without changing caller data; replacement needs fresh confirmation',async()=>{
 const reader=createSessionImportReader(),before=structuredClone(session);
 const result=await reader.read({size:json.length,text:async()=>json});assert.equal(result.status,'ready');
 assert.equal(result.session.facts[0].confirmation,'confirmed');
 const replacement=sessionForFreshReview(result.session);
 assert.equal(replacement.facts[0].confirmation,'unconfirmed');
 assert.equal(replacement.target,'Example role');assert.equal(replacement.requirements,'Example requirement');
 assert.deepEqual(session,before);assert.equal(result.session.facts[0].confirmation,'confirmed');
});
