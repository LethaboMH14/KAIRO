import {learnerStorage} from '../account/storage.ts';
import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Layers3, Pause, Play, Volume2 } from 'lucide-react';
import './lecture.css';
const Room = lazy(() => import('./LectureScene'));
export const chapters = [
  { title: 'Start with a question.', board: 'What happens after a click?', detail: 'You ask an app for lessons about databases. A click starts a conversation between your browser and a server.', diagram: 'BROWSER → REQUEST' },
  { title: 'Give the request a route.', board: 'The API receives your request.', detail: 'The application checks the topic and passes it to a database query as a parameter. The topic remains data, separate from SQL instructions.', diagram: 'REQUEST → API → QUERY' },
  { title: 'Find what matters.', board: 'SELECT lessons WHERE topic = ?', detail: 'The database compares the topic with its lesson catalogue. It returns matching rows. No matches means an empty result, not necessarily a broken request.', diagram: 'QUERY → DATABASE → ROWS' },
  { title: 'Bring understanding back.', board: 'Rows → JSON → your screen.', detail: 'The API turns rows into a response. The browser can display the result as useful lesson cards. Open the Computer Science Studio to execute this query yourself.', diagram: 'ROWS → API → BROWSER' },
];
class RoomBoundary extends Component<{children:ReactNode;onFallback:()=>void},{failed:boolean}> {
  state={failed:false}; static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<div className="lecture-loading"><p>The room could not load.</p><button onClick={this.props.onFallback}>Continue in reading view</button></div>:this.props.children;}
}
export default function LectureStudio() {
  useEffect(()=>{document.title='KAIRO · Lecture Theatre';},[]);
  const [step,setStep]=useState(0),[playing,setPlaying]=useState(false),[reading,setReading]=useState(false);
  const [view,setView]=useState('seat'),[answer,setAnswer]=useState('');
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [voice,setVoice]=useState(false),[saved,setSaved]=useState(false);
  useEffect(()=>{try {const n=Number(learnerStorage.getItem('kairo-lecture-step'));if(Number.isInteger(n)&&n>=0&&n<4)setStep(n);setSaved(learnerStorage.getItem('kairo-lecture-complete')==='yes');}catch{}},[]);
  useEffect(()=>{try{learnerStorage.setItem('kairo-lecture-step',String(step));}catch{}},[step]);
  useEffect(()=>{
    if(!playing)return;
    let timer:number|undefined;
    const next=()=>{if(step===3)setPlaying(false);else setStep(s=>s+1);};
    if(voice&&'speechSynthesis' in window){const speech=new SpeechSynthesisUtterance(chapters[step].detail);speech.rate=.94;speech.onend=next;speech.onerror=()=>setPlaying(false);speechSynthesis.cancel();speechSynthesis.speak(speech);}
    else timer=window.setTimeout(next,11000);
    return ()=>{clearTimeout(timer);window.speechSynthesis?.cancel();};
  },[step,playing,voice]);
  useEffect(()=>()=>window.speechSynthesis?.cancel(),[]);
  function jump(n:number){setPlaying(false);setStep(n);}
  function assess(value:string){setAnswer(value);if(value==='empty'){try{learnerStorage.setItem('kairo-lecture-complete','yes');setSaved(true);}catch{setSaved(false);}}}
  return <div className="lecture-studio">
    <header className="lecture-header"><a href="/" className="brand"><span className="brand-symbol">k</span>KAIRO<span className="brand-access">ACCESS</span></a><nav aria-label="Studios"><a href="/">Computer Science</a><a href="/classroom">Learn with KAIRO</a><span aria-current="page">Lecture Theatre</span></nav><span className="lecture-number">STUDIO / 02</span></header>
    <main className="lecture-main"><div className="lecture-heading"><div><p className="lecture-eyebrow">A PLACE TO THINK TOGETHER</p><h1>Take your seat.<br/><span>Follow the idea.</span></h1></div><p>A familiar classroom. A different way to learn.<br/>Move through a prepared lesson at your own pace.</p></div>
    <div className="lecture-layout"><section className="lecture-room" aria-label="Interactive lecture theatre"><div className="lecture-room-toolbar"><span><i/> {reading?'READING VIEW':'CLASSROOM / DAYLIGHT'}</span><button onClick={()=>setReading(!reading)}><Layers3 size={15}/>{reading?'Enter the room':'Reading view'}</button></div>
      <div className="lecture-viewport"><div className={reading?'lecture-canvas is-hidden':'lecture-canvas'} aria-hidden={reading}><RoomBoundary onFallback={()=>setReading(true)}><Suspense fallback={<div className="lecture-loading">Opening the classroom…</div>}><Room step={step} view={view} reduced={reduced||reading}/></Suspense></RoomBoundary></div>
      {reading&&<article className="lecture-reading"><BookOpen size={28}/><p>CHAPTER {step+1} / 04</p><h2>{chapters[step].board}</h2><code>{chapters[step].diagram}</code><p>{chapters[step].detail}</p></article>}</div>
      <div className="lecture-camera-bar"><div role="group" aria-label="Camera positions">{[['seat','Your seat'],['front','Front row'],['overview','Room overview']].map(([id,label])=><button key={id} aria-pressed={view===id} onClick={()=>{setView(id);setReading(false);}}>{label}</button>)}</div><label><input type="checkbox" checked={reduced} onChange={e=>setReduced(e.target.checked)}/> Reduce motion</label></div>
      <div className="lecture-caption" aria-live="polite"><span className="lecture-guide">K</span><div><strong>{chapters[step].title}</strong><p>{chapters[step].detail}</p></div></div></section>
      <aside className="lecture-program"><p className="lecture-eyebrow">TODAY’S SHORT LECTURE</p><h2>The journey<br/>behind a click.</h2><p className="lecture-duration">4 chapters · Prepared lesson</p><div className="lecture-chapters">{chapters.map((c,i)=><button key={c.title} className={step===i?'selected':''} onClick={()=>jump(i)} aria-current={step===i?'step':undefined}><span>{String(i+1).padStart(2,'0')}</span><div>{c.title}<small>{['The browser','The application','The database','The response'][i]}</small></div><ArrowRight size={15}/></button>)}</div>
      <button className="lecture-play" onClick={()=>{if(step===3&&!playing)setStep(0);setPlaying(!playing);}}>{playing?<Pause size={17}/>:<Play size={17}/>} {playing?'Pause the lecture':'Play the lecture'}</button><label className="lecture-voice"><input type="checkbox" checked={voice} onChange={e=>setVoice(e.target.checked)}/><Volume2 size={15}/> Browser narration</label><p className="lecture-note">With narration off, chapters advance every 11 seconds. Pause or select a chapter whenever you need.</p><div className="lecture-step-controls"><button onClick={()=>jump(step-1)} disabled={step===0} aria-label="Previous chapter"><ArrowLeft size={18}/></button><span>{step+1} / 4</span><button onClick={()=>jump(step+1)} disabled={step===3} aria-label="Next chapter"><ArrowRight size={18}/></button></div></aside></div>
    <section className="lecture-reflection"><div><p className="lecture-eyebrow">BEFORE YOU GO</p><h2>Nothing came back.<br/>Did something break?</h2><p>A request succeeds, but there are no lessons for the topic. What can the database return?</p></div><fieldset><legend>Choose an answer</legend>{[['failure','It must always report a server error.'],['empty','A successful result containing zero rows.']].map(([id,label])=><label key={id}><input type="radio" name="lecture-check" checked={answer===id} onChange={()=>assess(id)}/>{label}</label>)}{answer&&<p role="status">{answer==='empty'?'Correct. A valid query can return an empty result.':'Try again. A successful query does not need to find a match.'}</p>}{saved&&<span className="lecture-saved"><Check size={14}/> Lesson completed · saved in this browser</span>}</fieldset><a href="/">Try the real query <ArrowRight size={16}/></a></section>
    <footer><span>Classroom by Christophe Seux · CC0 · Converted from Blender for this preview</span><a href="/models/classroom/provenance.json" target="_blank" rel="noreferrer">Asset provenance</a></footer></main>
  </div>;
}
