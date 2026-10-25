/**
 * Persistable v2 lesson envelope. Never project a source bundle onto v1 sourceId.
 * Every consumer must revalidate the owner and all current immutable revisions.
 * A transactional review/delete race still requires store-side atomic fencing.
 */
import {parseLessonSelection,assertOwnedSourceRefsCurrent} from '../owner-retrieval/lesson-contract.mjs';
import {validateLesson} from '../workspace/model.mjs';

const ID=/^[a-f0-9]{24}$/;
const SHA=/^[a-f0-9]{64}$/;
const PROVIDERS=new Set(['google','groq','openrouter','aiml']);
const conflict=()=>Object.assign(new Error('A reviewed source changed. Reopen the selected material.'),{status:409});
const malformed=()=>new TypeError('This multi-source lesson record is invalid.');

function envelope(record){
  if(!record||typeof record!=='object'||Array.isArray(record)||record.schemaVersion!==2||
     !ID.test(record.id||'')||Object.hasOwn(record,'sourceId')||Object.hasOwn(record,'revision')||
     !['local-extractive-v2','cloud-v2'].includes(record.mode)||
     typeof record.createdAt!=='string'||record.createdAt.length>40||
     !Number.isFinite(Date.parse(record.createdAt))||
     !Array.isArray(record.evidence)||record.evidence.length<1||record.evidence.length>12||
     !SHA.test(record.bundleRevision||''))throw malformed();
  if(record.mode==='cloud-v2'){
    if(typeof record.provider!=='string'||!PROVIDERS.has(record.provider)||
       (Object.hasOwn(record,'model')&&(typeof record.model!=='string'||!record.model.trim()||record.model.length>160)))throw malformed();
  }else if(Object.hasOwn(record,'provider')||Object.hasOwn(record,'model'))throw malformed();
  const parsed=parseLessonSelection({sourceRefs:record.sourceRefs,mode:'local'});
  if(parsed.bundleRevision!==record.bundleRevision)throw malformed();
  const evidenceIds=new Set(),refs=new Map(parsed.sourceRefs.map(x=>[x.sourceId,x.revision]));
  let characters=0;
  for(const e of record.evidence){
    if(!e||typeof e!=='object'||Array.isArray(e)||typeof e.id!=='string'||e.id.length>150||
       evidenceIds.has(e.id)||typeof e.sourceId!=='string'||!refs.has(e.sourceId)||
       e.sourceRevision!==refs.get(e.sourceId)||typeof e.title!=='string'||e.title.length>120||
       typeof e.locator!=='string'||e.locator.length>500||typeof e.quote!=='string'||!e.quote.length||
       !Number.isSafeInteger(e.start)||!Number.isSafeInteger(e.end)||e.start<0||
       e.end<=e.start||e.end-e.start!==e.quote.length||typeof e.edited!=='boolean')throw malformed();
    evidenceIds.add(e.id);characters+=e.quote.length;
  }
  if(characters>12000)throw malformed();
  const normalized=validateLesson(record,record.evidence);
  return {parsed,normalized};
}

/** Construct a bounded lesson envelope from a previously verified v2 bundle. */
export function createLessonV2Record({bundle,content,id,createdAt=new Date().toISOString(),model=null}={}){
  if(!bundle||typeof bundle!=='object'||bundle.request?.schemaVersion!==2||
     !Array.isArray(bundle.evidence)||!Array.isArray(bundle.sourceRefs)||
     !['local','cloud'].includes(bundle.request.mode))throw malformed();
  const raw={
    schemaVersion:2,id,createdAt,
    mode:bundle.request.mode==='local'?'local-extractive-v2':'cloud-v2',
    sourceRefs:bundle.sourceRefs.map(x=>({sourceId:x.sourceId,revision:x.revision})),
    bundleRevision:bundle.bundleRevision,
    evidence:bundle.evidence.map(e=>({
      id:e.id,sourceId:e.sourceId,sourceRevision:e.sourceRevision,title:e.title,
      locator:e.locator,quote:e.quote,start:e.start,end:e.end,edited:e.edited===true,
    })),
    title:content?.title,objective:content?.objective,
    chapters:content?.chapters,quiz:content?.quiz,
    reviewWarning:'Selected excerpts are source-linked, not a verification of educational correctness.',
  };
  if(raw.mode==='cloud-v2'){
    let request;
    try{request=parseLessonSelection(bundle.request);}catch{throw malformed();}
    if(request.schemaVersion!==2||request.bundleRevision!==bundle.bundleRevision)throw malformed();
    if(typeof bundle.request.provider!=='string'||!PROVIDERS.has(bundle.request.provider)||bundle.request.consent!==true)throw malformed();
    raw.provider=bundle.request.provider;
    if(model!==null&&model!==undefined){if(typeof model!=='string'||!model.trim()||model.length>160)throw malformed();raw.model=model;}
  }else if(model!==null&&model!==undefined){
    throw malformed();
  }
  const {normalized}=envelope(raw);
  return {...raw,...normalized};
}

/** Validate every stored quote against the *current* owner source and archived review. */
export async function verifyLessonV2Record({repository,ownerId,record,signal}={}){
  const {parsed}=envelope(record);
  await assertOwnedSourceRefsCurrent({repository,ownerId,sourceRefs:parsed.sourceRefs,signal});
  const docs=new Map();
  for(const ref of parsed.sourceRefs){
    signal?.throwIfAborted();
    const source=(await repository.get(ownerId,'sources',ref.sourceId))?.value;
    if(!source||source.id!==ref.sourceId||source.revision!==ref.revision)throw conflict();
    docs.set(ref.sourceId,source);
  }
  for(const e of record.evidence){
    const source=docs.get(e.sourceId),revision=parsed.sourceRefs.find(r=>r.sourceId===e.sourceId)?.revision;
    const prefix=e.sourceId+'-'+revision.slice(0,12)+'-';
    const anchor=e.id.startsWith(prefix)
      ? /^S([1-9]\d*)-(0|[1-9]\d*)$/.exec(e.id.slice(prefix.length)):null;
    const page=anchor&&source?.reviewedPages?.[Number(anchor[1])-1];
    if(!page||e.start!==Number(anchor[2])||e.sourceRevision!==revision||
       e.title!==source.title||e.locator!==page.locator||
       e.edited!==(page.edited===true)||page.text.slice(e.start,e.end)!==e.quote)throw conflict();
  }
  await assertOwnedSourceRefsCurrent({repository,ownerId,sourceRefs:parsed.sourceRefs,signal});
  return true;
}

/**
 * Owner-partitioned write with a post-write revision fence. If re-review races
 * with the write, best-effort rollback is attempted and caller is failed closed.
 * Callers must validate again whenever reading a v2 record.
 */
export async function saveLessonV2Record({repository,ownerId,bundle,content,id,createdAt,signal,model}={}){
  if(!repository||typeof repository.put!=='function'||typeof repository.remove!=='function')throw malformed();
  const record=createLessonV2Record({bundle,content,id,createdAt,model});
  await verifyLessonV2Record({repository,ownerId,record,signal});
  signal?.throwIfAborted();
  const saved=await repository.put(ownerId,'lessons',record.id,record,{create:true});
  try{
    await verifyLessonV2Record({repository,ownerId,record,signal});
  }catch(error){
    try{await repository.remove(ownerId,'lessons',record.id,{version:saved.version});}catch{}
    throw error;
  }
  return {record,version:saved.version};
}
