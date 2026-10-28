import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition,serialize} from '../../studio/src/pump-lab/session.ts';
import {toEvidenceItem} from '../../studio/src/pump-lab/report.ts';
import {hash} from '../../studio/server/workspace/model.mjs';
import {preflightLocalPumpEvidence} from '../studio-composition-20261025/review.mjs';
import {stageLocalPumpDraft,STAGED_SCHEMA,StudioDraftStagingError} from '../../studio/server/studio-draft-staging/index.mjs';

// All identities, passages, dates and actions below are authored synthetic fixtures.
// No Firebase, learner, device, external pump, Kaggle or model execution is involved.
const ownerId='synthetic-owner-alice',lessonId='a'.repeat(24),sourceId='b'.repeat(24);
const pages=[{text:'Synthetic reviewed pump learning passage about comparing system curves, not instructions for operating equipment. '.repeat(3),
 locator:'Page 1',method:'text',edited:false}];
const revision=hash(pages);
const timestamp='2026-10-25T16:00:00.000Z';
const key=(uid,kind,id)=>uid+':'+kind+':'+id;
function fixture(){
 const source={id:sourceId,revision,reviewed:true,reviewedPages:structuredClone(pages)};
 const records=new Map([
  [key(ownerId,'lessons',lessonId),{value:{id:lessonId,sourceId,revision},version:'1'}],
  [key(ownerId,'sources',sourceId),{value:source,version:'1'}],
  [key(ownerId,'revisions',sourceId+'_'+revision),{value:source,version:'1'}],
 ]);
 const writes=[];
 const repository={
  async get(uid,kind,id){return structuredClone(records.get(key(uid,kind,id))||null);},
  async put(uid,kind,id,value,options){
   assert.deepEqual(options,{create:true});
   const recordKey=key(uid,kind,id);
   writes.push({uid,kind,id});
   if(records.has(recordKey))throw Object.assign(new Error('Conflict'),{status:409});
   const row={value:structuredClone(value),version:'1'};
   records.set(recordKey,row);
   return {id,...structuredClone(row)};
  },
 };
 let state=initialState('synthetic-pump-session-001',47,'baseline-commissioning');
 state=transition(state,{type:'predict',flowLps:8},timestamp);
 state=transition(state,{type:'take-reading'},timestamp);
 const snapshot=serialize(state),evidence=toEvidenceItem(state);
 const input={repository,ownerId,lessonId,expectedSessionId:state.sessionId,snapshot,evidence};
 const preflight=()=>preflightLocalPumpEvidence(input);
 const stage=(overrides={})=>stageLocalPumpDraft({
  repository,ownerId,lessonId,expectedSessionId:state.sessionId,consent:true,
  preflight,clock:()=>new Date(timestamp),...overrides,
 });
 return {records,writes,repository,input,stage,preflight};
}
const errorCode=(code)=>e=>e instanceof StudioDraftStagingError&&e.code===code;

test('real replay and owner/source preflight stage an unverified private draft',async()=>{
 const f=fixture(),checked=await f.preflight();
 assert.equal(checked.status,'reviewable-local-draft-only');
 assert.equal(checked.replayConsistent,true);
 const out=await f.stage();
 assert.equal(out.status,'local-unverified');
 assert.equal(out.storedPrivately,true);
 assert.equal(out.duplicate,false);
 assert.equal(out.canSaveVerifiedEvidence,false);
 assert.equal(out.publishable,false);
 assert.equal(f.writes.length,1);
 assert.equal(f.writes[0].kind,'drafts');
 const saved=f.records.get(key(ownerId,'drafts',out.draftId)).value;
 assert.equal(saved.schema,STAGED_SCHEMA);
 assert.equal(saved.status,'local-unverified');
 assert.equal(saved.actionCount,2);
 assert.deepEqual(saved.sourceRef,{sourceId,revision});
 assert.equal(saved.replayConsistentAtPreflight,true);
 assert.equal(saved.consentAt,timestamp);
 assert.equal(saved.identityOfAttemptVerified,false);
 assert.equal(saved.competencyExternallyVerified,false);
 const visible=JSON.stringify({out,saved});
 for(const sensitive of [ownerId,'synthetic-pump-session-001','Synthetic reviewed pump learning passage'])
  assert.equal(visible.includes(sensitive),false);
});
test('missing explicit consent prevents any preflight or storage access',async()=>{
 const f=fixture();
 await assert.rejects(f.stage({consent:false,preflight:()=>{throw Error('should never run');}}),errorCode('explicit-consent-required'));
 assert.deepEqual(f.writes,[]);
});
test('altered pump evidence fails deterministic replay before any draft write',async()=>{
 const f=fixture();
 const changed=structuredClone(f.input.evidence);
 changed.attempt.predictions=99;
 await assert.rejects(f.stage({preflight:()=>preflightLocalPumpEvidence({...f.input,evidence:changed})}),errorCode('preflight-not-reviewable'));
 assert.deepEqual(f.writes,[]);
});
test('foreign account cannot stage another owner\'s reviewed source',async()=>{
 const f=fixture();
 await assert.rejects(f.stage({ownerId:'synthetic-owner-bob',preflight:()=>preflightLocalPumpEvidence({...f.input,ownerId:'synthetic-owner-bob'})}),errorCode('preflight-not-reviewable'));
 assert.deepEqual(f.writes,[]);
});
test('source review revoked between real preflight and storage recheck fails closed',async()=>{
 const f=fixture();
 await assert.rejects(f.stage({preflight:async()=>{
  const result=await f.preflight();
  f.records.get(key(ownerId,'sources',sourceId)).value.reviewed=false;
  return result;
 }}),errorCode('source-not-current'));
 assert.deepEqual(f.writes,[]);
});
test('same real replay is create-only idempotent, including concurrent retries',async()=>{
 const f=fixture();
 const [a,b]=await Promise.all([f.stage(),f.stage()]);
 assert.equal(a.draftId,b.draftId);
 assert.equal([a.duplicate,b.duplicate].filter(Boolean).length,1);
 assert.equal(f.records.get(key(ownerId,'drafts',a.draftId)).value.status,'local-unverified');
 const again=await f.stage({clock:()=>new Date('2026-10-25T17:00:00Z')});
 assert.equal(again.duplicate,true);
 assert.equal(again.draftId,a.draftId);
 assert.equal(f.records.get(key(ownerId,'drafts',a.draftId)).value.consentAt,timestamp);
});
