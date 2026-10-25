import LessonStartPanel from '../lesson-start-ui/LessonStartPanel';
import type {Lesson} from '../workspace/types';
import type {ResumeResult} from '../classroom-resume/model';
import type {SourceContext} from '../lesson-plan-quality/model';
import {prepareEntry} from './model';

export default function LessonEntry({lesson,sourceContext,resume,savedLocally,onStop,onEnter,onReviewSource}:{lesson:Lesson;sourceContext:SourceContext;resume:ResumeResult|null;savedLocally:boolean;onStop:()=>void;onEnter:(step:number)=>void;onReviewSource:()=>void}){
 const plan=prepareEntry(lesson,sourceContext,resume,savedLocally);
 function enter(step:number){if(plan.summary.sourceState!=='reviewed')return;onStop();onEnter(step);}
 return <section aria-label="Start your reviewed lesson">
  <LessonStartPanel summary={plan.summary} busy={false} onBeginReading={()=>enter(0)} onResume={plan.summary.savedStep===null?undefined:()=>enter(plan.summary.savedStep!)} onReviewSource={onReviewSource}/>
  <p className="ka-small">Start with the reading view. You can choose KAIRO in 3D after opening the lesson. Narration starts only when you ask.</p>
  {plan.warnings.length>0&&<details><summary>What to check in this lesson</summary><ul>{plan.warnings.map((warning,i)=><li key={i}>{warning}</li>)}</ul></details>}
 </section>;
}
