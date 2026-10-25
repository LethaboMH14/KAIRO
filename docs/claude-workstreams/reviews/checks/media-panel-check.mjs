// REVIEW-C1-C3: browser checks of C3's prototype, design/claude-workstreams/media-panel/media-panel.html.
//
//   node docs/claude-workstreams/reviews/checks/media-panel-check.mjs
//
// Serves the prototype on 127.0.0.1:4187 and drives headless Edge over the DevTools protocol (port 9337).
// No request leaves this machine. Every page request is paused with Fetch: requests to YouTube hosts are held
// or answered with a local stub that says "Not YouTube", and anything else off 127.0.0.1 is failed. As a
// backstop the browser runs with every host name mapped to NOTFOUND and with no proxy.
// Writes media-panel-report.json here and screenshots to ../screenshots.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const PROTOTYPE = fileURLToPath(new URL('../../../../design/claude-workstreams/media-panel/media-panel.html', import.meta.url));
const SHOTS = fileURLToPath(new URL('../screenshots/', import.meta.url));
const REPORT = join(HERE, 'media-panel-report.json');
const SERVE_PORT = 4187;
const CDP_PORT = 9337;
const ORIGIN = `http://127.0.0.1:${SERVE_PORT}`;
const PAGE = `${ORIGIN}/media-panel.html`;
const BROWSER = process.env.ENG_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PROFILE = join(tmpdir(), `kairo-review-profile-${process.pid}`);
const SYNTHETIC_ID = 'sim_test_00'; // passes /^[A-Za-z0-9_-]{11}$/; not a real video
const STUB_DOC = '<!doctype html><title>review stub</title><body style="margin:0;background:#333;color:#fff;font:14px sans-serif">Review stub served by the test harness. Not YouTube.</body>';
const STUB_JS = '/* Review stub served by the test harness. Not YouTube code. */';

const sleep = ms => new Promise(done => setTimeout(done, ms));
const html = readFileSync(PROTOTYPE);
const report = {
  task: 'REVIEW-C1-C3',
  started: new Date().toISOString(),
  prototype: { path: 'design/claude-workstreams/media-panel/media-panel.html', bytes: html.length, sha256: createHash('sha256').update(html).digest('hex') },
  origin: ORIGIN,
  browser: null,
  safeguards: 'Fetch interception of every request (YouTube hosts held or stubbed locally, other hosts failed); --host-resolver-rules maps every host to NOTFOUND except 127.0.0.1; --no-proxy-server; video ID is the synthetic sim_test_00.',
  checks: [],
  measurements: {},
  requests: [],
  served: [],
  console: [],
  screenshots: [],
};

function check(name, pass, detail = '') {
  report.checks.push({ name, pass: Boolean(pass), detail: String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

function serve() {
  const server = createServer((request, response) => {
    report.served.push(request.url);
    if (request.url === '/media-panel.html') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(html);
      return;
    }
    response.writeHead(request.url === '/favicon.ico' ? 204 : 404);
    response.end();
  });
  return new Promise(done => server.listen(SERVE_PORT, '127.0.0.1', () => done(server)));
}

// ---------------------------------------------------------------- DevTools protocol helpers
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

/** Routes one paused request. Nothing is ever continued to a host other than 127.0.0.1. */
function onRequest(page, params) {
  const url = new URL(params.request.url);
  const headers = params.request.headers;
  const entry = { scenario: page.scenario, phase: page.phase, url: params.request.url, type: params.resourceType, referer: headers.Referer ?? headers.referer ?? null };
  const reply = (method, extra) => page.send(method, { requestId: params.requestId, ...extra }).catch(() => {});
  if (url.hostname === '127.0.0.1') {
    entry.action = 'served-locally';
    reply('Fetch.continueRequest');
  } else if (/(^|\.)youtube(-nocookie)?\.com$/.test(url.hostname)) {
    if (page.ytMode === 'hold') {
      entry.action = 'held-never-sent';
    } else {
      entry.action = 'stubbed-never-sent';
      const script = params.resourceType === 'Script';
      reply('Fetch.fulfillRequest', { responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: script ? 'text/javascript' : 'text/html' }], body: Buffer.from(script ? STUB_JS : STUB_DOC).toString('base64') });
    }
  } else {
    entry.action = 'failed-never-sent';
    reply('Fetch.failRequest', { errorReason: 'BlockedByClient' });
  }
  report.requests.push(entry);
}

