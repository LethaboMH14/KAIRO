// Integrated browser acceptance for the Engineering Studio inside the KAIRO app (ENG-ACCEPT-001).
//
//   node docs/engineering/acceptance/integrated-check.mjs
//
// 1. Copies the studio sources (index.html, configs and src/) into %TEMP%/kairo-accept/src-snapshot,
//    links node_modules, and records SHA-256 hashes of the integration files, so concurrent edits by
//    other sessions cannot change what is tested.
// 2. Type-checks the snapshot (tsc --noEmit) and builds it with the shared vite.config.ts into %TEMP%.
//    studio/dist is never written.
// 3. Serves the build plus the live studio/public assets, with single-page-app fallback, on 127.0.0.1:4186
//    (no API: /api/* answers 503), and drives headless Edge on the GPU over the DevTools protocol (port 9336).
// 4. Writes report.json and screenshots/ next to this file.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, rmdirSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const STUDIO = fileURLToPath(new URL('../../../studio/', import.meta.url));
const WORK = join(tmpdir(), 'kairo-accept');
const SNAPSHOT = join(WORK, 'src-snapshot');
const DIST = join(WORK, 'dist');
const SHOTS = join(HERE, 'screenshots');
const REPORT = join(HERE, 'report.json');
const SERVE_PORT = Number(process.env.ENG_ACCEPT_PORT ?? 4186);
const CDP_PORT = Number(process.env.ENG_ACCEPT_CDP_PORT ?? 9336);
const ORIGIN = `http://127.0.0.1:${SERVE_PORT}`;
const BROWSER = process.env.ENG_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PROFILE = join(tmpdir(), `kairo-accept-profile-${process.pid}`);

const sleep = ms => new Promise(done => setTimeout(done, ms));
const report = { started: new Date().toISOString(), origin: ORIGIN, browser: BROWSER, renderer: null, snapshot: {}, typecheck: null, build: null, checks: [], console: [], frames: {}, screenshots: [] };

