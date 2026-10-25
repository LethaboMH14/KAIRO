export type YouTubeReferenceResult =
 | {ok:true;videoId:string;startSeconds:number}
 | {ok:false;error:string};

const MAX_INPUT_CHARACTERS=2048;
const MAX_INPUT_BYTES=2048;
const MAX_START_SECONDS=604800;
const VIDEO_ID=/^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_WATCH_HOSTS=new Set(['youtube.com','www.youtube.com','m.youtube.com']);
const CONTROL_PARAMETERS=['v','t','start'] as const;

function invalid(error:string):YouTubeReferenceResult{return {ok:false,error};}

/**
 * Parse a learner-supplied YouTube URL into only the ID and start offset the
 * media presenter already validates. This never fetches or builds a player URL.
 */
export function parseYouTubeReference(input:unknown):YouTubeReferenceResult{
 if(typeof input!=='string')return invalid('Enter a YouTube URL.');
 if(input.length>MAX_INPUT_CHARACTERS||new TextEncoder().encode(input).length>MAX_INPUT_BYTES)
  return invalid('YouTube URL must be no more than 2,048 characters and UTF-8 bytes.');

 const value=input.trim();
 if(!value||/[\u0000-\u001f\u007f\\]/.test(value))return invalid('Enter a valid HTTPS YouTube URL.');
 if(value.includes('#'))return invalid('YouTube URLs with fragments are not supported.');

 let url:URL;
 try{url=new URL(value);}catch{return invalid('Enter a valid HTTPS YouTube URL.');}
 if(url.protocol!=='https:'||url.username||url.password||url.port)
  return invalid('Use HTTPS without credentials or a nondefault port.');

 // Check the literal path too: URL normalizes dot segments before exposing pathname.
 const schemeEnd=value.indexOf('://');
 if(schemeEnd<0)return invalid('Enter a full HTTPS YouTube URL.');
 const authorityStart=schemeEnd+3;
 let pathStart=value.length;
 for(const delimiter of ['/','?','#']){
  const index=value.indexOf(delimiter,authorityStart);
  if(index>=0&&index<pathStart)pathStart=index;
 }
 if(value.slice(authorityStart,pathStart).includes('@'))return invalid('Use HTTPS without credentials or a nondefault port.');
 let rawPath='';
 if(value[pathStart]==='/'){
  let pathEnd=value.length;
  for(const delimiter of ['?','#']){
   const index=value.indexOf(delimiter,pathStart);
   if(index>=0&&index<pathEnd)pathEnd=index;
  }
  rawPath=value.slice(pathStart,pathEnd);
 }

 const params=url.searchParams;
 for(const name of CONTROL_PARAMETERS){
  if(params.getAll(name).length>1)return invalid(`YouTube URL repeats the ${name} parameter.`);
 }
 if(params.has('t')&&params.has('start'))return invalid('Use either t or start, not both.');

 let videoId:string;
 if(YOUTUBE_WATCH_HOSTS.has(url.hostname)){
  if(rawPath!=='/watch')return invalid('Use a YouTube /watch URL.');
  const ids=params.getAll('v');
  if(ids.length!==1)return invalid('YouTube watch URLs need exactly one video ID.');
  videoId=ids[0];
 }else if(url.hostname==='youtu.be'){
  if(params.has('v'))return invalid('Short YouTube URLs must use the video ID in the path.');
  const match=/^\/([A-Za-z0-9_-]{11})$/.exec(rawPath);
  if(!match)return invalid('Use one 11-character ID in the youtu.be path.');
  videoId=match[1];
 }else return invalid('Use youtube.com, www.youtube.com, m.youtube.com, or youtu.be.');

 if(!VIDEO_ID.test(videoId))return invalid('YouTube video IDs must contain exactly 11 supported characters.');

 const timestamp=params.get('t')??params.get('start');
 let startSeconds=0;
 if(timestamp!==null){
  const match=/^(\d+)s?$/.exec(timestamp);
  if(!match)return invalid('Start time must be whole seconds, optionally followed by s.');
  startSeconds=Number(match[1]);
  if(!Number.isSafeInteger(startSeconds)||startSeconds<0||startSeconds>MAX_START_SECONDS)
   return invalid(`Start time must be from 0 to ${MAX_START_SECONDS} seconds.`);
 }

 return {ok:true,videoId,startSeconds};
}