async function size(page, width, height, mobile = false) {
  await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  await page.send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
  await sleep(300);
}

async function fresh(scenario, { width = 1280, height = 800, mobile = false, scheme = 'light', ytMode = 'hold' } = {}) {
  const target = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const page = new Cdp(target.webSocketDebuggerUrl);
  await page.open();
  Object.assign(page, { targetId: target.id, scenario, phase: 'load', ytMode });
  page.listeners.add(({ method, params }) => {
    if (method === 'Fetch.requestPaused') onRequest(page, params);
    if (method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(params.type)) {
      report.console.push({ scenario, type: params.type, text: params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 300) });
    }
    if (method === 'Runtime.exceptionThrown') report.console.push({ scenario, type: 'exception', text: (params.exceptionDetails.exception?.description ?? params.exceptionDetails.text).slice(0, 300) });
    if (method === 'Log.entryAdded' && ['error', 'warning'].includes(params.entry.level)) {
      report.console.push({ scenario, type: `log-${params.entry.level}`, text: `${params.entry.text} ${params.entry.url ?? ''}`.slice(0, 300) });
    }
  });
  await page.send('Runtime.enable');
  await page.send('Log.enable');
  await page.send('Page.enable');
  await page.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
  await size(page, width, height, mobile);
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }, { name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await page.send('Page.navigate', { url: PAGE });
  await waitFor(page, `document.readyState === 'complete' && !!document.getElementById('play')`, 15000);
  return page;
}

async function evaluate(page, expression) {
  const result = await page.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(`${expression.slice(0, 80)}: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`);
  return result.result.value;
}

async function waitFor(page, expression, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { if (await evaluate(page, expression)) return true; } catch { /* navigating */ }
    await sleep(100);
  }
  return false;
}

async function shot(page, name) {
  const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(SHOTS, `${name}.png`), Buffer.from(data, 'base64'));
  report.screenshots.push(`docs/claude-workstreams/reviews/screenshots/${name}.png`);
}

async function key(page, keyName, code, keyCode) {
  const textValue = keyName === 'Enter' ? '\r' : undefined;
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode, ...(textValue ? { text: textValue, unmodifiedText: textValue } : {}) });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
}

const click = (page, selector) => evaluate(page, `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('missing ' + ${JSON.stringify(selector)}); el.click(); return true; })()`);
const text = (page, selector) => evaluate(page, `document.querySelector(${JSON.stringify(selector)})?.textContent?.trim() ?? null`);
const showPanel = page => evaluate(page, `(document.getElementById('panel').scrollIntoView({ block: 'start' }), true)`);
const rect = (page, selector) => evaluate(page, `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return null; const r = el.getBoundingClientRect(); return { width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10 }; })()`);
const active = page => evaluate(page, `(() => { const e = document.activeElement; const id = !e || e === document.body ? 'BODY' : e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.dataset.preset ? '[' + e.dataset.preset + ']' : ''); const cs = e && e !== document.body ? getComputedStyle(e) : null; return { id, outline: cs ? cs.outlineStyle + ' ' + cs.outlineWidth : null }; })()`);
const offHost = scenario => report.requests.filter(r => r.scenario === scenario && !r.url.startsWith(ORIGIN));

