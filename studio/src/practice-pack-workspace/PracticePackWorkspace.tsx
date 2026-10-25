import {useEffect,useMemo,useState} from 'react';
import {exportRun,initialRun,practicePacks,transition,type PracticeRun} from '../practice-packs/model.ts';
import {learnerStepView} from './presenter.ts';
import './practice-pack-workspace.css';

export type PracticePackWorkspaceProps={onExit?:()=>void};

function newRunId():string{
 const uuid=globalThis.crypto?.randomUUID?.();
 return uuid?`pack-${uuid}`:`pack-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
}
function nextTimestamp(run:PracticeRun):string{
 const last=run.events.at(-1)?.at??run.startedAt;
 return new Date(Math.max(Date.now(),Date.parse(last)+1)).toISOString();
}

export default function PracticePackWorkspace({onExit}:PracticePackWorkspaceProps){
 const [run,setRun]=useState<PracticeRun|null>(null),[selected,setSelected]=useState(''),[reflection,setReflection]=useState(''),[status,setStatus]=useState(''),[error,setError]=useState('');
 const pack=useMemo(()=>run?practicePacks.find(item=>item.id===run.packId)??null:null,[run]);
 const view=run?learnerStepView(run):null;
 const complete=Boolean(run&&pack&&run.stepIndex===pack.steps.length);
 const hasUnsavedWork=Boolean(run&&(run.events.some(event=>event.kind==='choice'||event.kind==='hint'||event.kind==='reflection')||reflection.trim()));
 const actionEvents=run?.events.filter(event=>event.kind==='choice'||event.kind==='hint')??[];

 useEffect(()=>{
  if(!hasUnsavedWork)return;
  const warnBeforeUnload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
  window.addEventListener('beforeunload',warnBeforeUnload);
  return ()=>window.removeEventListener('beforeunload',warnBeforeUnload);
 },[hasUnsavedWork]);

 function start(packId:string){
  try{setRun(initialRun(packId,newRunId(),new Date().toISOString()));setSelected('');setReflection('');setStatus('Practice started. This run is held in memory on this page.');setError('');}
  catch{setError('This practice pack could not be started. Refresh the page and try again.');}
 }
 function apply(action:Parameters<typeof transition>[1]){
  if(!run)return;
  const next=transition(run,action,nextTimestamp(run));setRun(next);
  if(action.type==='choose'||next.stepIndex!==run.stepIndex)setSelected('');
  setError(next.notice);setStatus(next.notice?'No new action was recorded.':'');
 }
 function submit(){if(!selected)return;apply({type:'choose',choiceId:selected});}
 function hint(){apply({type:'hint'});}
 function saveReflection(){apply({type:'reflect',text:reflection});}
 function download(){
  if(!run)return;
  try{
   const record=exportRun(run),blob=new Blob([JSON.stringify(record,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');
   anchor.href=url;anchor.download=`kairo-practice-${record.scenario.id}-${record.record.runId}.json`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   setStatus('Download requested. Check your browser’s download area; this page cannot confirm receipt.');setError('');
  }catch{setError('The practice record could not be verified for export. No download was requested.');}
 }
 function leaveScenario(exit=false){
  if(run&&!window.confirm('Leave this scenario? Your in-memory choices, help history and reflection will be lost unless you export them. This page cannot save them for you.'))return;
  setRun(null);setSelected('');setReflection('');setStatus('');setError('');
  if(exit)onExit?.();
 }

 return <div className="ppw">
  <header className="ppw-top"><a className="ppw-brand" href="/" aria-label="KAIRO home">KAIRO <span>Access</span></a><div className="ppw-top-actions">{onExit&&<button type="button" className="ppw-quiet" onClick={()=>leaveScenario(true)}>Back</button>}{run&&<button type="button" className="ppw-outline" onClick={download}>Export JSON</button>}</div></header>
  <main className="ppw-main">
   {!run?<>
    <p className="ppw-kicker">Workplace practice</p><h1>Choose a workplace scenario.</h1>
    <p className="ppw-intro">Make a decision, see what follows, and keep the uncertainty visible when you need more information. These are fictional formative exercises, not employer assessments.</p>
    {error&&<p className="ppw-alert" role="alert">{error}</p>}
    <section className="ppw-cards" aria-label="Available practice scenarios">{practicePacks.map(item=><article className="ppw-card" key={item.id}>
     <p className="ppw-kicker">Invented · {item.steps.length} decisions</p><h2>{item.title}</h2><p>{item.fictionalNotice}</p>
     <button type="button" className="ppw-primary" onClick={()=>start(item.id)}>Start this scenario</button>
    </article>)}</section>
    <p className="ppw-memory-note">Nothing is saved automatically. Your current run stays in this page’s memory and is lost if you leave before exporting.</p>
   </>:<>
    <p className="ppw-kicker">Invented scenario · formative practice</p><h1>{pack?.title}</h1>
    <div className="ppw-notice">{pack?.fictionalNotice}</div>
    <p className="ppw-memory-note">In-memory run · not saved to an account or device. Export when you want a copy.</p>
    {view?<>
     <div className="ppw-progress" aria-label={`Decision ${view.stepNumber} of ${view.stepCount}`}><span>Decision {view.stepNumber} of {view.stepCount}</span><div role="progressbar" aria-label="Completed decisions" aria-valuemin={0} aria-valuemax={view.stepCount} aria-valuenow={run?.stepIndex??0}><i style={{width:`${((run?.stepIndex??0)/view.stepCount)*100}%`}}/></div></div>
     {view.revision&&<aside className="ppw-revision"><p className="ppw-kicker">Updated requirement</p><p>{view.revision.summary}</p></aside>}
     <section className="ppw-question" aria-labelledby="ppw-step-title"><p className="ppw-kicker">{view.stepTitle}</p><h2 id="ppw-step-title">{view.prompt}</h2>
      <fieldset><legend>Choose the next step</legend>{view.choices.map(choice=><label className={selected===choice.id?'selected':''} key={choice.id}><input type="radio" name="practice-pack-choice" value={choice.id} checked={selected===choice.id} onChange={()=>{setSelected(choice.id);setError('');setStatus('');}}/><span>{choice.label}</span></label>)}</fieldset>
      <div className="ppw-actions"><button type="button" className="ppw-outline" onClick={hint}>Show a hint</button><button type="button" className="ppw-primary" disabled={!selected} onClick={submit}>Submit choice</button></div>
     </section>
    </>:<section className="ppw-complete"><p className="ppw-kicker">Scenario sequence complete</p><h2>You reached the end of this practice sequence.</h2><p>The record describes choices made in this fictional scenario. It does not verify a skill or assess your reflection.</p>
      <label className="ppw-reflection">Optional reflection · not assessed<textarea maxLength={1000} rows={4} value={reflection} onChange={event=>setReflection(event.target.value)} placeholder="What would you want to confirm before acting at work?"/><span>{reflection.length}/1000 characters</span></label>
      <button type="button" className="ppw-outline" disabled={!reflection.trim()} onClick={saveReflection}>Add unassessed reflection</button>
     </section>}
    {error&&<p className="ppw-alert" role="alert">{error}</p>}
    {run.feedback&&<section className="ppw-feedback" aria-live="polite"><p className="ppw-kicker">Feedback</p><p>{run.feedback}</p></section>}
    {actionEvents.length>0&&<details className="ppw-history"><summary>Attempt and help history ({actionEvents.length})</summary><ol>{actionEvents.map((event,index)=><li key={`${event.at}-${index}`}><strong>{event.kind==='hint'?'Hint':`Choice attempt ${event.attempt}`}</strong><p>{event.feedback}</p></li>)}</ol></details>}
    {status&&<p className="ppw-status" role="status">{status}</p>}
    <section className="ppw-source"><h2>Role context</h2><p>These public role pages informed the kinds of tasks represented. They do not describe or endorse this invented scenario.</p><ul>{pack?.roleSources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><span>{source.capabilities.join(' · ')}</span></li>)}</ul></section>
    <div className="ppw-bottom"><button className="ppw-quiet" type="button" onClick={()=>leaveScenario()}>Leave scenario</button><span>{complete?'Sequence complete':'You can export this in-progress record at any time.'}</span></div>
   </>}
  </main>
 </div>;
}

