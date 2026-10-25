import {useEffect,useLayoutEffect,useMemo,useReducer,useRef,useState} from 'react';
import {learnerStorage} from '../account/storage.ts';
import {useTeacher} from '../teacher/TeacherProvider.tsx';
import motorPack from '../studio-teaching-host/packs/motor.json';
import {adaptPreparedMotor} from './adapter.ts';
import {ANSWERS,CUES,allowedPoles,correctFor,fieldSpeed,focusAfter,initialState,reduceDirector,restore,serialize,type Action,type Answer,type CueId,type DirectorState} from './model.ts';
import './director.css';

const lesson=adaptPreparedMotor(motorPack);
const STORAGE_KEY='kairo-lecture-director:'+lesson.id+':'+lesson.sourceFingerprint+':v1';
const OPTION_LABELS:Record<Answer,string>={'1500':'1,500 r/min','1800':'1,800 r/min','3000':'3,000 r/min','unknown':'Cannot determine from these inputs'};
const STAGE_LABELS:Record<CueId,string>={INTRO:'01 / THE IDEA',EXPLAIN:'02 / THE RULE',DEMONSTRATE:'03 / THE EXPERIMENT',PAUSE_FOR_PREDICTION:'04 / PREDICT',REVEAL_FEEDBACK:'05 / EXPLAIN',SECOND_ATTEMPT:'06 / APPLY',COMPLETE:'07 / YOUR WORK'};
function readState(){
 try{return restore(learnerStorage.getItem(STORAGE_KEY),lesson);}
 catch{return initialState(lesson);}
}
function mayWriteSnapshot():boolean{
 try{const raw=learnerStorage.getItem(STORAGE_KEY);if(!raw)return true;const o=JSON.parse(raw);return o.version===1&&o.lessonId===lesson.id&&o.sourceFingerprint===lesson.sourceFingerprint;}
 catch{return false;}
}
/** Standalone React chapter; no router, teacher provider, or shared lecture host is mounted here. */
export default function LectureDirector(){
 const teacher=useTeacher();
 const [state,dispatch]=useReducer((s:DirectorState,a:Action)=>reduceDirector(s,a,lesson),undefined,readState);
 const [answer,setAnswer]=useState<Answer|null>(null);
 const [reading,setReading]=useState(false);
 const [reduced,setReduced]=useState(()=>typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false);
 const [audioEnabled,setAudioEnabled]=useState(false);
 const [saveStatus,setSaveStatus]=useState('');
 const writable=useRef(mayWriteSnapshot());
 const questionHeading=useRef<HTMLHeadingElement>(null),feedbackHeading=useRef<HTMLHeadingElement>(null),last=useRef(state);
 const cue=useMemo(()=>lesson.cues.find(c=>c.id===state.cue)!,[state.cue]);
 const check=state.cue==='PAUSE_FOR_PREDICTION'||state.cue==='SECOND_ATTEMPT';
 const result=state.cue==='REVEAL_FEEDBACK'||state.cue==='COMPLETE';
 const second=state.cue==='SECOND_ATTEMPT'||state.cue==='COMPLETE';
 const checkedValue=second?correctFor(state,'second',lesson):correctFor(state,'first',lesson);
 const model=fieldSpeed(state.frequencyHz,state.poles);
 // Deliberately slowed instructional animation; its period varies consistently with validated field speed, not physical rpm.
 const visualCycleSeconds=model.ok?Math.max(4,Math.min(28,18000/model.rpm)):12;
 const evidence=lesson.sourceRefs.filter(ref=>cue.sourceRefIds.includes(ref.id));
 const canNext=!state.stopped&&!state.paused&&(state.cue==='PAUSE_FOR_PREDICTION'?state.first!==null:state.cue==='SECOND_ATTEMPT'?state.second!==null:state.cue!=='COMPLETE');
 function act(a:Action){
  // Never start speech on a timed or reducer transition. A cue can be narrated only via explicit action.
  if(a.type!=='DEMO'&&a.type!=='SUBMIT')teacher.stop();
  if(a.type!=='DEMO')setAnswer(null);
  dispatch(a);
 }
 useLayoutEffect(()=>{
  const focus=focusAfter(last.current,state);
  if(focus==='feedback')feedbackHeading.current?.focus();
  if(focus==='question')questionHeading.current?.focus();
  last.current=state;
 },[state]);
 useEffect(()=>{
  if(!writable.current){setSaveStatus('Existing saved data did not match this chapter. It has not been overwritten. Export current work instead.');return;}
  try{learnerStorage.setItem(STORAGE_KEY,serialize(state,lesson));setSaveStatus('Guided working saved on this device.');}
  catch{setSaveStatus('Device saving is unavailable. Use Export progress to keep a copy.');}
 },[state]);
 useEffect(()=>()=>teacher.stop(),[]);
 function submit(){
  if(!answer||!check||state.stopped||state.paused)return;
  act({type:'SUBMIT',answer,expectedEpoch:state.epoch});
 }
 function exportProgress(){
  const data=serialize(state,lesson);
  const blob=new Blob([data],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='KAIRO-motor-guided-working-v1.json';link.click();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function readCue(){
  if(!audioEnabled||state.stopped)return;
  // KAIRO's existing single narrator, cue-level synchronization only: no invented word visemes.
  teacher.say(cue.narration,'en-ZA');
 }
 const question=second?'A four-pole induction motor is supplied at 60 Hz. What is its synchronous field speed?':'With a 50 Hz supply and four total poles, what is the synchronous rotating-field speed?';
 return <main className={'kld '+(reading?'kld-reading ':'')+(reduced?'kld-reduced ':'')+(state.paused||state.stopped?'kld-paused':'')} aria-label="KAIRO Live Lecture Director motor chapter">
  <header className="kld-top"><span className="kld-wordmark">K<span>AIRO</span><small>ACCESS / LIVE LECTURE DIRECTOR</small></span><span className="kld-source-status">PREPARED SOURCE-REFERENCED CHAPTER <b>· v1</b></span></header>
  <div className="kld-intro"><div><p className="kld-kicker">FIELD NOTES / ELECTRICAL MACHINES</p><h1>The invisible<br/><em>rotating field.</em></h1><p>{lesson.objective}</p></div><div className="kld-counter"><strong>{String(CUES.indexOf(state.cue)+1).padStart(2,'0')}<span> / 07</span></strong><span>TEACHING CUES</span></div></div>
  <div className="kld-layout">
   <section className="kld-stage" aria-label="Concept illustration and interactive calculation">
    <div className="kld-stage-head"><span><i/> {STAGE_LABELS[state.cue]}</span><span>IDEALISED MODEL · NOT SHAFT MEASUREMENT</span></div>
    <div className="kld-board">
     <div className="kld-concept"><span className="kld-overline">CONCEPT / 001</span><h2>{state.cue==='INTRO'?'A stationary stator. A rotating field.':check?'Your prediction comes first.':state.cue==='COMPLETE'?'Two applications. One principle.':'Field speed follows frequency and pole count.'}</h2><p>{cue.transcript}</p></div>
     <div className="kld-visual">
      <div className="kld-diagram" role="img" aria-label="Illustrative plan view: stationary outer stator containing a rotating magnetic field and rotor. Not a physical speed measurement.">
       <svg viewBox="0 0 420 300" aria-hidden="true" focusable="false">
        <defs><radialGradient id="kld-glow"><stop stopColor="#8dd5bd" stopOpacity=".26"/><stop offset="1" stopColor="#8dd5bd" stopOpacity="0"/></radialGradient></defs>
        <circle cx="205" cy="153" r="138" fill="url(#kld-glow)"/>
        <circle cx="205" cy="153" r="104" fill="none" stroke="#8ca7a4" strokeWidth="19" strokeDasharray="8 4"/>
        <circle cx="205" cy="153" r="91" fill="none" stroke="#c1d4cd" strokeWidth="1.5" strokeDasharray="3 7"/>
        <g key={state.epoch} className="kld-field-rotation" style={{animationDuration:visualCycleSeconds+'s'}}><ellipse cx="205" cy="153" rx="63" ry="20" fill="#69c9a6" opacity=".15"/><path d="M205 80L224 142L205 132L186 142Z" fill="#e6b37a"/><path d="M205 226L186 163L205 173L224 163Z" fill="#76c6b0"/><text x="205" y="71" textAnchor="middle" fill="#e6b37a" fontSize="13">N</text><text x="205" y="242" textAnchor="middle" fill="#a5e0ce" fontSize="13">S</text></g>
        <circle cx="205" cy="153" r="29" fill="#123b40" stroke="#8cc8b6" strokeWidth="3"/>
        <circle cx="205" cy="153" r="8" fill="#d7e8d9"/>
        <path d="M100 79H35V50M305 224H376V255" stroke="#c3d6c8" fill="none" strokeWidth="1.5"/>
        <text x="19" y="42" fill="#e8e5d9" fontSize="12">STATOR</text><text x="19" y="57" fill="#a4bcb3" fontSize="10">stationary</text>
        <text x="334" y="271" fill="#e8e5d9" fontSize="12">ROTOR</text><text x="334" y="285" fill="#a4bcb3" fontSize="10">distinct speed</text>
       </svg>
      </div>
      <p>Diagram is schematic and slowed. No rotating-field animation or shown speed measures a physical motor shaft.</p>
     </div>
     <div className="kld-equation"><span className="kld-overline">LIVE MODEL / SYNCHRONOUS FIELD</span><div className="kld-formula">n<sub>s</sub> = <span>120 × f</span> / p</div><p>f: frequency (Hz) · p: total poles · n<sub>s</sub>: revolutions/minute</p>
      {state.cue==='DEMONSTRATE'?<><div className="kld-inputs"><label>Supply frequency: <strong>{state.frequencyHz} Hz</strong><input type="range" min="10" max="100" step="5" value={state.frequencyHz} onChange={e=>act({type:'DEMO',frequencyHz:Number(e.target.value),poles:state.poles})} disabled={state.paused||state.stopped}/></label><label>Total magnetic poles<select value={state.poles} disabled={state.paused||state.stopped} onChange={e=>act({type:'DEMO',frequencyHz:state.frequencyHz,poles:Number(e.target.value)})}>{allowedPoles.map(p=><option key={p} value={p}>{p} poles</option>)}</select></label></div><output className="kld-readout" aria-live="polite">{model.ok?model.rpm.toLocaleString('en-ZA')+' r/min':'Unsupported input'}</output><p>Ideal balanced three-phase field; permitted 1–400 Hz, even 2–12 poles. Not actual rotor speed or a rewired 3D winding.</p></>:
      check?<div className="kld-masked" aria-label="Outcome hidden until you submit">? <span>Calculate before reveal</span></div>:
      result?<div className="kld-worked"><strong>{second?'120 × 60 ÷ 4 = 1,800 r/min':'120 × 50 ÷ 4 = 1,500 r/min'}</strong><span>Synchronous field speed only. Rotor speed is not measured here.</span></div>:
      <div className="kld-readout kld-readout-muted">Explore the relationship →</div>}
     </div>
    </div>
    <div className="kld-evidence"><div><span className="kld-overline">EVIDENCE / ORIGINAL REFERENCES</span><p>Prepared KAIRO paraphrase, not a verbatim quotation or new review of uploaded material.</p></div><details><summary>Inspect {evidence.length} source anchors</summary><ol>{evidence.map(ref=><li key={ref.id}><a href={ref.url} target="_blank" rel="noreferrer">{ref.locator}</a><small>Checked {ref.checkedAt} · {ref.id}</small></li>)}</ol></details></div>
   </section>
   <aside className="kld-director" aria-label="Lecture control desk">
    <div className="kld-director-title"><span>DIRECTOR / INTERACTIVE SEQUENCE</span><h2>Learn by seeing.<br/>Then predict.</h2></div>
    <ol className="kld-cues">{lesson.cues.map((c,i)=><li key={c.id}><button type="button" aria-current={state.cue===c.id?'step':undefined} disabled={i>CUES.indexOf(state.cue)||(state.paused&&!state.stopped)} onClick={()=>act({type:'JUMP_BACK',cue:c.id})}><span>{String(i+1).padStart(2,'0')}</span><span>{STAGE_LABELS[c.id].split(' / ')[1]}</span><i aria-hidden="true">{state.cue===c.id?'●':'·'}</i></button></li>)}</ol>
    <div className="kld-controls"><button type="button" onClick={()=>act({type:'BACK'})} disabled={state.paused||state.stopped||state.cue==='INTRO'}>← Previous</button><button type="button" onClick={()=>act({type:'NEXT'})} disabled={!canNext}>Next cue →</button></div>
    <div className="kld-controls"><button type="button" onClick={()=>act({type:'SKIP'})} disabled={state.stopped||state.paused||!['INTRO','EXPLAIN','DEMONSTRATE'].includes(state.cue)}>Skip to prediction</button><button type="button" onClick={()=>act(state.stopped||state.paused?{type:'RESUME'}:{type:'PAUSE'})}>{state.stopped||state.paused?'▶ Resume':'Ⅱ Pause'}</button><button type="button" onClick={()=>{act({type:'REPLAY'});if(audioEnabled)teacher.say(cue.narration,'en-ZA');}} disabled={state.stopped}>Replay cue</button><button type="button" onClick={()=>act({type:'STOP'})} disabled={state.stopped}>Stop</button></div>
    <div className="kld-options"><label><input type="checkbox" checked={reading} onChange={e=>setReading(e.target.checked)}/> Reading-first layout</label><label><input type="checkbox" checked={reduced} onChange={e=>setReduced(e.target.checked)}/> Reduce motion</label><label><input type="checkbox" checked={audioEnabled} onChange={e=>{if(!e.target.checked)teacher.stop();setAudioEnabled(e.target.checked);}}/> Optional KAIRO narration</label>{audioEnabled&&<button type="button" onClick={readCue} disabled={state.stopped}>Read this cue with KAIRO</button>}</div>
    <div className="kld-limit">Text/transcript is always available. Narration uses the existing KAIRO teacher on explicit request, with cue-level—not word/viseme—synchronization.</div>
   </aside>
  </div>
  <section className="kld-task" aria-label="Learner action and feedback">
   <div className="kld-task-title"><span className="kld-overline">LEARNER ACTION / SOURCE-LINKED PRACTICE</span><h2 tabIndex={-1} ref={check?questionHeading:result?feedbackHeading:undefined}>{check?question:result?state.cue==='COMPLETE'?'Second application checked.':'Review your first prediction.':'Take the next cue when you are ready.'}</h2>
    <p>{check?'Select one answer; the calculation is hidden until you submit.':result?'KAIRO checks prepared calculations, not independent mastery.':'Every cue is manual. Pause, navigate back, or read the transcript before proceeding.'}</p></div>
   {check&&<fieldset disabled={state.stopped||state.paused||(second?state.second!==null:state.first!==null)}><legend>Choose the synchronous field speed</legend><div className="kld-answer-grid">{ANSWERS.map(option=><label key={option} className={answer===option?'kld-choice chosen':'kld-choice'}><input type="radio" name={'kld-answer-'+state.cue} checked={answer===option} onChange={()=>setAnswer(option)}/>{OPTION_LABELS[option]}</label>)}</div><button className="kld-primary" disabled={!answer||state.paused||state.stopped} onClick={submit}>Lock prediction & reveal feedback →</button></fieldset>}
   {result&&<div className="kld-result" role="status" aria-live="polite"><span>{checkedValue?'Prediction matched the prepared answer.':'Prediction differs from the prepared answer.'}</span><p>{cue.transcript}</p><p>Worked substitution: <strong>{second?'120 × 60 ÷ 4 = 1,800 r/min':'120 × 50 ÷ 4 = 1,500 r/min'}</strong>. This does not establish a measured rotor speed.</p>{state.cue==='REVEAL_FEEDBACK'&&<button className="kld-primary" onClick={()=>act({type:'NEXT'})} disabled={state.paused||state.stopped}>Try the prepared 60 Hz application →</button>}</div>}
   {state.cue==='COMPLETE'&&<div className="kld-summary"><p>Attempt 1: {OPTION_LABELS[state.first!]} · {correctFor(state,'first',lesson)?'matched':'needs review'}</p><p>Attempt 2: {OPTION_LABELS[state.second!]} · {correctFor(state,'second',lesson)?'matched':'needs review'}</p><strong>Two guided attempts saved — not a grade, credential or verified mastery.</strong><button onClick={()=>act({type:'RESET'})}>Start this chapter again</button></div>}
  </section>
  <div className="kld-footer"><p role="status">{saveStatus}</p><button onClick={exportProgress}>↓ Export versioned local progress</button><p>Device-scoped work only; no cloud persistence or real-world electrical equipment control.</p></div>
 </main>;
}
