import {Pause,Play,Square,Volume2} from 'lucide-react';
import type {EngineeringExplanation,TeachingIntent} from './teaching';

type Props={explanation:EngineeringExplanation;speaking:boolean;paused:boolean;status:string;returnLessonId?:string;onExplain:(intent:TeachingIntent)=>void;onRead:()=>void;onPause:()=>void;onStop:()=>void;onFocus:()=>void};
export default function EngineeringTeacher({explanation,speaking,paused,status,returnLessonId,onExplain,onRead,onPause,onStop,onFocus}:Props){
 return <section className="eng-part-card" aria-labelledby="eng-teacher-title">
  <h2 id="eng-teacher-title">Learn with KAIRO</h2>
  {returnLessonId&&/^[a-f0-9]{24}$/.test(returnLessonId)&&<p><a href={`/classroom?lesson=${returnLessonId}&tab=evidence`}>Return to my lesson working</a>. This prepared motor example has its own sources. It has not been checked against your uploaded lesson.</p>}
  <p>Ask about the part or experiment you have open.</p>
  <div className="eng-card-actions"><button type="button" onClick={()=>onExplain('part')}>Explain this part</button><button type="button" onClick={()=>onExplain('field-speed')}>Explain the calculation</button><button type="button" onClick={()=>onExplain('next')}>What should I try?</button></div>
  <h3>{explanation.title}</h3><p aria-live="polite">{explanation.text}</p>
  <div className="eng-card-actions"><button type="button" onClick={onRead}><Volume2 size={15} aria-hidden="true"/>Read explanation</button>{speaking&&<button type="button" onClick={onPause}>{paused?<Play size={15} aria-hidden="true"/>:<Pause size={15} aria-hidden="true"/>}{paused?'Resume':'Pause'}</button>}<button type="button" onClick={onStop}><Square size={15} aria-hidden="true"/>Stop</button><button type="button" onClick={onFocus}>Select the related part</button></div>
  {status&&<p role="status">{status}</p>}
  <details><summary>Sources and teaching limits</summary><p>Prepared explanations and a checked formula. This panel does not use a live AI conversation or control real equipment. English text uses your saved voice settings; it is not automatic translation. KAIRO’s portrait and optional 3D companion are available in the main guide.</p><ul>{explanation.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ul><a href="/sources">Bring your own material</a> · <a href="/teacher">Voice and access</a></details>
 </section>;
}
