import {synchronousSpeed,SUPPORTED_POLES} from '../engineering/fieldMath.ts';
export const DIRECTOR_VERSION=1 as const;
export const CUES=['INTRO','EXPLAIN','DEMONSTRATE','PAUSE_FOR_PREDICTION','REVEAL_FEEDBACK','SECOND_ATTEMPT','COMPLETE'] as const;
export type CueId=typeof CUES[number];
export type SourceRef={id:string;url:string;locator:string;checkedAt:string;licenseStatus:string};
export type Cue={id:CueId;version:1;sourceRefIds:string[];boardAction:string;transcript:string;narration:string;requiresLearnerAction:boolean};
export type DirectorLesson={id:string;title:string;objective:string;sourceFingerprint:string;sourceRefs:SourceRef[];cues:Cue[];answerKey:{version:1;first:{frequencyHz:50;poles:4;correct:'1500'};second:{frequencyHz:60;poles:4;correct:'1800'}}};
export type Answer='1500'|'1800'|'3000'|'unknown';
export const ANSWERS:Answer[]=['1500','1800','3000','unknown'];
export type DirectorState={version:1;lessonId:string;sourceFingerprint:string;cue:CueId;frequencyHz:number;poles:number;first:Answer|null;second:Answer|null;paused:boolean;stopped:boolean;epoch:number};
export type Action={type:'NEXT'|'BACK'|'PAUSE'|'RESUME'|'STOP'|'REPLAY'|'RESET'}|{type:'JUMP_BACK';cue:CueId}|{type:'DEMO';frequencyHz:number;poles:number}|{type:'SUBMIT';answer:Answer;expectedEpoch:number};
export const fieldSpeed=synchronousSpeed;
export const allowedPoles=SUPPORTED_POLES;
export function initialState(lesson:DirectorLesson):DirectorState{return {version:1,lessonId:lesson.id,sourceFingerprint:lesson.sourceFingerprint,cue:'INTRO',frequencyHz:50,poles:4,first:null,second:null,paused:false,stopped:false,epoch:0};}
export function assertLesson(l:DirectorLesson){
 if(!l||!l.id||!l.sourceFingerprint||l.answerKey?.version!==1||l.cues?.length!==CUES.length)throw Error('Unsupported lecture version.');
 const ids=new Set(l.sourceRefs.map(s=>s.id));
 if(ids.size!==l.sourceRefs.length||l.sourceRefs.some(s=>!s.id||!s.url.startsWith('https://')||!s.locator||!s.checkedAt))throw Error('Invalid citation reference.');
 if(l.cues.some((c,i)=>c.id!==CUES[i]||c.version!==1||!c.transcript||!c.boardAction||!c.sourceRefIds.length||c.sourceRefIds.some(id=>!ids.has(id))))throw Error('Lecture cue/source mismatch.');
 for(const k of ['first','second'] as const){const a=l.answerKey[k],n=synchronousSpeed(a.frequencyHz,a.poles);if(!n.ok||String(n.rpm)!==a.correct)throw Error('Lecture answer key disagrees with validated model.');}
}
export function reduceDirector(s:DirectorState,a:Action,l:DirectorLesson):DirectorState{
 assertLesson(l);
 if(s.version!==1||s.lessonId!==l.id||s.sourceFingerprint!==l.sourceFingerprint)throw Error('Source revision changed: restart the approved lesson.');
 if(a.type==='RESET')return {...initialState(l),epoch:s.epoch+1};
 if(a.type==='STOP')return {...s,stopped:true,paused:true,epoch:s.epoch+1};
 if(a.type==='RESUME')return {...s,stopped:false,paused:false,epoch:s.epoch+1};
 if(s.stopped)return s;
 if(a.type==='PAUSE')return {...s,paused:true,epoch:s.epoch+1};
 if(a.type==='REPLAY')return {...s,paused:false,epoch:s.epoch+1};
 if(a.type==='DEMO'){
  if(s.cue!=='DEMONSTRATE'||s.paused||!synchronousSpeed(a.frequencyHz,a.poles).ok)return s;
  return {...s,frequencyHz:a.frequencyHz,poles:a.poles,epoch:s.epoch+1};
 }
 if(a.type==='SUBMIT'){
  if(s.paused||s.epoch!==a.expectedEpoch||!ANSWERS.includes(a.answer))return s;
  if(s.cue==='PAUSE_FOR_PREDICTION'&&s.first===null)return {...s,first:a.answer,cue:'REVEAL_FEEDBACK',epoch:s.epoch+1};
  if(s.cue==='SECOND_ATTEMPT'&&s.second===null)return {...s,second:a.answer,cue:'COMPLETE',epoch:s.epoch+1};
  return s;
 }
 if(s.paused)return s;
 if(a.type==='BACK'||a.type==='JUMP_BACK'){
  const index=a.type==='BACK'?Math.max(0,CUES.indexOf(s.cue)-1):CUES.indexOf(a.cue);
  if(index<0||index>CUES.indexOf(s.cue))return s;
  return {...s,cue:CUES[index],epoch:s.epoch+1};
 }
 if(a.type==='NEXT'){
  if(['PAUSE_FOR_PREDICTION','SECOND_ATTEMPT','COMPLETE'].includes(s.cue))return s;
  const n=CUES[CUES.indexOf(s.cue)+1];
  if(!n)return s;
  return {...s,cue:n==='PAUSE_FOR_PREDICTION'&&s.first!==null?'REVEAL_FEEDBACK':n,epoch:s.epoch+1};
 }
 return s;
}
export function correctFor(s:DirectorState,k:'first'|'second',l:DirectorLesson){return s[k]===null?null:s[k]===l.answerKey[k].correct;}
export function focusAfter(from:DirectorState,to:DirectorState):'feedback'|'question'|'none'{
 if(from.cue===to.cue)return 'none';
 if(['REVEAL_FEEDBACK','COMPLETE'].includes(to.cue))return 'feedback';
 if(['PAUSE_FOR_PREDICTION','SECOND_ATTEMPT'].includes(to.cue))return 'question';
 return 'none';
}
export function serialize(s:DirectorState,l:DirectorLesson){
 assertLesson(l);if(s.lessonId!==l.id||s.sourceFingerprint!==l.sourceFingerprint)throw Error('Mismatched lesson.');
 return JSON.stringify({kind:'kairo-director-local-progress',schemaVersion:1,...s,assistance:'guided-practice-not-independent-mastery'},null,2);
}
export function restore(raw:string|null,l:DirectorLesson):DirectorState{
 assertLesson(l);const fresh=initialState(l);
 if(!raw||raw.length>4096)return fresh;
 try{
  const x=JSON.parse(raw) as Record<string,unknown>;
  if(x.version!==1||x.lessonId!==l.id||x.sourceFingerprint!==l.sourceFingerprint||!CUES.includes(x.cue as CueId)||
   !Number.isSafeInteger(x.epoch)||Number(x.epoch)<0||typeof x.paused!=='boolean'||typeof x.stopped!=='boolean'||
   (x.first!==null&&!ANSWERS.includes(x.first as Answer))||(x.second!==null&&!ANSWERS.includes(x.second as Answer))||
   !synchronousSpeed(Number(x.frequencyHz),Number(x.poles)).ok)return fresh;
  if((['REVEAL_FEEDBACK','SECOND_ATTEMPT','COMPLETE'].includes(String(x.cue))&&x.first===null)||(x.cue==='COMPLETE'&&x.second===null)||(x.second!==null&&x.first===null))return fresh;
  return {...fresh,cue:x.cue as CueId,frequencyHz:Number(x.frequencyHz),poles:Number(x.poles),first:x.first as Answer|null,second:x.second as Answer|null,epoch:Number(x.epoch)+1,paused:true};
 }catch{return fresh;}
}
