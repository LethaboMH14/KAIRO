import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createOwnerRepository,ownerKey} from '../server/hosted-core/firestore.mjs';
import {createFirebaseVerifier} from '../server/hosted-core/firebase-verifier.mjs';
import {createHostedApi} from '../server/hosted-core/app.mjs';
const projectId='kairo-test-project';
const time='2026-10-24T00:00:00.123456Z';
const token=async()=>'synthetic-access-token';
function memoryFirestore(){
 const docs=new Map(),calls=[];
 return {calls,docs,fetchFn:async(url,options)=>{
  calls.push({url,options});const u=new URL(url),key=u.pathname;
  if(options.method==='GET')return docs.has(key)?Response.json(docs.get(key)):new Response('',{status:404});
  const old=docs.get(key),version=u.searchParams.get('currentDocument.updateTime');
  if((u.searchParams.get('currentDocument.exists')==='false'&&old)||(version&&old?.updateTime!==version))return new Response('',{status:409});
  if(options.method==='DELETE'){docs.delete(key);return new Response(null,{status:204});}
  const value=JSON.parse(options.body);const doc={name:key.slice('/v1/'.length),fields:value.fields,updateTime:time};docs.set(key,doc);return Response.json(doc);
 }};
}
test('Firestore records derive paths from owner, isolate matching record IDs and preserve conditional writes',async()=>{
 const fake=memoryFirestore(),repo=createOwnerRepository({projectId,getToken:token,fetchFn:fake.fetchFn});
 const saved=await repo.put('learner/a','sources','source_1',{title:'Synthetic motor'},{create:true});
 assert.equal(saved.value.title,'Synthetic motor');assert.equal(saved.version,time);
 assert.equal(await repo.get('learner-b','sources','source_1'),null);
 assert.equal((await repo.get('learner/a','sources','source_1')).value.title,'Synthetic motor');
 await assert.rejects(repo.put('learner/a','sources','source_1',{}, {create:true}),e=>e.status===409);
 await assert.rejects(repo.put('learner/a','sources','source_1',{}, {version:'2020-01-01T00:00:00Z'}),e=>e.status===409);
 await repo.put('learner/a','sources','source_1',{title:'Updated'},{version:time});
 assert.equal((await repo.remove('learner/a','sources','source_1',{version:time})).removed,true);
 assert.equal(await repo.get('learner/a','sources','source_1'),null);
 assert(fake.calls.every(c=>!c.url.includes('learner/a')));
 assert.notEqual(ownerKey('learner/a'),ownerKey('learner-b'));
});
test('Firestore blocks invalid addresses, missing versions, oversized records and tampered owner',async()=>{
 const fake=memoryFirestore(),repo=createOwnerRepository({projectId,getToken:token,fetchFn:fake.fetchFn});
 await assert.rejects(repo.put('a','sources','../escape',{}, {create:true}),TypeError);
 await assert.rejects(repo.put('a','arbitrary','x',{}, {create:true}),TypeError);
 await assert.rejects(repo.put('a','sources','x',{}),TypeError);
 await assert.rejects(repo.put('a','sources','x',{body:'a'.repeat(230000)},{create:true}),TypeError);
 assert.equal(fake.calls.length,0);
 await repo.put('a','sources','x',{}, {create:true});
 const doc=[...fake.docs.values()][0];doc.fields.owner.stringValue=ownerKey('b');
 await assert.rejects(repo.get('a','sources','x'),/identity/);
});
test('Firestore cancellation during credential refresh prevents dispatch and upstream secrets are hidden',async()=>{
 const abort=new AbortController();let calls=0;
 const repo=createOwnerRepository({projectId,getToken:async()=>{abort.abort();return 'private-secret';},fetchFn:async()=>{calls++;}});
 await assert.rejects(repo.get('a','sources','x',abort.signal));assert.equal(calls,0);
 const broken=createOwnerRepository({projectId,getToken:token,fetchFn:async()=>{throw new Error('private-secret');}});
 await assert.rejects(broken.get('a','sources','x'),e=>!e.message.includes('private-secret'));
});
test('Firestore maps actual REST failed-precondition status to a revision conflict',async()=>{
 const repo=createOwnerRepository({projectId,getToken:token,fetchFn:async()=>Response.json({error:{status:'FAILED_PRECONDITION'}},{status:400})});
 await assert.rejects(repo.put('a','progress','x',{}, {version:time}),e=>e.status===409);
});
test('Firebase verifier rejects malformed tokens before network and sanitizes certificate failure',async()=>{
 let calls=0;const verify=createFirebaseVerifier({projectId,fetchFn:async()=>{calls++;throw new Error('private-secret');}});
 await assert.rejects(verify('not-a-jwt'),/could not be verified/);assert.equal(calls,0);
 const head=Buffer.from(JSON.stringify({alg:'none',kid:'test'})).toString('base64url');
 await assert.rejects(verify(`${head}.e30.abc`));assert.equal(calls,0);
 const rsaHead=Buffer.from(JSON.stringify({alg:'RS256',kid:'test'})).toString('base64url');
 await assert.rejects(verify(`${rsaHead}.e30.abc`),e=>!e.message.includes('private-secret'));assert.equal(calls,1);
});
const openssl=process.platform==='win32'?'C:/Program Files/Git/usr/bin/openssl.exe':'/usr/bin/openssl';
test('actual hosted HTTP routes reject unauthenticated access and keep identical record IDs separate by verified identity',async()=>{
 const fake=memoryFirestore(),repository=createOwnerRepository({projectId,getToken:token,fetchFn:fake.fetchFn});
 const now=Math.floor(Date.now()/1000);
 const app=createHostedApi({projectId,repository,allowedOrigin:'https://kairo.example',verifyToken:async token=>({uid:token,sub:token,aud:projectId,iss:`https://securetoken.google.com/${projectId}`,iat:now-10,exp:now+300})});
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 const request=(path,uid,method='GET',body,origin)=>fetch(`${base}${path}`,{method,headers:{...(uid?{authorization:`Bearer ${uid}`}:{ }),'Content-Type':'application/json',...(origin?{origin}:{})},...(body?{body:JSON.stringify(body)}:{})});
 try{
  assert.equal((await request('/api/hosted/me')).status,401);
  assert.equal((await request('/api/hosted/me','alice','GET',undefined,'https://evil.example')).status,403);
  const saved=await request('/api/hosted/progress/motor','alice','PUT',{uid:'bob',create:true,value:{stage:'practice',uid:'bob'}});assert.equal(saved.status,200);
  assert.equal((await request('/api/hosted/progress/motor','bob')).status,404);
  assert.equal((await request('/api/hosted/progress/motor','alice')).status,200);
  assert.equal((await request('/api/workspace/sources','alice')).status,404);
  assert.equal((await request('/api/hosted/progress/motor','alice','PUT',{value:{stage:'done'}})).status,400);
  assert.equal((await request('/api/hosted/progress/motor','alice','PUT',{version:'2020-01-01T00:00:00Z',value:{stage:'done'}})).status,409);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
test('Firebase verifier validates real RSA signatures, expiry, audience and auth time with cached public certs',{skip:!existsSync(openssl)},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'kairo-jwt-'));
 try{
  execFileSync(openssl,['req','-x509','-newkey','rsa:2048','-keyout',join(dir,'key.pem'),'-out',join(dir,'cert.pem'),'-days','1','-nodes','-subj','/CN=KAIRO synthetic test'],{stdio:'ignore',windowsHide:true});
  const privateKey=readFileSync(join(dir,'key.pem')),cert=readFileSync(join(dir,'cert.pem'),'utf8');let calls=0;
  const now=Math.floor(Date.now()/1000),payload={sub:'synthetic-learner',aud:projectId,iss:`https://securetoken.google.com/${projectId}`,iat:now-10,exp:now+3600,auth_time:now-100};
  function jwt(p,key=privateKey){const content=[{alg:'RS256',kid:'test'},p].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');return `${content}.${sign('RSA-SHA256',Buffer.from(content),key).toString('base64url')}`;}
  const verify=createFirebaseVerifier({projectId,fetchFn:async()=>{calls++;return Response.json({test:cert},{headers:{'cache-control':'public, max-age=3600'}});}});
  assert.equal((await verify(jwt(payload))).uid,'synthetic-learner');
  assert.equal((await verify(jwt({...payload,iat:now+5,auth_time:now+5}))).uid,'synthetic-learner');
  await assert.rejects(verify(jwt({...payload,aud:'other-project'})));
  await assert.rejects(verify(jwt({...payload,exp:now-1})));
  await assert.rejects(verify(jwt({...payload,auth_time:now+60})));
  const wrongKey=generateKeyPairSync('rsa',{modulusLength:2048}).privateKey;
  await assert.rejects(verify(jwt(payload,wrongKey)));assert.equal(calls,1);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
