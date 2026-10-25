import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,transition,serialize} from '../../studio/src/pump-lab/session.ts';
import {toEvidenceItem} from '../../studio/src/pump-lab/report.ts';
import {hash} from '../../studio/server/workspace/model.mjs';
import {preflightLocalPumpEvidence,REVIEW_SCHEMA} from './review.mjs';

const ownerId='synthetic-owner-alice',lessonId='a'.repeat(24),sourceId='b'.repeat(24);
const pages=[{text:'A learner-reviewed illustrative teaching passage about pump system curves and checking observations. '.repeat(3),
 locator:'Page 1',method:'text',edited:false}];
const revision=hash(pages);
const at='2026-10-25T12:00:00.000Z';
function fixture({owner=ownerId,stale=false,withActions=true}={}){
 const source={id:sourceId,revision,reviewed:!stale,reviewedPages:structuredClone(pages)};
 const lesson={id:lessonId,sourceId,revision};
 const records=new Map([
  [ownerId+':lessons:'+lessonId,{value:lesson}],
  [ownerId+':sources:'+sourceId,{value:source}],
  [ownerId+':revisions:'+sourceId+'_'+revision,{value:source}],
 ]);
 const writes=[];
 const repository={
  async get(uid,kind,id){return structuredClone(records.get(uid+':'+kind+':'+id)||null);},
  async put(...args){writes.push(args);throw new Error('No writes permitted');},
  async remove(...args){writes.push(args);throw new Error('No deletes permitted');},
 };
 let state=initialState('synthetic-pump-session-001',47,'baseline-commissioning');
 if(withActions){
  state=transition(state,{type:'predict',flowLps:8},at);
  state=transition(state,{type:'take-reading'},at);
 }
 const snapshot=serialize(state),evidence=toEvidenceItem(state);
 const input={repository,ownerId:owner,lessonId,snapshot,evidence,expectedSessionId:state.sessionId};
 return {input,records,writes};
}
test('real draft replay + current owner-reviewed v1 source compose without promoting learner competency',async()=>{
 const f=fixture();
 const result=await preflightLocalPumpEvidence(f.input);
 assert.equal(result.schema,REVIEW_SCHEMA);
 assert.equal(result.status,'reviewable-local-draft-only');
 assert.equal(result.replayConsistent,true);
 assert.equal(result.ownerSourceLinked,true);
 assert.deepEqual(result.sourceRef,{sourceId,revision});
 assert.equal(result.actionCount,2);
 assert.equal(result.illustrativeCaseCompleted,false);
 assert.equal(result.canSaveVerifiedEvidence,false);
 assert.equal(result.identityOfAttemptVerified,false);
 assert.equal(result.competencyExternallyVerified,false);
 assert.equal(result.publishable,false);
 assert.deepEqual(f.writes,[]);
 assert.doesNotMatch(JSON.stringify(result),/synthetic-owner-alice|synthetic-pump-session-001|learner-reviewed illustrative teaching passage/i);
});
test('replayed action evidence must match exact session and deterministic result',async()=>{
 const f=fixture();
 const changed=structuredClone(f.input.evidence);changed.attempt.predictions=99;
 assert.equal((await preflightLocalPumpEvidence({...f.input,evidence:changed})).code,'replay-rejected');
 assert.equal((await preflightLocalPumpEvidence({...f.input,expectedSessionId:'different-session'})).code,'untrusted-session-binding');
 assert.equal((await preflightLocalPumpEvidence({...f.input,evidence:{...f.input.evidence,events:{...f.input.evidence.events,competencyExternallyVerified:true}}})).code,'replay-rejected');
 assert.deepEqual(f.writes,[]);
});
test('unstarted simulation cannot be promoted to a reviewable practice attempt',async()=>{
 const f=fixture({withActions:false});
 assert.equal((await preflightLocalPumpEvidence(f.input)).code,'prediction-and-reading-required');
});
test('wrong owner, revoked review and missing immutable revision fail closed without writes',async()=>{
 const wrong=fixture({owner:'another-owner'});
 assert.equal((await preflightLocalPumpEvidence(wrong.input)).code,'owned-lesson-or-source-unavailable');
 const stale=fixture({stale:true});
 assert.equal((await preflightLocalPumpEvidence(stale.input)).code,'owned-lesson-or-source-unavailable');
 const missing=fixture();
 missing.records.delete(ownerId+':revisions:'+sourceId+'_'+revision);
 assert.equal((await preflightLocalPumpEvidence(missing.input)).code,'owned-lesson-or-source-unavailable');
 assert.deepEqual(wrong.writes,[]);assert.deepEqual(stale.writes,[]);assert.deepEqual(missing.writes,[]);
});
test('a failing repository cannot turn a replay into verified evidence or leak errors',async()=>{
 const f=fixture();
 f.input.repository.get=async()=>{throw new Error('private learner answer must not escape');};
 const result=await preflightLocalPumpEvidence(f.input);
 assert.equal(result.status,'rejected');
 assert.equal(result.canSaveVerifiedEvidence,false);
 assert.doesNotMatch(JSON.stringify(result),/private learner answer/);
});
