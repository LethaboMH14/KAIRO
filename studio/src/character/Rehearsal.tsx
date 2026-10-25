// Standalone rehearsal for the KAIRO teaching character (CHARACTER-002). Exercises the public contract with real
// targets, a board that changes only through an allowed action, voice samples with phoneme-timed or amplitude mouth
// movement, interruption, reduced motion and a 2D reading mode. Not part of the app router.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BOARD_STEPS, SPEECH_TEXT, TARGET_LABELS, VOICES, type VoiceId } from './lesson.ts';
import RehearsalStage, { CAMERA_PRESETS, type CameraPreset, type PerfSample } from './RehearsalStage.tsx';
import { useSpeechSample, type LipMode } from './useSpeechSample.ts';
import type { CharacterCue, CueEvent, Expression, InstrumentSample, ReadyReport } from './types.ts';
import './rehearsal.css';

type LogEntry = CueEvent & { at: number; label: string };
type CueRequest = { type: 'idle' | 'listen' | 'explain' | 'acknowledge' } | { type: 'point'; targetId: string } | { type: 'move'; anchorId: string };

const EXPRESSIONS: { id: Expression; label: string }[] = [
  { id: 'neutral', label: 'Neutral' }, { id: 'encouraging', label: 'Encouraging' }, { id: 'curious', label: 'Curious' }, { id: 'focused', label: 'Focused' },
];
const CUE_LABELS: Record<string, string> = { idle: 'Rest', listen: 'Listen', explain: 'Explain', acknowledge: 'Acknowledge', point: 'Point', move: 'Walk' };
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2');
  } catch {
    return false;
  }
}

