import type {Lesson} from '../workspace/types';
import type {Progress} from '../workspace/learning';
import type {ResumeResult} from '../classroom-resume/model';
import {buildLessonPlan,toLessonPlanInput,type SourceContext} from '../lesson-plan-quality/model';
import type {PracticeAttempt} from '../practice-milestone-ui/PracticeMilestoneCard';

/** sourceContext comes from the host's reviewed-source loader, never the lesson alone. */
export function prepareEntry(lesson:Lesson,sourceContext:SourceContext,resume:ResumeResult|null,savedLocally=false){
 const plan=buildLessonPlan(toLessonPlanInput(lesson),sourceContext);
 const cursor=resume?.status==='restored'&&Number.isInteger(resume.state.step)&&resume.state.step>=0&&resume.state.step<lesson.chapters.length?resume.state.step:null;
 // A decoded, matching device cursor is evidence that a place was persisted.
 const deviceSaveKnown=savedLocally||(cursor!==null&&plan.summary.sourceState==='reviewed');
 const notices=plan.summary.notices.filter(notice=>!notice.startsWith('Save availability is not checked here;'));
 return {...plan,summary:{...plan.summary,notices,savedStep:plan.summary.sourceState==='reviewed'?cursor:null,saving:deviceSaveKnown?'device' as const:'session-only' as const}};
}

/** Old attempts record no assistance exposure. Never infer independence from correctness. */
export function practiceRecord(lesson:Lesson,progress:Progress,question:number):PracticeAttempt|null{
 if(!Number.isInteger(question)||question<0||question>=lesson.quiz.length)return null;
 const attempt=progress.attempts.filter(a=>a.question===question).at(-1);
 if(!attempt)return null;
 return {id:`${lesson.id}:${question}:${attempt.at}`,topicLabel:lesson.quiz[question].question,sourceRevision:lesson.revision,outcome:attempt.correct?'correct':'needs-review',assistance:'unknown',recordedAt:attempt.at};
}
