export type Look='soft3d'|'graphic3d'|'realistic';
export type TeacherSettings={version:1;look:Look;voiceURI:string;language:string;rate:number;voiceMode?:'browser'|'google';cloudVoice?:string;cloudConsent?:boolean;allowBasicVoices?:boolean;};
export const SETTINGS_KEY='kairo-teacher-settings-v1';
export const defaultSettings=():TeacherSettings=>({version:1,look:'soft3d',voiceURI:'',language:'en-ZA',rate:.94,voiceMode:'google',cloudVoice:'en-GB-Chirp3-HD-Aoede',cloudConsent:false,allowBasicVoices:false});
export function parseSettings(raw:string|null):TeacherSettings{
 if(!raw)return defaultSettings();const value=JSON.parse(raw);return {version:1,look:['soft3d','graphic3d','realistic'].includes(value?.look)?value.look:'soft3d',voiceURI:typeof value?.voiceURI==='string'?value.voiceURI.slice(0,500):'',language:['en-ZA','af-ZA','zu-ZA','xh-ZA','st-ZA','tn-ZA'].includes(value?.language)?value.language:'en-ZA',rate:typeof value?.rate==='number'&&Number.isFinite(value.rate)?Math.min(1.2,Math.max(.75,value.rate)):.94,voiceMode:value?.voiceMode==='browser'?'browser':'google',cloudVoice:['en-GB-Chirp3-HD-Aoede','en-US-Chirp3-HD-Kore','en-GB-Chirp3-HD-Puck'].includes(value?.cloudVoice)?value.cloudVoice:'en-GB-Chirp3-HD-Aoede',cloudConsent:value?.cloudConsent===true,allowBasicVoices:value?.allowBasicVoices===true};
}
export type PassageContext={kind:'source'|'lesson';id:string;revision:string;section?:number;evidenceId?:string};
export type Span={start:number;end:number;text:string};
export type Annotation=Span&{id:string;kind:'highlight'|'star';at:string};
export function sentences(text:string):Span[]{
 const result:Span[]=[];let start=0;
 // Split only after sentence punctuation followed by whitespace, or at a newline. Preserve exact offsets.
 const boundaries=Array.from(text.matchAll(/[.!?](?=\s|$)|\n/g)).map(m=>m.index!+m[0].length);
 for(const end of [...boundaries,text.length]){if(end<=start)continue;const raw=text.slice(start,end);const lead=raw.length-raw.trimStart().length;const trimEnd=raw.trimEnd().length;if(raw.trim())result.push({start:start+lead,end:start+trimEnd,text:raw.trim()});start=end;}
 return result;
}
export function validSpan(text:string,start:number,end:number):Span{
 if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start||end>text.length||end-start>1200||!text.slice(start,end).trim())throw new Error('Select 1–1,200 characters from this passage.');
 return {start,end,text:text.slice(start,end)};
}
export function annotationKey(c:PassageContext){return `kairo-annotations-v1:${c.kind}:${c.id}:${c.revision}:${c.evidenceId||c.section||0}`;}
export function parseAnnotations(raw:string|null,text:string):Annotation[]{
 if(!raw)return [];const values=JSON.parse(raw);if(!Array.isArray(values))throw new Error('Annotations could not be read.');
 return values.filter((a:Annotation)=>a&&typeof a.id==='string'&&typeof a.at==='string'&&['highlight','star'].includes(a.kind)&&Number.isInteger(a.start)&&Number.isInteger(a.end)&&a.start>=0&&a.end>a.start&&a.end<=text.length&&a.end-a.start<=1200&&a.text===text.slice(a.start,a.end)).slice(-100);
}
export function toggleAnnotation(annotations:Annotation[],span:Span,kind:Annotation['kind'],id:string,at:string):Annotation[]{const found=annotations.some(a=>a.start===span.start&&a.end===span.end&&a.kind===kind);return found?annotations.filter(a=>!(a.start===span.start&&a.end===span.end&&a.kind===kind)):[...annotations,{...span,kind,id,at}].slice(-100);}
export function annotationMarkdown(title:string,context:PassageContext,annotations:Annotation[]){return `# ${title} — reading notes\n\nSource: ${context.kind} ${context.id}\nRevision: ${context.revision}\nSection: ${context.evidenceId||context.section||0}\n\n${annotations.map(a=>`## ${a.kind==='star'?'Important':'Highlighted'} · characters ${a.start}–${a.end}\n\n${a.text}\n\nSaved ${a.at}`).join('\n\n')||'No saved annotations.'}\n`;
}
export function stockVisualAvailable(text:string){const value=text.toLowerCase();return value.includes('stock')&&value.includes('deliver')&&value.includes('sales');}
export type TeacherAction={type:'focus_source';target:'source-reader'}|{type:'open_visual';template:'stock-flow'}|{type:'open_settings'};
export function allowedTeacherAction(value:unknown):value is TeacherAction{const a=value as TeacherAction;return !!a&&((a.type==='focus_source'&&a.target==='source-reader')||(a.type==='open_visual'&&a.template==='stock-flow')||a.type==='open_settings');}
