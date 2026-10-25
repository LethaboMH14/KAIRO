import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {statSync} from 'node:fs';

const SCHEMA_VERSION=1;
const CHUNK_SIZE=1400;
const fail=(message)=>{throw new TypeError(message);};
const conflict=(message)=>{const e=new Error(message);e.status=409;throw e;};

function identifier(value,name){
 if(typeof value!=='string'||!value.trim()||value.length>160||/[\u0000-\u001f]/u.test(value))fail(`Invalid ${name}.`);
 return value;
}
function ownerScope(ownerId,expectedOwnerId){
 identifier(ownerId,'owner');
 if(ownerId!==expectedOwnerId)fail('Private index owner does not match authenticated owner.');
}
function tokens(text){
 return [...new Set(String(text).normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase('und').split(/[^\p{L}\p{N}]+/u).filter(t=>t.length>=2).slice(0,64))];
}
function frequencies(text){
 const map=new Map();
 for(const term of String(text).normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase('und').split(/[^\p{L}\p{N}]+/u))if(term.length>=2)map.set(term,(map.get(term)||0)+1);
 return map;
}
export function reviewedRevision(pages){
 return createHash('sha256').update(JSON.stringify(pages)).digest('hex');
}
function checkSource(source,ownerId){
 if(!source||source.reviewed!==true)fail('Only explicitly reviewed sources can be indexed.');
 identifier(source.id,'source id');
 identifier(source.title,'source title');
 if(source.ownerId!==undefined&&source.ownerId!==ownerId)fail('Source owner does not match authenticated owner.');
 const pages=source.reviewedPages;
 if(!Array.isArray(pages)||!pages.length||pages.length>100)fail('Invalid reviewed pages.');
 let chars=0;
 for(const p of pages){
  if(!p||typeof p.text!=='string'||p.text.length>16000||typeof p.locator!=='string'||!p.locator.trim()||p.locator.length>200)fail('Invalid reviewed page or locator.');
  chars+=p.text.length;
 }
 if(chars<80||chars>48000)fail('Reviewed text must contain 80–48000 characters.');
 if(!/^[a-f0-9]{64}$/u.test(source.revision)||source.revision!==reviewedRevision(pages))fail('Reviewed source revision hash mismatch.');
 return pages;
}

