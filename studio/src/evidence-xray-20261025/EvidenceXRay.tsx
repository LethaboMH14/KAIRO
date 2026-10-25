import {useEffect,useMemo,useRef,useState} from 'react';
import type {KeyboardEvent} from 'react';
import {advanceAttempt,checkCurrentSources,chooseAttempt,makeGraph,startAttempts,submitAttempt,unsupportedClaim} from './core.mjs';
import type {Citation,XRayActivity,XRayGraphNode} from './core.mjs';
import './EvidenceXRay.css';

type Props={activity:XRayActivity;currentCatalog?:unknown;onReturn?:()=>void};
const shortRevision=(s:string)=>s.slice(0,12);
const statusLabel=(c:Citation)=>c.edited?'Reviewed edit':'Reviewed passage';

export default function EvidenceXRay({activity,currentCatalog,onReturn}:Props){
 const graph=useMemo(()=>makeGraph(activity),[activity]);
 const [activeNode,setActiveNode]=useState<string|null>(null);
 const [selectedCitation,setSelectedCitation]=useState<string|null>(activity.evidence[0]?.id??null);
 const [attempt,setAttempt]=useState(()=>startAttempts(activity));
 const [view,setView]=useState<'map'|'list'>('map');
 const [expanded,setExpanded]=useState(false);
 const [panel,setPanel]=useState<'source'|'inspector'|null>(null);
 const [draftClaim,setDraftClaim]=useState('');
 const sourceTitleRef=useRef<HTMLHeadingElement>(null),inspectorTitleRef=useRef<HTMLHeadingElement>(null);
 const nodeRefs=useRef(new Map<string,HTMLButtonElement>());
 const firstOptionRef=useRef<HTMLButtonElement>(null);
 const current=currentCatalog===undefined||activity.mode==='prepared'?{ok:true,reason:null}:checkCurrentSources(activity,currentCatalog);
 useEffect(()=>{setAttempt(startAttempts(activity));setActiveNode(null);setSelectedCitation(activity.evidence[0]?.id??null);setPanel(null);},[activity]);
 useEffect(()=>{
  if(!current.ok)return;
  if(panel==='source')sourceTitleRef.current?.focus();
  if(panel==='inspector')inspectorTitleRef.current?.focus();
 },[panel,activeNode,selectedCitation,current.ok]);
 const evidence=activity.evidence.find(e=>e.id===selectedCitation)||activity.evidence[0];
 const activeConcept=activity.concepts.find(c=>'concept:'+c.id===activeNode);
 const challenge=activity.mode==='prepared'?activity.challenges[attempt.round]:null;
 const isPrepared=activity.mode==='prepared';
 const selectSource=(id:string,shouldFocus=true)=>{
  setSelectedCitation(id);setActiveNode('evidence:'+id);if(shouldFocus)setPanel('source');
 };
 function activate(node:XRayGraphNode){
  setActiveNode(node.id);
  if(node.type==='source'){setSelectedCitation(node.evidenceIds[0]);setPanel('source');}
  else if(node.type==='concept'){
   if(node.evidenceIds.length)setSelectedCitation(node.evidenceIds[0]);
   setPanel('inspector');
  }else setPanel('inspector');
 }
 function keys(event:KeyboardEvent<HTMLButtonElement>,index:number,nodes:XRayGraphNode[]){
  if(!['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End','Escape'].includes(event.key))return;
  event.preventDefault();
  if(event.key==='Escape'){setPanel(null);return;}
  const next=event.key==='Home'?0:event.key==='End'?nodes.length-1:
   (index+(event.key==='ArrowRight'||event.key==='ArrowDown'?1:-1)+nodes.length)%nodes.length;
  nodeRefs.current.get(nodes[next].id)?.focus();
 }
 function closePanel(){
  setPanel(null);
  if(activeNode)nodeRefs.current.get(activeNode)?.focus();
 }
 function nextRound(){
  const final=attempt.round===activity.challenges.length-1;
  setAttempt(s=>advanceAttempt(activity,s));
  setPanel('inspector');
  if(final)inspectorTitleRef.current?.focus();
  else firstOptionRef.current?.focus();
 }
 const edgeVisible=(edge:{id:string;kind:string})=>edge.kind!=='question'||
  Boolean(attempt.feedback&&edge.id==='question:'+activity.challenges[attempt.round]?.id);
 const lookup=new Map(graph.nodes.map(n=>[n.id,n]));
 return <main className={'kairo-xray'+(expanded?' xray-expanded':'')} aria-label="KAIRO Evidence X-Ray">
  <header className="xray-top">
   <div className="xray-brand"><span className="xray-sigil" aria-hidden="true">✳</span> KAIRO <span> / EVIDENCE LAB</span></div>
   <div className="xray-header-actions">
    <span className="xray-status"><span className="xray-status-dot"/> {isPrepared?'PREPARED TEACHING EXAMPLE':'OWNER-AUTHENTICATED PREVIEW'}</span>
    <button type="button" className="xray-quiet" onClick={()=>setExpanded(x=>!x)} aria-pressed={expanded}>{expanded?'Exit wide view':'Expand workspace'}</button>
    {onReturn?<button type="button" className="xray-quiet" onClick={onReturn}>Return to learning</button>:null}
   </div>
  </header>
  <section className="xray-intro" aria-labelledby="xray-heading">
   <div><p className="xray-eyebrow">THE PROVENANCE EDITION <span> / 01</span></p>
    <h1 id="xray-heading">Follow the <em>evidence.</em></h1>
    <p>Explore what a source actually says. Trace a connection. Test a claim before seeing its evidence key.</p></div>
   <div className="xray-intro-count"><strong>{activity.concepts.length.toString().padStart(2,'0')}</strong><span>CURATED CONCEPTS</span><strong>{activity.evidence.length.toString().padStart(2,'0')}</strong><span>SOURCE EXCERPTS</span></div>
  </section>
  <p className="xray-disclosure" role="status">{activity.disclosure} All attempts are <strong>local, unsaved and unverified</strong>.</p>
  {!current.ok?<section className="xray-blocked" role="alert"><h2>Source access has changed</h2><p>{current.reason}</p><p>Private excerpts are hidden until a new authenticated preview is requested.</p></section>:
  <div className="xray-columns">
   <section className="xray-source" aria-labelledby="xray-source-heading">
    <div className="xray-panel-top"><span>01 / SOURCE LENS</span><span>TRACEABLE TEXT</span></div>
    <h2 id="xray-source-heading" ref={sourceTitleRef} tabIndex={-1}>The record<span className="xray-punctuation">.</span></h2>
    <p className="xray-panel-caption">Only authorized, selected excerpts appear here. Selecting a pathway brings its exact quote into focus.</p>
    {evidence?<article className="xray-document" aria-label="Selected exact source excerpt">
     <div className="xray-document-cap"><span className="xray-file-icon" aria-hidden="true">≡</span><span>{evidence.title}</span></div>
     <div className="xray-document-meta"><span>{evidence.locator}</span><span>{statusLabel(evidence)}</span></div>
     <blockquote className="xray-quote"><span aria-hidden="true" className="xray-open-quote">“</span><mark>{evidence.quote}</mark></blockquote>
     <div className="xray-citation"><span>UTF-16 {evidence.start}–{evidence.end}</span><span>REV {shortRevision(evidence.sourceRevision)}</span></div>
     <p className="xray-document-note">Exact returned quote, not surrounding document content. Browser display does not independently verify the server's review.</p>
    </article>:<p>No authorized excerpt available.</p>}
    <h3 className="xray-mini-title">SOURCE INDEX <span>{activity.evidence.length} EXCERPTS</span></h3>
    <ol className="xray-source-index">{activity.evidence.map((e,i)=><li key={e.id}>
     <button type="button" aria-current={selectedCitation===e.id?'true':undefined} onClick={()=>selectSource(e.id)}>
      <span className="xray-index-number">{String(i+1).padStart(2,'0')}</span><span><strong>{e.locator}</strong><small>{e.title} · {shortRevision(e.sourceRevision)}</small></span>
      <span aria-hidden="true">↗</span>
     </button>
    </li>)}</ol>
   </section>
   <section className="xray-center" aria-labelledby="xray-map-heading">
    <div className="xray-panel-top"><span>02 / EVIDENCE CONSTELLATION</span><span>CURATED LINKS ONLY</span></div>
    <div className="xray-map-head"><div><h2 id="xray-map-heading">Ideas, <em>connected.</em></h2><p>Solid = linked to curated evidence. Dashed = not established.</p></div>
     <div className="xray-switch" role="group" aria-label="Constellation view">
      <button type="button" aria-pressed={view==='map'} onClick={()=>setView('map')}>Map</button>
      <button type="button" aria-pressed={view==='list'} onClick={()=>setView('list')}>List</button>
     </div>
    </div>
    {view==='map'?<div className="xray-map" role="group" aria-label="Interactive evidence constellation; use Tab or arrow keys between nodes">
     <div className="xray-map-orbit" aria-hidden="true"/>
     <svg className="xray-lines" viewBox="0 0 960 600" preserveAspectRatio="none" aria-hidden="true">
      {graph.edges.filter(edgeVisible).map(edge=>{
       const from=lookup.get(edge.from),to=lookup.get(edge.to);
       if(!from||!to)return null;
       const isActive=activeNode===edge.from||activeNode===edge.to;
       return <line key={edge.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
        className={'xray-wire xray-wire-'+edge.kind+(isActive?' xray-wire-active':'')}/>;
      })}
     </svg>
     {graph.nodes.map((node,index)=><button key={node.id} ref={el=>{if(el)nodeRefs.current.set(node.id,el);else nodeRefs.current.delete(node.id);}}
       className={'xray-node xray-node-'+node.type+(activeNode===node.id?' xray-node-selected':'')}
       style={{left:node.x/960*100+'%',top:node.y/600*100+'%'}}
       type="button" aria-pressed={activeNode===node.id}
       aria-label={node.type==='concept'?'Concept: '+node.label:node.type==='source'?'Source: '+node.label:'Challenge '+node.label}
       onKeyDown={ev=>keys(ev,index,graph.nodes)} onClick={()=>activate(node)}>
       <span className="xray-node-glyph" aria-hidden="true">{node.type==='concept'?'◇':node.type==='source'?'▣':'?'}</span>
       <span className="xray-node-label">{node.label}</span>
      </button>)}
     {!graph.nodes.length?<div className="xray-map-empty">No curated concept mapping for private uploads. Explore the reviewed excerpt index instead.</div>:null}
    </div>:<div className="xray-linear" role="region" aria-label="Accessible linear evidence constellation">
     {activity.concepts.length?<ol>{activity.concepts.map(c=><li key={c.id}>
      <button type="button" onClick={()=>activate(graph.nodes.find(n=>n.id==='concept:'+c.id)!)}><strong>{c.label}</strong><span>{c.summary}</span></button>
      {c.evidenceIds.length?<ul>{c.evidenceIds.map(id=><li key={id}><button type="button" onClick={()=>selectSource(id)}>{activity.evidence.find(e=>e.id===id)?.locator} — open exact evidence</button></li>)}</ul>:<p className="xray-unverified">{unsupportedClaim()}</p>}
     </li>)}</ol>:<p>No prepared concepts were certified for this owner preview. Exact source excerpts remain available in the Source Lens.</p>}
     {activity.relations.filter(r=>r.kind==='unverified').map(r=><p className="xray-unverified" key={r.from+'-'+r.to}>{r.from} → {r.to}: {unsupportedClaim()}</p>)}
    </div>}
    <div className="xray-legend"><span><i className="xray-legend-concept"/> Curated concept</span><span><i className="xray-legend-source"/> Exact source</span><span><i className="xray-legend-query"/> Question</span><span><i className="xray-legend-unknown"/> Unverified link</span></div>
    {activeConcept?<div className="xray-concept-readout" aria-live="polite"><span>CONCEPT INSPECTOR</span><h3>{activeConcept.label}</h3><p>{activeConcept.summary}</p>
     {activeConcept.evidenceIds.length?activeConcept.evidenceIds.map(id=><button key={id} type="button" onClick={()=>selectSource(id)}>Inspect cited quote · {activity.evidence.find(e=>e.id===id)?.locator}</button>):<p>{unsupportedClaim()}</p>}</div>:null}
    {panel?<button type="button" className="xray-return-focus" onClick={closePanel}>Return keyboard focus to selected constellation node</button>:null}
   </section>
   <section className="xray-inspector" aria-labelledby="xray-inspector-heading">
    <div className="xray-panel-top"><span>03 / LEARNING INSPECTOR</span><span>THINK → CHECK</span></div>
    <h2 id="xray-inspector-heading" ref={inspectorTitleRef} tabIndex={-1}>Make your <em>case.</em></h2>
    {isPrepared&&challenge?<div className="xray-challenge">
     <div className="xray-progress" aria-label={'Round '+(attempt.round+1)+' of 2'}><span className={attempt.round===0?'on':''}/><span className={attempt.round===1?'on':''}/></div>
     <p className="xray-round">EVIDENCE TEST / {String(attempt.round+1).padStart(2,'0')} OF 02</p>
     <p className="xray-claim">{challenge.claim}</p>
     <h3>{attempt.completed?'Both rounds attempted':attempt.feedback?'Evidence reviewed':'Which excerpt supports this claim?'}</h3>
     {!attempt.completed&&!attempt.feedback?<><div className="xray-options" role="group" aria-label="Choose an excerpt before feedback">
      {activity.evidence.map((e,i)=><button key={e.id} type="button" ref={i===0?firstOptionRef:undefined}
       className={attempt.selectedEvidenceId===e.id?'selected':''} aria-pressed={attempt.selectedEvidenceId===e.id}
       onClick={()=>setAttempt(s=>chooseAttempt(activity,s,e.id))}>
       <span>{String(i+1).padStart(2,'0')}</span><span><strong>{e.locator}</strong><small>{e.quote.slice(0,105)}{e.quote.length>105?'…':''}</small></span></button>)}
     </div><button type="button" className="xray-primary" disabled={!attempt.selectedEvidenceId}
      onClick={()=>setAttempt(s=>submitAttempt(activity,s))}>Check my evidence <span aria-hidden="true">↗</span></button>
      <p className="xray-hint">Choose first. The curated answer is hidden until you check.</p></>:
     attempt.feedback?<div className="xray-feedback" role="status">
      <p className="xray-feedback-label">{attempt.feedback.correct?'SUPPORTED CHOICE':'REVISIT THE EVIDENCE'}</p>
      <h3>{attempt.feedback.correct?'Your selection matches the prepared key.':'That excerpt does not match the prepared key.'}</h3>
      <p>{attempt.feedback.why}</p>
      <button type="button" onClick={()=>selectSource(attempt.feedback!.answerEvidenceId)}>
       Open exact supporting quote · {activity.evidence.find(e=>e.id===attempt.feedback!.answerEvidenceId)?.locator}
      </button>
      <p className="xray-hint">An exercise key is not independent factual certification.</p>
      <button type="button" className="xray-primary" onClick={nextRound}>{attempt.round===0?'Try the second claim':'Finish local practice'} <span aria-hidden="true">↗</span></button>
     </div>:<div className="xray-complete" role="status"><span className="xray-complete-star" aria-hidden="true">✳</span><h3>Two attempts complete.</h3>
      <p>This was a local, unsaved, unverified exercise. No score or mastery credential was created.</p>
      <button type="button" className="xray-primary" onClick={()=>{setAttempt(startAttempts(activity));setPanel('inspector');}}>Try again</button>
     </div>}
    </div>:<div className="xray-challenge"><p className="xray-round">PRIVATE EXCERPT INSPECTION</p>
     <h3>Evidence is not an automatic answer key.</h3><p>Private source previews expose exact authorized passages. No prepared claim-to-evidence exercise has been certified for these sources.</p>
     <label className="xray-claim-label" htmlFor="xray-new-claim">Explore an unsupported claim (local only)</label>
     <textarea id="xray-new-claim" value={draftClaim} maxLength={240} onChange={e=>setDraftClaim(e.target.value)} placeholder="Write a claim to check…"/>
     <p role="status">{draftClaim.trim()?unsupportedClaim():'Enter a claim to see the evidence boundary.'}</p>
    </div>}
    <div className="xray-inspector-bottom"><span>REVIEW STATE</span><strong>UNSAVED / LOCAL-UNVERIFIED</strong><small>No analytics, persistence or model calls from this component.</small></div>
   </section>
  </div>}
  <footer className="xray-footer"><span>KAIRO ACCESS / EVIDENCE X-RAY</span><span>TRACE THE CLAIM · INSPECT THE QUOTE · OWN THE REASONING</span><span>DEVELOPMENT PREVIEW / NOT SAVED</span></footer>
 </main>;
}