/** WCAG 2 contrast of an element's text against the first opaque background behind it. */
const CONTRAST = `(selector => {
  const el = document.querySelector(selector);
  if (!el) return null;
  const parse = c => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(/[\\s,\\/]+/).filter(Boolean).map(Number); return { r, g, b, a }; };
  const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = c => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  let bg = { r: 255, g: 255, b: 255, a: 1 };
  for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { bg = c; break; } }
  const cs = getComputedStyle(el);
  const fg = parse(cs.color);
  const [hi, lo] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  const px = parseFloat(cs.fontSize);
  const large = px >= 24 || (Number(cs.fontWeight) >= 700 && px >= 18.66);
  return { color: cs.color, background: 'rgb(' + bg.r + ', ' + bg.g + ', ' + bg.b + ')', fontPx: px, ratio: Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100, needs: large ? 3 : 4.5 };
})`;

// ---------------------------------------------------------------- scenarios
async function networkAndOffline() {
  const page = await fresh('network');
  await sleep(600);
  await shot(page, 'review-c3-01-desktop-video');
  page.phase = 'offline-play';
  await click(page, '#play');
  await sleep(2300);
  const status = await text(page, '#st');
  check('Page load and offline simulated play request nothing beyond 127.0.0.1', offHost('network').length === 0 && status === 'playing',
    `${report.requests.filter(r => r.scenario === 'network').length} request(s), all to 127.0.0.1; status "${status}"`);
  await click(page, '#play');
  page.phase = 'presets';
  for (const preset of ['passage', 'artifact', 'video']) { await click(page, `[data-preset="${preset}"]`); await sleep(150); }
  page.phase = 'consent-stage';
  await click(page, '#consent');
  await sleep(400);
  const stage = await text(page, '#stage');
  check('Presets and the consent stage request nothing beyond 127.0.0.1', offHost('network').length === 0 && /No request to YouTube/.test(stage), stage.slice(0, 60));
  await page.close();
}

async function consentLayout() {
  for (const [label, width, height, mobile] of [['390', 390, 844, true], ['1280', 1280, 800, false]]) {
    const page = await fresh(`consent-${label}`, { width, height, mobile });
    await click(page, '#consent');
    await sleep(300);
    await showPanel(page);
    await sleep(200);
    const m = await evaluate(page, `(() => {
      const stage = document.getElementById('stage');
      const box = stage.getBoundingClientRect();
      const inner = stage.firstElementChild.getBoundingClientRect();
      const go = document.getElementById('go').getBoundingClientRect();
      const vid = document.getElementById('vid').getBoundingClientRect();
      const inside = r => r.top >= box.top - 0.5 && r.bottom <= box.bottom + 0.5 && r.left >= box.left - 0.5 && r.right <= box.right + 0.5;
      const hit = document.elementFromPoint(go.left + go.width / 2, go.top + go.height / 2);
      const width = s => Math.round(document.querySelector(s).getBoundingClientRect().width * 10) / 10;
      return { box: { width: box.width, height: box.height }, contentHeight: Math.round(inner.height), goInside: inside(go), inputInside: inside(vid), goHit: hit ? (hit.id || hit.tagName) : null,
        scrollWidth: document.documentElement.scrollWidth, innerWidth, visualViewportScale: visualViewport.scale, main: width('main'), grid: width('.grid'), panel: width('#panel'), lesson: width('#lesson') };
    })()`);
    report.measurements[`consent-${label}`] = m;
    check(`Consent stage at ${label}px shows the ID field and "Agree and load player" uncut inside the player box`, m.goInside && m.inputInside && m.goHit === 'go',
      `box ${m.box.width}x${m.box.height}, stage content ${m.contentHeight}px tall, button inside: ${m.goInside}, field inside: ${m.inputInside}`);
    // Compared with the device width, not innerWidth: a phone browser zooms out to fit wider content, which grows innerWidth too.
    if (mobile) check(`Page content fits the ${width}px device width`, m.scrollWidth <= width + 1, `content ${m.scrollWidth}px, innerWidth ${m.innerWidth}, zoom ${m.visualViewportScale}, grid ${m.grid}px in main ${m.main}px, panel ${m.panel}px`);
    await shot(page, mobile ? 'review-c3-02-consent-390' : 'review-c3-03-consent-1280');
    await page.close();
  }
}

