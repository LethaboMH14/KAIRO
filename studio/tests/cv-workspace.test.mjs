import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import {editFact} from '../src/cv-workspace/state.ts';
import {createCvDraft} from '../src/cv-draft/model.ts';

test('changing a confirmed detail revokes confirmation without changing other facts or input',()=>{
 const facts=[{id:'project-one',section:'projects',text:'Built a stock-control practice project.',providedBy:'applicant',confirmation:'confirmed'}, {id:'skill-one',section:'skills',text:'C++',providedBy:'applicant',confirmation:'confirmed'}];
 const before=structuredClone(facts);
 const edited=editFact(facts,'project-one',{text:'Helped build a stock-control practice project.',section:'practice'});
 assert.deepEqual(facts,before);
 assert.equal(edited[0].confirmation,'unconfirmed');
 assert.equal(edited[1],facts[1]);
 const draft=createCvDraft({facts:edited});
 assert.doesNotMatch(draft.draftText,/stock-control/);
 assert.match(draft.draftText,/C\+\+/);
 assert.deepEqual(draft.excludedFacts,[{factId:'project-one',reason:'not-confirmed-by-applicant'}]);
});

test('initial workspace offers explicit confirmation and a disabled download without assuming applicant facts',async()=>{
 const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),configFile:false,plugins:[reactPlugin()],server:{middlewareMode:true},appType:'custom'});
 try{
  const {default:CvWorkspace}=await server.ssrLoadModule('/src/cv-workspace/CvWorkspace.tsx');
  const html=renderToStaticMarkup(React.createElement(CvWorkspace));
  assert.match(html,/Review my draft/);assert.match(html,/disabled=""[^>]*>Download text/);
  assert.match(html,/Your details stay in this tab/);assert.match(html,/unconfirmed details and role notes are not included/);
  assert.match(html,/href="\/pathways"/);assert.doesNotMatch(html,/<iframe|<script|https?:\/\//);
 }finally{await server.close();}
});
