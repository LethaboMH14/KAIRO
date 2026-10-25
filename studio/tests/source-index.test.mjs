import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createSourceIndex,reviewedRevision} from '../server/source-index/index.mjs';

function source(id,text,ownerId='a'){
 const reviewedPages=[{text,locator:'Page 1',edited:false}];
 return {id,title:`Source ${id}`,ownerId,reviewed:true,reviewedPages,revision:reviewedRevision(reviewedPages)};
}
const long=(text)=>`${text} `.repeat(13);
async function withIndex(fn){
 const dir=await mkdtemp(join(tmpdir(),'kairo-index-'));
 const path=join(dir,'index.sqlite');
 try{await fn(path);}finally{await rm(dir,{recursive:true,force:true});}
}
const forOwner=(ownerId,other={})=>({ownerId,expectedOwnerId:ownerId,...other});

test('SQLite prototype persists source revisions and postings over a close/reopen',async()=>withIndex(async path=>{
 const s=source('motor',long('Rotating stator magnetic field.'));
 let index=createSourceIndex(path);
 assert.equal(index.upsert(forOwner('a',{source:s})).action,'indexed');
 assert.equal(index.upsert(forOwner('a',{source:s})).action,'unchanged');
 assert.equal(index.stats(forOwner('a')).documents,1);
 index.close();
 index=createSourceIndex(path);
 const result=index.search(forOwner('a',{query:'stator',limit:4})).results;
 assert.equal(result.length,1);assert.equal(result[0].revision,s.revision);
 assert.equal(result[0].quote,s.reviewedPages[0].text.slice(result[0].start,result[0].end));
 assert.ok(index.stats(forOwner('a')).fileBytes>0);index.close();
}));

test('atomic CAS reindex drops old terms, preserves new anchors and blocks stale writers',async()=>withIndex(async path=>{
 const index=createSourceIndex(path),old=source('pump',long('outdated blue valve phrase'));
 index.upsert(forOwner('a',{source:old}));
 const revised=source('pump',long('replacement golden turbine phrase'));
 assert.throws(()=>index.upsert(forOwner('a',{source:revised})),e=>e.status===409);
 assert.equal(index.upsert(forOwner('a',{source:revised,expectedRevision:old.revision})).action,'reindexed');
 assert.equal(index.search(forOwner('a',{query:'outdated'})).results.length,0);
 assert.equal(index.search(forOwner('a',{query:'replacement'})).results[0].revision,revised.revision);
 assert.throws(()=>index.upsert(forOwner('a',{source:old,expectedRevision:old.revision})),e=>e.status===409);
 index.close();
}));

test('revision-checked deletion invalidates all chunks and postings without touching other owners',async()=>withIndex(async path=>{
 const index=createSourceIndex(path),a=source('same',long('stator rotor owned a'),'a'),b=source('same',long('stator rotor owned b'),'b');
 index.upsert(forOwner('a',{source:a}));index.upsert(forOwner('b',{source:b}));
 assert.throws(()=>index.deleteSource(forOwner('a',{sourceId:'same',expectedRevision:'old'})),e=>e.status===409);
 assert.equal(index.deleteSource(forOwner('a',{sourceId:'same',expectedRevision:a.revision})).deleted,true);
 assert.equal(index.deleteSource(forOwner('a',{sourceId:'same',expectedRevision:a.revision})).deleted,false);
 assert.equal(index.search(forOwner('a',{query:'stator'})).results.length,0);
 assert.equal(index.stats(forOwner('a')).postings,0);
 assert.equal(index.search(forOwner('b',{query:'stator'})).results.length,1);
 assert.equal(index.deleteOwner(forOwner('b')).deleted,1);
 assert.equal(index.stats(forOwner('b')).chunks,0);
 index.close();
}));

test('auth owner gate refuses cross-tenant read/write/delete, and scopes even duplicate IDs',async()=>withIndex(async path=>{
 const index=createSourceIndex(path),s=source('public-id',long('motor stator target'));
 index.upsert(forOwner('a',{source:s}));
 assert.throws(()=>index.search({ownerId:'a',expectedOwnerId:'b',query:'stator'}),/owner/);
 assert.throws(()=>index.upsert({ownerId:'b',expectedOwnerId:'a',source:s}),/owner/);
 assert.throws(()=>index.deleteSource({ownerId:'a',expectedOwnerId:'b',sourceId:'public-id',expectedRevision:s.revision}),/owner/);
 assert.equal(index.search(forOwner('b',{query:'stator'})).results.length,0);
 index.close();
}));

test('unreviewed, forged revisions, oversized queries and invalid schema inputs fail closed',async()=>withIndex(async path=>{
 const index=createSourceIndex(path),s=source('forgery',long('motor rotor stator'));
 assert.throws(()=>index.upsert(forOwner('a',{source:{...s,reviewed:false}})),/reviewed/);
 assert.throws(()=>index.upsert(forOwner('a',{source:{...s,revision:'f'.repeat(64)}})),/hash mismatch/);
 assert.throws(()=>index.upsert(forOwner('a',{source:{...s,ownerId:'someone-else'}})),/owner/);
 assert.throws(()=>index.search(forOwner('a',{query:'x'.repeat(1001)})),/1000/);
 assert.throws(()=>index.search(forOwner('a',{query:'test',limit:200})),/1–12/);
 assert.equal(index.stats(forOwner('a')).documents,0);index.close();
}));

test('unicode normalization gives repeatable accent-insensitive lexical matching',async()=>withIndex(async path=>{
 const index=createSourceIndex(path);index.upsert(forOwner('a',{source:source('afrikaans',long('finansiële begroting kontantvloei'))}));
 assert.equal(index.search(forOwner('a',{query:'FINANSIELE'})).results.length,1);
 assert.equal(index.search(forOwner('a',{query:'kontantvloei'})).results.length,1);
 index.close();
}));
