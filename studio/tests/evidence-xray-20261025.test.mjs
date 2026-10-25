import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {preparedPages,preparedPumpExercise as prepared} from '../src/evidence-xray-20261025/prepared-pump.mjs';
import {advanceAttempt,checkCurrentSources,chooseAttempt,getAuthenticatedPreview,loadOwnerEvidence,makeGraph,
 readPreviewData,refreshAuthenticatedCatalog,startAttempts,submitAttempt,unsupportedClaim,validatePrepared} from '../src/evidence-xray-20261025/core.mjs';

const clone=value=>structuredClone(value);
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const catalog=(changes={})=>({reviewedSourcesVersion:1,reviewedSources:[{
 id:prepared.sourceRefs[0].sourceId,reviewed:true,revision:prepared.sourceRefs[0].revision,
 title:'Prepared source',reviewedSectionCount:3,...changes
}]});
const goodPreview=()=>{
 const p=clone(prepared);
 return {schemaVersion:2,kind:'reviewed-evidence-preview',bundleRevision:p.bundleRevision,
  sourceRefs:p.sourceRefs,evidence:p.evidence,selection:{method:'multi-source-lexical',semantic:false,
   selectedCharacters:p.evidence.reduce((n,e)=>n+e.quote.length,0)},
  notice:'This is a private excerpt preview, not a generated or saved lesson.'};
};

