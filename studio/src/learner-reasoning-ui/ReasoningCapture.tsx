import { useEffect, useId, useRef, useState } from 'react';
import {
  browserAudioCaptureAvailable,
  createBrowserAudioCapture,
  MAX_RECORDING_BYTES,
  MAX_RECORDING_MS,
  type AudioCaptureSession,
} from './audioCapture';
import {
  buildConfirmedReasoning,
  compareReasoningContext,
  confirmationFingerprint,
  dispatchReasoningConfirmation,
  MAX_REASONING_CHARS,
  type ConfirmedReasoning,
  type EnglishTranscriber,
  type ReasoningMethod,
  type ReasoningOption,
  runEnglishTranscription,
} from './reasoning';
import './reasoning-capture.css';

export type ReasoningCaptureProps = {
  questionId: string;
  /** Stable key that changes when the question or reviewed source revisions change. */
  contextKey?: string;
  question: string;
  options: ReasoningOption[];
  selectedOptionId: string | null;
  onSelectionChange: (selectedOptionId: string) => void;
  onConfirm: (value: ConfirmedReasoning) => void;
  transcribe?: EnglishTranscriber;
  providerLabel?: string;
  disabled?: boolean;
  onSkip?: () => void;
};

type CapturePhase = 'idle' | 'requesting' | 'recording' | 'audio-ready' | 'transcribing';

