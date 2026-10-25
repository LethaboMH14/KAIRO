import {learnerStorage} from '../account/storage.ts';
export const topics=['Business operations','Accounting','Management','Computer science','Other'] as const;
export type Topic=typeof topics[number];
export type Format='example'|'passage';
export type StudyRecord={lessonId:string;title:string;topic:Topic;format:Format;questions:number;attempts:{question:number;correct:boolean;at:string}[];updatedAt:string};
export type CaseEvent={kind:string;value:string;correct?:boolean;at:string};
export type CaseRecord={id:string;lessonId:string|null;title:string;version:string;events:CaseEvent[];completedAt:string|null;reflection:string};
export type Profile={version:1;lessons:StudyRecord[];cases:CaseRecord[]};
export const PROFILE_KEY='kairo-learning-profile-v1';
export const emptyProfile=():Profile=>({version:1,lessons:[],cases:[]});
const short=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max;
const nonempty=(v:unknown,max:number):v is string=>short(v,max)&&v.trim().length>0;
const stableId=(v:unknown,max:number):v is string=>nonempty(v,max)&&v===v.trim();
export function parseProfile(value:string|null):Profile{
 if(!value)return emptyProfile();const p=JSON.parse(value);
 if(p?.version!==1||!Array.isArray(p.lessons)||!Array.isArray(p.cases))throw new Error('Unsupported progress format.');
 return {version:1,lessons:p.lessons.filter((r:StudyRecord)=>r&&short(r.lessonId,100)&&short(r.title,200)&&topics.includes(r.topic)&&['example','passage'].includes(r.format)&&Number.isInteger(r.questions)&&r.questions>0&&r.questions<=10&&short(r.updatedAt,40)&&Array.isArray(r.attempts)&&r.attempts.every(a=>a&&Number.isInteger(a.question)&&a.question>=0&&a.question<r.questions&&typeof a.correct==='boolean'&&short(a.at,40))).slice(-50).map((r:StudyRecord)=>({...r,attempts:r.attempts.slice(-100)})),cases:p.cases.filter((r:CaseRecord)=>r&&short(r.id,100)&&short(r.title,200)&&short(r.version,80)&&(r.lessonId===null||short(r.lessonId,100))&&(r.completedAt===null||short(r.completedAt,40))&&short(r.reflection,3000)&&Array.isArray(r.events)&&r.events.every(e=>e&&short(e.kind,80)&&short(e.value,500)&&short(e.at,40)&&(e.correct===undefined||typeof e.correct==='boolean'))).slice(-20).map((r:CaseRecord)=>({...r,events:r.events.slice(-200)}))};
}
const MAX_PROFILE_CHARACTERS=1_000_000;
const MAX_LESSONS=50,MAX_CASES=20,MAX_ATTEMPTS=100,MAX_EVENTS=200;
function objectValue(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value);}
function denseArray(value:unknown[]):boolean{for(let index=0;index<value.length;index++)if(!Object.prototype.hasOwnProperty.call(value,index))return false;return true;}
function invalidProfile():never{throw new Error('Saved progress is malformed or exceeds supported limits. Its stored contents were left unchanged.');}
function projectProfileStrict(value:unknown):Profile{
 if(!objectValue(value)||value.version!==1||!Array.isArray(value.lessons)||!Array.isArray(value.cases)||value.lessons.length>MAX_LESSONS||value.cases.length>MAX_CASES||!denseArray(value.lessons)||!denseArray(value.cases))invalidProfile();
 const lessonIds=new Set<string>(),caseIds=new Set<string>();
 const lessons=value.lessons.map((candidate):StudyRecord=>{
  if(!objectValue(candidate)||!stableId(candidate.lessonId,100)||!short(candidate.title,200)||!topics.includes(candidate.topic as Topic)||typeof candidate.format!=='string'||!['example','passage'].includes(candidate.format)||!Number.isInteger(candidate.questions)||Number(candidate.questions)<1||Number(candidate.questions)>10||!short(candidate.updatedAt,40)||!Array.isArray(candidate.attempts)||candidate.attempts.length>MAX_ATTEMPTS||!denseArray(candidate.attempts)||lessonIds.has(candidate.lessonId))invalidProfile();
  lessonIds.add(candidate.lessonId);
  const attempts=candidate.attempts.map((attempt):StudyRecord['attempts'][number]=>{
   if(!objectValue(attempt)||!Number.isInteger(attempt.question)||Number(attempt.question)<0||Number(attempt.question)>=Number(candidate.questions)||typeof attempt.correct!=='boolean'||!short(attempt.at,40))invalidProfile();
   return {question:Number(attempt.question),correct:attempt.correct,at:attempt.at};
  });
  return {lessonId:candidate.lessonId,title:candidate.title,topic:candidate.topic as Topic,format:candidate.format as Format,questions:Number(candidate.questions),attempts,updatedAt:candidate.updatedAt};
 });
 const cases=value.cases.map((candidate):CaseRecord=>{
  if(!objectValue(candidate)||!stableId(candidate.id,100)||!stableId(candidate.version,80)||!short(candidate.title,200)||(candidate.lessonId!==null&&!stableId(candidate.lessonId,100))||!Array.isArray(candidate.events)||candidate.events.length>MAX_EVENTS||!denseArray(candidate.events)||(candidate.completedAt!==null&&!short(candidate.completedAt,40))||!short(candidate.reflection,3000)||caseIds.has(candidate.id))invalidProfile();
  caseIds.add(candidate.id);
  const events=candidate.events.map((event):CaseEvent=>{
   if(!objectValue(event)||!nonempty(event.kind,80)||!short(event.value,500)||!short(event.at,40)||(event.correct!==undefined&&typeof event.correct!=='boolean'))invalidProfile();
   return {kind:event.kind,value:event.value,at:event.at,...(event.correct===undefined?{}:{correct:event.correct})};
  });
  return {id:candidate.id,lessonId:candidate.lessonId as string|null,title:candidate.title,version:candidate.version,events,completedAt:candidate.completedAt as string|null,reflection:candidate.reflection};
 });
 return {version:1,lessons,cases};
}
/** Strict, non-lossy read parser for browser storage. Unknown fields are projected away; invalid or over-cap histories are refused whole. */
export function parseProfileStrict(raw:string|null):Profile{
 if(raw===null)return emptyProfile();
 if(typeof raw!=='string'||raw.length===0||raw.length>MAX_PROFILE_CHARACTERS)invalidProfile();
 let parsed:unknown;
 try{parsed=JSON.parse(raw);}catch{invalidProfile();}
 return projectProfileStrict(parsed);
}
/** Validates and projects only supported profile fields before persistence. */
export function projectProfileForWrite(value:unknown):Profile{return projectProfileStrict(value);}
export function readProfile():Profile{return parseProfileStrict(learnerStorage.getItem(PROFILE_KEY));}
export function saveStudy(profile:Profile,record:StudyRecord):Profile{return {...profile,lessons:[...profile.lessons.filter(r=>r.lessonId!==record.lessonId),record].slice(-50)};}
export function saveCase(profile:Profile,record:CaseRecord):Profile{return {...profile,cases:[...profile.cases.filter(r=>r.id!==record.id),record].slice(-20)};}
export function writeProfile(profile:Profile){const projected=projectProfileForWrite(profile);const serialized=JSON.stringify(projected);if(serialized.length>MAX_PROFILE_CHARACTERS)invalidProfile();learnerStorage.setItem(PROFILE_KEY,serialized);}
export function lessonMetrics(record:StudyRecord){
 let firstTry=0,supported=0,attempted=0;const needsPractice:number[]=[];
 for(let q=0;q<record.questions;q++){const attempts=record.attempts.filter(a=>a.question===q);if(!attempts.length)continue;attempted++;if(attempts[0].correct)firstTry++;if(attempts.at(-1)?.correct)supported++;else needsPractice.push(q);}
 return {firstTry,supported,attempted,needsPractice,retries:Math.max(0,record.attempts.length-attempted)};
}
export function recommend(profile:Profile,topic?:Topic){
 const records=profile.lessons.filter(r=>!topic||r.topic===topic).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
 const unresolved=records.find(r=>lessonMetrics(r).needsPractice.length);
 if(unresolved){const m=lessonMetrics(unresolved);return {kind:'review',title:'Return to the supporting passage',reason:`Your latest answer is still incorrect on ${m.needsPractice.length} question${m.needsPractice.length===1?'':'s'} in “${unresolved.title}”.`,lessonId:unresolved.lessonId,format:unresolved.format};}
 const untried=records.find(r=>lessonMetrics(r).attempted<r.questions);
 if(untried)return {kind:'practise',title:'Try the remaining practice',reason:`You have ${untried.questions-lessonMetrics(untried).attempted} unanswered question(s) in “${untried.title}”.`,lessonId:untried.lessonId,format:untried.format};
 const retried=records.find(r=>lessonMetrics(r).retries>0);
 if(retried)return {kind:'recall',title:'Try recalling the idea without hints',reason:`You reached a supported answer after retrying “${retried.title}”. Revisit it later to check whether the idea sticks.`,lessonId:retried.lessonId,format:retried.format};
 return {kind:'apply',title:records.length?'Put the idea into a case':'Start with one short lesson',reason:records.length?'Your recorded answers are currently supported. Try a practical case, then explain your decision.':'Study a source and attempt its questions to give your profile useful evidence.',lessonId:records[0]?.lessonId||null,format:records[0]?.format||'example'};
}
export function portfolioMarkdown(profile:Profile){
 return `# KAIRO personal practice portfolio\n\nExported ${new Date().toISOString()}\n\nBrowser-local, self-directed practice. Records can be edited on this device; no independent assessment or accreditation is implied.\n\n## Study history\n\n${profile.lessons.map(r=>{const m=lessonMetrics(r);return `### ${r.title}\n\nTopic: ${r.topic}\nChosen format: ${r.format}\nLesson ID: ${r.lessonId}\nFirst-try supported: ${m.firstTry}/${m.attempted}\nLatest supported: ${m.supported}/${r.questions}\nRetries: ${m.retries}\n`;}).join('\n')||'No study records yet.'}\n\n## Workplace cases\n\n${profile.cases.map(r=>`### ${r.title}\n\nRun: ${r.id}\nScenario: ${r.version}\nLinked lesson: ${r.lessonId||'Standalone authored case'}\nStatus: ${r.completedAt?'Completed':'In progress'}\nReflection: ${r.reflection||'Not added.'}\n\n${r.events.map(e=>`- ${e.at}: ${e.kind}: ${e.value}${e.correct===undefined?'':e.correct?' (met check)':' (retry needed)'}`).join('\n')}`).join('\n\n')||'No cases recorded yet.'}\n`;
}
