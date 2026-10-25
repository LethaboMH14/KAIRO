import test from 'node:test';
import assert from 'node:assert/strict';
import { hash } from '../server/workspace/model.mjs';
import { prepareOwnedLessonBundle } from '../server/owner-retrieval/lesson-contract.mjs';
import {createLessonV2Record,verifyLessonV2Record,saveLessonV2Record}
  from '../server/lesson-v2/record.mjs';

const ids=['a'.repeat(24),'b'.repeat(24)];
const page=(name)=>[{locator:'Page 1',method:'pasted-text',edited:false,
  text:(name+' Reviewed synthetic motor field and voltage principle. ').repeat(12)}];
function fixture(){
 const records=new Map(),writes=[],deletes=[];
 const key=(uid,kind,id)=>uid+':'+kind+':'+id;
 const sources=ids.map((id,i)=>{
   const reviewedPages=page('Doc '+i),revision=hash(reviewedPages);
   const source={id,title:'Source '+i,reviewed:true,reviewedPages,pages:reviewedPages,revision};
   records.set(key('ownerA','sources',id),{id,value:structuredClone(source),version:'v1'});
   records.set(key('ownerA','revisions',id+'_'+revision),{id:id+'_'+revision,value:structuredClone(source),version:'v1'});
   return source;
 });
 let onPut=()=>{},failRollback=false;
 const repo={
   async get(uid,kind,id){return structuredClone(records.get(key(uid,kind,id))||null);},
   async put(uid,kind,id,value,opts){
     writes.push({uid,kind,id,opts});
     const record={id,value:structuredClone(value),version:'saved-version'};
     records.set(key(uid,kind,id),record);
     onPut();
     return structuredClone(record);
   },
   async remove(uid,kind,id,opts){
     deletes.push({uid,kind,id,opts});
     if(failRollback)throw new Error('Synthetic rollback storage failure');
     records.delete(key(uid,kind,id));
     return {removed:true};
   },
 };
 return {repo,records,key,sources,writes,deletes,
   setOnPut(fn){onPut=fn;},setRollbackFailure(v){failRollback=v;}};
}
async function bundleFor(f,chosen=[0,1],ownerId='ownerA'){
 const request={mode:'local',goal:'motor voltage',
   sourceRefs:chosen.map(i=>({sourceId:f.sources[i].id,revision:f.sources[i].revision}))};
 return prepareOwnedLessonBundle({repository:f.repo,ownerId,request});
}
function lessonContent(bundle){
 const evidence=bundle.evidence;
 const q=evidence[0].quote.slice(0,70);
 return {title:'Motor theory from reviewed sources',objective:'Recognise exact source evidence and practise checking it.',
   chapters:[
     {title:'Read motor evidence',explanation:'These excerpts come only from the selected reviewed notes.',example:'Identify the exact phrase supporting an explanation.',citationIds:[evidence[0].id]},
     {title:'Apply a concept',explanation:'Compare current and voltage claims with the selected passages.',example:'State a claim and cite its locator.',citationIds:[evidence.at(-1).id]},
   ],
   quiz:[{question:'Which choice is copied from the selected reviewed source?',options:[q,'Unrelated option B','Unrelated option C','Unrelated option D'],correct:0,
     explanation:'This selection includes an exact anchored quote.',citationIds:[evidence[0].id],supportQuote:q}],
 };
}
test('creates a v2-only record with ordered revisions and exact cross-document anchors',async()=>{
 const f=fixture(),bundle=await bundleFor(f),record=createLessonV2Record({
   bundle,content:lessonContent(bundle),id:'f'.repeat(24),createdAt:'2026-10-25T04:00:00Z'});
 assert.equal(record.schemaVersion,2);
 assert.equal(record.mode,'local-extractive-v2');
 assert.equal(Object.hasOwn(record,'sourceId'),false);
 assert.equal(Object.hasOwn(record,'revision'),false);
 assert.deepEqual(record.sourceRefs.map(x=>x.sourceId),ids);
 assert.equal(record.bundleRevision,bundle.bundleRevision);
 assert.ok(record.evidence.some(e=>e.sourceId===ids[1]));
 assert.equal(await verifyLessonV2Record({repository:f.repo,ownerId:'ownerA',record}),true);
});
test('foreign owner cannot verify or save the same v2 source bundle',async()=>{
 const f=fixture(),bundle=await bundleFor(f),record=createLessonV2Record({bundle,content:lessonContent(bundle),id:'f'.repeat(24)});
 await assert.rejects(()=>verifyLessonV2Record({repository:f.repo,ownerId:'ownerB',record}),/source changed/i);
 await assert.rejects(()=>saveLessonV2Record({repository:f.repo,ownerId:'ownerB',bundle,content:lessonContent(bundle),id:'f'.repeat(24)}),/source changed/i);
 assert.equal(f.writes.length,0);
});
test('tampered revision, mismatched source title, quote or edited flag fails closed',async()=>{
 const f=fixture(),bundle=await bundleFor(f),base=createLessonV2Record({bundle,content:lessonContent(bundle),id:'f'.repeat(24)});
 const variants=[
   {...base,bundleRevision:'f'.repeat(64)},
   {...base,sourceId:ids[0]},
   {...base,evidence:base.evidence.map((e,i)=>i?e:{...e,title:'Forged source'})},
   {...base,evidence:base.evidence.map((e,i)=>i?e:{...e,quote:'X'+e.quote.slice(1)})},
   {...base,evidence:base.evidence.map((e,i)=>i?e:{...e,edited:true})},
 ];
 for(const record of variants)await assert.rejects(
   ()=>verifyLessonV2Record({repository:f.repo,ownerId:'ownerA',record}),/invalid|changed|citation/i);
});
test('a verified local record persists once and remains checked on subsequent reads',async()=>{
 const f=fixture(),bundle=await bundleFor(f);
 const result=await saveLessonV2Record({repository:f.repo,ownerId:'ownerA',bundle,
   content:lessonContent(bundle),id:'f'.repeat(24)});
 assert.equal(result.version,'saved-version');
 assert.equal(f.writes.length,1);
 assert.equal(f.writes[0].kind,'lessons');
 assert.equal(f.writes[0].opts.create,true);
 assert.equal(f.deletes.length,0);
 const saved=(await f.repo.get('ownerA','lessons','f'.repeat(24))).value;
 assert.equal(await verifyLessonV2Record({repository:f.repo,ownerId:'ownerA',record:saved}),true);
});
test('a review race during persistence rejects and best-effort removes the new record',async()=>{
 const f=fixture(),bundle=await bundleFor(f),original=f.sources[1];
 f.setOnPut(()=>{
   const reviewedPages=page('Changed after storage write');
   f.records.set(f.key('ownerA','sources',original.id),{value:{
     ...original,reviewedPages,revision:hash(reviewedPages)},version:'v2'});
 });
 await assert.rejects(()=>saveLessonV2Record({repository:f.repo,ownerId:'ownerA',bundle,
   content:lessonContent(bundle),id:'f'.repeat(24)}),/source changed/i);
 assert.equal(f.writes.length,1);
 assert.equal(f.deletes.length,1);
 assert.equal(await f.repo.get('ownerA','lessons','f'.repeat(24)),null);
});
test('failed rollback never converts changed revisions into a successful save',async()=>{
 const f=fixture(),bundle=await bundleFor(f),original=f.sources[0];
 f.setRollbackFailure(true);
 f.setOnPut(()=>{
   const reviewedPages=page('Different source revision');
   f.records.set(f.key('ownerA','sources',original.id),{value:{
     ...original,reviewedPages,revision:hash(reviewedPages)},version:'v2'});
 });
 await assert.rejects(()=>saveLessonV2Record({repository:f.repo,ownerId:'ownerA',bundle,
   content:lessonContent(bundle),id:'f'.repeat(24)}),/source changed/i);
 const leaked=(await f.repo.get('ownerA','lessons','f'.repeat(24))).value;
 await assert.rejects(()=>verifyLessonV2Record({repository:f.repo,ownerId:'ownerA',record:leaked}),/source changed/i);
});
test('stale or deleted reviewed source fails on read even if lesson document still exists',async()=>{
 const f=fixture(),bundle=await bundleFor(f),record=createLessonV2Record({bundle,
   content:lessonContent(bundle),id:'f'.repeat(24)});
 f.records.delete(f.key('ownerA','sources',ids[0]));
 await assert.rejects(()=>verifyLessonV2Record({repository:f.repo,ownerId:'ownerA',record}),/source changed/i);
});
test('aborted verification never writes a new record',async()=>{
 const f=fixture(),bundle=await bundleFor(f),ctrl=new AbortController();
 ctrl.abort();
 await assert.rejects(()=>saveLessonV2Record({repository:f.repo,ownerId:'ownerA',bundle,
   content:lessonContent(bundle),id:'f'.repeat(24),signal:ctrl.signal}),/abort/i);
 assert.equal(f.writes.length,0);
});
