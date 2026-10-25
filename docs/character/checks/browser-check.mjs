// Browser verification for the KAIRO teaching character (CHARACTER-002).
// Drives headless Edge over the DevTools protocol using only Node built-ins.
//
//   node docs/character/checks/browser-check.mjs
//
// Builds studio/src/character/preview.html with the studio's own vite.config.ts into a temporary folder, serves it on
// 127.0.0.1:4184 (models from studio/public), and runs the scenarios below with the machine's GPU (ANGLE/D3D11).
// Set CHAR_RENDERER=swiftshader for software WebGL. Writes docs/character/screenshots/*.png and
// docs/character/checks/browser-report.json. Audio plays muted (--mute-audio) so playback timing is real.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const STUDIO = fileURLToPath(new URL('../../../studio/', import.meta.url));
const SERVE_PORT = Number(process.env.CHAR_SERVE_PORT ?? 4184);
const PAGE = `http://127.0.0.1:${SERVE_PORT}/src/character/preview.html`;
const BROWSER = process.env.CHAR_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = Number(process.env.CHAR_CDP_PORT ?? 9334);
const SHOTS = fileURLToPath(new URL('../screenshots/', import.meta.url));
const REPORT = fileURLToPath(new URL('./browser-report.json', import.meta.url));
const PROFILE = join(tmpdir(), `kairo-char-check-${process.pid}`);
const BUILD = join(tmpdir(), 'kairo-char-preview-build');
const ONLY = process.env.CHAR_ONLY ? new Set(process.env.CHAR_ONLY.split(',')) : null;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const report = { page: PAGE, browser: BROWSER, started: new Date().toISOString(), build: null, renderer: null, checks: [], console: [], frames: {}, perf: {}, measurements: {}, events: {}, screenshots: [] };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

function check(name, pass, detail = '') {
  report.checks.push({ name, pass: Boolean(pass), detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function buildHarness() {
  const vite = await import(pathToFileURL(join(STUDIO, 'node_modules/vite/dist/node/index.js')).href);
  const result = await vite.build({
    root: STUDIO, configFile: join(STUDIO, 'vite.config.ts'), publicDir: false, logLevel: 'warn',
    build: { outDir: BUILD, emptyOutDir: true, chunkSizeWarningLimit: 4000, rollupOptions: { input: join(STUDIO, 'src/character/preview.html') } },
  });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(r => r.output);
  report.build = outputs.map(o => ({ file: o.fileName, bytes: o.type === 'chunk' ? Buffer.byteLength(o.code) : Buffer.byteLength(o.source) }))
    .sort((a, b) => b.bytes - a.bytes).slice(0, 8);
}

function serveHarness() {
  const roots = [{ prefix: '/models/', dir: join(STUDIO, 'public/models') }, { prefix: '/', dir: BUILD }];
  const server = createServer(async (request, response) => {
    const path = decodeURIComponent(new URL(request.url, 'http://local').pathname);
    if (path === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    for (const { prefix, dir } of roots) {
      if (!path.startsWith(prefix)) continue;
      const file = resolve(dir, `.${path.slice(prefix.length - 1)}`);
      if (!file.startsWith(resolve(dir) + sep)) break;
      try {
        const body = await readFile(file);
        response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Accept-Ranges': 'none' });
        response.end(body);
        return;
      } catch { /* next root */ }
    }
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('not found');
  });
  return new Promise(done => server.listen(SERVE_PORT, '127.0.0.1', () => done(server)));
}

const DRAW_COUNTER = `(() => {
  const frames = []; let current = { calls: 0, triangles: 0 };
  const wrap = proto => {
    if (!proto) return;
    for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
      const original = proto[name]; if (!original) continue;
      proto[name] = function (mode, a, b, c, d) {
        const count = name.startsWith('drawElements') ? a : b;
        const instances = name === 'drawElementsInstanced' ? d : name === 'drawArraysInstanced' ? c : 1;
        current.calls++; if (mode === 4) current.triangles += Math.floor((count * instances) / 3);
        return original.apply(this, arguments);
      };
    }
  };
  wrap(window.WebGL2RenderingContext && WebGL2RenderingContext.prototype);
  wrap(window.WebGLRenderingContext && WebGLRenderingContext.prototype);
  const tick = () => { if (current.calls) { frames.push(current); if (frames.length > 600) frames.shift(); } current = { calls: 0, triangles: 0 }; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  window.__charFrames = frames;
})();`;

const NO_WEBGL = `(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    if (String(type).startsWith('webgl') || type === 'experimental-webgl') return null;
    return original.call(this, type, ...rest);
  };
})();`;

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url); this.id = 0; this.pending = new Map(); this.listeners = new Set();
    this.ws.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve: ok, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message)); else ok(message.result);
      } else if (message.method) for (const l of this.listeners) l(message);
    };
  }
  open() { return new Promise((ok, reject) => { this.ws.onopen = ok; this.ws.onerror = reject; }); }
  send(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((ok, reject) => this.pending.set(id, { resolve: ok, reject })); }
  async close() { this.ws.close(); if (this.targetId) await fetch(`http://127.0.0.1:${PORT}/json/close/${this.targetId}`).catch(() => {}); await sleep(300); }
}