test('prepared teaching quotes match literal reviewed-page text with exact UTF-16 offsets and SHA-256 reviewed revision',()=>{
 const refs=prepared.sourceRefs;
 assert.equal(refs.length,1);
 assert.equal(refs[0].revision,sha(preparedPages));
 for(let i=0;i<prepared.evidence.length;i++){
  const e=prepared.evidence[i];
  assert.equal(e.sourceId,refs[0].sourceId);
  assert.equal(e.sourceRevision,refs[0].revision);
  assert.equal(e.locator,preparedPages[i].locator);
  assert.equal(preparedPages[i].text.slice(e.start,e.end),e.quote);
  assert.equal(e.quote.length,e.end-e.start);
 }
});
test('2-round answer key is deterministic; no feedback before a deliberate choice and submission',()=>{
 let s=startAttempts(prepared);
 assert.equal(s.feedback,null);
 assert.equal(submitAttempt(prepared,s),s);
 s=chooseAttempt(prepared,s,prepared.evidence[1].id);
 assert.equal(s.feedback,null);
 assert.equal(s.selectedEvidenceId,prepared.evidence[1].id);
 const first=submitAttempt(prepared,s);
 assert.equal(first.feedback.correct,false);
 assert.equal(first.feedback.answerEvidenceId,prepared.challenges[0].answerEvidenceId);
 assert.equal(first.feedback.unsaved,true);
 assert.deepEqual(submitAttempt(prepared,first),first,'cannot change key after grading');
 s=advanceAttempt(prepared,first);
 assert.equal(s.round,1);
 assert.equal(s.selectedEvidenceId,null);
 s=chooseAttempt(prepared,s,prepared.challenges[1].answerEvidenceId);
 s=submitAttempt(prepared,s);
 assert.equal(s.feedback.correct,true);
 assert.equal(advanceAttempt(prepared,s).completed,true);
});
test('no invented answer key in real owner preview or arbitrary claim',()=>{
 const preview=readPreviewData(goodPreview(),prepared.sourceRefs);
 assert.equal(preview.mode,'preview-only');
 assert.equal(preview.concepts.length,0);
 assert.equal(preview.challenges.length,0);
 assert.deepEqual(submitAttempt(preview,startAttempts(preview)),startAttempts(preview));
 assert.equal(unsupportedClaim(),'Not established by the selected sources.');
});
test('disconnected concepts and directed cycle accepted, graph stable across calls',()=>{
 const v=clone(prepared);v.relations.push({from:'fluid-flow',to:'pump-head',kind:'supported',
  evidenceIds:[v.evidence[2].id]});
 const accepted=validatePrepared(v);
 const a=makeGraph(accepted),b=makeGraph(accepted);
 assert.deepEqual(a,b);
 assert.ok(a.nodes.find(n=>n.id==='concept:efficiency'));
 assert.equal(accepted.concepts.find(c=>c.id==='efficiency').evidenceIds.length,0);
 assert.ok(a.edges.some(e=>e.kind==='unverified'&&e.evidenceIds.length===0));
});
test('malformed, duplicate, cross-reference and unsupported relationships fail closed',()=>{
 const cases=[];
 const dup=clone(prepared);dup.evidence.push(dup.evidence[0]);cases.push(dup);
 const ref=clone(prepared);ref.sourceRefs.push(ref.sourceRefs[0]);cases.push(ref);
 const badId=clone(prepared);badId.evidence[0].id='forged';cases.push(badId);
 const badQuote=clone(prepared);badQuote.evidence[0].quote='replaced';cases.push(badQuote);
 const badLocator=clone(prepared);badLocator.evidence[0].locator='';cases.push(badLocator);
 const badRevision=clone(prepared);badRevision.evidence[0].sourceRevision='f'.repeat(64);cases.push(badRevision);
 const badConcept=clone(prepared);badConcept.concepts[0].evidenceIds=['unknown'];cases.push(badConcept);
 const badRelation=clone(prepared);badRelation.relations[0].evidenceIds=[];cases.push(badRelation);
 const unverified=clone(prepared);unverified.relations.at(-1).evidenceIds=[unverified.evidence[0].id];cases.push(unverified);
 const dupNode=clone(prepared);dupNode.concepts[0].id=dupNode.concepts[1].id;cases.push(dupNode);
 const third=clone(prepared);third.challenges.push(third.challenges[0]);cases.push(third);
 for(const candidate of cases)assert.throws(()=>validatePrepared(candidate),TypeError);
});
test('preview enforces exact source anchors and refuses wrong owner/duplicate/oversize',()=>{
 const base=goodPreview();
 const v=readPreviewData(base,prepared.sourceRefs);
 assert.equal(v.evidence.length,3);
 const bads=[];
 const wrong=clone(base);wrong.evidence[0].sourceId='a'.repeat(24);bads.push(wrong);
 const wrongRevision=clone(base);wrongRevision.sourceRefs[0].revision='f'.repeat(64);bads.push(wrongRevision);
 const forged=clone(base);forged.evidence[0].id='not-a-citation';bads.push(forged);
 const dup=clone(base);dup.evidence[1].id=dup.evidence[0].id;bads.push(dup);
 const xss=clone(base);xss.evidence[0].quote='<script>alert(1)</script>';bads.push(xss);
 const offset=clone(base);offset.evidence[0].end++;bads.push(offset);
 const inferred=clone(base);inferred.selection.semantic=true;bads.push(inferred);
 const oversized=clone(base);oversized.evidence=Array(13).fill(base.evidence[0]);bads.push(oversized);
 for(const row of bads)assert.throws(()=>readPreviewData(row,prepared.sourceRefs),TypeError);
});
test('revoked, cross-owner, stale and malformed catalogs hide private preview',()=>{
 assert.equal(checkCurrentSources(prepared,catalog()).ok,true);
 assert.equal(checkCurrentSources(prepared,catalog({revision:'f'.repeat(64)})).ok,false);
 assert.equal(checkCurrentSources(prepared,catalog({revoked:true})).ok,false);
 assert.equal(checkCurrentSources(prepared,catalog({reviewed:false})).ok,false);
 assert.equal(checkCurrentSources(prepared,{reviewedSourcesVersion:1,reviewedSources:[]}).ok,false);
 assert.equal(checkCurrentSources(prepared,{reviewedSourcesVersion:1,reviewedSources:[
 ...catalog().reviewedSources,...catalog().reviewedSources]}).ok,false);
});
test('authorized adapter posts only approved same-origin local preview; no writes or model calls',async()=>{
 const calls=[],payload=goodPreview();
 const fetcher=async(path,options)=>{calls.push({path,options});return {ok:true,status:200,
  text:async()=>JSON.stringify(payload)};};
 const v=await getAuthenticatedPreview({sourceRefs:prepared.sourceRefs,goal:'pump head',fetcher});
 assert.equal(v.mode,'preview-only');
 assert.equal(calls.length,1);assert.equal(calls[0].path,'/api/workspace/bundle-preview');
 const o=calls[0].options;assert.equal(o.method,'POST');assert.equal(o.credentials,'same-origin');assert.equal(o.cache,'no-store');
 assert.deepEqual(JSON.parse(o.body),{schemaVersion:2,mode:'local',sourceRefs:prepared.sourceRefs,goal:'pump head'});
 assert.equal(JSON.stringify(o).includes('provider'),false);
});
test('cross-owner / revoked HTTP preview never leaks excerpts in error messages',async()=>{
 for(const status of [401,403,409,503]){
  const fetcher=async()=>({ok:false,status,text:async()=>JSON.stringify(goodPreview())});
  await assert.rejects(()=>getAuthenticatedPreview({sourceRefs:prepared.sourceRefs,fetcher}),e=>{
   assert.doesNotMatch(e.message,/impeller|operating point|section 1/i);
   return true;
  });
 }
});
test('bounded payload, invalid preview, invalid JSON and malformed catalog fail closed',async()=>{
 await assert.rejects(()=>getAuthenticatedPreview({sourceRefs:prepared.sourceRefs,goal:'x'.repeat(1001),fetcher:async()=>{throw Error('should not fetch')}}),TypeError);
 await assert.rejects(()=>getAuthenticatedPreview({sourceRefs:prepared.sourceRefs,fetcher:async()=>({ok:true,text:async()=>'{bad'})}),TypeError);
 await assert.rejects(()=>getAuthenticatedPreview({sourceRefs:prepared.sourceRefs,fetcher:async()=>({ok:true,text:async()=> 'x'.repeat(36001)})}),TypeError);
 await assert.rejects(()=>refreshAuthenticatedCatalog({fetcher:async()=>({ok:true,text:async()=>'{broken'})}),TypeError);
 const x=await refreshAuthenticatedCatalog({fetcher:async()=>({ok:true,text:async()=>JSON.stringify(catalog())})});
 assert.equal(x.reviewedSourcesVersion,1);
});
test('100 bounded deterministic graph builds remain cheap and no graph side effect persists',()=>{
 const activity=validatePrepared(clone(prepared));
 const began=performance.now();for(let i=0;i<100;i++){const g=makeGraph(activity);assert.ok(g.nodes.length<30);}
 assert.ok(performance.now()-began<1800,'100 bounded graph builds should be under 1.8 seconds');
 assert.ok(!Object.hasOwn(prepared,'savedAt'),'the prepared exercise contains no persisted attempt metadata');
});

