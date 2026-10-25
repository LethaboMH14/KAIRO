import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {getToken} from '../../studio/server/google.mjs';
import {VOICES,synthesizeSpeech} from '../../studio/server/avatar/speech.mjs';
const token=await getToken();
const response=await fetch('https://texttospeech.googleapis.com/v1/voices?languageCode=en-GB',{headers:{Authorization:`Bearer ${token}`,'x-goog-user-project':'kairo-access-20261021'},signal:AbortSignal.timeout(45000)});
if(!response.ok)throw new Error(`Voice catalogue HTTP ${response.status}`);
const catalogue=(await response.json()).voices;
const results=[];
for(const voice of VOICES){
 const text='Let us take this one step at a time. Twenty notebooks, plus twelve delivered, minus nine sold, leaves twenty three.';
 const started=Date.now();const audio=await synthesizeSpeech({text,voice});
 await writeFile(new URL(`../../assets/reference/teacher/${voice.id}.mp3`,import.meta.url),audio);
 results.push({voice:voice.id,bytes:audio.length,requestCharacters:text.length,durationMs:Date.now()-started,listedForUK:catalogue.some(v=>v.name===voice.id)});
}
await writeFile(new URL('../../data/private/app-workspace/avatar-verification.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),provider:'Google Cloud Text-to-Speech',project:'kairo-access-20261021',model:'Chirp 3 HD',privateCourseContentSent:false,voices:results},null,2));
console.log(JSON.stringify(results));
