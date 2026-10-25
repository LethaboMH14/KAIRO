export type MediaPanelInput={videoId:string;startSeconds?:number;title:string;sourceContext:string};
export type MediaPanelDescriptor={valid:boolean;error:string|null;videoId:string|null;startSeconds:number|null;title:string;sourceContext:string;embedUrl:string|null;canonicalUrl:string|null};

const VIDEO_ID=/^[A-Za-z0-9_-]{11}$/;
const MAX_START_SECONDS=604800;
const MAX_TITLE_LENGTH=200;
const MAX_CONTEXT_LENGTH=1200;

/** A fixed-origin descriptor. Caller content can never choose a URL, host, or iframe markup. */
export function mediaPanelDescriptor(input:MediaPanelInput):MediaPanelDescriptor{
 const title=typeof input?.title==='string'&&input.title.trim()&&input.title.length<=MAX_TITLE_LENGTH?input.title:'YouTube video';
 const sourceContext=typeof input?.sourceContext==='string'&&input.sourceContext.length<=MAX_CONTEXT_LENGTH?input.sourceContext:'Source context could not be displayed.';
 const startSeconds=input?.startSeconds===undefined?0:input.startSeconds;
 let error:string|null=null;
 if(typeof input?.videoId!=='string'||!VIDEO_ID.test(input.videoId))error='This video ID is unsupported. Use an 11-character YouTube video ID.';
 else if(typeof startSeconds!=='number'||!Number.isSafeInteger(startSeconds)||startSeconds<0||startSeconds>MAX_START_SECONDS)error=`Start time must be a whole number from 0 to ${MAX_START_SECONDS} seconds.`;
 else if(title==='YouTube video'&&input.title!=='YouTube video')error=`Video title must be plain text of 1–${MAX_TITLE_LENGTH} characters.`;
 else if(sourceContext==='Source context could not be displayed.'&&input.sourceContext!=='Source context could not be displayed.')error=`Source context must be plain text up to ${MAX_CONTEXT_LENGTH} characters.`;
 if(error)return {valid:false,error,videoId:null,startSeconds:null,title,sourceContext,embedUrl:null,canonicalUrl:null};
 const videoId=input.videoId;
 const embed=new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
 if(startSeconds>0)embed.searchParams.set('start',String(startSeconds));
 return {valid:true,error:null,videoId,startSeconds,title,sourceContext,embedUrl:embed.toString(),canonicalUrl:`https://www.youtube.com/watch?v=${videoId}`};
}

export function mediaLoadKey(media:MediaPanelDescriptor):string{return media.valid?`${media.videoId}:${media.startSeconds}`:'invalid';}
export function shouldMountPlayer(requestedKey:string|null,currentKey:string):boolean{return requestedKey!==null&&requestedKey===currentKey&&currentKey!=='invalid';}

