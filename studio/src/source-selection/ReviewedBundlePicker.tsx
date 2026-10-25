import {useEffect,useId,useRef,useState} from 'react';
import {checkSelectedSources,reviewedChoice,toggleReviewedSource,
  type ReviewedChoice,type ReviewedSourceSummary} from './selection.mjs';

type SourceRef={sourceId:string;revision:string};
export type ReviewedCatalog={reviewedSourcesVersion:1;reviewedSources:ReviewedSourceSummary[]};
export type EvidenceExcerpt={
  id:string;sourceId:string;sourceRevision:string;title:string;
  locator:string;quote:string;start:number;end:number;edited:boolean;
};
export type BundlePreview={
  schemaVersion:2;kind:'reviewed-evidence-preview';bundleRevision:string;
  sourceRefs:SourceRef[];evidence:EvidenceExcerpt[];
  selection:{method:string;semantic:false;selectedCharacters:number};
  notice:string;
};
type Props={catalog:unknown;loading?:boolean;error?:string|null;onRefresh?:()=>void;request?:typeof fetch};
const ID=/^[a-f0-9]{24}$/;
const SHA=/^[a-f0-9]{64}$/;
function obj(value:unknown):value is Record<string,unknown>{
  return !!value&&typeof value==='object'&&!Array.isArray(value);
}
/** Browser metadata is only a display choice; never server authorization. */
export function parseReviewedCatalog(value:unknown):ReviewedSourceSummary[]|null{
  if(!obj(value)||value.reviewedSourcesVersion!==1||!Array.isArray(value.reviewedSources)||
     value.reviewedSources.length>100)return null;
  if(value.reviewedSourcesPage!==undefined){
    const page=value.reviewedSourcesPage;
    if(!obj(page)||!Number.isInteger(page.limit)||Number(page.limit)<1||Number(page.limit)>100||
       page.returned!==value.reviewedSources.length||typeof page.possiblyTruncated!=='boolean')return null;
  }
  const seen=new Set<string>(),result:ReviewedSourceSummary[]=[];
  for(const item of value.reviewedSources){
    if(!obj(item)||!ID.test(String(item.id||''))||!SHA.test(String(item.revision||''))||
       typeof item.title!=='string'||!item.title.trim()||item.title.length>120||
       !Number.isInteger(item.reviewedSectionCount)||Number(item.reviewedSectionCount)<1||
       Number(item.reviewedSectionCount)>120||item.reviewed!==true||
       item.deleted===true||item.revoked===true)return null;
    const source=item as ReviewedSourceSummary;
    if(seen.has(source.id)||!reviewedChoice(source))return null;
    seen.add(source.id);result.push(source);
  }
  return result;
}
function validPreview(value:unknown,refs:SourceRef[]):value is BundlePreview{
  if(!obj(value)||value.kind!=='reviewed-evidence-preview'||value.schemaVersion!==2||
     !SHA.test(String(value.bundleRevision||''))||!Array.isArray(value.sourceRefs)||
     value.sourceRefs.length!==refs.length||!Array.isArray(value.evidence)||
     value.evidence.length<1||value.evidence.length>12||
     !obj(value.selection)||value.selection.method!=='multi-source-lexical'||
     value.selection.semantic!==false||!Number.isInteger(value.selection.selectedCharacters)||
     typeof value.notice!=='string'||!value.notice.includes('not a generated or saved lesson'))return false;
  for(let i=0;i<refs.length;i++){
    const row=value.sourceRefs[i];
    if(!obj(row)||row.sourceId!==refs[i].sourceId||row.revision!==refs[i].revision)return false;
  }
  const allowed=new Map(refs.map(r=>[r.sourceId,r.revision]));
  let sum=0;const ids=new Set<string>();
  for(const row of value.evidence){
    if(!obj(row)||typeof row.id!=='string'||ids.has(row.id)||
       typeof row.sourceId!=='string'||!allowed.has(row.sourceId)||
       typeof row.sourceRevision!=='string'||row.sourceRevision!==allowed.get(row.sourceId)||
       !row.id.startsWith(row.sourceId+'-'+row.sourceRevision.slice(0,12)+'-S')||
       typeof row.title!=='string'||row.title.length>120||
       typeof row.locator!=='string'||!row.locator.trim()||row.locator.length>500||
       typeof row.quote!=='string'||!row.quote.trim()||row.quote.length>1400||
       !Number.isSafeInteger(row.start)||!Number.isSafeInteger(row.end)||
       Number(row.start)<0||Number(row.end)-Number(row.start)!==row.quote.length||
       typeof row.edited!=='boolean')return false;
    ids.add(row.id);sum+=row.quote.length;
    if(sum>12000)return false;
  }
  return value.selection.selectedCharacters===sum;
}
/** No cloud provider request, no save, no background operation. */
export async function requestLocalBundlePreview(
  selected:ReviewedChoice[],current:ReviewedSourceSummary[],goal:string,
  request:typeof fetch=fetch,signal?:AbortSignal,
):Promise<BundlePreview>{
  const check=checkSelectedSources(selected,current);
  if(!check.ok)throw new TypeError(check.problem||'Choose current reviewed sources.');
  if(typeof goal!=='string'||goal.length>1000)throw new TypeError('Keep the study question below 1,000 characters.');
  const response=await request('/api/workspace/bundle-preview',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({schemaVersion:2,mode:'local',sourceRefs:check.sourceRefs,goal}),signal,
  });
  if(!response.ok)throw new Error(response.status===409?
    'A source revision changed. Refresh and review it again.':
    response.status===401||response.status===403?
    'Sign in to preview your own reviewed sources.':
    'The preview could not finish. Your sources were not changed.');
  const raw=await response.text();
  if(raw.length>36000)throw new TypeError('The excerpt preview was larger than expected.');
  let value:unknown;
  try{value=JSON.parse(raw);}catch{throw new TypeError('The preview response could not be read.');}
  if(!validPreview(value,check.sourceRefs))throw new TypeError('The preview has invalid source references. Nothing was saved.');
  return value;
}
export function BundleEvidencePreview({preview}:{preview:BundlePreview}){
  return <section aria-label="Private reviewed passage preview">
    <h3>Selected source passages</h3>
    <p>This is a read-only excerpt preview, not a generated or saved lesson. Only selected reviewed sources were searched with bounded lexical matching. A quote alone is not proof an explanation is correct.</p>
    <ol>{preview.evidence.map(e=><li key={e.id}>
      <strong>{e.title}</strong> — {e.locator} (revision {e.sourceRevision.slice(0,12)})
      <blockquote>{e.quote}</blockquote>
    </li>)}</ol>
  </section>;
}
export default function ReviewedBundlePicker({catalog,loading=false,error=null,onRefresh,request}:Props){
  const current=parseReviewedCatalog(catalog);
  const [chosen,setChosen]=useState<ReviewedChoice[]>([]);
  const [goal,setGoal]=useState('');
  const [preview,setPreview]=useState<BundlePreview|null>(null);
  const [message,setMessage]=useState('Choose reviewed material for a private passage preview.');
  const [working,setWorking]=useState(false);
  const active=useRef<AbortController|null>(null);
  const id=useId();
  useEffect(()=>()=>{active.current?.abort();},[]);
  const check=checkSelectedSources(chosen,current);
  function cancel(){
    active.current?.abort();active.current=null;
    setWorking(false);setPreview(null);
    setMessage('Preview stopped. No lesson was created or saved.');
  }
  function toggle(item:ReviewedSourceSummary){
    if(working)return;
    setPreview(null);
    try{setChosen(selected=>toggleReviewedSource(selected,item));setMessage('Selection changed. Preview again to check current revisions.');}
    catch(e){setMessage(e instanceof Error?e.message:'Selection unavailable. Refresh the list.');}
  }
  async function showPreview(){
    if(working||loading||!current||!check.ok)return;
    const controller=new AbortController();active.current=controller;setWorking(true);setPreview(null);
    setMessage('Checking current reviewed revisions and selected passages…');
    try{
      const result=await requestLocalBundlePreview(chosen,current,goal,request,controller.signal);
      if(!controller.signal.aborted){setPreview(result);setMessage('Private passage preview ready. No lesson was generated or saved.');}
    }catch(e){
      if(!controller.signal.aborted){setMessage(e instanceof Error?e.message:'Preview failed. Nothing was saved.');}
    }finally{if(active.current===controller){active.current=null;setWorking(false);}}
  }
  const invalid=chosen.length>0&&!check.ok;
  return <section aria-labelledby={id+'-heading'}>
    <h2 id={id+'-heading'}>Choose reviewed study sources</h2>
    <p>Select up to eight current reviewed sources from your account. Original uploads are not sent to a model to preview passages.</p>
    <p role="status" aria-live="polite">{message}</p>
    {error?<p role="alert">{error}</p>:null}
    {loading?<p>Loading reviewed material…</p>:current===null?
      <p role="alert">Reviewed material status is unavailable. Refresh before making a selection.</p>:null}
    {current&&current.length===0?<p>No reviewed sources yet. Check and save your material before trying this preview.</p>:null}
    {current&&current.length>0?<fieldset disabled={loading||working}>
      <legend>Reviewed sources ({chosen.length} of 8 selected)</legend>
      <ol>{current.map(item=>{
        const selected=chosen.some(x=>x.sourceId===item.id&&x.revision===item.revision);
        const outdated=chosen.some(x=>x.sourceId===item.id&&x.revision!==item.revision);
        return <li key={item.id}>
          <label><input type="checkbox" checked={selected}
            disabled={(!selected&&chosen.length>=8)||outdated}
            onChange={()=>toggle(item)}/>
            {item.title} — {item.reviewedSectionCount} reviewed sections
            <small> (revision {item.revision.slice(0,12)})</small>
          </label>
          {outdated?<span> This source changed; refresh and choose it again.</span>:null}
        </li>;
      })}</ol>
    </fieldset>:null}
    <label htmlFor={id+'-goal'}>What do you want to understand?</label>
    <input id={id+'-goal'} type="text" value={goal} maxLength={1000}
      disabled={working||loading||current===null}
      onChange={event=>{setGoal(event.target.value);setPreview(null);}}
      placeholder="For example: explain what changes motor speed"/>
    {invalid?<p role="alert">{check.problem}</p>:null}
    <div>
      <button type="button" onClick={()=>void showPreview()}
        disabled={loading||working||!current||!check.ok}>Preview private passages</button>
      {working?<button type="button" onClick={cancel}>Cancel preview</button>:null}
      {onRefresh?<button type="button" disabled={working} onClick={()=>{
        cancel();setChosen([]);onRefresh();setMessage('Refreshing reviewed source revisions…');
      }}>Refresh sources</button>:null}
    </div>
    {preview&&!invalid?<BundleEvidencePreview preview={preview}/>:null}
    <p>No provider call or lesson save occurs here. Generated multi-source lessons will be offered only after the separate authenticated v2 lesson flow is verified.</p>
    <p>Revision changed? Refresh and review the source again. Existing single-source lessons remain separate.</p>
  </section>;
}
