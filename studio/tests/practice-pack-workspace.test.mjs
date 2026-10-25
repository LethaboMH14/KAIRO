import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import {initialRun,practicePacks,transition,exportRun} from '../src/practice-packs/model.ts';
import {learnerStepView} from '../src/practice-pack-workspace/presenter.ts';

const studioRoot=fileURLToPath(new URL('..',import.meta.url));
const time='2026-10-22T10:00:00.000Z';
const next=(n)=>new Date(Date.parse(time)+n*1000).toISOString();

test('the consumed learner presenter exposes only labels before a choice is submitted',()=>{
 const run=initialRun('fictional-requirements-uat','workspace-test',time),view=learnerStepView(run);
 assert.equal(run.stepIndex,0);assert.equal(view.stepNumber,1);
 assert.deepEqual(Object.keys(view.choices[0]).sort(),['id','label']);
 assert.ok(view.choices.every(choice=>!('disposition'in choice)&&!('demonstrates'in choice)&&!('rationale'in choice)));
 assert.equal(view.stepNumber,1);assert.equal(view.revision,null);
});

test('learner view reveals scripted revision only when reducer advances to that step',()=>{
 let run=initialRun('fictional-requirements-uat','revision-test',time);
 assert.equal(learnerStepView(run).revision,null);
 run=transition(run,{type:'choose',choiceId:'ask-and-record'},next(1));
 const view=learnerStepView(run);
 assert.equal(run.stepIndex,1);assert.equal(view.stepNumber,2);
 assert.equal(view.stepId,'revised-requirement');assert.equal(view.stepNumber,2);
 assert.match(view.revision.summary,/accessible access/);
 assert.ok(view.choices.every(choice=>Object.keys(choice).sort().join(',')==='id,label'));
});

test('two support options and an ambiguity escalation remain available in the consumed view',()=>{
 let run=initialRun('fictional-digital-support','ambiguity-test',time);
 run=transition(run,{type:'choose',choiceId:'escalate-verification'},next(1));
 run=transition(run,{type:'choose',choiceId:'offer-and-escalate'},next(2));
 const view=learnerStepView(run);
 assert.equal(view.stepId,'close-or-escalate');
 assert.ok(view.choices.some(choice=>choice.id==='keep-open-escalate'));
 assert.ok(view.choices.some(choice=>choice.id==='resolve-after-confirmation'));
 assert.equal(view.choices.find(choice=>choice.id==='keep-open-escalate').label.includes('cause is unknown'),true);
});

test('export supports an in-progress record and keeps reflection explicitly unassessed',()=>{
 const run=transition(initialRun('fictional-requirements-uat','export-test',time),{type:'choose',choiceId:'bounded-proposal'},next(1));
 const output=exportRun(run);
 assert.equal(output.record.status,'practice-in-progress');
 assert.equal(output.provenance.unverified,true);assert.equal(output.provenance.reflectionAssessed,false);
 assert.ok(output.record.events.some(event=>event.kind==='choice'));
});

test('React server render smoke shows only the fictional scenario picker and unsaved-memory status',async()=>{
 const server=await createServer({root:studioRoot,configFile:false,plugins:[reactPlugin()],server:{middlewareMode:true},appType:'custom'});
 try{
  const {default:Workspace}=await server.ssrLoadModule('/src/practice-pack-workspace/PracticePackWorkspace.tsx');
  const html=renderToStaticMarkup(React.createElement(Workspace));
  assert.match(html,/Choose a workplace scenario/);
  assert.match(html,/Nothing is saved automatically/);
  assert.match(html,/fictional formative exercises/);
  assert.ok(practicePacks.every(pack=>html.includes(pack.title)));
  assert.doesNotMatch(html,/export-identifiable|request-code|demonstrates|disposition/);
 }finally{await server.close();}
});
