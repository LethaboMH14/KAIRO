import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { hash } from '../server/workspace/model.mjs';
import { createLearnerWorkspace } from '../server/learner-workspace/routes.mjs';

// Synthetic authenticated HTTP fixture; no cloud provider, learner data or deployment.
const OWNER='synthetic-review-race-owner';
const SOURCE_ID='d'.repeat(24);
const page={locator:'Page 1',method:'pasted-text',edited:false,
  text:'Illustrative engineering notes explain that voltage and current are different quantities. '.repeat(15)};

async function fixture(t,change='none'){
  const store=new Map(),writes=[];
  const key=(uid,kind,id)=>JSON.stringify([uid,kind,id]);
  const source={id:SOURCE_ID,title:'Synthetic engineering review',reviewed:true,
    pages:[page],reviewedPages:[page],revision:hash([page])};
  store.set(key(OWNER,'sources',SOURCE_ID),{value:structuredClone(source),version:'1'});
  store.set(key(OWNER,'revisions',SOURCE_ID+'_'+source.revision),
    {value:structuredClone(source),version:'1'});
  let version=1;
  const repository={
    async get(uid,kind,id){return structuredClone(store.get(key(uid,kind,id))||null);},
    async list(uid,kind){return [...store.entries()]
      .filter(([k])=>JSON.parse(k)[0]===uid&&JSON.parse(k)[1]===kind)
      .map(([,record])=>structuredClone(record));},
    async put(uid,kind,id,value,options={}){
      writes.push({uid,kind,id});
      if(kind==='progress'){
        if(change==='source-rereview'){
          const updated={...source,reviewedPages:[{...page,text:page.text+' New learner review.'}]};
          updated.revision=hash(updated.reviewedPages);
          store.set(key(OWNER,'sources',SOURCE_ID),{value:updated,version:'2'});
        }else if(change==='source-revoked'){
          store.set(key(OWNER,'sources',SOURCE_ID),
            {value:{...source,reviewed:false},version:'2'});
        }else if(change==='archive-removed'){
          store.delete(key(OWNER,'revisions',SOURCE_ID+'_'+source.revision));
        }
      }
      const k=key(uid,kind,id);
      if(options.create&&store.has(k))throw Object.assign(new Error('Already exists'),{status:409});
      const saved={id,value:structuredClone(value),version:String(++version)};
      store.set(k,saved);return structuredClone(saved);
    },
  };
  const app=express();
  app.use((req,_res,next)=>{req.kairoIdentity={uid:OWNER};next();});
  app.use(createLearnerWorkspace({repository,clock:()=>Date.parse('2026-10-25T10:00:00Z'),
    generate:()=>{throw new Error('Cloud generation must not run in this fixture');}}).router);
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  t.after(()=>{server.closeAllConnections();return new Promise(resolve=>server.close(resolve));});
  async function generate(){
    const response=await fetch('http://127.0.0.1:'+server.address().port+'/generate',{
      method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({sourceId:SOURCE_ID,revision:source.revision,mode:'local',goal:'voltage and current'}),
    });
    return {status:response.status,body:await response.json()};
  }
  return {generate,writes,source};
}

for(const [change,status] of [
  ['source-rereview',409],
  ['source-revoked',409],
  ['archive-removed',404],
]){
  test('v1 generation refuses '+change+' during awaited quota before saving lesson',async t=>{
    const f=await fixture(t,change),response=await f.generate();
    assert.equal(response.status,status,JSON.stringify(response.body));
    assert.equal(f.writes.filter(x=>x.kind==='lessons').length,0);
    assert.doesNotMatch(JSON.stringify(response.body),/Illustrative engineering notes/);
  });
}

test('unchanged owner-reviewed v1 source still saves a citation-pinned local lesson',async t=>{
  const f=await fixture(t),response=await f.generate();
  assert.equal(response.status,200,JSON.stringify(response.body));
  assert.equal(response.body.sourceId,SOURCE_ID);
  assert.equal(response.body.revision,f.source.revision);
  assert.equal(response.body.mode,'local-extractive');
  assert.equal(f.writes.filter(x=>x.kind==='lessons').length,1);
});
