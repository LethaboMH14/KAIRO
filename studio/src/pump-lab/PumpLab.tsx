import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import { ArrowLeft, Check, CircleHelp, ClipboardList, Download, Eye, FileText, Gauge, Layers, RotateCcw, Search, Wrench } from 'lucide-react';
import './pump-lab.css';
import { CASES, CASE_IDS, CAUSES, CAUSE_IDS, PARTS, REPAIRS, REPAIR_IDS, type CaseId, type CauseId, type PartId, type RepairId } from './cases.ts';
import { CHANNEL_INFO, INSTRUMENT, SECTIONS, type Section } from './instruments.ts';
import { CAMERA_PRESETS, TARGETS, TARGET_BY_ID, isTargetId, stateCues, type TargetId } from './layout.ts';
import { CIRCUIT, DOMAIN, KPA_PER_M, LIMITS, MODEL_STATUS, NPSH_ATM_HEAD_M, PUMP, PumpLabError, valveK } from './physics.ts';
import { buildReport, fnv1a, reportText, toEvidenceItem } from './report.ts';
import { hasLivePrediction, latestReading, stateSummary, targetReadout, teacherContext } from './readout.ts';
import { MAX, assess, currentOperatingPoint, initialState, resetRun, restore, serialize, statementText, transition, type Action, type PumpLabState } from './session.ts';
import type { PumpLabEntryProps, PumpLabView } from './interface.ts';
import PumpDiagram from './PumpDiagram';
import { CurvePlot, ReadingsPlot } from './PumpPlots';

const PumpScene = lazy(() => import('./PumpScene'));

class SceneBoundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_e: Error, _i: ErrorInfo) { this.props.onFail(); }
  render() { return this.state.failed ? <p className="pl-note-box">The 3D view could not start on this device. The diagram shows the same circuit.</p> : this.props.children; }
}

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

function usePrefersReducedMotion(): boolean {
  const [v, setV] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const m = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!m) return;
    const h = () => setV(m.matches);
    m.addEventListener('change', h);
    return () => m.removeEventListener('change', h);
  }, []);
  return v;
}

function seedFor(sessionId: string): number { return parseInt(fnv1a(sessionId), 16) >>> 0; }
function newSessionId(): string {
  const c = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `pump-lab-${c}`.slice(0, 80);
}

const f = (v: number, d = 1) => v.toFixed(d);
const PART_FOR_TARGET: Partial<Record<TargetId, PartId>> = { impeller: 'impeller', strainer: 'strainer', valve: 'valve-gate' };
const STATUS_WORD = { met: 'met', 'not-met': 'not met', close: 'too close to call' } as const;
const STATUS_MARK = { met: '✓', 'not-met': '✗', close: '≈' } as const;