function check(name, pass, detail = '') {
  report.checks.push({ name, pass: Boolean(pass), detail: String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

// ---------------------------------------------------------------- snapshot, type-check, build
function removeSnapshot() {
  const link = join(SNAPSHOT, 'node_modules');
  if (existsSync(link)) {
    // Remove the junction itself first; never recurse into the real node_modules.
    if (lstatSync(link).isSymbolicLink()) { try { unlinkSync(link); } catch { rmdirSync(link); } }
    else throw new Error(`${link} is not a link; refusing to delete`);
  }
  rmSync(SNAPSHOT, { recursive: true, force: true });
}

function sha256(path) { return createHash('sha256').update(readFileSync(path)).digest('hex'); }

function hashTree(dir) {
  const out = {};
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(out, hashTree(path));
    else out[relative(SNAPSHOT, path).split(sep).join('/')] = sha256(path);
  }
  return out;
}

async function snapshotAndBuild() {
  mkdirSync(WORK, { recursive: true });
  removeSnapshot();
  mkdirSync(SNAPSHOT, { recursive: true });
  for (const file of ['index.html', 'vite.config.ts', 'tsconfig.json', 'package.json']) cpSync(join(STUDIO, file), join(SNAPSHOT, file));
  cpSync(join(STUDIO, 'src'), join(SNAPSHOT, 'src'), { recursive: true });
  symlinkSync(join(STUDIO, 'node_modules'), join(SNAPSHOT, 'node_modules'), 'junction');
  report.snapshot = {
    takenAt: new Date().toISOString(),
    integration: Object.fromEntries(['src/StudioRouter.tsx', 'src/App.tsx', 'src/main.tsx', 'src/styles.css', 'index.html', 'vite.config.ts'].map(f => [f, sha256(join(SNAPSHOT, f))])),
    engineering: hashTree(join(SNAPSHOT, 'src/engineering')),
  };
  // The whole app is type-checked, but only Engineering and its integration points decide this acceptance;
  // errors elsewhere belong to other tasks and are recorded for their owners.
  const tsc = spawnSync(process.execPath, [join(STUDIO, 'node_modules/typescript/bin/tsc'), '--noEmit', '-p', join(SNAPSHOT, 'tsconfig.json')], { encoding: 'utf8' });
  const lines = `${tsc.stdout}${tsc.stderr}`.trim().split('\n').filter(Boolean);
  const errors = lines.filter(line => /error TS\d+/.test(line)).map(line => line.replace(/^.*src-snapshot\//, ''));
  const ours = errors.filter(line => /^src\/(engineering\/|StudioRouter\.tsx|App\.tsx|main\.tsx)/.test(line));
  report.typecheck = { exitCode: tsc.status, engineeringAndIntegrationErrors: ours, otherErrors: errors.filter(line => !ours.includes(line)) };
  check('Engineering and integration files type-check cleanly (whole-app tsc)', ours.length === 0, ours.slice(0, 3).join(' | '));
  const vite = await import(pathToFileURL(join(STUDIO, 'node_modules/vite/dist/node/index.js')).href);
  const result = await vite.build({ root: SNAPSHOT, configFile: join(SNAPSHOT, 'vite.config.ts'), publicDir: false, logLevel: 'warn', build: { outDir: DIST, emptyOutDir: true, chunkSizeWarningLimit: 4000 } });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(r => r.output);
  const engineeringChunks = outputs.filter(o => o.type === 'chunk' && /EngineeringStudio|MotorScene/.test(o.fileName));
  report.build = {
    files: outputs.length,
    engineeringChunks: engineeringChunks.map(o => ({ file: o.fileName, bytes: Buffer.byteLength(o.code) })),
    largest: outputs.map(o => ({ file: o.fileName, bytes: o.type === 'chunk' ? Buffer.byteLength(o.code) : Buffer.byteLength(o.source) })).sort((a, b) => b.bytes - a.bytes).slice(0, 6),
  };
  check('full app builds with the shared Vite config', existsSync(join(DIST, 'index.html')) && engineeringChunks.length >= 2, engineeringChunks.map(c => c.fileName).join(', '));
}

// ---------------------------------------------------------------- static server with SPA fallback
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.hdr': 'application/octet-stream', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.md': 'text/markdown; charset=utf-8', '.webmanifest': 'application/manifest+json' };

function serve() {
  const roots = [DIST, join(STUDIO, 'public')];
  const server = createServer(async (request, response) => {
    const path = decodeURIComponent(new URL(request.url, ORIGIN).pathname);
    if (path === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    if (path.startsWith('/api/')) {
      response.writeHead(503, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'This static acceptance server has no API.' }));
      return;
    }
    if (extname(path)) {
      for (const dir of roots) {
        const file = resolve(dir, `.${path}`);
        if (!file.startsWith(resolve(dir) + sep)) continue;
        try {
          const body = await readFile(file);
          response.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
          response.end(body);
          return;
        } catch { /* next root */ }
      }
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('not found');
      return;
    }
    // Client routes such as /engineering get the app shell, as the production server does.
    response.writeHead(200, { 'Content-Type': TYPES['.html'] });
    response.end(await readFile(join(DIST, 'index.html')));
  });
  return new Promise(done => server.listen(SERVE_PORT, '127.0.0.1', () => done(server)));
}

// ---------------------------------------------------------------- DevTools protocol helpers
const NO_WEBGL = `(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (type, ...rest) { if (String(type).startsWith('webgl') || type === 'experimental-webgl') return null; return original.call(this, type, ...rest); }; })();`;

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Set();
    this.ws.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve: ok, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message)); else ok(message.result);
      } else if (message.method) for (const listener of this.listeners) listener(message);
    };
  }
  open() { return new Promise((ok, fail) => { this.ws.onopen = ok; this.ws.onerror = fail; }); }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, fail) => this.pending.set(id, { resolve: ok, reject: fail }));
  }
  async close() {
    this.ws.close();
    if (this.targetId) await fetch(`http://127.0.0.1:${CDP_PORT}/json/close/${this.targetId}`).catch(() => {});
    await sleep(300);
  }
}

