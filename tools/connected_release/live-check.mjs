import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes,createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {getToken} from '../../studio/server/google.mjs';
const exec=promisify(execFile),project='kairo-access-20261021',config=Object.fromEntries((await readFile(new URL('./.env.cloud.local',import.meta.url),'utf8')).trim().split('\n').map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)];})),origin=config.KAIRO_ALLOWED_ORIGIN,access=await getToken();
const operator=(await exec('cmd.exe',['/d','/s','/c','gcloud.cmd auth print-identity-token'],{windowsHide:true,maxBuffer:32768,timeout:45000})).stdout.trim();
const report={checkedAt:new Date().toISOString(),syntheticOnly:true,privateLearnerFiles:0,accountsCreated:0,accountsDeleted:0,checks:{},failures:[]},users=[];
async function google(url,method='GET',body){const r=await fetch(url,{method,headers:{Authorization:`Bearer ${access}`,'Content-Type':'application/json','x-goog-user-project':project},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});const value=await r.json().catch(()=>({}));if(!r.ok&&r.status!==404)throw Error(`Cleanup/config HTTP ${r.status}`);return value;}
async function api(path,{cookie,method='GET',body,bytes}={}){const r=await fetch(origin+path,{method,headers:{'X-Serverless-Authorization':`Bearer ${operator}`,Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:bytes?{'Content-Type':'application/octet-stream'}:{})},...(body?{body:JSON.stringify(body)}:bytes?{body:bytes}:{}),signal:AbortSignal.timeout(120000),redirect:'error'});const type=r.headers.get('content-type')||'',value=type.includes('application/json')?await r.json():null;return {status:r.status,value,cookie:r.headers.getSetCookie()[0]?.split(';')[0],bytes:type.includes('audio/')?(await r.arrayBuffer()).byteLength:0};}
function check(name,value){report.checks[name]=!!value;if(!value)throw Error(name);}
try{
 check('backendHealth',(await api('/api/health')).status===200);
 const trace=await api('/api/trace',{method:'POST',body:{topic:'database'}});check('computerScienceTrace',trace.status===200&&trace.value.rows?.length===2&&trace.value.parameters?.[0]==='database');
 check('unauthenticatedCloudQuestionDenied',(await api('/api/ask',{method:'POST',body:{question:'What is a parameter?',topic:'database'}})).status===401);
 check('unauthenticatedWorkspaceDenied',(await api('/api/workspace/catalog')).status===401);
 for(let i=0;i<2;i++){
  const email=`kairo-check-${Date.now()}-${randomBytes(4).toString('hex')}@example.invalid`,password=randomBytes(24).toString('base64url')+'Aa1!';
  const result=await api('/api/account/authenticate',{method:'POST',body:{mode:'signup',email,password}});
  // Track created synthetic accounts even if issuing the session cookie fails.
  const lookup=await google('https://identitytoolkit.googleapis.com/v1/projects/'+project+'/accounts:lookup','POST',{email:[email]});const user=lookup.users?.[0];if(user){users.push({uid:user.localId,email,cookie:result.cookie});report.accountsCreated++;}
  check('account'+i+'Session',result.status===200&&!!result.cookie);
 }
 const [a,b]=users;
 const motorText='A three-phase induction motor has a stationary stator and a rotating squirrel-cage rotor. The stator winding produces a rotating magnetic field. Synchronous field speed in revolutions per minute is 120 times frequency in hertz divided by total pole count. At fifty hertz and four poles the synchronous field speed is 1500 revolutions per minute. The rotor turns below synchronous speed in motoring operation. The field-speed calculation is not a measured shaft-speed result.';
 let result=await api('/api/workspace/text',{cookie:a.cookie,method:'POST',body:{title:'Synthetic motor source',text:motorText}});check('sourceCreated',result.status===200);const sourceId=result.value.id;
 check('secondAccountCannotReadSource',(await api('/api/workspace/source/'+sourceId,{cookie:b.cookie})).status===404);
 result=await api('/api/workspace/source/'+sourceId+'/review',{cookie:a.cookie,method:'POST',body:{pages:[{text:motorText}],acknowledged:true,expectedRevision:null}});check('reviewSaved',result.status===200);const revision=result.value.revision;
 result=await api('/api/workspace/generate',{cookie:a.cookie,method:'POST',body:{sourceId,revision,goal:'motor synchronous field speed',mode:'local'}});check('localCitedLesson',result.status===200&&result.value.evidence?.every(e=>motorText.slice(e.start,e.end)===e.quote));const lessonId=result.value.id;
 check('secondAccountCannotReadLesson',(await api('/api/workspace/lesson/'+lessonId,{cookie:b.cookie})).status===404);
 const draft=await api('/api/workspace/lesson/'+lessonId+'/draft',{cookie:a.cookie});result=await api('/api/workspace/lesson/'+lessonId+'/draft',{cookie:a.cookie,method:'POST',body:{document:draft.value.document,expectedVersion:0}});check('editableDraftSaved',result.status===200);check('staleDraftRejected',(await api('/api/workspace/lesson/'+lessonId+'/draft',{cookie:a.cookie,method:'POST',body:{document:draft.value.document,expectedVersion:0}})).status===409);
 result=await api('/api/workspace/progress/learner_browser',{cookie:a.cookie,method:'PUT',body:{create:true,value:{schemaVersion:1,snapshot:{synthetic:'saved progress'},updatedAt:new Date().toISOString()}}});check('progressSaved',result.status===200);check('secondAccountCannotReadProgress',(await api('/api/workspace/progress/learner_browser',{cookie:b.cookie})).status===404);
 const upload=await api('/api/workspace/upload?name=synthetic.txt&retainOriginal=1',{cookie:a.cookie,method:'POST',bytes:Buffer.from(motorText)});check('durableImportQueued',upload.status===202);let job;
 for(let i=0;i<45;i++){job=await api('/api/workspace/jobs/'+upload.value.jobId,{cookie:a.cookie});if(['ready','error','cancelled'].includes(job.value?.status))break;await new Promise(r=>setTimeout(r,2000));}
 check('durableImportCompleted',job?.value?.status==='ready'&&job.value.source.pages.some(p=>p.text.includes('stator')));
 check('secondAccountCannotReadJob',(await api('/api/workspace/jobs/'+upload.value.jobId,{cookie:b.cookie})).status===404);
 const original=await fetch(origin+'/api/workspace/source/'+job.value.source.id+'/original',{headers:{'X-Serverless-Authorization':`Bearer ${operator}`,Cookie:a.cookie,Origin:origin},signal:AbortSignal.timeout(30000)});check('retainedOriginalIntegrity',original.status===200&&createHash('sha256').update(Buffer.from(await original.arrayBuffer())).digest('hex')===createHash('sha256').update(motorText).digest('hex'));
 if(process.argv.includes('--models')){result=await api('/api/workspace/generate',{cookie:a.cookie,method:'POST',body:{sourceId,revision,goal:'Explain synchronous field speed versus rotor speed in one short lesson.',mode:'cloud',consent:true}});check('realGoogleLesson',result.status===200&&result.value.mode==='vertex');result=await api('/api/avatar/speech',{cookie:a.cookie,method:'POST',body:{text:'Check the source, then try one small step.',voice:'en-GB-Chirp3-HD-Aoede',consent:true}});check('realGoogleSpeech',result.status===200&&result.bytes>100);report.syntheticSpeechBytes=result.bytes;result=await api('/api/ask',{cookie:a.cookie,method:'POST',body:{question:'In one sentence, why use a query parameter?',topic:'database',stage:'database'}});check('realGoogleComputerScienceQuestion',result.status===200);}
 check('signOut',(await api('/api/account/signout',{cookie:a.cookie,method:'POST',body:{}})).status===200);
 check('revokedSessionRejected',(await api('/api/workspace/catalog',{cookie:a.cookie})).status===401);
}catch(e){report.failures.push(String(e.message).slice(0,160));}
finally{
 for(const user of users){const owner=createHash('sha256').update(user.uid).digest('hex');
  try{for(const kind of ['sources','revisions','lessons','drafts','jobs','progress']){const list=await google(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/owners/${owner}/${kind}?pageSize=100&mask.fieldPaths=id`);for(const document of list.documents||[])await google('https://firestore.googleapis.com/v1/'+document.name,'DELETE');}const objects=await google(`https://storage.googleapis.com/storage/v1/b/${config.KAIRO_CLOUD_BUCKET}/o?prefix=${encodeURIComponent('owners/'+owner+'/')}`);for(const object of objects.items||[])await google(`https://storage.googleapis.com/storage/v1/b/${config.KAIRO_CLOUD_BUCKET}/o/${encodeURIComponent(object.name)}`,'DELETE');await google('https://identitytoolkit.googleapis.com/v1/accounts:delete','POST',{localId:user.uid,targetProjectId:project});report.accountsDeleted++;}catch{report.cleanupFailed=true;}
 }
 await writeFile(new URL('../../docs/connected-release-20261024/live-check.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
if(report.failures.length||report.cleanupFailed)process.exitCode=1;
