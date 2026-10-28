import type {Lesson} from '../workspace/types';
import type {Progress} from '../workspace/learning';
import {buildConfirmedReasoning,type ConfirmedReasoning} from '../learner-reasoning-ui/reasoning';
export function questionKey(lesson:Lesson,index:number){return `${lesson.id}:${lesson.revision}:question-${index}`;}
export function recordClassroomAnswer(lesson:Lesson,progress:Progress,index:number,choiceId:string,explanation:ConfirmedReasoning|null,at:string):Progress{
 const question=lesson.quiz[index];
 if(!question||!Number.isInteger(index)||!/^option-\d+$/.test(choiceId))throw new Error('Choose an answer for the current question.');
 const choice=Number(choiceId.slice(7));
 if(!Number.isInteger(choice)||choice<0||choice>=question.options.length)throw new Error('Choose one of the current answers.');
 if(!Number.isFinite(Date.parse(at))||new Date(at).toISOString()!==at)throw new Error('The practice time could not be checked.');
 let notes=progress.notes;
 if(explanation){
  const checked=buildConfirmedReasoning(explanation);
  if(!checked||checked.questionId!==questionKey(lesson,index)||checked.selectedOptionId!==choiceId)throw new Error('The explanation no longer matches this question. Check it again.');
  const entry=`\n\n### My explanation · question ${index+1}\n${question.question}\nChosen answer: ${question.options[choice]}\n${checked.text}\nMethod: ${checked.method}. Self-reported confidence: ${checked.confidence===null?'not given':checked.confidence+'%'}.\nConfirmed: ${at}\nReviewed source revision: ${lesson.revision}\nSources: ${question.citationIds.join(', ')}\nLearner-written practice; not a verified skill score.`;
  if(notes.length+entry.length>8000)throw new Error('Your notes are full. Download or shorten them in Keep my work, then confirm this explanation again. Your text has not been shortened.');
  notes+=entry;
 }
 return {...progress,notes,attempts:[...progress.attempts,{question:index,choice,correct:choice===question.correct,at}].slice(-100)};
}