async function agree(page) {
  await click(page, '#consent');
  await sleep(200);
  await evaluate(page, `(document.getElementById('vid').value = ${JSON.stringify(SYNTHETIC_ID)}, true)`);
  page.phase = 'after-agree';
  await click(page, '#go');
  return waitFor(page, `!!document.getElementById('ytframe')`, 5000);
}

async function livePath() {
  const held = await fresh('live-held', { ytMode: 'hold' });
  held.phase = 'before-agree';
  const created = await agree(held);
  await sleep(800);
  const yt = offHost('live-held');
  check('YouTube hosts are requested only after "Agree and load player"', created && yt.length > 0 && yt.every(r => r.phase === 'after-agree'),
    yt.map(r => `${new URL(r.url).hostname} (${r.type}, ${r.action})`).join('; '));
  const embed = yt.find(r => r.url.includes('/embed/'));
  report.measurements.embedRequest = embed ?? null;
  check('Embed request carries an HTTP Referer (YouTube requires it as API client identity)', Boolean(embed?.referer), embed ? `Referer: ${embed.referer ?? 'none'}` : 'no embed request');
  for (const [label, width, height, mobile] of [['1280', 1280, 800, false], ['800', 800, 900, false], ['390', 390, 844, true]]) {
    await size(held, width, height, mobile);
    await showPanel(held);
    await sleep(250);
    const r = await rect(held, '#ytframe');
    report.measurements[`iframe-${label}`] = r;
    check(`Player iframe at ${label}px viewport is at least 200x200 CSS px (MEDIA_PANEL_RULES.minPlayerPx)`, r && r.width >= 200 && r.height >= 200, r ? `${r.width}x${r.height}` : 'missing');
    // .player is border-box with 12px padding and a 1px border, and its min-height crosses the 16:9 ratio into a min-width.
    const fit = await evaluate(held, `(() => {
      const card = document.getElementById('panel'), cardStyle = getComputedStyle(card);
      const contentRight = card.getBoundingClientRect().right - parseFloat(cardStyle.borderRightWidth) - parseFloat(cardStyle.paddingRight);
      const stage = document.getElementById('stage'), box = stage.getBoundingClientRect(), s = getComputedStyle(stage);
      const round = v => Math.round(v * 10) / 10;
      return { box: round(box.width) + 'x' + round(box.height), padding: s.paddingTop, border: s.borderTopWidth, overhang: round(box.right - contentRight) };
    })()`);
    report.measurements[`fit-${label}`] = { ...fit, minHeightTimes16over9: Math.round((200 * 16 / 9) * 1000) / 1000 };
    check(`Player box stays inside its card at ${label}px`, fit.overhang <= 0.5, `box ${fit.box}, padding ${fit.padding}, border ${fit.border}, overhangs the card content edge by ${fit.overhang}px`);
    if (label === '1280') await shot(held, 'review-c3-04-live-held-1280');
    if (label === '390') await shot(held, 'review-c3-05-live-held-390');
  }
  await size(held, 1280, 800, false);
  held.phase = 'return';
  await click(held, '#ret');
  await sleep(400);
  const afterReturn = await evaluate(held, `({ iframe: !!document.getElementById('ytframe'), stage: document.getElementById('stage')?.innerHTML ?? null })`);
  check('Player iframe survives "Return to lesson"', afterReturn.iframe, `stage after return: ${afterReturn.stage}`);
  await showPanel(held);
  await shot(held, 'review-c3-06-after-return');
  await held.close();

  const stubbed = await fresh('live-stub', { ytMode: 'stub' });
  stubbed.phase = 'before-agree';
  const made = await agree(stubbed);
  await sleep(1500);
  const afterLoad = await evaluate(stubbed, `({ iframe: !!document.getElementById('ytframe'), status: document.getElementById('st')?.textContent ?? null, stage: document.getElementById('stage')?.innerHTML ?? null })`);
  check('Player iframe survives its own load event', made && afterLoad.iframe, `status "${afterLoad.status}", stage after load: ${afterLoad.stage}`);
  await showPanel(stubbed);
  await shot(stubbed, 'review-c3-07-after-load');
  await stubbed.close();
}

