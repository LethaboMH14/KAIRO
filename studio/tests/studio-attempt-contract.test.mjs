import test from 'node:test';
import assert from 'node:assert/strict';
import {ACTIVITY_IDS,REVIEW_SCHEMA,REVIEW_STATUS,createLocalReview} from '../src/studio-scenarios/attempt-contract/local-review.mjs';

const SID='session_49f';
const at='2026-10-25T10:00:00.000Z';
const sourceId='a'.repeat(24),lessonId='b'.repeat(24),revision='c'.repeat(64);
const sourceClaim=()=>({sourceId,lessonId,revision,currentRevision:revision});
const attempt=(activity,n=1)=>{
 const id=SID+'-round-'+n;
 const shared={id,at,modelVersion:'',evidenceStatus:'local-unverified'};
 switch(activity){
 case 'http-request':return {...shared,modelVersion:'kairo-http-request-trace/1',
   referenceKind:'prepared-public-reference',referenceRevision:'rfc9110-2022+rfc9111-2022',
   scenario:{cache:n===1?'empty':'fresh',connection:'online',origin:'200'},
   prediction:{outcome:'http-200',sendsHttpRequest:true,explanation:'private learner wording'},
   result:{steps:[{reading:'not exported'}]},outcomeCorrect:true,requestPredictionCorrect:true};
 case 'binary-search':return {...shared,modelVersion:'kairo-binary-search-lower-bound/1',
   referenceKind:'prepared-public-reference',referenceRevision:'python-3.14-bisect-left',
   scenario:{arrayId:'repeats',target:n===1?2:3},prediction:{index:1,reasoning:'private'},
   trace:{steps:[{reading:'private'}]},correct:true};
 case 'sql-join':return {...shared,modelVersion:'kairo-sql-join-trace/1',
   sourceKind:'prepared-public-reference',sourceRevision:'postgresql-current-join-table-expressions-2026-10-25',
   scenario:{datasetId:'multiple',join:n===1?'inner':'left'},
   prediction:{rowCount:4,reasoning:'private'},actual:{steps:[{reading:'private'}]},correct:false};
 case 'bfs-path':return {...shared,modelVersion:'kairo-bfs-unweighted-directed/1',
   sourceKind:'prepared-public-reference',sourceRevision:'mit-ocw-6-006-spring-2020-lecture-9',
   scenarioId:n===1?'branching':'cycle',prediction:{hops:2,reasoning:'private'},
   trace:{steps:[{reading:'private'}]},correct:true};
 default:throw Error('fixture unknown');
 }
};
const pumpAttempt=(n=1)=>({
 scenarioId:n===1?'guided-open-valve':'independent-close-valve',independent:n===2,
 direction:'increase',estimateLps:2,beforeLps:1,afterLps:3,deltaLps:2,beforeHeadM:4,afterHeadM:5,
 beforeValveLossM:2,afterValveLossM:1,actualDirection:'increase',directionMatches:true,
 absoluteErrorLps:0,note:'private learner note'
});
const pumpSession=(attempts=[pumpAttempt()])=>({
 schema:'kairo-pump-what-if/1',model:'kairo-pump-lab-model/1',provenance:'prepared-model-only',
 phase:'explain',attempts,actions:[{type:'predict',direction:'increase',estimateLps:2}]
});
const session=(activity,attempts=[attempt(activity)])=>({id:SID,attempts});
const review=(activity,attempts,extra={})=>createLocalReview(activity==='pump-what-if'
 ?{activity,session:pumpSession(attempts),localSessionId:SID,...extra}
 :{activity,session:session(activity,attempts),...extra});