async function newPage({ width = 1440, height = 900, mobile = false, reduced = false, noWebgl = false, failModel = false } = {}) {
  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const page = new Cdp(target.webSocketDebuggerUrl);
  await page.open();
  page.targetId = target.id;
  page.listeners.add(message => {
    if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning', 'warn'].includes(message.params.type)) {
      report.console.push({ scenario: page.scenario, type: message.params.type, text: message.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 400) });
    }
    if (message.method === 'Runtime.exceptionThrown') report.console.push({ scenario: page.scenario, type: 'exception', text: (message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text).slice(0, 400) });
    if (message.method === 'Log.entryAdded' && ['error', 'warning'].includes(message.params.entry.level)) report.console.push({ scenario: page.scenario, type: `log-${message.params.entry.level}`, text: `${message.params.entry.text} ${message.params.entry.url ?? ''}`.slice(0, 400) });
    if (failModel && message.method === 'Fetch.requestPaused') page.send('Fetch.fulfillRequest', { requestId: message.params.requestId, responseCode: 404, responseHeaders: [{ name: 'Content-Type', value: 'text/plain' }], body: Buffer.from('missing').toString('base64') });
  });
  await page.send('Runtime.enable');
  await page.send('Log.enable');
  await page.send('Page.enable');
  await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  if (mobile) await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: DRAW_COUNTER });
  if (noWebgl) await page.send('Page.addScriptToEvaluateOnNewDocument', { source: NO_WEBGL });
  if (failModel) await page.send('Fetch.enable', { patterns: [{ urlPattern: '*kairo-teacher.glb*', requestStage: 'Request' }] });
  return page;
}

async function evaluate(page, expression) {
  const result = await page.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(`${expression.slice(0, 90)}: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`);
  return result.result.value;
}

async function waitFor(page, expression, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { if (await evaluate(page, expression)) return true; await sleep(150); }
  return false;
}

async function load(page, scenario, query = '') {
  page.scenario = scenario;
  await page.send('Page.navigate', { url: PAGE + query });
  if (!(await waitFor(page, `document.readyState === 'complete' && !!document.querySelector('.kc-rehearsal')`, 45000))) throw new Error(`${scenario}: the rehearsal did not render`);
}

const R = '(window.__kairoRehearsal)';
const ready = page => waitFor(page, `!!${R} && !!${R}.ready()`, 90000);
const issue = (page, request) => evaluate(page, `${R}.issue(${JSON.stringify(request)}).id`);
const events = page => evaluate(page, `${R}.probe.events.map(e => ({ id: e.id, state: e.state, reason: e.reason ?? null }))`);
const sample = page => evaluate(page, `${R}.probe.sample`);
/** The character's first measurement taken at least `seconds` of its own clock after now. On a loaded machine the
 *  page can stall, so a fixed wall-clock wait may still return a measurement taken before the action landed. */
