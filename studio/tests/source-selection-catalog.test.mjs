import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewedChoice,toggleReviewedSource,checkSelectedSources,prepareSelectionRequest}
  from '../src/source-selection/selection.mjs';

const ids=['a'.repeat(24),'b'.repeat(24)];
const rev=['1'.repeat(64),'2'.repeat(64)];
const summary=(i,extra={})=>({id:ids[i],title:'Reviewed material '+i,
  reviewed:true,reviewedSectionCount:2,revision:rev[i],...extra});

test('accepts server-reviewed catalog metadata without text or dummy reviewedPages',()=>{
  const item=summary(0);
  assert.equal(Object.hasOwn(item,'reviewedPages'),false);
  assert.deepEqual(reviewedChoice(item),{sourceId:ids[0],revision:rev[0],title:item.title});
});
test('catalog section counts and revision metadata fail closed when malformed',()=>{
  for(const bad of [
    summary(0,{reviewedSectionCount:0}),
    summary(0,{reviewedSectionCount:121}),
    summary(0,{reviewedSectionCount:1.5}),
    summary(0,{reviewedSectionCount:'2'}),
    summary(0,{reviewedSectionCount:undefined}),
    summary(0,{reviewed:false}),
    summary(0,{revoked:true}),
    summary(0,{deleted:true}),
    summary(0,{revision:'not-a-sha'}),
  ]) assert.equal(reviewedChoice(bad),null);
});
test('legacy source snapshots remain accepted but an empty reviewedPages array is never upgraded',()=>{
  assert.ok(reviewedChoice({...summary(0),reviewedPages:[{locator:'Page 1',text:'Reviewed text'}]}));
  assert.equal(reviewedChoice({...summary(0),reviewedPages:[]}),null);
});
test('ordered choices and exact revisions remain intact for catalog-only data',()=>{
  let selected=[];
  selected=toggleReviewedSource(selected,summary(1));
  selected=toggleReviewedSource(selected,summary(0));
  const current=[summary(0),summary(1)];
  const checked=checkSelectedSources(selected,current);
  assert.equal(checked.ok,true);
  assert.deepEqual(checked.sourceRefs,[{sourceId:ids[1],revision:rev[1]},{sourceId:ids[0],revision:rev[0]}]);
  assert.equal(JSON.stringify(checked).includes('Reviewed material'),false);
});
test('catalog revision change, withdrawal, and duplicate IDs invalidate requests',()=>{
  const chosen=toggleReviewedSource([],summary(0));
  assert.equal(checkSelectedSources(chosen,[summary(0,{revision:rev[1]})]).ok,false);
  assert.equal(checkSelectedSources(chosen,[summary(0,{reviewed:false})]).ok,false);
  assert.equal(checkSelectedSources(chosen,[summary(0,{revoked:true})]).ok,false);
  assert.equal(checkSelectedSources(chosen,[]).ok,false);
  assert.match(checkSelectedSources(chosen,[summary(0),summary(0)]).problem,/inconsistent/);
});
test('legacy backend remains disabled until authenticated v2 route is explicitly enabled',()=>{
  const selected=toggleReviewedSource([],summary(0));
  assert.throws(()=>prepareSelectionRequest({selected,currentSources:[summary(0)]}),/not yet available/);
  const payload=prepareSelectionRequest({selected,currentSources:[summary(0)],multiSourceApi:true,mode:'local'});
  assert.deepEqual(payload.sourceRefs,[{sourceId:ids[0],revision:rev[0]}]);
  assert.equal('text' in payload.sourceRefs[0],false);
});
