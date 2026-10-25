import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  ACTION_VERSION, DEFAULT_ORDER, LOADS, LOAD_IDS, REFERENCES, SCENARIOS,
  compareAttempts, newAction, runAttempt, validateOptionalLessonAssociation
} from './model.mjs';
import './campus.css';

type LoadId = 'study' | 'connect' | 'teach' | 'leisure';
type ScenarioId = 'baseline' | 'cloud';
type PredictionId = LoadId | 'none';
type EnergyLoad = { id: LoadId; demandKwh: number; servedKwh: number; unmetKwh: number; solarKwh: number; gridKwh: number; batteryKwh: number; status: 'supplied' | 'partial' | 'unmet' };
type Hour = { hour: number; gridOnline: boolean; beginningKwh: number; endingKwh: number; demandKwh: number; servedKwh: number; unmetKwh: number; solarKwh: number; solarToLoadKwh: number; solarToBatteryKwh: number; curtailedKwh: number; gridToLoadKwh: number; batteryToLoadKwh: number; batteryWithdrawnKwh: number; batteryStoredKwh: number; batteryLossKwh: number; loads: EnergyLoad[] };
type Attempt = import('./model.mjs').Attempt;
export type CampusResilienceLabProps = {
  /** Metadata-only optional parent association; never authenticates a lesson. */
  lessonAssociation?: { contractVersion: 1; lessonId: string; sourceId: string; revision: string; reviewed: true } | null
};
const one = (n: number) => n.toFixed(1);
const loadLabel = (id: string) => LOADS.find(x => x.id === id)?.label ?? id;
const tint = (status?: string) => status === 'supplied' ? '#69e9b2' : status === 'partial' ? '#ffcf77' : status === 'unmet' ? '#ff9096' : '#9fb3ca';
const layout = [
  { id: 'study', x: 189, y: 120, roof: true, short: 'STUDY HALL' },
  { id: 'connect', x: 648, y: 120, roof: false, short: 'CONNECTIVITY' },
  { id: 'teach', x: 189, y: 298, roof: true, short: 'CLASSROOMS' },
  { id: 'leisure', x: 648, y: 298, roof: false, short: 'RECREATION' }
] as const;

