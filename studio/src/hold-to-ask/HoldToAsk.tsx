import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Mic } from 'lucide-react';
import { browserAudioCaptureAvailable, createBrowserAudioCapture, microphoneAllowedByPolicy, type AudioCaptureEvents, type AudioCaptureSession } from '../learner-reasoning-ui/audioCapture';
import type { EnglishTranscriber } from '../learner-reasoning-ui/reasoning';
import { createGroqReasoningTranscriber } from '../reasoning-listening-bridge/groqReasoningTranscriber';
import { createHoldToAsk, holdToAskAvailability, type HoldPhase, type HoldToAskSession } from './model';
import './hold-to-ask.css';

export type MicrophoneProbe = () => { policyAllowsMicrophone: boolean; recordingSupported: boolean };

const browserProbe: MicrophoneProbe = () => ({ policyAllowsMicrophone: microphoneAllowedByPolicy(), recordingSupported: browserAudioCaptureAvailable() });

/** `undefined` while the status request is pending, `null` when Groq is not configured on this server. */
export function useGroqTranscriber() {
  const [transcribe, setTranscribe] = useState<EnglishTranscriber | null | undefined>();
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/workspace/ai/status', { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(status => {
        if (controller.signal.aborted) return;
        const configured = Array.isArray(status?.providers) && status.providers.some((provider: { id: string; configured: boolean }) => provider.id === 'groq' && provider.configured === true);
        setTranscribe(configured ? () => createGroqReasoningTranscriber({ requestIdFactory: () => crypto.randomUUID() }) : null);
      })
      .catch(() => { if (!controller.signal.aborted) setTranscribe(null); });
    return () => controller.abort();
  }, []);
  return transcribe;
}

export default function HoldToAsk({ transcribe, onTranscript, disabled = false, probe = browserProbe, createCapture = createBrowserAudioCapture }: {
  transcribe: EnglishTranscriber | null | undefined;
  onTranscript: (text: string) => void;
  disabled?: boolean;
  probe?: MicrophoneProbe;
  createCapture?: (events: AudioCaptureEvents) => AudioCaptureSession;
}) {
  const id = useId().replace(/:/g, '');
  const [microphone] = useState(probe);
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<HoldPhase>('idle');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const session = useRef<HoldToAskSession | null>(null);
  const deliver = useRef(onTranscript);
  deliver.current = onTranscript;
  const availability = holdToAskAvailability({ ...microphone, transcribe });

  useEffect(() => {
    if (!transcribe || availability !== 'ready') return;
    const current = createHoldToAsk({ createCapture, transcribe, now: () => performance.now() }, {
      onPhase: setPhase,
      onStatus: message => { setStatus(message); setError(''); },
      onError: message => { setError(message); setStatus(''); },
      onTranscript: text => deliver.current(text),
    });
    session.current = current;
    return () => { current.dispose(); if (session.current === current) session.current = null; };
  }, [transcribe, availability, createCapture]);

  useEffect(() => { if (disabled) session.current?.cancel('Voice question paused. Nothing was sent.'); }, [disabled]);

  if (availability === 'hidden' || availability === 'checking') return null;
  const consentId = `hold-to-ask-consent-${id}`, noticeId = `hold-to-ask-notice-${id}`;
  if (availability === 'not-configured') return <p className="sw-fine kh-hold-note">Hold-to-ask voice questions are not configured here. Type your question instead.</p>;
  if (availability === 'unsupported') return <p className="sw-fine kh-hold-note">This browser cannot record audio here. Type your question instead.</p>;

  const holding = phase === 'requesting' || phase === 'recording';
  function press() { if (!disabled) session.current?.press(consent); }
  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || disabled || !consent) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Synthetic or already-released pointers cannot be captured. */ }
    press();
  }
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape' && holding) { event.preventDefault(); session.current?.cancel(); return; }
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    if (!event.repeat) press();
  }
  function onKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    session.current?.release();
  }

  return <div className="kh-hold" role="group" aria-label="Hold to ask by voice">
    <label className="sw-check" htmlFor={consentId}>
      <input id={consentId} type="checkbox" checked={consent} disabled={disabled} onChange={event => { setConsent(event.target.checked); if (!event.target.checked) session.current?.cancel('Microphone consent is off. Nothing was sent.'); }} />
      {' '}Open my microphone only while I hold the button. When I let go, send the clip to Groq for an English transcript.
    </label>
    <button type="button" className={holding ? 'sw-secondary kh-hold-button is-holding' : 'sw-secondary kh-hold-button'} aria-describedby={noticeId} aria-pressed={holding} disabled={disabled || !consent || phase === 'transcribing'}
      onPointerDown={onPointerDown} onPointerUp={() => session.current?.release()} onPointerCancel={() => session.current?.cancel()} onLostPointerCapture={() => session.current?.release()}
      onKeyDown={onKeyDown} onKeyUp={onKeyUp} onBlur={() => { if (holding) session.current?.cancel('Recording cancelled because the button lost focus. Nothing was sent.'); }} onContextMenu={event => event.preventDefault()}>
      <Mic size={15} aria-hidden="true" /> {phase === 'recording' ? 'Recording… let go to finish' : phase === 'requesting' ? 'Opening microphone…' : phase === 'transcribing' ? 'Transcribing…' : 'Hold to ask'}
    </button>
    {phase === 'transcribing' && <button type="button" className="sw-secondary" onClick={() => session.current?.cancel()}>Cancel transcript</button>}
    <p className="sw-fine" id={noticeId}>Hold the button, or hold Space, while you speak. English only: the transcript language is not verified, so check every word. Your words fill the question box and are never asked automatically. KAIRO keeps the transcript in your private AI request record, not the audio; this screen does not confirm how long Groq keeps it.</p>
    {error && <p className="sw-error" role="alert">{error}</p>}
    <p className="kh-hold-status" role="status" aria-live="polite">{status}</p>
  </div>;
}
