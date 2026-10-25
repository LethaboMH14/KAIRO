import {writeFile} from 'node:fs/promises';
import {getToken} from '../../studio/server/google.mjs';
const projectId='kairo-access-20261021';
const token=await getToken();
async function request(url,method='GET',body){
 const response=await fetch(url,{method,headers:{Authorization:`Bearer ${token}`,'x-goog-user-project':projectId,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
 const value=await response.json().catch(()=>({}));return {status:response.status,value};
}
const url=`https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;
let config=await request(url);const evidence={checkedAt:new Date().toISOString(),beforeStatus:config.status};
if(process.argv.includes('--initialize')&&config.status===404){
 const initialized=await request(`https://identitytoolkit.googleapis.com/v2/projects/${projectId}/identityPlatform:initializeAuth`,'POST',{});
 evidence.initializeStatus=initialized.status;if(initialized.status>=400)evidence.initializeError=initialized.value.error?.message?.slice(0,400);
 config=await request(url);
}
if(process.argv.includes('--enable-email')&&config.status===200){
 const updated=await request(`${url}?updateMask=signIn.email.enabled,signIn.email.passwordRequired`,'PATCH',{signIn:{email:{enabled:true,passwordRequired:true}}});
 evidence.emailUpdateStatus=updated.status;config=await request(url);
}
evidence.afterStatus=config.status;evidence.configured=config.status===200;evidence.emailEnabled=config.value.signIn?.email?.enabled===true;evidence.passwordRequired=config.value.signIn?.email?.passwordRequired===true;evidence.anonymousEnabled=config.value.signIn?.anonymous?.enabled===true;evidence.phoneEnabled=config.value.signIn?.phoneNumber?.enabled===true;
if(config.status!==200)evidence.diagnostic=config.value.error?.message?.slice(0,500);
await writeFile(new URL('./identity-setup.json',import.meta.url),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