test('all five published studio attempt formats have one explicit unverified adapter',()=>{
 assert.deepEqual(ACTIVITY_IDS,['pump-what-if','http-request','binary-search','sql-join','bfs-path']);
 for(const activity of ACTIVITY_IDS){
  const r=review(activity,activity==='pump-what-if'?[pumpAttempt()]:[attempt(activity)]);
  assert.equal(r.schema,REVIEW_SCHEMA);assert.equal(r.activity,activity);
  assert.equal(r.resultStatus,REVIEW_STATUS);assert.equal(r.serverVerified,false);
  assert.equal(r.replayVerified,false);assert.equal(r.score,null);
  assert.equal(r.attempts.length,1);assert.equal(r.attempts[0].independent,false);
  assert.equal(r.sourceClaim,null);
 }
});
test('second attempt is distinct, independently labelled and never promoted to an account score',()=>{
 for(const activity of ACTIVITY_IDS){
  const attempts=activity==='pump-what-if'?[pumpAttempt(1),pumpAttempt(2)]:[attempt(activity,1),attempt(activity,2)];
  const r=review(activity,attempts);
  assert.equal(r.attempts.length,2);
  assert.equal(r.attempts[1].independent,true);
  assert.notEqual(r.attempts[0].scenarioKey,r.attempts[1].scenarioKey);
  assert.equal(r.attempts[1].resultStatus,'local-unverified');
 }
});
test('local source references retain revision fencing but NEVER imply server ownership or review',()=>{
 const r=review('binary-search',[attempt('binary-search')],{sourceClaim:sourceClaim()});
 assert.deepEqual(r.sourceClaim,{kind:'browser-claimed-reviewed-source',sourceId,revision,lessonId,
  ownerVerified:false,revisionVerifiedByServer:false});
 assert.equal(r.serverVerified,false);
 const changed={...sourceClaim(),currentRevision:'d'.repeat(64)};
 assert.throws(()=>review('binary-search',[attempt('binary-search')],{sourceClaim:changed}),/revision changed/i);
 assert.throws(()=>review('binary-search',[attempt('binary-search')],{sourceClaim:{...sourceClaim(),ownerVerified:true}}),/contract fields/);
 assert.throws(()=>review('binary-search',[attempt('binary-search')],{sourceClaim:{...sourceClaim(),sourceId:'../owner'}}),/Invalid source/);
});
test('private notes, explanation text, traces and unverified correctness never leave review adapter',()=>{
 for(const activity of ACTIVITY_IDS){
  const r=review(activity,activity==='pump-what-if'?[pumpAttempt()]:[attempt(activity)]);
  const text=JSON.stringify(r);
  assert.doesNotMatch(text,/private learner|private learner note|not exported|reading|reasoning|outcomeCorrect|correct/);
  assert.match(text,/local-unverified/);
 }
});
test('forged source or model version and claimed verified evidence are rejected',()=>{
 for(const activity of ACTIVITY_IDS.filter(x=>x!=='pump-what-if')){
  const base=attempt(activity);
  const version=review(activity,[base]).modelVersion;
  assert.equal(base.modelVersion,version);
  assert.throws(()=>review(activity,[{...base,modelVersion:'stale-model'}]),/model\/source/i);
  assert.throws(()=>review(activity,[{...base,evidenceStatus:'verified'}]),/model\/source/i);
  const field=base.sourceRevision?'sourceRevision':'referenceRevision';
  assert.throws(()=>review(activity,[{...base,[field]:'invented'}]),/model\/source/i);
 }
 assert.throws(()=>review('pump-what-if',[pumpAttempt()],{session:pumpSession()}),/contract fields/);
 assert.throws(()=>createLocalReview({activity:'pump-what-if',localSessionId:SID,
  session:{...pumpSession(),provenance:'uploaded-source'}}),/provenance/);
});
test('repeated scenario and duplicate attempt IDs are rejected',()=>{
 for(const activity of ACTIVITY_IDS.filter(x=>x!=='pump-what-if')){
  const one=attempt(activity,1),two={...attempt(activity,2)};
  if(activity==='bfs-path')two.scenarioId=one.scenarioId;
  else two.scenario=one.scenario;
  assert.throws(()=>review(activity,[one,two]),/different prepared scenario/);
  assert.throws(()=>review(activity,[one,{...attempt(activity,2),id:one.id}]),/identity/);
 }
 assert.throws(()=>review('pump-what-if',[pumpAttempt(),{...pumpAttempt(2),independent:false}]),/independence/);
});
test('unknown metadata and invalid timestamps fail closed',()=>{
 assert.throws(()=>review('sql-join',[{...attempt('sql-join'),sourceId:'stolen'}]),/contract fields/);
 assert.throws(()=>review('bfs-path',[{...attempt('bfs-path'),at:'2026-10-25'}]),/timestamp/);
 assert.throws(()=>review('bfs-path',[{...attempt('bfs-path'),at:'2026-02-30T10:00:00.000Z'}]),/timestamp/);
 assert.throws(()=>review('http-request',[{...attempt('http-request'),scenario:{cache:'poison',connection:'online',origin:'200'}}]),/HTTP scenario/);
});
test('more than two attempts, malformed session and unknown activities fail closed',()=>{
 assert.throws(()=>review('binary-search',[]),/one or two/);
 assert.throws(()=>review('binary-search',[attempt('binary-search',1),attempt('binary-search',2),attempt('binary-search',3)]),/one or two/);
 assert.throws(()=>createLocalReview({activity:'nonexistent',session:{id:SID,attempts:[]}}),/Unsupported/);
 assert.throws(()=>createLocalReview({activity:'binary-search',session:{id:'x',attempts:[attempt('binary-search')]}}),/session ID/);
 assert.throws(()=>review('pump-what-if',[pumpAttempt()],{localSessionId:'wrong'}),/identifier mismatch|contract fields/);
});
test('bounded inputs and output immutability protect the preview contract',()=>{
 const large={...attempt('binary-search'),prediction:{reasoning:'x'.repeat(40000)}};
 assert.throws(()=>review('binary-search',[large]),/too large/);
 const r=review('binary-search',[attempt('binary-search')]);
 assert.equal(Object.isFrozen(r),true);assert.equal(Object.isFrozen(r.attempts),true);
 assert.equal(Object.isFrozen(r.attempts[0]),true);
});
