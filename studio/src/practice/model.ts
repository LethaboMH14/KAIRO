import type {Lesson} from '../workspace/types';
import type {CaseEvent,CaseRecord} from '../profile/model';
export const VERSION='corner-shop-v1';
export const records={
 shelf:{title:'Notebook shelf',text:'Physical count: 21 saleable notebooks. Counted at closing time. These are fictional scenario observations.'},
 delivery:{title:'Delivery note',text:'12 notebooks received today. Delivery checked and signed. Opening stock was 20 notebooks.'},
 sales:{title:'Sales register',text:'9 notebooks sold today. No returns recorded. Expected stock before damage adjustment: 20 + 12 − 9.'},
 damage:{title:'Damage book',text:'2 notebooks were water damaged and removed from the saleable shelf. The supervisor signed the entry, but the stock record has not yet been updated.'},
} as const;
export type EvidenceKey=keyof typeof records;
export type Phase='calculate'|'inspect'|'decide'|'reflect'|'complete';
export type CaseState={id:string;lessonId:string|null;phase:Phase;read:EvidenceKey[];events:CaseEvent[];expected:number|null;difference:number|null;cause:string|null;decision:string|null;reflection:string;completedAt:string|null;feedback:string};
export type Action={type:'inspect';key:EvidenceKey}|{type:'calculate';value:number}|{type:'reconcile';difference:number;cause:string}|{type:'decide';value:string}|{type:'reflect';value:string};
export function supportsStockCase(lesson:Lesson){const content=lesson.evidence.map(e=>e.quote).join(' ').toLowerCase();return ['closing stock','deliver','sales','physical count'].every(t=>content.includes(t));}
export function initialCase(id:string,lessonId:string|null):CaseState{return {id,lessonId,phase:'calculate',read:[],events:[],expected:null,difference:null,cause:null,decision:null,reflection:'',completedAt:null,feedback:''};}
export function transition(state:CaseState,action:Action,at=new Date().toISOString()):CaseState{
 if(state.phase==='complete'||state.events.length>=190)return state;
 const event=(kind:string,value:string,correct?:boolean):CaseEvent=>({kind,value,correct,at});
 if(action.type==='inspect'){
  if(!Object.hasOwn(records,action.key)||state.read.includes(action.key))return state;
  return {...state,read:[...state.read,action.key],events:[...state.events,event('Inspected record',records[action.key].title)],feedback:''};
 }
 if(action.type==='calculate'&&state.phase==='calculate'){
  if(!Number.isFinite(action.value))return {...state,feedback:'Enter a number for expected closing stock.'};
  const correct=action.value===23;
  return {...state,expected:action.value,phase:correct?'inspect':'calculate',events:[...state.events,event('Expected stock',String(action.value),correct)],feedback:correct?'23 expected notebooks. Now compare the shelf with the records.':'Deliveries add to opening stock; sales subtract. Try 20 + 12 − 9.'};
 }
 if(action.type==='reconcile'&&state.phase==='inspect'){
  if(!Object.keys(records).every(k=>state.read.includes(k as EvidenceKey)))return {...state,feedback:'Inspect the shelf, delivery note, sales register and damage book before concluding.'};
  if(!Number.isFinite(action.difference)||!['damage','theft','delivery','unknown'].includes(action.cause))return {...state,feedback:'Enter the difference and choose the record that explains it.'};
  const correct=action.difference===2&&action.cause==='damage';
  return {...state,difference:action.difference,cause:action.cause,phase:correct?'decide':'inspect',events:[...state.events,event('Reconciliation',`Difference ${action.difference}; explanation ${action.cause}`,correct)],feedback:correct?'The signed damage entry explains the 2-unit difference. The physical count alone did not establish the cause.':'Compare 23 expected with 21 on the shelf. Which signed record accounts for the two missing saleable units?'};
 }
 if(action.type==='decide'&&state.phase==='decide'){
  if(!['record','accuse','ignore'].includes(action.value))return state;
  const correct=action.value==='record';
  const feedback=correct?'The stock record can be reconciled using the signed damage entry. Saleable stock is 21; the two damaged units are accounted for.':'accuse'===action.value?'An accusation is not supported by the evidence. The signed damage entry already accounts for the difference. Reconsider the action.':'Leaving it unresolved keeps the stock record inaccurate and could mislead the next shift. Reconsider the action.';
  return {...state,decision:action.value,phase:correct?'reflect':'decide',events:[...state.events,event('Workplace decision',action.value,correct)],feedback};
 }
 if(action.type==='reflect'&&state.phase==='reflect'){
  const reflection=action.value.trim();if(reflection.length<30||reflection.length>1000)return {...state,feedback:'Add 30–1,000 characters explaining the evidence behind your decision.'};
  return {...state,reflection,phase:'complete',completedAt:at,events:[...state.events,event('Reflection saved',reflection.slice(0,500))],feedback:'Case completed. Your decisions, retries and reflection are included in the practice record.'};
 }
 return state;
}
export function caseRecord(s:CaseState):CaseRecord{return {id:s.id,lessonId:s.lessonId,title:'Closing time at Nandi’s shop',version:VERSION,events:s.events,completedAt:s.completedAt,reflection:s.reflection};}
export function rubric(s:CaseState){return [['Expected stock','Expected stock'],['Reconciliation','Reconciliation'],['Workplace decision','Workplace decision']].map(([label,kind])=>{const attempts=s.events.filter(e=>e.kind===kind);return {label,attempts:attempts.length,firstTry:attempts[0]?.correct===true,met:attempts.at(-1)?.correct===true};});}
