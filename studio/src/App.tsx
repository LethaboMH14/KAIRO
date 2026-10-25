import {learnerStorage} from './account/storage.ts';
import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Box, Check, ChevronRight, Code2, Database, Layers3, Maximize2, Pause, Play, RotateCcw, Volume2, X } from 'lucide-react';
import { consumeAutoplayStep, createGuideRequestGate, guideContextKey, runGuideRequest, selectGuideStage } from './guide-request/request-state.js';

const Scene = lazy(() => import('./Scene'));
const stages = ['Your browser', 'Application API', 'SQLite database', 'Back to you'];
const explanations = [
  'Your browser turns an action into a request. Here, it asks the application for lessons about the topic you select.',
  'The API checks the request and decides what work to do. It passes the topic as a parameter instead of inserting it into SQL code.',
  'SQLite runs the query against the demo lesson catalogue. The matching records travel back to the application.',
  'The application serializes the result as JSON. Your browser can turn that data into something you can use.',
];
type Trace = { rows: { id: number; title: string; topic: string }[]; sql: string; parameters: string[]; durationMs: number; provenance: string; trace: { stage: string; label: string; detail: string; durationMs: number }[] };
class SceneBoundary extends Component<{ children: ReactNode; onFallback: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="scene-fallback"><Box size={32} /><h2>The 3D view could not load</h2><p>You can still complete this lesson in the accessible diagram view.</p><button onClick={this.props.onFallback}>Open diagram view</button></div> : this.props.children; }
}
export default function App() {
  const [stage, setStage] = useState(0);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [topic, setTopic] = useState('database');
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [diagram, setDiagram] = useState(false);
  const [reset, setReset] = useState(0);
  const [error, setError] = useState('');
  const [showStudios, setShowStudios] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [answer, setAnswer] = useState('');
  const [saved, setSaved] = useState(false);
  const [question, setQuestion] = useState('Why does the API need a database?');
  const [guideAnswer, setGuideAnswer] = useState('');
  const [guideError, setGuideError] = useState('');
  const [asking, setAsking] = useState(false);
  const [cloudConfigured, setCloudConfigured] = useState(false);
  const [guideGate] = useState(() => createGuideRequestGate(guideContextKey({ question: 'Why does the API need a database?', topic: 'database', stage: 0 })));
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => { try { setSaved(learnerStorage.getItem('kairo-request-lesson') === 'complete'); } catch { /* Browser storage may be disabled. */ } }, []);
  useEffect(() => { fetch('/api/health').then(r => r.ok ? r.json() : null).then(r => setCloudConfigured(r?.cloudConfigured === true)).catch(() => setCloudConfigured(false)); }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => applyStageTransition(consumeAutoplayStep({ stage, playing }, stages.length)), reduced ? 350 : 1900);
    return () => clearTimeout(timer);
  }, [stage, playing, reduced]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  useEffect(() => () => guideGate.invalidate(), [guideGate]);
  useEffect(() => {
    if (!showStudios && !showSources) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('.modal')!;
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>('button,a[href],input,select,[tabindex="0"]'));
    focusable()[0]?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { setShowStudios(false); setShowSources(false); }
      if (event.key === 'Tab') {
        const list = focusable(), first = list[0], last = list[list.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); previous?.focus(); };
  }, [showStudios, showSources]);
  async function runRequest() {
    setBusy(true); setError(''); setPlaying(false);
    try {
      const response = await fetch('/api/trace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The request failed.');
      setTrace(result); selectStage(0); setPlaying(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Cannot reach the local server.'); }
    finally { setBusy(false); }
  }
  function changeGuideContext(next: { question?: string; topic?: string; stage?: number }) {
    const context = { question: next.question ?? question, topic: next.topic ?? topic, stage: next.stage ?? stage };
    guideGate.updateContext(guideContextKey(context));
    setGuideAnswer('');
    setGuideError('');
    setAsking(false);
  }
  function changeQuestion(value: string) { changeGuideContext({ question: value }); setQuestion(value); }
  function changeTopic(value: string) { changeGuideContext({ topic: value }); setTopic(value); }
  function applyStageTransition(next: { stage: number; playing: boolean }) {
    if (next.stage !== stage) changeGuideContext({ stage: next.stage });
    setStage(next.stage);
    setPlaying(next.playing);
  }
  function selectStage(value: number) { applyStageTransition(selectGuideStage({ stage, playing }, value)); }
  function assess(value: string) {
    setAnswer(value);
    if (value === 'parameter') {
      try { learnerStorage.setItem('kairo-request-lesson', 'complete'); setSaved(true); } catch { setSaved(false); }
    }
  }
  function narrate() {
    if (!window.speechSynthesis) { setError('Browser narration is unavailable. The full explanation is shown as text.'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(explanations[stage]);
    utterance.rate = .94; utterance.lang = 'en-ZA';
    window.speechSynthesis.speak(utterance);
  }
  async function askQuestion() {
    const context = { question, topic, stage };
    setError('');
    await runGuideRequest({
      gate: guideGate,
      context,
      request: async () => {
        const response = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, topic, stage: ['interface', 'api', 'database', 'response'][stage] }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'The guide is unavailable.');
        return result.answer;
      },
      onState: state => {
        if (state.type === 'started') { setAsking(true); setGuideAnswer(''); setGuideError(''); }
        if (state.type === 'answer') setGuideAnswer(state.answer);
        if (state.type === 'error') setGuideError(state.message);
        if (state.type === 'finished') setAsking(false);
      },
    });
  }
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="/" aria-label="KAIRO home"><span className="brand-symbol">k</span>KAIRO<span className="brand-access">Access</span></a><div className="breadcrumb">Learning environments<ChevronRight size={14} /><strong>Computer science</strong></div><a className="quiet-button" href="/sources">My material</a><button className="quiet-button" onClick={() => setShowStudios(true)}><Layers3 size={16} /> Explore studios</button></header>
    <main>
      <div className="page-heading"><div><p className="lesson-path"><BookOpen size={15} /> How software works</p><h1>Inside a single request.</h1><p>Follow the journey from a click to a database—and back.</p></div><div className="lesson-status"><span className="status-dot" /> Interactive foundation <span className="lesson-count">Foundation lesson</span></div></div>
      <div className="workspace">
        <aside className="lesson-panel"><div className="panel-title"><span className="small-icon"><Code2 size={20} /></span><div><span className="subtle">Computer Science Studio</span><h2>The request journey</h2></div></div>
          <p className="intro">Three systems. One conversation. Discover what actually happens when an app asks for data.</p>
          <nav className="stage-nav" aria-label="Request stages">{stages.map((name, i) => <button className={stage === i ? 'stage active' : 'stage'} key={name} onClick={() => selectStage(i)} aria-current={stage === i ? 'step' : undefined}><span className="stage-number">{i + 1}</span><span>{name}<small>{['Make a request', 'Validate and route', 'Find the records', 'Receive a response'][i]}</small></span>{stage === i && <ChevronRight size={15} />}</button>)}</nav>
          <div className="request-form"><label htmlFor="topic">Request lessons about</label><select id="topic" value={topic} onChange={e => changeTopic(e.target.value)}><option value="database">Databases</option><option value="python">Python</option><option value="network">Networking</option><option value="unlisted">An unlisted topic (empty result)</option></select><button className="primary-button" onClick={runRequest} disabled={busy}><Play size={15} fill="currentColor" />{busy ? 'Sending request…' : 'Send a real request'}</button><p>Runs locally against a small SQLite catalogue.</p></div>
          <button className="source-link" onClick={() => setShowSources(true)}><BookOpen size={15} /> Lesson sources & asset credits<ChevronRight size={14} /></button>
        </aside>
        <section className="scene-panel" aria-label="Interactive request environment"><div className="scene-top"><span className="scene-tag"><span />{diagram ? 'Diagram view' : 'Spatial view'}</span><div><button className="scene-button" onClick={() => setDiagram(!diagram)}><Layers3 size={15} />{diagram ? 'Open 3D' : 'Open 2D'}</button><button className="scene-button icon-only" aria-label="Reset camera" onClick={() => setReset(reset + 1)}><RotateCcw size={15} /></button></div></div>
          <div className="scene-view"><div className={diagram ? 'scene-canvas hidden' : 'scene-canvas'} aria-hidden={diagram}><SceneBoundary onFallback={() => setDiagram(true)}><Suspense fallback={<div className="scene-loading"><Box size={25} /><span>Preparing your studio…</span></div>}><Scene stage={stage} onStage={selectStage} playing={playing && !diagram} reduced={reduced} reset={reset} /></Suspense></SceneBoundary></div>{diagram && <div className="diagram"><span className="subtle">The same lesson, another way to explore.</span><h2>Where does your request go?</h2><div className="diagram-flow">{stages.map((name, i) => <button key={name} className={stage === i ? 'diagram-node active' : 'diagram-node'} onClick={() => selectStage(i)}><span>{i + 1}</span>{name}{i < 3 && <ArrowRight size={18} />}</button>)}</div><p>{explanations[stage]}</p></div>}</div>
          <div className="scene-hint"><span><Maximize2 size={13} /> Drag to orbit · Scroll to explore · Select an object</span><label><input type="checkbox" checked={reduced} onChange={e => setReduced(e.target.checked)} /> Reduce motion</label></div>
          <div className="explanation"><div className="guide-badge"><span>K</span><div><strong>KAIRO guide</strong><small>Scripted lesson · browser voice</small></div></div><div className="guide-explanation" aria-live="polite"><strong>{stages[stage]}</strong><p>{trace?.trace[stage].detail || explanations[stage]}</p></div><button className="round-button" onClick={narrate} aria-label="Read this explanation aloud"><Volume2 size={19} /></button></div>
        </section>
      </div>
      <section className="ask-panel"><div><h2>Ask the guide.</h2><p>{cloudConfigured ? 'Asking sends your question to Google Cloud. The hosted app requires sign-in; availability is checked when you ask.' : 'Cloud questions become available when the local server is configured.'}</p></div><form onSubmit={e => { e.preventDefault(); void askQuestion(); }}><label className="sr-only" htmlFor="guide-question">Your question about this lesson</label><input id="guide-question" value={question} maxLength={500} onChange={e => changeQuestion(e.target.value)} placeholder="What would you like to understand?" /><button className="primary-button" disabled={!cloudConfigured || asking || !question.trim()}>{asking ? 'Thinking…' : 'Ask KAIRO'}<ArrowRight size={14} /></button></form>{guideAnswer && <p className="guide-answer" role="status">{guideAnswer}</p>}{guideError && <p className="error-message" role="alert">{guideError}</p>}</section>
      {error && <p className="error-message" role="alert">{error}</p>}
      <section className="bottom-grid"><div className="trace-panel"><div className="section-header"><h2><Database size={17} /> The execution desk</h2><span className="pill">{trace ? `${trace.rows.length} result${trace.rows.length === 1 ? '' : 's'}` : 'Ready when you are'}</span></div><code className="sql-line">SELECT id, title, topic FROM lessons WHERE topic = ?</code><div className="trace-content">{trace ? <><div className="result-list">{trace.rows.length ? trace.rows.map(row => <div key={row.id}><span>{String(row.id).padStart(2, '0')}</span>{row.title}</div>) : <p>No matching rows. An empty result is still a successful query.</p>}</div><p className="execution-note">Query parameter: <strong>{trace.parameters[0]}</strong> · Server work: {trace.durationMs.toFixed(2)} ms. Scene playback slows the sequence down for learning.</p></> : <p>Send a request to inspect actual rows returned by the local database.</p>}</div><div className="playback-controls"><button className="quiet-button" onClick={() => selectStage(Math.max(0, stage - 1))} disabled={stage === 0}><ArrowLeft size={14} /> Back</button><span>Step {stage + 1} of 4</span><button className="quiet-button" onClick={() => selectStage(Math.min(3, stage + 1))} disabled={stage === 3}>Next <ArrowRight size={14} /></button>{trace && <button className="quiet-button" onClick={() => { if (!playing && stage === 3) selectStage(0); setPlaying(!playing); }}>{playing ? <Pause size={14} /> : <Play size={14} />}{playing ? 'Pause' : 'Play trace'}</button>}</div></div>
        <div className="assessment"><div className="section-header"><h2>Make it click.</h2>{saved && <span className="saved"><Check size={14} /> Progress saved</span>}</div><p>Why does the query use a <code>?</code> instead of adding your topic directly to its SQL?</p><fieldset><legend className="sr-only">Choose an answer</legend><label><input type="radio" name="assessment" checked={answer === 'speed'} onChange={() => assess('speed')} /> It guarantees the request is faster.</label><label><input type="radio" name="assessment" checked={answer === 'parameter'} onChange={() => assess('parameter')} /> It keeps input data separate from SQL instructions.</label></fieldset>{answer && <p className={answer === 'parameter' ? 'feedback correct' : 'feedback'} role="status">{answer === 'parameter' ? 'Exactly. Parameter binding treats the topic as a value, not executable SQL.' : 'Try again. Think about how the database distinguishes data from instructions.'}</p>}</div></section>
      <footer><span>Built to understand, not just to watch.</span><span>Local development · Animated guide by Quaternius / Don McCurdy (CC0)</span></footer>
    </main>
    {showStudios && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="studios-title"><button className="close-button" onClick={() => setShowStudios(false)} aria-label="Close studios"><X /></button><h2 id="studios-title">One platform. Different worlds.</h2><p>Explore a working studio, learn from your own material, or put a skill into practice. Each environment includes a readable alternative.</p><a className="studio-row" href="/"><span>Computer Science Studio</span><small>Trace a real request</small></a><a className="studio-row" href="/lecture"><span>Lecture Theatre</span><small>Enter the classroom</small></a><a className="studio-row" href="/engineering"><span>Engineering Studio</span><small>Inspect, disassemble and explore a motor</small></a><a className="studio-row" href="/sources"><span>My material workspace</span><small>Review, learn and practise</small></a><a className="studio-row" href="/practice"><span>Workplace practice</span><small>Investigate a shop's stock records</small></a><a className="studio-row" href="/evidence"><span>Evidence workspace</span><small>Review replay-supported practice and try a service-data case</small></a><a className="studio-row" href="/pathways"><span>Explore roles</span><small>Connect your evidence to a direction</small></a><a className="studio-row" href="/progress"><span>My progress</span><small>Inspect your practice portfolio</small></a><a className="studio-row" href="/teacher"><span>My teacher</span><small>Voice and character rehearsal</small></a><button className="primary-button" onClick={() => setShowStudios(false)}>Return to the studio</button></section></div>}
    {showSources && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="sources-title"><button className="close-button" onClick={() => setShowSources(false)} aria-label="Close sources"><X /></button><h2 id="sources-title">Sources & credits</h2><p>The lesson is prepared content. Create a separate cited lesson from your own material in the My material workspace. Optional guide questions use Vertex AI with this lesson's context; web retrieval is not connected.</p><ul><li><a href="https://nodejs.org/api/sqlite.html" target="_blank" rel="noreferrer">Node.js SQLite and parameter binding</a></li><li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview" target="_blank" rel="noreferrer">MDN: HTTP overview</a></li><li><a href="/models/RobotExpressive.README.md" target="_blank" rel="noreferrer">RobotExpressive attribution (CC0)</a></li></ul><p>The room is code-authored. The downloaded Blender Classroom is a separate reference asset and is not rendered here.</p><p>Progress stays in this browser. The prepared lesson works without cloud calls. Questions sent to the cloud guide are processed by Google Cloud.</p></section></div>}
  </div>;
}