export default function PumpLab(props: PumpLabEntryProps) {
  const { onExit, onSnapshot, onEvidence, onContext, highlightTarget } = props;
  const now = props.now ?? (() => new Date().toISOString());
  const reducedOS = usePrefersReducedMotion();
  const [reducedChoice, setReducedChoice] = useState<boolean | null>(null);
  const reduced = reducedChoice ?? reducedOS;

  const boot = useMemo(() => {
    let restoredNote: string | null = null;
    if (props.snapshot) {
      const r = restore(props.snapshot);
      if (r) return { state: r, note: null as string | null };
      restoredNote = 'The saved session could not be restored, so this is a fresh start.';
    }
    const sessionId = props.sessionId ?? newSessionId();
    return { state: initialState(sessionId, props.seed ?? seedFor(sessionId), props.caseId ?? CASE_IDS[0]), note: restoredNote };
    // Mount-only: later prop changes do not restart a learner's work.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [state, setStateRaw] = useState<PumpLabState>(boot.state);
  const stateRef = useRef(state);
  const setState = (s: PumpLabState) => { stateRef.current = s; setStateRaw(s); };
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(boot.note ? { text: boot.note, error: true } : null);
  const [selected, setSelected] = useState<TargetId | null>(null);
  const [view, setView] = useState<PumpLabView>(props.view ?? 'auto');
  const [sceneFailed, setSceneFailed] = useState(false);
  const [preset, setPreset] = useState('overview');
  const [explode, setExplode] = useState(0);
  const [speedDraft, setSpeedDraft] = useState(boot.state.settings.speedRpm);
  const [valveDraft, setValveDraft] = useState(boot.state.settings.valvePct);
  const [predictDraft, setPredictDraft] = useState('');
  const [runSeconds, setRunSeconds] = useState(60);
  const [cause, setCause] = useState<CauseId | ''>('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [cmpA, setCmpA] = useState('');
  const [cmpB, setCmpB] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [pickCase, setPickCase] = useState<CaseId>(boot.state.caseId);
  const [pastRuns, setPastRuns] = useState<{ caseId: CaseId; finished: boolean; assistance: string; readings: number }[]>([]);
  const [wide, setWide] = useState(() => typeof window === 'undefined' || window.innerWidth >= 760);

  useEffect(() => {
    const h = () => setWide(window.innerWidth >= 760);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const op = useMemo(() => currentOperatingPoint(state), [state]);
  const live = hasLivePrediction(state);
  const a = useMemo(() => assess(state), [state]);
  const summary = useMemo(() => stateSummary(state, op), [state, op]);
  const cues = useMemo(() => stateCues(op, live), [op, live]);
  const spec = CASES[state.caseId];
  const last = latestReading(state);
  const [canGL] = useState(() => (typeof document === 'undefined' ? false : webglAvailable()));
  const resolvedView: Exclude<PumpLabView, 'auto'> = view === 'auto' ? (canGL && !reduced && wide ? '3d' : 'diagram') : view;
  const show3d = resolvedView === '3d' && canGL && !sceneFailed;
  const marked: TargetId | null = highlightTarget && isTargetId(highlightTarget) ? highlightTarget : null;

  const act = useCallback((action: Action): boolean => {
    try {
      const next = transition(stateRef.current, action, now());
      setState(next);
      setNotice(null);
      onSnapshot?.(serialize(next));
      return true;
    } catch (e) {
      if (e instanceof PumpLabError) { setNotice({ text: e.message, error: true }); return false; }
      throw e;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSnapshot]);

  useEffect(() => { onContext?.(teacherContext(state, selected)); }, [state, selected, onContext]);

  const select = (id: TargetId | null) => setSelected(id);

  const opened = useMemo(() => new Set<PartId>(state.teardowns.filter(t => t.epoch === state.epoch).map(t => t.part)), [state]);
  const benchCondition = useMemo(() => {
    const out: Partial<Record<PartId, boolean>> = {};
    for (const t of state.teardowns.filter(x => x.epoch === state.epoch)) {
      const s = spec;
      out[t.part] = t.epoch === 0 && ((t.part === 'strainer' && s.fault.suctionK > 0.01) || (t.part === 'impeller' && s.fault.impellerHeadFactor < 1) || (t.part === 'valve-gate' && s.fault.valveStuckMaxPct < 100));
    }
    return out;
  }, [state, spec]);

  const supported = state.explanations.some(e => e.outcome === 'supported');
  const lastExplanation = state.explanations[state.explanations.length - 1];

  const doReset = () => {
    setPastRuns(p => [...p, { caseId: state.caseId, finished: state.completed !== null, assistance: a.assistance, readings: state.readings.length }]);
    const fresh = resetRun(state);
    setState(fresh); onSnapshot?.(serialize(fresh));
    setSpeedDraft(fresh.settings.speedRpm); setValveDraft(fresh.settings.valvePct);
    setCause(''); setEvidence([]); setNote(''); setPredictDraft(''); setCmpA(''); setCmpB('');
    setConfirmReset(false); setNotice({ text: 'Case reset to its starting state.', error: false });
  };
  const startCase = (id: CaseId) => {
    setPastRuns(p => state.actions.length ? [...p, { caseId: state.caseId, finished: state.completed !== null, assistance: a.assistance, readings: state.readings.length }] : p);
    const fresh = initialState(state.sessionId, state.seed, id);
    setState(fresh); onSnapshot?.(serialize(fresh));
    setSpeedDraft(fresh.settings.speedRpm); setValveDraft(fresh.settings.valvePct);
    setCause(''); setEvidence([]); setNote(''); setPredictDraft(''); setCmpA(''); setCmpB('');
    setConfirmReset(false); setNotice({ text: `Started: ${CASES[id].title}.`, error: false });
  };

  const exportEvidence = (kind: 'text' | 'json') => {
    const report = buildReport(state);
    const item = toEvidenceItem(state);
    onEvidence?.(item, report);
    const body = kind === 'text' ? reportText(report) : JSON.stringify({ evidence: item, report }, null, 2);
    const blob = new Blob([body], { type: kind === 'text' ? 'text/plain' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pump-lab-${state.caseId}.${kind === 'text' ? 'txt' : 'json'}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const parsePredict = (): number | null => {
    const v = Number(predictDraft);
    return predictDraft.trim() !== '' && Number.isFinite(v) ? v : null;
  };

  const target = selected ? TARGET_BY_ID[selected] : null;
  const benchPart = selected ? PART_FOR_TARGET[selected] : undefined;
  const lastN = state.log.slice(-40);

  return (
    <main className="pl" aria-labelledby="pl-title">
      <a className="pl-skip" href="#pl-task">Skip to the task</a>
      <header className="pl-head">
        <button type="button" className="pl-btn" onClick={onExit}><ArrowLeft aria-hidden="true" size={18} /> {props.exitLabel||'Back to studios'}</button>
        <div className="pl-title-block">
          <p className="pl-eyebrow">Engineering studio</p>
          <h1 id="pl-title">Pump lab</h1>
          <p className="pl-sub">A motor drives a pump from a source tank, through a valve, to a raised tank. Reach {LIMITS.targetFlowLps} L/s without breaking a limit.</p>
        </div>
        <span className="pl-badge" title={MODEL_STATUS}>Illustrative model</span>
      </header>

      <div className="pl-status" role="status" aria-live="polite">
        {notice ? <span className={notice.error ? 'pl-error' : ''}>{notice.error ? 'Not done: ' : ''}{notice.text}</span> : <span>{a.next}</span>}
      </div>

      <div className="pl-grid">
        <section className="pl-room" aria-label="Pump room">
          <div className="pl-toolbar" role="group" aria-label="View">
            {(['auto', '3d', 'diagram', 'reading'] as const).map(v => (
              <button key={v} type="button" className="pl-btn pl-btn-small" aria-pressed={view === v} onClick={() => setView(v)}>
                {v === 'auto' ? 'Auto' : v === '3d' ? '3D room' : v === 'diagram' ? 'Diagram' : 'Reading'}
              </button>
            ))}
            <label className="pl-check"><input type="checkbox" checked={reduced} onChange={e => setReducedChoice(e.target.checked)} /> Reduce motion</label>
          </div>
          <div className={`pl-stage${show3d && resolvedView === '3d' ? ' is-3d' : ''}`}>
            {resolvedView === 'reading' ? (
              <div className="pl-reading" tabIndex={0} aria-label="Text description of the pump room">
                <h2>{summary.headline}</h2>
                {summary.lines.map((l, i) => <p key={i}>{l}</p>)}
                <h3>Parts</h3>
                <ul>{TARGETS.map(t => <li key={t.id}><strong>{t.label}.</strong> {targetReadout(state, t.id).slice(1).join(' ') || t.role}</li>)}</ul>
              </div>
            ) : show3d ? (
              <SceneBoundary onFail={() => setSceneFailed(true)}>
                <Suspense fallback={<p className="pl-note-box" role="status">Preparing the 3D room…</p>}>
                  <PumpScene state={state} op={op} live={live} selected={selected} highlight={marked} reducedMotion={reduced} preset={preset} explode={explode} bench={benchCondition} openedParts={opened} onSelect={select} />
                </Suspense>
              </SceneBoundary>
            ) : (
              <>
                {resolvedView === '3d' && !canGL && <p className="pl-note-box">This device cannot draw the 3D room, so the diagram is shown.</p>}
                <div className="pl-diagram-scroll" tabIndex={0} aria-label="Pump circuit diagram, scrollable">
                  <PumpDiagram state={state} op={op} live={live} selected={selected} highlight={marked} reducedMotion={reduced} onSelect={select} />
                </div>
                <p className="pl-hint pl-narrow-only">Scroll the diagram sideways to see all of it, or choose Reading for plain text.</p>
              </>
            )}
            {show3d && resolvedView === '3d' && (
              <ul className="pl-overlay" aria-label="Last reading and alerts">
                <li>{last ? `${last.id}: suction ${last.measured.suctionKpa} kPa · discharge ${last.measured.dischargeKpa} kPa · after valve ${last.measured.postValveKpa} kPa · flow ${f(last.measured.flowLps)} L/s · motor ${f(last.measured.shaftKw, 2)} kW` : 'No reading yet.'}</li>
                {cues.filter(c => c.active && ['discharge-over-limit', 'motor-over-rating', 'cavitation-bubbles', 'source-low'].includes(c.id)).map(c => <li key={c.id} className="is-alert">{c.text}</li>)}
              </ul>
            )}
          </div>
          {show3d && (
            <div className="pl-toolbar" role="group" aria-label="3D controls">
              {CAMERA_PRESETS.map(p => <button key={p.id} type="button" className="pl-btn pl-btn-small" aria-pressed={preset === p.id} onClick={() => setPreset(p.id)}>{p.label}</button>)}
              <label className="pl-range-label">Pull the bench parts apart
                <input type="range" min={0} max={1} step={0.05} value={explode} onChange={e => setExplode(Number(e.target.value))} aria-valuetext={`${Math.round(explode * 100)} percent apart`} />
              </label>
            </div>
          )}

          <div className="pl-parts-wrap">
            <h2 className="pl-h2"><Layers aria-hidden="true" size={18} /> Parts</h2>
            <ul className="pl-parts">
              {TARGETS.map(t => (
                <li key={t.id}>
                  <button type="button" className="pl-btn pl-btn-small pl-part-btn" aria-pressed={selected === t.id} onClick={() => select(selected === t.id ? null : t.id)}>{t.label}</button>
                </li>
              ))}
            </ul>
            <div className="pl-selected" aria-live="polite">
              {target ? (
                <>
                  <h3>{target.label}</h3>
                  <p>{target.role}</p>
                  {targetReadout(state, target.id).slice(1).map((l, i) => <p key={i}>{l}</p>)}
                  {benchPart && <button type="button" className="pl-btn pl-btn-small" onClick={() => act({ type: 'inspect-part', part: benchPart })} disabled={state.completed !== null}><Wrench aria-hidden="true" size={16} /> Open the {PARTS[benchPart].label.toLowerCase()} on the bench</button>}
                </>
              ) : <p>Choose a part to read what it does and what it shows now.</p>}
            </div>
          </div>

          <details className="pl-legend" open>
            <summary>What the moving and glowing things mean</summary>
            <ul>{cues.map(c => <li key={c.id}><strong>{c.active ? 'On' : 'Off'}</strong> · {c.meaning} <em>Now: {c.text}</em></li>)}</ul>
          </details>
        </section>

        <section className="pl-task" id="pl-task" aria-label="Your task">
          {props.teachingPanel}
          <ol className="pl-steps" aria-label="Progress">
            {([['predict', 'Predict'], ['measure', 'Measure'], ['isolate', 'Compare sections'], ['explain', 'Explain'], ...(spec.repair ? [['repair', 'Repair']] : []), ['verify', 'Confirm'], ['finish', 'Finish']] as [keyof typeof a.stepsDone, string][]).map(([k, label]) => (
              <li key={k} className={a.stepsDone[k] ? 'is-done' : ''}>{a.stepsDone[k] ? <Check aria-hidden="true" size={14} /> : null} {label}<span className="pl-sr"> {a.stepsDone[k] ? 'done' : 'not done'}</span></li>
            ))}
          </ol>

          <article className="pl-card" aria-labelledby="pl-case">
            <h2 id="pl-case" className="pl-h2"><ClipboardList aria-hidden="true" size={18} /> {spec.title}</h2>
            <p>{spec.report}</p>
            <div className="pl-inline">
              <label>Case
                <select value={pickCase} onChange={e => setPickCase(e.target.value as CaseId)}>
                  {CASE_IDS.map(id => <option key={id} value={id}>{CASES[id].title}</option>)}
                </select>
              </label>
              <button type="button" className="pl-btn pl-btn-small" onClick={() => startCase(pickCase)} disabled={pickCase === state.caseId && state.actions.length === 0}>Start this case</button>
            </div>
          </article>

          <article className="pl-card" aria-labelledby="pl-settings">
            <h2 id="pl-settings" className="pl-h2"><Gauge aria-hidden="true" size={18} /> 1. Set the pump and valve</h2>
            <label className="pl-range-label">Pump speed: <strong>{speedDraft} rpm</strong> ({Math.round((speedDraft / PUMP.ratedRpm) * 100)}% of rated)
              <input type="range" min={DOMAIN.speedRpm.min} max={DOMAIN.speedRpm.max} step={10} value={speedDraft} onChange={e => setSpeedDraft(Number(e.target.value))} aria-valuetext={`${speedDraft} revolutions per minute`} />
            </label>
            <label className="pl-range-label">Valve handle: <strong>{valveDraft}% open</strong>
              <input type="range" min={0} max={100} step={5} value={valveDraft} onChange={e => setValveDraft(Number(e.target.value))} aria-valuetext={`${valveDraft} percent open`} />
            </label>
            <p className="pl-hint">Applied now: {state.settings.speedRpm} rpm, valve {state.settings.valvePct}%.</p>
            <button type="button" className="pl-btn" onClick={() => act({ type: 'set-settings', speedRpm: speedDraft, valvePct: valveDraft })} disabled={state.completed !== null || (speedDraft === state.settings.speedRpm && valveDraft === state.settings.valvePct)}>Apply these settings</button>
          </article>

          <article className="pl-card" aria-labelledby="pl-predict">
            <h2 id="pl-predict" className="pl-h2"><Eye aria-hidden="true" size={18} /> 2. Predict the flow</h2>
            <p>Before the first reading, say what flow you expect at the applied settings, in L/s. The datasheet curves in the plot below are there to help.</p>
            <div className="pl-inline">
              <label>Predicted flow (L/s)
                <input type="number" inputMode="decimal" min={DOMAIN.predictLps.min} max={DOMAIN.predictLps.max} step={0.1} value={predictDraft} onChange={e => setPredictDraft(e.target.value)} />
              </label>
              <button type="button" className="pl-btn" onClick={() => { const v = parsePredict(); if (v === null) { setNotice({ text: 'Enter a number of litres per second.', error: true }); return; } act({ type: 'predict', flowLps: v }); }} disabled={state.completed !== null}>Lock in prediction</button>
            </div>
            {state.predictions.length > 0 && <p className="pl-hint">Latest: {f(state.predictions[state.predictions.length - 1].flowLps)} L/s at {state.predictions[state.predictions.length - 1].speedRpm} rpm, valve {state.predictions[state.predictions.length - 1].valvePct}%.</p>}
          </article>

          <article className="pl-card" aria-labelledby="pl-run">
            <h2 id="pl-run" className="pl-h2"><Search aria-hidden="true" size={18} /> 3. Run and read</h2>
            <p>Take a reading of the gauges, or let the transfer run so the tanks change. Readings carry small simulated instrument errors.</p>
            <div className="pl-inline">
              <button type="button" className="pl-btn" onClick={() => act({ type: 'take-reading' })} disabled={state.completed !== null || state.readings.length >= MAX.readings}>Take a reading</button>
              <label>Run for
                <select value={runSeconds} onChange={e => setRunSeconds(Number(e.target.value))}>
                  {[30, 60, 120, 300, 600].map(s => <option key={s} value={s}>{s} s</option>)}
                </select>
              </label>
              <button type="button" className="pl-btn" onClick={() => act({ type: 'run-transfer', seconds: runSeconds })} disabled={state.completed !== null}>Run the transfer</button>
            </div>
            <p className="pl-hint">Time in this case: {state.clockS} s. {state.runs.length ? `Last run moved ${f(state.runs[state.runs.length - 1].movedL, 0)} L.` : ''}</p>
          </article>

          <article className="pl-card" aria-labelledby="pl-readings">
            <h2 id="pl-readings" className="pl-h2"><FileText aria-hidden="true" size={18} /> 4. Readings and comparisons</h2>
            {state.readings.length === 0 && <p>No readings yet.</p>}
            {state.readings.map(r => {
              const insp = state.inspections.filter(i => i.readingId === r.id);
              return (
                <section key={r.id} className="pl-reading-card" aria-label={`Reading ${r.id}`}>
                  <h3>{r.id} <small>{r.epoch === 0 ? 'before repair' : 'after repair'} · t = {r.clockS} s</small></h3>
                  <table className="pl-table">
                    <tbody>
                      {CHANNEL_INFO.map(c => {
                        const v = r.measured[c.key];
                        return <tr key={c.key}><th scope="row">{c.label}</th><td>{typeof v === 'boolean' ? (v ? 'yes' : 'no') : `${v}${c.unit ? ` ${c.unit}` : ''}`}</td></tr>;
                      })}
                      <tr><th scope="row">Source / destination level</th><td>{r.measured.sourceLevelM} m / {r.measured.destLevelM} m</td></tr>
                    </tbody>
                  </table>
                  <ul className="pl-limits">
                    {r.limits.map(l => <li key={l.key} className={`is-${l.status}`}><span aria-hidden="true">{STATUS_MARK[l.status]}</span> {l.label}: {l.value} {l.unit} against {l.limit} {l.unit} — {STATUS_WORD[l.status]}</li>)}
                  </ul>
                  <div className="pl-inline" role="group" aria-label={`Compare sections for ${r.id}`}>
                    {SECTIONS.map((s: Section) => (
                      <button key={s} type="button" className="pl-btn pl-btn-small" disabled={state.completed !== null || insp.some(i => i.section === s)} onClick={() => act({ type: 'inspect-section', readingId: r.id, section: s })}>
                        Compare {s === 'suction' ? 'suction line' : s === 'pump' ? 'pump' : 'valve'} with datasheet
                      </button>
                    ))}
                  </div>
                  {insp.length > 0 && <ul className="pl-statements">{insp.map(i => <li key={i.id} className={`is-${i.check.flag}`}>{statementText(i)}</li>)}</ul>}
                  {r.measured.flowLps < INSTRUMENT.minInformativeFlowLps && <p className="pl-hint">Below {INSTRUMENT.minInformativeFlowLps} L/s, the sections cannot be told apart from instrument error.</p>}
                </section>
              );
            })}

            {state.readings.length >= 2 && (
              <div className="pl-compare">
                <h3>Compare two readings</h3>
                <div className="pl-inline">
                  <label>First<select value={cmpA} onChange={e => setCmpA(e.target.value)}><option value="">Choose…</option>{state.readings.map(r => <option key={r.id} value={r.id}>{r.id}</option>)}</select></label>
                  <label>Second<select value={cmpB} onChange={e => setCmpB(e.target.value)}><option value="">Choose…</option>{state.readings.map(r => <option key={r.id} value={r.id}>{r.id}</option>)}</select></label>
                  <button type="button" className="pl-btn pl-btn-small" disabled={!cmpA || !cmpB || state.completed !== null} onClick={() => act({ type: 'compare', a: cmpA, b: cmpB })}>Compare</button>
                </div>
              </div>
            )}
            {state.comparisons.map(c => <ul key={c.id} className="pl-statements">{c.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>)}
            {state.teardowns.length > 0 && (
              <div>
                <h3>Parts you opened</h3>
                <ul className="pl-statements">{state.teardowns.map((t, i) => <li key={i}><strong>{PARTS[t.part].label}</strong> ({t.epoch === 0 ? 'before repair' : 'after repair'}): {t.text}</li>)}</ul>
              </div>
            )}
          </article>

          <article className="pl-card" aria-labelledby="pl-explain">
            <h2 id="pl-explain" className="pl-h2"><CircleHelp aria-hidden="true" size={18} /> 5. Explain the cause</h2>
            <fieldset className="pl-fieldset" disabled={state.completed !== null || state.epoch > 0}>
              <legend>What is limiting the flow?</legend>
              {CAUSE_IDS.map(id => (
                <label key={id} className="pl-radio"><input type="radio" name="cause" value={id} checked={cause === id} onChange={() => setCause(id)} /> <span><strong>{CAUSES[id].label}.</strong> {CAUSES[id].claim}</span></label>
              ))}
            </fieldset>
            <fieldset className="pl-fieldset" disabled={state.completed !== null || state.epoch > 0}>
              <legend>Which of your comparisons show it? (up to {MAX.evidencePerExplanation})</legend>
              {state.inspections.length === 0 && <p className="pl-hint">Compare a section with the datasheet in step 4 first.</p>}
              {state.inspections.map(i => (
                <label key={i.id} className="pl-radio"><input type="checkbox" checked={evidence.includes(i.id)} onChange={e => setEvidence(ev => e.target.checked ? [...ev, i.id] : ev.filter(x => x !== i.id))} /> <span>{statementText(i)}</span></label>
              ))}
            </fieldset>
            <label className="pl-block">Your reasoning, in a sentence or two (optional)
              <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={MAX.noteChars} rows={3} />
            </label>
            <button type="button" className="pl-btn" disabled={!cause || state.completed !== null || state.epoch > 0} onClick={() => { if (cause) act({ type: 'submit-explanation', cause, evidenceIds: evidence, note }); }}>Check my explanation</button>
            {lastExplanation && (
              <div className={`pl-feedback is-${lastExplanation.outcome}`} role="status">
                <h3>{lastExplanation.outcome === 'supported' ? 'Supported by your evidence' : lastExplanation.outcome === 'right-cause-weak-evidence' ? 'Right idea, evidence not shown yet' : 'Not supported by your readings'}</h3>
                {lastExplanation.feedback.map((l, i) => <p key={i}>{l}</p>)}
                <p className="pl-hint">Attempts so far: {state.explanations.length}.</p>
              </div>
            )}
          </article>

          <article className="pl-card" aria-labelledby="pl-repair">
            <h2 id="pl-repair" className="pl-h2"><Wrench aria-hidden="true" size={18} /> 6. Repair, then confirm</h2>
            <p>A repair changes a named state in this case. It is not a maintenance procedure. {spec.repair ? 'It becomes available once your explanation is supported.' : 'This case has no fault to repair; tune the settings instead.'}</p>
            <div className="pl-stack">
              {REPAIR_IDS.map((id: RepairId) => (
                <button key={id} type="button" className="pl-btn pl-btn-left" disabled={!supported || state.completed !== null || state.repairs.some(r => r.effective)} onClick={() => act({ type: 'apply-repair', repair: id })}>
                  <strong>{REPAIRS[id].label}</strong><span>{REPAIRS[id].effect}</span>
                </button>
              ))}
            </div>
            {state.epoch > 0 && <p className="pl-hint">Repaired. Predict again, take a new reading, and compare it with a reading from before the repair.</p>}
          </article>

          <article className="pl-card" aria-labelledby="pl-finish">
            <h2 id="pl-finish" className="pl-h2"><Check aria-hidden="true" size={18} /> 7. Finish and export</h2>
            <p>Finish when your latest reading meets the target flow and every limit.</p>
            <ul className="pl-checks">{a.checks.map(c => <li key={c.key} className={c.met ? 'is-met' : ''}><span aria-hidden="true">{c.met ? '✓' : '○'}</span> {c.label}<span className="pl-sr">{c.met ? ' — done' : ' — not yet'}</span></li>)}</ul>
            <button type="button" className="pl-btn" onClick={() => act({ type: 'complete-case' })} disabled={state.completed !== null}>Finish the case</button>
            <p className="pl-hint">Help used: {a.assistance === 'none' ? 'none' : a.assistance === 'hint' ? `hint ${a.hintLevelsUsed}` : 'worked comparison'}. This stays in your record.</p>
            <div className="pl-inline">
              <button type="button" className="pl-btn pl-btn-small" onClick={() => exportEvidence('text')}><Download aria-hidden="true" size={16} /> Observation report (.txt)</button>
              <button type="button" className="pl-btn pl-btn-small" onClick={() => exportEvidence('json')}><Download aria-hidden="true" size={16} /> Evidence item (.json)</button>
            </div>
            <p className="pl-hint">{buildReport(state).disclosure}</p>
          </article>

          <article className="pl-card" aria-labelledby="pl-help">
            <h2 id="pl-help" className="pl-h2"><CircleHelp aria-hidden="true" size={18} /> Need a hint?</h2>
            <p>Hints open one at a time and are recorded in your report.</p>
            {state.hints.map(h => <p key={h.level} className="pl-hintbox"><strong>Hint {h.level}{h.level === 3 ? ' (worked comparison)' : ''}.</strong> {spec.hints[h.level - 1]}</p>)}
            {state.hints.length < 3 && <button type="button" className="pl-btn pl-btn-small" disabled={state.completed !== null} onClick={() => act({ type: 'show-hint', level: (state.hints.length + 1) as 1 | 2 | 3 })}>Show hint {state.hints.length + 1} of 3</button>}
          </article>
        </section>
      </div>

      <section className="pl-lower" aria-label="Plots, datasheet and log">
        <div className="pl-plots"><CurvePlot state={state} /><ReadingsPlot state={state} /></div>

        <details className="pl-card">
          <summary>Datasheet for this circuit</summary>
          <p className="pl-hint">Illustrative figures for a teaching model, not a real pump. n is pump speed divided by {PUMP.ratedRpm} rpm. Q is flow in L/s. Heads are metres of water; {KPA_PER_M.toFixed(2)} kPa per metre.</p>
          <table className="pl-table">
            <tbody>
              <tr><th scope="row">Pump head (healthy)</th><td>n² × {PUMP.h0} − {PUMP.c} × Q²</td></tr>
              <tr><th scope="row">Suction loss (clean strainer)</th><td>{CIRCUIT.kIn} × Q²</td></tr>
              <tr><th scope="row">Delivery pipe loss</th><td>{CIRCUIT.kPipe} × Q²</td></tr>
              <tr><th scope="row">Valve loss</th><td>{CIRCUIT.kValve0} × Q² ÷ x², x = handle opening as a fraction</td></tr>
              <tr><th scope="row">Valve loss factor at 100 / 75 / 50 / 25 %</th><td>{[100, 75, 50, 25].map(p => valveK(p).toFixed(3)).join(' / ')}</td></tr>
              <tr><th scope="row">Lift between the tank surfaces</th><td>{CIRCUIT.destBaseM} m + destination level − source level</td></tr>
              <tr><th scope="row">Suction margin</th><td>{NPSH_ATM_HEAD_M.toFixed(2)} m + head at the suction gauge − n² × ({PUMP.npshA} + {PUMP.npshB} × (Q ÷ n)²)</td></tr>
              <tr><th scope="row">Motor shaft power</th><td>n³ × ({PUMP.p0} + {PUMP.p1} × Q ÷ n) kW</td></tr>
              <tr><th scope="row">Limits</th><td>{LIMITS.targetFlowLps} L/s target; discharge ≤ {LIMITS.maxDischargeKpa} kPa; motor ≤ {LIMITS.motorRatedKw} kW; suction margin ≥ {LIMITS.minNpshMarginM} m</td></tr>
              <tr><th scope="row">Instrument error</th><td>flow ±{INSTRUMENT.flowRelNoise * 100}% and 0.1 L/s; pressure ±{INSTRUMENT.pressureNoiseKpa} kPa and 1 kPa display step; power ±{INSTRUMENT.powerNoiseKw} kW</td></tr>
            </tbody>
          </table>
        </details>

        <section className="pl-card" aria-labelledby="pl-log-h">
          <h2 id="pl-log-h" className="pl-h2">Event log</h2>
          <p className="pl-hint">“You” lines are your actions. “Simulated” lines come from the model. Seed {state.seed}; the same actions give the same readings.</p>
          <ol className="pl-log" role="log" aria-live="off">
            {lastN.length === 0 && <li>Nothing yet.</li>}
            {lastN.map(l => <li key={l.seq}><strong>{l.kind === 'learner' ? 'You' : 'Simulated'}:</strong> {l.text}</li>)}
          </ol>
        </section>

        <section className="pl-card" aria-labelledby="pl-reset-h">
          <h2 id="pl-reset-h" className="pl-h2"><RotateCcw aria-hidden="true" size={18} /> Start over</h2>
          {!confirmReset
            ? <button type="button" className="pl-btn pl-btn-small" onClick={() => setConfirmReset(true)} disabled={state.actions.length === 0}>Reset this case</button>
            : <div className="pl-inline"><p>This returns the case, tanks, readings and hints to the start.</p><button type="button" className="pl-btn pl-btn-small" onClick={doReset}>Yes, reset</button><button type="button" className="pl-btn pl-btn-small" onClick={() => setConfirmReset(false)}>Keep my work</button></div>}
          {pastRuns.length > 0 && <ul className="pl-statements">{pastRuns.map((p, i) => <li key={i}>{CASES[p.caseId].title}: {p.finished ? 'finished' : 'not finished'}, {p.readings} readings, help: {p.assistance}.</li>)}</ul>}
        </section>
      </section>
    </main>
  );
}

