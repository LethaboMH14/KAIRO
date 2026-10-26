import { useId } from 'react';

export type TeacherAccessLanguageChoice = {
  id: string;
  label: string;
  available: boolean;
  reason?: string;
};

export type TeacherAccessPanelProps = {
  choices: readonly TeacherAccessLanguageChoice[];
  selectedLanguage: string;
  captions: boolean;
  reducedMotion: boolean;
  busy: boolean;
  listeningAvailable: boolean;
  signContentAvailable: boolean;
  onLanguageChange: (id: string) => void;
  onCaptionsChange: (value: boolean) => void;
  onReducedMotionChange: (value: boolean) => void;
  onUseTyped: () => void;
  onClose: () => void;
};

const panelStyle = `
.teacher-access{--ta-chalk:#f5f0e6;--ta-paper:#fffdf8;--ta-moss:#3e5144;--ta-sage:#a7af91;--ta-copper:#ae7555;--ta-ink:#252b28;--ta-line:#d8dccf;box-sizing:border-box;width:min(100%,48rem);margin-inline:auto;padding:clamp(1rem,3vw,1.5rem);border:1px solid var(--ta-line);border-radius:1rem;background:var(--ta-chalk);color:var(--ta-ink);font-family:KairoManrope,Manrope,Arial,sans-serif}
.teacher-access *{box-sizing:border-box}
.teacher-access button,.teacher-access select{font:inherit}
.teacher-access h2{margin:.2rem 0 .4rem;font-size:clamp(1.25rem,4vw,1.6rem);line-height:1.25;overflow-wrap:anywhere}
.teacher-access h3{margin:0 0 .35rem;font-size:1rem;line-height:1.4}
.teacher-access p{max-width:68ch;margin:.4rem 0;line-height:1.55;overflow-wrap:anywhere}
.teacher-access__eyebrow{margin:0;color:var(--ta-moss);font-size:.78rem;font-weight:750;letter-spacing:.08em;text-transform:uppercase}
.teacher-access__head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
.teacher-access__close,.teacher-access__button{display:inline-flex;min-height:44px;align-items:center;justify-content:center;gap:.5rem;border:1px solid var(--ta-moss);border-radius:.55rem;padding:.65rem .9rem;background:var(--ta-paper);color:var(--ta-moss);font-weight:700;cursor:pointer;text-align:center}
.teacher-access__close{flex:0 0 auto}
.teacher-access__close:hover,.teacher-access__button:hover:not(:disabled){background:#e8ebdf}
.teacher-access__button:disabled,.teacher-access select:disabled{cursor:not-allowed;opacity:.58}
.teacher-access__primary{background:var(--ta-moss);color:var(--ta-chalk)}
.teacher-access__primary:hover:not(:disabled){background:#314238}
.teacher-access__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.85rem;margin-top:1rem}
.teacher-access__card{min-width:0;padding:1rem;border:1px solid var(--ta-line);border-radius:.75rem;background:var(--ta-paper)}
.teacher-access__language-label{display:grid;gap:.45rem;margin-top:.65rem;font-weight:700}
.teacher-access select{width:100%;min-height:48px;border:1px solid #8a9486;border-radius:.5rem;padding:.65rem;background:var(--ta-paper);color:var(--ta-ink)}
.teacher-access__toggle-row{display:flex;flex-wrap:wrap;gap:.55rem;margin-top:.8rem}
.teacher-access__toggle[aria-pressed=true]{background:var(--ta-sage);border-color:#68785f;color:var(--ta-ink)}
.teacher-access__status{padding:.65rem .75rem;border-inline-start:3px solid var(--ta-sage);background:#f1f1e9}
.teacher-access__error{padding:.65rem .75rem;border-inline-start:3px solid #8c4437;background:#f5e9e2;color:#60291f;font-weight:650}
.teacher-access__actions{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:.8rem}
.teacher-access :focus-visible{outline:3px solid var(--ta-copper);outline-offset:3px}
@media(max-width:38rem){.teacher-access__grid{grid-template-columns:minmax(0,1fr)}.teacher-access__head{gap:.5rem}.teacher-access__close{min-width:44px;padding-inline:.65rem}.teacher-access__actions>*{flex:1 1 100%}}
@media(prefers-reduced-motion:reduce){.teacher-access *{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
`;

function normalizeChoices(input: readonly TeacherAccessLanguageChoice[]) {
  const choices = Array.isArray(input) ? input : [];
  const seen = new Set<string>();
  let invalid = false;
  const normalized: TeacherAccessLanguageChoice[] = [];

  for (const choice of choices) {
    if (!choice || typeof choice.id !== 'string' || !choice.id.trim() || typeof choice.label !== 'string' || !choice.label.trim() || typeof choice.available !== 'boolean' || seen.has(choice.id)) {
      invalid = true;
      continue;
    }
    seen.add(choice.id);
    normalized.push(choice);
  }

  return { choices: normalized, invalid };
}

