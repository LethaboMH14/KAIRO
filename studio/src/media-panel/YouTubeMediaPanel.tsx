import {useEffect,useId,useRef,useState} from 'react';
import {mediaLoadKey,mediaPanelDescriptor,shouldMountPlayer,type MediaPanelInput} from './presenter.ts';
import './media-panel.css';

export type YouTubeMediaPanelProps=MediaPanelInput;

export default function YouTubeMediaPanel(props:YouTubeMediaPanelProps){
 const media=mediaPanelDescriptor(props);
 const id=useId();
 const titleId=`media-panel-title-${id}`;
 const privacyId=`media-panel-privacy-${id}`;
 const identity=mediaLoadKey(media);
 const priorIdentity=useRef(identity);
 const [requestedIdentity,setRequestedIdentity]=useState<string|null>(null);
 const [loadFailure,setLoadFailure]=useState<{identity:string;message:string}|null>(null);
 const loaded=shouldMountPlayer(requestedIdentity,identity)&&media.valid;
 const error=loadFailure?.identity===identity?loadFailure.message:null;

 useEffect(()=>{
  if(priorIdentity.current===identity)return;
  priorIdentity.current=identity;
  setRequestedIdentity(null);
  setLoadFailure(null);
 },[identity]);

 return <section className="mp-panel" aria-labelledby={titleId}>
  <div className="mp-heading"><p className="mp-kicker">Source video</p><h2 id={titleId}>{media.title}</h2></div>
  <p className="mp-context">{media.sourceContext}</p>
  <p className="mp-provider">Video provider: YouTube</p>
  {!media.valid?<p className="mp-error" role="alert">{media.error}</p>:<>
  {!loaded&&<div className="mp-consent">
    <p id={privacyId}><strong>Connect to YouTube only when you choose.</strong> Loading the video contacts Google/YouTube and shares ordinary network information with that provider. The privacy-enhanced player is not a no-contact or offline mode.</p>
    <p>This video is not available offline. Playback and captions depend on the provider and video settings.</p>
    <button type="button" className="mp-button" aria-describedby={privacyId} onClick={()=>{setLoadFailure(null);setRequestedIdentity(identity);}}>Load YouTube video</button>
   </div>}
   {loaded&&<div className="mp-player-shell">
    <iframe
     className="mp-player"
     src={media.embedUrl!}
     title={`${media.title} — YouTube player`}
     loading="lazy"
     referrerPolicy="strict-origin-when-cross-origin"
     sandbox="allow-scripts allow-same-origin allow-presentation"
     allow="encrypted-media; picture-in-picture; fullscreen"
     allowFullScreen
     onError={()=>{setLoadFailure({identity,message:'The embedded player could not load. Video availability or playback has not been confirmed.'});setRequestedIdentity(null);}}
    />
    <p className="mp-player-note">Use YouTube’s player controls. Captions are available only when the provider supplies them.</p>
    <button type="button" className="mp-button mp-secondary" onClick={()=>setRequestedIdentity(null)}>Unload video</button>
   </div>}
   {error&&<p className="mp-error" role="alert">{error}</p>}
   {media.canonicalUrl&&<p className="mp-source-link"><a href={media.canonicalUrl} target="_blank" rel="noreferrer">Open this video on YouTube</a></p>}
  </>}
 </section>;
}

