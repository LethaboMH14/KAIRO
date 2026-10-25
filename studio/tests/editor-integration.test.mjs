import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {workspaceRoutes} from '../server/workspace/routes.mjs';
import {editDraft} from '../src/lesson-draft-core/model.ts';
import {loadReviewedLesson} from '../src/source-classroom/session.ts';

const passage='A synthetic local shop begins with 20 notebooks. It receives 12 notebooks and sells 9. Expected closing stock equals opening stock plus deliveries minus sales, giving 23 notebooks. A physical count must be checked against records.';
async function setup(){
 const prefix=join(tmpdir(),'kairo-editor-test-'),folder=await mkdtemp(prefix),app=express();
 const router=await workspaceRoutes(fileURLToPath(new URL('..',import.meta.url)),{home:join(folder,'home'),imported:join(folder,'catalog'),extract:async()=>({pages:[{text:passage,locator:'Page 1',method:'synthetic-fixture'}]})});app.use('/api/workspace',router);
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const url=`http://127.0.0.1:${server.address().port}/api/workspace`;
 const call=async(path,body,options={})=>{const response=await fetch(url+path,{...(body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),...options});return {status:response.status,body:await response.json()};};
 const get=async path=>{const result=await call(path);if(result.status!==200)throw new Error(result.body.error);return result.body;};
 const create=async()=>{const {body:source}=await call('/text',{title:'Synthetic stock passage',text:passage});const review=await call(`/source/${source.id}/review`,{pages:[{text:passage}],acknowledged:true,expectedRevision:null});assert.equal(review.status,200);const {body:lesson,status}=await call('/generate',{sourceId:source.id,revision:review.body.revision,mode:'local'});assert.equal(status,200);return {source:review.body,lesson};};
 return {call,get,create,raw:path=>fetch(url+path),async close(){await new Promise(r=>server.close(r));router.closeStore();if(!resolve(folder).startsWith(resolve(prefix)))throw new Error('Unexpected temp cleanup target');await rm(folder,{recursive:true,force:true});}};
}
test('source review uses expected revision and old lesson loads exact historical source after correction',async()=>{
 const h=await setup();try{const {source,lesson}=await h.create();const missing=await h.call(`/source/${source.id}/review`,{pages:[{text:passage}],acknowledged:true});assert.equal(missing.status,409);
 const next=await h.call(`/source/${source.id}/review`,{pages:[{text:passage+' A learner correction.'}],acknowledged:true,expectedRevision:source.revision});assert.equal(next.status,200);assert.notEqual(next.body.revision,source.revision);
 const stale=await h.call(`/source/${source.id}/review`,{pages:[{text:passage+' Stale tab.'}],acknowledged:true,expectedRevision:source.revision});assert.equal(stale.status,409);assert.equal((await h.get(`/source/${source.id}`)).revision,next.body.revision);
 const loaded=await loadReviewedLesson(lesson.id,path=>h.get(path),new AbortController().signal);assert.equal(loaded.revision,source.revision);
 const restored=await h.call(`/source/${source.id}/review`,{pages:[{text:passage}],acknowledged:true,expectedRevision:next.body.revision});assert.equal(restored.status,200);assert.equal(restored.body.revision,source.revision);
 }finally{await h.close();}
});
test('concurrent draft writes have one winner; historical restore saves a new version',async()=>{
 const h=await setup();try{const {lesson}=await h.create(),initial=await h.get(`/lesson/${lesson.id}/draft`);assert.equal(initial.version,0);
 const a=editDraft(initial.document,{kind:'title',title:'First editor'}),b=editDraft(initial.document,{kind:'title',title:'Second editor'});
 const results=await Promise.all([h.call(`/lesson/${lesson.id}/draft`,{expectedVersion:0,document:a}),h.call(`/lesson/${lesson.id}/draft`,{expectedVersion:0,document:b})]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const current=await h.get(`/lesson/${lesson.id}/draft`);assert.equal(current.version,1);const v2=await h.call(`/lesson/${lesson.id}/draft`,{expectedVersion:1,document:editDraft(current.document,{kind:'title',title:'Later draft'})});assert.equal(v2.status,200);
 const old=await h.get(`/lesson/${lesson.id}/draft/history/1`);const restored=await h.call(`/lesson/${lesson.id}/draft`,{expectedVersion:2,document:old.document});assert.equal(restored.body.version,3);assert.equal(restored.body.document.title,current.document.title);assert.equal((await h.get(`/lesson/${lesson.id}/draft/history`)).versions.length,3);
 }finally{await h.close();}
});
test('edited copy keeps original lesson and scored question semantics while preserving reflection/layout',async()=>{
 const h=await setup();try{const {lesson}=await h.create(),record=await h.get(`/lesson/${lesson.id}/draft`);let document=editDraft(record.document,{kind:'add-reflection',id:'my-reflection'});document=editDraft(document,{kind:'edit',id:'my-reflection',patch:{text:'Explain why the stock count should be checked.'}});document=editDraft(document,{kind:'layout',layout:'split'});const saved=await h.call(`/lesson/${lesson.id}/draft`,{expectedVersion:0,document});assert.equal(saved.status,200);
 const published=await h.call(`/lesson/${lesson.id}/draft/publish`,{expectedVersion:1});assert.equal(published.status,200);assert.notEqual(published.body.id,lesson.id);assert.equal(published.body.parentLessonId,lesson.id);assert.deepEqual(published.body.quiz,lesson.quiz);assert.equal(published.body.editorDocument.layout,'split');assert.ok(published.body.editorDocument.blocks.some(b=>b.id==='my-reflection'));
 const original=await h.get(`/lesson/${lesson.id}`);assert.deepEqual(original,lesson);const loaded=await loadReviewedLesson(published.body.id,path=>h.get(path),new AbortController().signal);assert.equal(loaded.id,published.body.id);
 const stale=await h.call(`/lesson/${lesson.id}/draft/publish`,{expectedVersion:0});assert.equal(stale.status,409);
 }finally{await h.close();}
});
test('draft endpoint rejects changed source identity, forged citations, question wording and raw HTML fields',async()=>{
 const h=await setup();try{const {lesson}=await h.create(),record=await h.get(`/lesson/${lesson.id}/draft`);
 for(const mutate of [d=>d.sourceRevision='0'.repeat(64),d=>d.blocks[0].citationIds=['invented'],d=>d.blocks.find(b=>b.kind==='question').text='Different scored question',d=>d.html='<script/>']){const document=structuredClone(record.document);mutate(document);assert.equal((await h.call(`/lesson/${lesson.id}/draft`,{expectedVersion:0,document})).status,400);}
 assert.equal((await h.get(`/lesson/${lesson.id}/draft`)).version,0);
 }finally{await h.close();}
});
test('retaining an original is opt-in, serves fixed safe bytes and can remove bytes without deleting text',async()=>{
 const h=await setup();try{
 const upload=async retain=>{const result=await h.call('/upload?name=public-fixture.pdf'+(retain?'&retainOriginal=1':''),undefined,{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:Buffer.from('%PDF-1.4\nSynthetic transport fixture only, not a renderable PDF.')});assert.equal(result.status,202);for(let i=0;i<20;i++){const job=await h.get('/jobs/'+result.body.jobId);if(job.status==='ready')return job.source;await new Promise(r=>setTimeout(r,5));}throw new Error('Synthetic extraction did not finish');};
 const retained=await upload(true);assert.equal(retained.original.kind,'pdf');const original=await h.raw(`/source/${retained.id}/original`);assert.equal(original.status,200);assert.match(original.headers.get('content-type'),/application\/pdf/);assert.equal(original.headers.get('x-content-type-options'),'nosniff');assert.match(original.headers.get('content-security-policy'),/sandbox/);assert.equal((await original.text()).startsWith('%PDF-1.4'),true);
 const removed=await h.call(`/source/${retained.id}/original`,undefined,{method:'DELETE'});assert.equal(removed.status,200);assert.equal((await h.get(`/source/${retained.id}`)).original,null);assert.equal((await h.call(`/source/${retained.id}/original`)).status,404);
 const ephemeral=await upload(false);assert.equal(ephemeral.original,undefined);assert.equal((await h.call(`/source/${ephemeral.id}/original`)).status,404);
 const bad=await h.call('/upload?name=fake.png',undefined,{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:Buffer.from('<html>bad</html>')});assert.equal(bad.status,400);
 const catalog=await h.get('/catalog');assert.ok(catalog.catalog.some(c=>c.id===retained.id&&c.kind==='saved-source'));
 }finally{await h.close();}
});
