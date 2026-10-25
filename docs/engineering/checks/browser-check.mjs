// Browser verification for the Engineering Studio (ENG-001; supply experiments and layout, ENG-002A).
// Drives headless Edge/Chrome over the DevTools protocol using only Node built-ins.
//
//   node docs/engineering/checks/browser-check.mjs
//
// By default it builds studio/src/engineering/preview.html with the project's own
// vite.config.ts into a temporary folder and serves it on 127.0.0.1:4182, so the
// check exercises a production bundle and never waits on dev-server re-optimisation.
// Set ENG_PREVIEW_URL to test an already running server instead, and ENG_ONLY to run
// some scenario groups (their names are the keys of SCENARIOS below).
//
// Writes docs/engineering/screenshots/*.png and docs/engineering/checks/browser-report.json.
// By default the headless browser uses the machine's GPU through ANGLE/D3D11; set
// ENG_RENDERER=swiftshader for software WebGL (much slower, but needs no GPU).
// The renderer string is recorded in the report next to every frame-rate figure.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const STUDIO = fileURLToPath(new URL('../../../studio/', import.meta.url));
const SERVE_PORT = Number(process.env.ENG_SERVE_PORT ?? 4182);
const PAGE = process.env.ENG_PREVIEW_URL ?? `http://127.0.0.1:${SERVE_PORT}/src/engineering/preview.html`;
const BROWSER = process.env.ENG_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = Number(process.env.ENG_CDP_PORT ?? 9333);
const SHOTS = fileURLToPath(new URL('../screenshots/', import.meta.url));
const REPORT = fileURLToPath(new URL('./browser-report.json', import.meta.url));
const PROFILE = join(tmpdir(), `kairo-eng-check-${process.pid}`);
const BUILD = join(tmpdir(), 'kairo-eng-preview-build');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const report = { page: PAGE, browser: BROWSER, started: new Date().toISOString(), build: null, renderer: null, checks: [], console: [], frames: {}, screenshots: [] };

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

/** Builds the isolated harness with the shared Vite config (no public dir copy; models are served from studio/public). */
async function buildHarness() {
  const vite = await import(pathToFileURL(join(STUDIO, 'node_modules/vite/dist/node/index.js')).href);
  const result = await vite.build({
    root: STUDIO,
    configFile: join(STUDIO, 'vite.config.ts'),
    publicDir: false,
    logLevel: 'warn',
    build: { outDir: BUILD, emptyOutDir: true, chunkSizeWarningLimit: 4000, rollupOptions: { input: join(STUDIO, 'src/engineering/preview.html') } },
  });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(r => r.output);
  report.build = outputs
    .map(o => ({ file: o.fileName, bytes: o.type === 'chunk' ? Buffer.byteLength(o.code) : Buffer.byteLength(o.source) }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 8);
}

function serveHarness() {
  const roots = [{ prefix: '/models/', dir: join(STUDIO, 'public/models') }, { prefix: '/', dir: BUILD }];
  const server = createServer(async (request, response) => {
    const path = decodeURIComponent(new URL(request.url, 'http://local').pathname);
    if (path === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    if (path === '/') { response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); response.end('<!doctype html><title>Studios</title><p>Harness exit target.</p>'); return; }
    for (const { prefix, dir } of roots) {
      if (!path.startsWith(prefix)) continue;
      const file = resolve(dir, `.${path.slice(prefix.length - 1)}`);
      if (!file.startsWith(resolve(dir) + sep)) break;
      try {
        const body = await readFile(file);
        response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
        response.end(body);
        return;
      } catch { /* try the next root */ }
    }
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('not found');
  });
  return new Promise(done => server.listen(SERVE_PORT, '127.0.0.1', () => done(server)));
}

function check(name, pass, detail = '') {
  report.checks.push({ name, pass: Boolean(pass), detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

// Counts draw calls and triangles per animation frame without touching app code.
const DRAW_COUNTER = `(() => {
  const frames = []; let current = { calls: 0, triangles: 0 };
  const wrap = proto => {
    if (!proto) return;
    for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
      const original = proto[name];
      if (!original) continue;
      proto[name] = function (mode, a, b, c, d) {
        // drawElements(mode, count, ...); drawArrays(mode, first, count, ...)
        const count = name.startsWith('drawElements') ? a : b;
        const instances = name === 'drawElementsInstanced' ? d : name === 'drawArraysInstanced' ? c : 1;
        current.calls++;
        if (mode === 4) current.triangles += Math.floor((count * instances) / 3);
        return original.apply(this, arguments);
      };
    }
  };
  wrap(window.WebGL2RenderingContext && WebGL2RenderingContext.prototype);
  wrap(window.WebGLRenderingContext && WebGLRenderingContext.prototype);
  const tick = () => { if (current.calls) { frames.push(current); if (frames.length > 600) frames.shift(); } current = { calls: 0, triangles: 0 }; requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  window.__engFrames = frames;
})();`;

// Records page errors: resizing what a ResizeObserver watches, inside its own callback, raises one.
const PAGE_ERRORS = `window.__engErrors = [];
window.addEventListener('error', event => window.__engErrors.push(String(event.message)));`;

// Stands in for the app shell's site-wide strip, which sits above the studio once it is routed.
const ADD_SHELL_STRIP = `(() => {
  const strip = document.createElement('div');
  strip.style.cssText = 'height:39px;background:#d9dcd5';
  document.body.prepend(strip);
  return true;
})()`;

const NO_WEBGL = `(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    if (String(type).startsWith('webgl') || type === 'experimental-webgl') return null;
    return original.call(this, type, ...rest);
  };
})();`;

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Set();
    this.ws.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(`${message.error.message}`)); else resolve(message.result);
      } else if (message.method) {
        for (const listener of this.listeners) listener(message);
      }
    };
  }
  open() { return new Promise((resolve, reject) => { this.ws.onopen = resolve; this.ws.onerror = reject; }); }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  /** Closes the tab itself, so a finished scenario stops rendering before the next one measures. */
  async close() {
    this.ws.close();
    if (this.targetId) await fetch(`http://127.0.0.1:${PORT}/json/close/${this.targetId}`).catch(() => {});
    await sleep(300);
  }
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
    if (message.method === 'Runtime.exceptionThrown') {
      report.console.push({ scenario: page.scenario, type: 'exception', text: (message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text).slice(0, 400) });
    }
    if (message.method === 'Log.entryAdded' && ['error', 'warning'].includes(message.params.entry.level)) {
      report.console.push({ scenario: page.scenario, type: `log-${message.params.entry.level}`, text: `${message.params.entry.text} ${message.params.entry.url ?? ''}`.slice(0, 400) });
    }
    if (failModel && message.method === 'Fetch.requestPaused') {
      page.send('Fetch.fulfillRequest', { requestId: message.params.requestId, responseCode: 404, responseHeaders: [{ name: 'Content-Type', value: 'text/plain' }], body: Buffer.from('missing').toString('base64') });
    }
  });
  await page.send('Runtime.enable');
  await page.send('Log.enable');
  await page.send('Page.enable');
  await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  if (mobile) await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: DRAW_COUNTER });
  if (noWebgl) await page.send('Page.addScriptToEvaluateOnNewDocument', { source: NO_WEBGL });
  if (failModel) await page.send('Fetch.enable', { patterns: [{ urlPattern: '*induction-motor.glb*', requestStage: 'Request' }] });
  return page;
}