async function newPage({ width = 1440, height = 900, mobile = false, reduced = false, noWebgl = false, failModel = false } = {}) {
  const target = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const page = new Cdp(target.webSocketDebuggerUrl);
  await page.open();
  page.targetId = target.id;
  page.listeners.add(message => {
    if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type)) {
      report.console.push({ scenario: page.scenario, type: message.params.type, text: message.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 300) });
    }
    if (message.method === 'Runtime.exceptionThrown') {
      report.console.push({ scenario: page.scenario, type: 'exception', text: (message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text).slice(0, 300) });
    }
    if (message.method === 'Log.entryAdded' && ['error', 'warning'].includes(message.params.entry.level)) {
      report.console.push({ scenario: page.scenario, type: `log-${message.params.entry.level}`, text: `${message.params.entry.text} ${message.params.entry.url ?? ''}`.slice(0, 300) });
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
  if (noWebgl) await page.send('Page.addScriptToEvaluateOnNewDocument', { source: NO_WEBGL });
  if (failModel) await page.send('Fetch.enable', { patterns: [{ urlPattern: '*induction-motor.glb*', requestStage: 'Request' }] });
  return page;
}

async function evaluate(page, expression) {
  const result = await page.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(`${expression.slice(0, 80)}: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`);
  return result.result.value;
}

async function waitFor(page, expression, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { if (await evaluate(page, expression)) return true; } catch { /* page may be navigating */ }
    await sleep(150);
  }
  return false;
}

async function go(page, path, scenario) {
  page.scenario = scenario;
  await page.send('Page.navigate', { url: `${ORIGIN}${path}` });
  await waitFor(page, `document.readyState === 'complete'`, 30000);
}

async function shot(page, name) {
  const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(data, 'base64');
  writeFileSync(join(SHOTS, `${name}.png`), buffer);
  report.screenshots.push(`docs/engineering/acceptance/screenshots/${name}.png`);
  return buffer;
}

async function canvasShot(page, name) {
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 4, y: 4 });
  await evaluate(page, `(() => { const s = document.createElement('style'); s.id = 'accept-hide'; s.textContent = '.eng-caption,.eng-title,.eng-view-tools,.eng-scene-label{visibility:hidden!important}'; document.head.append(s); return true; })()`);
  await sleep(400);
  const r = await evaluate(page, `(() => { const r = document.querySelector('.eng-canvas canvas').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`);
  const { data } = await page.send('Page.captureScreenshot', { format: 'png', clip: { ...r, scale: 1 } });
  await evaluate(page, `document.getElementById('accept-hide').remove()`);
  const buffer = Buffer.from(data, 'base64');
  writeFileSync(join(SHOTS, `${name}.png`), buffer);
  report.screenshots.push(`docs/engineering/acceptance/screenshots/${name}.png`);
  return buffer;
}

const click = (page, selector) => evaluate(page, `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('missing ' + ${JSON.stringify(selector)}); el.click(); return true; })()`);
const clickText = (page, selector, text) => evaluate(page, `(() => { const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find(e => e.textContent.trim().includes(${JSON.stringify(text)})); if (!el) throw new Error('missing ' + ${JSON.stringify(text)}); el.click(); return true; })()`);
const setInput = (page, selector, value) => evaluate(page, `(() => { const el = document.querySelector(${JSON.stringify(selector)}); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(el, ${JSON.stringify(String(value))}); el.dispatchEvent(new Event('input', { bubbles: true })); return el.value; })()`);
const text = (page, selector) => evaluate(page, `document.querySelector(${JSON.stringify(selector)})?.textContent?.trim() ?? null`);
const pressed = page => evaluate(page, `[...document.querySelectorAll('.eng-parts button[aria-pressed="true"] .eng-part-name')].map(e => e.textContent)`);
const noOverflow = page => evaluate(page, `document.documentElement.scrollWidth <= window.innerWidth + 1`);
/** Waits for the 3D studio; on timeout records what the page shows instead, with a screenshot. */
async function studioReady(page) {
  if (await waitFor(page, `!!document.querySelector('.engineering-studio .eng-canvas canvas') && !document.querySelector('.eng-loading')`, 90000)) return true;
  const state = await evaluate(page, `({ path: location.pathname, studio: !!document.querySelector('.engineering-studio'), canvas: !!document.querySelector('.eng-canvas canvas'), loading: document.querySelector('.eng-loading')?.textContent ?? null, drawing: !!document.querySelector('.eng-diagram svg'), notice: document.querySelector('.eng-notice')?.textContent ?? null, visibility: document.visibilityState })`).catch(error => ({ error: error.message }));
  report.diagnostics = [...(report.diagnostics ?? []), { scenario: page.scenario, state }];
  await shot(page, `diagnostic-${page.scenario}`).catch(() => {});
  return false;
}

