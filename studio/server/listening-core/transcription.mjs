export const GROQ_TRANSCRIPTION_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
export const GROQ_TRANSCRIPTION_MODEL = 'whisper-large-v3-turbo';
export const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
export const MAX_RESPONSE_BYTES = 64 * 1024;
export const MAX_TRANSCRIPT_CHARS = 16 * 1024;

const AUDIO_TYPES = new Map([
  ['audio/flac', 'flac'], ['audio/x-flac', 'flac'],
  ['audio/mpeg', 'mp3'], ['audio/mp3', 'mp3'],
  ['audio/mp4', 'mp4'], ['audio/m4a', 'm4a'], ['audio/x-m4a', 'm4a'],
  ['audio/mpga', 'mpga'], ['audio/ogg', 'ogg'],
  ['audio/wav', 'wav'], ['audio/x-wav', 'wav'],
  ['audio/webm', 'webm'],
]);
const SOURCE_LABELS = new Set(['uploaded-file', 'provided-audio']);
const ISO_639_1 = new Set('aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu'.split(' '));

export class ListeningError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ListeningError';
    this.code = code;
  }
}

function fail(code, message) { throw new ListeningError(code, message); }

function checkAbort(signal) {
  if (signal.aborted) fail('aborted', 'Transcription was cancelled.');
}

async function awaitWithAbort(promise, signal) {
  checkAbort(signal);
  let onAbort;
  const aborted = new Promise((_, reject) => {
    onAbort = () => reject(new ListeningError('aborted', 'Transcription was cancelled.'));
    signal.addEventListener('abort', onAbort, { once: true });
  });
  try {
    const value = await Promise.race([promise, aborted]);
    checkAbort(signal);
    return value;
  } finally {
    signal.removeEventListener('abort', onAbort);
  }
}

function mimeAndBlob(audio, suppliedMimeType) {
  const blobInput = typeof Blob !== 'undefined' && audio instanceof Blob;
  let mimeType = typeof suppliedMimeType === 'string' ? suppliedMimeType : '';
  if (blobInput) {
    const blobType = audio.type.toLowerCase().split(';', 1)[0].trim();
    if (mimeType && blobType && mimeType.toLowerCase().split(';', 1)[0].trim() !== blobType) {
      fail('audio-type-mismatch', 'The supplied audio type does not match the file.');
    }
    mimeType = mimeType || blobType;
  }
  mimeType = mimeType.toLowerCase().split(';', 1)[0].trim();
  const extension = AUDIO_TYPES.get(mimeType);
  if (!extension) fail('unsupported-audio', 'Choose an audio file in a supported format.');
  let blob;
  if (blobInput) blob = audio;
  else if (audio instanceof Uint8Array) blob = new Blob([audio], { type: mimeType });
  else fail('invalid-audio', 'The audio input was not a supported file or byte buffer.');
  if (blob.size < 1) fail('empty-audio', 'The audio file is empty.');
  if (blob.size > MAX_AUDIO_BYTES) fail('audio-too-large', 'The audio file is larger than the 8 MB limit.');
  return { blob, mimeType, filename: `audio.${extension}` };
}

function normalizeLocale(locale) {
  if (locale == null || locale === '' || locale === 'unknown') return null;
  if (typeof locale !== 'string' || !/^[a-z]{2}$/i.test(locale) || !ISO_639_1.has(locale.toLowerCase())) {
    fail('invalid-locale', 'Choose a listed ISO 639-1 language code or leave the language unknown.');
  }
  return locale.toLowerCase();
}

async function readBoundedText(response, signal) {
  checkAbort(signal);
  const reader = response.body?.getReader?.();
  if (!reader) {
    const text = await awaitWithAbort(response.text(), signal);
    checkAbort(signal);
    if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) fail('response-too-large', 'The transcription response exceeded its size limit.');
    return text;
  }
  const decoder = new TextDecoder();
  const pieces = [];
  let total = 0;
  try {
    while (true) {
      checkAbort(signal);
      const { done, value } = await awaitWithAbort(reader.read(), signal);
      checkAbort(signal);
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        void reader.cancel().catch(() => {});
        fail('response-too-large', 'The transcription response exceeded its size limit.');
      }
      pieces.push(decoder.decode(value, { stream: true }));
    }
    pieces.push(decoder.decode());
    return pieces.join('');
  } catch (error) {
    if (signal.aborted) await reader.cancel().catch(() => {});
    throw error;
  } finally {
    try { reader.releaseLock?.(); } catch { /* A cancelled pending read can keep a stream locked briefly. */ }
  }
}

/** Create a one-request Groq transcription adapter. No global fetch or credentials are read. */
export function createGroqTranscriber({ fetchImpl } = {}) {
  if (typeof fetchImpl !== 'function') fail('missing-fetch', 'An injected fetch function is required.');

  return async function transcribeAudio({ audio, mimeType, apiKey, signal, locale = 'unknown', sourceLabel } = {}) {
    if (!signal || typeof signal.aborted !== 'boolean' || typeof signal.addEventListener !== 'function') {
      fail('missing-abort-signal', 'A caller-provided AbortSignal is required.');
    }
    checkAbort(signal);
    if (!SOURCE_LABELS.has(sourceLabel)) fail('invalid-source-label', 'Choose an explicit audio source label.');
    if (typeof apiKey !== 'string' || !apiKey.trim() || /[\r\n]/.test(apiKey) || apiKey.length > 4096) {
      fail('missing-credential', 'A valid runtime API credential is required.');
    }
    const language = normalizeLocale(locale);
    const { blob, mimeType: checkedMime, filename } = mimeAndBlob(audio, mimeType);
    checkAbort(signal);

    const form = new FormData();
    form.append('file', blob, filename);
    form.append('model', GROQ_TRANSCRIPTION_MODEL);
    form.append('response_format', 'json');
    if (language) form.append('language', language);

    let response;
    try {
      response = await awaitWithAbort(fetchImpl(GROQ_TRANSCRIPTION_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
        body: form,
        signal,
      }), signal);
    } catch (error) {
      checkAbort(signal);
      fail('request-failed', 'The transcription service could not be reached. No retry was attempted.');
    }
    checkAbort(signal);
    if (!response || typeof response.ok !== 'boolean') fail('invalid-response', 'The transcription service returned an invalid response.');
    if (!response.ok) fail('service-error', `The transcription service returned HTTP ${response.status || 'error'}. No retry was attempted.`);
    const raw = await readBoundedText(response, signal);
    checkAbort(signal);
    let parsed;
    try { parsed = JSON.parse(raw); } catch { fail('invalid-response', 'The transcription response could not be read.'); }
    if (!parsed || typeof parsed.text !== 'string' || parsed.text.length > MAX_TRANSCRIPT_CHARS) {
      fail('invalid-transcript', 'The transcription response was missing text or exceeded its limit.');
    }
    const text = parsed.text.trim();
    if (!text) fail('empty-transcript', 'No words were returned. Enter the question by typing instead.');
    checkAbort(signal);
    return {
      text,
      provider: 'Groq',
      model: GROQ_TRANSCRIPTION_MODEL,
      sourceLabel,
      mimeType: checkedMime,
      locale: language ?? 'unknown',
      localeStatus: language ? 'requested-not-validated' : 'unknown',
      translation: false,
    };
  };
}
