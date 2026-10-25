import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { hash } from '../server/workspace/model.mjs';
import { summarizeReviewedSources } from '../server/source-catalog/reviewed-summary.mjs';
import { createLearnerWorkspace } from '../server/learner-workspace/routes.mjs';

const ownerIds = ['a'.repeat(24), 'b'.repeat(24), 'c'.repeat(24)];
function source(i=0, overrides={}) {
  const pages = [{locator:'Page 1',method:'reviewed-text',text:'Synthetic owner-only motor notes: '.repeat(5)}];
  const value = {
    id: ownerIds[i],title:'Source '+i,pages,reviewed:true,
    reviewedPages:pages,reviewedAt:'2026-10-25T04:00:00Z',
    revision:hash(pages),...overrides,
  };
  return {id:value.id,value};
}
test('returns only minimal verified metadata, never source passages or binary handles',()=>{
  const s=source(0,{title:'  Motor study   ',original:{kind:'pdf',name:'private.pdf'}});
  const result=summarizeReviewedSources([s]);
  assert.deepEqual(result.reviewedSources,[{
    id:s.id,title:'Motor study',reviewed:true,revision:s.value.revision,
    reviewedSectionCount:1,reviewedAt:'2026-10-25T04:00:00Z',
  }]);
  const serialized=JSON.stringify(result);
  assert.doesNotMatch(serialized,/Synthetic owner-only motor|private.pdf|reviewedPages|original/);
  assert.equal(result.reviewedSourcesVersion,1);
});
test('stale hashes, unreviewed, revoked and deleted records are not offered as ready',()=>{
  const bad=[
    source(0,{revision:'f'.repeat(64)}),
    source(1,{reviewed:false}),
    source(2,{revoked:true}),
    source(0,{deleted:true}),
  ];
  assert.deepEqual(summarizeReviewedSources(bad.filter((_,i)=>i<3)).reviewedSources,[]);
  assert.deepEqual(summarizeReviewedSources([bad[3]]).reviewedSources,[]);
});
test('malformed rows and unsupported partial reviews are excluded without disclosing their content',()=>{
  const invalid=[
    source(0,{reviewedPages:[{locator:'Page 1',text:'short'}],revision:hash([{locator:'Page 1',text:'short'}])}),
    source(1,{revision:'not-a-sha'}),
    {id:ownerIds[2],value:{id:ownerIds[1],reviewed:true}},
    {id:'invalid',value:{id:'invalid',title:'bad',reviewed:true}},
    null,
  ];
  assert.deepEqual(summarizeReviewedSources(invalid).reviewedSources,[]);
});
test('duplicate IDs are rejected rather than potentially aliasing two source snapshots',()=>{
  assert.throws(()=>summarizeReviewedSources([source(0),source(0)]),/repeated source IDs/);
});
test('deterministic display order and bounded results include truthful truncation',()=>{
  const x=source(0,{title:'zebra'}),y=source(1,{title:'alpha'}),z=source(2,{title:'alpha'});
  const out=summarizeReviewedSources([x,z,y],{limit:2});
  assert.deepEqual(out.reviewedSources.map(x=>x.id),[ownerIds[1],ownerIds[2]]);
  assert.deepEqual(out.reviewedSourcesPage,{limit:2,returned:2,possiblyTruncated:true});
  assert.equal(summarizeReviewedSources([x,z,y]).reviewedSourcesPage.possiblyTruncated,false);
});
test('catalog bounds and malformed request options fail closed',()=>{
  for(const value of [null,{},new Array(501).fill(null)]) assert.throws(()=>summarizeReviewedSources(value),/limits/);
  for(const limit of [0,101,1.2,'8']) assert.throws(()=>summarizeReviewedSources([],{limit}),/limits/);
  const many=Array.from({length:100},(_,i)=>source(0,{id:i.toString(16).padStart(24,'0')}));
  const rows=many.map(s=>({...s,id:s.value.id}));
  assert.equal(summarizeReviewedSources(rows).reviewedSourcesPage.possiblyTruncated,true);
});
test('source revision mismatch after re-review invalidates old selection',()=>{
  const first=source(0);
  const nextPages=[{locator:'Page 1',method:'reviewed-text',text:'Updated synthetic motor text and a second revision. '.repeat(4)}];
  const revised=source(0,{reviewedPages:nextPages,revision:hash(nextPages)});
  assert.notEqual(first.value.revision,revised.value.revision);
  const current=summarizeReviewedSources([revised]).reviewedSources[0];
  assert.equal(current.id,first.id);
  assert.equal(current.revision,revised.value.revision);
  assert.notEqual(current.revision,first.value.revision);
});
test('authenticated catalog preserves legacy property and isolates two synthetic owners',async t=>{
  const rows=new Map([['learner-A',[source(0)]],['learner-B',[source(1)]]]);
  const repo={
    async list(uid,kind){return kind==='sources' ? structuredClone(rows.get(uid)||[]) : [];},
    async get(){return null;},
  };
  const workspace=createLearnerWorkspace({repository:repo,clock:()=>Date.parse('2026-10-25T04:00:00Z')});
  const app=express();
  app.use((req,_res,next)=>{req.kairoIdentity={uid:req.headers['x-synthetic-user']==='B'?'learner-B':'learner-A'};next();});
  app.use(workspace.router);
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  t.after(()=>{server.closeAllConnections();return new Promise(resolve=>server.close(resolve));});
  const url='http://127.0.0.1:'+server.address().port+'/catalog';
  const get=async user=>{const r=await fetch(url,{headers:{'x-synthetic-user':user}});assert.equal(r.status,200);return r.json();};
  const a=await get('A'),b=await get('B');
  assert.equal(a.reviewedSourcesVersion,1);
  assert.equal(a.catalog.length,1,'legacy catalog remains present');
  assert.equal(a.lessons.length,0);
  assert.equal(a.reviewedSources.length,1);
  assert.equal(b.reviewedSources.length,1);
  assert.equal(a.reviewedSources[0].id,ownerIds[0]);
  assert.equal(b.reviewedSources[0].id,ownerIds[1]);
  assert.equal(JSON.stringify(a).includes(ownerIds[1]),false);
  assert.equal(JSON.stringify(b).includes(ownerIds[0]),false);
  assert.doesNotMatch(JSON.stringify(a),/Synthetic owner-only motor/);
});
