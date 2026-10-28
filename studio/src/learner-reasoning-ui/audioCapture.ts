export const MAX_RECORDING_MS = 60_000;
export const MAX_RECORDING_BYTES = 8 * 1024 * 1024;

const PREFERRED_AUDIO_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'] as const;

export type AudioCaptureEnvironment = {
  getUserMedia: () => Promise<MediaStream>;
  createRecorder: (stream: MediaStream, options?: MediaRecorderOptions) => MediaRecorder;
  isTypeSupported: (mimeType: string) => boolean;
  setTimer: (callback: () => void, delayMs: number) => unknown;
  clearTimer: (handle: unknown) => void;
};

export type AudioCaptureEvents = {
  onStarted: () => void;
  onReady: (recording: Blob) => void;
  onError: (message: string) => void;
  onTimeLimit: () => void;
};

export type AudioCaptureSession = {
  start: () => Promise<void>;
  stop: () => void;
  cancel: () => void;
  dispose: () => void;
};

function stopStream(stream: MediaStream | null) {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    try { track.stop(); } catch { /* Tracks can already be ended by the browser. */ }
  }
}

export function createAudioCapture(
  environment: AudioCaptureEnvironment,
  events: AudioCaptureEvents,
  limits: { maxMs?: number; maxBytes?: number } = {},
): AudioCaptureSession {
  const maxMs = limits.maxMs ?? MAX_RECORDING_MS;
  const maxBytes = limits.maxBytes ?? MAX_RECORDING_BYTES;
  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let timer: unknown = null;
  let chunks: Blob[] = [];
  let byteCount = 0;
  let cancelled = false;
  let discard = false;
  let disposed = false;
  let acquiring = false;

  function clearTimer() {
    if (timer !== null) environment.clearTimer(timer);
    timer = null;
  }

  function releaseTracks() {
    const current = stream;
    stream = null;
    stopStream(current);
  }

  function stopRecorder() {
    clearTimer();
    const current = recorder;
    if (current?.state === 'recording') {
      try { current.stop(); }
      catch {
        discard = true;
        chunks = [];
        recorder = null;
        events.onError('The recording could not be stopped. Nothing was sent; you can type instead.');
      }
    }
    releaseTracks();
  }

  function cancel() {
    cancelled = true;
    discard = true;
    chunks = [];
    byteCount = 0;
    clearTimer();
    stopRecorder();
  }

  async function start() {
    if (disposed || acquiring || recorder?.state === 'recording') return;
    acquiring = true;
    cancelled = false;
    discard = false;
    chunks = [];
    byteCount = 0;
    try {
      const requestedStream = await environment.getUserMedia();
      acquiring = false;
      if (cancelled || disposed) {
        stopStream(requestedStream);
        return;
      }
      stream = requestedStream;
      const mimeType = PREFERRED_AUDIO_TYPES.find(type => {
        try { return environment.isTypeSupported(type); } catch { return false; }
      });
      recorder = environment.createRecorder(stream, mimeType ? { mimeType } : undefined);
      const current = recorder;
      current.ondataavailable = event => {
        const chunk = event.data;
        if (cancelled || discard || !chunk || chunk.size === 0) return;
        byteCount += chunk.size;
        if (byteCount > maxBytes) {
          discard = true;
          chunks = [];
          events.onError('This recording is over 8 MiB. It was discarded and not sent; try a shorter clip or type instead.');
          stopRecorder();
          return;
        }
        chunks.push(chunk);
      };
      current.onstop = () => {
        clearTimer();
        releaseTracks();
        recorder = null;
        if (!cancelled && !discard) {
          const recording = new Blob(chunks, { type: current.mimeType || chunks[0]?.type || 'application/octet-stream' });
          if (recording.size > 0) events.onReady(recording);
          else events.onError('No audio was captured. You can type your explanation instead.');
        }
        chunks = [];
      };
      current.onerror = () => {
        discard = true;
        chunks = [];
        events.onError('Recording stopped because the browser reported an audio error. You can type instead.');
        stopRecorder();
      };
      current.start(1000);
      events.onStarted();
      timer = environment.setTimer(() => {
        events.onTimeLimit();
        stopRecorder();
      }, maxMs);
    } catch (cause) {
      acquiring = false;
      releaseTracks();
      clearTimer();
      recorder = null;
      const name = cause instanceof Error ? cause.name : '';
      events.onError(name === 'NotAllowedError' || name === 'SecurityError'
        ? 'Microphone permission was not granted. No audio was sent; you can type instead.'
        : 'Microphone recording is unavailable. No audio was sent; you can type instead.');
    }
  }

  return { start, stop: stopRecorder, cancel, dispose() { disposed = true; cancel(); } };
}

export function createBrowserAudioCapture(events: AudioCaptureEvents): AudioCaptureSession {
  const browserNavigator = typeof navigator === 'undefined' ? undefined : navigator;
  if (!browserNavigator?.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined' || !microphoneAllowedByPolicy()) {
    events.onError('This browser cannot record audio here. You can type your explanation instead.');
    return { start: async () => {}, stop() {}, cancel() {}, dispose() {} };
  }
  return createAudioCapture({
    getUserMedia: () => browserNavigator.mediaDevices.getUserMedia({ audio: true }),
    createRecorder: (mediaStream, options) => new MediaRecorder(mediaStream, options),
    isTypeSupported: type => MediaRecorder.isTypeSupported(type),
    setTimer: (callback, delay) => window.setTimeout(callback, delay),
    clearTimer: handle => window.clearTimeout(handle as number),
  }, events);
}

type PolicyDocument = { permissionsPolicy?: { allowsFeature(feature: string): boolean }; featurePolicy?: { allowsFeature(feature: string): boolean } };
/** False when the page's Permissions-Policy (e.g. `microphone=()` on the hosted app) forbids the microphone; true when the browser cannot tell. */
export function microphoneAllowedByPolicy(doc: PolicyDocument | undefined = typeof document === 'undefined' ? undefined : document as unknown as PolicyDocument) {
  const policy = doc?.permissionsPolicy ?? doc?.featurePolicy;
  try { return policy ? policy.allowsFeature('microphone') : true; } catch { return true; }
}

export function browserAudioCaptureAvailable() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined' && microphoneAllowedByPolicy();
}
