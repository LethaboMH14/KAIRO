import {createHash} from 'node:crypto';
import {Router,json} from 'express';
import {cloudConfigured,getToken} from '../google.mjs';

export const VOICES=Object.freeze([
 {id:'en-GB-Chirp3-HD-Aoede',language:'en-GB',label:'Aoede · English (UK)',family:'Google Chirp 3 HD'},
 {id:'en-US-Chirp3-HD-Kore',language:'en-US',label:'Kore · English (US)',family:'Google Chirp 3 HD'},
 {id:'en-GB-Chirp3-HD-Puck',language:'en-GB',label:'Puck · English (UK)',family:'Google Chirp 3 HD'},
]);
export function validateSpeech(value){
 if(value?.consent!==true)throw new TypeError('Enable Google voice consent before sending text.');
 if(typeof value.text!=='string'||!value.text.trim()||value.text.length>1200||Buffer.byteLength(value.text)>4500)throw new TypeError('Speech accepts 1–1,200 characters (up to 4,500 UTF-8 bytes).');
 const voice=VOICES.find(v=>v.id===value.voice);if(!voice)throw new TypeError('Choose an available cloud voice.');
 return {text:value.text.trim(),voice};
}
export async function synthesizeSpeech({text,voice}){
 const token=await getToken();const response=await fetch('https://texttospeech.googleapis.com/v1/text:synthesize',{
  method:'POST',signal:AbortSignal.timeout(45000),headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','x-goog-user-project':'kairo-access-20261021'},
  body:JSON.stringify({input:{text},voice:{languageCode:voice.language,name:voice.id},audioConfig:{audioEncoding:'MP3'}})
 });
 if(!response.ok)throw new Error(`Cloud voice unavailable (HTTP ${response.status}).`);
 const result=await response.json();if(typeof result.audioContent!=='string'||result.audioContent.length<100)throw new Error('Cloud voice returned no audio.');
 return Buffer.from(result.audioContent,'base64');
}
export function speechRouter(){
 const router=Router();router.use(json({limit:'8kb'}));let busy=false,calls=0,characters=0;const cache=new Map();
 router.get('/voices',(_req,res)=>res.json({enabled:cloudConfigured(),voices:VOICES,limits:{requestCharacters:1200,processCharacters:20000,processCalls:100}}));
 router.post('/speech',async(req,res)=>{
  try{
   const value=validateSpeech(req.body);if(!cloudConfigured())return res.status(503).json({error:'Cloud voice is off. Choose browser narration in teacher settings.'});
   const key=createHash('sha256').update(JSON.stringify(value)).digest('hex');
   if(cache.has(key))return res.set({'Content-Type':'audio/mpeg','Cache-Control':'no-store','X-Kairo-Voice':value.voice.id,'X-Kairo-Cache':'hit'}).send(cache.get(key));
   if(busy||calls>=100||characters+value.text.length>20000)return res.status(429).json({error:'Voice preview allowance reached or another request is running. Try browser narration.'});
   calls++;characters+=value.text.length;busy=true;
   try{const audio=await synthesizeSpeech(value);cache.set(key,audio);if(cache.size>16)cache.delete(cache.keys().next().value);res.set({'Content-Type':'audio/mpeg','Cache-Control':'no-store','X-Kairo-Voice':value.voice.id,'X-Kairo-Cache':'miss'}).send(audio);}finally{busy=false;}
  }catch(error){res.status(error instanceof TypeError?400:503).json({error:error instanceof TypeError?error.message:'Google voice could not generate audio. Try browser narration or retry later.'});}
 });return router;
}
