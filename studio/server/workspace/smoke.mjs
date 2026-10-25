// Run against the loopback preview. Only authored fixture text leaves this process.
import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const base=process.env.KAIRO_TEST_URL||'http://127.0.0.1:4175';
const checks=[];
async function request(path,body,status=200,extra={}){
 const response=await fetch(`${base}/api/workspace${path}`,{...(body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),...extra,signal:AbortSignal.timeout(130000)});
 const result=await response.json();assert.equal(response.status,status,JSON.stringify(result));return result;
}
const catalog=await request('/catalog');assert.ok(catalog.catalog.length>0);assert.ok(!JSON.stringify(catalog).includes('originalPath'));checks.push('catalog omits original filesystem paths');
const sample='A shop opens with 20 notebooks, receives 12 notebooks and sells 9. Expected closing stock is 23 notebooks. A physical count of 21 means a shortage of 2. Check sales records and deliveries before deciding the cause.';
const source=await request('/text',{title:'API integration fixture',text:sample});
await request('/generate',{sourceId:source.id,mode:'local'},400);checks.push('generation blocked before review');
const reviewed=await request(`/source/${source.id}/review`,{pages:[{text:sample+' Count carefully.'}],acknowledged:true});
await request('/generate',{sourceId:source.id,revision:'stale',mode:'local'},400);checks.push('stale source revision rejected');
await request('/generate',{sourceId:source.id,revision:reviewed.revision,mode:'cloud',consent:false},400);checks.push('cloud generation requires explicit consent');
const lesson=await request('/generate',{sourceId:source.id,revision:reviewed.revision,mode:'local'});
assert.equal(lesson.mode,'local-extractive');assert.equal((await request(`/lesson/${lesson.id}`)).revision,reviewed.revision);
assert.equal(lesson.evidence[0].edited,true);checks.push('local lesson persists exact reviewed citation and edit flag');
await request('/text',{title:'Blocked origin',text:sample},403,{headers:{'Content-Type':'application/json',Origin:'https://example.org'}});checks.push('foreign origin rejected');
const upload=await request('/upload?name=fixture.txt',undefined,202,{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:sample});
for(let i=0;i<75;i++){const job=await request(`/jobs/${upload.jobId}`);if(job.status==='ready'){assert.ok(job.source.pages[0].text.includes('20 notebooks'));checks.push('uploaded text extracted through Python worker');break;}assert.notEqual(job.status,'error');await new Promise(r=>setTimeout(r,1500));}
assert.ok(checks.includes('uploaded text extracted through Python worker'));
if(process.env.KAIRO_OCR_FIXTURE){
 const image=await readFile(process.env.KAIRO_OCR_FIXTURE);const job=await request('/upload?name=ocr-fixture.png',undefined,202,{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:image});let passed=false;
 for(let i=0;i<75;i++){const result=await request(`/jobs/${job.jobId}`);if(result.status==='ready'){assert.match(result.source.pages[0].text,/notebooks/i);assert.match(result.source.pages[0].method,/rapidocr/);passed=true;break;}assert.notEqual(result.status,'error');await new Promise(r=>setTimeout(r,1500));}
 assert.ok(passed);checks.push('uploaded image OCR produces reviewable text');
}
const report={at:new Date().toISOString(),checks,lessonId:lesson.id,privateCourseContentSentToCloud:false};
await writeFile(fileURLToPath(new URL('../../../data/private/app-workspace/integration-verification.json',import.meta.url)),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
