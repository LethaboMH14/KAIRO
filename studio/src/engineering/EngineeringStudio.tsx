import StudioLessonPlan from '../studio-teaching-host/StudioLessonPlan';
import StudioCompanion from '../learning-flow/StudioCompanion';

import {learnerStorage} from '../account/storage.ts';
import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowLeft, Box, Check, Crosshair, Eye, EyeOff, Layers3, Pause, Play, RotateCcw, SkipForward, Square, Volume2, X } from 'lucide-react';
import { FREQUENCY_LIMITS, readNumber, SUPPORTED_POLES, synchronousSpeed } from './fieldMath';
import {
  CUTAWAY_NOTE, EXPERIMENT_READOUT, FAULT_QUIZ, FIELD_CHECK, MODE_CAPTION, MOTION_LABEL, OPERATE_NOTES, PART_BY_ID, PARTS, SOURCES,
  STATIONARY_QUIZ, SUPPLY_BY_ID, SUPPLY_CHOICES, SUPPLY_GROUPS, type Mode, type PartId,
} from './motorContent';
import { ASSEMBLED_TOLERANCE, CAMERA_PRESETS, GEOMETRY, type CameraCommand, type DemoClock, type PresetId } from './motorModel';
import MotorDiagram from './MotorDiagram';
import PhasePlot from './PhasePlot';
import SupplyExperiment from './SupplyExperiment';
import './engineering.css';
import {useTeacher} from '../teacher/TeacherProvider';
import EngineeringTeacher from './EngineeringTeacher';
import {engineeringExplanation,type TeachingIntent} from './teaching';

const MotorScene = lazy(() => import('./MotorScene'));

export type EngineeringStudioProps = { onExit: () => void };

const MODES: { id: Mode; label: string }[] = [
  { id: 'inspect', label: 'Inspect' },
  { id: 'explode', label: 'Explode' },
  { id: 'operate', label: 'Operate' },
];
const PROGRESS_KEY = 'kairo-engineering-progress';
const NUMBER = new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 2 });
const STEP_SECONDS = 1 / 6; // a twelfth of the demonstration's electrical cycle

type Progress = { stationary?: boolean; fieldSpeed?: boolean; singlePhase?: boolean };
type CameraRequest = { kind: 'preset'; preset: PresetId } | { kind: 'focus'; part: PartId };