export default function Rehearsal() {
  const counter = useRef(0);
  const [cue, setCue] = useState<CharacterCue>({ id: 'idle-0', type: 'idle' });
  const [expression, setExpression] = useState<Expression>('neutral');
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [camera, setCamera] = useState<CameraPreset>('wide');
  const [boardStep, setBoardStep] = useState(0);
  const [voice, setVoice] = useState<VoiceId>('en-GB-Chirp3-HD-Aoede');
  const [lipMode, setLipMode] = useState<LipMode>('visemes');
  const [captions, setCaptions] = useState(true);
  const [mode, setMode] = useState<'3d' | 'reading'>(() => (webglAvailable() ? '3d' : 'reading'));
  const [notice, setNotice] = useState<string | null>(() => (webglAvailable() ? null : '3D is not available on this device, so the reading view is shown.'));
  const [ready, setReady] = useState<ReadyReport | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [narration, setNarration] = useState('Choose a cue, or run the short lesson.');
  const [running, setRunning] = useState(false);
  const [showTargets, setShowTargets] = useState(false);
  const [perf, setPerf] = useState<PerfSample | null>(null);
  const [showPerf, setShowPerf] = useState(false);
  const speech = useSpeechSample();
  const waiters = useRef(new Map<string, (e: CueEvent) => void>());
  const cancel = useRef(false);
  const started = useRef(performance.now());
  // Test hook for the automated browser check (docs/character/checks): latest measurements and cue events.
  const probe = useRef({ events: [] as LogEntry[], sample: null as InstrumentSample | null, samples: [] as InstrumentSample[] });
  const modelUrl = useMemo(() => new URLSearchParams(location.search).get('model') ?? undefined, []);

  const onCueState = useCallback((event: CueEvent) => {
    const label = CUE_LABELS[event.id.split('-')[0]] ?? event.id;
    const entry = { ...event, at: (performance.now() - started.current) / 1000, label };
    probe.current.events.push(entry);
    setLog(list => [entry, ...list].slice(0, 40));
    if (event.state === 'completed' || event.state === 'interrupted' || event.state === 'unsupported') {
      waiters.current.get(event.id)?.(event);
      waiters.current.delete(event.id);
    }
  }, []);

  const issue = useCallback((request: CueRequest) => {
    counter.current += 1;
    const id = `${request.type}-${counter.current}`;
    const next = { id, ...request } as CharacterCue;
    const done = new Promise<CueEvent>(resolve => waiters.current.set(id, resolve));
    setCue(next);
    return { id, done };
  }, []);

  /** The only way the board changes: an allowed action after a completed pointing cue. */
  const advanceBoard = useCallback((reason: CueEvent) => {
    if (reason.state !== 'completed') return false;
    setBoardStep(step => Math.min(BOARD_STEPS.length - 1, step + 1));
    // Logged under its own id so the pointing cue still has exactly one terminal event.
    const entry: LogEntry = { id: 'board', state: 'completed', reason: `board action "advance step" applied after ${reason.id} completed`, at: (performance.now() - started.current) / 1000, label: 'Board' };
    probe.current.events.push(entry);
    setLog(list => [entry, ...list].slice(0, 40));
    return true;
  }, []);

  const point = useCallback((targetId: string) => {
    setNarration(`Pointing at ${TARGET_LABELS[targetId] ?? targetId}.`);
    return issue({ type: 'point', targetId });
  }, [issue]);

  const runLesson = useCallback(async () => {
    if (running) return;
    cancel.current = false;
    setRunning(true);
    setBoardStep(0);
    try {
      setNarration('Learner: "I lost track of the notebook count."');
      setExpression('curious');
      await issue({ type: 'listen' }).done;
      await sleep(1800);
      if (cancel.current) return;
      setExpression('encouraging');
      setNarration('The teacher explains the step (pre-generated voice sample).');
      await issue({ type: 'explain' }).done;
      await speech.play(voice, lipMode);
      await sleep(4200);
      if (cancel.current) return;
      const first = await point('formula').done;
      if (cancel.current) return;
      advanceBoard(first);
      await sleep(1600);
      const second = await point('answer').done;
      if (cancel.current) return;
      advanceBoard(second);
      await sleep(900);
      setNarration('The board changed through the allowed action, so the teacher acknowledges it.');
      await issue({ type: 'acknowledge' }).done;
      setExpression('neutral');
      await issue({ type: 'idle' }).done;
      setNarration('Lesson rehearsal finished.');
    } finally {
      setRunning(false);
    }
  }, [running, issue, speech, voice, lipMode, point, advanceBoard]);

  const interruptTest = useCallback(async () => {
    setNarration('Interruption test: pointing at the formula, then switching to the learner\'s tablet mid-reach.');
    const first = point('formula');
    await sleep(450);
    const second = point('learner-work');
    const [a, b] = await Promise.all([first.done, second.done]);
    setNarration(`Interruption result: first cue ${a.state}, second cue ${b.state}.`);
  }, [point]);

  const stopAll = useCallback(() => {
    cancel.current = true;
    speech.stop();
    issue({ type: 'idle' });
  }, [speech, issue]);

  useEffect(() => {
    (window as unknown as { __kairoRehearsal?: unknown }).__kairoRehearsal = {
      probe: probe.current, issue, point, setExpression, setCamera, setReducedMotion, setMode, setLipMode, setVoice, speech,
      board: () => boardStep, ready: () => ready,
    };
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const map: Record<string, () => void> = {
        '1': () => issue({ type: 'idle' }), '2': () => issue({ type: 'listen' }), '3': () => issue({ type: 'explain' }), '4': () => issue({ type: 'acknowledge' }),
        f: () => point('formula'), a: () => point('answer'), l: () => point('learner-work'), p: () => point('poster'),
        w: () => issue({ type: 'move', anchorId: 'board' }), i: () => void interruptTest(),
        c: () => setCamera(c => { const keys = Object.keys(CAMERA_PRESETS) as CameraPreset[]; return keys[(keys.indexOf(c) + 1) % keys.length]; }),
        r: () => setReducedMotion(v => !v), m: () => setMode(v => (v === '3d' ? 'reading' : '3d')),
        s: () => speech.stop(),
        ' ': () => (speech.status === 'playing' ? speech.pause() : speech.status === 'paused' ? void speech.resume() : void speech.play(voice, lipMode)),
      };
      if (map[k]) { e.preventDefault(); map[k](); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [issue, point, interruptTest, speech, voice, lipMode]);

  const speaking = speech.status === 'playing' || speech.status === 'paused';
  const mouthLabel = speech.status !== 'playing' ? 'Mouth at rest' : lipMode === 'visemes'
    ? `Phoneme-timed mouth shape ${speech.shape ?? 'X'} (Rhubarb timings for this file)` : 'Amplitude only: jaw follows loudness, not phonemes';
  const step = BOARD_STEPS[boardStep];
  const lastStates = useMemo(() => log.slice(0, 14), [log]);

  return (
    <div className="kc-rehearsal">
      <header className="kc-top">
        <div className="kc-brand"><span className="brand-symbol" aria-hidden="true">K</span><div><strong>KAIRO teacher</strong><small>Character rehearsal · CHARACTER-002</small></div></div>
        <div className="kc-status" aria-live="polite">
          <span className={ready ? 'ok' : ''}>{ready ? 'Teacher ready' : mode === 'reading' ? 'Reading view' : 'Loading teacher'}</span>
          <span>{lipMode === 'visemes' ? 'Mouth: phoneme-timed samples' : 'Mouth: amplitude only'}</span>
          {reducedMotion && <span>Reduced motion</span>}
        </div>
      </header>

      {notice && <p className="kc-notice" role="status">{notice} <button onClick={() => setNotice(null)}>Dismiss</button></p>}

      <main className="kc-main">
        <section className="kc-stage" aria-label="Teacher stage">
          {mode === '3d' ? (
            <>
              <RehearsalStage cue={cue} audio={speech.signal} expression={expression} reducedMotion={reducedMotion} boardStep={boardStep}
                camera={camera} showTargets={showTargets} onReady={setReady} onCueState={onCueState} onPerf={setPerf} modelUrl={modelUrl}
                instrument={sample => { probe.current.sample = sample; probe.current.samples.push(sample); if (probe.current.samples.length > 400) probe.current.samples.shift(); }}
                onModelError={message => { setNotice(`The 3D teacher could not load (${message}). The reading view is shown instead.`); setMode('reading'); }} />
              <div className="kc-cameras" role="group" aria-label="Camera view">
                {(Object.keys(CAMERA_PRESETS) as CameraPreset[]).map(key => (
                  <button key={key} aria-pressed={camera === key} onClick={() => setCamera(key)}>{CAMERA_PRESETS[key].label}</button>
                ))}
              </div>
              {showPerf && perf && (
                <dl className="kc-perf" aria-label="Measured rendering">
                  <div><dt>Frame</dt><dd>{perf.frameMs} ms</dd></div><div><dt>p95</dt><dd>{perf.p95Ms} ms</dd></div>
                  <div><dt>FPS</dt><dd>{perf.fps}</dd></div><div><dt>Draw calls</dt><dd>{perf.calls}</dd></div>
                  <div><dt>Triangles</dt><dd>{perf.triangles.toLocaleString()}</dd></div>
                </dl>
              )}
            </>
          ) : (
            <div className="kc-reading">
              <img src="/models/character/teacher-portrait.png" alt="The KAIRO teacher, smiling, in a sage shirt with her locs up in a bun." />
              <div>
                <p className="kc-kicker">Reading view</p>
                <h2>{step.title}</h2>
                <p className="kc-formula">{step.formula}</p>
                <p>{step.caption}</p>
                <ol className="kc-steps">{BOARD_STEPS.map((s, i) => <li key={s.title} aria-current={i === boardStep ? 'step' : undefined}>{s.title}: {s.formula}</li>)}</ol>
                {webglAvailable() && <button className="kc-secondary" onClick={() => setMode('3d')}>Show the 3D teacher</button>}
              </div>
            </div>
          )}
          {captions && (
            <div className="kc-caption" aria-live="polite">
              <strong>{speaking ? 'Teacher' : 'Rehearsal'}</strong>
              <p>{speaking ? SPEECH_TEXT : narration}</p>
              {speaking && <small>{mouthLabel}</small>}
            </div>
          )}
        </section>

        <aside className="kc-panel" aria-label="Rehearsal controls">
          <section>
            <h2>Teaching cues</h2>
            <div className="kc-grid">
              <button onClick={() => issue({ type: 'idle' })}><kbd>1</kbd>Rest</button>
              <button onClick={() => issue({ type: 'listen' })}><kbd>2</kbd>Listen</button>
              <button onClick={() => issue({ type: 'explain' })}><kbd>3</kbd>Explain</button>
              <button onClick={() => issue({ type: 'acknowledge' })}><kbd>4</kbd>Acknowledge</button>
              <button onClick={() => point('formula')}><kbd>F</kbd>Touch formula</button>
              <button onClick={() => point('answer')}><kbd>A</kbd>Touch answer</button>
              <button onClick={() => point('learner-work')}><kbd>L</kbd>Point to tablet</button>
              <button onClick={() => point('poster')}><kbd>P</kbd>Point to far poster</button>
              <button onClick={() => issue({ type: 'move', anchorId: 'board' })}><kbd>W</kbd>Walk to board</button>
              <button onClick={() => void interruptTest()}><kbd>I</kbd>Interrupt test</button>
            </div>
            <div className="kc-row">
              <button className="kc-primary" disabled={running} onClick={() => void runLesson()}>{running ? 'Lesson running…' : 'Run the short lesson'}</button>
              <button className="kc-secondary" onClick={stopAll}>Stop</button>
            </div>
          </section>

          <section>
            <h2>Expression</h2>
            <div className="kc-segment" role="group" aria-label="Expression">
              {EXPRESSIONS.map(e => <button key={e.id} aria-pressed={expression === e.id} onClick={() => setExpression(e.id)}>{e.label}</button>)}
            </div>
          </section>

          <section>
            <h2>Voice sample</h2>
            <label className="kc-field">Voice (synthetic, chosen separately from appearance)
              <select value={voice} onChange={e => setVoice(e.target.value as VoiceId)}>
                {VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </label>
            <div className="kc-segment" role="group" aria-label="Mouth movement">
              <button aria-pressed={lipMode === 'visemes'} onClick={() => setLipMode('visemes')}>Phoneme-timed</button>
              <button aria-pressed={lipMode === 'amplitude'} onClick={() => setLipMode('amplitude')}>Amplitude only</button>
            </div>
            <div className="kc-row">
              <button className="kc-primary" onClick={() => void speech.play(voice, lipMode)}>Play</button>
              <button className="kc-secondary" disabled={speech.status !== 'playing'} onClick={speech.pause}>Pause</button>
              <button className="kc-secondary" disabled={speech.status !== 'paused'} onClick={() => void speech.resume()}>Resume</button>
              <button className="kc-secondary" disabled={!speaking} onClick={speech.stop}>Stop</button>
            </div>
            <p className="kc-note">{speech.status === 'error' ? 'The sample could not play.' : `Status: ${speech.status}.`} Timings come from Rhubarb Lip Sync run on these exact files; live speech elsewhere uses loudness only.</p>
          </section>

          <section>
            <h2>Access and view</h2>
            <label className="kc-check"><input type="checkbox" checked={reducedMotion} onChange={e => setReducedMotion(e.target.checked)} /> Reduce motion (no sway, hair motion or camera glides)</label>
            <label className="kc-check"><input type="checkbox" checked={captions} onChange={e => setCaptions(e.target.checked)} /> Captions</label>
            <label className="kc-check"><input type="checkbox" checked={mode === 'reading'} onChange={e => setMode(e.target.checked ? 'reading' : '3d')} /> Reading view (2D)</label>
            <label className="kc-check"><input type="checkbox" checked={showTargets} onChange={e => setShowTargets(e.target.checked)} /> Show target points</label>
            <label className="kc-check"><input type="checkbox" checked={showPerf} onChange={e => setShowPerf(e.target.checked)} /> Show measured frame time</label>
          </section>

          <section>
            <h2>Cue events</h2>
            <ol className="kc-log" aria-live="polite">
              {lastStates.map((e, i) => (
                <li key={`${e.id}-${e.state}-${i}`} data-state={e.state}>
                  <span>{e.at.toFixed(2)}s</span><strong>{e.label}</strong><em>{e.state}</em>{e.reason && <small>{e.reason}</small>}
                </li>
              ))}
            </ol>
          </section>

          <p className="kc-fine">
            Keys: 1–4 cues, F A L P pointing, W walk, I interrupt, C camera, Space speech, S stop, R reduced motion, M reading view.
            Teacher based on <a href="https://studio.blender.org/characters/rain/v3/" target="_blank" rel="noreferrer">Rain</a> (CC-BY 4.0, Rain Rig (CC) Blender Foundation | studio.blender.org), reshaped, recoloured and restyled for KAIRO; hair, clothing and motion authored for KAIRO.
            Gestures are not SASL. Walking is not delivered yet.
          </p>
        </aside>
      </main>
    </div>
  );
}