/** Isolated SQLite prototype. Caller must supply a trusted authenticated owner as expectedOwnerId. */
export function createSourceIndex(path){
 if(typeof path!=='string'||!path.trim())fail('A SQLite index path is required.');
 const db=new DatabaseSync(path);
 db.exec(`PRAGMA foreign_keys=ON; PRAGMA secure_delete=ON;
  CREATE TABLE IF NOT EXISTS index_documents (owner TEXT NOT NULL,source_id TEXT NOT NULL,revision TEXT NOT NULL,title TEXT NOT NULL,PRIMARY KEY(owner,source_id));
  CREATE TABLE IF NOT EXISTS index_chunks (owner TEXT NOT NULL,source_id TEXT NOT NULL,chunk_id TEXT NOT NULL,page_index INTEGER NOT NULL,locator TEXT NOT NULL,start INTEGER NOT NULL,end INTEGER NOT NULL,quote TEXT NOT NULL,edited INTEGER NOT NULL,PRIMARY KEY(owner,source_id,chunk_id),FOREIGN KEY(owner,source_id) REFERENCES index_documents(owner,source_id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS index_postings (owner TEXT NOT NULL,source_id TEXT NOT NULL,chunk_id TEXT NOT NULL,term TEXT NOT NULL,frequency INTEGER NOT NULL,PRIMARY KEY(owner,source_id,chunk_id,term),FOREIGN KEY(owner,source_id,chunk_id) REFERENCES index_chunks(owner,source_id,chunk_id) ON DELETE CASCADE);
  CREATE INDEX IF NOT EXISTS index_postings_lookup ON index_postings(owner,term);
 `);
 const version=db.prepare('PRAGMA user_version').get().user_version;
 if(version!==0&&version!==SCHEMA_VERSION){db.close();throw new Error('Unsupported source index schema version.');}
 if(version===0)db.exec(`PRAGMA user_version=${SCHEMA_VERSION}`);
 const find=db.prepare('SELECT revision FROM index_documents WHERE owner=? AND source_id=?');
 const drop=db.prepare('DELETE FROM index_documents WHERE owner=? AND source_id=?');
 const addDoc=db.prepare('INSERT INTO index_documents(owner,source_id,revision,title) VALUES(?,?,?,?)');
 const addChunk=db.prepare('INSERT INTO index_chunks(owner,source_id,chunk_id,page_index,locator,start,end,quote,edited) VALUES(?,?,?,?,?,?,?,?,?)');
 const addPosting=db.prepare('INSERT INTO index_postings(owner,source_id,chunk_id,term,frequency) VALUES(?,?,?,?,?)');
 function transaction(fn){
  db.exec('BEGIN IMMEDIATE');
  try{const result=fn();db.exec('COMMIT');return result;}
  catch(e){db.exec('ROLLBACK');throw e;}
 }
 function upsert({ownerId,expectedOwnerId,source,expectedRevision=null}){
  ownerScope(ownerId,expectedOwnerId);
  const pages=checkSource(source,ownerId);
  return transaction(()=>{
   const prev=find.get(ownerId,source.id)?.revision??null;
   if(prev===source.revision)return {action:'unchanged',revision:prev};
   if(prev!==expectedRevision)conflict('Source index changed; reindex from its current revision.');
   if(prev!==null)drop.run(ownerId,source.id);
   addDoc.run(ownerId,source.id,source.revision,source.title);
   let chunks=0;
   pages.forEach((page,pageIndex)=>{
    for(let start=0;start<page.text.length;start+=CHUNK_SIZE){
     const quote=page.text.slice(start,start+CHUNK_SIZE);
     if(!quote.trim())continue;
     const chunkId=`S${pageIndex+1}-${start}`;
     addChunk.run(ownerId,source.id,chunkId,pageIndex,page.locator,start,start+quote.length,quote,page.edited===true?1:0);
     for(const [term,frequency] of frequencies(quote))addPosting.run(ownerId,source.id,chunkId,term,frequency);
     chunks++;
    }
   });
   return {action:prev?'reindexed':'indexed',revision:source.revision,chunks};
  });
 }
 function deleteSource({ownerId,expectedOwnerId,sourceId,expectedRevision}){
  ownerScope(ownerId,expectedOwnerId);identifier(sourceId,'source id');
  return transaction(()=>{
   const prev=find.get(ownerId,sourceId)?.revision;
   if(!prev)return {deleted:false};
   if(expectedRevision!==prev)conflict('Source revision changed; refusing stale delete.');
   drop.run(ownerId,sourceId);
   return {deleted:true,revision:prev};
  });
 }
 function deleteOwner({ownerId,expectedOwnerId}){
  ownerScope(ownerId,expectedOwnerId);
  return transaction(()=>({deleted:db.prepare('DELETE FROM index_documents WHERE owner=?').run(ownerId).changes}));
 }
 function search({ownerId,expectedOwnerId,query,limit=5}){
  ownerScope(ownerId,expectedOwnerId);
  if(typeof query!=='string'||query.length>1000)fail('Query must be at most 1000 characters.');
  if(!Number.isInteger(limit)||limit<1||limit>12)fail('Result limit must be 1–12.');
  const terms=tokens(query).slice(0,16);
  if(!terms.length)return {schemaVersion:SCHEMA_VERSION,method:'indexed-lexical-v1',results:[]};
  const placeholders=terms.map(()=>'?').join(',');
  const rows=db.prepare(`SELECT p.source_id AS sourceId,p.chunk_id AS chunkId,d.revision,d.title,c.locator,c.page_index AS pageIndex,c.start,c.end,c.quote,c.edited,COUNT(DISTINCT p.term) AS matches,SUM(p.frequency) AS termFrequency FROM index_postings p JOIN index_chunks c ON p.owner=c.owner AND p.source_id=c.source_id AND p.chunk_id=c.chunk_id JOIN index_documents d ON p.owner=d.owner AND p.source_id=d.source_id WHERE p.owner=? AND p.term IN (${placeholders}) GROUP BY p.source_id,p.chunk_id ORDER BY matches DESC,termFrequency DESC,p.source_id ASC,c.page_index ASC,c.start ASC LIMIT ?`).all(ownerId,...terms,limit);
  return {schemaVersion:SCHEMA_VERSION,method:'indexed-lexical-v1',results:rows.map(r=>({id:`${encodeURIComponent(r.sourceId)}::${r.chunkId}`,sourceId:r.sourceId,revision:r.revision,title:r.title,locator:r.locator,pageIndex:r.pageIndex,start:r.start,end:r.end,quote:r.quote,edited:!!r.edited,score:{matchedTerms:r.matches,termFrequency:r.termFrequency}}))};
 }
 function stats({ownerId,expectedOwnerId}){
  ownerScope(ownerId,expectedOwnerId);
  const count=table=>db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE owner=?`).get(ownerId).n;
  return {schemaVersion:SCHEMA_VERSION,documents:count('index_documents'),chunks:count('index_chunks'),postings:count('index_postings'),fileBytes:path===':memory:'?null:statSync(path).size};
 }
 return {upsert,deleteSource,deleteOwner,search,stats,close:()=>db.close()};
}
