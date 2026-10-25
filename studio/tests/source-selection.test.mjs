import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewedChoice,selectedRefs,toggleReviewedSource,checkSelectedSources,prepareSelectionRequest} from '../src/source-selection/selection.mjs';
const ids=Array.from({length:10},(_,i)=>i.toString(16).padStart(24,'a'));
const revisions=Array.from({length:10},(_,i)=>i.toString(16).padStart(64,'a'));
const source=(i,extra={})=>({id:ids[i],title:'Source '+i,reviewed:true,reviewedPages:[{text:'Reviewed text',locator:'Page 1'}],revision:revisions[i],...extra});

test('only reviewed saved revisions become choices, never raw extracted files',()=>{
  assert.deepEqual(reviewedChoice(source(0)),{sourceId:ids[0],revision:revisions[0],title:'Source 0'});
  for(const record of [source(0,{reviewed:false}),source(0,{reviewedPages:[]}),source(0,{revision:'bad'}),source(0,{id:'bad'}),null])
    assert.equal(reviewedChoice(record),null);
});

test('selection toggles exact revisions and preserves learner ordering',()=>{
  let selected=[];
  selected=toggleReviewedSource(selected,source(1));
  selected=toggleReviewedSource(selected,source(0));
  assert.deepEqual(selectedRefs(selected),[{sourceId:ids[1],revision:revisions[1]},{sourceId:ids[0],revision:revisions[0]}]);
  assert.deepEqual(toggleReviewedSource(selected,source(1)).map(x=>x.sourceId),[ids[0]]);
  assert.deepEqual(selected.map(x=>x.sourceId),[ids[1],ids[0]],'original state is not mutated');
});

test('selection refuses an implicit revision upgrade',()=>{
  const first=toggleReviewedSource([],source(0));
  assert.throws(()=>toggleReviewedSource(first,source(0,{revision:revisions[1]})),/changed/);
});

test('enforces no more than eight distinct valid items',()=>{
  let selected=[];
  for(let i=0;i<8;i++)selected=toggleReviewedSource(selected,source(i));
  assert.equal(selected.length,8);
  assert.throws(()=>toggleReviewedSource(selected,source(8)),/eight/);
  assert.throws(()=>selectedRefs([...selected,selected[0]]),/eight/);
  assert.throws(()=>selectedRefs([selected[0],selected[0]]),/repeated/);
});

test('invalid records cannot enter selection and mutated stored arrays fail closed',()=>{
  assert.throws(()=>toggleReviewedSource([],source(0,{reviewed:false})),/Check and save/);
  assert.throws(()=>selectedRefs([{sourceId:ids[0],revision:'bad'}]),/invalid/);
  assert.throws(()=>selectedRefs('untrusted'),/Select up to eight/);
});

test('current reviewed snapshots yield ordered references without titles or full text',()=>{
  const choices=[source(2),source(0)];
  const selected=choices.map(reviewedChoice);
  const result=checkSelectedSources(selected,[source(0),source(2)]);
  assert.equal(result.ok,true);
  assert.deepEqual(result.sourceRefs,[{sourceId:ids[2],revision:revisions[2]},{sourceId:ids[0],revision:revisions[0]}]);
  assert.equal('title' in result.sourceRefs[0],false);
});

test('empty and unknown current statuses block submission',()=>{
  assert.match(checkSelectedSources([],[]).problem,/at least one/);
  assert.match(checkSelectedSources([reviewedChoice(source(0))],null).problem,/unavailable/);
  assert.match(checkSelectedSources([reviewedChoice(source(0))],[]).problem,/unavailable or has changed/);
});

test('edit, delete and review revocation on any selected source invalidate whole bundle',()=>{
  const selected=[source(0),source(1)].map(reviewedChoice);
  for(const changed of [[source(0),source(1,{revision:revisions[2]})],[source(0)],[source(0),source(1,{reviewed:false})]]){
    const r=checkSelectedSources(selected,changed);
    assert.equal(r.ok,false);assert.deepEqual(r.sourceRefs,[]);
  }
});

test('ambiguous duplicate server snapshots refuse submission',()=>{
  const s=source(0),r=checkSelectedSources([reviewedChoice(s)],[s,s]);
  assert.equal(r.ok,false);assert.match(r.problem,/inconsistent/);
});

test('feature gate prevents accidentally posting a new payload to legacy v1',()=>{
  assert.throws(()=>prepareSelectionRequest({selected:[reviewedChoice(source(0))],currentSources:[source(0)]}),/not yet available/);
});

test('local v2 request is source-ref only and remains bounded',()=>{
  const r=prepareSelectionRequest({selected:[reviewedChoice(source(0))],currentSources:[source(0)],multiSourceApi:true,goal:'Explain motors'});
  assert.deepEqual(r,{schemaVersion:2,sourceRefs:[{sourceId:ids[0],revision:revisions[0]}],mode:'local',goal:'Explain motors'});
  assert.throws(()=>prepareSelectionRequest({selected:[reviewedChoice(source(0))],currentSources:[source(0)],multiSourceApi:true,goal:'x'.repeat(1001)}),/too long/);
});

test('cloud requests require explicit provider consent and do not add it silently',()=>{
  const base={selected:[reviewedChoice(source(0))],currentSources:[source(0)],multiSourceApi:true,mode:'cloud'};
  assert.throws(()=>prepareSelectionRequest(base),/consent first/);
  assert.throws(()=>prepareSelectionRequest({...base,consent:true}),/Explicit consent/);
  assert.throws(()=>prepareSelectionRequest({...base,consent:true,provider:'groq',providerConsent:['google']}),/Explicit consent/);
  const r=prepareSelectionRequest({...base,consent:true,provider:'groq',providerConsent:['groq','groq']});
  assert.deepEqual(r.providerConsent,['groq']);
  assert.equal(r.consent,true);
});
