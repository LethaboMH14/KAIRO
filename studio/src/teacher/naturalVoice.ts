export type VoiceLike={name:string;lang:string;voiceURI:string};
// Neural/cloud-backed device voices. Microsoft desktop SAPI voices ("Microsoft David - English") and eSpeak are not natural.
const NATURAL=/\b(natural|neural|online|premium|enhanced|wavenet|chirp)\b|^google\b|\bsiri\b/i;
const ROBOTIC=/espeak|^microsoft (david|zira|mark|hazel|george|susan|heera|ravi|catherine|james|linda|richard)\b(?!.*\b(online|natural)\b)/i;
const FEMALE=/\b(female|woman|aria|jenny|leah|sonia|libby|maisie|natasha|clara|emma|ava|michelle|ana|samantha|karen|moira|tessa|fiona|victoria|serena|kate|aoede|kore|adri|thando|zira)\b/i;
export const isNaturalVoice=(v:VoiceLike)=>NATURAL.test(v.name)&&!ROBOTIC.test(v.name);
export const isFemaleVoice=(v:VoiceLike)=>FEMALE.test(v.name);
const base=(lang:string)=>lang.toLowerCase().split(/[-_]/)[0];
/** Best voice for a language: natural only unless basic voices are allowed; the learner's saved choice wins when it qualifies; then female, exact locale, then name for a stable order. */
export function pickVoice<V extends VoiceLike>(voices:readonly V[],language:string,preferredURI='',allowBasic=false):V|null{
 const wanted=language.toLowerCase();
 const pool=voices.filter(v=>base(v.lang)===base(language)&&(allowBasic||isNaturalVoice(v)));
 const preferred=pool.find(v=>v.voiceURI===preferredURI);if(preferred)return preferred;
 const score=(v:V)=>(isNaturalVoice(v)?4:0)+(isFemaleVoice(v)?2:0)+(v.lang.toLowerCase().replace('_','-')===wanted?1:0);
 return [...pool].sort((a,b)=>score(b)-score(a)||a.name.localeCompare(b.name))[0]||null;
}
/** Device voices the learner may choose in settings. */
export const selectableVoices=<V extends VoiceLike>(voices:readonly V[],allowBasic:boolean)=>voices.filter(v=>allowBasic||isNaturalVoice(v));
