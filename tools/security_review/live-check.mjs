import {readFile,writeFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const origin='https://kairo-app-747226582754.africa-south1.run.app';
const report={checkedAt:new Date().toISOString(),syntheticOnly:true,browserObserved:false,liveModelInvoked:false,checks:{}};
function check(name,ok){report.checks[name]=ok===true;if(!ok)throw Error(name);}
try{
 const credentials=JSON.parse(await readFile(new URL('../connected_release/judge-credentials.local.json',import.meta.url),'utf8'));
 const operator=(await promisify(execFile)('cmd.exe',['/d','/s','/c','gcloud.cmd auth print-identity-token'],{windowsHide:true,maxBuffer:32768})).stdout.trim();
 async function request(path,{method='GET',cookie,body,originHeader=origin}={}){const response=await fetch(origin+path,{method,headers:{Origin:originHeader,'X-Serverless-Authorization':`Bearer ${operator}`,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(60000)});return {status:response.status,value:await response.json().catch(()=>null),setCookie:response.headers.getSetCookie()[0]||'',cache:response.headers.get('cache-control')};}
 const spaces=[];
 for(const account of credentials.accounts){const login=await request('/api/account/authenticate',{method:'POST',body:{mode:'signin',email:account.email,password:account.password}});check(account.cohort+'Login',login.status===200);check(account.cohort+'CookieFlags',/HttpOnly/.test(login.setCookie)&&/Secure/.test(login.setCookie)&&/SameSite=Strict/.test(login.setCookie));const cookie=login.setCookie.split(';')[0];const current=await request('/api/account/learning-space',{cookie});check(account.cohort+'OwnerAssignedCurriculum',current.status===200&&current.value.space.cohort===account.cohort);check(account.cohort+'NoStore',current.cache==='no-store');spaces.push({cookie,space:current.value.space});}
 const [a,b]=spaces;
 for(const [owner,other] of [[a,b],[b,a]]){const lesson=Object.values(owner.space.materialLinks)[0].lessonId;check(owner.space.cohort+'OwnLesson', (await request('/api/workspace/lesson/'+lesson,{cookie:owner.cookie})).status===200);check(owner.space.cohort+'OtherCannotReadLesson',(await request('/api/workspace/lesson/'+lesson,{cookie:other.cookie})).status===404);}
 check('MissingSessionDenied',(await request('/api/workspace/catalog')).status===401);
 check('RevokedOrInvalidSessionDenied',(await request('/api/account/learning-space',{cookie:'kairo_session=synthetic-invalid'})).status===401);
 check('ForeignOriginDenied',(await request('/api/account/reset',{method:'POST',originHeader:'https://attacker.example.test',body:{email:'synthetic@example.test'}})).status===403);
 check('CannotRewriteEnrolment',(await request('/api/workspace/progress/enrolment',{method:'PUT',cookie:a.cookie,body:{create:true,value:{cohort:'informatics'}}})).status===400);
 check('LearnerCannotInvokeImportWorker',(await request('/api/internal/import',{method:'POST',cookie:a.cookie,body:{uid:'synthetic-other',jobId:'a'.repeat(24)}})).status===401);
 const anonymous=await fetch(origin+'/api/health',{redirect:'manual',signal:AbortSignal.timeout(60000)});check('IamStillPrivate',anonymous.status===403);
}catch(error){report.failure=String(error.message).slice(0,140);process.exitCode=1;}
await writeFile(new URL('../../docs/security-submission-20261024/live-api-check.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
