import {learnerStorage} from '../account/storage.ts';
import {createContext,useContext,useEffect,useRef,useState,type ReactNode,type MutableRefObject} from 'react';
import {Pause,Play,Square,Volume2} from 'lucide-react';
import {defaultSettings,parseSettings,SETTINGS_KEY,type TeacherSettings} from './model';
import {CLOUD_VOICES,mouthEnergy,speechChunks,type AudioSignal} from '../avatar/motion';
import './teacher.css';

type TeacherAPI={settings:TeacherSettings;update:(value:TeacherSettings)=>void;voices:SpeechSynthesisVoice[];say:(text:string,language?:string)=>void;stop:()=>void;pause:()=>void;status:string;speaking:boolean;paused:boolean;caption:string;audioSignal:MutableRefObject<AudioSignal>;};
const Teacher=createContext<TeacherAPI|null>(null);
export function useTeacher(){const value=useContext(Teacher);if(!value)throw new Error('TeacherProvider is required.');return value;}
export default function TeacherProvider({children}:{children:ReactNode}){
 const [settings,setSettings]=useState<TeacherSettings>(()=>{try{return parseSettings(learnerStorage.getItem(SETTINGS_KEY));}catch{return defaultSettings();}});
 const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]),[status,setStatus]=useState(''),[speaking,setSpeaking]=useState(false),[paused,setPaused]=useState(false),[caption,setCaption]=useState('');
 const active=useRef(0),audio=useRef<HTMLAudioElement|null>(null),audioContext=useRef<AudioContext|null>(null),abort=useRef<AbortController|null>(null),disposeAudio=useRef<()=>void>(()=>{}),audioSignal=useRef<AudioSignal>({energy:0,time:0,duration:0});
 function cancel(){active.current++;abort.current?.abort();abort.current=null;window.speechSynthesis?.cancel();if(audio.current){audio.current.onended=null;audio.current.pause();audio.current.src='';audio.current=null;}disposeAudio.current();disposeAudio.current=()=>{};audioSignal.current={energy:0,time:0,duration:0};}
 function stop(){cancel();setSpeaking(false);setPaused(false);setStatus('Narration stopped.');}
 useEffect(()=>{
  const refresh=()=>setVoices(window.speechSynthesis?.getVoices()||[]);refresh();window.speechSynthesis?.addEventListener('voiceschanged',refresh);const leave=()=>cancel();window.addEventListener('pagehide',leave);
  return()=>{cancel();void audioContext.current?.close();audioContext.current=null;window.speechSynthesis?.removeEventListener('voiceschanged',refresh);window.removeEventListener('pagehide',leave);};
 },[]);
 function update(value:TeacherSettings){cancel();setSpeaking(false);setPaused(false);setSettings(value);try{learnerStorage.setItem(SETTINGS_KEY,JSON.stringify(value));setStatus('Teacher preferences saved on this device.');}catch{setStatus('Preferences could not be saved in this browser.');}}
 async function cloudSay(text:string,language:string,id:number){
  const voice=CLOUD_VOICES.find(v=>v.id===settings.cloudVoice)||CLOUD_VOICES[0];
  if(!settings.cloudConsent){setStatus('Enable Google voice consent in Teacher settings first.');return;}
  if(language.split('-')[0]!==voice.language.split('-')[0]){setStatus(`The selected cloud voice speaks ${voice.language}. Choose an available voice for this passage language.`);return;}
  const controller=new AbortController();abort.current=controller;
  try{
   audioContext.current??=new AudioContext();await audioContext.current.resume();
   for(const chunk of speechChunks(text)){
    if(active.current!==id)return;setCaption(chunk);setStatus(`Preparing ${voice.label}…`);
    const response=await fetch('/api/avatar/speech',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({text:chunk,voice:voice.id,consent:true})});
    if(!response.ok){const error=await response.json();throw new Error(error.error||'Cloud speech is unavailable.');}
    const blob=await response.blob();if(active.current!==id)return;
    const url=URL.createObjectURL(blob),element=new Audio(url);audio.current=element;element.playbackRate=settings.rate;element.preservesPitch=true;
    const ctx=audioContext.current,source=ctx.createMediaElementSource(element),analyser=ctx.createAnalyser();analyser.fftSize=256;source.connect(analyser);analyser.connect(ctx.destination);const samples=new Uint8Array(analyser.fftSize);let raf=0;
    const sample=()=>{if(active.current!==id)return;analyser.getByteTimeDomainData(samples);audioSignal.current={energy:element.paused?0:mouthEnergy(samples),time:element.currentTime,duration:Number.isFinite(element.duration)?element.duration:0};raf=requestAnimationFrame(sample);};
    const cleanup=()=>{cancelAnimationFrame(raf);source.disconnect();analyser.disconnect();URL.revokeObjectURL(url);audioSignal.current.energy=0;};disposeAudio.current=cleanup;
    await new Promise<void>((resolve,reject)=>{const cancelled=()=>resolve();const done=()=>{controller.signal.removeEventListener('abort',cancelled);resolve();};const failed=(message:string)=>{controller.signal.removeEventListener('abort',cancelled);reject(new Error(message));};controller.signal.addEventListener('abort',cancelled,{once:true});element.onended=done;element.onerror=()=>failed('Audio could not play.');element.onplaying=()=>{if(active.current===id){setSpeaking(true);setStatus(`Speaking with ${voice.label}.`);}};sample();void element.play().catch(()=>failed('Audio playback was blocked. Press Read again.'));});
    cleanup();disposeAudio.current=()=>{};if(active.current!==id)return;
   }
   audio.current=null;setSpeaking(false);setPaused(false);setStatus('Reading finished.');
  }catch(error){if(active.current!==id)return;disposeAudio.current();disposeAudio.current=()=>{};setSpeaking(false);setPaused(false);setStatus((error as Error).message);}
 }
 function say(text:string,language=settings.language){
  cancel();setSpeaking(false);setPaused(false);const value=text.slice(0,5000);if(!value.trim())return;const id=active.current;setCaption(value);
  if(settings.voiceMode==='google'){void cloudSay(value,language,id);return;}
  if(!('speechSynthesis'in window)){setStatus('Browser narration is unavailable.');return;}
  const candidates=speechSynthesis.getVoices().filter(v=>v.lang.split('-')[0]===language.split('-')[0]);const chosen=candidates.find(v=>v.voiceURI===settings.voiceURI)||candidates.find(v=>v.lang.toLowerCase()===language.toLowerCase())||candidates[0];
  if(!chosen){setStatus(`No ${language} voice is available in this browser. Choose a supported voice in Teacher settings.`);return;}
  const utterance=new SpeechSynthesisUtterance(value);utterance.voice=chosen;utterance.lang=chosen.lang;utterance.rate=settings.rate;
  utterance.onstart=()=>{if(id!==active.current)return;setSpeaking(true);setStatus(`Reading with ${chosen.name} (${chosen.lang}).`);};
  utterance.onend=()=>{if(id!==active.current)return;setSpeaking(false);setPaused(false);setStatus('Reading finished.');};
  utterance.onerror=()=>{if(id!==active.current)return;setSpeaking(false);setPaused(false);setStatus('Narration could not play. The passage is still available as text.');};speechSynthesis.speak(utterance);
 }
 function pause(){if(!speaking)return;if(audio.current){if(paused){const element=audio.current,id=active.current;void element.play().catch(()=>{if(active.current!==id||audio.current!==element)return;cancel();setSpeaking(false);setPaused(false);setStatus('Press Read to restart narration.');});}else audio.current.pause();}else if(paused)speechSynthesis.resume();else speechSynthesis.pause();setPaused(!paused);}
 return <Teacher.Provider value={{settings,update,voices,say,stop,pause,status,speaking,paused,caption,audioSignal}}>{children}{(speaking||status)&&<aside className="kt-dock" aria-label="Narration controls"><Volume2 size={17}/><div><strong>{speaking?(paused?'Narration paused':'Reading your passage'):'Teacher controls'}</strong><span role="status">{status}</span></div>{speaking?<><button onClick={pause} aria-label={paused?'Resume narration':'Pause narration'}>{paused?<Play size={16}/>:<Pause size={16}/>}</button><button onClick={stop} aria-label="Stop narration"><Square size={15}/></button></>:<button onClick={()=>{cancel();setStatus('');}} aria-label="Dismiss teacher status">×</button>}<a href="/teacher">Settings</a></aside>}</Teacher.Provider>;
}
