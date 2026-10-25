/**
 * Multi-source lesson v2 boundary, staged on PR #1's owner-scoped retriever.
 * This file deliberately does not mount a route or change single-source v1.
 */
import {createHash} from 'node:crypto';
import {retrieveOwnedCorpus} from './corpus.mjs';
import {validateLesson} from '../workspace/model.mjs';

const ID=/^[a-f0-9]{24}$/;
const REV=/^[a-f0-9]{64}$/;
const REQUEST=/^[a-zA-Z0-9_-]{8,100}$/;
const PROVIDERS=new Set(['google','groq','openrouter','aiml']);
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const changed=()=>Object.assign(new Error('A selected reviewed source changed or is unavailable. Reopen your material.'),{status:409});
const checkAbort=signal=>signal?.throwIfAborted();

/** Version detection never changes the legacy POST /generate body contract. */
export function parseLessonSelection(body){
 if(!body||typeof body!=='object'||Array.isArray(body))throw new TypeError('Choose lesson material.');
 if(!Object.hasOwn(body,'sourceRefs'))return {schemaVersion:1,sourceId:body.sourceId,revision:body.revision};
 if(Object.hasOwn(body,'sourceId')||Object.hasOwn(body,'revision'))throw new TypeError('Choose legacy source or sourceRefs, not both.');
 const refs=body.sourceRefs;
 if(!Array.isArray(refs)||refs.length<1||refs.length>8)throw new TypeError('Choose one to eight reviewed sources.');
 const seen=new Set();
 const sourceRefs=refs.map(ref=>{
  if(!ref||typeof ref!=='object'||Array.isArray(ref)||Object.keys(ref).sort().join(',')!=='revision,sourceId'||
     typeof ref.sourceId!=='string'||!ID.test(ref.sourceId)||typeof ref.revision!=='string'||!REV.test(ref.revision)||seen.has(ref.sourceId))
   throw new TypeError('Choose distinct source IDs with reviewed SHA-256 revisions.');
  seen.add(ref.sourceId);
  return Object.freeze({sourceId:ref.sourceId,revision:ref.revision});
 });
 if(!['local','cloud'].includes(body.mode))throw new TypeError('Choose a lesson type.');
 if(body.goal!==undefined&&(typeof body.goal!=='string'||body.goal.length>1000))throw new TypeError('Study goal exceeds its limit.');
 const goal=body.goal||'';
 let provider=null,providerConsent=[];
 if(body.mode==='cloud'){
  if(body.consent!==true)throw new TypeError('Choose cloud processing consent.');
  if(typeof body.provider!=='string'||!PROVIDERS.has(body.provider))throw new TypeError('Choose a cloud provider.');
  if(!REQUEST.test(body.requestId??''))throw new TypeError('Use a valid lesson request ID.');
  if(!Array.isArray(body.providerConsent)||body.providerConsent.length<1||body.providerConsent.length>2||
     body.providerConsent.some(p=>!PROVIDERS.has(p))||new Set(body.providerConsent).size!==body.providerConsent.length||
     !body.providerConsent.includes(body.provider)||
     (body.fallback!==undefined&&(!PROVIDERS.has(body.fallback)||!body.providerConsent.includes(body.fallback))))
   throw new TypeError('Consent to every selected cloud provider.');
  provider=body.provider;
  providerConsent=[...body.providerConsent];
 }else if(body.provider!==undefined||body.providerConsent!==undefined||body.fallback!==undefined){
  throw new TypeError('Local lessons do not send material to a provider.');
 }
 const bundleRevision=digest({schemaVersion:2,sourceRefs});
 return Object.freeze({schemaVersion:2,sourceRefs:Object.freeze(sourceRefs),bundleRevision,goal,mode:body.mode,
  consent:body.mode==='cloud',provider,providerConsent:Object.freeze(providerConsent),fallback:body.fallback,
  requestId:body.requestId});
}

/** Verify selected records AND their immutable reviews using only the authenticated owner ID. */
export async function assertOwnedSourceRefsCurrent({repository,ownerId,sourceRefs,signal}){
 if(typeof ownerId!=='string'||!ownerId||ownerId.length>256||!repository||typeof repository.get!=='function')
  throw new TypeError('Authenticated owner repository required.');
 for(const {sourceId,revision} of sourceRefs){
  checkAbort(signal);
  const saved=(await repository.get(ownerId,'sources',sourceId))?.value;
  if(!saved||saved.id!==sourceId||saved.reviewed!==true||saved.revision!==revision||
     !Array.isArray(saved.reviewedPages)||digest(saved.reviewedPages)!==revision)throw changed();
  const archived=(await repository.get(ownerId,'revisions',sourceId+'_'+revision))?.value;
  if(!archived||archived.id!==sourceId||archived.revision!==revision||
     !Array.isArray(archived.reviewedPages)||digest(archived.reviewedPages)!==revision)throw changed();
 }
 checkAbort(signal);
 return true;
}