const sampleAfter = async (page, seconds, timeout = 8000) => {
  const from = (await sample(page))?.time ?? 0;
  await waitFor(page, `(${R}.probe.sample?.time ?? 0) >= ${from + seconds}`, timeout);
  return sample(page);
};
/** Watches the face for `ms` of wall time: highest jawOpen in the character's measurements and every mouth caption shown. */
const watchMouth = (page, ms) => evaluate(page, `new Promise(resolve => { const jaw = [], labels = new Set(), t0 = performance.now(); const tick = () => { const s = ${R}.probe.sample; if (s) jaw.push(s.mouth.jawOpen); const label = document.querySelector('.kc-caption small')?.textContent; if (label) labels.add(label); if (performance.now() - t0 < ${ms}) setTimeout(tick, 40); else resolve({ maxJaw: Math.max(0, ...jaw), labels: [...labels] }); }; tick(); })`);
const waitEvent = (page, id, states, timeout = 8000) => waitFor(page, `${R}.probe.events.some(e => e.id === ${JSON.stringify(id)} && ${JSON.stringify(states)}.includes(e.state))`, timeout);
const eventFor = async (page, id) => (await events(page)).filter(e => e.id === id);
const setCamera = async (page, key, settle = 1600) => { await evaluate(page, `${R}.setCamera(${JSON.stringify(key)})`); await sleep(settle); };
const noOverflow = page => evaluate(page, `document.documentElement.scrollWidth <= window.innerWidth + 1`);

async function shot(page, name) {
  const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(SHOTS, `${name}.png`), Buffer.from(data, 'base64'));
  report.screenshots.push(`docs/character/screenshots/${name}.png`);
}

async function canvasShot(page, name) {
  await evaluate(page, `(() => { const s = document.createElement('style'); s.id = 'kc-check-hide'; s.textContent = '.kc-cameras,.kc-caption,.kc-perf{visibility:hidden!important}'; document.head.append(s); return true; })()`);
  await sleep(250);
  const r = await evaluate(page, `(() => { const r = document.querySelector('.kc-stage canvas').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`);
  const { data } = await page.send('Page.captureScreenshot', { format: 'png', clip: { ...r, scale: 1 } });
  await evaluate(page, `document.getElementById('kc-check-hide').remove()`);
  writeFileSync(join(SHOTS, `${name}.png`), Buffer.from(data, 'base64'));
  report.screenshots.push(`docs/character/screenshots/${name}.png`);
}

