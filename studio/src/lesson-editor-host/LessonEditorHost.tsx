import {useEffect,useRef,useState} from 'react';
import type {Lesson} from '../workspace/types';
import {useTeacher} from '../teacher/TeacherProvider';
import {loadReviewedLesson} from '../source-classroom/session';
import {draftFromLesson,editDraft,validateDraft} from '../lesson-draft-core/model';
import type {DraftAction,LessonDraft} from '../lesson-draft-core/types';
import LessonBlockEditor from '../lesson-editor-ui/LessonBlockEditor';
import DraftReading from './DraftReading';
import './lesson-editor.css';

type RecordValue={version:number;document:LessonDraft;updatedAt:string|null};
type HistoryItem={version:number;updatedAt:string};
export async function editorRequest<T>(path:string,signal:AbortSignal,body?:unknown):Promise<T>{
 const response=await fetch(`/api/workspace${path}`,{signal,cache:'no-store',...(body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
 const value=await response.json();if(!response.ok)throw Object.assign(new Error(value.error||'Your work could not be saved.'),{status:response.status});return value;
}
export default function LessonEditorHost(){
 const teacher=useTeacher(),stop=useRef(teacher.stop);stop.current=teacher.stop;
 const [lesson,setLesson]=useState<Lesson|null>(null),[draft,setDraft]=useState<LessonDraft|null>(null),[selected,setSelected]=useState<string|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('Opening your reviewed lesson…'),[version,setVersion]=useState(0);
 const [undo,setUndo]=useState<LessonDraft[]>([]),[redo,setRedo]=useState<LessonDraft[]>([]),[versions,setVersions]=useState<HistoryItem[]>([]),[chosenVersion,setChosenVersion]=useState('');
 const [published,setPublished]=useState<Lesson|null>(null),[autoSave,setAutoSave]=useState(true),[conflict,setConflict]=useState(false),[retry,setRetry]=useState(0);
 const alive=useRef(false),working=useRef(false),saved=useRef(''),versionRef=useRef(0),abort=useRef<AbortController|null>(null),importRef=useRef<HTMLInputElement>(null);
 const json=draft?JSON.stringify(draft):'',dirty=!!draft&&json!==saved.current;
 useEffect(()=>{
  const controller=new AbortController();abort.current=controller;alive.current=true;working.current=true;setBusy(true);setError('');setStatus('Opening your reviewed lesson…');setConflict(false);
  const id=new URLSearchParams(location.search).get('lesson')||'';
  void loadReviewedLesson(id,(path,signal)=>editorRequest(path,signal),controller.signal).then(async native=>{
   if(native.parentLessonId){location.replace(`/lesson-editor?lesson=${native.parentLessonId}`);return;}
   const record=await editorRequest<RecordValue>(`/lesson/${native.id}/draft`,controller.signal);if(controller.signal.aborted)return;
   const value=validateDraft(record.document,native);saved.current=JSON.stringify(value);versionRef.current=record.version;
   setLesson(native);setDraft(value);setSelected(value.blocks[0]?.id||null);setVersion(record.version);setUndo([]);setRedo([]);setPublished(null);
   setStatus(record.version?`Restored saved draft · version ${record.version}.`:'Ready to shape. Your original lesson stays unchanged.');document.title=`KAIRO · Shape ${native.title}`;
   void editorRequest<{versions:HistoryItem[]}>(`/lesson/${native.id}/draft/history`,controller.signal).then(v=>{if(!controller.signal.aborted)setVersions(v.versions);}).catch(()=>{});
  }).catch(e=>{if(!controller.signal.aborted){setError(e instanceof Error?e.message:'This lesson could not open.');setStatus('Your earlier material was kept.');}}).finally(()=>{if(!controller.signal.aborted){working.current=false;setBusy(false);}});
  return()=>{alive.current=false;controller.abort();stop.current();};
 },[retry]);
 useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 async function save(){
  if(!lesson||!draft||working.current||conflict)return null;const controller=abort.current!;working.current=true;setBusy(true);setError('');setStatus('Saving your draft…');
  try{
   const record=await editorRequest<RecordValue>(`/lesson/${lesson.id}/draft`,controller.signal,{expectedVersion:versionRef.current,document:validateDraft(draft,lesson)});
   if(!alive.current||controller.signal.aborted||abort.current!==controller)return null;saved.current=JSON.stringify(record.document);versionRef.current=record.version;setVersion(record.version);setStatus(`Saved on this app host · version ${record.version}.`);
   setVersions(v=>[{version:record.version,updatedAt:record.updatedAt||new Date().toISOString()},...v.filter(x=>x.version!==record.version)]);return record;
  }catch(e){if(alive.current&&!controller.signal.aborted&&abort.current===controller){if(e&&typeof e==='object'&&'status' in e&&e.status===409){setConflict(true);setAutoSave(false);}setAutoSave(false);setError(e instanceof Error?e.message:'This draft could not be saved.');setStatus('Unsaved changes are still here. Export a copy before leaving.');}return null;}
  finally{if(abort.current===controller){working.current=false;if(alive.current)setBusy(false);}}
 }
 useEffect(()=>{if(!dirty||!autoSave||busy||conflict)return;const timer=setTimeout(()=>{void save();},1100);return()=>clearTimeout(timer);},[json,autoSave,busy,conflict]);
 function act(action:DraftAction){
  if(!lesson||!draft||working.current)return;stop.current();try{
   const changed=editDraft(draft,action),nativeBlocks=new Map(draftFromLesson(lesson).blocks.map(block=>[block.id,block]));
   // Returning native text and heading restores its original provenance; split and personal blocks remain authored.
   changed.blocks=changed.blocks.map(block=>{const native=nativeBlocks.get(block.id);return native&&block.kind===native.kind&&block.text===native.text&&block.title===native.title?{...block,origin:native.origin}:block;});
   const value=validateDraft(changed,lesson);setUndo(v=>[...v.slice(-29),draft]);setRedo([]);setDraft(value);setPublished(null);setError('');setStatus('Changes are not saved yet.');
   if(action.kind==='add-reflection')setSelected(action.id);else if(selected&&!value.blocks.some(b=>b.id===selected))setSelected(value.blocks[0]?.id||null);
  }catch(e){setError(e instanceof Error?e.message:'That change could not be made.');}
 }
 function travel(direction:'undo'|'redo'){
  if(!lesson||!draft||working.current)return;const stack=direction==='undo'?undo:redo;if(!stack.length)return;stop.current();const value=validateDraft(stack[stack.length-1],lesson);
  if(direction==='undo'){setUndo(stack.slice(0,-1));setRedo(v=>[...v,draft]);}else{setRedo(stack.slice(0,-1));setUndo(v=>[...v,draft]);}
  setDraft(value);setPublished(null);setStatus('Restored in the editor. Saving creates a new version.');
 }
 function exportDraft(){if(!draft||!lesson)return;const content=JSON.stringify({format:'kairo-editable-lesson/1',document:draft,evidence:lesson.evidence},null,2),url=URL.createObjectURL(new Blob([content],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=`kairo-lesson-${lesson.id}-draft.json`;link.click();URL.revokeObjectURL(url);}
 async function importDraft(file:File){
  if(!lesson||!draft||working.current)return;const currentController=abort.current;try{if(file.size>220*1024)throw new Error('Choose a KAIRO draft smaller than 220 KB.');const raw=JSON.parse(await file.text());if(!alive.current||currentController?.signal.aborted||currentController!==abort.current)return;if(raw?.format!=='kairo-editable-lesson/1')throw new Error('Choose a KAIRO editable-lesson export.');const value=validateDraft(raw.document,lesson);if(!window.confirm('Replace this editor draft with the imported version? Undo keeps your current draft in this session.'))return;stop.current();setUndo(v=>[...v.slice(-29),draft]);setRedo([]);setDraft(value);setPublished(null);setAutoSave(false);setError('');setStatus('Imported for review. Check the preview and save when ready. Automatic saving is paused.');}catch(e){if(alive.current&&currentController===abort.current)setError(e instanceof Error?e.message:'This file could not be imported.');}
 }
 async function restore(){
  if(!lesson||!chosenVersion||working.current)return;const controller=abort.current!;working.current=true;setBusy(true);setError('');try{const record=await editorRequest<RecordValue>(`/lesson/${lesson.id}/draft/history/${Number(chosenVersion)}`,controller.signal);if(!alive.current||controller.signal.aborted||abort.current!==controller)return;const value=validateDraft(record.document,lesson);if(draft)setUndo(v=>[...v.slice(-29),draft]);setRedo([]);stop.current();setDraft(value);setPublished(null);setStatus('Past content restored in the editor. Save it as a new version to keep the history.');}catch(e){if(alive.current&&!controller.signal.aborted&&abort.current===controller)setError(e instanceof Error?e.message:'This version could not open.');}finally{if(abort.current===controller){working.current=false;if(alive.current)setBusy(false);}}
 }
 async function publish(){
  if(!lesson||!draft||working.current||conflict)return;let savedVersion=versionRef.current;if(dirty||savedVersion===0){const record=await save();if(!record)return;savedVersion=record.version;}
  const controller=abort.current!;working.current=true;setBusy(true);setError('');stop.current();try{const value=await editorRequest<Lesson>(`/lesson/${lesson.id}/draft/publish`,controller.signal,{expectedVersion:savedVersion});if(alive.current&&!controller.signal.aborted&&abort.current===controller){setPublished(value);setStatus('Your separate learning copy is ready. Earlier lessons and attempts were kept.');}}catch(e){if(alive.current&&!controller.signal.aborted&&abort.current===controller){setError(e instanceof Error?e.message:'A learning copy could not be made.');if(e&&typeof e==='object'&&'status' in e&&e.status===409){setConflict(true);setAutoSave(false);}}}finally{if(abort.current===controller){working.current=false;if(alive.current)setBusy(false);}}
 }
 if(!lesson||!draft)return <main className="le-host"><h1>Shape your lesson</h1><p role="status">{status}</p>{error&&<p role="alert">{error}</p>}<a href="/sources">Back to My material</a>{error&&<button onClick={()=>setRetry(v=>v+1)}>Try opening again</button>}</main>;
 return <main className="le-host"><header className="le-top"><div><p className="le-kicker">KAIRO · lesson workshop</p><h1>Make understanding your own.</h1><p>Edit the explanation. Move the example. Keep the source within reach.</p></div><a href={`/classroom?lesson=${lesson.id}`}>Open original lesson</a></header>
 <div className="le-toolbar"><button disabled={busy||!undo.length} onClick={()=>travel('undo')}>Undo</button><button disabled={busy||!redo.length} onClick={()=>travel('redo')}>Redo</button><button disabled={busy||!dirty||conflict} onClick={()=>void save()}>Save draft</button><button disabled={busy} onClick={exportDraft}>Export draft</button><button disabled={busy} onClick={()=>importRef.current?.click()}>Import draft</button><input ref={importRef} type="file" hidden accept=".json,application/json" onChange={e=>{const f=e.target.files?.[0];if(f)void importDraft(f);e.target.value='';}}/><label><input type="checkbox" checked={autoSave} disabled={busy||conflict} onChange={e=>setAutoSave(e.target.checked)}/> Save as I edit</label><span>{version?`Version ${version}`:'Not saved yet'} · {dirty?'Unsaved changes':'Up to date'}</span></div>
 <p role="status" className="le-status">{status}</p>{error&&<p role="alert" className="le-error">{error}</p>}{conflict&&<div className="le-conflict"><p>Another tab has saved newer work. This editor has kept your draft. Export it before loading the saved version; nothing is overwritten automatically.</p><button onClick={()=>{if(!dirty||window.confirm('Reload the saved version? Export your current changes first if you need them.'))setRetry(v=>v+1);}}>Load saved version</button></div>}
 <details className="le-history"><summary>Earlier saved versions ({versions.length})</summary><label>Restore content from <select value={chosenVersion} disabled={busy} onChange={e=>setChosenVersion(e.target.value)}><option value="">Choose a saved version</option>{versions.map(v=><option key={v.version} value={v.version}>Version {v.version} · {new Date(v.updatedAt).toLocaleString()}</option>)}</select></label><button disabled={busy||!chosenVersion} onClick={()=>void restore()}>Restore into editor</button><p>Restoring creates a new saved version; earlier history stays intact.</p></details>
 <div className="le-workspace"><LessonBlockEditor draft={draft} onAction={act} busy={busy} selectedId={selected} onSelect={id=>{stop.current();setSelected(id);}}/><aside className="le-live"><div className="le-live-title"><h2>See your lesson take shape</h2><span>Live preview · {draft.blocks.length} cards</span></div><DraftReading draft={draft} lesson={lesson} onRead={text=>{stop.current();teacher.say(text,'en-ZA');}}/><button onClick={()=>stop.current()}>Stop narration</button></aside></div>
 <footer className="le-finish"><div><h2>Ready to work through it?</h2><p>Your learning copy gets a new lesson ID. Earlier questions, attempts and source revisions stay intact. Personal reflection cards remain ungraded.</p></div><button className="le-primary" disabled={busy||conflict} onClick={()=>void publish()}>Make my learning copy</button>{published&&<a className="le-primary" href={`/classroom?lesson=${published.id}`}>Learn with this copy →</a>}</footer>
 <p className="le-small">This local pilot saves to the app host. It has no separate user accounts or cloud sync. Source excerpts remain attached, but an edit is not automatically checked for factual correctness. Layout choices arrange reading cards; they do not generate a new 3D world.</p></main>;
}