function CampusScene({ step, reduced }: { step?: Hour; reduced: boolean }) {
  const id = useId().replaceAll(':', '');
  const flows = step ? step.loads : [];
  const isLive = (n: number) => n > 1e-8;
  const overall = step ? `Hour ${step.hour}: ${one(step.servedKwh)} of ${one(step.demandKwh)} kWh supplied; ${one(step.unmetKwh)} kWh unmet. Battery ${one(step.endingKwh)} kWh.` : 'Prepared fictional campus before simulation; no results have been generated.';
  return (
    <div className={`crl-scene ${reduced ? 'crl-still' : ''}`}>
      <svg viewBox="0 0 840 458" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={overall} className="crl-world">
        <defs>
          <linearGradient id={id + '-ground'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#173e50"/><stop offset="1" stopColor="#10253c"/></linearGradient>
          <linearGradient id={id + '-roof'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#b5cbda"/><stop offset="1" stopColor="#658eaa"/></linearGradient>
          <linearGradient id={id + '-front'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#496a82"/><stop offset="1" stopColor="#263d59"/></linearGradient>
          <filter id={id + '-shadow'} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
        </defs>
        <ellipse cx="420" cy="246" rx="340" ry="177" fill="#001423" opacity=".55" filter={`url(#${id}-shadow)`}/>
        <path d="M420 52 810 243 420 434 30 243Z" fill={`url(#${id}-ground)`} stroke="#547c90" strokeWidth="2"/>
        <path d="M420 70 785 243 420 416 55 243Z" fill="none" stroke="#9ed7d2" strokeOpacity=".12" strokeWidth="2" strokeDasharray="5 8"/>
        <g fill="none" stroke="#23465f" strokeWidth="13" opacity=".8">
          <path d="M420 93 420 385"/><path d="M110 242 730 242"/>
        </g>
        {layout.map(point => {
          const record = flows.find(x => x.id === point.id);
          const color = tint(record?.status);
          const served = record?.servedKwh ?? 0;
          return <g key={point.id}>
            <path d={`M420 225 Q${(420 + point.x) / 2} ${(225 + point.y) / 2 + 38} ${point.x} ${point.y + 42}`}
              fill="none" stroke="#45647b" strokeWidth="9" strokeLinecap="round"/>
            <path d={`M420 225 Q${(420 + point.x) / 2} ${(225 + point.y) / 2 + 38} ${point.x} ${point.y + 42}`}
              fill="none" stroke={color} strokeWidth={step && isLive(served) ? Math.min(7, 2 + served / 3) : 1.5}
              opacity={step && isLive(served) ? 0.98 : 0.27}
              className={step && isLive(served) ? 'crl-flow-line' : ''} strokeDasharray={step && isLive(served) ? '10 8' : undefined}/>
          </g>;
        })}
        <g>
          <path d="M420 225 420 109" fill="none" stroke="#44667e" strokeWidth="9"/>
          <path d="M420 225 420 109" fill="none" stroke={step && isLive(step.gridToLoadKwh) ? '#94cfff' : '#9eb5c8'}
            opacity={step && isLive(step.gridToLoadKwh) ? 1 : 0.3} strokeWidth="4" strokeDasharray="9 7"
            className={step && isLive(step.gridToLoadKwh) ? 'crl-flow-line' : ''}/>
          <path d="M420 225 344 184" fill="none" stroke={step && isLive(step.solarToLoadKwh + step.solarToBatteryKwh) ? '#ffcf77' : '#9eb5c8'}
            strokeWidth="6" opacity={step && isLive(step.solarToLoadKwh + step.solarToBatteryKwh) ? 1 : .32}
            strokeDasharray="9 7" className={step && isLive(step.solarToLoadKwh + step.solarToBatteryKwh) ? 'crl-flow-line' : ''}/>
          <path d="M420 225 508 334" fill="none" stroke={step && isLive(step.batteryToLoadKwh + step.solarToBatteryKwh) ? '#c6aaff' : '#9eb5c8'}
            strokeWidth="6" opacity={step && isLive(step.batteryToLoadKwh + step.solarToBatteryKwh) ? 1 : .32}
            strokeDasharray="9 7" className={step && isLive(step.batteryToLoadKwh + step.solarToBatteryKwh) ? 'crl-flow-line' : ''}/>
        </g>
        <g><rect x="392" y="65" width="56" height="34" rx="9" fill="#375873" stroke="#9aceff"/><text x="420" y="87" textAnchor="middle" className="crl-svg-small">GRID</text></g>
        <g transform="translate(315 144)"><path d="M0 25 34 4 72 22 36 44Z" fill="#245b7c" stroke="#a9eaf6" strokeWidth="3"/><path d="M16 16 51 33 M32 7 67 25" stroke="#9dd8fa" strokeWidth="2"/><text x="35" y="62" textAnchor="middle" className="crl-svg-small">SOLAR</text></g>
        <g transform="translate(468 326)"><path d="M0 13 40 -5 77 13 37 33Z" fill="#6471a9" stroke="#b7bafa" strokeWidth="2"/><path d="M0 13 37 33 37 73 0 52Z" fill="#394970"/><path d="M37 33 77 13 77 51 37 73Z" fill="#28375c"/><text x="38" y="50" textAnchor="middle" className="crl-svg-small">BATTERY</text></g>
        {layout.map(point => {
          const load = flows.find(x => x.id === point.id);
          const color = tint(load?.status);
          const {x,y} = point;
          return <g key={point.id}>
            <ellipse cx={x} cy={y + 50} rx="83" ry="32" fill="#030e19" opacity=".45"/>
            <path d={`M${x-74} ${y} ${x} ${y+38} ${x} ${y+91} ${x-74} ${y+51}Z`} fill={`url(#${id}-front)`} stroke="#8aa9bc"/>
            <path d={`M${x} ${y+38} ${x+74} ${y} ${x+74} ${y+51} ${x} ${y+91}Z`} fill="#203a55" stroke="#7396ac"/>
            <path d={`M${x-74} ${y} ${x} ${y-41} ${x+74} ${y} ${x} ${y+38}Z`} fill={`url(#${id}-roof)`} stroke={color} strokeWidth="3"/>
            {point.roof && <g stroke="#437a95" strokeWidth="2" fill="#295f88" opacity=".95">
              <path d={`M${x-38} ${y-1} ${x} ${y-22} ${x+36} ${y-1} ${x-1} ${y+19}Z`}/>
              <path d={`M${x-20} ${y-10} ${x+18} ${y+10} M${x} ${y-20} ${x+37} ${y} `}/>
            </g>}
            <g fill={color} opacity={load?.status === 'unmet' ? .23 : .94}>
              <path d={`M${x-61} ${y+25} l20 10 v17 l-20 -10Z`}/>
              <path d={`M${x+39} ${y+35} l20 -11 v18 l-20 11Z`}/>
            </g>
            <rect x={x-75} y={y+87} width="150" height="29" rx="9" fill="#09263d" stroke={color} strokeWidth="1.5"/>
            <text x={x} y={y+106} textAnchor="middle" className="crl-svg-small">{point.short}</text>
            {load && <text x={x} y={y+133} textAnchor="middle" className="crl-svg-tiny">{one(load.servedKwh)} / {one(load.demandKwh)} kWh</text>}
          </g>;
        })}
        <g><circle cx="420" cy="225" r="27" fill="#164863" stroke="#a6eddb" strokeWidth="3"/>
          <circle cx="420" cy="225" r="15" fill="#55dbba" opacity={step ? .85 : .35}/>
          <text x="420" y="229" textAnchor="middle" fill="#071f32" fontSize="11" fontWeight="900">HUB</text></g>
      </svg>
      <div className="crl-legend" aria-hidden="true"><span><i className="crl-dot crl-green"/>Fully supplied</span><span><i className="crl-dot crl-amber"/>Partly supplied</span><span><i className="crl-dot crl-red"/>Unmet</span></div>
    </div>
  );
}
function ChargeGauge({ value, max }: { value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.max(0, Math.min(100, 100 * value / max));
  return <div className="crl-gauge">
    <div className="crl-gauge-head"><span>Battery stored energy</span><strong>{one(value)} <small>/ {one(max)} kWh</small></strong></div>
    <div className="crl-gauge-track" role="progressbar" aria-label="Battery stored energy" aria-valuemin={0} aria-valuemax={max} aria-valuenow={Number(one(value))}><div style={{ width: pct + '%' }}/></div>
    <small>{Math.round(pct)}% of teaching-model capacity</small>
  </div>;
}
function EnergyFlow({ step }: { step: Hour }) {
  const cells = [
    { label: 'Solar to loads', value: step.solarToLoadKwh, kind: 'solar' },
    { label: 'Grid to loads', value: step.gridToLoadKwh, kind: 'grid' },
    { label: 'Battery to loads', value: step.batteryToLoadKwh, kind: 'battery' }
  ];
  return <div className="crl-flow">
    {cells.map(item => <div key={item.kind} className={`crl-flow-cell crl-${item.kind}`}>
      <span>{item.label}</span><strong>{one(item.value)} kWh</strong><div className="crl-flow-track"><i style={{width: (step.servedKwh ? item.value / step.servedKwh * 100 : 0) + '%'}}/></div>
    </div>)}
    <div className="crl-flow-cell crl-load"><span>Total supplied</span><strong>{one(step.servedKwh)} kWh</strong><small>Unmet {one(step.unmetKwh)} kWh</small></div>
  </div>;
}
export default function CampusResilienceLab({ lessonAssociation = null }: CampusResilienceLabProps) {
  const [round, setRound] = useState<1 | 2>(1);
  const [phase, setPhase] = useState<'prepare' | 'inspect' | 'compare'>('prepare');
  const [priority, setPriority] = useState<LoadId[]>([...DEFAULT_ORDER] as LoadId[]);
  const [prediction, setPrediction] = useState<PredictionId>('none');
  const [chosen, setChosen] = useState(0);
  const [first, setFirst] = useState<Attempt | null>(null);
  const [second, setSecond] = useState<Attempt | null>(null);
  const [note, setNote] = useState('');
  const [reduceChoice, setReduceChoice] = useState(false);
  const [reducedOS, setReducedOS] = useState(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const scenarioId: ScenarioId = round === 1 ? 'baseline' : 'cloud';
  const scenario = SCENARIOS[scenarioId];
  const attempt = round === 1 ? first : second;
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReducedOS(query.matches);
    change(); query.addEventListener?.('change', change);
    return () => query.removeEventListener?.('change', change);
  }, []);
  useEffect(() => {
    if (phase !== 'prepare') resultHeading.current?.focus();
  }, [phase, round]);
  let associated = false;
  try { associated = Boolean(validateOptionalLessonAssociation(lessonAssociation)); } catch { associated = false; }
  const reduced = reducedOS || reduceChoice;
  const step = phase !== 'prepare' ? attempt?.steps[chosen] : undefined;
  function move(id: LoadId, offset: number) {
    setPriority(prev => {
      const index = prev.indexOf(id), target = index + offset;
      if (target < 0 || target >= prev.length) return prev;
      const result = [...prev];
      [result[index], result[target]] = [result[target], result[index]];
      return result;
    });
    setNote('');
  }
  function run() {
    try {
      const action = newAction(scenarioId, priority, prediction);
      // All computation is completed synchronously by the validated pure model.
      const result = runAttempt(action);
      if (round === 1) setFirst(result); else setSecond(result);
      setChosen(0);
      setPhase('inspect');
      setNote('Simulation complete. Choose any hour to inspect exact modeled flows.');
    } catch {
      setNote('The prepared model rejected this selection. Recheck the priorities and try again.');
    }
  }
  function beginRound2() {
    if (!first) return;
    setRound(2); setPhase('prepare'); setPrediction('none'); setChosen(0);
    setNote('Cloud cover reduces solar energy. You can reorder services before your next run.');
  }
  function showComparison() {
    if (!first || !second) return;
    try { compareAttempts(first, second); setPhase('compare'); setNote('Both attempts replayed against their own prepared scenario versions.'); }
    catch { setNote('A local attempt failed replay validation. Restart the activity.'); }
  }
  function restart() {
    setFirst(null); setSecond(null); setRound(1); setPhase('prepare'); setPriority([...DEFAULT_ORDER] as LoadId[]);
    setPrediction('none'); setChosen(0); setNote('New local activity; previous attempts were not saved.');
  }
  const comparison = phase === 'compare' && first && second ? compareAttempts(first, second) : null;
  return <main className="crl-app">
    <header className="crl-top">
      <div><span className="crl-kicker">KAIRO ACCESS <b> / </b> INTERACTIVE LAB 01</span><h1>Campus Resilience <em>Lab</em></h1>
        <p>One fictional campus. Six hours. Limited energy. Your choices shape which learners stay connected.</p></div>
      <div className="crl-top-aside"><span className="crl-chip">LOCAL · UNVERIFIED</span><span className="crl-chip">EDUCATIONAL MODEL v1</span>
        <label className="crl-motion"><input type="checkbox" checked={reduceChoice} onChange={e => setReduceChoice(e.target.checked)}/> Reduce motion</label></div>
    </header>
    <nav className="crl-steps" aria-label="Learning sequence">
      <span className={phase === 'prepare' ? 'crl-current' : ''}>01 · Review + predict</span>
      <span className={phase === 'inspect' ? 'crl-current' : ''}>02 · Run + inspect</span>
      <span className={phase === 'compare' ? 'crl-current' : ''}>03 · Compare + explain</span>
    </nav>
    <section className="crl-concept" aria-label="Reviewed concept and assumptions">
      <div><span className="crl-overline">THE BIG IDEA</span><p>Power (kW) describes a rate. Energy (kWh) is power multiplied by hours. A battery can only deliver the energy it has stored, within modeled rate and efficiency limits.</p></div>
      <div className="crl-concept-source"><strong>Principle grounded in NREL battery modeling.</strong><a href={REFERENCES[0].url} target="_blank" rel="noreferrer">Read NREL's battery modeling overview</a><small>Hourly dispatch order, all campus values and solar profiles are fictional teaching assumptions—not validated electrical designs.</small></div>
    </section>
    <div className="crl-main-grid">
      <section className="crl-visual" aria-label="Campus simulation visual">
        <div className="crl-section-top"><div><span className="crl-overline">LIVE MODEL VIEW</span><h2>{scenario.name}</h2></div><span className="crl-model-tag">{phase === 'prepare' ? 'PRE-RUN FORECAST' : `HOUR ${chosen + 1} / 6`}</span></div>
        <CampusScene step={step} reduced={reduced}/>
        <div className="crl-timeline" aria-label="Six-hour timeline">
          {Array.from({length: 6}, (_, index) => <button key={index} type="button" disabled={phase === 'prepare'}
            aria-pressed={chosen === index && phase !== 'prepare'} onClick={() => setChosen(index)}>
            <span>{String(index + 1).padStart(2, '0')}</span><small>{scenario.grid[index] ? 'GRID ON' : 'OUTAGE'}</small>
          </button>)}
        </div>
        <div className="crl-visual-footer">{step ? <ChargeGauge value={step.endingKwh} max={scenario.battery.capacityKwh}/> : <ChargeGauge value={scenario.battery.initialKwh} max={scenario.battery.capacityKwh}/>}
          <p>{step ? `Hour ${step.hour}: ${one(step.servedKwh)} kWh delivered, ${one(step.unmetKwh)} kWh unmet. Solar ${one(step.solarKwh)} kWh; battery losses ${one(step.batteryLossKwh)} kWh.` : 'The map is a prepared illustration. Energy pathways display measured model output only after you run a simulation.'}</p>
        </div>
      </section>
      <section className="crl-console" aria-label="Learner controls and simulation results">
        {phase === 'prepare' ? <>
          <span className="crl-overline">YOUR DECISION / ROUND {round}</span>
          <h2>Who gets energy first?</h2>
          <p>{scenario.teachingNote} Arrange the four service groups in the order they should receive energy whenever supply is limited.</p>
          <div className="crl-stat-strip"><div><small>INITIAL BATTERY</small><strong>{one(scenario.battery.initialKwh)} <span>kWh</span></strong></div><div><small>PEAK DEMAND</small><strong>22.0 <span>kW</span></strong></div><div><small>POWER INTERRUPTION</small><strong>4 <span>hours</span></strong></div></div>
          <fieldset className="crl-priorities"><legend>Choose service priority (top receives energy first)</legend>
            {priority.map((id, index) => {
              const load = LOADS.find(x => x.id === id)!;
              return <div className="crl-priority" key={id}><b className="crl-rank">{index + 1}</b><div><strong>{load.label}</strong><small>{one(load.kw)} kW · {load.description}</small></div>
                <div className="crl-priority-buttons"><button type="button" disabled={index === 0} onClick={() => move(id, -1)} aria-label={`Move ${load.label} earlier in priority`}>↑</button>
                  <button type="button" disabled={index === priority.length - 1} onClick={() => move(id, 1)} aria-label={`Move ${load.label} later in priority`}>↓</button></div></div>;
            })}
          </fieldset>
          <label className="crl-prediction"><strong>Predict before you simulate</strong><span>Which service group, if any, stays fully supplied in every outage hour?</span>
            <select value={prediction} onChange={e => setPrediction(e.target.value as PredictionId)}>
              <option value="none">None of the four</option>{LOAD_IDS.map(id => <option key={id} value={id}>{loadLabel(id)}</option>)}
            </select>
          </label>
          <button className="crl-primary" type="button" onClick={run}>Confirm choices &amp; run six hours <span aria-hidden="true">↗</span></button>
          <small className="crl-disclaimer">Local attempt only. No KAIRO score, cloud save, authenticated source association or verified learning evidence.</small>
        </> : <>
          <span className="crl-overline">SIMULATION RESULTS · ROUND {round}</span>
          <h2 ref={resultHeading} tabIndex={-1}>{phase === 'compare' ? 'Your two decisions, compared' : 'See what your decision changed'}</h2>
          {attempt && <><div className="crl-stat-strip"><div><small>DEMAND SERVED</small><strong>{one(attempt.totals.servedKwh)} <span>kWh</span></strong></div><div><small>UNMET DEMAND</small><strong>{one(attempt.totals.unmetKwh)} <span>kWh</span></strong></div><div><small>BATTERY END</small><strong>{one(attempt.endingKwh)} <span>kWh</span></strong></div></div>
            <p className="crl-answer">{attempt.predictionCorrect ? 'Prediction supported by these modeled results.' : 'Your prediction did not match every outage hour.'} {attempt.sustained.length ? 'Fully supplied throughout outage: ' + attempt.sustained.map(loadLabel).join(', ') + '.' : 'No service group remained fully supplied throughout every outage hour.'}</p>
          </>}
          {step && <><h3>Hour {step.hour}: exact energy flow</h3><EnergyFlow step={step}/><p className="crl-insight">{step.gridOnline ? 'The fictional grid is available this hour. ' : 'The fictional grid is unavailable this hour. '}{one(step.solarToBatteryKwh)} kWh solar charged the battery; {one(step.curtailedKwh)} kWh solar was curtailed. Battery delivered {one(step.batteryToLoadKwh)} kWh and used {one(step.batteryWithdrawnKwh)} kWh of stored energy.</p></>}
          <div className="crl-controls">
            {round === 1 && phase === 'inspect' && <button className="crl-primary" type="button" onClick={beginRound2}>Continue to cloud-cover challenge →</button>}
            {round === 2 && phase === 'inspect' && <button className="crl-primary" type="button" onClick={showComparison}>Compare both attempts →</button>}
            <button className="crl-secondary" type="button" onClick={restart}>Restart learning challenge</button>
          </div>
        </>}
        <div className="crl-status" aria-live="polite">{note}</div>
        {associated && <p className="crl-disclaimer">Optional parent-provided reference metadata detected but NOT authenticated or accepted as source evidence. A coordinator must approve integration.</p>}
      </section>
    </div>
    {attempt && phase !== 'prepare' && <section className="crl-data"><div className="crl-section-top"><div><span className="crl-overline">CHECK THE MATHEMATICS</span><h2>Six-hour energy ledger</h2></div><span className="crl-model-tag">VALUES IN kWh · 1h steps</span></div>
      <p>Every line accounts for solar used, grid contribution, battery output, unused solar and unserved demand. Select an hour above to see its buildings and flows.</p>
      <div className="crl-table-wrap"><table><caption>{scenario.name} — a local-unverified fictional scenario</caption>
        <thead><tr><th scope="col">Hour</th><th scope="col">Grid</th><th scope="col">Demand</th><th scope="col">Solar available</th><th scope="col">Solar to load</th><th scope="col">Grid used</th><th scope="col">Battery to load</th><th scope="col">To battery</th><th scope="col">Curtailed</th><th scope="col">Served</th><th scope="col">Unmet</th><th scope="col">Battery end</th></tr></thead>
        <tbody>{attempt.steps.map((s, i) => <tr key={i} className={chosen === i ? 'crl-row-highlight' : ''}><th scope="row">{s.hour}</th><td>{s.gridOnline ? 'On' : 'Off'}</td>
          {[s.demandKwh,s.solarKwh,s.solarToLoadKwh,s.gridToLoadKwh,s.batteryToLoadKwh,s.solarToBatteryKwh,s.curtailedKwh,s.servedKwh,s.unmetKwh,s.endingKwh].map((v, n) => <td key={n}>{one(v)}</td>)}</tr>)}</tbody></table></div>
      <h3>Service-level outcomes · hour {chosen + 1}</h3><div className="crl-table-wrap"><table><caption>Energy actually delivered to each service (kWh)</caption><thead><tr><th scope="col">Service</th><th scope="col">Requested</th><th scope="col">Supplied</th><th scope="col">Unmet</th><th scope="col">Status</th></tr></thead>
        <tbody>{attempt.steps[chosen].loads.map(service => <tr key={service.id}><th scope="row">{loadLabel(service.id)}</th><td>{one(service.demandKwh)}</td><td>{one(service.servedKwh)}</td><td>{one(service.unmetKwh)}</td><td>{service.status}</td></tr>)}</tbody></table></div>
      <p className="crl-ledger-note">Each hour: demand = delivered + unmet; solar + grid used + battery delivery = served + solar charging + curtailment; battery end = battery start + charging × 0.9 − delivered by battery ÷ 0.9. The model has no physical grid or equipment control.</p>
    </section>}
    {comparison && <section className="crl-comparison" aria-label="Side-by-side comparison of the two local attempts">
      <span className="crl-overline">THE CONSEQUENCE OF CHOICE</span><h2>Two skies. Two strategies. One campus.</h2>
      <div className="crl-compare-grid">{[comparison.round1,comparison.round2].map((a, index) => <article key={a.scenarioId} className="crl-compare-card">
        <span className="crl-overline">ROUND {index + 1}</span><h3>{SCENARIOS[a.scenarioId].name}</h3>
        <strong className="crl-large">{one(a.totals.servedKwh)} <small>kWh delivered</small></strong>
        <p>{one(a.totals.unmetKwh)} kWh unmet · {one(a.endingKwh)} kWh battery remaining.</p>
        <ol>{a.action.priority.map(id => <li key={id}>{loadLabel(id)}</li>)}</ol>
        {a.services.map(s => <div key={s.id} className="crl-compare-service"><span>{loadLabel(s.id)}: {Math.round(s.coveragePct)}% during outage</span><div className="crl-bar"><i style={{width: Math.min(100,Math.max(0,s.coveragePct)) + '%'}}/></div></div>)}
      </article>)}</div>
      <p className="crl-conclusion">Across the complete six hours, round two delivered {one(Math.abs(comparison.servedDeltaKwh))} kWh {comparison.servedDeltaKwh < 0 ? 'less' : 'more or equal'} than round one. Priorities decide <strong>who receives energy first</strong>; the sky changes <strong>how much energy exists</strong>. These are teaching-model comparisons, not safe real-world operating plans.</p>
      <button className="crl-secondary" type="button" onClick={restart}>Run another local learning challenge ↺</button>
    </section>}
    <footer className="crl-footer"><p><strong>Model boundary.</strong> Fictional South African university campus. Solar, loads, dispatch policy, efficiencies (90% each way), 28 kWh battery and all hourly values are invented teaching assumptions. No protection, wiring, hardware design or live system integration. No model-generated scenario from uploads.</p><p>References: {REFERENCES.map((ref,i) => <span key={ref.url}>{i > 0 ? ' · ' : ''}<a href={ref.url} target="_blank" rel="noreferrer">{ref.title}</a></span>)}. Prepared material is KAIRO-authored; links are for underlying principles, not numerical verification.</p></footer>
  </main>;
}
