import {writeFile} from 'node:fs/promises';
const origin='https://kairo-app-747226582754.africa-south1.run.app',checks={};
async function request(path,options={}){return fetch(origin+path,{...options,redirect:'error',signal:AbortSignal.timeout(60000)});}
checks.publicHealth=(await request('/api/health')).status===200;
const status=await request('/api/account/status');const account=await status.json();
checks.publicSignInConfigured=status.status===200&&account.enabled===true&&account.status==='signed-out'&&account.email==='';
checks.privateMaterialRequiresSession=(await request('/api/workspace/catalog')).status===401;
checks.privateProgressRequiresSession=(await request('/api/workspace/progress/learner_browser')).status===401;
checks.internalWorkerRequiresIdentity=(await request('/api/internal/import',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status===401;
checks.crossOriginMutationDenied=(await request('/api/workspace/text',{method:'POST',headers:{Origin:'https://invalid.example','Content-Type':'application/json'},body:'{}'})).status===403;
const trace=await request('/api/trace',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({topic:'database'})});
checks.publicSyntheticTrace=trace.status===200&&(await trace.json()).rows?.length===2;
const report={checkedAt:new Date().toISOString(),origin,apiOnly:true,browserObserved:false,checks};
await writeFile(new URL('../../docs/connected-release-20261024/public-check.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));if(Object.values(checks).some(value=>value!==true))process.exitCode=1;
