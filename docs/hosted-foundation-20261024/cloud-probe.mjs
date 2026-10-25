import {writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {getToken} from '../../studio/server/google.mjs';
import {createOwnerRepository} from '../../studio/server/hosted-core/firestore.mjs';
const projectId='kairo-access-20261021';
const result={checkedAt:new Date().toISOString(),syntheticOnly:true,privateLearnerDocuments:0};
const repo=createOwnerRepository({projectId,getToken});
const uid=`synthetic-foundation-${randomBytes(8).toString('hex')}`,id='cloud-proof';let current;
try{
 current=await repo.put(uid,'progress',id,{kind:'synthetic-connection-test',stage:'created'},{create:true});
 result.created=true;result.readBack=(await repo.get(uid,'progress',id)).value.stage==='created';
 result.crossOwnerAbsent=(await repo.get(uid+'-other','progress',id))===null;
 try{await repo.put(uid,'progress',id,{stage:'stale'},{version:'2020-01-01T00:00:00Z'});result.staleRejected=false;}catch(e){result.staleRejected=e.status===409;}
 current=await repo.put(uid,'progress',id,{kind:'synthetic-connection-test',stage:'updated'},{version:current.version});
 result.updated=current.value.stage==='updated';
}finally{if(current){result.removed=(await repo.remove(uid,'progress',id,{version:current.version})).removed;result.absentAfterRemoval=(await repo.get(uid,'progress',id))===null;}}
const token=await getToken();
const response=await fetch(`https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`,{headers:{Authorization:`Bearer ${token}`,'x-goog-user-project':projectId},signal:AbortSignal.timeout(15000)});
const config=await response.json();
result.identity={status:response.status,configured:response.ok,emailPasswordEnabled:config.signIn?.email?.enabled===true,anonymousEnabled:config.signIn?.anonymous?.enabled===true,...(!response.ok?{diagnostic:config.error?.message?.slice(0,500),reason:config.error?.details?.find(x=>x.reason)?.reason}:{})};
await writeFile(new URL('./cloud-probe.json',import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
