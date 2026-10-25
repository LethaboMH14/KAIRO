// Camera tracking panel (SASL-CAPTURE-001). Tracking only: it finds hands in the camera picture on this device and
// draws them. It does not recognise or translate any language, record anything, or send anything.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Camera, CameraOff, Pause, Play, Square } from 'lucide-react';
import { createBrowserDeps } from './browserDeps';
import { PAUSE_LIMIT_MS, PRIVACY_NOTE, TRACKING_ONLY_LABEL, type LandmarkFrame } from './contract';
import { TrackingSession, type Snapshot } from './session';
import './signing.css';

/** Standard 21-point hand skeleton (wrist, then thumb, index, middle, ring and little finger). */
export const HAND_CONNECTIONS: readonly (readonly [number, number])[] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

export function message(s: Pick<Snapshot, 'phase' | 'pause' | 'reason' | 'failure'>): string {
  switch (s.phase) {
    case 'idle': return 'The camera is off.';
    case 'starting': return 'Starting. Allow the camera if your browser asks.';
    case 'tracking': return 'Camera on. Finding hands in the picture.';
    case 'paused': return s.pause === 'hidden'
      ? `Paused while this tab is in the background. The camera turns off after ${PAUSE_LIMIT_MS / 1000} seconds.`
      : `Paused. The camera turns off after ${PAUSE_LIMIT_MS / 1000} seconds.`;
    case 'denied': return 'The camera was not allowed, so nothing started. You can still type or use reading view. To try again, allow the camera for this site in your browser settings, then press Start.';
    case 'unavailable': return 'No camera was found on this device.';
    case 'stopped':
      switch (s.reason) {
        case 'pagehide': return 'The camera was turned off because you left the page.';
        case 'route-exit': return 'The camera was turned off because you left this screen.';
        case 'track-ended': return 'The camera stopped. It may have been unplugged or switched off.';
        case 'permission-revoked': return 'Camera permission was removed, so the camera was turned off.';
        case 'pause-timeout': return `The camera was turned off after ${PAUSE_LIMIT_MS / 1000} seconds paused.`;
        default: return 'The camera is off.';
      }
    case 'failed':
      switch (s.failure) {
        case 'model-integrity': return 'The tracking files did not match their expected checksums, so tracking was not started. Nothing was sent anywhere.';
        case 'camera-busy': return 'The camera is being used by another app. Close it and press Start.';
        case 'worker-stalled': return 'Tracking stopped answering, so the camera was turned off.';
        case 'frames': return 'This browser could not pass camera pictures to the tracker, so the camera was turned off.';
        default: return 'Tracking could not start on this device. The camera is off.';
      }
  }
}

function draw(canvas: HTMLCanvasElement | null, frame: LandmarkFrame | null) {
  const g = canvas?.getContext('2d');
  if (!canvas || !g) return;
  if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  g.clearRect(0, 0, canvas.width, canvas.height);
  if (!frame) return;
  // The preview is mirrored like a mirror; the tracker saw the raw picture, so x is flipped here only.
  const X = (x: number) => (1 - x) * canvas.width, Y = (y: number) => y * canvas.height;
  const colour = (side: string) => (side === 'left' ? '#AE7555' : side === 'right' ? '#A7AF91' : '#F5F0E6');
  for (const hand of frame.hands) {
    g.strokeStyle = colour(hand.side);
    g.fillStyle = colour(hand.side);
    g.lineWidth = Math.max(2, canvas.width / 220);
    g.lineCap = 'round';
    for (const [a, b] of HAND_CONNECTIONS) {
      g.beginPath();
      g.moveTo(X(hand.points[a][0]), Y(hand.points[a][1]));
      g.lineTo(X(hand.points[b][0]), Y(hand.points[b][1]));
      g.stroke();
    }
    for (const p of hand.points) {
      g.beginPath();
      g.arc(X(p[0]), Y(p[1]), g.lineWidth * 1.2, 0, Math.PI * 2);
      g.fill();
    }
  }
}

