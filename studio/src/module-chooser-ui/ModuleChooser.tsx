import type { ChangeEvent } from 'react';

export type Programme = { id: string; institutionId: string; title: string; qualification: string; sourceUrl: string };
export type CurriculumModule = {
  id: string; institutionId: string; catalogueYear: number | null; code: string | null; title: string;
  studyYear: number; programmeIds: string[]; conceptIds: string[];
  source: { url: string; locator: string; checkedAt: string; evidenceStatus: 'original-reviewed' | 'discovery-only' };
  status: 'reviewed' | 'needs-review';
};
export type LearnerContext = {
  mode: 'private' | 'institution' | 'workplace'; programmeId: string | null; studyYear: number | null;
  moduleIds: string[]; verification: 'self-declared' | 'institution-verified';
};
export type ModuleChooserProps = {
  programmes: Programme[]; modules: CurriculumModule[]; context: LearnerContext;
  onChange: (nextContext: LearnerContext) => void; onStart: (moduleId: string) => void;
};

const initialPrivate: LearnerContext = { mode: 'private', programmeId: null, studyYear: null, moduleIds: [], verification: 'self-declared' };
const safeDate = (value: string) => /^\d{4}-\d{2}-\d{2}T/.test(value) ? value.slice(0, 10) : 'date not confirmed';
const safeHttpsUrl = (value: unknown) => {
  if (typeof value !== 'string' || value.trim() !== value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
};

const reviewedFor = (item: CurriculumModule, programme: Programme) =>
  item.status === 'reviewed' && typeof item.code === 'string' && Boolean(item.code.trim()) &&
  Number.isInteger(item.catalogueYear) && item.catalogueYear! >= 1900 &&
  item.source?.evidenceStatus === 'original-reviewed' &&
  Array.isArray(item.programmeIds) && item.programmeIds.includes(programme.id) &&
  item.institutionId === programme.institutionId && safeHttpsUrl(item.source?.url) &&
  typeof item.source.locator === 'string' && Boolean(item.source.locator.trim()) &&
  typeof item.source.checkedAt === 'string' && /^\d{4}-\d\d-\d\dT/.test(item.source.checkedAt) &&
  Number.isFinite(Date.parse(item.source.checkedAt)) && Number.isInteger(item.studyYear) && item.studyYear >= 1;

export default function ModuleChooser({ programmes, modules, context, onChange, onStart }: ModuleChooserProps) {
  const selected = programmes.find(item => item.id === context.programmeId);
  const programmeModules = selected
    ? modules.filter(item => reviewedFor(item, selected))
    : [];
  const available = context.studyYear === null ? programmeModules : programmeModules.filter(item => item.studyYear === context.studyYear);
  const emit = (next: LearnerContext) => {
    const nextProgramme = programmes.find(item => item.id === next.programmeId);
    const allowed = new Set(nextProgramme
      ? modules.filter(item => reviewedFor(item, nextProgramme) && (next.studyYear === null || item.studyYear === next.studyYear)).map(item => item.id)
      : []);
    onChange({ ...next, moduleIds: next.moduleIds.filter(id => allowed.has(id)), verification: 'self-declared' });
  };
  const changeProgramme = (event: ChangeEvent<HTMLSelectElement>) => {
    const programmeId = event.target.value || null;
    emit({ mode: programmeId ? 'institution' : 'private', programmeId, studyYear: null, moduleIds: context.moduleIds, verification: 'self-declared' });
  };
  const changeYear = (event: ChangeEvent<HTMLSelectElement>) => {
    const studyYear = event.target.value ? Number(event.target.value) : null;
    const allowed = new Set(programmeModules.filter(item => studyYear === null || item.studyYear === studyYear).map(item => item.id));
    emit({ ...context, studyYear, moduleIds: context.moduleIds.filter(id => allowed.has(id)) });
  };
  const toggle = (id: string, checked: boolean) => {
    if (!available.some(item => item.id === id)) return;
    const moduleIds = checked ? [...new Set([...context.moduleIds, id])] : context.moduleIds.filter(value => value !== id);
    emit({ ...context, moduleIds });
  };
  return <section className="module-chooser" aria-labelledby="module-chooser-title">
    <style>{`.module-chooser{--paper:#fffdf8;--chalk:#f5f0e6;--moss:#3e5144;--sage:#dfe6d8;--ink:#252b28;--line:#d9ddcf;box-sizing:border-box;max-width:960px;margin:auto;padding:clamp(1rem,3vw,2rem);background:var(--chalk);color:var(--ink);font-family:KairoManrope,Manrope,Arial,sans-serif}.module-chooser *{box-sizing:border-box}.module-chooser h1,.module-chooser h2{color:var(--ink)}.module-chooser p{line-height:1.6}.module-chooser label{display:grid;gap:.4rem;font-weight:650}.module-chooser select{min-height:44px;max-width:100%;padding:.65rem;border:1px solid var(--line);border-radius:7px;background:var(--paper);color:var(--ink);font:inherit}.module-chooser .mc-controls{display:flex;flex-wrap:wrap;gap:1rem;margin:1rem 0}.module-chooser .mc-controls label{flex:1 1 220px}.module-chooser .mc-card{margin:.75rem 0;padding:1rem;border:1px solid var(--line);border-radius:10px;background:var(--paper)}.module-chooser .mc-card label{display:flex;align-items:flex-start;gap:.7rem}.module-chooser input{width:20px;height:20px;accent-color:var(--moss)}.module-chooser .mc-start,.module-chooser .mc-private{display:inline-flex;align-items:center;min-height:44px;margin-top:.65rem;padding:.65rem .9rem;border:1px solid var(--moss);border-radius:7px;background:var(--moss);color:var(--paper);font:inherit;font-weight:650}.module-chooser .mc-private{background:var(--paper);color:var(--moss)}.module-chooser :focus-visible{outline:3px solid #906044;outline-offset:3px}.module-chooser .mc-meta{color:#4f5c51;font-size:.9rem}`}</style>
    <p className="mc-meta">Choose what fits your study. This choice is self-declared.</p>
    <h1 id="module-chooser-title">Choose a module</h1>
    <p>You can study privately with your own material. You do not need a university or a CV to begin.</p>
    <div className="mc-controls">
      <label>Programme (optional)<select value={selected?.id ?? ''} onChange={changeProgramme}><option value="">Private study</option>{programmes.map(item => <option key={item.id} value={item.id}>{item.title} · {item.qualification}</option>)}</select></label>
      {selected && <label>Year of study<select value={context.studyYear ?? ''} onChange={changeYear}><option value="">All years</option>{[...new Set(programmeModules.map(item => item.studyYear))].sort((a,b)=>a-b).map(year=><option key={year} value={year}>Year {year}</option>)}</select></label>}
    </div>
    {selected && <p className="mc-meta">Programme context is self-declared; it does not confirm enrolment. Sources are listed with their review date.</p>}
    {!selected ? <p role="status">No programme selected. You can start with your own material at any time.</p> : available.length === 0 ? <p role="status">No reviewed modules match this programme and year yet. Try another year or start with your own material.</p> : <div aria-label="Reviewed modules">{available.map(item=><article className="mc-card" key={item.id}>
      <label><input type="checkbox" checked={context.moduleIds.includes(item.id)} onChange={event=>toggle(item.id,event.target.checked)}/><span><strong>{item.title}</strong><br/><span className="mc-meta">Year {item.studyYear} · Catalogue {item.catalogueYear} · Source checked {safeDate(item.source.checkedAt)}</span><br/><span className="mc-meta">{item.source.locator}</span></span></label>
      <p className="mc-meta">Reviewed choice · source <a href={item.source.url} target="_blank" rel="noreferrer">opens in a new tab</a></p>
      {context.moduleIds.includes(item.id) && <button className="mc-start" type="button" onClick={()=>onStart(item.id)}>Start this module</button>}
    </article>)}</div>}
    <a className="mc-private" href="/sources">Start with my material</a>
  </section>;
}