/**
 * Asks the browser to close itself over the DevTools protocol. Edge's launcher process
 * can exit early, so a tree kill on the PID that spawn() returned may miss the real browser.
 */
async function closeBrowser() {
  try {
    const { webSocketDebuggerUrl } = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
    const socket = new WebSocket(webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    socket.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
    await sleep(1500);
  } catch { /* the browser may already be gone; the process kill below still runs */ }
}

async function evaluate(page, expression) {
  const result = await page.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(`${expression.slice(0, 80)}: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`);
  return result.result.value;
}

async function waitFor(page, expression, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate(page, expression)) return true;
    await sleep(150);
  }
  return false;
}

async function load(page, scenario) {
  page.scenario = scenario;
  await page.send('Page.navigate', { url: PAGE });
  if (!(await waitFor(page, `document.readyState === 'complete' && !!document.querySelector('.engineering-studio')`, 45000))) {
    throw new Error(`${scenario}: the studio did not render at ${PAGE}`);
  }
}

async function shot(page, name) {
  const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(data, 'base64');
  writeFileSync(join(SHOTS, `${name}.png`), buffer);
  report.screenshots.push(`docs/engineering/screenshots/${name}.png`);
  return buffer;
}

const click = (page, selector) => evaluate(page, `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('missing ' + ${JSON.stringify(selector)}); el.click(); return true; })()`);
const clickText = (page, selector, text) => evaluate(page, `(() => { const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find(e => e.textContent.trim().includes(${JSON.stringify(text)})); if (!el) throw new Error('missing ' + ${JSON.stringify(text)}); el.click(); return true; })()`);
const setInput = (page, selector, value) => evaluate(page, `(() => { const el = document.querySelector(${JSON.stringify(selector)}); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(el, ${JSON.stringify(String(value))}); el.dispatchEvent(new Event('input', { bubbles: true })); return el.value; })()`);
const text = (page, selector) => evaluate(page, `document.querySelector(${JSON.stringify(selector)})?.textContent?.trim() ?? null`);
const pressed = page => evaluate(page, `[...document.querySelectorAll('.eng-parts button[aria-pressed="true"] .eng-part-name')].map(e => e.textContent)`);
const noOverflow = page => evaluate(page, `document.documentElement.scrollWidth <= window.innerWidth + 1`);
const controlsOnScreen = page => evaluate(page, `window.scrollY === 0 && document.querySelector('.eng-controls').getBoundingClientRect().bottom <= window.innerHeight + 1`);
const setSelect = (page, selector, value) => evaluate(page, `(() => { const el = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('change', { bubbles: true })); return el.value; })()`);

/** Signed difference of two angles of a four-pole field, whose north poles repeat every 180°. */
const poleDelta = deg => ((((deg + 90) % 180) + 180) % 180) - 90;

/** Screen centre, angle (anticlockwise on screen) and opacity of each pole label on the 3D field dial. */
const dialPoles = page => evaluate(page, `(() => {
  const poles = [...document.querySelectorAll('.eng-pole')].map(el => {
    const r = el.getBoundingClientRect();
    return { north: !el.classList.contains('is-south'), x: r.x + r.width / 2, y: r.y + r.height / 2, opacity: Number(el.style.opacity || 1) };
  });
  const cx = poles.reduce((sum, p) => sum + p.x, 0) / poles.length;
  const cy = poles.reduce((sum, p) => sum + p.y, 0) / poles.length;
  return poles.map(p => ({ ...p, angle: (Math.atan2(cy - p.y, p.x - cx) * 180) / Math.PI }));
})()`);

