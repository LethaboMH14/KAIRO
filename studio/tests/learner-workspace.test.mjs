import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createLearnerWorkspace} from '../server/learner-workspace/routes.mjs';

test('retry recovers a published import after a crash; cancellation removes only its unpublished orphan', async t=>{
 const records=new Map(),blobs=new Map();let next=0;
 const key=(uid,kind,id)=>JSON.stringify([uid,kind,id]);
 const repo={
  async get(uid,kind,id){return structuredClone(records.get(key(uid,kind,id))||null);},
  async put(uid,kind,id,value,{version,create}={}){const k=key(uid,kind,id),old=records.get(k);if(create?!!old:(!old||old.version!==version))throw Object.assign(Error('Conflict'),{status:409});const result={id,value:structuredClone(value),version:String(++next)};records.set(k,result);return structuredClone(result);},
  async remove(uid,kind,id,{version}={}){const k=key(uid,kind,id),old=records.get(k);assert.equal(old?.version,version);records.delete(k);},
  async removeBlob(uid,id){blobs.delete(key(uid,'blob',id));},
 };
 const workspace=createLearnerWorkspace({repository:repo,clock:()=>1000,extract:()=>{throw Error('Recovery must not re-extract');}});
 const sourceId='1'.repeat(24),jobId='2'.repeat(24),uid='synthetic-owner';
 const source={id:sourceId,importJobId:jobId,importHash:'a'.repeat(64),pages:[{text:'Recovered synthetic source.'}]};
 await repo.put(uid,'sources',sourceId,source,{create:true});
 await repo.put(uid,'jobs',jobId,{id:jobId,sourceId,status:'extracting',leaseUntil:900,attempts:1,info:{sha256:source.importHash}},{create:true});
 await workspace.processImport(uid,jobId);
 assert.equal((await repo.get(uid,'jobs',jobId)).value.status,'ready');
 assert.deepEqual((await repo.get(uid,'sources',sourceId)).value,source);
 const app=express();app.use((req,_res,next)=>{req.kairoIdentity={uid};next();});app.use(workspace.router);
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 t.after(()=>{server.closeAllConnections();return new Promise(resolve=>server.close(resolve));});
 const url=`http://127.0.0.1:${server.address().port}/jobs/${jobId}`;
 assert.equal((await fetch(url,{method:'DELETE'})).status,409);
 const saved=await repo.get(uid,'jobs',jobId);
 await repo.put(uid,'jobs',jobId,{...saved.value,status:'extracting'},{version:saved.version});
 blobs.set(key(uid,'blob',sourceId),Buffer.from('original'));
 blobs.set(key(uid,'blob',jobId),Buffer.from('temporary'));
 assert.equal((await fetch(url,{method:'DELETE'})).status,200);
 assert.equal((await repo.get(uid,'jobs',jobId)).value.status,'cancelled');
 assert.equal(await repo.get(uid,'sources',sourceId),null);
 assert.equal(blobs.size,0);
 assert.deepEqual(await workspace.processImport(uid,jobId),{done:true});
});
