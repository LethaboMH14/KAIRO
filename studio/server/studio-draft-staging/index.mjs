/**
 * Isolated, owner-scoped staging of UNVERIFIED local pump practice.
 * This is NOT a route, grade, credential, or a verified-evidence write.
 * A trusted server caller must authenticate ownerId, obtain explicit consent,
 * and provide a server-built replay+source preflight callback.
 */
import {createHash} from 'node:crypto';
import {hash} from '../workspace/model.mjs';

export const STAGED_SCHEMA='kairo-studio-staged-local-draft/1';
export const CONSENT_SCHEMA='kairo-studio-local-draft-consent/1';
const PREFLIGHT_SCHEMA='kairo-pump-integration-preflight/1';
const ID=/^[a-f0-9]{24}$/;
const SHA=/^[a-f0-9]{64}$/;
const CASE=/^[a-z][a-z0-9-]{1,79}$/;
const MODEL=/^[a-zA-Z0-9][a-zA-Z0-9/._-]{1,99}$/;
const isRecord=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 (Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
const safeOwner=x=>typeof x==='string'&&x.trim()&&x.length<=128&&!/[\u0000-\u001f\u007f]/.test(x);
const safeSession=x=>typeof x==='string'&&x.length>=8&&x.length<=100&&/^[a-zA-Z0-9_-]+$/.test(x);
const exact=(x,keys)=>isRecord(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
export class StudioDraftStagingError extends Error{
 constructor(status,code){super('Local practice could not be saved safely.');this.name='StudioDraftStagingError';this.status=status;this.code=code;}
}
const deny=(status,code)=>{throw new StudioDraftStagingError(status,code);};
function preflightIsSafe(x){
 return isRecord(x)&&x.schema===PREFLIGHT_SCHEMA&&x.status==='reviewable-local-draft-only'&&
 x.studio==='pump-lab'&&CASE.test(x.caseId||'')&&MODEL.test(x.modelVersion||'')&&
 exact(x.sourceRef,['sourceId','revision'])&&ID.test(x.sourceRef.sourceId)&&SHA.test(x.sourceRef.revision)&&
 SHA.test(x.actionLogSha256||'')&&Number.isSafeInteger(x.actionCount)&&x.actionCount>=2&&x.actionCount<=400&&
 typeof x.illustrativeCaseCompleted==='boolean'&&
 x.replayConsistent===true&&x.ownerSourceLinked===true&&
 x.identityOfAttemptVerified===false&&x.competencyExternallyVerified===false&&
 x.canSaveVerifiedEvidence===false&&x.publishable===false;
}
function sourceIsCurrent(source,id,revision){
 const x=source?.value;
 return isRecord(x)&&x.id===id&&x.revision===revision&&x.reviewed===true&&
 Array.isArray(x.reviewedPages)&&x.reviewedPages.length>0&&x.reviewedPages.length<=100&&
 x.reviewedPages.every(p=>isRecord(p)&&typeof p.text==='string'&&p.text.length<=16000)&&
 x.reviewedPages.some(p=>p.text.length>=80)&&
 x.reviewedPages.reduce((n,p)=>n+p.text.length,0)<=48000&&hash(x.reviewedPages)===revision;
}
async function currentLineage(repository,ownerId,lessonId,sourceId,revision){
 const lesson=(await repository.get(ownerId,'lessons',lessonId))?.value;
 if(!isRecord(lesson)||lesson.id!==lessonId||lesson.sourceId!==sourceId||
 lesson.revision!==revision||Array.isArray(lesson.sourceRefs))deny(409,'lesson-revision-changed');
 if(!sourceIsCurrent(await repository.get(ownerId,'sources',sourceId),sourceId,revision))deny(409,'source-not-current');
 if(!sourceIsCurrent(await repository.get(ownerId,'revisions',sourceId+'_'+revision),sourceId,revision))deny(409,'immutable-revision-missing');
 // Catch most cross-read races, without pretending this is a cross-record transaction.
 if(!sourceIsCurrent(await repository.get(ownerId,'sources',sourceId),sourceId,revision))deny(409,'source-changed-during-check');
}
function sameStable(a,b){
 return isRecord(a)&&Object.keys(b).every(k=>k==='consentAt'||Object.hasOwn(a,k))&&
 Object.keys(b).filter(k=>k!=='consentAt').every(k=>JSON.stringify(a[k])===JSON.stringify(b[k]))&&
 Object.keys(a).every(k=>Object.hasOwn(b,k));
}
/**
 * @param {{
 * repository:{get:Function,put:Function}, ownerId:string,lessonId:string,
 * expectedSessionId:string, consent:boolean, preflight:()=>Promise<object>,
 * clock?:()=>Date
 * }} input
 * The callback must be a trusted server-built composition of deterministic
 * replay and owner-scoped current-source validation; never use a JSON payload
 * supplied by a client as the preflight result.
 */
export async function stageLocalPumpDraft({repository,ownerId,lessonId,expectedSessionId,consent,preflight,clock=()=>new Date()}={}){
 if(!repository||typeof repository.get!=='function'||typeof repository.put!=='function'||
 !safeOwner(ownerId)||!ID.test(lessonId||'')||!safeSession(expectedSessionId)||typeof preflight!=='function'||typeof clock!=='function')
  deny(400,'trusted-server-context-required');
 if(consent!==true)deny(403,'explicit-consent-required');
 let checked;
 try{checked=await preflight();}
 catch{deny(409,'preflight-unavailable');}
 if(!preflightIsSafe(checked))deny(409,'preflight-not-reviewable');
 const {sourceId,revision}=checked.sourceRef;
 // Fail closed when source has changed after the original preflight.
 await currentLineage(repository,ownerId,lessonId,sourceId,revision);
 let consentAt;
 try{
  const value=clock();
  if(!(value instanceof Date)||!Number.isFinite(value.getTime()))throw new TypeError('Invalid clock');
  consentAt=value.toISOString();
 }catch{deny(503,'server-clock-unavailable');}
 // Owner + trusted session are used only for the opaque deterministic key.
 // Neither raw value is stored in the draft or returned to the browser.
 const key=createHash('sha256').update(JSON.stringify([
  STAGED_SCHEMA,ownerId,lessonId,expectedSessionId,sourceId,revision,checked.modelVersion,checked.actionLogSha256
 ])).digest('hex').slice(0,24);
 const value=Object.freeze({
  schema:STAGED_SCHEMA,status:'local-unverified',studio:'pump-lab',
  lessonId,sourceRef:{sourceId,revision},caseId:checked.caseId,
  modelVersion:checked.modelVersion,actionLogSha256:checked.actionLogSha256,
  actionCount:checked.actionCount,illustrativeCaseCompleted:checked.illustrativeCaseCompleted,
  consentSchema:CONSENT_SCHEMA,consentAt,
  replayConsistentAtPreflight:true,ownerSourceLinkedAtPreflight:true,
  identityOfAttemptVerified:false,competencyExternallyVerified:false,
  canSaveVerifiedEvidence:false,publishable:false,
 });
 let duplicate=false;
 try{await repository.put(ownerId,'drafts',key,value,{create:true});}
 catch(error){
  if(error?.status!==409)throw error;
  // Only an identical prior create is idempotent. Never overwrite a draft.
  const saved=await repository.get(ownerId,'drafts',key);
  if(!saved||!sameStable(saved.value,value))deny(409,'draft-id-conflict');
  duplicate=true;
 }
 return Object.freeze({
  draftId:key,status:'local-unverified',storedPrivately:true,
  duplicate,canSaveVerifiedEvidence:false,publishable:false,
  message:'Saved privately as an unverified practice draft. This is not a grade or proof of competency.',
 });
}