/** Every later label sits where an earlier one was, with the same polarity (or the opposite, when flipped). */
const samePlaces = (earlier, later, flipped = false) => later.every(p => earlier.some(q => q.north === (flipped ? !p.north : p.north) && Math.hypot(p.x - q.x, p.y - q.y) < 3));

/** Paused, one Step turns the field 15 mechanical degrees: how far, and which way, do the 3D north poles move on screen? */
async function stepTurn(page) {
  const norths = list => list.filter(p => p.north).map(p => p.angle);
  const before = norths(await dialPoles(page));
  await clickText(page, '.eng-operate button', 'Step');
  await sleep(400);
  const after = norths(await dialPoles(page));
  const deltas = after.map(a => before.map(b => poleDelta(a - b)).reduce((x, y) => (Math.abs(y) < Math.abs(x) ? y : x)));
  return deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
}

/** The phase plot's present values, as numbers. */
const plotValues = async page => Object.fromEntries((await evaluate(page, `[...document.querySelectorAll('.eng-plot-values div')].slice(1).map(d => [d.querySelector('dt').textContent.trim(), d.querySelector('dd').textContent])`))
  .map(([phase, value]) => [phase, Number(value.replace(',', '.').replace('−', '-'))]));

/** Field angle (north pole, degrees), opacity and rotor angle of the 2D end view, with how many slots carry no current. */
const endView = page => evaluate(page, `(() => {
  const field = document.querySelector('.eng-field-ring');
  const turn = el => -Number(/rotate\\(([-\\d.]+)\\)/.exec(el.getAttribute('transform'))[1]);
  return {
    north: turn(field), opacity: Number(field.style.opacity || 1), rotor: turn(document.querySelector('.eng-rotor-pointer').parentElement),
    emptyW: [...document.querySelectorAll('.eng-slot-mark')].filter(m => m.querySelector('circle').getAttribute('stroke') === '#2f7fd0' && m.dataset.direction === 'none').length,
    empty: document.querySelectorAll('.eng-slot-mark[data-direction="none"]').length,
  };
})()`);

async function key(page, keyName, code, keyCode) {
  // Chromium activates native buttons from the character event, so Enter and Space carry text.
  const text = keyName === 'Enter' ? '\r' : keyName === ' ' ? ' ' : undefined;
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode, ...(text ? { text, unmodifiedText: text } : {}) });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
}

async function clickAt(page, x, y) {
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
    await page.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: type === 'mouseMoved' ? 0 : 1 });
    await sleep(40);
  }
}

/** Screenshot of the 3D canvas alone, with overlays hidden and the pointer parked off the model. */
async function canvasShot(page, name) {
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 4, y: 4 });
  await evaluate(page, `(() => { const s = document.createElement('style'); s.id = 'eng-check-hide'; s.textContent = '.eng-caption,.eng-title,.eng-view-tools,.eng-scene-label{visibility:hidden!important}'; document.head.append(s); return true; })()`);
  await sleep(400);
  const r = await evaluate(page, `(() => { const r = document.querySelector('.eng-canvas canvas').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`);
  const { data } = await page.send('Page.captureScreenshot', { format: 'png', clip: { ...r, scale: 1 } });
  await evaluate(page, `document.getElementById('eng-check-hide').remove()`);
  const buffer = Buffer.from(data, 'base64');
  writeFileSync(join(SHOTS, `${name}.png`), buffer);
  report.screenshots.push(`docs/engineering/screenshots/${name}.png`);
  return buffer;
}

async function frameStats(page, label) {
  const frames = await evaluate(page, `window.__engFrames.slice(-120)`);
  if (!frames.length) return;
  const calls = frames.map(f => f.calls).sort((a, b) => a - b);
  const tris = frames.map(f => f.triangles).sort((a, b) => a - b);
  report.frames[label] = { framesSampled: frames.length, drawCallsMedian: calls[Math.floor(calls.length / 2)], drawCallsMax: calls.at(-1), trianglesMedian: tris[Math.floor(tris.length / 2)], trianglesMax: tris.at(-1) };
}

/** Three consecutive windows, reported in full with their median; a single window hides variation. */
async function fpsSamples(page, windows = 3, ms = 2000) {
  const samples = [];
  for (let i = 0; i < windows; i++) samples.push(await fps(page, ms));
  return { samples, median: [...samples].sort((a, b) => a - b)[Math.floor(windows / 2)] };
}

async function fps(page, ms = 3000) {
  return evaluate(page, `new Promise(resolve => { let n = 0; const start = performance.now(); const step = now => { n++; if (now - start < ${ms}) requestAnimationFrame(step); else resolve(Math.round((n * 1000 / (now - start)) * 10) / 10); }; requestAnimationFrame(step); })`);
}

