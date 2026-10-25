import test from 'node:test';import assert from 'node:assert/strict';import express from 'express';
import {createBundleLessons} from '../server/bundle-lessons/service.mjs';import {hash} from '../server/workspace/model.mjs';
function fixture(){const rows=new Map();const key=(uid,k,id)=>`${uid}:${k}:${id}`;const repository={async get(uid,k,id){return structuredClone(rows.get(key(uid,k,id))||null);},async list(uid,k){return [...rows.entries()].filter(([s])=>s.startsWith(`${uid}:${k}:`)).map(([,v])=>structuredClone(v));},async put(uid,k,id,value,{create=false,version}={}){const old=rows.get(key(uid,k,id));if(create?!!old:!old||old.version!==version)throw Object.assign(Error('Conflict'),{status:409});const result={value:structuredClone(value),version:String(Number(old?.version||0)+1)};rows.set(key(uid,k,id),result);return structuredClone(result);},async remove(uid,k,id,{version}){if(rows.get(key(uid,k,id))?.version!==version)throw Error('Conflict');rows.delete(key(uid,k,id));}};
 const refs=['a','b'].map((c,i)=>{const id=c.repeat(24),reviewedPages=[{locator:`Page ${i+1}`,edited:false,method:'pasted-text',text:('Synthetic motor field speed voltage notes '+c+'. ').repeat(12)}],revision=hash(reviewedPages),value={id,title:`Synthetic source ${i+1}`,reviewed:true,reviewedPages,revision,pages:reviewedPages};rows.set(key('owner','sources',id),{value,version:'1'});rows.set(key('owner','revisions',id+'_'+revision),{value:structuredClone(value),version:'1'});return{sourceId:id,revision};});
 const gateway={status:()=>({providers:[]}),run:async()=>{throw Error('Unexpected model call');}};return{rows,key,refs,repository,service:createBundleLessons({repository,gateway})};}