async function key(page, keyName, code, keyCode) {
  const textValue = keyName === 'Enter' ? '\r' : undefined;
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode, ...(textValue ? { text: textValue, unmodifiedText: textValue } : {}) });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
}

async function clickAt(page, x, y) {
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
    await page.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: type === 'mouseMoved' ? 0 : 1 });
    await sleep(40);
  }
}

async function fpsSamples(page, windows = 3, ms = 2000) {
  const samples = [];
  for (let i = 0; i < windows; i++) {
    samples.push(await evaluate(page, `new Promise(done => { let n = 0; const start = performance.now(); const step = now => { n++; if (now - start < ${ms}) requestAnimationFrame(step); else done(Math.round((n * 1000 / (now - start)) * 10) / 10); }; requestAnimationFrame(step); })`));
  }
  return { samples, median: [...samples].sort((a, b) => a - b)[Math.floor(windows / 2)] };
}

// ---------------------------------------------------------------- scenarios
async function desktopJourney() {
  const page = await newPage();
  await go(page, '/', 'desktop-journey');
  check('home page renders the studio shell', await waitFor(page, `!!document.querySelector('.topbar') && !!document.querySelector('.app-shell')`, 30000));
  report.renderer = await evaluate(page, `(() => { const gl = document.createElement('canvas').getContext('webgl2'); const ext = gl && gl.getExtension('WEBGL_debug_renderer_info'); return gl ? (ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) : 'none'; })()`);
  const homeTitle = await evaluate(page, 'document.title');
  await sleep(1500);
  await shot(page, 'A1-home');

  // Keyboard path: focus Explore studios, Enter opens the picker; focus the Engineering row, Enter navigates.
  await evaluate(page, `[...document.querySelectorAll('.topbar button')].find(b => b.textContent.includes('Explore studios')).focus()`);
  await key(page, 'Enter', 'Enter', 13);
  check('Explore studios opens the studio picker', await waitFor(page, `!!document.querySelector('.modal[role=dialog]')`, 5000));
  const link = await evaluate(page, `(() => { const a = document.querySelector('.modal a.studio-row[href="/engineering"]'); return a ? { label: a.textContent.trim(), focusedFirst: document.activeElement !== null } : null; })()`);
  check('picker lists Engineering Studio with a link to /engineering', !!link, link?.label);
  // Observation for the home page owner, not an Engineering criterion: do 3D labels draw over the modal?
  report.observations = [...(report.observations ?? []), {
    what: 'Home-page 3D labels above the studio picker modal',
    labelsAboveModal: await evaluate(page, `(() => { const m = document.querySelector('.modal').getBoundingClientRect(); return [...document.querySelectorAll('.scene-label')].filter(l => { const r = l.getBoundingClientRect(); const z = Number(getComputedStyle(l.closest('div[style*="z-index"]') ?? l).zIndex) || 0; return r.width > 0 && r.right > m.left && r.left < m.right && r.bottom > m.top && r.top < m.bottom && z > 20; }).map(l => l.textContent); })()`),
  }];
  await shot(page, 'A2-picker');
  await evaluate(page, `document.querySelector('.modal a.studio-row[href="/engineering"]').focus()`);
  await key(page, 'Enter', 'Enter', 13);
  check('keyboard Enter on the picker link opens /engineering', await waitFor(page, `location.pathname === '/engineering' && !!document.querySelector('.engineering-studio')`, 30000));
  page.scenario = 'desktop-engineering';
  check('3D motor loads inside the app', await studioReady(page));
  check('document title switches to the Engineering Studio', (await evaluate(page, 'document.title')) === 'KAIRO · Engineering Studio');
  check('desktop: no horizontal page scroll in /engineering', await evaluate(page, `document.documentElement.scrollWidth <= window.innerWidth + 1`));
  const fold = await evaluate(page, `(() => { const c = document.querySelector('.eng-controls').getBoundingClientRect(); const s = document.querySelector('.engineering-studio').getBoundingClientRect(); return { controlsBottom: Math.round(c.bottom), viewport: innerHeight, studioTop: Math.round(s.top), above: [...document.body.querySelectorAll('#root > *, #root > * > *')].filter(e => !e.closest('.engineering-studio') && e.getBoundingClientRect().bottom <= s.top + 1 && e.getBoundingClientRect().height > 0).map(e => (e.className || e.tagName).toString().slice(0, 60)) }; })()`);
  report.layout = { desktop1440x900: fold };
  check('desktop: activity controls are visible without scrolling', fold.controlsBottom <= fold.viewport, `controls end at ${fold.controlsBottom}px of ${fold.viewport}px; studio starts ${fold.studioTop}px down`);
  await sleep(2000);
  await shot(page, 'A3-engineering-loaded');

  const rect = await evaluate(page, `(() => { const r = document.querySelector('.eng-canvas canvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
  await clickAt(page, rect.x + rect.w * 0.5, rect.y + rect.h * 0.55);
  await sleep(800);
  const picked = await pressed(page);
  check('clicking the model selects the part under the pointer', picked.length === 1, picked.join(', '));
  await clickText(page, '.eng-parts li button', 'Squirrel cage');
  await sleep(500);
  check('parts list selection updates the detail card', (await text(page, '.eng-part-card h2')) === 'Squirrel cage');
  await click(page, '.eng-hint .eng-link');
  await sleep(900);
  check('Show inside turns on the cutaway', await evaluate(page, `document.querySelector('.eng-view-tools button').getAttribute('aria-pressed') === 'true'`));
  await shot(page, 'A4-cutaway-cage');

  await clickText(page, '.eng-card-actions button', 'Clear');
  await clickText(page, '.eng-views button', 'Reset view');
  await sleep(1400);
  const before = await canvasShot(page, 'A5-reference-before-explode');
  await clickText(page, '[role=tab]', 'Explode');
  await sleep(1600);
  check('Explode separates the parts', (await evaluate(page, `document.querySelector('.eng-explode input').value`)) === '100');
  await shot(page, 'A6-exploded');
  for (const value of [70, 10, 95, 35, 80, 0, 100, 25, 90]) { await setInput(page, '.eng-explode input', value); await sleep(60); }
  await clickText(page, '.eng-explode button', 'Reassemble');
  await sleep(200);
  await clickText(page, '[role=tab]', 'Inspect');
  await clickText(page, '.eng-views button', 'Reset view');
  await sleep(1800);
  const after = await canvasShot(page, 'A7-reference-after-reassembly');
  check('rapid reversals then Reassemble give a byte-identical canvas', Buffer.compare(before, after) === 0, `${before.length} vs ${after.length} bytes`);

  await clickText(page, '[role=tab]', 'Operate');
  await clickText(page, '.eng-operate button', 'Run');
  await sleep(2500);
  report.frames.operatingFps = { devicePixelRatio: 1, viewport: '1440x900', ...(await fpsSamples(page)) };
  await shot(page, 'A8-operating');
  await clickText(page, '.eng-operate button', 'Pause');
  let frozen = null;
  for (let i = 0, previous = null; i < 20; i++) { frozen = await text(page, '.eng-plot-values'); if (frozen === previous) break; previous = frozen; await sleep(700); }
  await sleep(2000);
  check('Pause freezes the operating angle', frozen === (await text(page, '.eng-plot-values')), frozen);
  await clickText(page, '.eng-operate button', 'Run');
  await sleep(400);
  await clickText(page, '[role=tab]', 'Explode');
  await sleep(500);
  check('exploding while running pauses with a visible reason', (await text(page, '.eng-caption p')).includes('paused'));
  await clickText(page, '[role=tab]', 'Operate');
  await sleep(300);
  check('Run stays disabled until reassembly', await evaluate(page, `[...document.querySelectorAll('.eng-operate button')].find(b => b.textContent.includes('Run')).disabled`));
  await clickText(page, '.eng-paused button', 'Reassemble');
  await sleep(1300);

  await evaluate(page, `document.querySelector('[role=tab][aria-selected=true]').focus()`);
  await key(page, 'ArrowLeft', 'ArrowLeft', 37);
  check('tab arrows move focus without activating (no accidental explode)', (await evaluate(page, 'document.activeElement.textContent')) === 'Explode' && (await text(page, '[role=tab][aria-selected=true]')) === 'Operate');
  await key(page, 'ArrowLeft', 'ArrowLeft', 37);
  await key(page, 'Enter', 'Enter', 13);
  await sleep(200);
  check('Enter activates the focused tab', (await text(page, '[role=tab][aria-selected=true]')) === 'Inspect');

  await clickText(page, '.eng-view-tools button', 'Drawing view');
  await sleep(600);
  await evaluate(page, `[...document.querySelectorAll('.eng-diagram-part')].find(g => g.getAttribute('aria-label').includes('Rotor core')).focus()`);
  await key(page, 'Enter', 'Enter', 13);
  await sleep(300);
  check('drawing view: keyboard selection works inside the app', (await pressed(page)).join() === 'Rotor core');
  await shot(page, 'A9-drawing-view');
  await clickText(page, '.eng-view-tools button', '3D view');
  check('3D view returns after the drawing view', await studioReady(page));

  await evaluate(page, `document.querySelector('.eng-practise').scrollIntoView()`);
  for (const [value, ok] of [['0', false], ['abc', false], ['401', false], ['50', true], ['60', true]]) {
    await setInput(page, '.eng-calc-inputs input[type=text]', value);
    await sleep(80);
    const shown = await text(page, '#eng-calc-result');
    const accepted = !(await evaluate(page, `document.querySelector('#eng-calc-result').classList.contains('is-error')`));
    check(`calculator ${ok ? 'accepts' : 'rejects'} "${value}" Hz`, accepted === ok && !/NaN|Infinity/.test(shown), shown);
  }
  await clickText(page, '.eng-chips label', '4');
  await sleep(80);
  check('calculator: 60 Hz with 4 poles gives 1 800 r/min', (await text(page, '#eng-calc-result strong')).replace(/\s/g, '') === '1800r/min');
  await clickText(page, '.eng-quiz label', 'Stator core and windings');
  check('quiz accepts Stator with an explanation', (await text(page, '.eng-quiz .eng-feedback')).startsWith('Correct'));
  await shot(page, 'A10-practise');

  // Exit, history and deep links.
  await evaluate(page, 'window.scrollTo(0, 0)');
  await click(page, '.eng-exit');
  check('Back to studios returns to the home page', await waitFor(page, `location.pathname === '/' && !!document.querySelector('.app-shell')`, 30000));
  page.scenario = 'desktop-return';
  check('home title is restored after leaving', (await evaluate(page, 'document.title')) === homeTitle, homeTitle);
  check('Engineering styles do not remain on the home page', await evaluate(page, `!document.querySelector('.engineering-studio') && ![...document.styleSheets].some(s => { try { return [...s.cssRules].some(r => r.selectorText && r.selectorText.includes('.engineering-studio')); } catch { return false; } })`));
  await shot(page, 'A11-home-after-exit');
  page.scenario = 'desktop-history';
  await evaluate(page, 'history.back()').catch(() => {});
  check('browser Back from home returns to /engineering', await waitFor(page, `location.pathname === '/engineering' && !!document.querySelector('.engineering-studio')`, 30000));
  check('studio loads again after history navigation', await studioReady(page));
  await evaluate(page, 'history.forward()').catch(() => {});
  check('browser Forward returns to the home page', await waitFor(page, `location.pathname === '/' && !!document.querySelector('.app-shell')`, 30000));
  await page.close();

  const direct = await newPage();
  await go(direct, '/engineering', 'deep-link');
  check('direct link to /engineering loads the studio', await studioReady(direct));
  await direct.close();

  // One direct load failed without console output in the first acceptance run; repeat it in fresh tabs.
  let loaded = 0;
  for (let i = 1; i <= 5; i++) {
    const tab = await newPage();
    await go(tab, '/engineering', `deep-link-repeat-${i}`);
    if (await studioReady(tab)) loaded++;
    await tab.close();
  }
  check('direct link loads in 5 of 5 fresh tabs', loaded === 5, `${loaded}/5`);
}

async function phoneJourney() {
  const page = await newPage({ width: 390, height: 844, mobile: true });
  await go(page, '/', 'phone-journey');
  await waitFor(page, `!!document.querySelector('.topbar')`, 30000);
  await clickText(page, '.topbar button', 'Explore studios');
  await waitFor(page, `!!document.querySelector('.modal[role=dialog]')`, 5000);
  await sleep(400);
  check('phone: picker fits without horizontal scroll', await noOverflow(page));
  await shot(page, 'B1-phone-picker');
  await click(page, '.modal a.studio-row[href="/engineering"]');
  await waitFor(page, `location.pathname === '/engineering'`, 30000);
  page.scenario = 'phone-engineering';
  check('phone: studio loads from the picker', await studioReady(page));
  await sleep(1500);
  check('phone: no horizontal page scroll in /engineering', await noOverflow(page));
  await shot(page, 'B2-phone-engineering');
  await clickText(page, '[role=tab]', 'Explode');
  await sleep(1600);
  await shot(page, 'B3-phone-exploded');
  await click(page, '.eng-exit');
  check('phone: Back to studios returns home', await waitFor(page, `location.pathname === '/' && !!document.querySelector('.app-shell')`, 30000));
  await page.close();
}

async function reducedMotion() {
  const page = await newPage({ reduced: true });
  await go(page, '/engineering', 'reduced-motion');
  await studioReady(page);
  await sleep(1500);
  check('reduced motion: system preference ticks the control', await evaluate(page, `document.querySelector('.eng-switch input').checked`));
  await clickText(page, '[role=tab]', 'Explode');
  await sleep(150);
  const quick = await shot(page, 'C1-reduced-explode');
  await sleep(1200);
  const later = Buffer.from((await page.send('Page.captureScreenshot', { format: 'png' })).data, 'base64');
  check('reduced motion: explode and camera snap without travel', Buffer.compare(quick, later) === 0);
  await page.close();
}

async function fallbacks() {
  const missing = await newPage({ failModel: true });
  await go(missing, '/engineering', 'missing-model');
  check('missing GLB: drawing view and explanation inside the app', await waitFor(missing, `!!document.querySelector('.eng-notice') && !!document.querySelector('.eng-diagram svg')`, 30000), await text(missing, '.eng-notice'));
  await shot(missing, 'D1-missing-model');
  await missing.close();

  const plain = await newPage({ noWebgl: true });
  await go(plain, '/engineering', 'no-webgl');
  check('no WebGL: drawing view and explanation inside the app', await waitFor(plain, `!!document.querySelector('.eng-notice') && !!document.querySelector('.eng-diagram svg')`, 20000), await text(plain, '.eng-notice'));
  await clickText(plain, '.eng-parts li button', 'Stator windings');
  check('no WebGL: selection still works', (await pressed(plain)).join() === 'Stator windings');
  await shot(plain, 'D2-no-webgl');
  await plain.close();
}

async function main() {
  mkdirSync(SHOTS, { recursive: true });
  // Profiles from earlier runs can stay locked for a while after Edge exits; sweep them now.
  for (const entry of readdirSync(tmpdir(), { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.startsWith('kairo-accept-profile-')) {
      try { rmSync(join(tmpdir(), entry.name), { recursive: true, force: true }); } catch { /* still locked; next run */ }
    }
  }
  let server = null;
  let browser = null;
  try {
    await snapshotAndBuild();
    server = await serve();
    browser = spawn(BROWSER, [
      '--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${PROFILE}`, '--no-first-run', '--no-default-browser-check',
      '--disable-extensions', '--disable-sync', '--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-size=1440,900', 'about:blank',
    ], { stdio: 'ignore' });
    let ready = false;
    for (let i = 0; i < 240 && !ready; i++) {
      try { ready = (await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).ok; } catch { await sleep(250); }
    }
    if (!ready) throw new Error('browser did not expose the DevTools port');
    await desktopJourney();
    await phoneJourney();
    await reducedMotion();
    await fallbacks();
  } catch (error) {
    check('acceptance run completed without a harness error', false, error.message);
  } finally {
    if (browser) {
      if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(browser.pid), '/T', '/F'], { stdio: 'ignore' });
      else browser.kill();
    }
    server?.close();
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
