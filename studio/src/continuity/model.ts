import {learnerStorage} from '../account/storage.ts';
import type { Lesson } from '../workspace/types';
import type { DraftBlock } from '../lesson-draft-core/types';

export const DEVICE_KEY = 'kairo-device-continuity-v1';
export type EditedReadingBlock = {kind:DraftBlock['kind'];title:string;text:string;options?:string[];citationIds:string[]};
export type EditedReading = {layout:'reading'|'split'|'practice';blocks:EditedReadingBlock[]};
export type ReadingPack = { id:string; revision:string; title:string; objective:string; sourceTitle:string; savedAt:string; chapters:{title:string;explanation:string;example:string}[]; citations:{id?:string;locator:string;quote:string}[]; warning:string; notes:string; editedReading?:EditedReading };
export type DeviceMemory = { version:1; theme:'paper'|'sage'; goal:string; packs:ReadingPack[] };
export const emptyMemory = ():DeviceMemory => ({version:1,theme:'paper',goal:'',packs:[]});
const text=(value:unknown,max:number):value is string=>typeof value==='string'&&value.length<=max;
const id=(value:unknown):value is string=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(value);
const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const layouts=new Set(['reading','split','practice']);
const kinds=new Set(['explanation','worked-example','question','reflection']);

export function projectEditedReading(value:unknown,knownCitationIds?:Set<string>):EditedReading {
  if(!obj(value)||!layouts.has(value.layout as string)||!Array.isArray(value.blocks)||value.blocks.length>40)throw new Error('Edited reading could not be saved.');
  const rootKeys=new Set(['schemaVersion','lessonId','sourceId','sourceRevision','title','layout','blocks']);
  if(Object.keys(value).some(key=>!rootKeys.has(key)))throw new Error('Edited reading contains an unsupported field.');
  if(new TextEncoder().encode(JSON.stringify(value)).byteLength>128*1024)throw new Error('Edited reading is too large to save.');
  const blocks=value.blocks.map(raw=>{
    if(!obj(raw)||!kinds.has(raw.kind as string))throw new Error('Edited reading contains an unsupported block.');
    const blockKeys=new Set(['id','kind','title','text','citationIds','origin','question','options']);
    if(Object.keys(raw).some(key=>!blockKeys.has(key)))throw new Error('Edited block contains an unsupported field.');
    if(raw.id!==undefined&&(typeof raw.id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._:~-]{0,95}$/.test(raw.id)))throw new Error('Edited block ID is invalid.');
    if(raw.origin!==undefined&&!['source','generated','authored'].includes(raw.origin as string))throw new Error('Edited block origin is invalid.');
    if(!text(raw.title,120)||!raw.title.trim()||!text(raw.text,2400)||((raw.kind!=='reflection')&&!raw.text.trim()))throw new Error('Edited block text exceeds the saved reading limits.');
    if(!Array.isArray(raw.citationIds)||raw.citationIds.length>4||((raw.kind!=='reflection')&&raw.citationIds.length===0)||raw.citationIds.some(c=>typeof c!=='string'||c.length>100||!c.trim()||(knownCitationIds&&!knownCitationIds.has(c))))throw new Error('Edited block has invalid source references.');
    let options:string[]|undefined;
    if(raw.kind==='question'){
      if(raw.question!==undefined&&raw.options!==undefined)throw new Error('Edited question options are ambiguous.');
      if(raw.question!==undefined){
        if(!obj(raw.question)||Object.keys(raw.question).some(key=>!['options','correct','supportQuote'].includes(key))||!Array.isArray(raw.question.options)||typeof raw.question.correct!=='number'||!Number.isInteger(raw.question.correct)||!text(raw.question.supportQuote,700)||!raw.question.supportQuote.trim())throw new Error('Edited question options are invalid.');
        options=raw.question.options.map(o=>{if(!text(o,350)||!o.trim())throw new Error('Edited question option is invalid.');return o;});
        if((raw.question.correct as number)<0||(raw.question.correct as number)>=options.length)throw new Error('Edited question answer key is invalid.');
      }else if(Array.isArray(raw.options))options=raw.options.map(o=>{if(!text(o,350)||!o.trim())throw new Error('Edited question option is invalid.');return o;});
      if(!options||options.length<2||options.length>4)throw new Error('Edited question needs 2–4 options.');
    }else if(raw.question!==undefined||raw.options!==undefined)throw new Error('Only practice questions can carry options.');
    return {kind:raw.kind as DraftBlock['kind'],title:raw.title,text:raw.text,...(options?{options:[...options]}:{}),citationIds:[...raw.citationIds]};
  });
  const projected:EditedReading={layout:value.layout as EditedReading['layout'],blocks};
  if(new TextEncoder().encode(JSON.stringify(projected)).byteLength>128*1024)throw new Error('Edited reading is too large to save.');
  return projected;
}

