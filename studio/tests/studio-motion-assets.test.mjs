import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const asset=name=>readFileSync(new URL('../public/media/explainers/'+name,import.meta.url));
test('served captioned clip is the exact independently inspected native render, not another asset',()=>{
 const bytes=asset('motor-field-speed.mp4');
 assert.equal(bytes.length,79179);assert.equal(bytes.subarray(4,8).toString(),'ftyp');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'f657f0e72df61aaec332fc1227653fac5d309e9204c828ab2f2a2c2b4518cf47');
});
test('caption sidecar and poster remain available for the prepared no-audio clip',()=>{
 const vtt=asset('motor-field-speed.vtt').toString('utf8');
 assert.match(vtt,/^WEBVTT/);assert.match(vtt,/synchronous|field speed/i);assert.match(vtt,/shaft|rotor/i);
 assert.equal(asset('motor-field-speed.png').subarray(1,4).toString(),'PNG');
});
