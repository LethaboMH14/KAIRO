import {useState} from 'react';
import motor from './packs/motor.json';
import pump from './packs/pump.json';
export default function StudioLessonPlan({studio,onRead,onStep}:{studio:'motor'|'pump';onRead:(text:string)=>void;onStep?:(step:number)=>void}){
 const pack=studio==='motor'?motor:pump,[step,setStep]=useState(0),current=pack.steps[step];
 return <section className="eng-part-card ka-guided-plan" aria-label="Prepared source-linked studio lesson"><h2>{pack.title}</h2><p>{pack.objective}</p><nav aria-label="Studio lesson steps">{pack.steps.map((item,i)=><button key={item.id} aria-current={step===i?'step':undefined} onClick={()=>{setStep(i);onStep?.(i);}}>{i+1}. {item.title}</button>)}</nav><h3>{current.title}</h3><p>{current.explanation}</p><p><strong>Try this:</strong> {current.learnerAction}</p><button onClick={()=>onRead(`${current.explanation} ${current.learnerAction}`)}>Read this step with KAIRO</button><details><summary>Check the sources for this step</summary><ul>{pack.sourceRefs.filter(ref=>current.sourceRefIds.includes(ref.id)).map(ref=><li key={ref.id}><a href={ref.url} target="_blank" rel="noreferrer">{ref.locator}</a></li>)}</ul></details><p className="ka-small">Prepared activity with its own citations. Not a simulation generated from your uploaded material, an official mark or equipment instruction.</p></section>;
}
