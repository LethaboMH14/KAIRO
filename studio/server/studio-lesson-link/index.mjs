// Read-only owner-scoped v1 lesson → local pump draft association.
// Does NOT authenticate the client-generated attempt, replay its actions,
// persist evidence, or certify competence. Route handlers must supply a
// trusted server-side identity, never a uid copied from request JSON.
import {hash} from '../workspace/model.mjs';

const ID=/^[a-f0-9]{24}$/;
const SHA=/^[a-f0-9]{64}$/;
const FNV=/^[a-f0-9]{8}$/;
const CASE=/^[a-z][a-z0-9-]{1,79}$/;
const PUMP_SCHEMA='kairo-evidence-item/pump-lab-draft-1';

export class StudioLessonLinkError extends Error {
  constructor(status,code){super('The saved lesson or reviewed source cannot be linked to this local practice.');this.name='StudioLessonLinkError';this.status=status;this.code=code;}
}
const deny=(status,code)=>{throw new StudioLessonLinkError(status,code);};
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const hasPages=value=>Array.isArray(value)&&value.length>0&&value.length<=100&&value.every(page=>object(page)&&typeof page.text==='string'&&page.text.length>0&&page.text.length<=16000);
const sourceMatches=(value,id,revision)=>object(value)&&value.id===id&&value.revision===revision&&value.reviewed===true&&hasPages(value.reviewedPages)&&hash(value.reviewedPages)===revision;

/**
 * Confirm that a client-generated local pump draft refers to a real, current
 * saved lesson and immutable reviewed source in the authenticated owner's
 * repository. It is NOT a replay/audit/credential check. No writes or network
 * calls beyond the provided repository's owner-scoped get() method.
 *
 * @param {{repository:{get:Function}, ownerId:string, lessonId:string, draft:object}} args
 * @returns {Promise<object>} Privacy-minimal, unverified association only.
 */
export async function linkPumpDraftToOwnedLesson({repository,ownerId,lessonId,draft}={}){
  if(!repository||typeof repository.get!=='function'||typeof ownerId!=='string'||!ownerId.trim()||ownerId.length>128||/[\u0000-\u001f\u007f]/.test(ownerId))
    deny(400,'trusted-owner-required');
  if(typeof lessonId!=='string'||!ID.test(lessonId))deny(400,'invalid-lesson-id');
  if(!object(draft)||draft.schema!==PUMP_SCHEMA||draft.studio!=='pump-lab'||
     typeof draft.caseId!=='string'||!CASE.test(draft.caseId)||
     draft.provenance?.simulated!==true||
     typeof draft.provenance?.modelVersion!=='string'||draft.provenance.modelVersion.length>100||!draft.provenance.modelVersion||
     typeof draft.provenance?.sessionId!=='string'||!draft.provenance.sessionId.trim()||draft.provenance.sessionId.length>100||
     !FNV.test(draft.provenance?.actionLogHash)||
     draft.events?.competencyExternallyVerified!==false||
     draft.feedbackSource!=='deterministic-rule-based'||
     draft.reviewStatus!=='not reviewed by a domain expert')
    deny(400,'invalid-local-pump-draft');
  const lessonRecord=await repository.get(ownerId,'lessons',lessonId);
  const lesson=lessonRecord?.value;
  // No silent fallback to v2 multi-source preview or an arbitrary URL claim.
  if(!object(lesson)||lesson.id!==lessonId)deny(404,'owned-lesson-not-found');
  if(Array.isArray(lesson.sourceRefs)||!ID.test(lesson.sourceId)||!SHA.test(lesson.revision))
    deny(409,'unsupported-lesson-contract');
  const sourceId=lesson.sourceId,revision=lesson.revision;
  const sourceRecord=await repository.get(ownerId,'sources',sourceId);
  if(!sourceMatches(sourceRecord?.value,sourceId,revision))deny(409,'source-not-current');
  const savedRevision=await repository.get(ownerId,'revisions',sourceId+'_'+revision);
  if(!sourceMatches(savedRevision?.value,sourceId,revision))deny(409,'reviewed-revision-missing');
  // Detect a source changing while the immutable revision was being checked.
  const fresh=await repository.get(ownerId,'sources',sourceId);
  if(!sourceMatches(fresh?.value,sourceId,revision))deny(409,'source-changed-during-check');
  return Object.freeze({
    schema:'kairo-studio-lesson-link/1',
    studio:'pump-lab',
    caseId:draft.caseId,
    originLessonId:lessonId,
    sourceRef:Object.freeze({sourceId,revision}),
    association:'owner-scoped-current-reviewed-v1-lesson',
    attemptStatus:'local-unverified',
    replayVerified:false,
    identityOfAttemptVerified:false,
    competencyExternallyVerified:false,
    canSaveVerifiedEvidence:false,
    nextRequired:'independent server action replay, owner-authenticated evidence write, and consent/revision recheck',
  });
}
