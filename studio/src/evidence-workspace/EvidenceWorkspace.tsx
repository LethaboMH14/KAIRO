import { useEffect, useState } from 'react';
import { ArrowLeft, Download, FileText, ShieldCheck } from 'lucide-react';
import { artifactMarkdown } from '../evidence/model';
import { readProfile } from '../profile/model';
import { assess, exportRun, initialState, scenario, transition, type AssistanceExposure, type Disposition, type RowDecision, type WorkSimAction, type WorkSimExport, type WorkSimState } from '../worksim/model';
import { decisionOptionsForRow, workSimMarkdown } from './worksim-presentation';
import { portfolioDownloadMessage, preparePortfolioDownloads } from './portfolio-download';
import { loadingSavedPractice, readSavedPractice, type SavedPracticeReadState } from './profile-read-state';
import './evidence-workspace.css';

type Tab = 'practice' | 'service';

function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function PracticeEvidence({ state, onRetry }: { state: SavedPracticeReadState; onRetry: () => void }) {
  if (state.status === 'loading') return <div className="ew-empty"><p role="status">Checking saved practice on this device…</p></div>;
  if (state.status === 'unreadable') return <div className="ew-empty" role="alert"><FileText size={25} /><h2>Saved practice could not be opened</h2><p>KAIRO has not reset or overwritten these records. Retry reading the saved history, or continue with the separate fictional service-data case.</p><button className="ew-export" onClick={onRetry}>Try reading saved practice again</button></div>;
  if (state.status === 'unavailable') return <div className="ew-empty" role="alert"><FileText size={25} /><h2>Saved practice could not be prepared</h2><p>The saved profile was read, but its practice records could not be summarized. Your records have not been changed.</p><button className="ew-export" onClick={onRetry}>Try again</button></div>;
  const artifacts = state.artifacts;
  if (!artifacts.length) return <div className="ew-empty"><FileText size={25} /><h2>No saved practice yet</h2><p>Complete the shop case and save a reflection. Completed records appear here when their saved steps match the case.</p><a href="/practice">Open the shop case</a></div>;
  return <div className="ew-artifacts">{artifacts.map((artifact) => <article className="ew-artifact" key={artifact.runId}>
    <header><div><span className="ew-status"><ShieldCheck size={15} />Local practice · unverified</span><h2>{artifact.title}</h2><p>Saved {new Date(artifact.completedAt).toLocaleString()}</p></div><button className="ew-export" onClick={() => download(`KAIRO-practice-${artifact.runId}.md`, artifactMarkdown(artifact))}><Download size={16} /> Export this case</button></header>
    <details className="ew-provenance"><summary>Source and case details</summary><p>{artifact.lessonId ? `Linked lesson ${artifact.lessonId}` : 'Standalone case'} · Scenario {artifact.scenarioVersion} · Source: {artifact.source} · Run {artifact.runId}</p><p>These checks replay the saved steps against this authored case. They do not verify who completed them.</p></details>
    <div className="ew-table-scroll"><table><caption>Case checks and attempts</caption><thead><tr><th scope="col">Check</th><th scope="col">Attempts</th><th scope="col">First try</th><th scope="col">Latest</th></tr></thead><tbody>{artifact.rubric.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.attempts}</td><td>{row.firstTry ? 'Met' : 'Retry needed'}</td><td>{row.met ? 'Met' : 'Not met'}</td></tr>)}</tbody></table></div>
    <details className="ew-trail"><summary>Read the recorded attempt trail ({artifact.attempts.length})</summary><ol>{artifact.attempts.map((attempt, index) => <li key={`${attempt.at}-${index}`}><time dateTime={attempt.at}>{new Date(attempt.at).toLocaleString()}</time><strong>{attempt.kind}</strong><span>{attempt.value}</span>{attempt.correct !== undefined && <small>{attempt.correct ? 'Scenario check met' : 'Retry needed'}</small>}</li>)}</ol></details>
    <section className="ew-reflection"><h3>Your reflection</h3><p>{artifact.contributorReflection}</p></section>
    <section className="ew-limits"><h3>What this record can tell you</h3><ul>{artifact.limitations.map((limit) => <li key={limit}>{limit}</li>)}</ul></section>
  </article>)}</div>;
}