async function desktopScenarios() {
  const page = await newPage();
  await load(page, 'desktop');
  check('3D model loads into a WebGL canvas', await waitFor(page, `!!document.querySelector('.eng-canvas canvas') && !document.querySelector('.eng-loading')`, 90000));
  report.renderer = await evaluate(page, `(() => { const gl = document.createElement('canvas').getContext('webgl2'); const ext = gl && gl.getExtension('WEBGL_debug_renderer_info'); return gl ? (ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) : 'none'; })()`);
  await sleep(2500);
  await shot(page, '01-desktop-assembled');
  check('desktop: no horizontal page scroll', await noOverflow(page));
  await frameStats(page, 'desktop-idle');

  const rect = await evaluate(page, `(() => { const r = document.querySelector('.eng-canvas canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
  await clickAt(page, rect.x + rect.w * 0.5, rect.y + rect.h * 0.55);
  await sleep(800);
  const picked = await pressed(page);
  check('clicking the 3D model selects the part under the pointer', picked.length === 1, `selected: ${picked.join(', ') || 'none'}`);
  await shot(page, '02-desktop-picked-in-3d');

  await clickText(page, '.eng-parts li button', 'Squirrel cage');
  await sleep(600);
  check('list selection updates the shared selection', (await pressed(page)).join() === 'Squirrel cage');
  check('detail panel shows the selected part', (await text(page, '.eng-part-card h2')) === 'Squirrel cage');
  check('hidden internal part offers Show inside', !!(await text(page, '.eng-hint')));
  await shot(page, '03-selected-cage-assembled');

  await click(page, '.eng-hint .eng-link');
  await sleep(900);
  check('Show inside toggles the cutaway', await evaluate(page, `document.querySelector('.eng-view-tools button').getAttribute('aria-pressed') === 'true'`));
  await shot(page, '04-cutaway-cage-selected');

  await clickText(page, '.eng-card-actions button', 'Focus on part');
  await sleep(1300);
  await shot(page, '05-focus-cage');

  // Read aloud: only on request, speaks the selected part, and can be stopped. Speech is stubbed (no audio in headless).
  await evaluate(page, `(() => { window.__spoken = []; speechSynthesis.speak = u => { window.__spoken.push(u.text); window.__utterance = u; }; speechSynthesis.cancel = () => { window.__cancelled = (window.__cancelled || 0) + 1; }; return true; })()`);
  check('nothing is spoken until the learner asks', (await evaluate(page, `window.__spoken.length`)) === 0);
  await clickText(page, '.eng-card-actions button', 'Read aloud');
  await sleep(200);
  check('Read aloud speaks the selected part and offers Stop', await evaluate(page, `window.__spoken.length === 1 && window.__spoken[0].startsWith('Squirrel cage.') && window.__utterance.lang === 'en-ZA' && !![...document.querySelectorAll('.eng-card-actions button')].find(b => b.textContent.includes('Stop reading'))`));
  await clickText(page, '.eng-card-actions button', 'Stop reading');
  await sleep(200);
  check('Stop reading cancels speech', (await evaluate(page, `window.__cancelled > 0 && !![...document.querySelectorAll('.eng-card-actions button')].find(b => b.textContent.includes('Read aloud'))`)));

  // Exact reassembly: identical UI state before and after an explode/reverse cycle must render identical pixels.
  await clickText(page, '.eng-card-actions button', 'Clear');
  await clickText(page, '.eng-views button', 'Reset view');
  await sleep(1400);
  const before = await canvasShot(page, '06-reference-before-explode');

  await clickText(page, '[role=tab]', 'Explode');
  await sleep(1600);
  check('Explode tab separates the motor', (await evaluate(page, `document.querySelector('.eng-explode input').value`)) === '100');
  await shot(page, '07-exploded');
  await frameStats(page, 'desktop-explode');

  await clickText(page, '.eng-parts li button', 'Rotor core');
  await clickText(page, '.eng-card-actions button', 'Focus on part');
  await sleep(1400);
  await shot(page, '08-exploded-focus-rotor');
  await clickText(page, '.eng-card-actions button', 'Clear');

  // Reverse direction mid-tween several times, end part-way apart, then use Reassemble.
  for (const value of [80, 15, 95, 40, 70, 5, 100, 30, 90]) { await setInput(page, '.eng-explode input', value); await sleep(60); }
  await clickText(page, '.eng-explode button', 'Reassemble');
  await sleep(200);
  await clickText(page, '[role=tab]', 'Inspect');
  await clickText(page, '.eng-views button', 'Reset view');
  await sleep(1800);
  const after = await canvasShot(page, '09-reference-after-reassembly');
  check('rapid reversals then Reassemble return to the exact assembled image', Buffer.compare(before, after) === 0, `${before.length} vs ${after.length} bytes`);

  await clickText(page, '[role=tab]', 'Operate');
  await sleep(400);
  check('Operate turns on the cutaway', await evaluate(page, `document.querySelector('.eng-view-tools button').getAttribute('aria-pressed') === 'true'`));
  await clickText(page, '.eng-operate button', 'Run');
  await sleep(2500);
  report.frames.operatingFps = { devicePixelRatio: 1, viewport: '1440x900', ...(await fpsSamples(page)) };
  await frameStats(page, 'desktop-operating');
  await shot(page, '10-operating');
  await clickText(page, '.eng-operate button', 'Pause');
  // Software rendering can take a second per frame, so let the readout settle first.
  let frozen1 = null;
  for (let i = 0, previous = null; i < 20; i++) {
    frozen1 = await text(page, '.eng-plot-values');
    if (frozen1 === previous) break;
    previous = frozen1;
    await sleep(700);
  }
  await sleep(2000);
  const frozen2 = await text(page, '.eng-plot-values');
  check('Pause freezes the current angle', frozen1 === frozen2, frozen1);
  await clickText(page, '.eng-operate button', 'Run');
  await sleep(500);
  await clickText(page, '[role=tab]', 'Explode');
  await sleep(500);
  check('exploding while operating pauses the demonstration', await evaluate(page, `!document.querySelector('.eng-operate')`) && (await text(page, '.eng-caption p')).includes('paused'));
  await clickText(page, '[role=tab]', 'Operate');
  await sleep(300);
  check('operation stays unavailable while taken apart, with the reason shown', await evaluate(page, `[...document.querySelectorAll('.eng-operate button')].find(b => b.textContent.includes('Run')).disabled`) && !!(await text(page, '.eng-paused')));
  await shot(page, '11-operate-paused-exploded');
  await clickText(page, '.eng-paused button', 'Reassemble');
  await sleep(1400);
  check('Reassemble re-enables Run', await evaluate(page, `![...document.querySelectorAll('.eng-operate button')].find(b => b.textContent.includes('Run')).disabled`));

  // Keyboard: tabs use manual activation (arrows move focus, Enter activates); list buttons select with Enter.
  await evaluate(page, `document.querySelector('[role=tab][aria-selected=true]').focus()`);
  await key(page, 'ArrowLeft', 'ArrowLeft', 37);
  const focusedTab = await evaluate(page, `document.activeElement.textContent`);
  check('arrow keys move focus between activity tabs without activating them', focusedTab === 'Explode' && (await text(page, '[role=tab][aria-selected=true]')) === 'Operate' && (await evaluate(page, `document.querySelector('.eng-operate') !== null`)), `focused ${focusedTab}`);
  await key(page, 'ArrowLeft', 'ArrowLeft', 37);
  await key(page, 'Enter', 'Enter', 13);
  await sleep(200);
  check('Enter activates the focused tab', (await text(page, '[role=tab][aria-selected=true]')) === 'Inspect');
  await key(page, 'End', 'End', 35);
  await key(page, 'Home', 'Home', 36);
  check('End and Home move focus to the last and first tabs', (await evaluate(page, `document.activeElement.textContent`)) === 'Inspect');
  await evaluate(page, `[...document.querySelectorAll('.eng-parts li button')][6].focus()`);
  await key(page, 'Enter', 'Enter', 13);
  await sleep(300);
  check('Enter on a focused list item selects it', (await pressed(page)).join() === 'Shaft');
  await key(page, 'Escape', 'Escape', 27);
  await sleep(200);
  check('Escape clears the selection', (await pressed(page)).length === 0);

  // Drawing view (2D alternative).
  await clickText(page, '.eng-view-tools button', 'Drawing view');
  await sleep(600);
  check('drawing view replaces the canvas', await evaluate(page, `!!document.querySelector('.eng-diagram svg') && !document.querySelector('.eng-canvas canvas')`));
  await evaluate(page, `[...document.querySelectorAll('.eng-diagram-part')].find(g => g.getAttribute('aria-label').includes('Stator windings')).focus()`);
  await key(page, 'Enter', 'Enter', 13);
  await sleep(300);
  check('drawing parts are keyboard-selectable and share the selection', (await pressed(page)).join() === 'Stator windings');
  await shot(page, '12-drawing-side-windings');
  await clickText(page, '[role=tab]', 'Explode');
  await sleep(1200);
  await shot(page, '13-drawing-side-exploded');
  await clickText(page, '.eng-explode button', 'Reassemble');
  await clickText(page, '[role=tab]', 'Operate');
  await clickText(page, '.eng-operate button', 'Run');
  await sleep(1500);
  await shot(page, '14-drawing-end-operating');
  await clickText(page, '.eng-operate button', 'Pause');
  await clickText(page, '.eng-view-tools button', '3D view');
  await sleep(1500);
  check('returning to 3D restores the canvas', await waitFor(page, `!!document.querySelector('.eng-canvas canvas')`, 20000));

  // Practise.
  await evaluate(page, `document.querySelector('.eng-practise').scrollIntoView()`);
  await clickText(page, '.eng-quiz label', 'Cooling fan');
  check('wrong quiz answer gives specific feedback', (await text(page, '.eng-quiz .eng-feedback')).startsWith('Not this one'));
  await clickText(page, '.eng-quiz label', 'Stator core and windings');
  check('Stator is accepted with an explanation', (await text(page, '.eng-quiz .eng-feedback')).startsWith('Correct'));
  for (const [value, expectOk] of [['0', false], ['-50', false], ['abc', false], ['', false], ['401', false], ['50', true], ['60', true], ['50,5', true]]) {
    await setInput(page, '.eng-calc-inputs input[type=text]', value);
    await sleep(80);
    const shown = await text(page, '#eng-calc-result');
    const ok = !(await evaluate(page, `document.querySelector('#eng-calc-result').classList.contains('is-error')`));
    check(`calculator ${expectOk ? 'accepts' : 'rejects'} frequency "${value}"`, ok === expectOk && !/NaN|Infinity/.test(shown), shown);
  }
  await setInput(page, '.eng-calc-inputs input[type=text]', '60');
  await clickText(page, '.eng-chips label', '4');
  await sleep(80);
  check('calculator: 60 Hz, 4 poles gives 1 800 r/min', (await text(page, '#eng-calc-result strong')).replace(/\s/g, '') === '1800r/min');
  await clickText(page, '.eng-chips label', '2');
  await setInput(page, '.eng-calc-inputs input[type=text]', '50');
  await sleep(80);
  check('calculator: 50 Hz, 2 poles gives 3 000 r/min', (await text(page, '#eng-calc-result strong')).replace(/\s/g, '') === '3000r/min');
  await setInput(page, '#eng-check-input', '1800');
  await click(page, '.eng-check button[type=submit]');
  await sleep(100);
  check('field-speed question accepts 1800 r/min', (await text(page, '.eng-check .eng-feedback')).startsWith('Correct'));
  check('progress saved in browser storage', await evaluate(page, `JSON.parse(localStorage.getItem('kairo-engineering-progress')).fieldSpeed === true`));
  await shot(page, '15-practise');

  await evaluate(page, `window.scrollTo(0, 0)`);
  await click(page, '.eng-exit');
  await sleep(500);
  check('Back to studios calls onExit (harness navigates to /)', await evaluate(page, `location.pathname === '/'`));
  await page.close();
}

async function reducedMotionScenario() {
  const page = await newPage({ reduced: true });
  await load(page, 'reduced-motion');
  await waitFor(page, `!document.querySelector('.eng-loading')`, 90000);
  await sleep(1500);
  check('system reduced-motion preference turns on the Reduce motion control', await evaluate(page, `document.querySelector('.eng-switch input').checked`));
  await clickText(page, '[role=tab]', 'Explode');
  await sleep(150);
  const quick = await shot(page, '16-reduced-explode-immediate');
  await sleep(1200);
  const later = await page.send('Page.captureScreenshot', { format: 'png' });
  check('reduced motion: explode and camera snap without travel', Buffer.compare(quick, Buffer.from(later.data, 'base64')) === 0);
  await clickText(page, '[role=tab]', 'Operate');
  await clickText(page, '.eng-paused button', 'Reassemble');
  await sleep(300);
  check('reduced motion: operation starts paused', await evaluate(page, `[...document.querySelectorAll('.eng-operate button')].find(b => b.textContent.includes('Run')).getAttribute('aria-pressed') === 'false'`));
  await page.close();
}

/** Frame rate of the running demonstration at a higher pixel ratio, as on many laptops. */
async function densityScenario() {
  const page = await newPage();
  await page.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1.5, mobile: false });
  await load(page, 'desktop-dpr-1.5');
  await waitFor(page, `!!document.querySelector('.eng-canvas canvas') && !document.querySelector('.eng-loading')`, 90000);
  await sleep(1500);
  report.frames.idleFps = { devicePixelRatio: 1.5, viewport: '1440x900', fps: await fps(page, 2000), note: 'demand rendering: frames are only drawn when something changes' };
  await clickText(page, '[role=tab]', 'Operate');
  await clickText(page, '.eng-operate button', 'Run');
  await sleep(2000);
  report.frames.operatingFpsDpr15 = { devicePixelRatio: 1.5, viewport: '1440x900', ...(await fpsSamples(page)) };
  await frameStats(page, 'desktop-operating-dpr-1.5');
  await page.close();
}

async function phoneScenario() {
  const page = await newPage({ width: 390, height: 844, mobile: true });
  await load(page, 'phone');
  await waitFor(page, `!document.querySelector('.eng-loading')`, 90000);
  await sleep(2000);
  await shot(page, '17-phone-assembled');
  check('phone: no horizontal page scroll', await noOverflow(page));
  check('phone: parts list collapses behind a toggle', await evaluate(page, `getComputedStyle(document.querySelector('#eng-parts-list')).display === 'none'`));
  await click(page, '.eng-parts-toggle');
  await clickText(page, '.eng-parts li button', 'Stator windings');
  await sleep(800);
  check('phone: parts sheet opens and selection works', (await pressed(page)).join() === 'Stator windings');
  await evaluate(page, `document.querySelector('.eng-parts').scrollIntoView()`);
  await shot(page, '18-phone-parts-open');
  await evaluate(page, `window.scrollTo(0, 0)`);
  await clickText(page, '[role=tab]', 'Explode');
  await sleep(1600);
  await shot(page, '19-phone-exploded');
  check('phone: no horizontal scroll with controls expanded', await noOverflow(page));
  await clickText(page, '.eng-explode button', 'Reassemble');
  await clickText(page, '[role=tab]', 'Operate');
  await clickText(page, '.eng-operate button', 'Run');
  await sleep(2000);
  report.frames.phoneLayoutOperatingFps = { devicePixelRatio: 1, viewport: '390x844 (emulated phone layout on this PC GPU, not a phone)', ...(await fpsSamples(page)) };
  await setSelect(page, '.eng-supply select', 'open-W');
  await sleep(500);
  check('phone: the supply menu fits and a fault experiment adds no horizontal scroll', await noOverflow(page) && await evaluate(page, `document.querySelector('.eng-supply select').getBoundingClientRect().right <= window.innerWidth`));
  await page.close();
}

async function fallbackScenarios() {
  const missing = await newPage({ failModel: true });
  await load(missing, 'missing-model');
  const fellBack = await waitFor(missing, `!!document.querySelector('.eng-notice') && !!document.querySelector('.eng-diagram svg')`, 30000);
  check('missing GLB falls back to the drawing view with an explanation', fellBack, await text(missing, '.eng-notice'));
  await shot(missing, '20-fallback-missing-model');
  await missing.close();

  const plain = await newPage({ noWebgl: true });
  await load(plain, 'no-webgl');
  const noGl = await waitFor(plain, `!!document.querySelector('.eng-notice') && !!document.querySelector('.eng-diagram svg')`, 20000);
  check('no WebGL starts in the drawing view with an explanation', noGl, await text(plain, '.eng-notice'));
  await clickText(plain, '.eng-parts li button', 'Fan cover');
  check('no WebGL: lesson and selection remain usable', (await pressed(plain)).join() === 'Fan cover');
  await shot(plain, '21-fallback-no-webgl');
  await plain.close();
}

/**
 * Supply experiments (ENG-002A). Stepping while paused makes each state exact:
 * one Step is 30 electrical degrees, so the field turns 15 mechanical degrees,
 * or, with a phase open, its strength moves along |cos(θ + 30°)|.
 */
async function experimentScenarios() {
  const page = await newPage();
  await load(page, 'experiments');
  await waitFor(page, `!!document.querySelector('.eng-canvas canvas') && !document.querySelector('.eng-loading')`, 90000);
  await sleep(1500);
  check('desktop: activity controls are visible without scrolling', await controlsOnScreen(page));
  await clickText(page, '[role=tab]', 'Operate');
  await sleep(500);
  const options = await evaluate(page, `[...document.querySelectorAll('.eng-supply select option')].map(o => o.value).join()`);
  check('Operate offers the normal supply, three phase swaps and three open phases', options === 'normal,swap-UV,swap-VW,swap-WU,open-U,open-V,open-W', options);

  let card = await text(page, '.eng-readout');
  check('normal supply: readouts say the field turns forwards and the motor starts', /Turns anticlockwise/.test(card) && /100% forward, 0% backward/.test(card) && /Starts and runs/.test(card) && !/in reverse/.test(card), card.replace(/\n/g, ' | '));
  const normalTurn = await stepTurn(page);
  check('normal supply: the 3D field poles turn anticlockwise, seen from the drive end', normalTurn > 3, `${normalTurn.toFixed(1)}° on screen per step`);

  await setSelect(page, '.eng-supply select', 'swap-VW');
  await sleep(500);
  check('choosing a supply restarts the demonstration from rest', (await text(page, '.eng-plot-values dd')) === '0°');
  card = await text(page, '.eng-readout');
  check('V and W swapped: readouts say the field turns backwards and the motor starts in reverse', /Turns clockwise/.test(card) && /0% forward, 100% backward/.test(card) && /Starts and runs in reverse/.test(card), card.replace(/\n/g, ' | '));
  const swappedTurn = await stepTurn(page);
  check('V and W swapped: the 3D field poles turn clockwise, seen from the drive end', swappedTurn < -3, `${swappedTurn.toFixed(1)}° on screen per step`);
  await clickText(page, '.eng-operate button', 'Run');
  await sleep(1500);
  await shot(page, '22-operate-reversed');
  await clickText(page, '.eng-operate button', 'Pause');

  await setSelect(page, '.eng-supply select', 'open-W');
  await sleep(500);
  card = await text(page, '.eng-readout');
  check('phase W open: readouts say the field pulses, splits evenly both ways and cannot start', /Pulses on a fixed axis/.test(card) && /50% forward, 50% backward/.test(card) && /Cannot start/.test(card), card.replace(/\n/g, ' | '));
  check('phase W open: current at rest is 87% of a normal start in U and V, and none in W', /87% of a normal start in U and V; none in W/.test(card));
  const values = await plotValues(page);
  check('phase W open: W carries nothing; U and V carry one current in opposite directions', values.W === 0 && Math.abs(values.U - 0.75) < 0.006 && Math.abs(values.U + values.V) < 0.006, JSON.stringify(values));
  const at0 = await dialPoles(page);
  await shot(page, '23-operate-phase-open');
  await clickText(page, '.eng-operate button', 'Step');
  await sleep(400);
  const at30 = await dialPoles(page);
  check('phase W open: the 3D poles stay in place and fade as the field weakens', samePlaces(at0, at30) && at0.every(p => Math.abs(p.opacity - 0.87) < 0.011) && at30.every(p => Math.abs(p.opacity - 0.5) < 0.011), `opacity ${at0[0]?.opacity} then ${at30[0]?.opacity}`);
  await clickText(page, '.eng-operate button', 'Step');
  await sleep(400);
  const at60 = await dialPoles(page);
  check('phase W open: at 60° the field and its poles vanish', at60.every(p => p.opacity === 0) && /0% of normal/.test(await text(page, '.eng-readout')));
  await clickText(page, '.eng-operate button', 'Step');
  await sleep(400);
  const at90 = await dialPoles(page);
  check('phase W open: the field returns on the same axis with north and south swapped', samePlaces(at0, at90, true) && at90.every(p => Math.abs(p.opacity - 0.5) < 0.011));

  // The same experiment in the 2D end view; the clock stands at 90 electrical degrees.
  await clickText(page, '.eng-view-tools button', 'Drawing view');
  await sleep(700);
  const states = [];
  for (let step = 0; step < 6; step++) {
    states.push(await endView(page));
    await clickText(page, '.eng-operate button', 'Step');
    await sleep(250);
  }
  const visible = states.filter(s => s.opacity > 0.05);
  check('drawing, phase W open: the field keeps to one axis (40° or 130°) and the rotor stays at rest', visible.length >= 4 && visible.every(s => [40, 130].some(a => Math.abs(poleDelta(s.north - a)) < 0.1)) && states.every(s => s.rotor === 0), states.map(s => `${s.north.toFixed(0)}°/${s.opacity}`).join(' '));
  check('drawing, phase W open: all 12 W slots carry no current', states.every(s => s.emptyW === 12));
  check('drawing, phase W open: the legend explains empty slots', /No current/.test(await text(page, '.eng-diagram-legend')));
  // Choosing another supply and back restarts at 0°, where the field is at 87 %.
  await setSelect(page, '.eng-supply select', 'normal');
  await sleep(300);
  await setSelect(page, '.eng-supply select', 'open-W');
  await sleep(400);
  await shot(page, '24-drawing-end-phase-open');
  await setSelect(page, '.eng-supply select', 'swap-VW');
  await sleep(300);
  const swap0 = await endView(page);
  await clickText(page, '.eng-operate button', 'Step');
  await sleep(300);
  const swap1 = await endView(page);
  check('drawing, V and W swapped: the field turns 15° clockwise per step and the rotor follows', Math.abs(poleDelta(swap1.north - swap0.north) + 15) < 0.1 && swap1.rotor < 0, `${swap0.north.toFixed(1)}° to ${swap1.north.toFixed(1)}°, rotor ${swap1.rotor.toFixed(1)}°`);
  await clickText(page, '.eng-view-tools button', '3D view');
  await sleep(1000);

  // A fault question links the experiment to diagnosis.
  await evaluate(page, `document.querySelector('.eng-fault-quiz').scrollIntoView()`);
  await clickText(page, '.eng-fault-quiz label', 'It runs backwards');
  check('fault question: a wrong answer explains why', (await text(page, '.eng-fault-quiz .eng-feedback')).startsWith('Not quite'));
  await clickText(page, '.eng-fault-quiz label', 'It cannot start');
  check('fault question: the single-phasing answer is accepted and saved', (await text(page, '.eng-fault-quiz .eng-feedback')).startsWith('Correct') && await evaluate(page, `JSON.parse(localStorage.getItem('kairo-engineering-progress')).singlePhase === true`));
  await shot(page, '25-fault-question');
  await page.close();
}

/** Once routed, the app shell draws a strip above the studio; the desktop workbench must still fit on one screen. */
async function shellStripScenario() {
  const page = await newPage();
  await page.send('Page.addScriptToEvaluateOnNewDocument', { source: PAGE_ERRORS });
  await load(page, 'shell-strip');
  await waitFor(page, `!document.querySelector('.eng-loading')`, 90000);
  await sleep(800);
  // The strip arrives after the studio has measured its place, as a shell bar that renders late would.
  await evaluate(page, ADD_SHELL_STRIP);
  await sleep(800);
  const layout = await evaluate(page, `({ above: getComputedStyle(document.querySelector('.engineering-studio')).getPropertyValue('--eng-above').trim(), bottom: Math.round(document.querySelector('.eng-controls').getBoundingClientRect().bottom), height: innerHeight, errors: window.__engErrors })`);
  check('below a 39 px app-shell strip, the desktop controls still end on screen', layout.above === '39px' && layout.bottom <= layout.height, JSON.stringify(layout));
  check('measuring the space above the studio raises no page errors', layout.errors.length === 0, layout.errors.join(' | '));
  await page.close();
}

const SCENARIOS = {
  desktop: desktopScenarios, density: densityScenario, 'reduced-motion': reducedMotionScenario, phone: phoneScenario,
  fallbacks: fallbackScenarios, experiments: experimentScenarios, 'shell-strip': shellStripScenario,
};
// ENG_ONLY=experiments,shell-strip runs just those groups while iterating; the evidence comes from a full run.
const ONLY = process.env.ENG_ONLY ? process.env.ENG_ONLY.split(',') : Object.keys(SCENARIOS);

async function main() {
  const unknown = ONLY.filter(name => !SCENARIOS[name]);
  if (unknown.length) throw new Error(`Unknown ENG_ONLY scenario: ${unknown.join(', ')}. Use: ${Object.keys(SCENARIOS).join(', ')}`);
  mkdirSync(SHOTS, { recursive: true });
  let server = null;
  if (!process.env.ENG_PREVIEW_URL) {
    await buildHarness();
    server = await serveHarness();
  }
  const graphics = process.env.ENG_RENDERER === 'swiftshader'
    ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    : ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist'];
  const browser = spawn(BROWSER, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--disable-sync', ...graphics, '--window-size=1440,900', 'about:blank',
  ], { stdio: 'ignore' });
  try {
    let ready = false;
    for (let i = 0; i < 240 && !ready; i++) {
      try { ready = (await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok; } catch { await sleep(250); }
    }
    if (!ready) throw new Error('browser did not expose the DevTools port');
    for (const name of ONLY) await SCENARIOS[name]();
  } catch (error) {
    check('browser check completed without a harness error', false, error.message);
  } finally {
    await closeBrowser();
    // On Windows, kill() ends only the parent; taskkill /T also ends Edge's helper processes.
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { stdio: 'ignore' });
    else browser.kill();
    server?.close();
    await sleep(1500);
    // Edge's helper processes can hold the profile briefly after the main process exits.
    try { rmSync(PROFILE, { recursive: true, force: true, maxRetries: 20, retryDelay: 500 }); } catch (error) { console.warn(`Could not remove ${PROFILE}: ${error.message}`); }
  }
  report.finished = new Date().toISOString();
  report.summary = { passed: report.checks.filter(c => c.pass).length, failed: report.checks.filter(c => !c.pass).length };
  writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\n${report.summary.passed} passed, ${report.summary.failed} failed. Console entries: ${report.console.length}. Report: ${REPORT}`);
  process.exitCode = report.summary.failed ? 1 : 0;
}

main();