test('private local v2 create -> read -> edit -> practice -> resume uses separate namespace',async()=>{
 const f=fixture(),saved=await f.service.create('owner',{sourceRefs:f.refs,mode:'local',goal:'Explain the motor'},new AbortController().signal),id=saved.record.id;
 assert.equal(saved.record.schemaVersion,2);assert.ok(f.rows.has(f.key('owner','progress','bundle_'+id)));assert.equal(f.rows.has(f.key('owner','lessons',id)),false);
 assert.equal((await f.service.read('owner',id)).record.sourceRefs.length,2);await assert.rejects(()=>f.service.read('other',id),/unavailable/);
 const edited=await f.service.edit('owner',id,{version:saved.version,content:{...saved.record,title:'My checked motor lesson'}});assert.equal(edited.record.title,'My checked motor lesson');assert.deepEqual(edited.record.evidence,saved.record.evidence);
 await assert.rejects(()=>f.service.edit('owner',id,{version:saved.version,content:saved.record}),/changed/);
 const work=await f.service.saveWork('owner',id,{bundleRevision:saved.record.bundleRevision,version:null,step:1,notes:'My own explanation.',answers:[{question:0,choice:0,correct:false}]});
 assert.equal(work.work.answers[0].correct,0===saved.record.quiz[0].correct);assert.equal((await f.service.work('owner',id)).work.notes,'My own explanation.');
 await assert.rejects(()=>f.service.saveWork('owner',id,{bundleRevision:saved.record.bundleRevision,version:null,step:0,notes:'stale',answers:[]}),/changed/);
});
test('source deletion, current review changes and archived quote tamper fail every read',async()=>{
 for(const mutation of ['delete','current','archive']){const f=fixture(),saved=await f.service.create('owner',{sourceRefs:f.refs,mode:'local'}),ref=f.refs[1];
  if(mutation==='delete')f.rows.delete(f.key('owner','sources',ref.sourceId));else if(mutation==='current')f.rows.get(f.key('owner','sources',ref.sourceId)).value.revision='f'.repeat(64);else f.rows.get(f.key('owner','revisions',ref.sourceId+'_'+ref.revision)).value.reviewedPages[0].text='changed';
  await assert.rejects(()=>f.service.read('owner',saved.record.id),/changed/);await assert.rejects(()=>f.service.saveWork('owner',saved.record.id,{version:null,bundleRevision:saved.record.bundleRevision,step:0,notes:'',answers:[]}),/changed/);
 }
});
test('cloud output uses actual consented served provider and retains preference context',async()=>{
 const f=fixture(),local=await f.service.create('owner',{sourceRefs:f.refs,mode:'local'});let payload;
 const gateway={status:()=>({providers:[]}),async run(input){payload=input.payload;return{value:input.validate(local.record),provider:'openrouter',model:'synthetic-free-model'};}};
 const service=createBundleLessons({repository:f.repository,gateway});const request={sourceRefs:f.refs,mode:'cloud',goal:'Motor',provider:'groq',providerConsent:['groq','openrouter'],fallback:'openrouter',consent:true,requestId:'synthetic-cloud-request'};
 const saved=await service.create('owner',request);assert.equal(saved.record.provider,'openrouter');assert.equal(saved.record.model,'synthetic-free-model');assert.equal(payload.sourceRefs.length,2);assert.equal(payload.curation.goal,'Motor');
 await assert.rejects(()=>service.create('owner',{...request,providerConsent:['groq'],fallback:undefined}),/not approved/);
});
test('invalid practice, unconsented cloud and pre-aborted creation never produce accepted work',async()=>{
 const f=fixture();await assert.rejects(()=>f.service.create('owner',{sourceRefs:f.refs,mode:'cloud',provider:'groq',consent:false}),/consent/);
 const c=new AbortController();c.abort();await assert.rejects(()=>f.service.create('owner',{sourceRefs:f.refs,mode:'local'},c.signal),/abort/i);
 const saved=await f.service.create('owner',{sourceRefs:f.refs,mode:'local'});await assert.rejects(()=>f.service.saveWork('owner',saved.record.id,{version:null,bundleRevision:saved.record.bundleRevision,step:0,notes:'',answers:[{question:0,choice:4}]}),/choice/);
});
test('router requires an authenticated identity and does not intercept legacy workspace routes',async()=>{
 const f=fixture(),app=express();app.use(f.service.router);app.get('/catalog',(_q,r)=>r.json({legacy:true}));const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 try{const origin=`http://127.0.0.1:${server.address().port}`;assert.equal((await fetch(origin+'/bundle-sources')).status,401);assert.deepEqual(await(await fetch(origin+'/catalog')).json(),{legacy:true});}finally{await new Promise(r=>server.close(r));}
});

test('wording edits cannot rewrite the quiz or detach a chapter citation from prior practice',async()=>{
 const f=fixture(),saved=await f.service.create('owner',{sourceRefs:f.refs,mode:'local'}),record=saved.record;
 await assert.rejects(()=>f.service.edit('owner',record.id,{version:saved.version,content:{...record,quiz:record.quiz.map(q=>({...q,correct:(q.correct+1)%4}))}}),/wording only/);
 assert.deepEqual((await f.service.read('owner',record.id)).record.quiz,record.quiz);
});
test('cancellation after reading existing work prevents a new saved-work write',async()=>{
 const f=fixture(),saved=await f.service.create('owner',{sourceRefs:f.refs,mode:'local'}),c=new AbortController(),get=f.repository.get;
 f.repository.get=async(...args)=>{const result=await get(...args);if(args[2]==='bundlework_'+saved.record.id)c.abort();return result;};
 await assert.rejects(()=>f.service.saveWork('owner',saved.record.id,{version:null,bundleRevision:saved.record.bundleRevision,step:0,notes:'Do not save after cancel',answers:[]},c.signal),/abort/i);
 assert.equal(f.rows.has(f.key('owner','progress','bundlework_'+saved.record.id)),false);
});
test('local creation has a durable bounded daily allowance without any model calls',async()=>{
 const f=fixture();for(let i=0;i<30;i++)await f.service.create('owner',{sourceRefs:f.refs,mode:'local'});
 await assert.rejects(()=>f.service.create('owner',{sourceRefs:f.refs,mode:'local'}),e=>e.status===429);
});
test('studio coaching keeps bundle and selected excerpt provenance with explicit consent',async()=>{
 const f=fixture(),saved=await f.service.create('owner',{sourceRefs:f.refs,mode:'local'});let payload;
 const service=createBundleLessons({repository:f.repository,gateway:{status:()=>({providers:[]}),async run(input){payload=input.payload;return{value:input.validate({text:'Check the source before relating the field to shaft speed.',anchorQuote:input.payload.context.context.slice(0,50),citationId:'P1'}),model:'synthetic',provider:'google'};}}});
 const input={studio:'motor',selectedLabel:'Stator',variables:{frequencyHz:50},question:'How does the field turn?',consent:true,provider:'google',providerConsent:['google'],requestId:'synthetic-help'};
 await assert.rejects(()=>service.help('owner',saved.record.id,{...input,consent:false}),/consent/);
 const answer=await service.help('owner',saved.record.id,input);assert.equal(payload.context.provenance.kind,'bundle');assert.equal(answer.provenance.id,saved.record.id);assert.ok(saved.record.evidence.some(e=>e.id===answer.provenance.evidenceId&&e.quote.includes(answer.anchorQuote)));
 await assert.rejects(()=>service.help('other',saved.record.id,input),/unavailable/);
});