async function keyboard() {
  const page = await fresh('keyboard');
  const order = [];
  for (let i = 0; i < 10; i++) { await key(page, 'Tab', 'Tab', 9); await sleep(60); order.push(await active(page)); }
  report.measurements.tabOrder = order;
  const ids = order.map(o => o.id);
  const expected = ['#openBtn', '#play', '#consent', '#ret', '#j', '#apply', 'button[passage]', 'button[video]', 'button[artifact]'];
  check('Every control is reachable with Tab', expected.every(e => ids.includes(e)), ids.join(' > '));
  const play = order.find(o => o.id === '#play');
  check('Tab focus on a button shows the 3px outline', play?.outline === 'solid 3px', play?.outline ?? 'not reached');

  await evaluate(page, `(document.getElementById('play').focus(), true)`);
  await key(page, 'Enter', 'Enter', 13);
  await sleep(300);
  const afterPlay = await active(page);
  const status = await text(page, '#st');
  check('Focus stays on Play/Pause after pressing Enter', afterPlay.id === '#play', `status "${status}", focus now on ${afterPlay.id}`);
  await key(page, 'Tab', 'Tab', 9);
  await sleep(60);
  report.measurements.nextTabAfterPlay = (await active(page)).id;
  await click(page, '#play');

  await evaluate(page, `(document.getElementById('consent').focus(), true)`);
  await key(page, 'Enter', 'Enter', 13);
  await sleep(300);
  const afterConsent = await active(page);
  check('Focus lands in the consent stage after "Load YouTube player"', ['#vid', '#go', '#consent'].includes(afterConsent.id), `focus now on ${afterConsent.id}`);

  await evaluate(page, `(document.getElementById('ret').focus(), true)`);
  await key(page, 'Enter', 'Enter', 13);
  await sleep(300);
  const afterReturn = await active(page);
  check('"Return to lesson" moves focus to the lesson', afterReturn.id === '#lesson', `focus now on ${afterReturn.id}`);

  await evaluate(page, `(document.getElementById('openBtn').focus(), true)`);
  await key(page, 'Enter', 'Enter', 13);
  await sleep(300);
  const afterOpen = await active(page);
  check('"Show media beside lesson" moves focus to the panel', ['#panel', '#ph'].includes(afterOpen.id), `focus now on ${afterOpen.id}`);
  await page.close();
}

async function contrast() {
  for (const scheme of ['light', 'dark']) {
    const page = await fresh(`contrast-${scheme}`, { scheme });
    for (const selector of ['#stage .sim', '#provider .sim', 'header .note', '#body .note', '.badge.yt', '#body dt', '#ret', '#apply']) {
      const c = await evaluate(page, `${CONTRAST}(${JSON.stringify(selector)})`);
      report.measurements[`contrast-${scheme} ${selector}`] = c;
      check(`Text contrast (${scheme}) ${selector} meets ${c?.needs ?? 4.5}:1`, c && c.ratio >= c.needs, c ? `${c.ratio}:1, ${c.color} on ${c.background}, ${c.fontPx}px` : 'missing');
    }
    if (scheme === 'dark') await shot(page, 'review-c3-08-dark');
    await page.close();
  }
}

