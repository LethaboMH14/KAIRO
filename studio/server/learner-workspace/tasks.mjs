import {OAuth2Client} from 'google-auth-library';
import {getToken} from '../google.mjs';
export function createTaskDispatcher({projectId,location,queue,origin,serviceAccount,fetchFn=fetch}={}){
 if(!/^[a-z][a-z0-9-]+$/.test(projectId)||!/^https:\/\/[a-zA-Z0-9.-]+$/.test(origin)||!serviceAccount?.endsWith('@'+projectId+'.iam.gserviceaccount.com')||![location,queue].every(v=>/^[a-z][a-z0-9-]+$/.test(v)))throw new TypeError('Invalid task configuration.');
 const parent=`projects/${projectId}/locations/${location}/queues/${queue}`,client=new OAuth2Client();
 return {
  async enqueue(uid,jobId){const token=await getToken();const r=await fetchFn(`https://cloudtasks.googleapis.com/v2/${parent}/tasks`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({task:{name:`${parent}/tasks/import-${jobId}`,dispatchDeadline:'300s',httpRequest:{httpMethod:'POST',url:origin+'/api/internal/import',headers:{'Content-Type':'application/json'},body:Buffer.from(JSON.stringify({uid,jobId})).toString('base64'),oidcToken:{serviceAccountEmail:serviceAccount,audience:origin}}}})});if(!r.ok&&r.status!==409)throw new Error('The import queue is unavailable.');},
  async verify(req){const token=/^Bearer (\S+)$/.exec(req.headers.authorization||'')?.[1];if(!token)throw Error();const ticket=await client.verifyIdToken({idToken:token,audience:origin}),p=ticket.getPayload();if(p?.email!==serviceAccount||p.email_verified!==true)throw Error();}
 };
}
