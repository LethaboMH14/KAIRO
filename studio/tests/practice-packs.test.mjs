import test from 'node:test';
import assert from 'node:assert/strict';
import {currentStep,exportRun,getPracticePack,initialRun,practicePacks,replayRun,transition} from '../src/practice-packs/model.ts';

const at='2026-10-22T10:00:00.000Z';
const plus=(seconds)=>new Date(Date.parse(at)+seconds*1000).toISOString();
const start=(pack='fictional-requirements-uat',id='practice-a')=>initialRun(pack,id,at);
const act=(run,action,seconds=run.events.length+1)=>transition(run,action,plus(seconds));

test('authored packs are immutable and keep employer role context separate from fictional organizations',()=>{
 assert.equal(practicePacks.length,2);
 for(const pack of practicePacks){
  assert.ok(Object.isFrozen(pack));assert.ok(Object.isFrozen(pack.steps));
  assert.match(pack.fictionalNotice,/invented|fictional/i);assert.ok(pack.roleSources.every(source=>source.url.startsWith('https://')));
  assert.notEqual(pack.fictionalOrganization,'Discovery');
 }
 const source=getPracticePack('fictional-requirements-uat').roleSources[0];
 assert.match(source.capabilities.join(' '),/UAT/);
 assert.throws(()=>{source.title='Employer-approved test';});
});

test('business analysis accepts two defensible scope paths and logs the revised requirement',()=>{
 for(const choiceId of ['ask-and-record','bounded-proposal']){
  let run=start();run=act(run,{type:'choose',choiceId});
  assert.equal(run.stepIndex,1);assert.equal(currentStep(run).id,'revised-requirement');
  assert.equal(run.events[1].kind,'revision');assert.equal(run.events[1].revisionId,'requirements-revision-2');
  assert.equal(run.events[0].advances,true);
 }
});

test('an unsafe data export is rejected, gives rationale, and cannot skip the first step',()=>{
 let run=start();run=act(run,{type:'choose',choiceId:'export-identifiable'});
 assert.equal(run.stepIndex,0);assert.equal(run.events.length,1);assert.equal(run.events[0].advances,false);
 assert.deepEqual(run.events[0].demonstrated,[]);assert.match(currentStep(run).choices.find(c=>c.id==='export-identifiable').rationale,/identifiable learner records/i);
 assert.equal(run.events[0].choiceId,'export-identifiable');
 assert.equal(run.feedback,run.events[0].feedback);
});

test('hints and rejected attempts remain in the replayable export after a retry',()=>{
 let run=start();run=act(run,{type:'hint'},1);run=act(run,{type:'choose',choiceId:'export-identifiable'},2);run=act(run,{type:'choose',choiceId:'ask-and-record'},3);
 assert.equal(run.stepIndex,1);assert.deepEqual(run.events.filter(e=>e.kind==='hint').map(e=>e.attempt),[1]);
 assert.equal(run.feedback,run.events.filter(e=>e.kind==='choice').at(-1).feedback);
 assert.equal(run.events.filter(e=>e.kind==='choice').length,2);assert.ok(replayRun(run));
 const exported=exportRun(run);
 assert.equal(exported.provenance.unverified,true);assert.equal(exported.provenance.employerEndorsement,false);
 assert.equal(exported.record.events.filter(e=>e.kind==='hint').length,1);
 assert.equal(exported.record.checks.find(c=>c.criterionId==='protect-data').status,'demonstrated-in-selected-choice');
 assert.match(exported.provenance.note,/no employer assessment/i);
});

test('an owner-escalation path remains valid and reflection is unassessed',()=>{
 let run=start();run=act(run,{type:'choose',choiceId:'ask-and-record'},1);run=act(run,{type:'choose',choiceId:'pause-for-owner'},2);run=act(run,{type:'choose',choiceId:'pause-signoff'},3);
 assert.equal(run.stepIndex,3);
 run=act(run,{type:'reflect',text:'I left the policy question visible and would wait for the accountable owner before sign-off.'},4);
 assert.equal(run.feedback,'Reflection saved without assessment.');
 const exported=exportRun(run);
 assert.equal(exported.record.status,'practice-sequence-complete');assert.equal(exported.provenance.reflectionAssessed,false);
 assert.equal(exported.record.checks.find(c=>c.criterionId==='escalate-policy').status,'demonstrated-in-selected-choice');
 assert.ok(exported.record.checks.every(c=>c.status==='demonstrated-in-selected-choice'||c.status==='unresolved'));
 assert.equal(exported.record.checks.some(c=>c.status==='pass'||c.status==='score'),false);
 assert.equal(exported.record.events.at(-1).kind,'reflection');
});

