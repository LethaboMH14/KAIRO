import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {workspaceRoutes} from '../server/workspace/routes.mjs';

test('actual reviewed lesson route selects late goal evidence, preserves citations and rejects stale revision',async()=>{
 const prefix=join(tmpdir(),'kairo-goal-integration-'),folder=await mkdtemp(prefix);
 const router=await workspaceRoutes(fileURLToPath(new URL('..',import.meta.url)),{home:join(folder,'home'),imported:join(folder,'catalog')});
 const app=express();app.use('/api/workspace',router);const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 async function call(path,body){const response=await fetch(`http://127.0.0.1:${server.address().port}/api/workspace${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:response.status,value:await response.json()};}
 try{
  const filler='Inventory delivery stock totals are recorded in the book. '.repeat(300).slice(0,13000);
  const motor='Synchronous motor field speed is determined by supply frequency and pole count. A four-pole field supplied at 50 Hz has a synchronous field speed of 1500 rpm. Field speed and actual rotor speed are distinct quantities in this illustrative lesson.';
  const source=(await call('/text',{title:'Synthetic mixed study notes',text:filler+motor})).value;
  const reviewed=(await call(`/source/${source.id}/review`,{acknowledged:true,expectedRevision:null,pages:source.pages.map(p=>({text:p.text}))})).value;
  const lesson=await call('/generate',{sourceId:source.id,revision:reviewed.revision,mode:'local',goal:'Explain synchronous motor field speed, frequency and pole count'});
  assert.equal(lesson.status,200);assert.equal(lesson.value.evidenceSelection.method,'lexical-goal');
  assert(lesson.value.evidence[0].start>=12000);assert.match(lesson.value.chapters[0].explanation,/Synchronous motor field speed/);
  assert(lesson.value.evidence.reduce((n,e)=>n+e.quote.length,0)<=12000);
  for(const e of lesson.value.evidence){assert.equal(e.quote,reviewed.reviewedPages[0].text.slice(e.start,e.end));assert.equal(e.locator,reviewed.reviewedPages[0].locator);}
  const fallback=await call('/generate',{sourceId:source.id,revision:reviewed.revision,mode:'local',goal:'unmatchedxyz'});
  assert.equal(fallback.status,200);assert.equal(fallback.value.evidenceSelection.method,'source-order');assert.equal(fallback.value.evidence[0].start,0);
  const next=await call(`/source/${source.id}/review`,{acknowledged:true,expectedRevision:reviewed.revision,pages:[{text:reviewed.reviewedPages[0].text+' Corrected source.'}]});assert.equal(next.status,200);
  assert.equal((await call('/generate',{sourceId:source.id,revision:reviewed.revision,mode:'local',goal:'motor'})).status,400);
 }finally{await new Promise(r=>server.close(r));router.closeStore();if(!resolve(folder).startsWith(resolve(prefix)))throw new Error('Unsafe cleanup path');await rm(folder,{recursive:true,force:true});}
});
