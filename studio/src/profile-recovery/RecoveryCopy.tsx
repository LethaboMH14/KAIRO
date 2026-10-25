import {useState} from 'react';
import {prepareRawProgressRecovery} from './raw-progress';

/** User-initiated local preservation only; never repairs or replaces saved progress. */
export default function RecoveryCopy(){
 const [acknowledged,setAcknowledged]=useState(false),[status,setStatus]=useState('');
 function download(){
  setStatus('');if(!acknowledged)return;
  const prepared=prepareRawProgressRecovery();
  if(prepared.status!=='ready'){
   setStatus(prepared.status==='missing'?'No saved progress was found at this address. Nothing was downloaded.':prepared.status==='too-large'?'Saved progress is larger than this recovery tool supports. It was left unchanged.':'This browser could not read saved progress. Check browser storage access and try again.');return;
  }
  let url:string|undefined;
  try{url=URL.createObjectURL(new Blob([prepared.content],{type:'application/json;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=prepared.filename;a.click();setStatus('Recovery-copy download requested. Check your browser downloads and keep the file private. Saved progress was not changed.');}
  catch{setStatus('The recovery-copy download could not be requested. Saved progress was not changed.');}
  finally{if(url){const used=url;setTimeout(()=>URL.revokeObjectURL(used),1000);}}
 }
 return <section aria-labelledby="progress-recovery-copy" className="pg-empty"><h2 id="progress-recovery-copy">Keep a copy before trying anything else</h2><p>A recovery copy preserves the saved data this page could not read. It does not repair or restore your progress. The file can contain your lesson details, answers and reflections.</p><label><input type="checkbox" checked={acknowledged} onChange={e=>{setAcknowledged(e.target.checked);setStatus('');}}/> I understand this file may contain personal information and will keep it private.</label><p><button type="button" className="sw-secondary" disabled={!acknowledged} onClick={download}>Download recovery copy</button></p><p>No copy is sent to KAIRO or an employer. This action does not clear or replace your saved records.</p>{status&&<p role="status" className="sw-status">{status}</p>}</section>;
}
