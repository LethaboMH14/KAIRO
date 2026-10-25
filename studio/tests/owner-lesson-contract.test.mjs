import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseLessonSelection,assertOwnedSourceRefsCurrent,prepareOwnedLessonBundle,generateOwnedLessonBundle} from '../server/owner-retrieval/lesson-contract.mjs';

const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const IDs=['a'.repeat(24),'b'.repeat(24),'c'.repeat(24)];
function makeSource(id,text){const reviewedPages=[{text,locator:'Page 1',method:'text',edited:false}];return{id,title:`Study material ${id.slice(0,3)}`,reviewed:true,reviewedPages,revision:digest(reviewedPages)};}
const A=()=>makeSource(IDs[0],'Motor stator drives the rotor. '.repeat(55));
const B=()=>makeSource(IDs[1],'Pump impeller moves water. '.repeat(55));
function repoFor(sources,owner='alice'){
 const map=new Map(),calls=[];let onGet=()=>{};
 for(const src of sources){map.set(`${owner}:sources:${src.id}`,{value:structuredClone(src)});map.set(`${owner}:revisions:${src.id}_${src.revision}`,{value:structuredClone(src)});}
 return {map,calls,setOnGet(fn){onGet=fn;},async get(uid,kind,key){calls.push([uid,kind,key]);onGet(uid,kind,key);return structuredClone(map.get(`${uid}:${kind}:${key}`)||null);}};
}
function request(sources,mode='cloud',extra={}){return {sourceRefs:sources.map(src=>({sourceId:src.id,revision:src.revision})),mode,goal:'stator impeller',...(mode==='cloud'?{consent:true,requestId:'study_12345678',provider:'google',providerConsent:['google']}:{}),...extra};}
function validLesson(evidence){const refs=evidence.map(e=>e.id),quote=evidence[0].quote.slice(0,100);return{title:'Sourced study',objective:'Explain how it works.',chapters:[{title:'Part one',explanation:'Linked explanation.',example:'Illustrative first example.',citationIds:[refs[0]]},{title:'Part two',explanation:'A second linked idea.',example:'Illustrative second example.',citationIds:[refs.at(-1)]}],quiz:[{question:'Which quotation is in the source?',options:[quote,'Answer one','Answer two','Answer three'],correct:0,explanation:'The first answer matches the source.',citationIds:[refs[0]],supportQuote:quote}]};}

 test('legacy /generate request remains the v1 contract and never enters v2 preparation',async()=>{
  const body={sourceId:IDs[0],revision:'f'.repeat(64),mode:'local'};
  assert.deepEqual(parseLessonSelection(body),{schemaVersion:1,sourceId:body.sourceId,revision:body.revision});
  await assert.rejects(prepareOwnedLessonBundle({request:body,repository:repoFor([]),ownerId:'alice'}),/schema v2/);
  assert.throws(()=>parseLessonSelection({...body,sourceRefs:[]}),/not both/);
 });
 test('selection v2 validates order, duplicate IDs, SHA revisions, bounds and identifiers before reads',async()=>{
  const a=A(),b=B(),r=repoFor([a,b]),left=parseLessonSelection(request([a,b])),right=parseLessonSelection(request([b,a]));
  assert.equal(left.sourceRefs.length,2);assert.notEqual(left.bundleRevision,right.bundleRevision);
  const invalid=[[],Array.from({length:9},(_,i)=>makeSource(String(i).padStart(24,'0'),'data'.repeat(30))),[a,a], [{...a,id:'A'.repeat(24)}], [{...a,revision:'not-hash'}]];
  for(const docs of invalid)await assert.rejects(prepareOwnedLessonBundle({repository:r,ownerId:'alice',request:request(docs)}));
  assert.equal(r.calls.length,0);
  assert.throws(()=>parseLessonSelection(request([a], 'cloud',{requestId:'bad'})),/request ID/);
  assert.throws(()=>parseLessonSelection(request([a], 'cloud',{goal:'x'.repeat(1001)})),/limit/);
 });
 test('explicit provider consent and local privacy boundaries fail closed',()=>{
  const a=A();
  for(const extra of [{consent:false},{providerConsent:[]},{fallback:'groq'},{providerConsent:['google','google']},{provider:'groq'}])
   assert.throws(()=>parseLessonSelection(request([a],'cloud',extra)),/consent|provider/i);
  assert.throws(()=>parseLessonSelection(request([a],'local',{provider:'google'})),/Local/);
  assert.equal(parseLessonSelection(request([a],'local')).mode,'local');
 });
 test('other-tenant, missing or revoked selected source never yields owner-crossing evidence',async()=>{
  const a=A(),b=B(),r=repoFor([a,b]);
  await assert.rejects(prepareOwnedLessonBundle({repository:r,ownerId:'bob',request:request([a,b])}),{status:409});
  assert.ok(r.calls.every(([uid])=>uid==='bob'));
  r.map.delete(`alice:revisions:${b.id}_${b.revision}`);
  await assert.rejects(prepareOwnedLessonBundle({repository:r,ownerId:'alice',request:request([a,b])}),{status:409});
  r.map.set(`alice:revisions:${b.id}_${b.revision}`,{value:b});r.map.set(`alice:sources:${b.id}`,{value:{...b,reviewed:false}});
  await assert.rejects(assertOwnedSourceRefsCurrent({repository:r,ownerId:'alice',sourceRefs:request([a,b]).sourceRefs}),{status:409});
 });
 test('cross-document excerpts retain exact per-source revision, page locator and UTF-16 offsets',async()=>{
  const a=A(),b=B(),r=repoFor([a,b]);
  const bundle=await prepareOwnedLessonBundle({repository:r,ownerId:'alice',request:request([a,b])});
  assert.equal(bundle.selection.searchedSources,2);
  assert.ok(bundle.evidence.some(e=>e.sourceId===a.id)&&bundle.evidence.some(e=>e.sourceId===b.id));
  assert.equal(new Set(bundle.evidence.map(e=>e.id)).size,bundle.evidence.length);
  assert.ok(bundle.evidence.length<=12&&bundle.evidence.reduce((n,e)=>n+e.quote.length,0)<=12000);
  for(const e of bundle.evidence){const src=[a,b].find(s=>s.id===e.sourceId);assert.equal(e.sourceRevision,src.revision);assert.equal(e.quote,src.reviewedPages[0].text.slice(e.start,e.end));}
  assert.equal(await bundle.isCurrent(),true);
 });
 test('retriever provenance tampering and wrong-document citations are rejected',async()=>{
  const a=A(),b=B(),r=repoFor([a,b]);
  const good=await prepareOwnedLessonBundle({repository:r,ownerId:'alice',request:request([a,b])});
  for(const mutation of [e=>({...e,sourceId:b.id}),e=>({...e,sourceRevision:'f'.repeat(64)}),e=>({...e,start:e.start+1}),e=>({...e,locator:'Page 99'}),e=>({...e,title:'Wrong material'}),e=>({...e,edited:!e.edited}),e=>({...e,id:e.id.replace('S1-','S2-')}),e=>({...e,id:'forged'})]){
   const bad={evidence:[mutation(good.evidence[0])],selection:{selectedSources:good.sourceRefs,selectedCharacters:good.evidence[0].quote.length}};
   await assert.rejects(prepareOwnedLessonBundle({repository:r,ownerId:'alice',request:request([a,b]),retrieve:async()=>bad}),/provenance/);
  }
 });
 test('secondary source revision race during retrieval is denied before provider admission',async()=>{
  const a=A(),b=B(),r=repoFor([a,b]),req=request([a,b]);let providerCalls=0;
  const retrieve=async args=>{const result=await import('../server/owner-retrieval/corpus.mjs').then(m=>m.retrieveOwnedCorpus(args));r.map.set(`alice:sources:${b.id}`,{value:{...b,revision:'f'.repeat(64)}});return result;};
  await assert.rejects(generateOwnedLessonBundle({repository:r,ownerId:'alice',request:req,gateway:{run:async()=>{providerCalls++;}},retrieve}),{status:409});
  assert.equal(providerCalls,0);
 });
 test('secondary source revision race on provider return is denied',async()=>{
  const a=A(),b=B(),r=repoFor([a,b]);
  await assert.rejects(generateOwnedLessonBundle({repository:r,ownerId:'alice',request:request([a,b]),gateway:{run:async opts=>{assert.equal(await opts.isCurrent(),true);r.map.set(`alice:sources:${b.id}`,{value:{...b,revision:'f'.repeat(64)}});return{value:validLesson(opts.payload.evidence),provider:'google',model:'synthetic'};}}}),{status:409});
 });
 test('cloud gateway passes complete ordered revision fingerprint, cross-source citations and explicit consent',async()=>{
  const a=A(),b=B(),r=repoFor([a,b]);let calls=0;
  const output=await generateOwnedLessonBundle({repository:r,ownerId:'alice',request:request([a,b]),curation:{goal:'studying'},gateway:{run:async opts=>{calls++;assert.equal(opts.uid,'alice');assert.equal(opts.revision,digest({schemaVersion:2,sourceRefs:request([a,b]).sourceRefs}));assert.equal(opts.consent[0],'google');assert.deepEqual(opts.payload.sourceRefs,request([a,b]).sourceRefs);assert.ok(opts.payload.evidence.some(e=>e.sourceId===b.id));assert.equal(await opts.isCurrent(),true);return{value:opts.validate(validLesson(opts.payload.evidence)),provider:'google',model:'synthetic'};}}});
  assert.equal(calls,1);assert.equal(output.kind,'cloud-lesson');assert.equal(output.value.chapters[1].citationIds.length,1);
  assert.equal(await output.bundle.isCurrent(),true);
 });
 test('budget exhaustion and model failure propagate without a persisted lesson',async()=>{
  const a=A(),r=repoFor([a]);for(const error of [Object.assign(new Error('Allowance used'),{status:429}),new Error('Provider unavailable')]){
   let count=0;
   await assert.rejects(generateOwnedLessonBundle({repository:r,ownerId:'alice',request:request([a]),gateway:{run:async()=>{count++;throw error;}}}),e=>e===error);
   assert.equal(count,1);
  }
  assert.equal(r.calls.some(([,kind])=>kind==='lessons'),false);
 });
 test('abort before retrieval and during provider call propagates without saving',async()=>{
  const a=A(),r=repoFor([a]);const already=new AbortController();already.abort();
  await assert.rejects(prepareOwnedLessonBundle({repository:r,ownerId:'alice',request:request([a]),signal:already.signal}),{name:'AbortError'});
  assert.equal(r.calls.length,0);
  const later=new AbortController();let gatewayCalled=false;
  await assert.rejects(generateOwnedLessonBundle({repository:r,ownerId:'alice',request:request([a]),signal:later.signal,gateway:{run:async({signal})=>{gatewayCalled=true;later.abort();signal.throwIfAborted();}}}),{name:'AbortError'});
  assert.equal(gatewayCalled,true);
 });
 test('local v2 selection does not invoke a provider and does not claim draft/studio support',async()=>{
  const a=A(),r=repoFor([a]);const out=await generateOwnedLessonBundle({repository:r,ownerId:'alice',request:request([a],'local'),gateway:{run:()=>{throw Error('Do not use provider');}}});
  assert.equal(out.kind,'local-selection');assert.equal(out.bundle.request.mode,'local');assert.ok(out.bundle.evidence.length>0);
 });
