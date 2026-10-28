import {loadReviewedLesson} from '../source-classroom/session.ts';

/** Only the authenticated API loader supplies records; scene values are separate context. */
export async function loadStudioLessonContext(id:string,load:(path:string,signal:AbortSignal)=>Promise<unknown>,signal:AbortSignal){
 const lesson=await loadReviewedLesson(id,load,signal);
 return {lessonId:lesson.id,title:lesson.title,revision:lesson.revision,citations:lesson.evidence.map(e=>({id:e.id,title:e.title,locator:e.locator}))};
}