async function clickButton(page, text) {
  const r = await evaluate(page, `(() => { const b = [...document.querySelectorAll('button')].find(e => e.textContent.trim().includes(${JSON.stringify(text)})); if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!r) throw new Error(`missing button ${text}`);
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
    await page.send('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: type === 'mouseMoved' ? 0 : 1 });
    await sleep(30);
  }
}

async function key(page, k) {
  const code = k.length === 1 ? (/[0-9]/.test(k) ? `Digit${k}` : `Key${k.toUpperCase()}`) : k;
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, text: k, unmodifiedText: k });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code });
}

async function frameStats(page, label) {
  const frames = await evaluate(page, `window.__charFrames.slice(-120)`);
  if (!frames.length) return;
  const calls = frames.map(f => f.calls).sort((a, b) => a - b);
  const tris = frames.map(f => f.triangles).sort((a, b) => a - b);
  report.frames[label] = { framesSampled: frames.length, drawCallsMedian: calls[Math.floor(calls.length / 2)], drawCallsMax: calls.at(-1), trianglesMedian: tris[Math.floor(tris.length / 2)], trianglesMax: tris.at(-1) };
}

async function fps(page, ms = 2000) {
  return evaluate(page, `new Promise(resolve => { const t = []; const start = performance.now(); let last = start; const step = now => { t.push(now - last); last = now; if (now - start < ${ms}) requestAnimationFrame(step); else { t.shift(); const s = [...t].sort((a, b) => a - b); resolve({ fps: Math.round(t.length * 1000 / (now - start) * 10) / 10, medianMs: Math.round(s[Math.floor(s.length / 2)] * 10) / 10, p95Ms: Math.round(s[Math.floor(s.length * 0.95)] * 10) / 10 }); } }; requestAnimationFrame(step); })`);
}

async function perfWindow(page, label, windows = 3) {
  const runs = [];
  for (let i = 0; i < windows; i++) runs.push(await fps(page, 2000));
  const med = [...runs].sort((a, b) => a.fps - b.fps)[Math.floor(windows / 2)];
  report.perf[label] = { windows: runs, median: med };
  await frameStats(page, label);
  return med;
}

function auditTerminal(all) {
  const terminal = {};
  for (const e of all) if (['completed', 'interrupted', 'unsupported'].includes(e.state)) terminal[e.id] = (terminal[e.id] ?? 0) + 1;
  const accepted = {};
  for (const e of all) if (e.state === 'accepted') accepted[e.id] = (accepted[e.id] ?? 0) + 1;
  return { doubleTerminal: Object.entries(terminal).filter(([id, n]) => n > 1 && id !== 'board'), doubleAccepted: Object.entries(accepted).filter(([, n]) => n > 1) };
}

// ------------------------------------------------------------------------------------------------- scenarios
async function desktop() {
  const page = await newPage();
  await load(page, 'desktop');
  check('teacher model loads and reports ready', await ready(page));
  report.renderer = await evaluate(page, `(() => { const gl = document.createElement('canvas').getContext('webgl2'); const ext = gl && gl.getExtension('WEBGL_debug_renderer_info'); return gl ? (ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) : 'none'; })()`);
  report.measurements.readyReport = await evaluate(page, `${R}.ready()`);
  report.measurements.glbLoad = await evaluate(page, `(() => { const e = performance.getEntriesByType('resource').find(r => r.name.includes('kairo-teacher.glb')); return e ? { transferBytes: e.transferSize, decodedBytes: e.decodedBodySize, ms: Math.round(e.duration) } : null; })()`);
  await sleep(2500);
  await shot(page, 'c01-desktop-classroom');
  check('desktop: no horizontal page scroll', await noOverflow(page));
  const initial = await eventFor(page, 'idle-0');
  check('initial rest cue: accepted, acting, completed once each', initial.map(e => e.state).join() === 'accepted,acting,completed', initial.map(e => e.state).join());

  await perfWindow(page, 'desktop-idle-classroom');

  for (const key of ['front', 'threeQuarter', 'side', 'back', 'face', 'board']) {
    await setCamera(page, key);
    await canvasShot(page, `c02-camera-${key}`);
  }
  await setCamera(page, 'face');
  for (const expression of ['neutral', 'encouraging', 'curious', 'focused']) {
    await evaluate(page, `${R}.setExpression(${JSON.stringify(expression)})`);
    await sleep(900);
    await canvasShot(page, `c03-face-${expression}`);
  }
  await evaluate(page, `${R}.setExpression('neutral')`);

  await setCamera(page, 'threeQuarter');
  for (const type of ['listen', 'explain']) {
    const id = await issue(page, { type });
    check(`${type} cue completes`, await waitEvent(page, id, ['completed'], 4000));
    await sleep(1800);
    await canvasShot(page, `c04-${type}`);
  }
  const ack = await issue(page, { type: 'acknowledge' });
  await sleep(650);
  await canvasShot(page, 'c04-acknowledge');
  check('acknowledge completes when its clip finishes', await waitEvent(page, ack, ['completed'], 5000));
  await issue(page, { type: 'idle' });
  await sleep(800);

  // Pointing at real targets.
  const restHands = (await sampleAfter(page, 0.25))?.hands;
  const tips = {};
  for (const [target, camera, mode] of [['formula', 'board', 'contact'], ['answer', 'board', 'contact'], ['learner-work', 'wide', 'ray'], ['poster', 'wide', 'ray']]) {
    await setCamera(page, camera, 800);
    const id = await issue(page, { type: 'point', targetId: target });
    const done = await waitEvent(page, id, ['completed'], 8000);
    await sleep(300);
    const s = await sample(page);
    tips[target] = s?.pointing ?? null;
    check(`point at ${target}: completes on the real target (${mode})`, done && s?.pointing?.mode === mode && (mode === 'contact' ? s.pointing.tipToTargetM < 0.035 : s.pointing.rayAngleDeg < 5),
      s?.pointing ? `mode ${s.pointing.mode}, tip-target ${(s.pointing.tipToTargetM * 100).toFixed(1)} cm, ray ${s.pointing.rayAngleDeg} deg` : 'no reading');
    await canvasShot(page, `c05-point-${target}`);
  }
  report.measurements.pointing = tips;
  await issue(page, { type: 'idle' });
  await sleep(900);
  // Both arms come back to the idle clip (its sway moves a wrist about a centimetre), not left where the IK put them.
  const backHands = (await sampleAfter(page, 1))?.hands;
  const drift = {};
  for (const side of ['l', 'r']) for (const part of ['wrist', 'indexTip']) {
    const p = restHands?.[side]?.[part], q = backHands?.[side]?.[part];
    drift[`${side}.${part}`] = p && q ? Math.round(Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) * 1000) : null;
  }
  report.measurements.armReturnMm = drift;
  check('after pointing, both arms return to the idle pose', Object.values(drift).every(d => d !== null && d < 30), JSON.stringify(drift));

  // Interruption: a new target mid-reach blends from the current pose; one terminal event each.
  await setCamera(page, 'wide', 600);
  const first = await issue(page, { type: 'point', targetId: 'formula' });
  await sleep(450);
  const second = await issue(page, { type: 'point', targetId: 'learner-work' });
  await waitEvent(page, second, ['completed'], 8000);
  const a = await eventFor(page, first), b = await eventFor(page, second);
  check('interrupted cue gets exactly one terminal event: interrupted', a.filter(e => ['completed', 'interrupted', 'unsupported'].includes(e.state)).map(e => e.state).join() === 'interrupted', a.map(e => e.state).join());
  check('replacing cue completes exactly once', b.filter(e => e.state === 'completed').length === 1, b.map(e => e.state).join());
  await canvasShot(page, 'c06-after-interruption');
  // Unsupported requests never invent an action.
  const move = await issue(page, { type: 'move', anchorId: 'board' });
  await waitEvent(page, move, ['unsupported'], 2000);
  const mv = await eventFor(page, move);
  check('move is unsupported (no sliding walk is offered)', mv.some(e => e.state === 'unsupported' && e.reason === 'locomotion-not-delivered'), JSON.stringify(mv));
  const missing = await issue(page, { type: 'point', targetId: 'not-in-scene' });
  await waitEvent(page, missing, ['unsupported'], 2000);
  const ms = await eventFor(page, missing);
  check('missing target is unsupported with a reason', ms.some(e => e.state === 'unsupported' && e.reason === 'target-not-found'), JSON.stringify(ms));
  await issue(page, { type: 'idle' });
  await sleep(700);

  // Speech: real sample, phoneme-timed mouth, pause/resume/stop closes the mouth.
  await setCamera(page, 'face', 900);
  await evaluate(page, `${R}.setLipMode('visemes')`);
  await sleep(200);
  const clicked = Date.now();
  await clickButton(page, 'Play');
  const playing = await waitFor(page, `${R}.speech.status === 'playing'`, 6000);
  check('voice sample plays', playing);
  // play() can resolve before the element renders its first frames, so the mouth is judged on the audio clock.
  const clockMoving = await waitFor(page, `${R}.speech.signal.current.time > 0.25`, 10000);
  report.measurements.audioClockStartMs = Date.now() - clicked;
  const talk = await watchMouth(page, 2000);
  await canvasShot(page, 'c07-speaking-visemes');
  check('phoneme-timed mouth moves with the sample', clockMoving && talk.maxJaw > 0.08 && talk.labels.length >= 3,
    `audio clock past 0.25 s ${report.measurements.audioClockStartMs} ms after the click, max jawOpen ${talk.maxJaw}, distinct shape labels ${talk.labels.length}`);
  await clickButton(page, 'Pause');
  const paused = await sampleAfter(page, 0.5);
  check('pause stops playback and closes the mouth', (await evaluate(page, `${R}.speech.status`)) === 'paused' && paused?.mouth.jawOpen < 0.05, `jawOpen ${paused?.mouth.jawOpen}`);
  await clickButton(page, 'Resume');
  check('resume continues playback', await waitFor(page, `${R}.speech.status === 'playing'`, 3000));
  await sleep(700);
  await clickButton(page, 'Stop');
  const stopped = await sampleAfter(page, 0.5);
  check('stop ends playback and closes the mouth', (await evaluate(page, `${R}.speech.status`)) === 'idle' && stopped?.mouth.jawOpen < 0.05, `jawOpen ${stopped?.mouth.jawOpen}`);
  await evaluate(page, `${R}.setLipMode('amplitude')`);
  await sleep(200);
  await clickButton(page, 'Play');
  await waitFor(page, `${R}.speech.status === 'playing' && ${R}.speech.signal.current.time > 0.25`, 10000);
  const amp = await watchMouth(page, 1500);
  check('amplitude-only mode opens the jaw with loudness (labelled as such)', amp.maxJaw > 0.05 && amp.labels.some(l => l.includes('Amplitude only')), `max jawOpen ${amp.maxJaw}`);
  await perfWindow(page, 'desktop-face-speaking');
  await clickButton(page, 'Stop');
  await evaluate(page, `${R}.setLipMode('visemes')`);

  // Full lesson: board changes only through the allowed action after a completed point.
  await setCamera(page, 'wide', 900);
  const before = await evaluate(page, `${R}.board()`);
  await clickButton(page, 'Run the short lesson');
  await sleep(9500);
  await canvasShot(page, 'c08-lesson-pointing');
  const finished = await waitFor(page, `document.querySelector('.kc-caption p')?.textContent.includes('Lesson rehearsal finished') || [...document.querySelectorAll('.kc-log li')].some(l => l.textContent.includes('acknowledge'))`, 40000);
  await sleep(2500);
  const after = await evaluate(page, `${R}.board()`);
  const all = await events(page);
  const boardActions = all.filter(e => e.reason?.startsWith('board action'));
  check('lesson runs to the end', finished);
  check('board advanced exactly twice, each after a completed point', after === 2 && before === 0 && boardActions.length === 2, `board ${before} -> ${after}, actions ${boardActions.length}`);
  await canvasShot(page, 'c09-lesson-finished');
  const audit = auditTerminal(all);
  check('no cue id ever received two terminal events or two acceptances', !audit.doubleTerminal.length && !audit.doubleAccepted.length, JSON.stringify(audit));
  report.events.desktop = all;
  await perfWindow(page, 'desktop-after-lesson-classroom');
  await page.close();
}

async function keyboardAndReading() {
  const page = await newPage();
  await load(page, 'keyboard');
  await ready(page);
  await sleep(1200);
  await key(page, '2');
  await sleep(600);
  check('key 2 issues the listen cue', (await events(page)).some(e => e.id.startsWith('listen') && e.state === 'accepted'));
  await key(page, 'f');
  await sleep(2200);
  check('key F points at the formula', (await events(page)).some(e => e.id.startsWith('point') && e.state === 'completed'));
  await key(page, 'm');
  await sleep(500);
  check('key M switches to the reading view', await evaluate(page, `!!document.querySelector('.kc-reading') && !document.querySelector('.kc-stage canvas')`));
  await shot(page, 'c10-reading-view');
  await page.close();
}

async function reducedMotion() {
  const page = await newPage({ reduced: true });
  await load(page, 'reduced');
  await ready(page);
  check('reduced motion follows the system setting', await evaluate(page, `[...document.querySelectorAll('.kc-check input')][0].checked`));
  await sleep(1500);
  const a = await sampleAfter(page, 0.25);
  const b = await sampleAfter(page, 2);
  const moved = Math.hypot(...a.head.map((v, i) => v - b.head[i]));
  check('reduced motion: no idle sway (head still)', moved < 0.0015 && !b.springs && b.time - a.time >= 2,
    `head moved ${(moved * 1000).toFixed(2)} mm over ${(b.time - a.time).toFixed(2)} s of character time, springs ${b.springs}`);
  await setCamera(page, 'board', 200);
  const t0 = Date.now();
  const id = await issue(page, { type: 'point', targetId: 'formula' });
  const done = await waitEvent(page, id, ['completed'], 4000);
  check('reduced motion: pointing still reaches a static teaching state', done, `${Date.now() - t0} ms`);
  await canvasShot(page, 'c11-reduced-motion-pointing');
  await page.close();
}

async function layouts() {
  for (const [name, opts] of [['phone', { width: 390, height: 844, mobile: true }], ['tablet-portrait', { width: 820, height: 1180 }], ['wide-1920', { width: 1920, height: 1080 }]]) {
    const page = await newPage(opts);
    await load(page, name);
    check(`${name}: teacher loads`, await ready(page));
    await sleep(2200);
    check(`${name}: no horizontal page scroll`, await noOverflow(page));
    await shot(page, `c12-layout-${name}`);
    await page.close();
  }
}

async function fallbacks() {
  let page = await newPage({ noWebgl: true });
  await load(page, 'no-webgl');
  await sleep(1200);
  check('no WebGL: reading view with an explanation', await evaluate(page, `!!document.querySelector('.kc-reading') && document.querySelector('.kc-notice')?.textContent.includes('3D is not available')`));
  await shot(page, 'c13-no-webgl');
  await page.close();
  page = await newPage({ failModel: true });
  await load(page, 'missing-model');
  check('missing model: reading view with a recovery message', await waitFor(page, `!!document.querySelector('.kc-reading') && (document.querySelector('.kc-notice')?.textContent ?? '').includes('could not load')`, 20000));
  await shot(page, 'c14-missing-model');
  await page.close();
}

async function main() {
  mkdirSync(SHOTS, { recursive: true });
  await buildHarness();
  const server = await serveHarness();
  const graphics = process.env.CHAR_RENDERER === 'swiftshader' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'];
  const browser = spawn(BROWSER, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--disable-sync', '--mute-audio', '--autoplay-policy=no-user-gesture-required', ...graphics, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
  try {
    let up = false;
    for (let i = 0; i < 240 && !up; i++) { try { up = (await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok; } catch { await sleep(250); } }
    if (!up) throw new Error('browser did not expose the DevTools port');
    for (const [name, fn] of [['desktop', desktop], ['keyboard', keyboardAndReading], ['reduced', reducedMotion], ['layouts', layouts], ['fallbacks', fallbacks]]) {
      if (ONLY && !ONLY.has(name)) continue;
      try { await fn(); } catch (error) { check(`${name} scenario completed without a harness error`, false, error.message); }
    }
  } finally {
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { stdio: 'ignore' }); else browser.kill();
    server.close();
    await sleep(1500);
    try { rmSync(PROFILE, { recursive: true, force: true, maxRetries: 20, retryDelay: 500 }); } catch (error) { console.warn(`Could not remove ${PROFILE}: ${error.message}`); }
  }
  report.finished = new Date().toISOString();
  report.summary = { passed: report.checks.filter(c => c.pass).length, failed: report.checks.filter(c => !c.pass).length };
  writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\n${report.summary.passed} passed, ${report.summary.failed} failed. Console entries: ${report.console.length}. Report: ${REPORT}`);
  process.exitCode = report.summary.failed ? 1 : 0;
}

main();
