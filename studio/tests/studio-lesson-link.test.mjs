import test from 'node:test';
import assert from 'node:assert/strict';
import {hash} from '../server/workspace/model.mjs';
import {linkPumpDraftToOwnedLesson as link,StudioLessonLinkError} from '../server/studio-lesson-link/index.mjs';

const lessonId='a'.repeat(24),sourceId='b'.repeat(24);
const pages=[{text:'A reviewed, learner-approved engineering source section about illustrative pumps. '.repeat(3),locator:'Page 1',method:'text',edited:false}];
const revision=hash(pages);
const lesson=()=>({id:lessonId,sourceId,revision,mode:'local-extractive'});
const source=()=>({id:sourceId,revision,reviewed:true,reviewedPages:structuredClone(pages)});
const draft=()=>({schema:'kairo-evidence-item/pump-lab-draft-1',studio:'pump-lab',caseId:'baseline-commissioning',provenance:{simulated:true,modelVersion:'pump-model-1',sessionId:'synthetic-session',actionLogHash:'deadbeef'},events:{competencyExternallyVerified:false},feedbackSource:'deterministic-rule-based',reviewStatus:'not reviewed by a domain expert',answer:{note:'private answer must not escape'}});
function fixture(){
 const store=new Map([
  ['alice:lessons:'+lessonId,{value:lesson()}],
  ['alice:sources:'+sourceId,{value:source()}],
  ['alice:revisions:'+sourceId+'_'+revision,{value:source()}],
 ]);
 const calls=[],writes=[];
 const repository={
  async get(uid,kind,id){calls.push([uid,kind,id]);return structuredClone(store.get(uid+':'+kind+':'+id)||null);},
  async put(...args){writes.push(args);throw new Error('must not write');},
  async remove(...args){writes.push(args);throw new Error('must not delete');},
 };
 return {repository,store,calls,writes};
}
const call=(f,changes={})=>link({repository:f.repository,ownerId:'alice',lessonId,draft:draft(),...changes});
const fails=async(p,status,code)=>assert.rejects(p,e=>e instanceof StudioLessonLinkError&&e.status===status&&e.code===code);

test('current owner-reviewed v1 lesson links local pump draft without granting evidence status or leaking answers',async()=>{
 const f=fixture(),receipt=await call(f);
 assert.equal(receipt.originLessonId,lessonId);
 assert.deepEqual(receipt.sourceRef,{sourceId,revision});
 assert.equal(receipt.association,'owner-scoped-current-reviewed-v1-lesson');
 assert.equal(receipt.attemptStatus,'local-unverified');
 assert.equal(receipt.replayVerified,false);
 assert.equal(receipt.identityOfAttemptVerified,false);
 assert.equal(receipt.competencyExternallyVerified,false);
 assert.equal(receipt.canSaveVerifiedEvidence,false);
 assert.equal(receipt.studio,'pump-lab');
 assert.equal(f.calls.length,4,'lesson, current source, revision, and current source recheck');
 assert.deepEqual(f.writes,[]);
 assert.doesNotMatch(JSON.stringify(receipt),/alice|synthetic-session|private answer|deadbeef/);
 assert.equal(Object.isFrozen(receipt),true);
});

test('other owner has no access to this lesson and no fallback to another identity',async()=>{
 const f=fixture();
 await fails(call(f,{ownerId:'bob'}),404,'owned-lesson-not-found');
 assert.ok(f.calls.every(([uid])=>uid==='bob'));
 assert.equal(f.calls.length,1);
});

test('bad identities and malformed lesson IDs reject before repository reads',async()=>{
 const f=fixture();
 for(const args of [{ownerId:''},{ownerId:'\n'}, {ownerId:'a'.repeat(129)},{lessonId:'../../other'}, {lessonId:'c'.repeat(24)+'_'},{repository:null}]){
  await fails(call(f,args),400,args.lessonId?'invalid-lesson-id':'trusted-owner-required');
 }
 assert.equal(f.calls.length,0);
});

test('client cannot self-certify, forge model provenance or bypass local-only schema',async()=>{
 const f=fixture();
 const invalid=[
  {schema:'other'},
  {studio:'motor'},
  {caseId:'../../evil'},
  {provenance:{...draft().provenance,simulated:false}},
  {provenance:{...draft().provenance,actionLogHash:'not-a-hash'}},
  {provenance:{...draft().provenance,sessionId:''}},
  {events:{competencyExternallyVerified:true}},
  {feedbackSource:'ai-verified'},
  {reviewStatus:'reviewed by a domain expert'},
 ];
 for(const change of invalid)await fails(call(f,{draft:{...draft(),...change}}),400,'invalid-local-pump-draft');
 assert.equal(f.calls.length,0);
});

test('missing lesson or foreign lesson identity never reads the source',async()=>{
 const f=fixture();
 f.store.delete('alice:lessons:'+lessonId);
 await fails(call(f),404,'owned-lesson-not-found');
 f.store.set('alice:lessons:'+lessonId,{value:{...lesson(),id:'c'.repeat(24)}});
 await fails(call(f),404,'owned-lesson-not-found');
 assert.equal(f.calls.length,2);
});

test('v2 bundle preview cannot masquerade as a persisted v1 lesson',async()=>{
 const f=fixture();
 f.store.set('alice:lessons:'+lessonId,{value:{...lesson(),sourceRefs:[{sourceId,revision}]}});
 await fails(call(f),409,'unsupported-lesson-contract');
 assert.equal(f.calls.length,1);
});

test('stale or unreviewed source, changed hash and revoked immutable revision fail closed',async()=>{
 for(const patch of [{reviewed:false},{revision:'c'.repeat(64)},{reviewedPages:[{...pages[0],text:'edited after review'}]}]){
  const f=fixture();
  f.store.set('alice:sources:'+sourceId,{value:{...source(),...patch}});
  await fails(call(f),409,'source-not-current');
 }
 const missing=fixture();missing.store.delete('alice:revisions:'+sourceId+'_'+revision);
 await fails(call(missing),409,'reviewed-revision-missing');
 const tampered=fixture();tampered.store.set('alice:revisions:'+sourceId+'_'+revision,{value:{...source(),reviewedPages:[{...pages[0],text:'tampered revision snapshot'}]}});
 await fails(call(tampered),409,'reviewed-revision-missing');
});

test('source changing between validation and final read is rejected, with no writes',async()=>{
 const f=fixture(),get=f.repository.get;
 let reads=0;
 f.repository.get=async(...args)=>{
  const result=await get(...args);
  if(args[1]==='sources'&&++reads===1){
   f.store.set('alice:sources:'+sourceId,{value:{...source(),reviewed:false}});
  }
  return result;
 };
 await fails(call(f),409,'source-changed-during-check');
 assert.deepEqual(f.writes,[]);
});

test('valid reviewed source may have a blank OCR section if another section has content',async()=>{
 const f=fixture(),two=[...pages,{text:'',locator:'Page 2',method:'ocr',edited:true}],rev=hash(two);
 f.store.set('alice:lessons:'+lessonId,{value:{...lesson(),revision:rev}});
 f.store.set('alice:sources:'+sourceId,{value:{...source(),revision:rev,reviewedPages:two}});
 f.store.set('alice:revisions:'+sourceId+'_'+rev,{value:{...source(),revision:rev,reviewedPages:two}});
 const result=await call(f);
 assert.equal(result.sourceRef.revision,rev);
});