function WorkSimulation({ onStateChange }: { onStateChange: (state: WorkSimState | null) => void }) {
  const [state, setState] = useState<WorkSimState | null>(null);
  const [loadError, setLoadError] = useState('');
  const [reflection, setReflection] = useState('');
  const [cleaning, setCleaning] = useState<Record<string, RowDecision>>({});
  const [report, setReport] = useState<Record<string, string>>({});
  const [explicitAssistance, setExplicitAssistance] = useState<AssistanceExposure>('unknown');
  const active = state;
  useEffect(() => onStateChange(state), [state, onStateChange]);
  const assessment = active ? assess(active) : null;
  const revision = active?.phase === 'clean-v1' || active?.phase === 'report-v1' ? 'shift-close-v1' : 'morning-cutoff-v2';
  const rows = scenario.records;
  const requirement = revision === 'shift-close-v1' ? scenario.requirements.first : scenario.requirements.changed;
  function act(action: WorkSimAction) {
    if (!active) return;
    const next = transition(active, action, new Date().toISOString());
    if (active.phase === 'report-v1' && next.phase === 'clean-v2') { setCleaning({}); setReport({}); setReflection(''); }
    setState(next);
  }
  function setDecision(sourceRowId: string, value: string) {
    const [disposition, reason] = value.split('|');
    setCleaning(previous => ({ ...previous, [sourceRowId]: { sourceRowId, disposition: disposition as Disposition, reason: reason as RowDecision['reason'] } }));
  }
  function submitCleaning() {
    if (!active) return;
    const decisions = rows.map(row => cleaning[row.sourceRowId]).filter(Boolean);
    act({ type: 'submit-cleaning', revision, decisions });
  }
  function submitReport() {
    if (!active) return;
    const fields = revision === 'shift-close-v1' ? scenario.requirements.first.outcomeFields : scenario.requirements.changed.outcomeFields;
    const values = Object.fromEntries(fields.map(field => [field, Number(report[field])])) as Record<string, number>;
    act({ type: 'submit-report', revision, values });
  }
  function exportSimulation() {
    if (!active) return;
    const artifact = exportRun(active);
    if (artifact) download(`KAIRO-service-simulation-${artifact.runId}.md`, workSimMarkdown(artifact));
    else setLoadError('This run has not passed replay validation for export. Complete each required step and submit all checks first.');
  }
  return <div className="ew-work"><div className="ew-synthetic"><strong>Fabricated exercise</strong><span>Every company, ticket, timestamp and message below was invented for this scenario.</span></div>
    <section className="ew-case-brief"><p className="ew-case-org">{scenario.organization} · Fictional service operation</p><h2>{scenario.title}</h2><p>{scenario.brief}</p><details><summary>Read the field guide</summary><dl>{Object.entries(scenario.dictionary).map(([field, meaning]) => <div key={field}><dt>{field}</dt><dd>{meaning}</dd></div>)}</dl></details></section>
    <div className="ew-manager"><strong>Scripted manager message</strong><p>{!active || ['inspect', 'clean-v1', 'report-v1'].includes(active.phase) ? scenario.roleMessages[0].text : scenario.roleMessages[1].text}</p><small>Authored scenario text · no live manager or AI teammate</small></div>
    {!active && <div className="ew-start"><p>Inspect nine synthetic ticket rows, make and revise cleaning decisions, submit two calculated reports, reflect, and export a replay-validated evidence file when complete. Your run stays in this page memory and is not saved automatically.</p><label className="ew-start-assistance">Assistance exposure before this run<select value={explicitAssistance} onChange={event => setExplicitAssistance(event.target.value as AssistanceExposure)}><option value="unknown">Unknown</option><option value="none">None</option><option value="hint">Hint</option><option value="worked-example">Worked example</option></select><small>Self-reported. Choose only what describes assistance you actually used.</small></label><button className="ew-action" onClick={() => { const id = `service-${crypto.randomUUID()}`; const initial = initialState(id); setLoadError(''); setCleaning({}); setReport({}); setReflection(''); setState(transition(initial, { type: 'set-assistance', exposure: explicitAssistance }, new Date().toISOString())); }}>Start a new run</button></div>}
    {loadError && <p className="ew-error" role="alert">{loadError}</p>}
    {active && <>
      <section className="ew-queue"><div className="ew-queue-heading"><div><p className="ew-kicker">Source data</p><h3>Service queue · 9 rows</h3></div><span>{active.inspectedRowIds.length} inspected</span></div><div className="ew-table-scroll"><table><caption>Fabricated source lines. Inspect each row before cleaning.</caption><thead><tr><th scope="col">Row</th><th scope="col">Ticket</th><th scope="col">Status</th><th scope="col">Last update</th><th scope="col">Resolution</th><th scope="col">Customer verified</th><th scope="col">Source</th><th scope="col">Inspect</th></tr></thead><tbody>{rows.map(row => <tr key={row.sourceRowId}><th scope="row">{row.sourceRowId}</th><td>{row.ticketId}</td><td>{row.status}</td><td>{row.updatedAt || 'Missing'}</td><td>{row.resolutionCode || 'Missing'}</td><td>{row.customerVerified === null ? 'Unknown' : row.customerVerified ? 'Yes' : 'No'}</td><td>{row.source}</td><td><button className="ew-small-action" disabled={active.phase !== 'inspect' || active.inspectedRowIds.includes(row.sourceRowId)} onClick={() => act({ type: 'inspect-row', sourceRowId: row.sourceRowId })}>{active.inspectedRowIds.includes(row.sourceRowId) ? 'Inspected' : 'Inspect'}</button></td></tr>)}</tbody></table></div></section>
      {active.phase === 'clean-v1' || active.phase === 'clean-v2' ? <section className="ew-task"><p className="ew-kicker">Cleaning decision · {revision === 'shift-close-v1' ? 'V1' : 'V2'}</p><h3>{requirement.title}</h3><p>{requirementText(revision)}</p><div className="ew-table-scroll"><table><caption>Select one disposition and reason for every source row.</caption><thead><tr><th scope="col">Source row</th><th scope="col">Status</th><th scope="col">Updated</th><th scope="col">Disposition and reason</th></tr></thead><tbody>{rows.map(row => <tr key={row.sourceRowId}><th scope="row">{row.sourceRowId} · {row.ticketId}</th><td>{row.status}</td><td>{row.updatedAt || 'Missing'}</td><td><label className="sr-only" htmlFor={`decision-${revision}-${row.sourceRowId}`}>Decision for {row.sourceRowId}</label><select id={`decision-${revision}-${row.sourceRowId}`} value={cleaning[row.sourceRowId] ? `${cleaning[row.sourceRowId].disposition}|${cleaning[row.sourceRowId].reason}` : ''} onChange={event => setDecision(row.sourceRowId, event.target.value)}><option value="">Choose a decision</option>{decisionOptionsForRow(revision, row).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td></tr>)}</tbody></table></div><button className="ew-action" onClick={submitCleaning} disabled={rows.some(row => !cleaning[row.sourceRowId])}>Submit cleaning decisions</button></section> : null}
      {active.phase === 'report-v1' || active.phase === 'report-v2' ? <section className="ew-task"><p className="ew-kicker">Your report · {revision === 'shift-close-v1' ? 'V1' : 'V2'}</p><h3>{requirement.title}</h3><p>Count from the cleaned current-state rows. Every value is checked against this fictional fixture; failed submissions stay in the attempt trail.</p><div className="ew-report-fields">{(revision === 'shift-close-v1' ? scenario.requirements.first.outcomeFields : scenario.requirements.changed.outcomeFields).map(field => <label key={field}>{reportLabel(field)}<input type="number" min="0" max="9" step="1" inputMode="numeric" value={report[field] ?? ''} onChange={event => setReport(previous => ({ ...previous, [field]: event.target.value }))} /></label>)}</div><button className="ew-action" onClick={submitReport} disabled={(revision === 'shift-close-v1' ? scenario.requirements.first.outcomeFields : scenario.requirements.changed.outcomeFields).some(field => report[field] === undefined || !/^\d+$/.test(report[field]))}>Check my report</button></section> : null}
      {active.phase === 'reflect' && <section className="ew-task"><p className="ew-kicker">Reflection</p><h3>What changed in your approach?</h3><label htmlFor="ew-reflection">Write 30–1,000 characters about your cleaning choices and changed requirement.</label><textarea id="ew-reflection" maxLength={1000} value={reflection} onChange={event => setReflection(event.target.value)} /><p className="ew-count">{reflection.length} / 1,000 characters</p><button className="ew-action" disabled={reflection.trim().length < 30} onClick={() => act({ type: 'reflect', value: reflection })}>Save reflection to this run</button></section>}
      <p className="ew-feedback" role="status">{active.feedback || 'Each action is recorded locally in this in-memory run. This run is not saved; export it before leaving if you want a copy.'}</p>
      {assessment && <section className="ew-attempts"><div className="ew-queue-heading"><div><p className="ew-kicker">Your work trail</p><h3>Attempts and current checks</h3></div><span>{active.events.length} actions</span></div><p className="ew-assistance-summary">Scored-attempt assistance: <strong>{assessment.assistanceExposure}</strong> · unknown exposure on {assessment.unknownAssistanceAttempts} attempt(s){assessment.reportedAssistance.length ? ` · learner-reported ${assessment.reportedAssistance.join(', ')}` : ''}. This is self-reported, not independently observed.</p><div className="ew-checks">{assessment.checks.map(check => <div key={check.key}><strong>{check.key.replaceAll('-', ' ')}</strong><span>{check.attempts} attempts · first {check.firstTry ? 'met' : check.attempts ? 'retry needed' : 'not yet'} · latest {check.latestMet ? 'met' : 'not met'}</span></div>)}</div><details><summary>Review all recorded actions</summary><ol>{active.events.map((event, index) => <li key={`${event.at}-${index}`}><time dateTime={event.at}>{event.at}</time><strong>{event.kind}</strong><span>{event.value}</span>{event.correct !== undefined && <small>{event.correct ? 'Scenario check met' : 'Retry needed'}</small>}<small>Assistance exposure: {event.assistanceExposure} (self-reported)</small></li>)}</ol></details></section>}
      {active.phase === 'complete' && <section className="ew-complete"><h3>Run complete · local simulation, unverified</h3><p>Scored-attempt assistance: {assessment?.assistanceExposure}; {assessment?.unknownAssistanceAttempts} attempt(s) have unknown exposure. {assessment?.reportedAssistance.length ? `Reported support: ${assessment.reportedAssistance.join(', ')} (self-reported).` : 'No hint or worked-example support was reported.'}</p><div><button className="ew-action" onClick={exportSimulation}><Download size={15} /> Export evidence</button><button className="ew-small-action" onClick={() => { setState(null); setExplicitAssistance('unknown'); setCleaning({}); setReport({}); setReflection(''); setLoadError(''); }}>Start another run</button></div></section>}
      <div className="ew-run-actions"><p>This run stays in this page memory until you leave. Export only becomes available after the model confirms replay consistency.</p></div>
    </>}
    <p className="ew-limits"><strong>Scenario limits:</strong> the morning rule selects each ticket's latest current row before applying the cutoff. It is not a historical as-of-11:00 snapshot or an SLA-duration result. All role messages are scripted. These records are fictional, local, self-directed practice; they do not establish workplace competence or employer endorsement.</p>
  </div>;
}

function reportLabel(field: string) { return field.replace(/([A-Z])/g, ' $1').replace(/^./, character => character.toUpperCase()); }
function requirementText(revision: 'shift-close-v1' | 'morning-cutoff-v2') { return revision === 'shift-close-v1' ? scenario.requirements.first.text : scenario.requirements.changed.message; }

export default function EvidenceWorkspace() {
  const [tab, setTab] = useState<Tab>('practice');
  const [practiceState, setPracticeState] = useState<SavedPracticeReadState>(loadingSavedPractice);
  const [exportError, setExportError] = useState('');
  const [exportStatus, setExportStatus] = useState('');
  const [worksimState, setWorksimState] = useState<WorkSimState | null>(null);
  function refreshSavedPractice() { setPracticeState(readSavedPractice(readProfile)); }
  function exportPortfolio(format: 'html' | 'json') {
    setExportError('');
    setExportStatus('');
    try {
      const result = preparePortfolioDownloads(readProfile(), worksimState ?? undefined);
      const file = format === 'html'
        ? { name: 'KAIRO-practice-portfolio.html', content: result.html, type: 'text/html;charset=utf-8' }
        : { name: 'KAIRO-practice-portfolio.json', content: result.json, type: 'application/json;charset=utf-8' };
      downloadFile(file.name, file.content, file.type);
      setExportStatus(portfolioDownloadMessage(result.rejectedCount));
    } catch (failure) {
      setExportError(failure instanceof Error ? failure.message : 'Portfolio could not be prepared. Your records were not changed.');
    }
  }
  useEffect(() => { if (window.location.pathname !== '/evidence') document.title = 'KAIRO · Evidence workspace'; refreshSavedPractice(); }, []);
  return <div className="ew-shell"><header className="ew-header"><a className="brand" href="/" aria-label="KAIRO home"><span className="brand-symbol">k</span>KAIRO<span className="brand-access">Access</span></a><nav aria-label="Workspace navigation"><a href="/"><ArrowLeft size={15} /> Learning studio</a><a href="/progress">My progress</a></nav><span className="ew-local">Read-only profile view</span></header>
    <main className="ew-main"><div className="ew-heading"><div><p className="ew-kicker">Your decisions, with their working</p><h1>Your practice evidence.</h1><p>Review saved shop practice or try a separate fictional service-data case. Your practice stays in this browser.</p></div><div className="ew-heading-actions"><span className="ew-scope">Self-reported · unverified</span><button className="ew-portfolio-download" onClick={() => exportPortfolio('html')}>Download portfolio · HTML</button><button className="ew-portfolio-download" onClick={() => exportPortfolio('json')}>Download portfolio · JSON</button></div></div>
      {exportError && <p className="ew-error" role="alert">{exportError}</p>}
      {exportStatus && <p className="ew-export-status" role="status">{exportStatus}</p>}
      <div className="ew-tabs" role="tablist" aria-label="Practice and case"><button id="ew-tab-practice" role="tab" aria-selected={tab === 'practice'} aria-controls="ew-panel-practice" onClick={() => setTab('practice')}>Saved practice <span>{practiceState.status === 'ready' ? practiceState.artifacts.length : '—'}</span></button><button id="ew-tab-service" role="tab" aria-selected={tab === 'service'} aria-controls="ew-panel-service" onClick={() => setTab('service')}>Service case <span>Fictional</span></button></div>
      <section id="ew-panel-practice" role="tabpanel" aria-labelledby="ew-tab-practice" className="ew-panel" hidden={tab !== 'practice'}><div className="ew-panel-heading"><div><h2>Saved shop practice</h2><p>Completed records appear here when their saved steps match the case.</p></div><a href="/practice">Practise another case</a></div><PracticeEvidence state={practiceState} onRetry={refreshSavedPractice} /></section>
      <section id="ew-panel-service" role="tabpanel" aria-labelledby="ew-tab-service" className="ew-panel" hidden={tab !== 'service'}><WorkSimulation onStateChange={setWorksimState} /></section>
      <footer className="ew-footer">Local records can be edited on this device. Replay checks test internal consistency; they do not verify identity, actual workplace performance, competence, or accreditation. Help exposure is unknown when the scenario does not record it.</footer>
    </main></div>;
}
