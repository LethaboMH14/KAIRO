import {useEffect,useRef,useState} from 'react';
import EvidenceGapPanel from '../evidence-gap-ui/EvidenceGapPanel';
import programmes from '../../data/role-opportunities/engineering.json';
import {learnerStorage} from '../account/storage';
import {readProfile,type Profile} from '../profile/model';
import {collectArtifacts} from '../evidence/model';
import {ROLE_LINKS_KEY,makeRoleLink,parseRoleLinks,persistRoleLink,roleGapRows,type LinkedWork,type RoleProgramme} from './model';

export default function EngineeringRoleBridge({profile}:{profile:Profile|null}){
 const roles=programmes.roles as RoleProgramme[];
 const [roleId,setRoleId]=useState(roles[0].id),[selected,setSelected]=useState(''),[runId,setRunId]=useState(''),[reason,setReason]=useState(''),[links,setLinks]=useState<LinkedWork[]>([]),[unreadable,setUnreadable]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState('Choose a source requirement, then a useful next step.');
 const snapshot=useRef<string|null>(null);
 useEffect(()=>{try{const raw=learnerStorage.getItem(ROLE_LINKS_KEY);setLinks(parseRoleLinks(raw));snapshot.current=raw;}catch{setUnreadable(true);setStatus('Earlier requirement links are unreadable and will not be overwritten.');}},[]);
 const role=roles.find(r=>r.id===roleId)!,artifacts=profile?collectArtifacts(profile):[],requirement=role.requirements.find(r=>r.id===selected),projects=role.suggestedProjects.filter(p=>p.requirementIds.includes(selected));
 async function linkWork(){if(!requirement||unreadable||busy||role.requirementsReviewed!==true)return;const expectedRaw=snapshot.current;try{
  const fresh=collectArtifacts(readProfile()),link=makeRoleLink(role,requirement.id,fresh,runId,new Date().toISOString(),reason);
  const raw=await persistRoleLink({storage:learnerStorage,expectedRaw,link,withLock:typeof navigator!=='undefined'&&navigator.locks?async work=>await navigator.locks.request(ROLE_LINKS_KEY,async()=>await work()):null});snapshot.current=raw;setLinks(parseRoleLinks(raw));setStatus('Practice linked by your choice. This does not establish eligibility or verified skill.');
 }catch(error){setStatus(error instanceof Error?error.message:'The practice link could not save.');}}
 async function useGoal(){if(!requirement||busy||role.requirementsReviewed!==true)return;setBusy(true);try{
  const current=await fetch('/api/workspace/preferences',{cache:'no-store'});if(!current.ok)throw Error();const prefs=await current.json();
  const saved=await fetch('/api/workspace/preferences',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...prefs,goal:`Study this source requirement: ${requirement.label}`,roleGoal:`${role.provider}: ${role.title}`.slice(0,180)})});if(!saved.ok)throw Error();
  setStatus(`Saved learning goal: ${requirement.label} Open My material to choose sources. Nothing was sent to an employer.`);
 }catch{setStatus('The account goal could not save. Keep the requirement text and choose a goal in My material.');}finally{setBusy(false);}}
 return <section className="sw-original" aria-label="Engineering role requirements and practice evidence">
  <h2>From engineering study to a direction</h2><p>Explore dated programme requirements. These are preparation examples, not confirmed open vacancies, eligibility checks or employer partnerships.</p>
  <label>Programme source<select disabled={busy} value={roleId} onChange={e=>{setRoleId(e.target.value);setSelected('');setRunId('');}}>{roles.map(r=><option key={r.id} value={r.id}>{r.provider} — {r.title}</option>)}</select></label>
  <p><strong>Availability: {role.availability==='open'?'Check the provider before applying':'Not confirmed open'}.</strong> {role.availabilityNote}</p>
  {role.requirementsReviewed!==true&&<p role="status">These indexed source details still need direct review. Requirement actions are unavailable; check the original provider.</p>}
  <fieldset disabled={busy||role.requirementsReviewed!==true} style={{border:0,padding:0}}><legend>Source requirements</legend><EvidenceGapPanel roleTitle={role.title} requirements={roleGapRows(role,links,artifacts)} onChooseRequirement={id=>{if(busy||role.requirementsReviewed!==true)return;setSelected(id);setRunId('');setReason('');}}/></fieldset>
  {requirement&&<section className="sw-original" aria-label="Chosen requirement next step"><h3>{requirement.label}</h3><p>{requirement.kind==='skill'?'You may link actual practice for reference. The link is your selection and does not prove that the requirement is met.':'A practice exercise cannot prove this qualification, experience or formal condition. Review it on the provider’s page.'}</p>
   {requirement.kind==='skill'&&<><label>Practice record<select value={runId} onChange={e=>setRunId(e.target.value)}><option value="">Choose your recorded work</option>{artifacts.map(a=><option key={a.runId} value={a.runId}>{a.title} — {a.scenarioVersion}</option>)}</select></label><label>Why is this work relevant?<textarea maxLength={600} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Describe your contribution and the limits of this evidence."/></label><button type="button" disabled={!runId||unreadable||!reason.trim()} onClick={()=>void linkWork()}>Link this practice record</button></>}
   {projects.map(project=><article key={project.id}><h4>{project.title}</h4><p>{project.boundary}</p></article>)}
   <button type="button" disabled={busy} onClick={()=>void useGoal()}>{busy?'Saving goal…':'Use this as my learning goal'}</button> <a href="/sources">Open My material</a> <a href="/engineering">Explore the motor</a> <a href="/pump-lab">Explore the pump</a>
  </section>}
  <p role="status">{status}</p>
 </section>;
}
