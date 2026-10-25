import type { TranscriptState } from './transcriptState.ts';
import './listening-core.css';

export type TranscriptReviewProps = {
  state: TranscriptState;
  onEdit: (text: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function TranscriptReview({ state, onEdit, onConfirm, onCancel }: TranscriptReviewProps) {
  const busy = state.phase === 'transcribing';
  const reviewable = state.phase === 'needs-confirmation' || state.phase === 'confirmed';
  const source = state.sourceLabel === 'uploaded-file' ? 'Uploaded audio file' : state.sourceLabel === 'provided-audio' ? 'Provided audio' : 'Source not specified';
  const language = state.locale === 'unknown' ? 'Not specified' : `${state.locale.toUpperCase()} requested · not verified`;
  return (
    <section className="listen-panel" aria-labelledby="listen-title">
      <p className="listen-eyebrow">Voice question</p>
      <h2 id="listen-title">Check the words first</h2>
      <p className="listen-copy">Speech recognition can mishear words. Review and edit the transcript before confirming it as your question.</p>
      <dl className="listen-source">
        <div><dt>Audio source</dt><dd>{source}</dd></div>
        <div><dt>Language</dt><dd>{language}</dd></div>
      </dl>
      {busy && <p className="listen-status" role="status" aria-live="polite">Transcribing the provided audio…</p>}
      {state.phase === 'cancelled' && <p className="listen-status" role="status">Transcription cancelled and transcript cleared.</p>}
      {state.phase === 'error' && state.errorMessage && <p className="listen-error" role="alert">{state.errorMessage}</p>}
      <label className="listen-label" htmlFor="listen-transcript">Transcript to review</label>
      <textarea id="listen-transcript" className="listen-textarea" value={state.draftText} maxLength={16 * 1024} readOnly={!reviewable} onChange={(event) => onEdit(event.currentTarget.value)} placeholder={busy ? 'Waiting for words…' : 'A transcript will appear here for you to review.'} />
      {state.phase === 'needs-confirmation' && <p className="listen-status" role="status">Review the wording, then confirm before using it as a question.</p>}
      {state.phase === 'confirmed' && <p className="listen-status" role="status">Transcript confirmed. Editing it will require confirmation again.</p>}
      <div className="listen-actions">
        <button type="button" onClick={onConfirm} disabled={state.phase !== 'needs-confirmation' || !state.draftText.trim()}>Confirm transcript</button>
        <button type="button" className="listen-secondary" onClick={onCancel} disabled={state.phase === 'cancelled' || state.phase === 'idle'}>Cancel and clear</button>
      </div>
      <p className="listen-footnote">No question is sent from this panel. Confirmation is required before another part of the app can use the text.</p>
    </section>
  );
}
