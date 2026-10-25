import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const origin='https://kairo-app-747226582754.africa-south1.run.app';
const report={checkedAt:new Date().toISOString(),browserObserved:false,cameraOpened:false,checks:{}};
function check(name,value){report.checks[name]=value===true;if(!value)throw Error(name);}
try{
 const operator=(await promisify(execFile)('cmd.exe',['/d','/s','/c','gcloud.cmd auth print-identity-token'],{windowsHide:true,maxBuffer:32768})).stdout.trim();
 const request=path=>fetch(origin+path,{headers:{'X-Serverless-Authorization':`Bearer ${operator}`},redirect:'error',signal:AbortSignal.timeout(60000)});
 // Backend JSON and known public asset reads only; no page, screenshot, camera or learner content.
 const status=await request('/api/account/status');check('operatorCanReachService',status.status===200);
 check('cameraSameOriginMicrophoneDisabled',status.headers.get('permissions-policy')==='camera=(self), microphone=()');
 const csp=status.headers.get('content-security-policy')||'';
 check('scriptTagsSelfOnly',csp.includes("script-src-elem 'self';"));
 check('verifiedWorkerBlobsAllowed',csp.includes("script-src 'self' blob: 'wasm-unsafe-eval';")&&csp.includes("connect-src 'self' blob:;"));
 check('noInlineOrBroadEval',!csp.split(';').filter(part=>part.trim().startsWith('script-src')).some(part=>part.includes("'unsafe-inline'")||part.includes("'unsafe-eval'")));
 const statusBody=await status.json();check('noLearnerSession',statusBody.status!=='signed-in');
 const manifest=JSON.parse(await readFile(new URL('../../studio/src/signing/manifest.json',import.meta.url),'utf8'));
 check('trackingOnlyManifest',manifest.mode==='tracking-only');
 const assets=[manifest.worker,manifest.model.asset,manifest.licenseFile,...Object.values(manifest.runtime.wasm).flatMap(pair=>[pair.loader,pair.binary])];
 for(const asset of assets){if(!/^[a-zA-Z0-9_./-]+$/.test(asset.path)||asset.path.includes('..'))throw Error('Invalid asset path');const response=await request('/signing/'+asset.path);check(asset.path+'Http',response.status===200);const bytes=Buffer.from(await response.arrayBuffer());check(asset.path+'Pinned',bytes.length===asset.bytes&&createHash('sha256').update(bytes).digest('hex')===asset.sha256);}
 const anonymous=await fetch(origin+'/api/account/status',{redirect:'manual',signal:AbortSignal.timeout(60000)});check('serviceRemainsIamPrivate',anonymous.status===403);
}catch(error){report.failure=String(error.message).slice(0,180);process.exitCode=1;}
await writeFile(new URL('../../docs/experience-connected-20261024/live-policy-assets.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));

