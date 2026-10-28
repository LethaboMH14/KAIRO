import type { EnglishTranscriber } from '../learner-reasoning-ui/reasoning';

export const REASONING_LISTENING_ENDPOINT = '/api/workspace/listening';
export const MAX_REASONING_AUDIO_BYTES = 8 * 1024 * 1024;
export const MAX_REASONING_TRANSCRIPT_CHARS = 4_000;
const MAX_RESPONSE_BYTES = 64 * 1024;
const EXPECTED_PROVIDER = 'Groq';
const EXPECTED_MODEL = 'whisper-large-v3-turbo';

/** Mirrors the server's current accepted audio MIME table; parameters such as codecs are stripped before upload. */
export const SUPPORTED_REASONING_AUDIO_TYPES = [
  'audio/flac', 'audio/x-flac', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a',
  'audio/x-m4a', 'audio/mpga', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm',
] as const;

export class ReasoningListeningError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = 'ReasoningListeningError';
  }
}

type TranscriberOptions = {
  fetchImpl?: typeof fetch;
  requestIdFactory?: () => string | undefined;
};

type ServerTranscript = {
  text: string;
  provider: string;
  model: string;
  locale: string;
  localeStatus: string;
  sourceLabel: string;
  translation: boolean;
};

function abortError() {
  const error = new Error('Transcription was cancelled.');
  error.name = 'AbortError';
  return error;
}

function assertNotAborted(signal: AbortSignal) {
  if (signal.aborted) throw abortError();
}

function normalizeAudioType(audio: Blob) {
  const mimeType = audio.type.toLowerCase().split(';', 1)[0].trim();
  if (!(SUPPORTED_REASONING_AUDIO_TYPES as readonly string[]).includes(mimeType)) {
    throw new ReasoningListeningError('unsupported-audio', 'This recording format is not supported. Try another recording or type instead.');
  }
  return mimeType;
}

async function readResponseText(response: Response, signal: AbortSignal) {
  let text: string;
  try {
    text = await response.text();
  } catch (cause) {
    assertNotAborted(signal);
    throw new ReasoningListeningError('invalid-response', 'The transcription service returned an unreadable response. You can type instead.');
  }
  assertNotAborted(signal);
  if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) {
    throw new ReasoningListeningError('response-too-large', 'The transcription response was too large. You can type instead.');
  }
  return text;
}

function parseResponse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new ReasoningListeningError('invalid-response', 'The transcription service returned an unreadable response. You can type instead.');
  }
}

function isTranscript(value: unknown): value is ServerTranscript {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<ServerTranscript>;
  return typeof result.text === 'string'
    && result.provider === EXPECTED_PROVIDER
    && result.model === EXPECTED_MODEL
    && result.locale === 'en'
    && result.localeStatus === 'requested-not-validated'
    && result.sourceLabel === 'uploaded-file'
    && result.translation === false;
}

/**
 * Sends only an explicitly consented English recording to KAIRO's existing
 * same-origin uploaded-audio route. The route owns provider credentials and
 * all server-side provider work; this bridge never stores audio or retries.
 */
export function createGroqReasoningTranscriber({ fetchImpl, requestIdFactory }: TranscriberOptions = {}): EnglishTranscriber {
  const send = fetchImpl ?? globalThis.fetch?.bind(globalThis);
  if (typeof send !== 'function') throw new TypeError('A same-origin fetch implementation is required.');

  return async (audio, options) => {
    if (options?.consent !== true) {
      throw new ReasoningListeningError('consent-required', 'Choose to send this recording to Groq for transcription first.');
    }
    if (options.locale !== 'en') {
      throw new ReasoningListeningError('unsupported-language', 'This reasoning capture currently supports English only.');
    }
    const signal = options.signal;
    if (!signal || typeof signal.aborted !== 'boolean' || typeof signal.addEventListener !== 'function') {
      throw new ReasoningListeningError('missing-abort-signal', 'A cancellable transcription request is required.');
    }
    assertNotAborted(signal);
    if (!(audio instanceof Blob) || audio.size < 1) {
      throw new ReasoningListeningError('empty-audio', 'This recording is empty. Record again or type instead.');
    }
    if (audio.size > MAX_REASONING_AUDIO_BYTES) {
      throw new ReasoningListeningError('audio-too-large', 'This recording is over 8 MiB and was not sent. Try a shorter clip or type instead.');
    }
    const mimeType = normalizeAudioType(audio);
    const headers: Record<string, string> = {
      'Content-Type': mimeType,
      'X-Kairo-Consent': 'groq',
      'X-Kairo-Language': 'en',
    };
    const requestId = requestIdFactory?.();
    if (requestId !== undefined) {
      if (typeof requestId !== 'string' || !requestId.trim() || requestId.length > 128 || /[\r\n]/.test(requestId)) {
        throw new ReasoningListeningError('invalid-request-id', 'A valid transcription request identifier is required.');
      }
      headers['X-Kairo-Request'] = requestId;
    }

    let response: Response;
    try {
      response = await send(REASONING_LISTENING_ENDPOINT, { method: 'POST', headers, body: audio, signal });
    } catch {
      assertNotAborted(signal);
      throw new ReasoningListeningError('request-failed', 'The listening service could not be reached. Your recording was not retried. You can type instead.');
    }
    assertNotAborted(signal);
    if (!response || typeof response.ok !== 'boolean' || typeof response.text !== 'function') {
      throw new ReasoningListeningError('invalid-response', 'The listening service returned an invalid response. You can type instead.');
    }

    const raw = await readResponseText(response, signal);
    if (!response.ok) {
      let errorBody: unknown = null;
      try { errorBody = raw ? JSON.parse(raw) : null; } catch { /* Some middleware errors are plain text or HTML. */ }
      const serverMessage = errorBody && typeof errorBody === 'object' && typeof (errorBody as { error?: unknown }).error === 'string'
        ? (errorBody as { error: string }).error.slice(0, 300)
        : '';
      const message = response.status === 413
        ? 'This recording is over the server 8 MiB limit and was not transcribed. Try a shorter clip or type instead.'
        : serverMessage || 'The listening service could not transcribe this recording. You can type instead.';
      throw new ReasoningListeningError(`http-${response.status || 'error'}`, message);
    }
    const parsed = parseResponse(raw);
    if (!isTranscript(parsed)) {
      throw new ReasoningListeningError('invalid-transcript', 'The listening service returned a response that does not match English transcription. You can type instead.');
    }
    const text = parsed.text.trim();
    if (!text) throw new ReasoningListeningError('empty-transcript', 'No words came back. You can type your explanation instead.');
    if (text.length > MAX_REASONING_TRANSCRIPT_CHARS) {
      throw new ReasoningListeningError('transcript-too-long', 'The transcript is over 4,000 characters and was not shortened. You can type instead.');
    }
    assertNotAborted(signal);
    return { text, provider: parsed.provider, model: parsed.model };
  };
}
