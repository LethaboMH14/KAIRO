import LessonStartPanel from '../lesson-start-ui/LessonStartPanel';
import type {ComponentProps} from 'react';
import LessonReadinessPanel,{isLessonStartAllowed} from '../lesson-readiness-ui/LessonReadinessPanel';
import type {Lesson} from '../workspace/types';
import type {ResumeResult} from '../classroom-resume/model';
import type {SourceContext} from '../lesson-plan-quality/model';
import {prepareEntry} from './model';

function EntryReadiness({lesson,summary,busy,onBeginReading,onResume,onReviewSource}:ComponentProps<typeof LessonStartPanel>&{lesson:Lesson}){
 const preview={title:lesson.title,objective:lesson.objective,steps:lesson.chapters.map((chapter,index)=>({id:`chapter-${index}`,title:chapter.title,citationIds:chapter.citationIds})),sources:lesson.evidence.map(item=>({id:item.id,title:item.title,locator:item.locator})),sourceState:summary.sourceState,coverageWarnings:[...summary.notices,lesson.coverage],mode:'reading' as const,busy};
 const ready=isLessonStartAllowed(preview);
 return <><LessonReadinessPanel {...preview} error={null} onStart={onBeginReading} onEdit={()=>{location.assign(`/lesson-editor?lesson=${lesson.parentLessonId||lesson.id}`);}} onRetry={onReviewSource}/>
 <p className="ka-small">{summary.chapterCount} chapters · {summary.questionCount} checks. {ready?'Begin reading when you are ready.':summary.sourceState==='changed'?'Review the current source before starting.':'Check the lesson and its sources before starting.'} {summary.saving==='device'?'Progress can be saved on this device.':'Your place stays in this session only unless saving is available.'}</p>
 {onResume&&<button type="button" className="kx-primary" disabled={!ready} onClick={()=>{if(ready)onResume();}}>Resume lesson</button>}</>;
}

export default function LessonEntry({lesson,sourceContext,resume,savedLocally,onStop,onEnter,onReviewSource}:{lesson:Lesson;sourceContext:SourceContext;resume:ResumeResult|null;savedLocally:boolean;onStop:()=>void;onEnter:(step:number)=>void;onReviewSource:()=>void}){
 const plan=prepareEntry(lesson,sourceContext,resume,savedLocally);
 function enter(step:number){if(plan.summary.sourceState!=='reviewed'||!isLessonStartAllowed({sourceState:plan.summary.sourceState,busy:false,steps:lesson.chapters.map((c,i)=>({id:String(i),title:c.title,citationIds:c.citationIds})),sources:lesson.evidence.map(e=>({id:e.id,title:e.title,locator:e.locator}))}))return;onStop();onEnter(step);}
 return <section aria-label="Start your reviewed lesson">
  <EntryReadiness lesson={lesson} summary={plan.summary} busy={false} onBeginReading={()=>enter(0)} onResume={plan.summary.savedStep===null?undefined:()=>enter(plan.summary.savedStep!)} onReviewSource={onReviewSource}/>
  <p className="ka-small">Start with the reading view. You can choose KAIRO in 3D after opening the lesson. Narration starts only when you ask.</p>
  {plan.warnings.length>0&&<details><summary>What to check in this lesson</summary><ul>{plan.warnings.map((warning,i)=><li key={i}>{warning}</li>)}</ul></details>}
 </section>;
}
