export type TranscriptPhase = 'idle' | 'transcribing' | 'needs-confirmation' | 'confirmed' | 'cancelled' | 'error';
export type TranscriptSource = 'uploaded-file' | 'provided-audio';

export type TranscriptState = {
  phase: TranscriptPhase;
  requestId: number;
  draftText: string;
  confirmedText: string | null;
  sourceLabel: TranscriptSource | 'unknown';
  locale: string;
  localeStatus: 'requested-not-validated' | 'unknown';
  errorMessage: string | null;
};

export type TranscriptionResult = {
  text: string;
  sourceLabel: TranscriptSource;
  locale: string;
  localeStatus: 'requested-not-validated' | 'unknown';
};

const MAX_TRANSCRIPT_CHARS = 16 * 1024;
const sourceLabels = new Set(['uploaded-file', 'provided-audio']);
const isoCodes = new Set('aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu'.split(' '));

export function createTranscriptState(): TranscriptState {
  return {
    phase: 'idle', requestId: 0, draftText: '', confirmedText: null,
    sourceLabel: 'unknown', locale: 'unknown', localeStatus: 'unknown', errorMessage: null,
  };
}

export function beginTranscription(state: TranscriptState, metadata: { sourceLabel: TranscriptSource; locale: string }): TranscriptState {
  if (state.phase === 'transcribing' || !sourceLabels.has(metadata.sourceLabel)) return state;
  const requestedLocale = typeof metadata.locale === 'string' ? metadata.locale.toLowerCase() : 'unknown';
  const locale = requestedLocale === 'unknown' || isoCodes.has(requestedLocale) ? requestedLocale : 'unknown';
  return {
    phase: 'transcribing', requestId: state.requestId + 1, draftText: '', confirmedText: null,
    sourceLabel: metadata.sourceLabel, locale, localeStatus: locale === 'unknown' ? 'unknown' : 'requested-not-validated', errorMessage: null,
  };
}

export function receiveTranscription(state: TranscriptState, requestId: number, result: TranscriptionResult): TranscriptState {
  if (state.phase !== 'transcribing' || requestId !== state.requestId) return state;
  if (!result || typeof result.text !== 'string' || result.text.length > MAX_TRANSCRIPT_CHARS ||
      !sourceLabels.has(result.sourceLabel) || result.sourceLabel !== state.sourceLabel ||
      typeof result.locale !== 'string' || result.locale !== state.locale) {
    return { ...state, phase: 'error', errorMessage: 'The transcript could not be reviewed. Try again or type the question.' };
  }
  const text = result.text.trim();
  if (!text) return { ...state, phase: 'error', errorMessage: 'No words were returned. Type the question instead.' };
  return {
    ...state, phase: 'needs-confirmation', draftText: text, confirmedText: null,
    sourceLabel: state.sourceLabel, locale: state.locale,
    localeStatus: state.localeStatus, errorMessage: null,
  };
}

export function failTranscription(state: TranscriptState, requestId: number): TranscriptState {
  if (state.phase !== 'transcribing' || requestId !== state.requestId) return state;
  return { ...state, phase: 'error', errorMessage: 'Transcription did not finish. Try again or type the question.', confirmedText: null };
}

export function editTranscript(state: TranscriptState, draftText: string): TranscriptState {
  if (!['needs-confirmation', 'confirmed'].includes(state.phase) || typeof draftText !== 'string' || draftText.length > MAX_TRANSCRIPT_CHARS) return state;
  return { ...state, phase: 'needs-confirmation', draftText, confirmedText: null, errorMessage: null };
}

export function confirmTranscript(state: TranscriptState): TranscriptState {
  const text = state.draftText.trim();
  if (state.phase !== 'needs-confirmation' || !text || text.length > MAX_TRANSCRIPT_CHARS) return state;
  return { ...state, phase: 'confirmed', draftText: text, confirmedText: text, errorMessage: null };
}

export function cancelTranscript(state: TranscriptState): TranscriptState {
  return {
    ...state, phase: 'cancelled', requestId: state.requestId + 1, draftText: '', confirmedText: null, errorMessage: null,
  };
}

export type QuestionSubmission = { ok: true; text: string; sourceLabel: TranscriptSource; locale: string } | { ok: false; reason: 'confirmation-required' | 'empty-question' };

/** Callers may submit only the exact draft the learner confirmed. */
export function questionForSubmission(state: TranscriptState): QuestionSubmission {
  if (state.phase !== 'confirmed' || state.sourceLabel === 'unknown' || !state.confirmedText || state.confirmedText !== state.draftText) {
    return { ok: false, reason: state.draftText.trim() ? 'confirmation-required' : 'empty-question' };
  }
  return { ok: true, text: state.confirmedText, sourceLabel: state.sourceLabel, locale: state.locale || 'unknown' };
}
