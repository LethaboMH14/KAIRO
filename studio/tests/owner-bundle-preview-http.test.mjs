import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { hash } from '../server/workspace/model.mjs';
import { createLearnerWorkspace } from '../server/learner-workspace/routes.mjs';

const ids=['a'.repeat(24),'b'.repeat(24)];
const pages=(tag)=>[{locator:'Page 1',method:'pasted-text',edited:false,
  text:(tag+' Synthetic engineering notes about voltage and current in a working electric motor. ').repeat(8)}];
function source(i) {
  const reviewedPages=pages('Owner '+i),revision=hash(reviewedPages);
  return {id:ids[i],title:'Private source '+i,reviewed:true,
    pages:reviewedPages,reviewedPages,revision};
}
async function fixture(t) {
  const saved=new Map(),puts=[];
  const key=(uid,kind,id)=>uid+'|'+kind+'|'+id;
  const owners=['synthetic-A','synthetic-B'];
  const values=[source(0),source(1)];
  for(let i=0;i<2;i++){
    saved.set(key(owners[i],'sources',values[i].id),{value:values[i]});
    saved.set(key(owners[i],'revisions',values[i].id+'_'+values[i].revision),{value:structuredClone(values[i])});
  }
  const repo={
    async get(uid,kind,id){return structuredClone(saved.get(key(uid,kind,id))||null);},
    async list(){return [];},
    async put(...args){puts.push(args);throw new Error('Preview attempted an unexpected write.');},
  };
  const app=express();
  app.use((req,_res,next)=>{req.kairoIdentity={uid:req.headers['x-test-owner']==='B'?owners[1]:owners[0]};next();});
  app.use(createLearnerWorkspace({repository:repo}).router);
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  t.after(()=>{server.closeAllConnections();return new Promise(resolve=>server.close(resolve));});
  const url='http://127.0.0.1:'+server.address().port+'/bundle-preview';
  const post=async(body,owner='A')=>{
    const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json','x-test-owner':owner},body:JSON.stringify(body)});
    return {status:response.status,body:await response.json()};
  };
  return {post,saved,key,owners,values,puts};
}
const req=(s,extra={})=>({schemaVersion:2,mode:'local',goal:'motor voltage',sourceRefs:[{sourceId:s.id,revision:s.revision}],...extra});

test('private bundle preview returns bounded true citation anchors but no generated lesson',async t=>{
  const {post,values,puts}=await fixture(t);
  const result=await post(req(values[0]));
  assert.equal(result.status,200,JSON.stringify(result.body));
  assert.equal(result.body.kind,'reviewed-evidence-preview');
  assert.equal(result.body.schemaVersion,2);
  assert.match(result.body.notice,/not a generated or saved lesson/);
  assert.equal(result.body.sourceRefs[0].sourceId,values[0].id);
  assert.match(result.body.bundleRevision,/^[a-f0-9]{64}$/);
  assert.ok(result.body.evidence.length>=1&&result.body.evidence.length<=12);
  assert.ok(result.body.selection.selectedCharacters<=12000);
  for(const e of result.body.evidence){
    assert.equal(e.sourceId,values[0].id);
    assert.equal(e.sourceRevision,values[0].revision);
    assert.equal(e.locator,'Page 1');
    assert.equal(values[0].reviewedPages[0].text.slice(e.start,e.end),e.quote);
  }
  assert.equal(puts.length,0,'read-only endpoint did not persist');
});
test('a source from another owner is refused with no quote leakage',async t=>{
  const {post,values,puts}=await fixture(t);
  const r=await post(req(values[1]),'A');
  assert.equal(r.status,409,JSON.stringify(r.body));
  assert.equal(JSON.stringify(r.body).includes(values[1].reviewedPages[0].text),false);
  assert.equal(puts.length,0);
});
test('review change after selection cannot be silently upgraded',async t=>{
  const {post,saved,key,owners,values}=await fixture(t);
  const original=values[0],changed=structuredClone(original);
  changed.reviewedPages=pages('Re-reviewed content');
  changed.revision=hash(changed.reviewedPages);
  saved.set(key(owners[0],'sources',original.id),{value:changed});
  const response=await post(req(original));
  assert.equal(response.status,409);
  assert.doesNotMatch(JSON.stringify(response.body),/Re-reviewed content/);
});
test('malformed, duplicate and oversized source selections fail closed',async t=>{
  const {post,values}=await fixture(t),base=req(values[0]);
  for(const request of [
    {...base,sourceRefs:[]},
    {...base,sourceRefs:Array(9).fill(base.sourceRefs[0])},
    {...base,sourceRefs:[base.sourceRefs[0],base.sourceRefs[0]]},
    {...base,sourceRefs:[{sourceId:'invalid',revision:values[0].revision}]},
    {...base,goal:'x'.repeat(1001)},
  ]){
    const response=await post(request);
    assert.equal(response.status,400,JSON.stringify(response.body));
  }
});
test('preview denies cloud/provider input and does not activate generation',async t=>{
  const {post,values,puts}=await fixture(t),base=req(values[0]);
  for(const request of [
    {...base,mode:'cloud',consent:true,provider:'google'},
    {...base,provider:'google'},
    {...base,consent:true},
    {...base,sourceId:values[0].id},
  ]){
    const response=await post(request);
    assert.equal(response.status,400,JSON.stringify(response.body));
  }
  assert.equal(puts.length,0);
});