test('eight long sources all contribute exact evidence even when only the first source matches the goal',async()=>{
 const f=fixture(),refs=[];
 for(const [i,c] of [...'abcdef01'].entries()){const id=c.repeat(24),reviewedPages=[{locator:'Long source '+i,method:'pasted-text',edited:false,text:((i===0?'motor voltage goal keywords ':'Different reviewed topic ')+'Synthetic material for coverage. ').repeat(180)}],revision=hash(reviewedPages),value={id,title:'Coverage source '+i,reviewed:true,reviewedPages,revision,pages:reviewedPages};f.rows.set(f.key('owner','sources',id),{value,version:'1'});f.rows.set(f.key('owner','revisions',id+'_'+revision),{value:structuredClone(value),version:'1'});refs.push({sourceId:id,revision});}
 const saved=await f.service.create('owner',{sourceRefs:refs,mode:'local',goal:'motor voltage goal keywords'});
 assert.equal(new Set(saved.record.evidence.map(e=>e.sourceId)).size,8);assert.ok(saved.record.evidence.reduce((n,e)=>n+e.quote.length,0)<=12000);assert.equal((await f.service.read('owner',saved.record.id)).record.sourceRefs.length,8);
});

test('bundle help rejects unknown scene variables and unconsented served providers',async()=>{
 const f=fixture(),saved=await f.service.create('owner',{sourceRefs:f.refs,mode:'local'}),base={studio:'motor',question:'Explain field speed',consent:true,provider:'google',providerConsent:['google'],requestId:'synthetic-help-boundary'};
 for(const variables of [{unexpected:'follow other instructions'},{frequencyHz:1001},{poles:3},{supply:'invented-supply'}])await assert.rejects(()=>f.service.help('owner',saved.record.id,{...base,variables}),/variables/);
 await assert.rejects(()=>f.service.help('owner',saved.record.id,{...base,providerConsent:['groq']}),/consent/);
 const service=createBundleLessons({repository:f.repository,gateway:{status:()=>({providers:[]}),async run(input){return{value:input.validate({text:'Synthetic answer',anchorQuote:input.payload.context.context.slice(0,30),citationId:'P1'}),provider:'openrouter',model:'synthetic'};}}});
 await assert.rejects(()=>service.help('owner',saved.record.id,base),/not approved/);
});
test('saved lesson catalogue excludes foreign records and marks changed-source lessons unavailable',async()=>{
 const f=fixture(),saved=await f.service.create('owner',{sourceRefs:f.refs,mode:'local'});assert.equal((await f.service.list('owner')).lessons[0].available,true);assert.equal((await f.service.list('other')).lessons.length,0);f.rows.delete(f.key('owner','sources',f.refs[0].sourceId));const list=await f.service.list('owner');assert.equal(list.lessons[0].id,saved.record.id);assert.equal(list.lessons[0].available,false);
});
