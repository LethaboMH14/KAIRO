import test from 'node:test';
import assert from 'node:assert/strict';
import {hash} from '../server/workspace/model.mjs';
import {CONSENT_SCHEMA,STAGED_SCHEMA,StudioDraftStagingError,stageLocalPumpDraft} from '../server/studio-draft-staging/index.mjs';

const owner='synthetic-owner-alice';
const lessonId='a'.repeat(24),sourceId='b'.repeat(24);
const pages=[{text:'Synthetic illustrative pump teaching material with a source-linked observation and a worked example. '.repeat(3),locator:'P1',method:'text',edited:false}];
const revision=hash(pages);
const at=()=>new Date('2026-10-25T15:00:00.000Z');
const safe=()=>({
 schema:'kairo-pump-integration-preflight/1',status:'reviewable-local-draft-only',studio:'pump-lab',
 caseId:'baseline-commissioning',sourceRef:{sourceId,revision},modelVersion:'kairo-pump-lab-model/1',
 actionLogSha256:'c'.repeat(64),actionCount:2,illustrativeCaseCompleted:false,
 replayConsistent:true,ownerSourceLinked:true,identityOfAttemptVerified:false,
 competencyExternallyVerified:false,canSaveVerifiedEvidence:false,publishable:false,
 warning:'Synthetic local only, not a grade'
});
function fixture(){
 const rows=new Map();
 const key=(uid,kind,id)=>uid+':'+kind+':'+id;
 const source={id:sourceId,revision,reviewed:true,reviewedPages:structuredClone(pages)};
 rows.set(key(owner,'lessons',lessonId),{id:lessonId,value:{id:lessonId,sourceId,revision},version:'v1'});
 rows.set(key(owner,'sources',sourceId),{id:sourceId,value:source,version:'v1'});
 rows.set(key(owner,'revisions',sourceId+'_'+revision),{id:sourceId+'_'+revision,value:source,version:'v1'});
 const writes=[];
 const repository={
  async get(uid,kind,id){return structuredClone(rows.get(key(uid,kind,id))||null);},
  async put(uid,kind,id,value,options){
   assert.deepEqual(options,{create:true});writes.push({uid,kind,id,value:structuredClone(value)});
   const k=key(uid,kind,id);
   if(rows.has(k))throw Object.assign(new Error('Version conflict'),{status:409});
   rows.set(k,{id,value:structuredClone(value),version:'new'});
   return {id,value,version:'new'};
  }
 };
 const input={repository,ownerId:owner,lessonId,expectedSessionId:'synthetic-session-001',
  consent:true,preflight:async()=>safe(),clock:at};
 return {rows,writes,repository,input,key};
}
const rejects=async(p,code)=>assert.rejects(p,e=>e instanceof StudioDraftStagingError&&e.code===code);

