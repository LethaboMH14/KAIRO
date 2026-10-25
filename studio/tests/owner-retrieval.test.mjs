import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {retrieveOwnedCorpus} from '../server/owner-retrieval/corpus.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const ids=['a'.repeat(24),'b'.repeat(24),'c'.repeat(24)];
function source(id,text){const reviewedPages=[{text,locator:'Page 1',method:'text',edited:false}];return{id,title:'Material',reviewed:true,reviewedPages,revision:hash(reviewedPages)};}
function makeRepo(sources){const map=new Map();for(const s of sources){map.set('alice:sources:'+s.id,{value:s});map.set('alice:revisions:'+s.id+'_'+s.revision,{value:structuredClone(s)});}return{map,async get(owner,kind,id){return map.get(owner+':'+kind+':'+id)||null;}};}
test('multi-source citations have correct owner, exact offsets, and distinct IDs',async()=>{
 const a=source(ids[0],'Motor stator drives rotor. '.repeat(60));
 const b=source(ids[1],'Pump impeller moves water. '.repeat(60));
 const r=await retrieveOwnedCorpus({repository:makeRepo([a,b]),ownerId:'alice',sourceIds:[a.id,b.id],goal:'stator impeller'});
 assert.equal(r.selection.searchedSources,2);assert.equal(r.selection.semantic,false);
 assert.equal(new Set(r.evidence.map(e=>e.id)).size,r.evidence.length);
 for(const e of r.evidence){const src=[a,b].find(s=>s.id===e.sourceId);assert.ok(src);assert.equal(e.sourceRevision,src.revision);assert.equal(e.quote,src.reviewedPages[0].text.slice(e.start,e.end));}
 assert.ok(r.evidence.some(e=>e.sourceId===a.id));assert.ok(r.evidence.some(e=>e.sourceId===b.id));
});
test('does not read another owner or a missing revision',async()=>{
 const s=source(ids[0],'Stator '.repeat(50)),repo=makeRepo([s]);
 await assert.rejects(retrieveOwnedCorpus({repository:repo,ownerId:'bob',sourceIds:[s.id]}),/unavailable/);
 repo.map.delete('alice:revisions:'+s.id+'_'+s.revision);
 await assert.rejects(retrieveOwnedCorpus({repository:repo,ownerId:'alice',sourceIds:[s.id]}),/unavailable/);
});
test('rejects edited snapshots, unreviewed text, and mid-read revision changes',async()=>{
 const s=source(ids[0],'Engine crankshaft. '.repeat(50)),repo=makeRepo([s]);
 repo.map.set('alice:sources:'+s.id,{value:{...s,reviewedPages:[{...s.reviewedPages[0],text:'tampered'}]}});
 await assert.rejects(retrieveOwnedCorpus({repository:repo,ownerId:'alice',sourceIds:[s.id]}),/changed/);
 repo.map.set('alice:sources:'+s.id,{value:{...s,reviewed:false}});
 await assert.rejects(retrieveOwnedCorpus({repository:repo,ownerId:'alice',sourceIds:[s.id]}),/unavailable/);
 let reads=0;const race={async get(_uid,kind){if(kind==='revisions')return{value:s};reads++;return{value:reads>1?{...s,revision:'f'.repeat(64)}:s};}};
 await assert.rejects(retrieveOwnedCorpus({repository:race,ownerId:'alice',sourceIds:[s.id]}),/changed/);
});
test('requires valid bounded explicit selection and does not query unselected sources',async()=>{
 const s=source(ids[0],'Pump pressure '.repeat(30)),repo=makeRepo([s]),calls=[];
 const guarded={async get(...args){calls.push(args);return repo.get(...args);}};
 for(const bad of [[],['bad'],[s.id,s.id],Array.from({length:9},(_,i)=>String(i).padStart(24,'0'))]){
   await assert.rejects(retrieveOwnedCorpus({repository:guarded,ownerId:'alice',sourceIds:bad}),/Choose one to eight/);
 }
 assert.equal(calls.length,0);
 await retrieveOwnedCorpus({repository:guarded,ownerId:'alice',sourceIds:[s.id]});
 assert.ok(calls.every(([owner,,key])=>owner==='alice'&&key.includes(s.id)));
});
test('bounds results, returns truthful limitation, and supports abort',async()=>{
 const docs=ids.map((id,i)=>source(id,('Motor '+i+' stator. ').repeat(600)));
 const r=await retrieveOwnedCorpus({repository:makeRepo(docs),ownerId:'alice',sourceIds:ids,goal:'motor'});
 assert.ok(r.evidence.length<=12);assert.ok(r.selection.selectedCharacters<=12000);
 assert.match(r.selection.limitation,/not an indexed semantic corpus/);
 const ctrl=new AbortController();ctrl.abort();
 await assert.rejects(retrieveOwnedCorpus({repository:makeRepo(docs),ownerId:'alice',sourceIds:[ids[0]],signal:ctrl.signal}),{name:'AbortError'});
});
