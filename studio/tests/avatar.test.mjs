import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {VOICES,validateSpeech} from '../server/avatar/speech.mjs';
import {speechChunks,mouthEnergy,blendAmount} from '../src/avatar/motion.ts';
import {parseSettings} from '../src/teacher/model.ts';

test('speech requires explicit consent, a bounded UTF-8 payload and an exact supported voice',()=>{
 const request={text:'Explain opening stock.',voice:VOICES[0].id,consent:true};assert.equal(validateSpeech(request).voice.id,VOICES[0].id);
 for(const change of [{consent:false},{consent:'true'},{voice:'https://evil.invalid'},{text:' '},{text:'a'.repeat(1201)},{text:'😀'.repeat(1100)+'a'.repeat(101)}])assert.throws(()=>validateSpeech({...request,...change}),TypeError);
});
test('long narration is split into bounded requests without losing words',()=>{
 const text='A delivery increases stock. '.repeat(140).trim();const chunks=speechChunks(text);assert.ok(chunks.length>1);assert.ok(chunks.every(c=>c.length<=1200));assert.equal(chunks.join(' '),text);assert.equal(speechChunks('a'.repeat(2500)).join(''),'a'.repeat(2500));
});
test('audio-driven mouth closes in silence and remains bounded; blend has stable time behavior',()=>{
 assert.equal(mouthEnergy(new Uint8Array(256).fill(128)),0);assert.ok(mouthEnergy(new Uint8Array(256).fill(255))<=.8);assert.equal(mouthEnergy(new Uint8Array()),0);assert.equal(blendAmount(-1),0);assert.ok(Math.abs((1-blendAmount(.02))**2-(1-blendAmount(.04)))<1e-10);
});
test('old settings migrate safely and cloud consent cannot be enabled with truthy strings',()=>{
 const old=parseSettings(JSON.stringify({look:'soft3d',language:'en-ZA',rate:.94}));assert.equal(old.voiceMode,'browser');assert.equal(old.cloudConsent,false);
 const bad=parseSettings(JSON.stringify({voiceMode:'unknown',cloudVoice:'unknown',cloudConsent:'yes'}));assert.equal(bad.voiceMode,'browser');assert.equal(bad.cloudConsent,false);
});
test('prepared model retains articulated fingers, teaching bones, face controls and textures',async()=>{
 const data=await readFile(new URL('../public/models/teacher/teacher.glb',import.meta.url));assert.equal(data.toString('ascii',0,4),'glTF');const json=JSON.parse(data.toString('utf8',20,20+data.readUInt32LE(12)));const names=new Set(json.nodes.map(n=>n.name));for(const name of ['Head','LeftArm','LeftForeArm','RightArm','LeftHandIndex1','LeftHandIndex3','RightHandThumb3'])assert.ok(names.has(name),name);
 const morphs=new Set(json.meshes.flatMap(m=>m.extras?.targetNames||[]));for(const morph of ['jawOpen','eyeBlinkLeft','eyeBlinkRight','mouthSmileLeft','browInnerUp'])assert.ok(morphs.has(morph),morph);assert.ok(json.images.length>=5);assert.ok(data.length<15_000_000);
});