/** A second provenance check prevents a retrieved excerpt masquerading as another document/page. */
export async function prepareOwnedLessonBundle({repository,ownerId,request,signal,retrieve=retrieveOwnedCorpus}){
 const parsed=parseLessonSelection(request);
 if(parsed.schemaVersion!==2)throw new TypeError('Multi-source contract is only used for schema v2.');
 checkAbort(signal);
 await assertOwnedSourceRefsCurrent({repository,ownerId,sourceRefs:parsed.sourceRefs,signal});
 const selected=await retrieve({repository,ownerId,sourceIds:parsed.sourceRefs.map(x=>x.sourceId),goal:parsed.goal,signal});
 if(!selected||!Array.isArray(selected.evidence)||!selected.evidence.length||selected.evidence.length>12||
    !Array.isArray(selected.selection?.selectedSources)||selected.selection.selectedSources.length!==parsed.sourceRefs.length)
  throw new TypeError('Reviewed-source evidence selection is invalid.');
 for(let i=0;i<parsed.sourceRefs.length;i++){
  const ref=parsed.sourceRefs[i],got=selected.selection.selectedSources[i];
  if(got?.sourceId!==ref.sourceId||got.revision!==ref.revision)throw changed();
 }
 const docs=new Map();
 for(const ref of parsed.sourceRefs){
  checkAbort(signal);
  const src=(await repository.get(ownerId,'sources',ref.sourceId))?.value;
  if(!src||src.revision!==ref.revision||digest(src.reviewedPages)!==ref.revision)throw changed();
  docs.set(ref.sourceId,src);
 }
 const ids=new Set();let chars=0;
 for(const e of selected.evidence){
  const src=docs.get(e.sourceId),ref=parsed.sourceRefs.find(x=>x.sourceId===e.sourceId);
  if(!src||!ref||e.sourceRevision!==ref.revision||typeof e.id!=='string'||!e.id.startsWith(e.sourceId+'-'+ref.revision.slice(0,12)+'-')||
     ids.has(e.id)||typeof e.quote!=='string'||!e.quote.length||!Number.isSafeInteger(e.start)||!Number.isSafeInteger(e.end)||
     e.start<0||e.end<=e.start||e.end-e.start!==e.quote.length||typeof e.locator!=='string'||
     !src.reviewedPages.some(p=>p.locator===e.locator&&p.text.slice(e.start,e.end)===e.quote))
    throw new TypeError('Selected citation has invalid source provenance.');
  ids.add(e.id);chars+=e.quote.length;
 }
 if(chars>12000||selected.selection.selectedCharacters!==chars)throw new TypeError('Multi-source evidence exceeds its character budget.');
 await assertOwnedSourceRefsCurrent({repository,ownerId,sourceRefs:parsed.sourceRefs,signal});
 const isCurrent=async()=>{
  try{await assertOwnedSourceRefsCurrent({repository,ownerId,sourceRefs:parsed.sourceRefs,signal});return true;}
  catch(error){if(signal?.aborted)throw error;return false;}
 };
 const assertCurrent=()=>assertOwnedSourceRefsCurrent({repository,ownerId,sourceRefs:parsed.sourceRefs,signal});
 return {request:parsed,evidence:selected.evidence,selection:selected.selection,
  sourceRefs:parsed.sourceRefs,bundleRevision:parsed.bundleRevision,isCurrent,assertCurrent};
}

/** Cloud adapter for coordinator-approved future route integration; no route is mounted here. */
export async function generateOwnedLessonBundle({repository,ownerId,request,gateway,curation,signal,retrieve}){
 const bundle=await prepareOwnedLessonBundle({repository,ownerId,request,signal,retrieve});
 if(bundle.request.mode==='local')return {kind:'local-selection',bundle};
 if(!gateway||typeof gateway.run!=='function')throw new TypeError('Configured model gateway required.');
 checkAbort(signal);
 const parsed=bundle.request;
 const result=await gateway.run({uid:ownerId,requestId:parsed.requestId,revision:parsed.bundleRevision,
  provider:parsed.provider,consent:parsed.providerConsent,fallback:parsed.fallback,signal,
  payload:{task:'lesson',goal:parsed.goal,evidence:bundle.evidence,curation,sourceRefs:parsed.sourceRefs,bundleRevision:parsed.bundleRevision},
  validate:raw=>validateLesson(raw,bundle.evidence),isCurrent:bundle.isCurrent});
 checkAbort(signal);
 await bundle.assertCurrent();
 return {kind:'cloud-lesson',bundle,value:result.value,provider:result.provider,model:result.model};
}