export default function TrackingPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [current, setCurrent] = useState<TrackingSession | null>(null);

  // The session is created after mount (it needs the video element) and does nothing until Start is pressed.
  useEffect(() => {
    const created = new TrackingSession(createBrowserDeps(videoRef.current as HTMLVideoElement));
    const offFrame = created.onFrame(frame => draw(canvasRef.current, frame));
    const offState = created.subscribe(s => { if (s.phase !== 'tracking') draw(canvasRef.current, null); });
    setCurrent(created);
    return () => { offFrame(); offState(); created.dispose(); setCurrent(null); };
  }, []);

  const snapshot = useSyncExternalStore(current ? current.subscribe : noopSubscribe, current ? current.getSnapshot : idleSnapshot);

  const live = snapshot.phase === 'starting' || snapshot.phase === 'tracking' || snapshot.phase === 'paused';
  const text = message(snapshot);
  return (
    <section className="ks" aria-labelledby="ks-title">
      <h2 id="ks-title">Camera tracking</h2>
      <p className="ks-label" role="note"><strong>{TRACKING_ONLY_LABEL}</strong></p>
      <p className="ks-note">{PRIVACY_NOTE}</p>
      <p className="ks-note">Pressing Start lets this page use your camera on this device to find your hands. You can stop at any time. KAIRO’s gestures and this hand view are not sign language.</p>
      <div className="ks-stage" data-phase={snapshot.phase}>
        <video ref={videoRef} className="ks-video" muted playsInline aria-label="Your camera picture, mirrored" />
        <canvas ref={canvasRef} className="ks-overlay" aria-hidden="true" />
        {!live && <div className="ks-off"><CameraOff size={34} aria-hidden="true" /><span>Camera off</span></div>}
      </div>
      <div className="ks-controls">
        {!live && <button type="button" className="ks-primary" onClick={() => current?.start()}><Camera size={17} aria-hidden="true" />Start camera</button>}
        {snapshot.phase === 'tracking' && <button type="button" onClick={() => current?.pause()}><Pause size={17} aria-hidden="true" />Pause</button>}
        {snapshot.phase === 'paused' && <button type="button" className="ks-primary" onClick={() => current?.resume()}><Play size={17} aria-hidden="true" />Resume</button>}
        {live && <button type="button" onClick={() => current?.stop()}><Square size={15} aria-hidden="true" />Stop camera</button>}
      </div>
      <p className="ks-status" role="status" aria-live="polite">{text}</p>
      {snapshot.phase === 'tracking' && snapshot.hints.length > 0 && <ul className="ks-hints" aria-label="Picture tips">{snapshot.hints.map(h => <li key={h.code}>{h.text}</li>)}</ul>}
      <details className="ks-diag">
        <summary>Diagnostics</summary>
        <dl>
          <dt>Picture width</dt><dd>{snapshot.stats.width} px</dd>
          <dt>Tracker time</dt><dd>median {snapshot.stats.trackerP50Ms.toFixed(0)} ms · 90th percentile {snapshot.stats.trackerP90Ms.toFixed(0)} ms</dd>
          <dt>Shown per second</dt><dd>{snapshot.stats.fps}</dd>
          <dt>Pictures sent / skipped (tracker busy)</dt><dd>{snapshot.stats.sent} / {snapshot.stats.dropped}</dd>
          <dt>Results discarded (old or out of order)</dt><dd>{snapshot.stats.staleSession + snapshot.stats.outOfOrder + snapshot.stats.tooOld}</dd>
          {snapshot.detail && <><dt>Detail</dt><dd>{snapshot.detail}</dd></>}
        </dl>
      </details>
    </section>
  );
}

const noopSubscribe = () => () => {};
const emptyStats = { offered: 0, sent: 0, dropped: 0, applied: 0, staleSession: 0, outOfOrder: 0, tooOld: 0, failed: 0, width: 640, fps: 0, trackerP50Ms: 0, trackerP90Ms: 0 };
const idle: Snapshot = { phase: 'idle', session: 0, hints: [], stats: emptyStats, label: TRACKING_ONLY_LABEL };
const idleSnapshot = () => idle;
