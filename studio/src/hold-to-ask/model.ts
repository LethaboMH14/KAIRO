import type { AudioCaptureEvents, AudioCaptureSession } from '../learner-reasoning-ui/audioCapture';
import { runEnglishTranscription, type EnglishTranscriber } from '../learner-reasoning-ui/reasoning';

/** The passage-help question field accepts 300 characters; a longer transcript is never shortened silently. */
export const MAX_VOICE_QUESTION_CHARS = 300;
/** Recordings shorter than this are discarded locally instead of being sent. */
export const MIN_HOLD_MS = 400;

export type HoldToAskAvailability = 'hidden' | 'checking' | 'not-configured' | 'unsupported' | 'ready';

/**
 * A Permissions-Policy microphone block hides the control entirely (PR #146):
 * the hosted app sets `microphone=()`, so offering a button that can never open
 * the microphone would only fail at permission time.
 */
export function holdToAskAvailability({ policyAllowsMicrophone, recordingSupported, transcribe }: {
  policyAllowsMicrophone: boolean;
  recordingSupported: boolean;
  transcribe: EnglishTranscriber | null | undefined;
}): HoldToAskAvailability {
  if (!policyAllowsMicrophone) return 'hidden';
  if (transcribe === undefined) return 'checking';
  if (transcribe === null) return 'not-configured';
  if (!recordingSupported) return 'unsupported';
  return 'ready';
}

/** An empty field takes the transcript; typed words are kept until the learner chooses Keep or Replace. */
export function placeVoiceQuestion(current: string, transcript: string): { question: string; pending: string | null } {
  return current.trim() === '' ? { question: transcript, pending: null } : { question: current, pending: transcript };
}

export type HoldPhase = 'idle' | 'requesting' | 'recording' | 'transcribing';

export type HoldToAskEvents = {
  onPhase: (phase: HoldPhase) => void;
  onStatus: (message: string) => void;
  onError: (message: string) => void;
  /** Receives the trimmed transcript only. It never sends the question anywhere. */
  onTranscript: (text: string) => void;
};

export type HoldToAskDeps = {
  createCapture: (events: AudioCaptureEvents) => AudioCaptureSession;
  transcribe: EnglishTranscriber;
  now: () => number;
};

export type HoldToAskSession = {
  press: (consent: boolean) => boolean;
  release: () => void;
  cancel: (message?: string) => void;
  dispose: () => void;
  phase: () => HoldPhase;
};

/**
 * Push-to-talk for a passage question. The microphone opens only inside
 * `press` (an explicit pointer or key press with consent already given), the
 * clip goes to the transcriber only on `release`, and the transcript is handed
 * to `onTranscript` for an editable field. Nothing here asks for an explanation.
 */
export function createHoldToAsk(deps: HoldToAskDeps, events: HoldToAskEvents): HoldToAskSession {
  let phase: HoldPhase = 'idle';
  let capture: AudioCaptureSession | null = null;
  let transcription: AbortController | null = null;
  let startedAt = 0;
  let disposed = false;

  function setPhase(next: HoldPhase) {
    phase = next;
    if (!disposed) events.onPhase(next);
  }

  function dropCapture() {
    const current = capture;
    capture = null;
    current?.cancel();
  }

  async function send(recording: Blob) {
    const controller = new AbortController();
    transcription = controller;
    setPhase('transcribing');
    events.onStatus('Sending your clip to Groq for an English transcript. You can cancel.');
    try {
      await runEnglishTranscription(recording, deps.transcribe, controller.signal,
        () => transcription === controller && !disposed,
        result => {
          const text = typeof result.text === 'string' ? result.text.trim() : '';
          if (!text) events.onError('No words came back. Hold the button and try again, or type your question.');
          else if (text.length > MAX_VOICE_QUESTION_CHARS) events.onError(`Your question came back longer than ${MAX_VOICE_QUESTION_CHARS} characters. It was not shortened; ask a shorter question or type it.`);
          else {
            events.onTranscript(text);
            events.onStatus('Your words are in the question box. Check and edit them. Nothing is asked until you choose Explain.');
          }
        },
        cause => events.onError(cause instanceof Error ? cause.message : 'Transcription is unavailable. You can type your question instead.'));
    } finally {
      if (transcription === controller) {
        transcription = null;
        setPhase('idle');
      }
    }
  }

  function press(consent: boolean) {
    if (disposed || !consent || phase !== 'idle') return false;
    startedAt = 0;
    setPhase('requesting');
    events.onStatus('Opening the microphone. Keep holding, and speak when it says Recording.');
    const session = deps.createCapture({
      onStarted() {
        if (capture !== session || disposed) return;
        startedAt = deps.now();
        setPhase('recording');
        events.onStatus('Recording. Let go to transcribe your question. Press Escape to cancel.');
      },
      onReady(recording) {
        if (capture !== session || disposed) return;
        capture = null;
        void send(recording);
      },
      onError(message) {
        if (capture !== session || disposed) return;
        capture = null;
        setPhase('idle');
        events.onError(message);
      },
      onTimeLimit() {
        if (capture === session && !disposed) events.onStatus('The 60-second limit was reached. Transcribing what you said.');
      },
    });
    capture = session;
    void session.start();
    return true;
  }

  function release() {
    if (phase === 'requesting') {
      dropCapture();
      setPhase('idle');
      events.onStatus('Let go before recording started. Nothing was recorded or sent. If your browser asked about the microphone, answer it, then hold the button again.');
      return;
    }
    if (phase !== 'recording') return;
    if (deps.now() - startedAt < MIN_HOLD_MS) {
      dropCapture();
      setPhase('idle');
      events.onStatus('That was too short to hear. Hold the button while you speak. Nothing was sent.');
      return;
    }
    capture?.stop();
  }

  function cancel(message = 'Cancelled. Nothing was sent.') {
    const wasSending = phase === 'transcribing';
    dropCapture();
    transcription?.abort();
    transcription = null;
    if (phase !== 'idle') {
      setPhase('idle');
      events.onStatus(wasSending ? 'Stopped waiting for the transcript. The clip had already been sent to Groq.' : message);
    }
  }

  return {
    press,
    release,
    cancel,
    dispose() {
      disposed = true;
      dropCapture();
      transcription?.abort();
      transcription = null;
      phase = 'idle';
    },
    phase: () => phase,
  };
}
