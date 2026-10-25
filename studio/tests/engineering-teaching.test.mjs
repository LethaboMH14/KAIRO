import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {engineeringExplanation} from '../src/engineering/teaching.ts';
import {PART_IDS,SOURCES} from '../src/engineering/motorContent.ts';

const context={selected:null,mode:'inspect',supplyId:'normal',frequency:'50',poles:4};
test('equipment teaching uses the actual selected part and retains existing source references',()=>{
 for(const selected of PART_IDS){const answer=engineeringExplanation({...context,selected},'part');assert.equal(answer.focus,selected);assert.equal(answer.sources,SOURCES);assert.ok(answer.text.length>80);}
 assert.match(engineeringExplanation(context,'part').text,/Select the stator/);
});
test('calculator teaching uses exact synchronous field speed and discloses visual limits',()=>{
 const result=engineeringExplanation(context,'field-speed');assert.match(result.text,/1500 r\/min/);assert.match(result.text,/not measured shaft speed/);assert.match(result.text,/does not rebuild/);
 assert.match(engineeringExplanation({...context,frequency:'60'},'field-speed').text,/1800 r\/min/);
 for(const frequency of ['NaN','<script>','0','401'])assert.doesNotMatch(engineeringExplanation({...context,frequency},'field-speed').text,/ = /);
 assert.match(engineeringExplanation({...context,poles:3},'field-speed').text,/even number/);
});
test('operating lesson uses actual selected supply, offers no real equipment diagnosis',()=>{
 const answer=engineeringExplanation({...context,mode:'operate'},'next');assert.match(answer.text,/not a measurement or a diagnosis/);assert.match(answer.text,/Pause the model/);
 const input=Object.freeze({...context});engineeringExplanation(input,'next');assert.equal(input.selected,null);
});
test('actual teaching panel escapes text and forwards controls without starting media',async()=>{
 const server=await createServer({configFile:false,plugins:[react()],server:{middlewareMode:true,ws:false},appType:'custom'});
 try{const {default:Panel}=await server.ssrLoadModule('/src/engineering/EngineeringTeacher.tsx');const calls=[];const props={explanation:{...engineeringExplanation(context,'next'),text:'<script>unsafe()</script>'},speaking:true,paused:true,status:'Paused',onExplain:i=>calls.push(i),onRead:()=>calls.push('read'),onPause:()=>calls.push('pause'),onStop:()=>calls.push('stop'),onFocus:()=>calls.push('focus')};
 const html=renderToStaticMarkup(React.createElement(Panel,props));assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.match(html,/Resume/);assert.match(html,/prepared explanations/i);assert.match(html,/Sources and teaching limits/);
 const linked=renderToStaticMarkup(React.createElement(Panel,{...props,returnLessonId:'a'.repeat(24)}));assert.match(linked,/tab=evidence/);assert.match(linked,/has not been checked/);const unsafe=renderToStaticMarkup(React.createElement(Panel,{...props,returnLessonId:'javascript:evil'}));assert.doesNotMatch(unsafe,/javascript:evil|Return to my lesson/);
 const tree=Panel(props);function walk(node){if(!node||typeof node!=='object')return;if(node.type==='button')node.props.onClick();React.Children.forEach(node.props?.children,walk);}walk(tree);assert.deepEqual(calls,['part','field-speed','next','read','pause','stop','focus']);
 }finally{await server.close();}
});
