import {readFile,writeFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const origin='https://kairo-app-747226582754.africa-south1.run.app';
const report={checkedAt:new Date().toISOString(),syntheticAccountsOnly:true,browserObserved:false,liveModelRequests:0,checks:{}};
function check(name,value){report.checks[name]=value===true;if(!value)throw Error(name);}
try{
 const credentials=JSON.parse(await readFile(new URL('../connected_release/judge-credentials.local.json',import.meta.url),'utf8'));
 const operator=(await promisify(execFile)('cmd.exe',['/d','/s','/c','gcloud.cmd auth print-identity-token'],{windowsHide:true,maxBuffer:32768})).stdout.trim();
 async function request(path,{method='GET',cookie,body}={}){const r=await fetch(origin+path,{method,headers:{Origin:origin,'X-Serverless-Authorization':`Bearer ${operator}`,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(90000),redirect:'error'});return{status:r.status,value:await r.json().catch(()=>null),cookie:(r.headers.getSetCookie()[0]||'').split(';')[0]};}
 const accounts=[];
 for(const a of credentials.accounts){const login=await request('/api/account/authenticate',{method:'POST',body:{mode:'signin',email:a.email,password:a.password}});check(a.cohort+'Login',login.status===200);const space=await request('/api/account/learning-space',{cookie:login.cookie});check(a.cohort+'AssignedCurriculum',space.status===200&&space.value.space.cohort===a.cohort);accounts.push({cookie:login.cookie,space:space.value.space});}
 const a=accounts.find(a=>a.space.cohort==='engineering'),b=accounts.find(a=>a!==accounts.find(x=>x.space.cohort==='engineering'));
 check('TwoDistinctStudySpaces',!!a&&!!b);
 const status=await request('/api/workspace/ai/status',{cookie:a.cookie});check('GatewayMounted',status.status===200&&status.value.providers.some(p=>p.id==='google'&&p.configured));report.providers=status.value.providers;
 const preferences=await request('/api/workspace/preferences',{cookie:a.cookie});check('OwnerPreferencesMounted',preferences.status===200&&preferences.value.schemaVersion===1);
 const opportunities=await request('/api/workspace/opportunities',{cookie:a.cookie});check('OpportunityRecordsMounted',opportunities.status===200&&Array.isArray(opportunities.value.records));
 const lessonId=Object.values(a.space.materialLinks)[0].lessonId,lesson=await request('/api/workspace/lesson/'+lessonId,{cookie:a.cookie});check('OwnLessonAvailable',lesson.status===200);check('OtherAccountDenied',(await request('/api/workspace/lesson/'+lessonId,{cookie:b.cookie})).status===404);
 check('MissingSessionDenied',(await request('/api/workspace/ai/status')).status===401);
 report.liveModelRequests++;
 const help=await request('/api/workspace/studio-help',{method:'POST',cookie:a.cookie,body:{lessonId,studio:'motor',selectedLabel:'Stator',variables:{frequencyHz:50,poles:4},question:'Explain the selected part using this lesson.',consent:true,provider:'google',providerConsent:['google'],requestId:crypto.randomUUID()}});
 report.studioHelpStatus=help.status;
 check('LiveGoogleStudioHelp',help.status===200&&typeof help.value.text==='string'&&lesson.value.evidence.some(e=>e.quote.includes(help.value.anchorQuote)));
 report.model=help.value.model;report.provider=help.value.provider;
 report.optionalProviders=[];
 for(const provider of status.value.providers.filter(p=>p.configured&&p.id!=='google')){
  report.liveModelRequests++;
  const result=await request('/api/workspace/studio-help',{method:'POST',cookie:a.cookie,body:{lessonId,studio:'motor',selectedLabel:'Stator',question:'Explain the selected part using this lesson.',consent:true,provider:provider.id,providerConsent:[provider.id],requestId:crypto.randomUUID()}});
  report.optionalProviders.push({provider:provider.id,status:result.status,model:result.value?.model||provider.model,sourceAnchorValid:result.status===200&&lesson.value.evidence.some(e=>e.quote.includes(result.value.anchorQuote))});
 }
 try{
  // Generate a harmless synthetic phrase through the already-configured voice service.
  const speech=await fetch(origin+'/api/avatar/speech',{method:'POST',headers:{Origin:origin,'X-Serverless-Authorization':`Bearer ${operator}`,Cookie:a.cookie,'Content-Type':'application/json'},body:JSON.stringify({text:'This is a synthetic question. Explain the motor stator.',voice:'en-GB-Chirp3-HD-Aoede',consent:true}),signal:AbortSignal.timeout(90000)});
  if(!speech.ok)throw Error('Synthetic voice unavailable');
  const audio=Buffer.from(await speech.arrayBuffer());if(!audio.length||audio.length>8*1024*1024)throw Error('Synthetic voice size');report.liveModelRequests+=2;
  const response=await fetch(origin+'/api/workspace/listening',{method:'POST',headers:{Origin:origin,'X-Serverless-Authorization':`Bearer ${operator}`,Cookie:a.cookie,'Content-Type':'audio/mpeg','X-Kairo-Consent':'groq','X-Kairo-Language':'en','X-Kairo-Request':crypto.randomUUID()},body:audio,signal:AbortSignal.timeout(90000)}),result=await response.json();
  report.syntheticListening={status:response.status,model:result.model||null,motorRecognised:/motor/i.test(result.text||''),statorRecognised:/stator/i.test(result.text||''),realLanguageValidation:false};
 }catch{report.syntheticListening={tested:false,reason:'Synthetic audio or transcription could not complete.'};}

 const anonymous=await fetch(origin+'/api/health',{redirect:'manual',signal:AbortSignal.timeout(30000)});check('ServiceStillIamPrivate',[401,403].includes(anonymous.status));
}catch(e){report.failure=e instanceof Error?e.message:'Verification did not finish.';process.exitCode=1;}
await writeFile(new URL('../../docs/ai-integration-20261025/live-ai-check.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
