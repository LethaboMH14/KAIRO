import test from 'node:test';
import assert from 'node:assert/strict';
import {pickVoice,isNaturalVoice,isFemaleVoice,selectableVoices} from '../src/teacher/naturalVoice.ts';
import {parseSettings,defaultSettings} from '../src/teacher/model.ts';

const v=(name,lang)=>({name,lang,voiceURI:name});
const windowsChrome=[v('Microsoft David - English (United States)','en-US'),v('Microsoft Zira - English (United States)','en-US'),v('Microsoft Mark - English (United States)','en-US'),v('Google US English','en-US'),v('Google UK English Female','en-GB'),v('Google UK English Male','en-GB')];
const edge=[v('Microsoft David - English (United States)','en-US'),v('Microsoft Luke Online (Natural) - English (South Africa)','en-ZA'),v('Microsoft Leah Online (Natural) - English (South Africa)','en-ZA'),v('Microsoft Sonia Online (Natural) - English (United Kingdom)','en-GB'),v('Microsoft Thando Online (Natural) - Zulu (South Africa)','zu-ZA'),v('Microsoft Themba Online (Natural) - Zulu (South Africa)','zu-ZA')];

test('robotic desktop and eSpeak voices are never treated as natural',()=>{
 for(const name of ['Microsoft David - English (United States)','Microsoft Zira - English (United States)','eSpeak English'])assert.equal(isNaturalVoice(v(name,'en-US')),false,name);
 for(const name of ['Google UK English Female','Microsoft Leah Online (Natural) - English (South Africa)','Samantha (Enhanced)'])assert.equal(isNaturalVoice(v(name,'en')),true,name);
});
test('South African English prefers a natural female voice in the exact locale',()=>{
 assert.match(pickVoice(edge,'en-ZA').name,/Leah/);
 assert.match(pickVoice(edge,'zu-ZA').name,/Thando/);
 assert.ok(isFemaleVoice(pickVoice(windowsChrome,'en-ZA')));
 assert.equal(pickVoice(windowsChrome,'en-ZA').name,'Google UK English Female');
});
test('no natural voice means no voice unless basic voices are allowed',()=>{
 const robotic=windowsChrome.filter(x=>x.name.startsWith('Microsoft'));
 assert.equal(pickVoice(robotic,'en-ZA'),null);
 assert.match(pickVoice(robotic,'en-ZA','',true).name,/Zira/);
 assert.deepEqual(selectableVoices(robotic,false),[]);
});
test('a saved voice wins only when it is still allowed',()=>{
 assert.match(pickVoice(edge,'en-ZA','Microsoft Luke Online (Natural) - English (South Africa)').name,/Luke/);
 assert.match(pickVoice(edge,'en-US','Microsoft David - English (United States)').name,/Leah|Sonia/);
});
test('new learners default to the natural female cloud voice; saved device mode is kept',()=>{
 assert.equal(defaultSettings().voiceMode,'google');assert.equal(defaultSettings().cloudVoice,'en-GB-Chirp3-HD-Aoede');
 assert.equal(parseSettings(null).voiceMode,'google');
 assert.equal(parseSettings(JSON.stringify({voiceMode:'browser'})).voiceMode,'browser');
 assert.equal(parseSettings(JSON.stringify({})).voiceMode,'google');
 assert.equal(parseSettings(JSON.stringify({allowBasicVoices:true})).allowBasicVoices,true);
 assert.equal(parseSettings(JSON.stringify({allowBasicVoices:'yes'})).allowBasicVoices,false);
});
