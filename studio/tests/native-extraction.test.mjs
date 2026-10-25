import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {testPython} from './helpers/python-interpreter.mjs';
import {workspaceRoutes} from '../server/workspace/routes.mjs';
import {nativeReview} from '../server/workspace/native-extraction.mjs';
import {sourceSnapshot} from '../server/cloud-library/store.mjs';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const jsonHash=value=>digest(JSON.stringify(value));
const studio=fileURLToPath(new URL('..',import.meta.url));
const passage=i=>`Section ${i}: A rotating magnetic field has a synchronous speed. A four pole field at 50 Hz rotates at 1500 rpm. Check the supplied source and distinguish field speed from rotor speed.`;
function native(texts,hash='a'.repeat(64)){
 return {schemaVersion:1,contentSha256:hash,coverage:{discoveredUnits:texts.length,attemptedUnits:texts.length,completedUnits:texts.length,skipped:[],failures:[]},warnings:['Native text only; diagrams are not interpreted.'],blocks:texts.map((text,i)=>({blockId:`b${i}`,kind:'page',text,locator:{pageIndex:i},order:i,provenance:{method:'native-parser',engine:'synthetic-test',reviewed:false},warnings:[]}))};
}
test('native conversion preserves more than four pages and exposes partial and unknown coverage',()=>{
 const run=native(Array.from({length:7},(_,i)=>passage(i)));
 const output=nativeReview(run,run.contentSha256);assert.equal(output.pages.length,7);assert.equal(output.pages[6].locator,'Page 7');assert.equal(output.extraction.completedUnits,7);
 run.coverage.discoveredUnits=null;run.coverage.skipped.push({locator:{},reason:'unknown tail'});
 const partial=nativeReview(run,run.contentSha256);assert.equal(partial.extraction.discoveredUnits,null);assert.match(partial.limitNote,/unknown/);assert.equal(partial.extraction.skippedCount,1);
 const long=nativeReview(native(Array(6).fill('a'.repeat(12000))),run.contentSha256);
 assert.equal(long.extraction.reviewCharacters,48000);assert.equal(long.extraction.omittedReviewCharacters,24000);
 assert.throws(()=>nativeReview(run,'b'.repeat(64)),/matched/);
 run.blocks[1].blockId=run.blocks[0].blockId;assert.throws(()=>nativeReview(run,run.contentSha256),/invalid/);
});
test('Unicode review is byte bounded without splitting a surrogate pair, and cloud snapshots accept seven reviewed sections',()=>{
 const output=nativeReview(native(['🌍'.repeat(6000),'界'.repeat(12000),'界'.repeat(12000)]),'a'.repeat(64));
 assert(output.pages.reduce((n,p)=>n+Buffer.byteLength(p.text),0)<=65536);assert(output.extraction.omittedReviewCharacters>0);
 for(const p of output.pages)assert(!/[\uD800-\uDBFF]$/.test(p.text));
 const pages=nativeReview(native(Array.from({length:7},(_,i)=>passage(i))),'a'.repeat(64)).pages;
 const source={id:'1'.repeat(24),title:'Synthetic seven-page source',reviewed:true,reviewedPages:pages,revision:jsonHash(pages)};
 assert.equal(sourceSnapshot(source).source.reviewedPages.length,7);
});
async function withWorkspace(options,fn){
 const prefix=join(tmpdir(),'kairo-native-route-'),folder=await mkdtemp(prefix);
 const router=await workspaceRoutes(studio,{home:join(folder,'home'),imported:join(folder,'catalog'),...options});
 const app=express();app.use('/api/workspace',router);const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const base=`http://127.0.0.1:${server.address().port}/api/workspace`;
 async function call(path,body){const response=await fetch(base+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});return {status:response.status,value:await response.json()};}
 async function upload(bytes,name){const response=await fetch(`${base}/upload?name=${encodeURIComponent(name)}`,{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:bytes});assert.equal(response.status,202);const {jobId}=await response.json();for(let i=0;i<300;i++){const job=await call(`/jobs/${jobId}`);if(job.value.status!=='extracting')return job.value;await new Promise(r=>setTimeout(r,30));}throw new Error('Synthetic upload timed out.');}
 try{return await fn({folder,call,upload});}finally{await new Promise(r=>server.close(r));router.closeStore();if(!resolve(folder).startsWith(resolve(prefix)))throw new Error('Unsafe cleanup path');await rm(folder,{recursive:true,force:true});}
}
test('actual default native upload produces seven sections, reviewed revision and cited lesson without model calls',async()=>withWorkspace({},async({call,upload})=>{
 const job=await upload(Buffer.from(Array.from({length:7},(_,i)=>passage(i)).join('\n\n')),'synthetic-motor.txt');
 assert.equal(job.status,'ready');assert.equal(job.source.pages.length,7);assert.equal(job.source.extraction.completedUnits,7);
 const reviewed=await call(`/source/${job.source.id}/review`,{acknowledged:true,expectedRevision:null,pages:job.source.pages.map(p=>({text:p.text}))});assert.equal(reviewed.status,200);
 assert.equal(sourceSnapshot(reviewed.value).source.reviewedPages.length,7);
 const lesson=await call('/generate',{sourceId:job.source.id,revision:reviewed.value.revision,mode:'local'});assert.equal(lesson.status,200);
 assert(lesson.value.evidence.some(e=>e.locator==='Section 7'));assert.equal(lesson.value.revision,reviewed.value.revision);
 for(const e of lesson.value.evidence){const page=reviewed.value.reviewedPages.find(p=>p.locator===e.locator);assert.equal(page.text.slice(e.start,e.end),e.quote);}
}));
test('actual seven-page PDF upload retains page-seven native text',async()=>withWorkspace({},async({folder,upload})=>{
 const path=join(folder,'motor.pdf'),python=testPython;
 execFileSync(python,['-c',"from reportlab.pdfgen import canvas; import sys; c=canvas.Canvas(sys.argv[1]); [(c.drawString(40,700,'Motor page '+str(i)+' - magnetic field speed is distinct from rotor speed. '*3), c.showPage()) for i in range(1,8)]; c.save()",path],{windowsHide:true,timeout:15000});
 const job=await upload(await readFile(path),'motor.pdf');assert.equal(job.status,'ready');assert.equal(job.source.pages.length,7);assert.match(job.source.pages[6].text,/Motor page 7/);assert.equal(job.source.pages[6].locator,'Page 7');
}));
test('upload rejects native result from another file instead of saving misleading material',async()=>withWorkspace({extractNative:async()=>native([passage(0)])},async({upload})=>{
 const job=await upload(Buffer.from('%PDF-1.4\nsynthetic fixture'),'wrong-hash.pdf');assert.equal(job.status,'error');assert.equal(job.source,undefined);
}));
test('a PDF with insufficient native text retains the separately labelled OCR fallback',async()=>{
 const bytes=Buffer.from('%PDF-1.4\nsynthetic scan fixture');
 await withWorkspace({extractNative:async()=>native(['Short native header'],digest(bytes)),extractOcr:async()=>({pages:[{text:passage(1),locator:'Page 1',method:'synthetic-ocr'}],limitNote:'Synthetic OCR preview only.'})},async({upload})=>{
  const job=await upload(bytes,'scan.pdf');assert.equal(job.status,'ready');assert.equal(job.source.pages[0].method,'synthetic-ocr');assert(job.source.extraction.warnings.some(x=>x.includes('OCR preview')&&x.includes('four pages')));
 });
});