function validPack(p:unknown):p is ReadingPack {
  if(!obj(p)||!id(p.id)||!text(p.revision,120)||!text(p.title,300)||!text(p.objective,4000)||!text(p.sourceTitle,300)||!text(p.warning,4000)||!text(p.notes,8000)||!text(p.savedAt,40)||!Number.isFinite(Date.parse(p.savedAt))||new Date(p.savedAt).toISOString()!==p.savedAt)return false;
  if(!Array.isArray(p.chapters)||p.chapters.length===0||p.chapters.length>(p.editedReading===undefined?20:40)||!p.chapters.every(c=>obj(c)&&text(c.title,300)&&text(c.explanation,16000)&&text(c.example,16000))||!Array.isArray(p.citations)||p.citations.length>60||!p.citations.every(c=>obj(c)&&(c.id===undefined||id(c.id))&&text(c.locator,500)&&text(c.quote,12000)))return false;
  if(p.editedReading!==undefined){try{projectEditedReading(p.editedReading,new Set(p.citations.map(c=>(c as Record<string,unknown>).id).filter((v):v is string=>typeof v==='string')));}catch{return false;}}
  return true;
}
export function parseMemory(raw:string|null):DeviceMemory {
  if(raw===null)return emptyMemory();
  if(raw.length>1_500_000)throw new Error('Saved reading is too large to open.');
  const p:unknown=JSON.parse(raw);
  if(!obj(p)||p.version!==1||!['paper','sage'].includes(p.theme as string)||!text(p.goal,500)||!Array.isArray(p.packs)||p.packs.length>5||!p.packs.every(validPack)||new Set(p.packs.map(x=>x.id)).size!==p.packs.length)throw new Error('Saved reading could not be opened.');
  // Project allowlisted fields: device memory never becomes model instructions or cloud context.
  return {version:1,theme:p.theme as DeviceMemory['theme'],goal:p.goal,packs:p.packs.map(v=>({id:v.id,revision:v.revision,title:v.title,objective:v.objective,sourceTitle:v.sourceTitle,savedAt:v.savedAt,chapters:v.chapters.map(c=>({title:c.title,explanation:c.explanation,example:c.example})),citations:v.citations.map(c=>({...(c.id?{id:c.id}:{}),locator:c.locator,quote:c.quote})),warning:v.warning,notes:v.notes,...(v.editedReading?{editedReading:projectEditedReading(v.editedReading,new Set(v.citations.map(c=>c.id).filter((x):x is string=>!!x)))}:{})}))};
}
export function readMemory():DeviceMemory{return parseMemory(learnerStorage.getItem(DEVICE_KEY));}
export function writeMemory(memory:DeviceMemory){const raw=JSON.stringify(parseMemory(JSON.stringify(memory)));learnerStorage.setItem(DEVICE_KEY,raw);window.dispatchEvent(new Event('kairo-memory-change'));}
export function addReadingPack(memory:DeviceMemory,lesson:Lesson,now=new Date().toISOString()):DeviceMemory {
  const previous=memory.packs.find(p=>p.id===lesson.id);
  if(previous&&previous.revision!==lesson.revision&&previous.notes)throw new Error('Export your notes and remove the older saved copy before replacing this lesson.');
  const editedReading=lesson.editorDocument?projectEditedReading(lesson.editorDocument,new Set(lesson.evidence.map(e=>e.id))):undefined;
  const pack:ReadingPack={id:lesson.id,revision:lesson.revision,title:lesson.title,objective:lesson.objective,sourceTitle:lesson.sourceTitle,savedAt:now,chapters:lesson.chapters.map(c=>({title:c.title,explanation:c.explanation,example:c.example})),citations:lesson.evidence.map(e=>({id:e.id,locator:e.locator,quote:e.quote})),warning:lesson.reviewWarning,notes:previous?.notes||'',...(editedReading?{editedReading}:{})};
  if(!validPack(pack))throw new Error('This lesson cannot be saved as a reading copy. Export your notes instead.');
  if(!previous&&memory.packs.length>=5)throw new Error('Five lessons are saved. Remove a copy before saving another.');
  return parseMemory(JSON.stringify({...memory,packs:[pack,...memory.packs.filter(p=>p.id!==pack.id)]}));
}
export function editedReadingMarkdown(reading:EditedReading){const layoutName={reading:'Reading',split:'Split view',practice:'Practice'}[reading.layout];return `## Edited lesson blocks\n\nOriginal arrangement recorded: ${layoutName}. This saved copy uses a linear reading layout.\n\n${reading.blocks.map((b,i)=>{const kind=b.kind==='reflection'?'Personal reflection (ungraded)':b.kind==='worked-example'?'Worked example':b.kind==='question'?'Practice question':'Explanation';return `### ${i+1}. ${kind}: ${b.title}\n\n${b.text||'No reflection has been written.'}${b.options?`\n\nOptions (answer key not included):\n${b.options.map(o=>`- ${o}`).join('\n')}`:''}${b.citationIds.length?`\n\nSource references: ${b.citationIds.join(', ')}`:''}`;}).join('\n\n')}`;}
export function packMarkdown(p:ReadingPack){const reading=p.editedReading?editedReadingMarkdown(projectEditedReading(p.editedReading,new Set(p.citations.map(c=>c.id).filter((x):x is string=>!!x)))):p.chapters.map(c=>`## ${c.title}\n\n${c.explanation}\n\n${c.example}`).join('\n\n');return `# ${p.title}\n\nSaved reading copy · ${p.savedAt}\nSource: ${p.sourceTitle}\nRevision: ${p.revision}\n\n${p.objective}\n\n${reading}\n\n## Source passages\n\n${p.citations.map(c=>`${c.id?`${c.id} · `:''}${c.locator}\n\n${c.quote}`).join('\n\n')}\n\n## My notes\n\n${p.notes}\n\n${p.warning}\n\nSaved copies may be out of date. This file is not a verified assessment.\n`;}
