// Lists available Google TTS voice NAMES only (free metadata call). Never prints tokens.
import {getToken} from '../../../studio/server/google.mjs';
const token=await getToken();
const out={};
for(const lang of ['en-ZA','en-GB','af-ZA']){
  const r=await fetch(`https://texttospeech.googleapis.com/v1/voices?languageCode=${lang}`,{headers:{Authorization:`Bearer ${token}`,'x-goog-user-project':'kairo-access-20261021'},signal:AbortSignal.timeout(30000)});
  if(!r.ok){out[lang]=`HTTP ${r.status}`;continue;}
  const j=await r.json();
  out[lang]=(j.voices||[]).filter(v=>/Chirp3-HD/.test(v.name)||lang!=='en-GB').map(v=>`${v.name}|${v.ssmlGender}|${v.languageCodes.join(',')}`);
}
console.log(JSON.stringify(out,null,1));