function loadProgress(): Progress {
  try {
    const value = JSON.parse(learnerStorage.getItem(PROGRESS_KEY) ?? '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Progress) {
  try { learnerStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); return true; } catch { return false; }
}

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function EngineeringStudio({ onExit }: EngineeringStudioProps) {
  const teacher = useTeacher();
  const stopRef = useRef(teacher.stop); stopRef.current = teacher.stop;
  const [teachingIntent, setTeachingIntent] = useState<TeachingIntent>('next');
  const returnLessonId = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('lesson') ?? undefined : undefined;
  const [selected, setSelected] = useState<PartId | null>(null);
  const [hovered, setHovered] = useState<PartId | null>(null);
  const [mode, setMode] = useState<Mode>('inspect');
  const [cutaway, setCutaway] = useState(false);
  const [explode, setExplode] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [tick, setTick] = useState(0);
  const [reduced, setReduced] = useState(prefersReducedMotion);
  const [hasWebgl] = useState(webglAvailable);
  const [view2D, setView2D] = useState(() => !hasWebgl);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [camera, setCamera] = useState<CameraCommand>({ kind: 'preset', preset: 'three-quarter', nonce: 0 });
  const [caption, setCaption] = useState(MODE_CAPTION.inspect);
  const speaking = teacher.speaking;
  const [partsOpen, setPartsOpen] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [faultAnswer, setFaultAnswer] = useState<string | null>(null);
  const [supplyId, setSupplyId] = useState('normal');
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [saveFailed,setSaveFailed] = useState(false);
  const [frequency, setFrequency] = useState('50');
  const [poles, setPoles] = useState(4);
  const [checkText, setCheckText] = useState('');
  const [checkResult, setCheckResult] = useState<'correct' | 'wrong' | 'invalid' | null>(null);
  const clock = useRef<DemoClock>({ seconds: 0, playing: false });
  const nonce = useRef(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const root = useRef<HTMLDivElement>(null);

  const assembled = explode <= ASSEMBLED_TOLERANCE;
  const part = selected ? PART_BY_ID[selected] : null;
  const hiddenInside = Boolean(part?.inside && !cutaway && assembled && !view2D);
  const supplyChoice = SUPPLY_BY_ID[supplyId];

  useEffect(() => {
    const previous = document.title;
    document.title = 'KAIRO · Engineering Studio';
    return () => { document.title = previous; stopRef.current(); };
  }, []);

  // The app shell may draw its own bars above the studio. Their height is measured
  // so the desktop workbench, controls included, still fits on one screen.
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const measure = () => element.style.setProperty('--eng-above', `${Math.max(0, Math.round(element.getBoundingClientRect().top + window.scrollY))}px`);
    measure();
    // The new height resizes the body this observer watches, so measure on the next frame, outside its callback.
    let frame = 0;
    const observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); });
    observer.observe(document.body);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('resize', measure); };
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // One clock drives the 3D view, the drawing and the phase plot.
  useEffect(() => {
    clock.current.playing = playing;
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      clock.current.seconds += (Math.min(now - last, 100) / 1000) * speed;
      last = now;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed]);

  useEffect(() => {
    if (playing && !assembled) {
      setPlaying(false);
      setCaption(OPERATE_NOTES.paused);
    }
  }, [playing, assembled]);

  useEffect(() => { if (reduced) setPlaying(false); }, [reduced]);

  useEffect(() => {
    stopRef.current();
  }, [selected, mode, supplyId, frequency, poles, view2D, cutaway, explode]);

  const moveCamera = useCallback((request: CameraRequest) => {
    nonce.current += 1;
    setCamera({ ...request, nonce: nonce.current });
  }, []);

  const selectPart = useCallback((id: PartId) => {
    setSelected(id);
    const info = PART_BY_ID[id];
    setCaption(`${info.name}: ${info.role}`);
  }, []);
  const onReady = useCallback(() => setReady(true), []);
  const onSceneError = useCallback(() => {
    setSceneFailed(true);
    setView2D(true);
    setPlaying(false);
  }, []);

  function changeMode(next: Mode) {
    setMode(next);
    setCaption(MODE_CAPTION[next]);
    if (next === 'explode' && assembled) {
      setExplode(1);
      moveCamera({ kind: 'preset', preset: 'three-quarter' });
    }
    if (next === 'operate') {
      setCutaway(true);
      setCaption(assembled ? `${supplyChoice.caption} Cutaway on, so you can watch the rotor.` : OPERATE_NOTES.paused);
    }
  }

  // Every supply experiment restarts the demonstration from rest.
  function changeSupply(id: string) {
    setSupplyId(id);
    clock.current.seconds = 0;
    setTick(t => t + 1);
    setCaption(SUPPLY_BY_ID[id].caption);
  }

  // Tabs use manual activation: arrows move focus, Enter or Space activates. Changing
  // activity changes the model (explode, cutaway), so passing over a tab must not.
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: MODES.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    tabs.current[(keys[event.key] + MODES.length) % MODES.length]?.focus();
  }

  function setAssembly(target: number) {
    setExplode(target);
    setCaption(target > 0 ? MODE_CAPTION.explode : 'Reassembled. Every part is back in its working position.');
    moveCamera({ kind: 'preset', preset: 'three-quarter' });
  }

  function toggleCutaway() {
    const next = !cutaway;
    setCutaway(next);
    setCaption(next ? CUTAWAY_NOTE : 'Cutaway off. You are looking at the closed motor.');
  }

  function togglePlay() {
    if (!assembled) return;
    setPlaying(!playing);
    if (!playing) setCaption(supplyChoice.caption);
  }

  function stepForward() {
    if (!assembled) return;
    clock.current.seconds += STEP_SECONDS;
    setTick(t => t + 1);
  }

  function toggleView() {
    const next = !view2D;
    if (!next && sceneFailed) {
      setSceneFailed(false);
      setSceneKey(k => k + 1);
      setReady(false);
    }
    setView2D(next);
    setCaption(next ? 'Drawing view: the same parts as a section drawing. Select any shape.' : MODE_CAPTION[mode]);
  }

  function readAloud() {
    if (speaking) {
      teacher.stop();
      return;
    }
    const text = part ? `${part.name}. ${part.role} ${part.detail} ${part.fact}` : `${overviewTitle}. ${overviewText}`;
    teacher.say(text, 'en-ZA');
  }

  function answerQuiz(id: string) {
    setQuizAnswer(id);
    if (STATIONARY_QUIZ.options.find(o => o.id === id)?.correct) {
      const next = { ...progress, stationary: true };
      setProgress(next);
      setSaveFailed(!saveProgress(next));
    }
  }

  function answerFault(id: string) {
    setFaultAnswer(id);
    if (FAULT_QUIZ.options.find(o => o.id === id)?.correct) {
      const next = { ...progress, singlePhase: true };
      setProgress(next);
      setSaveFailed(!saveProgress(next));
    }
  }

  function checkFieldSpeed() {
    const value = readNumber(checkText);
    if (!Number.isFinite(value) || value <= 0) { setCheckResult('invalid'); return; }
    const expected = synchronousSpeed(FIELD_CHECK.frequencyHz, FIELD_CHECK.poles);
    const correct = expected.ok && Math.abs(value - expected.rpm) < 0.5;
    setCheckResult(correct ? 'correct' : 'wrong');
    if (correct) {
      const next = { ...progress, fieldSpeed: true };
      setProgress(next);
      setSaveFailed(!saveProgress(next));
    }
  }

  function onRootKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && selected) {
      setSelected(null);
      setCaption('Selection cleared.');
    }
  }

  const speed1 = synchronousSpeed(readNumber(frequency), poles);
  const quizChoice = STATIONARY_QUIZ.options.find(o => o.id === quizAnswer);
  const faultChoice = FAULT_QUIZ.options.find(o => o.id === faultAnswer);
  const expectedCheck = synchronousSpeed(FIELD_CHECK.frequencyHz, FIELD_CHECK.poles);
  const overviewTitle = 'Three-phase induction motor';
  const overviewText = 'This squirrel-cage motor is widely used to drive industrial machines because it is self-starting, reliable and economical. Select a part to see what it does, take the motor apart, or run it.';
  const speechAvailable = true; // Shared provider reports unavailable voices and consent requirements.
  const explanation = engineeringExplanation({selected, mode, supplyId, frequency, poles}, teachingIntent);
  const pct = Math.round(explode * 100);

  return <div ref={root} className={reduced ? 'engineering-studio is-reduced' : 'engineering-studio'} onKeyDown={onRootKey}>
    <header className="eng-header">
      <div className="eng-brand" aria-label="KAIRO Access"><span className="brand-symbol" aria-hidden="true">k</span><span className="eng-brand-name">KAIRO</span><span className="eng-brand-access">Access</span></div>
      <p className="eng-studio-name">Engineering Studio</p>
      <button type="button" className="eng-exit" onClick={onExit}><ArrowLeft size={16} aria-hidden="true" />Back to studios</button>
    </header>

    <main className="eng-main">
      <section className="eng-stage" aria-label="Motor workbench">
        <div className="eng-title">
          <h1>Inside an electric motor.</h1>
          <p>Inspect it, take it apart and watch it run.</p>
        </div>

        <nav className={partsOpen ? 'eng-parts is-open' : 'eng-parts'} aria-label="Motor parts">
          <button type="button" className="eng-parts-toggle" aria-expanded={partsOpen} aria-controls="eng-parts-list" onClick={() => setPartsOpen(!partsOpen)}>
            <Layers3 size={16} aria-hidden="true" />Parts list<span>{PARTS.length}</span>
          </button>
          <h2 className="eng-parts-heading">Parts</h2>
          <ol id="eng-parts-list">
            {PARTS.map(p => <li key={p.id}>
              <button
                type="button"
                aria-pressed={selected === p.id}
                onClick={() => selectPart(p.id)}
                onPointerEnter={() => setHovered(p.id)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(p.id)}
                onBlur={() => setHovered(null)}
              >
                <span className="eng-item" aria-hidden="true">{p.item}</span>
                <span className="eng-part-name">{p.name}</span>
                <span className={`eng-motion is-${p.motion}`}>{p.motion === 'rotates' ? 'turns' : p.motion === 'mixed' ? 'part turns' : 'still'}</span>
              </button>
            </li>)}
          </ol>
        </nav>

        <div className="eng-viewport">
          <div className="eng-view-tools">
            <button type="button" aria-pressed={cutaway} onClick={toggleCutaway} disabled={view2D}>
              {cutaway ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}{cutaway ? 'Hide cutaway' : 'Show inside'}
            </button>
            <button type="button" aria-pressed={view2D} onClick={toggleView} disabled={!hasWebgl && view2D}>
              <Box size={15} aria-hidden="true" />{view2D ? '3D view' : 'Drawing view'}
            </button>
          </div>
          <div className="eng-canvas" {...(view2D ? {} : { role: 'img', 'aria-label': `3D motor${cutaway ? ' with a quarter cut away' : ''}${pct ? `, ${pct}% exploded` : ''}${part ? `. ${part.name} selected` : ''}. Use the parts list to select parts.` })}>
            {view2D
              ? <MotorDiagram view={mode === 'operate' ? 'end' : 'side'} selected={selected} hovered={hovered} explode={explode} reduced={reduced} playing={playing} tick={tick} supply={supplyChoice.supply} clock={clock} onSelect={selectPart} onHover={setHovered} />
              : <SceneBoundary key={sceneKey} onError={onSceneError}>
                  <Suspense fallback={null}>
                    <MotorScene
                      selected={selected} hovered={hovered} cutaway={cutaway} explode={explode} reduced={reduced}
                      operating={mode === 'operate'} playing={playing} supply={supplyChoice.supply} tick={tick} clock={clock} camera={camera}
                      onSelect={selectPart} onHover={setHovered} onReady={onReady} onError={onSceneError}
                    />
                  </Suspense>
                </SceneBoundary>}
            {!view2D && !ready && <div className="eng-loading" role="status"><span aria-hidden="true" />Unpacking the motor…</div>}
          </div>
          {(sceneFailed || !hasWebgl) && view2D && <p className="eng-notice" role="status">
            {hasWebgl ? 'The 3D model could not load, so the drawing view is shown. Every part and activity still works here.' : 'This browser cannot show 3D graphics, so the drawing view is shown. Every part and activity still works here.'}
          </p>}
          {view2D && mode === 'operate' && <p className="eng-diagram-legend" aria-hidden="true">
            <span><b className="is-north">N</b><b className="is-south">S</b> Field poles</span>
            <span><i className="eng-symbol-out" />Current towards you</span>
            <span><i className="eng-symbol-in" />Current away</span>
            {supplyChoice.group === 'fault' && <span><i className="eng-symbol-none" />No current</span>}
          </p>}
          <div className="eng-caption" aria-live="polite">
            <span className="eng-guide-mark" aria-hidden="true">K</span>
            <p>{caption}</p>
          </div>
        </div>

        <aside className="eng-detail" aria-label="About the selected part">
          <StudioCompanion input={{studio:'motor',selectedLabel:selected?PART_BY_ID[selected].name:null,variables:{frequencyHz:readNumber(frequency),poles,supply:supplyId},nextStep:mode}}/>
          <details className="lf-task-sources"><summary>Prepared teaching steps and sources</summary><StudioLessonPlan studio="motor" onRead={text=>teacher.say(text,'en-ZA')} onStep={i=>{teacher.stop();if(i===0)selectPart('stator-windings');}}/></details>
          <details className="lf-task-sources"><summary>Detailed part reference and focus controls</summary><EngineeringTeacher explanation={explanation} returnLessonId={returnLessonId} speaking={teacher.speaking} paused={teacher.paused} status={teacher.status} onExplain={intent=>{teacher.stop();setTeachingIntent(intent);}} onRead={()=>teacher.say(explanation.text,'en-ZA')} onPause={teacher.pause} onStop={teacher.stop} onFocus={()=>{teacher.stop();if(explanation.focus)selectPart(explanation.focus);}}/></details>
          {mode === 'operate' && <section className="eng-operate-card" aria-labelledby="eng-operate-title">
            <h2 id="eng-operate-title">What you are watching</h2>
            <SupplyExperiment choice={supplyChoice} clock={clock} playing={playing} tick={tick} />
            <PhasePlot choice={supplyChoice} clock={clock} playing={playing} tick={tick} />
            <div className="eng-experiment-text">
              {supplyChoice.explanation.map(text => <p key={text}>{text}</p>)}
              <p className="eng-experiment-note">{EXPERIMENT_READOUT.note}</p>
            </div>
            <ul>
              <li><b className="is-north">N</b><b className="is-south">S</b>{OPERATE_NOTES.field}</li>
              <li><i className="eng-swatch-rotor" aria-hidden="true" />{OPERATE_NOTES.rotor}</li>
              <li><i className="eng-swatch-phase" aria-hidden="true" />The copper glows by phase as each current rises and falls.</li>
            </ul>
            {supplyChoice.group === 'normal' && <p>{OPERATE_NOTES.reverse} {OPERATE_NOTES.tryIt}</p>}
          </section>}
          {part ? <article className="eng-part-card">
            <p className="eng-part-meta"><span className="eng-item-badge">{part.item}</span>{MOTION_LABEL[part.motion]}</p>
            <h2>{part.name}</h2>
            <p className="eng-role">{part.role}</p>
            <p>{part.detail}</p>
            <p className="eng-fact">{part.fact}</p>
            {hiddenInside && <p className="eng-hint">It sits inside the motor. <button type="button" className="eng-link" onClick={toggleCutaway}>Show inside</button></p>}
            <div className="eng-card-actions">
              {!view2D && <button type="button" onClick={() => moveCamera({ kind: 'focus', part: part.id })}><Crosshair size={15} aria-hidden="true" />Focus on part</button>}
              {speechAvailable && <button type="button" onClick={readAloud} aria-pressed={speaking}>{speaking ? <Square size={14} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}{speaking ? 'Stop reading' : 'Read aloud'}</button>}
              <button type="button" onClick={() => { setSelected(null); setCaption('Selection cleared.'); }}><X size={15} aria-hidden="true" />Clear</button>
            </div>
          </article> : mode !== 'operate' && <article className="eng-part-card is-overview">
            <h2>{overviewTitle}</h2>
            <p>{overviewText}</p>
            <dl className="eng-spec">
              <div><dt>Poles</dt><dd>{GEOMETRY.machine.poles}</dd></div>
              <div><dt>Stator slots</dt><dd>{GEOMETRY.machine.statorSlots}</dd></div>
              <div><dt>Rotor bars</dt><dd>{GEOMETRY.machine.rotorBars}, skewed {GEOMETRY.machine.skewDeg}°</dd></div>
              <div><dt>Air gap</dt><dd>{NUMBER.format(GEOMETRY.machine.boreRadiusMm - GEOMETRY.machine.rotorRadiusMm)} mm</dd></div>
            </dl>
            {speechAvailable && <div className="eng-card-actions"><button type="button" onClick={readAloud} aria-pressed={speaking}>{speaking ? <Square size={14} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}{speaking ? 'Stop reading' : 'Read aloud'}</button></div>}
          </article>}
        </aside>

        <div className="eng-controls">
          <div role="tablist" aria-label="Activity" className="eng-tabs">
            {MODES.map((m, i) => <button
              key={m.id}
              ref={el => { tabs.current[i] = el; }}
              type="button"
              role="tab"
              id={`eng-tab-${m.id}`}
              aria-selected={mode === m.id}
              aria-controls="eng-activity-panel"
              tabIndex={mode === m.id ? 0 : -1}
              onClick={() => changeMode(m.id)}
              onKeyDown={event => onTabKey(event, i)}
            >{m.label}</button>)}
          </div>
          <div role="tabpanel" id="eng-activity-panel" aria-labelledby={`eng-tab-${mode}`} className="eng-panel">
            {mode === 'inspect' && <div className="eng-views" role="group" aria-label="Camera views">
              {(Object.keys(CAMERA_PRESETS) as PresetId[]).map(id => <button key={id} type="button" disabled={view2D} onClick={() => moveCamera({ kind: 'preset', preset: id })}>{CAMERA_PRESETS[id].label}</button>)}
              <button type="button" disabled={view2D} onClick={() => moveCamera({ kind: 'preset', preset: 'three-quarter' })}><RotateCcw size={14} aria-hidden="true" />Reset view</button>
            </div>}
            {mode === 'explode' && <div className="eng-explode">
              <label className="eng-range">
                <span>Exploded view</span>
                <input type="range" min={0} max={100} step={1} value={pct} aria-valuetext={`${pct} percent apart`} onChange={event => setExplode(Number(event.target.value) / 100)} />
                <output>{pct}%</output>
              </label>
              <button type="button" className="eng-primary" onClick={() => setAssembly(explode > 0.5 ? 0 : 1)}>{explode > 0.5 ? 'Reassemble' : 'Explode'}</button>
            </div>}
            {mode === 'operate' && <div className="eng-operate">
              {!assembled && <p className="eng-paused" role="status">{OPERATE_NOTES.paused}<button type="button" onClick={() => setAssembly(0)}>Reassemble</button></p>}
              <label className="eng-supply">
                <span>Supply</span>
                <select value={supplyId} onChange={event => changeSupply(event.target.value)}>
                  {SUPPLY_CHOICES.filter(c => c.group === 'normal').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  {(['reverse', 'fault'] as const).map(group => <optgroup key={group} label={SUPPLY_GROUPS[group]}>
                    {SUPPLY_CHOICES.filter(c => c.group === group).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </optgroup>)}
                </select>
              </label>
              <button type="button" className="eng-primary" onClick={togglePlay} disabled={!assembled} aria-pressed={playing}>
                {playing ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}{playing ? 'Pause' : 'Run'}
              </button>
              <button type="button" onClick={stepForward} disabled={!assembled}><SkipForward size={15} aria-hidden="true" />Step</button>
              <label className="eng-range">
                <span>Visual playback speed</span>
                <input type="range" min={0.25} max={2} step={0.25} value={speed} aria-valuetext={`${speed} times, not a motor speed`} onChange={event => setSpeed(Number(event.target.value))} />
                <output>{NUMBER.format(speed)}×</output>
              </label>
              <small>Slowed for watching. Not a motor speed.</small>
            </div>}
          </div>
          <label className="eng-switch">
            <input type="checkbox" checked={reduced} onChange={event => setReduced(event.target.checked)} />
            <span>Reduce motion</span>
          </label>
        </div>
      </section>

      <section className="eng-practise" aria-labelledby="eng-practise-title">
        <h2 id="eng-practise-title">Check your understanding</h2>
        <div className="eng-practise-grid">
          <div className="eng-quiz-stack">
            <fieldset className="eng-quiz">
              <legend>{STATIONARY_QUIZ.question}</legend>
              {STATIONARY_QUIZ.options.map(option => <label key={option.id} className={quizAnswer === option.id ? 'is-chosen' : undefined}>
                <input type="radio" name="eng-stationary" checked={quizAnswer === option.id} onChange={() => answerQuiz(option.id)} />
                {option.label}
              </label>)}
              {quizChoice && <p className={quizChoice.correct ? 'eng-feedback is-correct' : 'eng-feedback'} role="status">{quizChoice.feedback}</p>}
              {progress.stationary && <p className="eng-saved"><Check size={14} aria-hidden="true" />Answered correctly. {saveFailed?'Not saved: export your working before leaving.':'Saved in this learning space on this browser.'}</p>}
            </fieldset>
            <fieldset className="eng-quiz eng-fault-quiz">
              <legend>{FAULT_QUIZ.question}</legend>
              {FAULT_QUIZ.options.map(option => <label key={option.id} className={faultAnswer === option.id ? 'is-chosen' : undefined}>
                <input type="radio" name="eng-fault" checked={faultAnswer === option.id} onChange={() => answerFault(option.id)} />
                {option.label}
              </label>)}
              {faultChoice && <p className={faultChoice.correct ? 'eng-feedback is-correct' : 'eng-feedback'} role="status">{faultChoice.feedback}</p>}
              {progress.singlePhase && <p className="eng-saved"><Check size={14} aria-hidden="true" />Answered correctly. {saveFailed?'Not saved: export your working before leaving.':'Saved in this learning space on this browser.'}</p>}
            </fieldset>
          </div>

          <div className="eng-calc">
            <h3>How fast does the field turn?</h3>
            <p>The stator’s field turns at the synchronous speed <span className="eng-formula">n<sub>s</sub> = 120 f / p</span>, where f is the supply frequency in hertz and p is the total number of poles.</p>
            <div className="eng-calc-inputs">
              <label>
                <span>Supply frequency, f</span>
                <span className="eng-unit-input">
                  <input type="text" inputMode="decimal" value={frequency} onChange={event => setFrequency(event.target.value)} aria-invalid={!speed1.ok && speed1.field === 'frequency'} aria-describedby="eng-calc-result" />
                  <span>Hz</span>
                </span>
              </label>
              <fieldset>
                <legend>Number of poles, p</legend>
                <div className="eng-chips">
                  {SUPPORTED_POLES.map(p => <label key={p} className={poles === p ? 'is-chosen' : undefined}>
                    <input type="radio" name="eng-poles" checked={poles === p} onChange={() => setPoles(p)} />{p}
                  </label>)}
                </div>
              </fieldset>
            </div>
            <output id="eng-calc-result" className={speed1.ok ? 'eng-result' : 'eng-result is-error'} aria-live="polite">
              {speed1.ok
                ? <><span>n<sub>s</sub> = 120 × {NUMBER.format(speed1.frequencyHz)} ÷ {speed1.poles} = </span><strong>{NUMBER.format(speed1.rpm)} r/min</strong><small>{NUMBER.format(speed1.revPerSecond)} revolutions per second</small></>
                : speed1.message}
            </output>
            <p className="eng-note">This is the speed of the rotating field. The rotor turns a little slower, by an amount that depends on the load, so this does not predict a real shaft speed. Accepted range: {FREQUENCY_LIMITS.min} to {FREQUENCY_LIMITS.max} Hz.</p>
            <form className="eng-check" onSubmit={event => { event.preventDefault(); checkFieldSpeed(); }}>
              <label htmlFor="eng-check-input">{FIELD_CHECK.question}</label>
              <div>
                <span className="eng-unit-input">
                  <input id="eng-check-input" type="text" inputMode="decimal" value={checkText} onChange={event => { setCheckText(event.target.value); setCheckResult(null); }} />
                  <span>r/min</span>
                </span>
                <button type="submit" className="eng-primary">Check answer</button>
              </div>
              {checkResult && <p className={checkResult === 'correct' ? 'eng-feedback is-correct' : 'eng-feedback'} role="status">
                {checkResult === 'correct' && expectedCheck.ok ? `Correct: 120 × ${FIELD_CHECK.frequencyHz} ÷ ${FIELD_CHECK.poles} = ${NUMBER.format(expectedCheck.rpm)} r/min.` : checkResult === 'invalid' ? 'Enter your answer as a positive number of revolutions per minute.' : `Not quite. ${FIELD_CHECK.hint}`}
              </p>}
              {progress.fieldSpeed && <p className="eng-saved"><Check size={14} aria-hidden="true" />Answered correctly. {saveFailed?'Not saved: export your working before leaving.':'Saved in this learning space on this browser.'}</p>}
            </form>
          </div>
        </div>
      </section>

      <section className="eng-about" aria-labelledby="eng-about-title">
        <h2 id="eng-about-title">About this model</h2>
        <div className="eng-about-grid">
          <div><h3>Calculated</h3><p>The field-speed calculator, checked against a published table. The field poles in the operating view come from idealised three-phase currents in this model’s 36-slot, four-pole winding, for the normal supply and for each experiment: two phases swapped or one phase open.</p></div>
          <div><h3>Illustrative</h3><p>Playback speed, the size of the slip between field and rotor, and the disassembly order are presentation choices. The rotor shows only whether the field can start it. Nothing here simulates torque, heating, efficiency or real shaft speed.</p></div>
          <div><h3>The 3D model</h3><p>Modelled in Blender for KAIRO as an educational motor, sized loosely like an IEC 132 frame. It is not a specific manufacturer’s design. Lighting uses the Poly Haven Studio HDRI by Greg Zaal (CC0).</p></div>
          <div><h3>Not connected yet</h3><p>Live questions to a guide and an on-screen instructor are not part of this studio yet. Progress is stored only in this browser.</p></div>
        </div>
        <details className="eng-sources">
          <summary>Sources checked for this lesson</summary>
          <ul>{SOURCES.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a><span>{s.supports}</span></li>)}</ul>
        </details>
      </section>
    </main>
  </div>;
}
