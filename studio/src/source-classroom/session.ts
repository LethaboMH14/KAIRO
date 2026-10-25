import type {Evidence,Lesson,Source} from '../workspace/types';

export class ReviewedLessonError extends Error{code:string;constructor(code:string,message:string){super(message);this.code=code;this.name='ReviewedLessonError';}}
const ID=/^[a-f0-9]{24}$/;
function validId(value:string){if(!ID.test(value))throw new Error('Choose a saved lesson from My material.');return value;}
export function chapterIndex(value:number,count:number){return Number.isInteger(value)&&count>0?Math.max(0,Math.min(count-1,value)):0;}
export function chapterEvidence(lesson:Lesson,index:number):Evidence[]{
 const chapter=lesson.chapters[chapterIndex(index,lesson.chapters.length)];
 return chapter?chapter.citationIds.map(id=>lesson.evidence.find(e=>e.id===id)!).filter(Boolean):[];
}
export function classroomHref(id:string,step=0){return `/classroom?lesson=${validId(id)}&step=${Number.isSafeInteger(step)&&step>=0?step:0}`;}
type Loader=(path:string,signal:AbortSignal)=>Promise<unknown>;
function checkCancelled(signal:AbortSignal){signal.throwIfAborted();}
export async function loadReviewedLesson(id:string,load:Loader,signal:AbortSignal):Promise<Lesson>{
 validId(id);checkCancelled(signal);
 const lesson=await load(`/lesson/${id}`,signal) as Lesson;checkCancelled(signal);
 if(!lesson||lesson.id!==id||!ID.test(lesson.sourceId)||!lesson.revision||typeof lesson.title!=='string'||!Array.isArray(lesson.chapters)||!lesson.chapters.length||!Array.isArray(lesson.evidence))throw new Error('This lesson is incomplete. Return to My material and prepare it again.');
 let source=await load(`/source/${lesson.sourceId}`,signal) as Source;checkCancelled(signal);
 if(source?.revision!==lesson.revision&&/^[a-f0-9]{64}$/.test(lesson.revision)){
  try{source=await load(`/source/${lesson.sourceId}/revisions/${lesson.revision}`,signal) as Source;checkCancelled(signal);}catch(error){checkCancelled(signal);throw new ReviewedLessonError('source-changed','This older source revision is unavailable. Your previous lesson was kept; return to My material to use the current reviewed text.');}
 }
 if(!source||source.id!==lesson.sourceId||!source.reviewed||source.revision!==lesson.revision||!Array.isArray(source.reviewedPages))throw new ReviewedLessonError('source-changed','The source has changed or needs review. Return to My material and create a lesson from the current reviewed text.');
 const known=new Set<string>();
 for(const e of lesson.evidence){
  if(!e||typeof e.id!=='string'||known.has(e.id)||e.sourceId!==source.id||typeof e.quote!=='string'||!e.quote.trim()||!Number.isInteger(e.start)||!Number.isInteger(e.end)||e.start<0||e.end-e.start!==e.quote.length||!source.reviewedPages.some(p=>p.locator===e.locator&&p.text.slice(e.start,e.end)===e.quote))throw new Error('A source citation could not be checked. Return to My material to prepare this lesson again.');
  known.add(e.id);
 }
 if(lesson.chapters.some(c=>!c||typeof c.title!=='string'||typeof c.explanation!=='string'||!c.explanation.trim()||typeof c.example!=='string'||!Array.isArray(c.citationIds)||!c.citationIds.length||c.citationIds.some(id=>!known.has(id))))throw new Error('This chapter is missing its source citation. Return to My material to prepare this lesson again.');
 return lesson;
}
