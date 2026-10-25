import {readFile} from 'node:fs/promises';
import {reviewedRevision} from './index.mjs';

export function prepareFixtureSource(row){
 return {id:row.id,title:row.title,ownerId:row.ownerId,reviewed:true,reviewedPages:row.reviewedPages,revision:reviewedRevision(row.reviewedPages)};
}

/** A tiny deterministic lexical retrieval smoke benchmark, not language or learning validation. */
export function measure(index,fixture){
 if(fixture?.fixtureVersion!==1||!Array.isArray(fixture.sources)||!Array.isArray(fixture.queries))throw new TypeError('Unknown benchmark fixture.');
 const sources=new Map();
 for(const row of fixture.sources){
  const source=prepareFixtureSource(row);
  index.upsert({ownerId:row.ownerId,expectedOwnerId:row.ownerId,source});
  sources.set(`${row.ownerId}\0${row.id}`,source);
 }
 let hits1=0,hits3=0,valid=0,total=0,leaks=0;
 const cases=[];
 for(const q of fixture.queries){
  const results=index.search({ownerId:q.ownerId,expectedOwnerId:q.ownerId,query:q.query,limit:3}).results;
  const exact=results.map(r=>{
   const source=sources.get(`${q.ownerId}\0${r.sourceId}`);
   const page=source?.reviewedPages[r.pageIndex];
   return Boolean(source&&source.revision===r.revision&&page?.locator===r.locator&&page.text.slice(r.start,r.end)===r.quote&&r.id===`${encodeURIComponent(r.sourceId)}::S${r.pageIndex+1}-${r.start}`);
  });
  const hit1=results[0]?.sourceId===q.expectedSourceId;
  const hit3=results.some(r=>r.sourceId===q.expectedSourceId);
  hits1+=Number(hit1);hits3+=Number(hit3);valid+=exact.filter(Boolean).length;total+=results.length;leaks+=results.filter(r=>!sources.has(`${q.ownerId}\0${r.sourceId}`)).length;
  cases.push({language:q.language,hit1,hit3,returned:results.map(r=>r.sourceId),exactAnchors:exact.every(Boolean)});
 }
 return {fixtureVersion:fixture.fixtureVersion,queries:fixture.queries.length,recallAt1:hits1/fixture.queries.length,recallAt3:hits3/fixture.queries.length,citationAnchorPrecision:total?valid/total:null,ownerLeakageCount:leaks,cases};
}

export async function loadFixture(url){return JSON.parse(await readFile(url,'utf8'));}