export default function ReasoningCapture({
  questionId, question, contextKey, options, selectedOptionId, onSelectionChange, onConfirm, transcribe,
  providerLabel = 'the configured speech service', disabled = false, onSkip,
}: ReasoningCaptureProps) {
  const id = useId().replace(/:/g, '');
  const [answerId, setAnswerId] = useState(selectedOptionId || '');
  const [text, setText] = useState('');
  const [method, setMethod] = useState<ReasoningMethod>('typed');
  const [confidenceText, setConfidenceText] = useState('');
  const [phase, setPhase] = useState<CapturePhase>('idle');
  const [audioConsent, setAudioConsent] = useState(false);
  const [recording, setRecording] = useState<Blob | null>(null);
  const [mediaChecked, setMediaChecked] = useState(false);
  const [mediaSupported, setMediaSupported] = useState(false);
  const [transcriptSource, setTranscriptSource] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [confirmedKey, setConfirmedKey] = useState('');
  const captureRef = useRef<AudioCaptureSession | null>(null);
  const transcriptionRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);
  const timeLimitReachedRef = useRef(false);
  const contextRef = useRef({ questionId, question, selectedOptionId, contextKey });

  const confidence = confidenceText === '' ? null : Number(confidenceText);
  const confidenceValid = confidence === null || (Number.isFinite(confidence) && confidence >= 0 && confidence <= 100);
  const candidate = buildConfirmedReasoning({
    questionId, selectedOptionId: answerId, text, method, confidence: confidenceValid ? confidence : Number.NaN,
  });
  const fingerprint = confirmationFingerprint(candidate);
  const alreadyConfirmed = !!fingerprint && fingerprint === confirmedKey;
  const canConfirm = !disabled && phase !== 'requesting' && phase !== 'recording' && phase !== 'transcribing'
    && !!answerId && !!text.trim() && text.length <= MAX_REASONING_CHARS && confidenceValid && !alreadyConfirmed;
  const audioAvailable = !!transcribe && mediaChecked && mediaSupported;
  const isCapturing = phase === 'requesting' || phase === 'recording';

  function stopPendingAudio(message?: string) {
    captureRef.current?.cancel();
    captureRef.current = null;
    transcriptionRef.current?.abort();
    transcriptionRef.current = null;
    setPhase('idle');
    setRecording(null);
    if (message) setStatus(message);
  }

  useEffect(() => {
    mountedRef.current = true;
    setMediaSupported(browserAudioCaptureAvailable());
    setMediaChecked(true);
    return () => {
      mountedRef.current = false;
      captureRef.current?.dispose();
      captureRef.current = null;
      transcriptionRef.current?.abort();
      transcriptionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const previous = contextRef.current;
    const { questionChanged, answerChanged } = compareReasoningContext(previous, { questionId, question, selectedOptionId, contextKey });
    contextRef.current = { questionId, question, selectedOptionId, contextKey };
    setAnswerId(selectedOptionId || '');
    if (questionChanged) {
      stopPendingAudio();
      setText('');
      setMethod('typed');
      setConfidenceText('');
      setTranscriptSource('');
      setConfirmedKey('');
      setError('');
      setStatus('A new question is ready. Choose an answer or type your explanation.');
      return;
    }
    if (answerChanged) {
      if (phase !== 'idle') stopPendingAudio();
      setConfirmedKey('');
      setStatus('Your answer changed. Check your explanation, then confirm it again.');
    }
  }, [questionId, question, selectedOptionId, contextKey]);

  useEffect(() => {
    if (disabled) stopPendingAudio('This question is paused. Your typed explanation remains available.');
  }, [disabled]);

  function chooseAnswer(optionId: string) {
    if (disabled) return;
    if (phase !== 'idle') stopPendingAudio();
    setAnswerId(optionId);
    setConfirmedKey('');
    setError('');
    setStatus('Answer changed. Check your explanation before confirming.');
    onSelectionChange(optionId);
  }

  function editText(value: string) {
    if (phase !== 'idle') stopPendingAudio('Microphone capture or transcription was cancelled because the explanation changed.');
    if (value.length > MAX_REASONING_CHARS) {
      setError(`Keep your explanation to ${MAX_REASONING_CHARS.toLocaleString()} characters. Your text was not shortened.`);
      return;
    }
    setText(value);
    setConfirmedKey('');
    setError('');
    setStatus('');
  }

  function startRecording() {
    if (disabled || !audioConsent || !audioAvailable || !transcribe) return;
    stopPendingAudio();
    timeLimitReachedRef.current = false;
    setError('');
    setStatus('Allow microphone access if your browser asks. The recording stays on this device until you choose Transcribe.');
    setPhase('requesting');
    const session = createBrowserAudioCapture({
      onStarted() {
        if (mountedRef.current) {
          setPhase('recording');
          setStatus('Recording in English. Stop when you are ready; no audio has been sent.');
        }
      },
      onReady(blob) {
        if (!mountedRef.current) return;
        captureRef.current = null;
        setRecording(blob);
        setPhase('audio-ready');
        setStatus(timeLimitReachedRef.current
          ? 'The 60-second limit was reached. The recording is ready on this device; choose Transcribe to send it.'
          : 'Recording ready. It is still on this device; choose Transcribe to send it.');
      },
      onError(message) {
        if (!mountedRef.current) return;
        captureRef.current = null;
        setRecording(null);
        setPhase('idle');
        setError(message);
      },
      onTimeLimit() {
        timeLimitReachedRef.current = true;
        if (mountedRef.current) setStatus('The 60-second limit was reached. Review the local recording before choosing Transcribe.');
      },
    });
    captureRef.current = session;
    void session.start();
  }

  function stopRecording() {
    captureRef.current?.stop();
    setStatus('Stopping the microphone. Your audio stays on this device until you choose Transcribe.');
  }

  async function sendForTranscript() {
    if (!recording || !transcribe || !audioConsent || phase !== 'audio-ready' || disabled) return;
    if (recording.size > MAX_RECORDING_BYTES) {
      setRecording(null);
      setPhase('idle');
      setError('This recording is over 8 MiB and was discarded. Try a shorter clip or type instead.');
      return;
    }
    const controller = new AbortController();
    transcriptionRef.current = controller;
    setPhase('transcribing');
    setError('');
    setStatus(`Sending this recording to ${providerLabel} for an English transcript. You can cancel.`);
    try {
      await runEnglishTranscription(recording, transcribe, controller.signal,
        () => transcriptionRef.current === controller && mountedRef.current,
        result => {
          if (typeof result.text !== 'string' || !result.text.trim()) {
            setPhase('audio-ready');
            setError('No transcript came back. You can retry this recording or type instead.');
            return;
          }
          if (result.text.length > MAX_REASONING_CHARS) {
            setPhase('audio-ready');
            setError(`The transcript is over ${MAX_REASONING_CHARS.toLocaleString()} characters. It was not shortened; try a shorter recording or type instead.`);
            return;
          }
          setText(result.text);
          setMethod('dictated');
          setTranscriptSource(`${result.provider} · ${result.model}`);
          setRecording(null);
          setConfirmedKey('');
          setPhase('idle');
          setStatus('Transcript ready. Edit the words, check the answer, then choose “Use my explanation”.');
        },
        cause => {
          setPhase('audio-ready');
          setError(cause instanceof Error ? cause.message : 'Transcription is unavailable. Retry or type your explanation.');
        });
    } finally {
      if (transcriptionRef.current === controller) transcriptionRef.current = null;
    }
  }

  function toggleAudioConsent(value: boolean) {
    setAudioConsent(value);
    if (!value) {
      stopPendingAudio('Microphone consent is off. Any active recording or request was cancelled.');
      setStatus('Microphone consent is off. Any active recording or request was cancelled.');
    } else {
      setError('');
      setStatus('Consent is ready for this recording only. The microphone will not start until you press Start microphone.');
    }
  }

  function confirm() {
    if (!canConfirm || !candidate) return;
    const sent = dispatchReasoningConfirmation(candidate, onConfirm);
    if (sent) {
      setConfirmedKey(fingerprint);
      setStatus('Your confirmed explanation is ready for the lesson step. You can edit it before confirming again.');
    }
  }

  const audioConsentId = `reasoning-audio-consent-${id}`;
  const explanationId = `reasoning-explanation-${id}`;
  const confidenceId = `reasoning-confidence-${id}`;
  const choicesName = `reasoning-choice-${id}`;

  return <section className="reasoning-capture" aria-labelledby={`reasoning-title-${id}`}>
    <header className="reasoning-capture__header">
      <span className="reasoning-capture__mark" aria-hidden="true">K</span>
      <div><p className="reasoning-capture__eyebrow">KAIRO · your thinking</p><h2 id={`reasoning-title-${id}`}>Choose an answer, then tell me how you thought about it.</h2></div>
    </header>
    <p className="reasoning-capture__question">{question}</p>
    <fieldset className="reasoning-capture__answers" disabled={disabled}>
      <legend>Your answer</legend>
      {options.map((option, index) => {
        const inputId = `reasoning-option-${id}-${index}`;
        return <label key={option.id} className={answerId === option.id ? 'reasoning-capture__option is-selected' : 'reasoning-capture__option'} htmlFor={inputId}>
          <input id={inputId} type="radio" name={choicesName} value={option.id} checked={answerId === option.id} onChange={() => chooseAnswer(option.id)} />
          <span>{option.label}</span>
        </label>;
      })}
    </fieldset>
    <label className="reasoning-capture__field" htmlFor={explanationId}>What led you to that answer?
      <textarea id={explanationId} rows={4} value={text} disabled={disabled || phase === 'transcribing'} aria-describedby={`reasoning-hint-${id}`} onChange={event => editText(event.target.value)} placeholder="Write what you were thinking, or say “I don't know yet.”" />
    </label>
    <div className="reasoning-capture__text-meta" id={`reasoning-hint-${id}`}>
      {method === 'dictated' && <span>Dictated in English · editable{transcriptSource ? ` · ${transcriptSource}` : ''}</span>}
      <span>{text.length.toLocaleString()} / {MAX_REASONING_CHARS.toLocaleString()} characters</span>
    </div>
    <details className="reasoning-capture__dictation">
      <summary>Use microphone dictation (English)</summary>
      {!transcribe ? <p>Microphone transcription is not configured here. You can type your explanation above.</p> : <>
        <p>Microphone access starts only after you choose <strong>Start microphone</strong>. Your recording stays in this page until you choose <strong>Transcribe audio</strong>. That sends the clip to {providerLabel} for an English transcript. KAIRO keeps the transcript in your private AI request record; this screen does not confirm how long the provider keeps the audio.</p>
        {mediaChecked && !mediaSupported && <p role="status">This browser cannot record audio here. You can type your explanation above.</p>}
        <label className="reasoning-capture__consent" htmlFor={audioConsentId}>
          <input id={audioConsentId} type="checkbox" checked={audioConsent} disabled={disabled} onChange={event => toggleAudioConsent(event.target.checked)} />
          I agree to microphone recording. If I choose Transcribe, the clip will be sent to {providerLabel} for an English transcript.
        </label>
        <div className="reasoning-capture__audio-actions">
          {phase === 'recording' || phase === 'requesting'
            ? <><button type="button" className="reasoning-capture__primary" onClick={() => phase === 'requesting' ? stopPendingAudio('Microphone request cancelled. You can type instead.') : stopRecording()}>{phase === 'requesting' ? 'Cancel microphone request' : 'Stop recording'}</button><button type="button" className="reasoning-capture__quiet" onClick={() => stopPendingAudio('Recording cancelled. You can type instead.')}>Cancel recording</button></>
            : <button type="button" className="reasoning-capture__primary" disabled={disabled || !audioConsent || !audioAvailable || phase === 'transcribing'} onClick={startRecording}>Start microphone</button>}
          {phase === 'audio-ready' && <><span className="reasoning-capture__local-audio">Recording ready · {(recording?.size || 0).toLocaleString()} bytes · stored only in this page</span><button type="button" className="reasoning-capture__primary" disabled={disabled || !audioConsent} onClick={() => void sendForTranscript()}>Transcribe audio</button><button type="button" className="reasoning-capture__quiet" onClick={() => stopPendingAudio('Recording discarded. You can type instead.')}>Discard recording</button></>}
          {phase === 'transcribing' && <button type="button" className="reasoning-capture__quiet" onClick={() => stopPendingAudio('Transcription cancelled. You can type instead.')}>Cancel transcription</button>}
        </div>
        {mediaChecked && mediaSupported && <p className="reasoning-capture__fine">English only · maximum {MAX_RECORDING_MS / 1000} seconds and {(MAX_RECORDING_BYTES / (1024 * 1024)).toFixed(0)} MiB. The recording is not sent until you press Transcribe audio.</p>}
      </>}
    </details>
    <label className="reasoning-capture__field" htmlFor={confidenceId}>How sure are you? <span className="reasoning-capture__optional">Optional</span>
      <input id={confidenceId} type="number" min="0" max="100" step="0.1" value={confidenceText} disabled={disabled} onChange={event => { setConfidenceText(event.target.value); setConfirmedKey(''); setError(''); }} placeholder="Leave blank if you prefer" aria-describedby={`reasoning-confidence-hint-${id}`} />
    </label>
    <p className="reasoning-capture__fine" id={`reasoning-confidence-hint-${id}`}>Enter a percentage from 0 to 100. This is your estimate, not a mastery or ability score.</p>
    {confidenceText !== '' && !confidenceValid && <p className="reasoning-capture__error" role="alert">Enter a percentage from 0 to 100, or clear the field.</p>}
    {error && <p className="reasoning-capture__error" role="alert">{error}</p>}
    {status && <p className="reasoning-capture__status" role="status" aria-live="polite">{status}</p>}
    <footer className="reasoning-capture__footer">
      <button type="button" className="reasoning-capture__primary" disabled={!canConfirm} onClick={confirm}>Use my explanation</button>
      {alreadyConfirmed && <span className="reasoning-capture__confirmed">Confirmed for this answer.</span>}
      {onSkip && <button type="button" className="reasoning-capture__quiet" disabled={disabled} onClick={onSkip}>Skip this explanation</button>}
    </footer>
    {isCapturing && <span className="reasoning-capture__sr-only" role="status">Microphone setup is in progress.</span>}
  </section>;
}
