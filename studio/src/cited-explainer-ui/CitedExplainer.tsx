import {useEffect,useMemo,useReducer,useRef,useState} from 'react';
import {passageSeconds,readingReducer,validateExplainer,type ExplainerProps} from './model';
import './cited-explainer.css';
export type CitedExplainerProps = ExplainerProps & { onRead:(text:string)=>void; onStop:()=>void };
function prefersReducedMotion(){return typeof matchMedia!=='undefined'&&matchMedia('(prefers-reduced-motion: reduce)').matches;}
export default function CitedExplainer({lessonId,revision,title,passages,onRead,onStop}:CitedExplainerProps){
 const checked=useMemo(()=>validateExplainer({lessonId,revision,title,passages}),[lessonId,revision,title,passages]);
 const [state,dispatch]=useReducer(readingReducer,{index:0,playing:false,textOnly:prefersReducedMotion()});
 const [systemReduced,setSystemReduced]=useState(prefersReducedMotion);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);const stopRef=useRef(onStop);stopRef.current=onStop;
 useEffect(()=>{const query=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setSystemReduced(query.matches);query.addEventListener?.('change',update);return()=>query.removeEventListener?.('change',update);},[]);
 useEffect(()=>{dispatch({type:'reset'});stopRef.current();},[lessonId,revision]);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);stopRef.current();},[]);
 const count=checked.ok?checked.value.passages.length:0;
 const index=count?state.index%count:0;
 const current=checked.ok?checked.value.passages[index]:undefined;
 useEffect(()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;if(!state.playing||!current)return;timer.current=setTimeout(()=>{stopRef.current();dispatch({type:'next',count});},passageSeconds(current.quote)*1000);return()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;};},[state.playing,index,lessonId,revision,count,current?.id,current?.quote]);
 const stopAnd=(action:Parameters<typeof dispatch>[0])=>{stopRef.current();dispatch(action);};
 const reduced=systemReduced||state.textOnly;
 if(!checked.ok)return <section className="cited-explainer" aria-label="Cited reading"><h2>Read the lesson text</h2><p role="status">{checked.reason}</p></section>;
 return <section className={`cited-explainer${reduced?' cited-explainer--still':''}`} aria-label="Cited lesson reading">
  <header className="cited-explainer__header"><div><p className="cited-explainer__eyebrow"><span aria-hidden="true">✦</span> KAIRO · cited reading</p><h2>{title}</h2></div><span className="cited-explainer__count">Passage {index+1} of {count}</span></header>
  <div className={`cited-explainer__stage${state.playing&&!reduced?' is-playing':''}`} aria-live="polite" aria-atomic="true" key={`${lessonId}:${revision}:${current!.id}`}>
   <p className="cited-explainer__quote">{current!.quote}</p>
   <footer><strong>{current!.sourceTitle}</strong><span>{current!.locator}</span></footer>
  </div>
  <p className="cited-explainer__estimate">Reading estimate: about {passageSeconds(current!.quote)} seconds at 150 words per minute.</p>
  <div className="cited-explainer__controls" aria-label="Reading controls">
   <button type="button" onClick={()=>stopAnd({type:'previous',count})}><span aria-hidden="true">←</span> Previous</button>
   {state.playing?<button type="button" onClick={()=>stopAnd({type:'pause'})}><span aria-hidden="true">Ⅱ</span> Pause</button>:<button type="button" onClick={()=>dispatch({type:'play'})}><span aria-hidden="true">▶</span> Play</button>}
   <button type="button" onClick={()=>stopAnd({type:'next',count})}>Next <span aria-hidden="true">→</span></button>
   <button type="button" aria-pressed={reduced} disabled={systemReduced} onClick={()=>dispatch({type:'toggleTextOnly'})}>{systemReduced?'Reduced motion (system)':state.textOnly?'Use motion':'Text only'}</button>
   <button type="button" onClick={()=>{if(current){stopRef.current();dispatch({type:'pause'});onRead(current.quote);}}}><span aria-hidden="true">♪</span> Read this passage with KAIRO</button>
  </div>
  <details className="cited-explainer__all"><summary>Read all cited passages</summary>{passages.map(p=><article key={p.id}><h3>{p.sourceTitle}</h3><p>{p.quote}</p><small>{p.locator}</small></article>)}</details>
  <p className="cited-explainer__note">This is a text-led reading animation. It does not create a video or simulation.</p>
 </section>;
}




