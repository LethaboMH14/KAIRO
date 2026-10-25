export type Page = {text:string;locator:string;method:string;edited?:boolean};
export type Source = {id:string;title:string;pages:Page[];reviewedPages?:Page[];reviewed:boolean;revision?:string;limitNote:string;extraction?:import('../extraction-summary-ui/ExtractionSummary').ExtractionSummaryData;original?:{kind:"pdf"|"image"|"download";name:string}|null};
export type Evidence = {id:string;sourceId:string;title:string;locator:string;quote:string;start:number;end:number;edited:boolean};
export type Chapter = {title:string;explanation:string;example:string;citationIds:string[]};
export type Question = {question:string;options:string[];correct:number;explanation:string;citationIds:string[];supportQuote:string};
export type Lesson = {id:string;sourceId:string;sourceTitle:string;title:string;objective:string;chapters:Chapter[];quiz:Question[];evidence:Evidence[];mode:string;model:string|null;revision:string;createdAt:string;coverage:string;reviewWarning:string;curation?:{language:string;reason:string;approach:string;independentAttempts:number;roleGoal:string};provider?:string;retrieval?:{method:string};parentLessonId?:string;editorDocument?:import("../lesson-draft-core/types").LessonDraft};
export class WorkspaceError extends Error{status:number;constructor(message:string,status:number){super(message);this.status=status;}}
export async function api<T>(path:string,body?:unknown):Promise<T>{
 const response=await fetch(`/api/workspace${path}`,body===undefined?undefined:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const value=await response.json();if(!response.ok)throw new WorkspaceError(value.error||'This step could not finish. Try again.',response.status);return value;
}
