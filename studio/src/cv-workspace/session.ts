import {parseCvSessionFile,CV_SESSION_TRANSFER_LIMITS} from '../cv-session-transfer/index.ts';
import type {CvDraftInput} from '../cv-draft/model.ts';

export function createSessionImportReader(){
 let generation=0;
 return {
  invalidate(){generation++;},
  async read(file:{size:number;text:()=>Promise<string>}):Promise<{status:'ready';session:CvDraftInput}|{status:'stale'}>{
   const ticket=++generation;
   try{
    if(!Number.isSafeInteger(file.size)||file.size<0||file.size>CV_SESSION_TRANSFER_LIMITS.fileBytes)throw new Error('Choose a KAIRO session JSON file no larger than 128 KiB.');
    const raw=await file.text();
    if(ticket!==generation)return {status:'stale'};
    return {status:'ready',session:parseCvSessionFile(raw)};
   }catch(e){if(ticket!==generation)return {status:'stale'};throw e;}
  },
 };
}

/** File confirmations are historical data; every imported entry needs review again. */
export function sessionForFreshReview(session:CvDraftInput){
 return {facts:session.facts.map(f=>({...f,confirmation:'unconfirmed' as const})),target:session.targetRoleRequirements?.label||'',requirements:session.targetRoleRequirements?.requirements.join('\n')||''};
}
