import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {hash} from '../server/workspace/model.mjs';
import {createLearnerWorkspace} from '../server/learner-workspace/routes.mjs';

// Synthetic HTTP regression only: no browser, deployed app, learner records or provider calls.
const OWNER='synthetic-v1-continuity-owner';
const SOURCE_ID='a'.repeat(24);
const page={
  locator:'Pasted text, section 1',method:'pasted-text',edited:false,
  text:('Synthetic reviewed motor notes explain that supply frequency and pole count determine synchronous speed. ')
    .repeat(14),
};

async function fixture(t){
  const records=new Map();
  const key=(uid,kind,id)=>JSON.stringify([uid,kind,id]);
  const source={
    id:SOURCE_ID,title:'Synthetic motor principles',reviewed:true,
    pages:[page],reviewedPages:[page],revision:hash([page]),
    reviewedAt:'2026-10-25T10:00:00Z',
  };
  let writes=[];
  let sequence=0;
  const repository={
    async get(uid,kind,id){return structuredClone(records.get(key(uid,kind,id))||null);},
    async list(uid,kind){return [...records.entries()]
      .filter(([k])=>JSON.parse(k)[0]===uid&&JSON.parse(k)[1]===kind)
      .map(([,record])=>structuredClone(record));},
    async put(uid,kind,id,value,options={}){
      const k=key(uid,kind,id),old=records.get(k);
      if(options.create&&old)throw Object.assign(new Error('Already exists'),{status:409});
      if(options.version&&old?.version!==options.version)throw Object.assign(new Error('Stale write'),{status:409});
      const saved={id,value:structuredClone(value),version:String(++sequence)};
      records.set(k,saved);writes.push({uid,kind,id});return structuredClone(saved);
    },
  };
  records.set(key(OWNER,'sources',SOURCE_ID),{id:SOURCE_ID,value:structuredClone(source),version:'1'});
  records.set(key(OWNER,'revisions',SOURCE_ID+'_'+source.revision),
    {id:SOURCE_ID+'_'+source.revision,value:structuredClone(source),version:'1'});
  const app=express();
  app.use((req,_res,next)=>{req.kairoIdentity={uid:OWNER};next();});
  app.use(createLearnerWorkspace({repository,clock:()=>Date.parse('2026-10-25T10:00:00Z'),
    generate:()=>{throw new Error('Local-only regression must not call cloud generation');}}).router);
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  t.after(()=>{server.closeAllConnections();return new Promise(resolve=>server.close(resolve));});
  const base='http://127.0.0.1:'+server.address().port;
  async function post(route,body){
    const response=await fetch(base+route,{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify(body)});
    return {status:response.status,body:await response.json()};
  }
  async function get(route){const response=await fetch(base+route);return {status:response.status,body:await response.json()};}
  return {source,post,get,get writes(){return writes;}};
}

test('read-only v2 preview does not mutate or disable the existing local v1 lesson lifecycle',async t=>{
  const f=await fixture(t);
  const preview=await f.post('/bundle-preview',{
    schemaVersion:2,sourceRefs:[{sourceId:SOURCE_ID,revision:f.source.revision}],
    mode:'local',goal:'motor speed',
  });
  assert.equal(preview.status,200,JSON.stringify(preview.body));
  assert.equal(preview.body.kind,'reviewed-evidence-preview');
  assert.match(preview.body.notice,/not a generated or saved lesson/i);
  assert.equal(f.writes.length,0,'preview must remain read-only');
  const generated=await f.post('/generate',{
    sourceId:SOURCE_ID,revision:f.source.revision,mode:'local',goal:'motor speed',
  });
  assert.equal(generated.status,200,JSON.stringify(generated.body));
  assert.equal(generated.body.sourceId,SOURCE_ID);
  assert.equal(generated.body.revision,f.source.revision);
  assert.equal(generated.body.mode,'local-extractive');
  assert.equal(Object.hasOwn(generated.body,'sourceRefs'),false,
    'v1 lesson must not be silently projected into a multi-source record');
  assert.ok(generated.body.evidence.length>0);
  assert.ok(f.writes.some(x=>x.kind==='lessons'));
  const resumed=await f.get('/lesson/'+generated.body.id);
  assert.equal(resumed.status,200);
  assert.equal(resumed.body.id,generated.body.id);
  assert.equal(resumed.body.sourceId,SOURCE_ID);
  assert.equal(resumed.body.revision,f.source.revision);
});

test('sending a v2 sourceRefs payload to legacy /generate fails closed without creating a lesson',async t=>{
  const f=await fixture(t);
  const wrong=await f.post('/generate',{
    schemaVersion:2,sourceRefs:[{sourceId:SOURCE_ID,revision:f.source.revision}],
    mode:'local',goal:'motor speed',
  });
  assert.equal(wrong.status,400);
  assert.equal(f.writes.length,0);
  assert.doesNotMatch(JSON.stringify(wrong.body),/Synthetic reviewed motor notes/);
  const valid=await f.post('/generate',{
    sourceId:SOURCE_ID,revision:f.source.revision,mode:'local',goal:'motor speed',
  });
  assert.equal(valid.status,200,JSON.stringify(valid.body));
  assert.equal(f.writes.filter(x=>x.kind==='lessons').length,1);
});
