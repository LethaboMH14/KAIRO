import type {Lesson} from './types';
import {editedReadingMarkdown,projectEditedReading} from '../continuity/model.ts';
export type Attempt={question:number;choice:number;correct:boolean;at:string};
export type Progress={step:number;attempts:Attempt[];notes:string;format:'example'|'passage';};
export const emptyProgress=():Progress=>({step:0,attempts:[],notes:'',format:'example'});
export function adaptation(attempts:Attempt[],question:number){
 const relevant=attempts.filter(a=>a.question===question);
 if(relevant.at(-1)?.correct)return {kind:'ready',message:'You found the supported answer. Explain why another option fails, then try applying the idea.'};
 const wrong=relevant.filter(a=>!a.correct).length;
 if(wrong)return {kind:'support',message:`After ${wrong} incorrect attempt${wrong===1?'':'s'}, KAIRO has opened the supporting passage. Read it, then try the question again.`};
 return {kind:'start',message:'Choose an answer, then check the evidence behind it.'};
}
export function exportNotes(lesson:Lesson,progress:Progress){
 const reading=lesson.editorDocument
  ?editedReadingMarkdown(projectEditedReading(lesson.editorDocument,new Set(lesson.evidence.map(e=>e.id))))
  :lesson.chapters.map((c,i)=>`## ${i+1}. ${c.title}\n\n${c.explanation}\n\nExample / reflection: ${c.example}\n\nSources: ${c.citationIds.join(', ')}`).join('\n\n');
 return `# ${lesson.title}\n\n${lesson.objective}\n\nCreated: ${lesson.createdAt}\nMode: ${lesson.mode}${lesson.model?` (${lesson.model})`:''}\nSource revision: ${lesson.revision}\n\n${reading}\n\n## My notes\n\n${progress.notes||'No personal notes added.'}\n\n## Practice record\n\n${progress.attempts.map(a=>`- ${a.at}: Question ${a.question+1}, option ${a.choice+1}, ${a.correct?'supported answer':'try again'}`).join('\n')||'No attempts yet.'}\n\nSelf-directed study record; not an accredited certificate or verified workplace competence.\n\n## Source passages\n\n${lesson.evidence.map(e=>`### ${e.id}: ${e.title} — ${e.locator}${e.edited?' (learner-corrected text)':''}\n\n${e.quote}`).join('\n\n')}\n\n${lesson.coverage}\n${lesson.reviewWarning}\n`;
}
