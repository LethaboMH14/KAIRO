import { useId } from 'react';
import './language-capability-notice.css';

export type LanguageCapabilityNoticeProps = {
  languageLabel: string;
  kind: 'translation' | 'listening' | 'sasl';
  availability: 'available' | 'draft' | 'unavailable';
  humanReviewed: boolean;
  busy: boolean;
  onUseOriginal: () => void;
  onEditTranscript: () => void;
};

export type LanguageCapabilityActions = Pick<LanguageCapabilityNoticeProps, 'onUseOriginal' | 'onEditTranscript'>;

/**
 * Keep the component's event guards testable without mounting a browser or
 * claiming that server-rendered markup exercises browser event dispatch.
 */
export function createLanguageCapabilityActions(
  kind: LanguageCapabilityNoticeProps['kind'],
  busy: boolean,
  { onUseOriginal, onEditTranscript }: LanguageCapabilityActions,
) {
  return {
    useOriginal: () => { if (!busy) onUseOriginal(); },
    editTranscript: () => { if (kind === 'listening' && !busy) onEditTranscript(); },
  };
}

function labels(kind: LanguageCapabilityNoticeProps['kind']) {
  if (kind === 'translation') return { capability: 'Translation' };
  if (kind === 'listening') return { capability: 'Listening transcript' };
  return { capability: 'SASL' };
}

function statusCopy({ kind, availability, humanReviewed }: Pick<LanguageCapabilityNoticeProps, 'kind' | 'availability' | 'humanReviewed'>) {
  if (availability === 'unavailable') {
    return kind === 'sasl'
      ? 'SASL translation is unavailable. Hand tracking is not sign-language translation.'
      : 'This option is unavailable. Use the original text to continue.';
  }

  if (kind === 'sasl') {
    if (!humanReviewed) {
      return 'SASL output is not ready to rely on as translation. Human review is required. Hand tracking alone does not translate signed language.';
    }
    return availability === 'draft'
      ? 'This SASL item is a draft. A human review is recorded, but that does not establish model accuracy or reviewer qualification.'
      : 'A human review is recorded for this SASL item. That does not establish model accuracy or reviewer qualification.';
  }

  if (availability === 'draft') {
    return humanReviewed
      ? 'This is a draft. A human review is recorded, but that does not establish model accuracy; check it against the original.'
      : 'This is an unreviewed draft. Check it against the original before relying on it.';
  }

  return humanReviewed
    ? 'A human review is recorded. That does not establish model accuracy; check this output against the original.'
    : 'This option is available, but the output has not been human reviewed. Check it against the original before relying on it.';
}

export default function LanguageCapabilityNotice({
  languageLabel,
  kind,
  availability,
  humanReviewed,
  busy,
  onUseOriginal,
  onEditTranscript,
}: LanguageCapabilityNoticeProps) {
  const id = useId().replace(/:/g, '');
  const titleId = `language-capability-title-${id}`;
  const copyId = `language-capability-copy-${id}`;
  const action = createLanguageCapabilityActions(kind, busy, { onUseOriginal, onEditTranscript });
  const { capability } = labels(kind);
  const selectedLanguage = languageLabel.trim() ? languageLabel : 'Not specified';
  const availabilityLabel = availability[0].toUpperCase() + availability.slice(1);

  return (
    <section className="language-capability" aria-labelledby={titleId} aria-describedby={copyId}>
      <p className="language-capability__eyebrow">KAIRO language support</p>
      <h2 id={titleId}>Check the language option</h2>
      <dl className="language-capability__details">
        <div><dt>Selected language</dt><dd>{selectedLanguage}</dd></div>
        <div><dt>Option</dt><dd>{capability}</dd></div>
        <div><dt>Availability</dt><dd>{availabilityLabel}</dd></div>
      </dl>
      <p className="language-capability__message" id={copyId} role="status" aria-live="polite">
        {statusCopy({ kind, availability, humanReviewed })}
      </p>
      {busy && <p className="language-capability__busy" role="status">Please wait. Language actions are paused while this request is in progress.</p>}
      <div className="language-capability__actions">
        <button type="button" onClick={action.useOriginal} disabled={busy}>
          Read the original text
        </button>
        {kind === 'listening' && (
          <button type="button" className="language-capability__secondary" onClick={action.editTranscript} disabled={busy}>
            Edit transcript
          </button>
        )}
      </div>
      <p className="language-capability__footnote">
        Language selection does not prove accuracy. You can continue with the original text at any time.
      </p>
    </section>
  );
}
