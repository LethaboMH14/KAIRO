import {readFile,writeFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const root=new URL('../../',import.meta.url),origin='https://kairo-app-747226582754.africa-south1.run.app';
const report={checkedAt:new Date().toISOString(),syntheticOnly:true,modelCalls:0,checks:{},failures:[]};
const check=(name,value)=>{report.checks[name]=!!value;if(!value)throw Error(name);};
try{
 const {stdout}=await promisify(execFile)('cmd.exe',['/d','/s','/c','gcloud.cmd auth print-identity-token'],{windowsHide:true,timeout:60000,maxBuffer:32768});
 const operator=stdout.trim();
 async function request(path,{cookie,body,operatorAuth=true}={}){
  const res=await fetch(origin+path,{method:body?'POST':'GET',headers:{Origin:origin,...(operatorAuth?{'X-Serverless-Authorization':`Bearer ${operator}`} : {}),...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000),redirect:'error'});
  const text=await res.text();let data;try{data=JSON.parse(text);}catch{data=null;}
  return{status:res.status,data,text,cookie:(res.headers.getSetCookie()[0]||'').split(';')[0]};
 }
 check('privateIngressDenied',(await request('/',{operatorAuth:false})).status===403);
 check('health',(await request('/api/health')).status===200);
 check('workspaceRequiresAccount',(await request('/api/workspace/catalog')).status===401);
 const credentials=JSON.parse(await readFile(new URL('tools/connected_release/judge-credentials.local.json',root),'utf8'));
 const sessions=[];
 for(const cohort of ['engineering','informatics']){
  const account=credentials.accounts.find(a=>a.cohort===cohort);if(!account)throw Error('Synthetic account unavailable');
  const login=await request('/api/account/authenticate',{body:{mode:'signin',email:account.email,password:account.password}});
  check(cohort+'Login',login.status===200&&!!login.cookie);
  const cookie=login.cookie,space=await request('/api/account/learning-space',{cookie});
  check(cohort+'PrivateSpace',space.status===200&&!!space.data.space);
  const link=Object.values(space.data.space.materialLinks||{}).find(x=>x.lessonId);if(!link)throw Error('Synthetic lesson unavailable');
  const lesson=await request('/api/workspace/lesson/'+link.lessonId,{cookie});
  check(cohort+'SavedLesson',lesson.status===200&&lesson.data.evidence?.length>0);
  const source=await request('/api/workspace/source/'+lesson.data.sourceId,{cookie});
  check(cohort+'ReviewedSource',source.status===200&&source.data.reviewed===true&&source.data.revision===lesson.data.revision);
  const opportunities=await request('/api/workspace/opportunities',{cookie});
  check(cohort+'OpportunityFreshness',opportunities.status===200&&Array.isArray(opportunities.data.records)&&opportunities.data.records.every(x=>x.freshness&&Array.isArray(x.freshness.reasons)));
  report[cohort+'OpportunityCount']=opportunities.data.records.length;
  sessions.push({cookie,lessonId:link.lessonId,space:space.data.space});
 }
 check('accountSpecificSpaces',JSON.stringify(sessions[0].space)!==JSON.stringify(sessions[1].space));
 check('foreignLessonDenied',[403,404].includes((await request('/api/workspace/lesson/'+sessions[0].lessonId,{cookie:sessions[1].cookie})).status));
 const page=await request('/classroom');check('classroomHtml',page.status===200);
 const entry=page.text.match(/src="([^\"]+\.js)"/);check('builtEntryReference',!!entry);
 const js=await request(entry[1]);check('builtEntryAvailable',js.status===200);
 // Static delivery only; component behavior is covered by SSR tests, not browser observation.
 report.staticAssetServed=true;
}catch(error){report.failures.push(error instanceof Error?error.message:'Verification failed');process.exitCode=1;}
await writeFile(new URL('./live.json',import.meta.url),JSON.stringify(report,null,2),'utf8');
console.log(JSON.stringify(report,null,2));
