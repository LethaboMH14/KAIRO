import { useEffect, useId, useRef, useState } from 'react';
import './prepared-clip-ui.css';
import {
  isReviewedPreparedClip,
  MOTOR_FIELD_SPEED_CLIP,
  preparedClipPaths,
  type PreparedClipInput,
} from './preparedClipManifest';

export type PreparedClipPlayerProps = {
  /** Exact generated and bundled worker manifest; defaults to this reviewed clip. */
  manifest?: PreparedClipInput;
  /** Host stops the shared KAIRO narrator here. The leaf owns no narrator/provider. */
  onPlaybackRequested: () => void;
};

/** Clear active playback whenever this source identity is replaced or unmounted. */
export function resetPreparedVideo(video: HTMLVideoElement | null): void {
  if (!video) return;
  video.pause();
  try {
    video.currentTime = 0;
  } catch {
    // A browser may reject seeking before metadata has loaded; pausing/removing the source still resets it.
  }
  video.removeAttribute('src');
  video.querySelectorAll('track').forEach((track) => track.removeAttribute('src'));
  video.load();
}

export function notifyHostPlaybackRequested(onPlaybackRequested: () => void): void {
  onPlaybackRequested();
}

type ReviewedVideoProps = {
  input: PreparedClipInput;
  onPlaybackRequested: () => void;
  assetOrigin: string;
};

function ReviewedVideo({ input, onPlaybackRequested, assetOrigin }: ReviewedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const captionId = useId();
  const [playbackError, setPlaybackError] = useState(false);
  const paths = preparedClipPaths(input, assetOrigin);

  useEffect(() => () => resetPreparedVideo(videoRef.current), [input.manifestSha256, input.manifest.artifactSha256]);

  if (!paths) return <ClipUnavailable />;

  function handlePlay() {
    setPlaybackError(false);
    notifyHostPlaybackRequested(onPlaybackRequested);
  }

  return (
    <figure className="pcu-figure">
      <figcaption id={captionId}>
        <strong>KAIRO · Motor field speed</strong>
        <span>Silent, source-linked concept clip · 8 seconds</span>
      </figcaption>
      <video
        ref={videoRef}
        className="pcu-video"
        src={paths.video}
        poster={paths.poster}
        controls
        muted
        playsInline
        preload="none"
        aria-labelledby={captionId}
        onPlay={handlePlay}
        onError={() => setPlaybackError(true)}
      >
        <track kind="captions" src={paths.captions} srcLang="en" label="English captions" default />
        Your browser cannot play this clip. Read the explanation below.
      </video>
      {playbackError && <p className="pcu-status" role="status">The clip could not be loaded. Use the explanation below while the media is checked.</p>}
      <p className="pcu-boundary">This shows calculated rotating-field speed, not measured or predicted shaft speed. It is an illustration, not an equipment simulation.</p>
      <details className="pcu-transcript">
        <summary>Read the clip captions</summary>
        <ol>
          <li>At 50 hertz and 4 poles: 120 times 50 divided by 4 equals 1,500 revolutions per minute.</li>
          <li>The stator stays still while its magnetic field rotates.</li>
          <li>The graph shows field speed increasing with frequency for four poles.</li>
          <li>That value is field speed, not measured shaft speed. In motoring operation the rotor runs below field speed.</li>
        </ol>
      </details>
      <details className="pcu-transcript">
        <summary>Check the clip sources</summary>
        <ul>
          <li><a href={input.manifest.sourceReferences[0].url} target="_blank" rel="noreferrer">NPTEL Electrical Machines II: The Rotating Magnetic Field</a></li>
          <li><a href={input.manifest.sourceReferences[1].url} target="_blank" rel="noreferrer">NPTEL Electrical Machines II: Speed Control of Induction Machines</a></li>
        </ul>
      </details>
    </figure>
  );
}

function ClipUnavailable() {
  return (
    <section className="pcu-unavailable" aria-label="Prepared clip unavailable">
      <p role="status">This clip is unavailable because its reviewed source or media record did not match.</p>
      <p>The motor explanation remains available in the lesson text.</p>
    </section>
  );
}

export default function PreparedClipPlayer({ manifest = MOTOR_FIELD_SPEED_CLIP, onPlaybackRequested }: PreparedClipPlayerProps) {
  if (!isReviewedPreparedClip(manifest)) return <ClipUnavailable />;
  // Root-relative assets are same-origin by construction. During SSR, use a synthetic same-origin base.
  const origin = typeof window === 'undefined' ? 'https://kairo.invalid' : window.location.origin;
  const sourceIdentity = `${manifest.manifestSha256}:${manifest.manifest.artifactSha256}`;
  return <ReviewedVideo key={sourceIdentity} input={manifest} onPlaybackRequested={onPlaybackRequested} assetOrigin={origin} />;
}
