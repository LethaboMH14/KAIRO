import {emptyProgress,type Progress} from '../workspace/learning.ts';
import type {Lesson} from '../workspace/types';

/** A failed restore must never authorize the lesson effects to overwrite saved work. */
export function restoreStudyProgress(raw:string|null,lesson:Pick<Lesson,'chapters'|'quiz'>):{progress:Progress;writable:boolean;message:string}{
 const blocked=()=>({progress:emptyProgress(),writable:false,message:'Saved lesson data could not be read safely and was left unchanged. New work stays in this session; download your notes before leaving.'});
 if(raw===null)return {progress:emptyProgress(),writable:true,message:''};
 if(raw.length>200_000)return blocked();
 try{
  const p=JSON.parse(raw);
  if(!p||typeof p!=='object'||Array.isArray(p)||!Number.isInteger(p.step)||p.step<0||p.step>=lesson.chapters.length||!Array.isArray(p.attempts)||p.attempts.length>1000||typeof p.notes!=='string'||p.notes.length>8000||!['example','passage'].includes(p.format))return blocked();
  for(const a of p.attempts){
   if(!a||!Number.isInteger(a.question)||a.question<0||a.question>=lesson.quiz.length||!Number.isInteger(a.choice)||a.choice<0||a.choice>=lesson.quiz[a.question].options.length||typeof a.correct!=='boolean'||a.correct!==(a.choice===lesson.quiz[a.question].correct)||typeof a.at!=='string'||a.at.length>40||!Number.isFinite(Date.parse(a.at))||new Date(a.at).toISOString()!==a.at)return blocked();
  }
  return {progress:{step:p.step,attempts:p.attempts.map((a:Progress['attempts'][number])=>({question:a.question,choice:a.choice,correct:a.correct,at:a.at})),notes:p.notes,format:p.format},writable:true,message:''};
 }catch{return blocked();}
}
