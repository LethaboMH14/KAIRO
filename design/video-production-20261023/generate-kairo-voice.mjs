// Public authored advert text only. Reuses the app's exact Aoede provider/voice.
// No credentials are logged or saved. Five bounded calls, no hidden retry.
import {writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {synthesizeSpeech,VOICES} from '../../studio/server/avatar/speech.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const voice=VOICES.find(v=>v.id==='en-GB-Chirp3-HD-Aoede');
const clips=[
 {id:'01-reveal',start:3,end:5,text:'Meet Cairo.',caption:'Meet KAIRO.'},
 {id:'02-material',start:5,end:10,text:'Bring your material. Learn at your pace. Explore it.',caption:'Bring your material. Learn at your pace. Explore it.'},
 {id:'03-practice',start:10,end:14,text:'Practise, and build evidence of your skills.',caption:'Practise, and build evidence of your skills.'},
 {id:'04-next',start:14,end:18,text:'Next, connect that evidence to roles and proposed rewards.',caption:'Next: connect that evidence to roles and proposed rewards.'},
 {id:'05-close',start:18,end:20,text:'Put knowledge to work.',caption:'KAIRO. Put knowledge to work.'}
];
const chars=clips.reduce((n,c)=>n+c.text.length,0);
if(chars>600)throw new Error('Production batch character cap exceeded.');
await mkdir(path.join(here,'voice'),{recursive:true});
const result={voice:voice.id,locale:voice.language,kind:'Synthetic Google HD narration; same default cloud voice configured in KAIRO, not an identified human speaker',characters:chars,calls:[],phoneticNote:'Cairo is used only as a pronunciation hint in the reveal audio. All visible branding is KAIRO.',textPrivacy:'Public authored pitch text only; no face, private material or user voice sent.'};
for(const c of clips){
 const file=path.join(here,'voice',`${c.id}.mp3`);
 const audio=await synthesizeSpeech({text:c.text,voice});
 await writeFile(file,audio);
 result.calls.push({...c,file:`voice/${c.id}.mp3`,bytes:audio.length,sha256:createHash('sha256').update(audio).digest('hex')});
 // Persist completed call evidence incrementally if a later call fails.
 await writeFile(path.join(here,'voice','generation.json'),JSON.stringify(result,null,2));
}
console.log(JSON.stringify({voice:result.voice,characters:chars,successfulCalls:result.calls.length,output:'voice/generation.json'}));
