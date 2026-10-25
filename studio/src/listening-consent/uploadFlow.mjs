/**
 * Uploaded-audio consent and recovery controller, independent of browser microphone APIs.
 * Prototype integration boundary: consumers must visibly obtain provider consent for EACH
 * upload before invoking upload(); this module never opens a microphone or sends a question.
 */
import {
  beginTranscription,
  cancelTranscript,
  confirmTranscript,
  createTranscriptState,
  editTranscript,
  failTranscription,
  questionForSubmission,
  receiveTranscription,
} from '../listening-core/transcriptState.ts';

/** @param {{transcribe: (input: object) => Promise<object>}} options */
export function createConsentedUploadFlow({ transcribe } = {}) {
  if (typeof transcribe !== 'function') throw new TypeError('An injected transcription adapter is required.');

  let state = createTranscriptState();
  let active = null;

  return {
    /** Copy rather than expose mutable internal state to a UI or test caller. */
    getState() { return { ...state }; },
    question() { return questionForSubmission(state); },

    /**
     * One explicitly consented file upload; no automatic retry or audio caching.
     * An absent/false consent value never invokes the transcriber.
     */
    async upload({ audio, mimeType, locale = 'unknown', consent = false } = {}) {
      if (state.phase === 'transcribing') return { ok: false, reason: 'already-transcribing' };
      if (consent !== true) return { ok: false, reason: 'consent-required' };
      // Keep the server adapter's strict ISO-639-1 validator authoritative.
      if (typeof locale !== 'string' || !/^(unknown|[a-z]{2})$/i.test(locale)) {
        return { ok: false, reason: 'invalid-locale' };
      }
      const begun = beginTranscription(state, { sourceLabel: 'uploaded-file', locale });
      if (begun.phase !== 'transcribing' ||
          (locale.toLowerCase() !== 'unknown' && begun.locale === 'unknown')) {
        return { ok: false, reason: 'invalid-locale' };
      }
      state = begun;
      const task = { id: begun.requestId, controller: new AbortController() };
      active = task;
      try {
        const result = await transcribe({
          audio, mimeType, locale: begun.locale, sourceLabel: 'uploaded-file',
          signal: task.controller.signal,
        });
        // Some adapters ignore AbortSignal. Request identity is mandatory too.
        if (active !== task || task.controller.signal.aborted) return { ok: false, reason: 'cancelled' };
        state = receiveTranscription(state, task.id, result);
        return state.phase === 'needs-confirmation'
          ? { ok: true, phase: state.phase }
          : { ok: false, reason: 'invalid-transcript' };
      } catch {
        // Provider/internal errors are deliberately not exposed to learner-facing state.
        if (active !== task || task.controller.signal.aborted) return { ok: false, reason: 'cancelled' };
        state = failTranscription(state, task.id);
        return { ok: false, reason: 'transcription-failed' };
      } finally {
        if (active === task) active = null;
      }
    },

    edit(text) { state = editTranscript(state, text); return { ...state }; },
    confirm() { state = confirmTranscript(state); return { ...state }; },
    cancel() {
      const previous = active;
      active = null;
      // Clear immediately; even a late success/error cannot revive the old request.
      state = cancelTranscript(state);
      previous?.controller.abort();
      return { ...state };
    },
  };
}