test('stores only private local-unverified consented metadata using create-only owner repository',async()=>{
 const f=fixture(),out=await stageLocalPumpDraft(f.input);
 assert.match(out.draftId,/^[a-f0-9]{24}$/);
 assert.equal(out.status,'local-unverified');assert.equal(out.duplicate,false);
 assert.equal(out.publishable,false);assert.equal(out.canSaveVerifiedEvidence,false);
 assert.equal(f.writes.length,1);assert.equal(f.writes[0].kind,'drafts');
 const stored=f.writes[0].value;
 assert.equal(stored.schema,STAGED_SCHEMA);assert.equal(stored.consentSchema,CONSENT_SCHEMA);
 assert.equal(stored.consentAt,'2026-10-25T15:00:00.000Z');
 assert.deepEqual(stored.sourceRef,{sourceId,revision});
 assert.equal(stored.replayConsistentAtPreflight,true);
 assert.equal(stored.identityOfAttemptVerified,false);
 assert.equal(stored.competencyExternallyVerified,false);
 const serialized=JSON.stringify({out,stored});
 for(const sensitive of [owner,'synthetic-session-001','Synthetic illustrative pump teaching material'])assert.equal(serialized.includes(sensitive),false);
});
test('same attempt is idempotent even when the consent clock changes',async()=>{
 const f=fixture(),first=await stageLocalPumpDraft(f.input);
 const second=await stageLocalPumpDraft({...f.input,clock:()=>new Date('2026-10-25T16:00:00Z')});
 assert.equal(second.draftId,first.draftId);assert.equal(second.duplicate,true);
 assert.equal(f.writes.length,2);
 assert.equal(f.rows.get(f.key(owner,'drafts',first.draftId)).value.consentAt,'2026-10-25T15:00:00.000Z');
});
test('two concurrent creates resolve to one private draft',async()=>{
 const f=fixture(),[a,b]=await Promise.all([stageLocalPumpDraft(f.input),stageLocalPumpDraft(f.input)]);
 assert.equal(a.draftId,b.draftId);assert.equal([a.duplicate,b.duplicate].filter(Boolean).length,1);
});
test('rejects absent consent before reading or writing',async()=>{
 const f=fixture();
 await rejects(stageLocalPumpDraft({...f.input,consent:false,preflight:()=>{throw Error('should not run');}}),'explicit-consent-required');
 await rejects(stageLocalPumpDraft({...f.input,consent:'true'}),'explicit-consent-required');
 assert.deepEqual(f.writes,[]);
});
test('rejects forged trust elevation and malformed preflight without writing',async()=>{
 for(const bad of [
  {publishable:true},{canSaveVerifiedEvidence:true},{identityOfAttemptVerified:true},
  {competencyExternallyVerified:true},{replayConsistent:false},{ownerSourceLinked:false},
  {status:'verified'},{actionCount:0},{sourceRef:{sourceId,revision:'bad'}},
  {actionLogSha256:'not-a-sha'},{studio:'sql-join'}
 ]){
  const f=fixture();
  await rejects(stageLocalPumpDraft({...f.input,preflight:async()=>({...safe(),...bad})}),'preflight-not-reviewable');
  assert.equal(f.writes.length,0);
 }
});
test('preflight failure is redacted and cannot leak private learner data',async()=>{
 const f=fixture();
 await assert.rejects(stageLocalPumpDraft({...f.input,preflight:async()=>{throw Error('private-learner-answer');}}),e=>
  e.code==='preflight-unavailable'&&!String(e).includes('private-learner-answer'));
 assert.equal(f.writes.length,0);
});
test('source owner, reviewed state, immutable revision and lesson revision must all match',async()=>{
 const tests=[
  f=>{f.input.ownerId='synthetic-owner-bob';},
  f=>{f.rows.get(f.key(owner,'sources',sourceId)).value.reviewed=false;},
  f=>{f.rows.delete(f.key(owner,'revisions',sourceId+'_'+revision));},
  f=>{f.rows.get(f.key(owner,'lessons',lessonId)).value.revision='d'.repeat(64);},
  f=>{f.rows.get(f.key(owner,'sources',sourceId)).value.reviewedPages[0].text='tampered';},
  f=>{f.rows.get(f.key(owner,'lessons',lessonId)).value.sourceRefs=[{sourceId,revision}];}
 ];
 for(const mutate of tests){
  const f=fixture();mutate(f);
  await assert.rejects(stageLocalPumpDraft(f.input),e=>e instanceof StudioDraftStagingError&&e.status===409);
  assert.equal(f.writes.length,0);
 }
});
test('a source change between reads is rejected before any draft write',async()=>{
 const f=fixture(),get=f.repository.get;
 let sourceReads=0;
 f.repository.get=async(uid,kind,id)=>{
  const value=await get(uid,kind,id);
  if(kind==='sources'&&++sourceReads===2)value.value.reviewed=false;
  return value;
 };
 await rejects(stageLocalPumpDraft(f.input),'source-changed-during-check');
 assert.equal(f.writes.length,0);
});
test('existing different payload with same deterministic key fails closed',async()=>{
 const f=fixture(),first=await stageLocalPumpDraft(f.input);
 f.rows.get(f.key(owner,'drafts',first.draftId)).value.actionCount=3;
 await rejects(stageLocalPumpDraft(f.input),'draft-id-conflict');
});
test('invalid trusted owner, lesson, session or server clock fails closed',async()=>{
 const f=fixture();
 for(const changes of [
  {ownerId:'bad\nowner'},{lessonId:'bad'},{expectedSessionId:'../invalid'},
  {preflight:safe()},{clock:()=>new Date('invalid')}
 ]){
  await assert.rejects(stageLocalPumpDraft({...f.input,...changes}),e=>e instanceof StudioDraftStagingError);
 }
 assert.equal(f.writes.length,0);
});