async function validation() {
  const page = await fresh('validation');
  const base = await evaluate(page, `JSON.parse(document.getElementById('j').value)`);
  const cases = [
    ['captions "no" with basis "none" is rejected (contract line 28)', e => { e.item.captions = { availability: 'no', basis: 'none' }; }],
    ['caption availability outside yes/no/unknown is rejected', e => { e.item.captions = { availability: 'maybe', basis: 'none' }; }],
    ['a model-suggested start "confirmed by" the model is rejected (contract line 40)', e => { e.item.provenance.confirmedBy = 'model-suggested'; }],
    ['provider kind outside the contract union is rejected', e => { e.provider.kind = 'vimeo'; }],
    ['embed host other than www.youtube-nocookie.com is rejected', e => { e.item.embed.host = 'www.youtube.com'; }],
    ['negative start is rejected', e => { e.item.provenance.startSeconds = -1; }],
    ['end before start is rejected', e => { e.item.provenance.endSeconds = 10; }],
    ['empty reason is rejected', e => { e.item.provenance.reason = ''; }],
    ['empty provider label is rejected', e => { e.provider.label = ''; }],
  ];
  const apply = entry => evaluate(page, `(() => { document.getElementById('j').value = ${JSON.stringify(JSON.stringify(entry))}; document.getElementById('apply').click(); return { rejected: !document.getElementById('err').hidden, message: document.getElementById('err').textContent, panel: document.getElementById('panel').textContent }; })()`);
  for (const [name, mutate] of cases) {
    const entry = structuredClone(base);
    mutate(entry);
    const result = await apply(entry);
    const shown = result.rejected ? result.message : /undefined/.test(result.panel) ? 'accepted; the panel prints "undefined"' : 'accepted';
    check(`Prototype validation: ${name}`, result.rejected, shown);
    await click(page, '[data-preset="video"]');
  }
  const probe = structuredClone(base);
  probe.item.title = '<img src="x-review-probe" onerror="window.__reviewProbe=1">';
  probe.relevance = '<b id="review-b">bold?</b>';
  await apply(probe);
  await sleep(300);
  const escaped = await evaluate(page, `({ img: !!document.querySelector('#panel img'), bold: !!document.getElementById('review-b'), ran: window.__reviewProbe === 1, asText: document.getElementById('stage').textContent.includes('<img') })`);
  check('Author-supplied text renders as text, not markup', !escaped.img && !escaped.bold && !escaped.ran && escaped.asText, JSON.stringify(escaped));
  await page.close();
}

async function main() {
  mkdirSync(SHOTS, { recursive: true });
  for (const entry of readdirSync(tmpdir(), { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.startsWith('kairo-review-profile-')) {
      try { rmSync(join(tmpdir(), entry.name), { recursive: true, force: true }); } catch { /* still locked; next run */ }
    }
  }
  let server = null;
  let browser = null;
  try {
    server = await serve();
    browser = spawn(BROWSER, [
      '--headless=new', `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${PROFILE}`, '--no-first-run', '--no-default-browser-check',
      '--disable-extensions', '--disable-sync', '--disable-background-networking', '--disable-component-update', '--no-proxy-server',
      '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1', '--disable-site-isolation-trials', '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1280,800', 'about:blank',
    ], { stdio: 'ignore' });
    let version = null;
    for (let i = 0; i < 240 && !version; i++) {
      try { version = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).json(); } catch { await sleep(250); }
    }
    if (!version) throw new Error('browser did not expose the DevTools port');
    report.browser = version.Browser;
    await networkAndOffline();
    await consentLayout();
    await livePath();
    await keyboard();
    await contrast();
    await validation();
    const errors = report.console.filter(c => c.type !== 'warning' && c.type !== 'log-warning');
    check('No console errors or uncaught exceptions in any scenario', errors.length === 0, errors.map(e => `${e.scenario}: ${e.text}`).join(' | ').slice(0, 300));
  } catch (error) {
    check('Review run completed without a harness error', false, error.message);
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
  report.summary = { passed: report.checks.filter(c => c.pass).length, failed: report.checks.filter(c => !c.pass).length, requestsLeavingMachine: 0 };
  report.summary.requestActions = report.requests.reduce((acc, r) => ({ ...acc, [r.action]: (acc[r.action] ?? 0) + 1 }), {});
  writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\n${report.summary.passed} passed, ${report.summary.failed} failed. Requests by action: ${JSON.stringify(report.summary.requestActions)}. Report: ${REPORT}`);
}

main();
