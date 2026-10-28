import React, { useState } from '../../studio/node_modules/react/index.js';
import { createRoot } from '../../studio/node_modules/react-dom/client.js';
import MaterialReviewLayout from '../../studio/src/material-review-layout/MaterialReviewLayout';

function Fixture() {
  const [text, setText] = useState('Reviewed pressure: 180 kPa. Check the cited unit before saving.');
  const [dirty, setDirty] = useState(true);
  const [busy, setBusy] = useState(false);
  const [counts, setCounts] = useState({ save: 0, build: 0, cancel: 0 });
  const [cancelled, setCancelled] = useState(false);
  const bump = (key: keyof typeof counts) => setCounts((value) => ({ ...value, [key]: value[key] + 1 }));

  return <>
    <div className="fixture-controls">
      <button type="button" onClick={() => setBusy((value) => !value)}>Toggle busy</button>
      <p className="fixture-counts" aria-live="polite">Callbacks: save {counts.save}, build {counts.build}, cancel {counts.cancel}{cancelled ? ' · cancelled' : ''}</p>
    </div>
    <MaterialReviewLayout
      title="Review pump maintenance notes — synthetic fixture"
      original={<article aria-label="Synthetic original source page"><p>Original source preview: page 2 of a synthetic maintenance note.</p><p>Expected range: 170–190 kPa.</p></article>}
      reviewed={<label>Reviewed text<textarea data-testid="review-editor" value={text} onChange={(event) => { setText(event.target.value); setDirty(true); }} rows={9} style={{ display: 'block', width: '100%', minHeight: '12rem', marginTop: '.5rem', padding: '.7rem', font: 'inherit', resize: 'vertical' }} /></label>}
      sourceRevision="synthetic-source-v1 · revision 3"
      coverageLabel="Two of three synthetic pages are represented in this review. One diagram and one scanned page are not included in the text preview."
      warnings={["Confirm whether the source uses kPa or bar.", "The final page was not included in this synthetic fixture."]}
      busy={busy}
      dirty={dirty}
      canSave={!busy}
      canBuild={!busy}
      onSave={() => { bump('save'); setDirty(false); }}
      onBuild={() => bump('build')}
      onCancel={() => { bump('cancel'); setCancelled(true); }}
    />
  </>;
}

createRoot(document.getElementById('root')!).render(<Fixture />);

