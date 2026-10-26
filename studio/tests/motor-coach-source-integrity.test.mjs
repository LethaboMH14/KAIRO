import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';

const coachUrl=new URL('../src/studio-teaching-host/packs/motor.json',import.meta.url);
const lockedUrl=new URL('../../docs/engineering-pilot-packs-20261024/motor-field-speed.json',import.meta.url);
const manifestUrl=new URL('../src/prepared-clip-ui/preparedClipManifest.ts',import.meta.url);
const coach=JSON.parse(await readFile(coachUrl,'utf8'));

test('learner-facing coach references point to rotating-field and field-speed topics',()=>{
 const refs=new Map(coach.sourceRefs.map(ref=>[ref.id,ref]));
 assert.equal(refs.get('nptel-rotating-field')?.url,'https://archive.nptel.ac.in/content/storage2/courses/108106072/pdf/1_2.pdf');
 assert.equal(refs.get('nptel-field-speed')?.url,'https://archive.nptel.ac.in/content/storage2/courses/108106072/pdf/1_8.pdf');
 assert.equal(refs.size,2);
 assert.equal(JSON.stringify(coach).includes('108106026/chapter4.pdf'),false);
 assert.equal(JSON.stringify(coach).includes('108105053/pdf/L-01'),false);
 for(const step of [...coach.steps,...coach.practice])for(const id of step.sourceRefIds)assert.ok(refs.has(id),`unresolved source reference ${id}`);
});

test('source correction has a new coaching revision while immutable clip pack hashes still agree',async()=>{
 assert.equal(coach.supersedesId,'kairo-engineering-motor-field-speed-20261024');
 assert.match(coach.id,/20261026-source-corrected-r2/);
 const lockedHash=createHash('sha256').update(await readFile(lockedUrl)).digest('hex');
 const manifest=await readFile(manifestUrl,'utf8');
 assert.ok(manifest.includes(`sourcePackSha256: '${lockedHash}'`),'prepared clip still points to the unchanged hashed source pack');
 assert.equal(coach.steps.find(step=>step.id==='predict-field-speed').explanation.includes('120f/p'),true);
});

test('actual learner-facing StudioLessonPlan renders only corrected source links',async()=>{
 const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),configFile:false,optimizeDeps:{noDiscovery:true,include:[]},plugins:[reactPlugin()],server:{middlewareMode:true,ws:false},appType:'custom'});
 try{
  const {default:StudioLessonPlan}=await server.ssrLoadModule('/src/studio-teaching-host/StudioLessonPlan.tsx');
  const html=renderToStaticMarkup(React.createElement(StudioLessonPlan,{studio:'motor',onRead:()=>{}}));
  assert.match(html,/https:\/\/archive\.nptel\.ac\.in\/content\/storage2\/courses\/108106072\/pdf\/1_2\.pdf/);
  assert.match(html,/https:\/\/archive\.nptel\.ac\.in\/content\/storage2\/courses\/108106072\/pdf\/1_8\.pdf/);
  assert.doesNotMatch(html,/108106026\/chapter4\.pdf|108105053\/pdf\/L-01/);
 }finally{await server.close();}
});