test('support pack rejects a credential request, then allows safe diagnosis or escalation',()=>{
 for(const firstChoice of ['approved-recovery','escalate-verification']){
  let run=start('fictional-digital-support',`support-${firstChoice}`);
  run=act(run,{type:'choose',choiceId:'request-code'},1);
  assert.equal(run.stepIndex,0);assert.equal(run.events.at(-1).advances,false);
  assert.match(getPracticePack(run.packId).steps[0].choices.find(c=>c.id==='request-code').rationale,/Never request or accept a password or one-time code/i);
  run=act(run,{type:'choose',choiceId:firstChoice},2);assert.equal(run.stepIndex,1);
  assert.equal(run.events.at(-1).kind,'revision');assert.match(run.events.at(-1).revisionText,/screen-reader barrier/i);
  run=act(run,{type:'choose',choiceId:'offer-and-escalate'},3);run=act(run,{type:'choose',choiceId:'keep-open-escalate'},4);
  assert.equal(run.stepIndex,3);
  const output=exportRun(run);
  assert.equal(output.provenance.fictionalScenario,true);assert.equal(output.provenance.employerEndorsement,false);
  assert.equal(output.record.checks.find(c=>c.criterionId==='protect-secrets').status,'demonstrated-in-selected-choice');
 }
});

test('a premature reflection cannot skip tasks; long or bad timestamps are rejected',()=>{
 let run=start();const premature=act(run,{type:'reflect',text:'I learned from this scenario.'},1);
 assert.equal(premature.events.length,0);assert.equal(premature.stepIndex,0);
 const badDate=transition(run,{type:'choose',choiceId:'ask-and-record'},'2026-02-30T10:00:00Z');
 assert.equal(badDate.events.length,0);
 run=act(run,{type:'choose',choiceId:'ask-and-record'},2);
 const backwards=transition(run,{type:'hint'},plus(1));assert.equal(backwards.events.length,run.events.length);assert.match(backwards.notice,/moved backwards/);
 const forged={...run,stepIndex:2};
 const skipped=transition(forged,{type:'choose',choiceId:'test-and-gate'},3);
 assert.equal(skipped.events.length,run.events.length);assert.match(skipped.notice,/invalid/i);
 assert.equal(replayRun(forged),null);assert.throws(()=>exportRun(forged),/does not replay/);
});

test('timestamps, identifiers, action volume and reflection text are bounded',()=>{
 assert.throws(()=>initialRun('fictional-requirements-uat','../bad',at),/Run ID/);
 assert.throws(()=>initialRun('fictional-requirements-uat','bad','2026-13-01T00:00:00Z'),/real UTC/);
 let run=start();run=act(run,{type:'choose',choiceId:'ask-and-record'},1);run=act(run,{type:'choose',choiceId:'separate-own-and-group'},2);run=act(run,{type:'choose',choiceId:'test-and-gate'},3);
  const long=transition(run,{type:'reflect',text:'x'.repeat(1001)},plus(4));
 assert.equal(long.events.length,run.events.length);assert.match(long.notice,/1–1000/);
  const tampered={...run,events:[...run.events,{kind:'choice',at:'not-a-date',stepId:'uat-plan',attempt:1,choiceId:'test-and-gate',advances:true,demonstrated:[]}]};
 assert.equal(replayRun(tampered),null);assert.throws(()=>exportRun(tampered),/does not replay/);
});

test('practice action history has a fixed upper bound',()=>{
 let run=start();run=act(run,{type:'choose',choiceId:'ask-and-record'},1);run=act(run,{type:'choose',choiceId:'separate-own-and-group'},2);run=act(run,{type:'choose',choiceId:'test-and-gate'},3);
 for(let second=4;second<=120;second++)run=act(run,{type:'reflect',text:`Reflection note ${second}.`},second);
 assert.equal(run.events.filter(event=>event.kind!=='revision').length,120);
 const overflow=act(run,{type:'reflect',text:'One more bounded note.'},121);
 assert.equal(overflow.events.length,run.events.length);assert.match(overflow.notice,/action limit/);
 assert.ok(replayRun(run));
});
