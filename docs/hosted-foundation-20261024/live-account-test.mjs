import {readFile,writeFile,appendFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {getToken} from '../../studio/server/google.mjs';
import {createFirebaseVerifier} from '../../studio/server/hosted-core/firebase-verifier.mjs';
const projectId='kairo-access-20261021',projectNumber='747226582754';
const report={checkedAt:new Date().toISOString(),syntheticOnly:true,privateLearnerDocuments:0,accountsCreated:0,accountsDeleted:0,temporaryKeyDeleted:false};
const access=await getToken();
async function google(url,method='GET',body){
 const response=await fetch(url,{method,headers:{Authorization:`Bearer ${access}`,'x-goog-user-project':projectId,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
 const value=await response.json().catch(()=>({}));if(!response.ok)throw new Error(`Google setup failed: HTTP ${response.status}, ${value.error?.status||'unknown'}`);return value;
}
async function operation(op){
 for(let i=0;i<30;i++){
  if(op.done){if(op.error)throw new Error(`Operation failed: code ${op.error.code}`);return op.response;}
  await new Promise(resolve=>setTimeout(resolve,1000));op=await google(`https://apikeys.googleapis.com/v2/${op.name}`);
 }throw new Error('Temporary key operation timed out.');
}
let keyName,apiKey,ownerRecord;const users=[];
try{
 const key=await operation(await google(`https://apikeys.googleapis.com/v2/projects/${projectNumber}/locations/global/keys`,'POST',{displayName:'KAIRO disposable synthetic auth verification',restrictions:{apiTargets:[{service:'identitytoolkit.googleapis.com'},{service:'securetoken.googleapis.com'}]}}));
 keyName=key.name;apiKey=key.keyString||(await google(`https://apikeys.googleapis.com/v2/${keyName}/keyString`)).keyString;
 if(!apiKey)throw new Error('Temporary auth client key unavailable.');
 await new Promise(resolve=>setTimeout(resolve,5000));
 async function account(action,body){
  for(let attempt=0;attempt<3;attempt++){
   const response=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${encodeURIComponent(apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});const value=await response.json();
   if(response.ok)return value;
   const message=value.error?.message||'';const code=/^[A-Z_0-9]+$/.test(message)?message:/API key not valid/i.test(message)?'API_KEY_NOT_READY':'UNCLASSIFIED_ERROR';
   if(code==='API_KEY_NOT_READY'&&attempt<2){await new Promise(resolve=>setTimeout(resolve,10000));continue;}
   throw new Error(`Synthetic account action ${action} failed: HTTP ${response.status} ${code}`);
  }
 }
 const verify=createFirebaseVerifier({projectId,onFailure:details=>{report.verificationFailure=details;}});
 for(let i=0;i<2;i++){
  const session=await account('signUp',{email:`kairo-synthetic-${randomBytes(8).toString('hex')}@example.invalid`,password:`Kairo!${randomBytes(24).toString('hex')}`,returnSecureToken:true});
  users.push(session);report.accountsCreated++;await verify(session.idToken);
 }
 report.realFirebaseSignaturesVerified=true;
 const deployed=JSON.parse(await readFile(new URL('./cloud-run-deploy.json',import.meta.url),'utf8'));const base=deployed.status.url;
 const {stdout}=await promisify(execFile)('cmd.exe',['/d','/s','/c','gcloud.cmd auth print-identity-token --project=kairo-access-20261021'],{windowsHide:true,timeout:45000,maxBuffer:65536});const operatorToken=stdout.trim();
 async function api(user,method='GET',body){const response=await fetch(`${base}/api/hosted/progress/synthetic-account-test`,{method,headers:{Authorization:`Bearer ${user.idToken}`,'X-Serverless-Authorization':`Bearer ${operatorToken}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});return {status:response.status,value:await response.json().catch(()=>null)};}
 const saved=await api(users[0],'PUT',{create:true,value:{stage:'synthetic-only',ownerClaim:'caller-supplied identity is not used'}});
 if(saved.status!==200)throw new Error(`Hosted create failed: HTTP ${saved.status}`);
 ownerRecord=saved.value;report.hostedCreate=true;
 report.hostedRead=(await api(users[0])).status===200;
 report.otherAccountDenied=(await api(users[1])).status===404;
 report.staleSaveRejected=(await api(users[0],'PUT',{version:'2020-01-01T00:00:00Z',value:{stage:'stale'}})).status===409;
 const removed=await api(users[0],'DELETE',{version:ownerRecord.version});report.hostedRemoved=removed.status===200;
 if(report.hostedRemoved)ownerRecord=null;
 report.absentAfterRemoval=(await api(users[0])).status===404;
 if(!['realFirebaseSignaturesVerified','hostedCreate','hostedRead','otherAccountDenied','staleSaveRejected','hostedRemoved','absentAfterRemoval'].every(key=>report[key]===true))throw new Error('A hosted account acceptance check failed.');
}catch(e){report.failure=e.message;process.exitCode=1;}
finally{
 // Admin deletion uses explicit synthetic IDs captured from this run only.
 for(const user of users){
  if(ownerRecord&&user===users[0]){
   const {createOwnerRepository}=await import('../../studio/server/hosted-core/firestore.mjs');
   await createOwnerRepository({projectId,getToken}).remove(user.localId,'progress','synthetic-account-test',{version:ownerRecord.version}).catch(()=>{});
  }
  try{await google('https://identitytoolkit.googleapis.com/v1/accounts:delete','POST',{localId:user.localId,targetProjectId:projectId});report.accountsDeleted++;}catch{report.cleanupFailure=true;}
 }
 if(keyName){try{await operation(await google(`https://apikeys.googleapis.com/v2/${keyName}`,'DELETE'));report.temporaryKeyDeleted=true;}catch{report.cleanupFailure=true;report.temporaryKeyResource=keyName;}}
 await appendFile(new URL('./live-account-attempts.jsonl',import.meta.url),JSON.stringify(report)+'\n');await writeFile(new URL('./live-account-test.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
