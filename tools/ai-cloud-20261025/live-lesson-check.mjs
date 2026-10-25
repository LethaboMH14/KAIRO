import {readFile,writeFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const origin='https://kairo-app-747226582754.africa-south1.run.app',report={checkedAt:new Date().toISOString(),syntheticAccountOnly:true,browserObserved:false,checks:{}};
function check(name,ok){report.checks[name]=ok===true;if(!ok)throw Error(name);}
try{
 const credentials=JSON.parse(await readFile(new URL('../connected_release/judge-credentials.local.json',import.meta.url),'utf8')),account=credentials.accounts.find(a=>a.cohort==='engineering');
 const token=(await promisify(execFile)('cmd.exe',['/d','/s','/c','gcloud.cmd auth print-identity-token'],{windowsHide:true,maxBuffer:32768})).stdout.trim();let cookie='';
 async function request(path,body){const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{Origin:origin,'X-Serverless-Authorization':`Bearer ${token}`,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(90000)});return{status:r.status,value:await r.json(),cookie:(r.headers.getSetCookie()[0]||'').split(';')[0]};}
 const login=await request('/api/account/authenticate',{mode:'signin',email:account.email,password:account.password});check('Login',login.status===200);cookie=login.cookie;
 const space=await request('/api/account/learning-space'),entry=Object.values(space.value.space.materialLinks)[0],old=await request('/api/workspace/lesson/'+entry.lessonId),source=await request('/api/workspace/source/'+old.value.sourceId),preferences=await request('/api/workspace/preferences');
 check('OwnedReviewedSource',source.status===200&&source.value.reviewed===true);
 const lesson=await request('/api/workspace/generate',{sourceId:source.value.id,revision:source.value.revision,mode:'cloud',goal:'Explain the main idea in small steps, then ask me to apply it.',preferences:preferences.value,provider:'google',providerConsent:['google'],consent:true,requestId:crypto.randomUUID()});
 report.generationStatus=lesson.status;check('StructuredLessonGenerated',lesson.status===200&&lesson.value.chapters.length>=2&&lesson.value.quiz.length>=1);
 check('CuratorPersisted',lesson.value.curation?.language===preferences.value.language&&typeof lesson.value.curation?.reason==='string');check('RevisionPreserved',lesson.value.revision===source.value.revision);check('ExactEvidenceAnchors',lesson.value.evidence.every(e=>source.value.reviewedPages.some(p=>p.text.slice(e.start,e.end)===e.quote)));
 const saved=await request('/api/workspace/lesson/'+lesson.value.id);check('NewLessonDurablyReadable',saved.status===200&&saved.value.revision===source.value.revision);
 const help=await request('/api/workspace/studio-help',{lessonId:lesson.value.id,studio:'motor',selectedLabel:'Stator',variables:{frequencyHz:50,poles:4},question:'How does this connect to the main idea in my lesson?',consent:true,provider:'google',providerConsent:['google'],requestId:crypto.randomUUID()});
 check('GeneratedLessonReachesStudio',help.status===200&&lesson.value.evidence.some(e=>e.quote.includes(help.value.anchorQuote)));report.model=lesson.value.model;report.provider=lesson.value.provider;report.chapters=lesson.value.chapters.length;report.quiz=lesson.value.quiz.length;report.lessonId=lesson.value.id;
}catch(e){report.failure=e instanceof Error?e.message:'Verification did not finish.';process.exitCode=1;}
await writeFile(new URL('../../docs/ai-integration-20261025/live-lesson-check.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