test('owner preview double-checks live catalog and rejects revoked revisions during the request',async()=>{
 const calls=[];
 const fetcher=async(path,options)=>{
  calls.push({path,options});
  const revocation=path==='/api/workspace/catalog'&&calls.length===3;
  const body=path==='/api/workspace/catalog'?catalog(revocation?{revoked:true}:{}):goodPreview();
  return {ok:true,status:200,text:async()=>JSON.stringify(body)};
 };
 await assert.rejects(()=>loadOwnerEvidence({sourceRefs:prepared.sourceRefs,goal:'pump',fetcher}),/unavailable, revoked or has changed/);
 assert.deepEqual(calls.map(x=>x.path),['/api/workspace/catalog','/api/workspace/bundle-preview','/api/workspace/catalog']);
 assert.equal(calls[1].options.credentials,'same-origin');
});
test('owner preview provides only authorized sources and the latest fresh catalog to the view',async()=>{
 const calls=[];
 const fetcher=async(path,options)=>{
  calls.push({path,options});
  return {ok:true,status:200,text:async()=>JSON.stringify(path==='/api/workspace/catalog'?catalog():goodPreview())};
 };
 const {activity,currentCatalog}=await loadOwnerEvidence({sourceRefs:prepared.sourceRefs,fetcher});
 assert.equal(activity.mode,'preview-only');
 assert.equal(checkCurrentSources(activity,currentCatalog).ok,true);
 assert.equal(activity.challenges.length,0);
 assert.equal(calls.length,3);
});
