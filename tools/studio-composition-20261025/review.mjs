/**
 * Synthetic integration proof ONLY. This module is exercised after temporary
 * merging four draft PRs in read-only CI; it is not mounted as an API endpoint.
 * The ownerId must come from a trusted authenticated server context, never JSON.
 */
import {auditPumpDraft} from '../../studio/server/studio-evidence-replay/audit.mjs';
import {linkPumpDraftToOwnedLesson} from '../../studio/server/studio-lesson-link/index.mjs';

export const REVIEW_SCHEMA='kairo-pump-integration-preflight/1';
const isRecord=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const denied=code=>Object.freeze({
 schema:REVIEW_SCHEMA,status:'rejected',code,
 replayConsistent:false,ownerSourceLinked:false,
 identityOfAttemptVerified:false,competencyExternallyVerified:false,
 canSaveVerifiedEvidence:false,publishable:false,
});
export async function preflightLocalPumpEvidence({repository,ownerId,lessonId,snapshot,evidence,expectedSessionId}={}){
 if(!isRecord(evidence)||typeof expectedSessionId!=='string'||!expectedSessionId.trim()||
    evidence.provenance?.sessionId!==expectedSessionId)return denied('untrusted-session-binding');
 const replay=auditPumpDraft({snapshot,evidence,expectedSessionId});
 if(replay.replayConsistent!==true)return denied('replay-rejected');
 if(replay.actionCount<2||!Number.isSafeInteger(evidence.attempt?.predictions)||
    !Number.isSafeInteger(evidence.attempt?.readings)||evidence.attempt.predictions<1||
    evidence.attempt.readings<1)return denied('prediction-and-reading-required');
 // This owner/source gate performs read-only repository reads and a revision recheck.
 // Never copy the owner ID or learner answer/note into the output.
 let link;
 try{link=await linkPumpDraftToOwnedLesson({repository,ownerId,lessonId,draft:evidence});}
 catch{return denied('owned-lesson-or-source-unavailable');}
 if(link.caseId!==replay.caseId||link.caseId!==evidence.caseId||
    replay.modelVersion!==evidence.provenance?.modelVersion||
    link.originLessonId!==lessonId||link.attemptStatus!=='local-unverified'||
    link.canSaveVerifiedEvidence!==false||link.replayVerified!==false||
    link.identityOfAttemptVerified!==false||link.competencyExternallyVerified!==false||
    !isRecord(link.sourceRef)||typeof link.sourceRef.sourceId!=='string'||
    typeof link.sourceRef.revision!=='string')return denied('cross-contract-mismatch');
 return Object.freeze({
  schema:REVIEW_SCHEMA,status:'reviewable-local-draft-only',
  studio:'pump-lab',caseId:replay.caseId,
  sourceRef:Object.freeze({...link.sourceRef}),
  modelVersion:replay.modelVersion,
  actionLogSha256:replay.actionLogSha256,
  actionCount:replay.actionCount,
  illustrativeCaseCompleted:replay.illustrativeCaseCompleted,
  replayConsistent:true,ownerSourceLinked:true,
  identityOfAttemptVerified:false,competencyExternallyVerified:false,
  canSaveVerifiedEvidence:false,publishable:false,
  warning:'Read-only synthetic preflight; identity of the learner action, consent, durable write, real pump accuracy and competency are not verified.',
 });
}