export default function TeacherAccessPanel({
  choices: suppliedChoices,
  selectedLanguage,
  captions,
  reducedMotion,
  busy,
  listeningAvailable,
  signContentAvailable,
  onLanguageChange,
  onCaptionsChange,
  onReducedMotionChange,
  onUseTyped,
  onClose,
}: TeacherAccessPanelProps) {
  const id = useId();
  const { choices, invalid } = normalizeChoices(suppliedChoices);
  const selectedChoice = choices.find(choice => choice.id === selectedLanguage);
  const selectedAvailable = Boolean(selectedChoice?.available);
  const languageError = invalid
    ? 'Language choices could not be checked. Ask your teacher to refresh this panel.'
    : !selectedAvailable
      ? selectedChoice?.reason || 'Choose a language marked available before changing this setting.'
      : '';
  const canChangeLanguage = !busy && !invalid;

  return (
    <section className="teacher-access" aria-labelledby={`${id}-title`} aria-busy={busy}>
      <style>{panelStyle}</style>
      <div className="teacher-access__head">
        <div>
          <p className="teacher-access__eyebrow">KAIRO access</p>
          <h2 id={`${id}-title`}>Language and ways to follow along</h2>
          <p>Choose a language, keep the words visible, or type your question. Changing language does not start voice or a new request.</p>
        </div>
        <button className="teacher-access__close" type="button" onClick={onClose} aria-label="Close language and access settings">Close</button>
      </div>

      {busy && <p className="teacher-access__status" role="status">Please wait while this request finishes. You can still close this panel.</p>}

      <div className="teacher-access__grid">
        <section className="teacher-access__card" aria-labelledby={`${id}-language-title`}>
          <h3 id={`${id}-language-title`}>Language</h3>
          <p>Only languages marked available can be selected here. This choice does not confirm voice or translation accuracy.</p>
          <label className="teacher-access__language-label" htmlFor={`${id}-language`}>Language for KAIRO
            <select
              id={`${id}-language`}
              name="language"
              value={selectedAvailable ? selectedLanguage : ''}
              aria-invalid={languageError ? 'true' : 'false'}
              aria-describedby={`${id}-language-help${languageError ? ` ${id}-language-error` : ''}`}
              disabled={!canChangeLanguage}
              onChange={event => {
                const next = choices.find(choice => choice.id === event.currentTarget.value);
                if (next?.available && !busy && !invalid) onLanguageChange(next.id);
              }}
            >
              <option value="" disabled>Choose an available language</option>
              {choices.map(choice => <option key={choice.id} value={choice.id} disabled={!choice.available}>
                {choice.available ? choice.label : `${choice.label} — Not available${choice.reason ? `: ${choice.reason}` : ''}`}
              </option>)}
            </select>
          </label>
          <p id={`${id}-language-help`} className="teacher-access__status">Language choice and language accuracy are separate. Voice availability depends on the current lesson and device.</p>
          {languageError && <p id={`${id}-language-error`} className="teacher-access__error" role="alert">{languageError}</p>}
        </section>

        <section className="teacher-access__card" aria-labelledby={`${id}-captions-title`}>
          <h3 id={`${id}-captions-title`}>Read or listen</h3>
          <p>{listeningAvailable
            ? 'Listening can use a recording you choose. KAIRO does not listen continuously.'
            : 'Recorded-file listening is not available in this view. No microphone is active.'}</p>
          <div className="teacher-access__toggle-row">
            <button className="teacher-access__button teacher-access__toggle" type="button" aria-pressed={captions} disabled={busy} onClick={() => onCaptionsChange(!captions)}>
              Captions {captions ? 'on' : 'off'}
            </button>
            <button className="teacher-access__button" type="button" disabled={busy} onClick={() => onCaptionsChange(true)}>
              Read instead
            </button>
          </div>
          <p className="teacher-access__status">Written words remain an option; captions do not mean that audio has started.</p>
        </section>

        <section className="teacher-access__card" aria-labelledby={`${id}-motion-title`}>
          <h3 id={`${id}-motion-title`}>Movement</h3>
          <p>Reduce interface motion while keeping the same controls and lesson content.</p>
          <button className="teacher-access__button teacher-access__toggle" type="button" aria-pressed={reducedMotion} disabled={busy} onClick={() => onReducedMotionChange(!reducedMotion)}>
            Reduced motion {reducedMotion ? 'on' : 'off'}
          </button>
        </section>

        <section className="teacher-access__card" aria-labelledby={`${id}-sign-title`}>
          <h3 id={`${id}-sign-title`}>Sign-language content</h3>
          {signContentAvailable
            ? <p className="teacher-access__status">Signer-reviewed sign content is available for this lesson. It is separate from language selection.</p>
            : <p className="teacher-access__status">Sign-language content is not available here. No sign-language translation has been validated.</p>}
        </section>
      </div>

      <div className="teacher-access__actions" aria-label="Other ways to ask KAIRO">
        <button className="teacher-access__button teacher-access__primary" type="button" disabled={busy} onClick={onUseTyped}>Type a question</button>
      </div>
    </section>
  );
}
