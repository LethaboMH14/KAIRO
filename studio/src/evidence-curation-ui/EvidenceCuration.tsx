import { useState } from 'react';

export type EvidenceCandidate = {
  id: string;
  title: string;
  description: string;
  sourceLabel: string;
  completedAt: string | null;
  claimLabel: string;
};

export type EvidenceCurationProps = {
  items: EvidenceCandidate[];
  storageLabel: string;
  onExport: (selectedIds: string[]) => void;
};

const MAX_SELECTED = 6;

function uniqueItems(items: EvidenceCandidate[]) {
  const seen = new Set<string>();
  return items.filter(item => {
    if (!item || typeof item.id !== 'string' || !item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function dateLabel(value: string | null) {
  if (!value) return 'Date not recorded';
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleDateString('en-ZA', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' }) : 'Date not confirmed';
}

export default function EvidenceCuration({ items, storageLabel, onExport }: EvidenceCurationProps) {
  const candidates = uniqueItems(items);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedItems = selectedIds.map(id => candidates.find(item => item.id === id)).filter((item): item is EvidenceCandidate => Boolean(item));

  const toggle = (id: string, checked: boolean) => {
    if (!candidates.some(item => item.id === id)) return;
    setSelectedIds(current => {
      if (checked) return current.includes(id) || current.length >= MAX_SELECTED ? current : [...current, id];
      return current.filter(value => value !== id);
    });
  };

  const move = (index: number, offset: -1 | 1) => {
    setSelectedIds(current => {
      const target = index + offset;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return <section className="kairo-evidence-curation" aria-labelledby="evidence-curation-title">
    <style>{`.kairo-evidence-curation{--ec-chalk:#f5f0e6;--ec-paper:#fffdf8;--ec-moss:#3e5144;--ec-sage:#a7af91;--ec-ink:#252b28;--ec-line:#d7dbce;box-sizing:border-box;width:min(100%,68rem);margin:0 auto;padding:clamp(1rem,3vw,2rem);background:var(--ec-chalk);color:var(--ec-ink);font-family:KairoManrope,Manrope,Arial,sans-serif}.kairo-evidence-curation *{box-sizing:border-box}.kairo-evidence-curation h2,.kairo-evidence-curation h3{color:var(--ec-ink);line-height:1.25}.kairo-evidence-curation p{line-height:1.55}.kairo-evidence-curation .ec-intro,.kairo-evidence-curation .ec-note{max-width:68ch}.kairo-evidence-curation .ec-storage{padding:.85rem 1rem;border-left:4px solid var(--ec-sage);background:var(--ec-paper)}.kairo-evidence-curation .ec-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(16rem,.8fr);gap:1.25rem;align-items:start}.kairo-evidence-curation .ec-list{display:grid;gap:.7rem}.kairo-evidence-curation .ec-item,.kairo-evidence-curation .ec-preview-item{padding:1rem;border:1px solid var(--ec-line);border-radius:.7rem;background:var(--ec-paper);min-width:0;overflow-wrap:anywhere}.kairo-evidence-curation .ec-item label{display:flex;align-items:flex-start;gap:.7rem;cursor:pointer}.kairo-evidence-curation input[type=checkbox]{width:1.2rem;height:1.2rem;flex:0 0 auto;margin:.15rem 0 0;accent-color:var(--ec-moss)}.kairo-evidence-curation .ec-meta{font-size:.9rem;color:#4f5b50}.kairo-evidence-curation .ec-actions,.kairo-evidence-curation .ec-order{display:flex;flex-wrap:wrap;align-items:center;gap:.55rem;margin-top:.8rem}.kairo-evidence-curation button{min-height:44px;padding:.6rem .85rem;border:1px solid var(--ec-moss);border-radius:.55rem;background:var(--ec-paper);color:var(--ec-moss);font:inherit;font-weight:650;cursor:pointer}.kairo-evidence-curation button:disabled{opacity:.55;cursor:not-allowed}.kairo-evidence-curation .ec-primary{background:var(--ec-moss);color:var(--ec-paper)}.kairo-evidence-curation .ec-preview{padding:1rem;border:1px solid var(--ec-line);border-radius:.8rem;background:#ecefe5}.kairo-evidence-curation .ec-preview-list{display:grid;gap:.6rem;padding:0;list-style:none}.kairo-evidence-curation .ec-empty{padding:1rem;border:1px dashed var(--ec-moss);border-radius:.7rem;background:var(--ec-paper)}.kairo-evidence-curation :focus-visible{outline:3px solid #805037;outline-offset:3px}@media(max-width:48rem){.kairo-evidence-curation .ec-grid{grid-template-columns:1fr}}`}</style>
    <p className="ec-meta">KAIRO · Your selected work</p>
    <h2 id="evidence-curation-title">Choose what to include</h2>
    <p className="ec-intro">Choose up to six items. Your selection stays in this page until you leave; nothing is published from here.</p>
    <p className="ec-storage"><strong>Where this is saved:</strong> {storageLabel}</p>
    <p className="ec-note">A label describes the kind of record. It does not prove identity, workplace skill or a qualification.</p>

    {candidates.length === 0 ? <p className="ec-empty" role="status">No work items are ready to choose yet. You can return when you have an item to include.</p> : <div className="ec-grid">
      <div>
        <h3>Available items</h3>
        {candidates.length <= MAX_SELECTED && candidates.length > 1 && <button type="button" onClick={() => setSelectedIds(selectedIds.length === candidates.length ? [] : candidates.map(item => item.id))}>
          {selectedIds.length === candidates.length ? 'Clear selection' : 'Select all available items'}
        </button>}
        {candidates.length > MAX_SELECTED && <p className="ec-meta">Select up to six items from this list.</p>}
        <div className="ec-list">{candidates.map(item => {
          const checked = selectedIds.includes(item.id);
          const atLimit = selectedIds.length >= MAX_SELECTED && !checked;
          return <article className="ec-item" key={item.id}>
            <label>
              <input type="checkbox" checked={checked} disabled={atLimit} onChange={event => toggle(item.id, event.currentTarget.checked)} />
              <span><strong>{item.title}</strong><br/><span>{item.description}</span></span>
            </label>
            <p className="ec-meta">{item.sourceLabel} · {dateLabel(item.completedAt)} · {item.claimLabel}</p>
          </article>;
        })}</div>
      </div>

      <aside className="ec-preview" aria-labelledby="evidence-preview-title">
        <h3 id="evidence-preview-title">Preview</h3>
        <p className="ec-meta">These are the exact items in the selected order. This preview is not shared with an employer.</p>
        {selectedItems.length === 0 ? <p className="ec-empty" role="status">Nothing selected yet. Choose an item to see it here.</p> : <ol className="ec-preview-list">{selectedItems.map((item, index) => <li className="ec-preview-item" key={item.id}>
          <strong>{index + 1}. {item.title}</strong>
          <p>{item.description}</p>
          <p className="ec-meta">{item.sourceLabel} · {dateLabel(item.completedAt)}<br/>Claim: {item.claimLabel}</p>
          <div className="ec-order" aria-label={`Order controls for ${item.title}`}>
            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${item.title} earlier`}>Move earlier</button>
            <button type="button" onClick={() => move(index, 1)} disabled={index === selectedItems.length - 1} aria-label={`Move ${item.title} later`}>Move later</button>
            <button type="button" onClick={() => toggle(item.id, false)} aria-label={`Remove ${item.title}`}>Remove</button>
          </div>
        </li>)}</ol>}
        <div className="ec-actions">
          <button className="ec-primary" type="button" disabled={selectedItems.length === 0} onClick={() => { if (selectedItems.length > 0 && selectedItems.length <= MAX_SELECTED) onExport(selectedItems.map(item => item.id)); }}>Download selected work</button>
          <span className="ec-meta">{selectedItems.length} of {MAX_SELECTED} selected</span>
        </div>
      </aside>
    </div>}
  </section>;
}

export { MAX_SELECTED };
