import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as S from '../src/pump-lab/session.ts';
import * as L from '../src/pump-lab/layout.ts';
import * as K from '../src/pump-lab/cases.ts';

// Renders the real PumpLab component tree to static HTML (no browser, no WebGL, no
// layout) and checks structure, names, keyboard equivalents and honest labelling.
// This does not measure frame time, touch behaviour or how anything looks.

const studio = join(dirname(fileURLToPath(import.meta.url)), '..');
let React, renderToStaticMarkup, PumpLab;

before(async () => {
  const result = await build({
    stdin: {
      contents: `import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PumpLab from './src/pump-lab/PumpLab.tsx';
export { createElement, renderToStaticMarkup, PumpLab };`,
      resolveDir: studio,
      loader: 'tsx',
    },
    bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', logLevel: 'silent',
    external: ['three', 'three/*', '@react-three/fiber', '@react-three/drei'],
    loader: { '.css': 'empty' },
  });
  const dir = mkdtempSync(join(tmpdir(), 'kairo-pump-lab-ui-'));
  const file = join(dir, 'pump-lab-ui.cjs');
  writeFileSync(file, result.outputFiles[0].text);
  const mod = await import(pathToFileURL(file).href);
  const m = mod.default ?? mod;
  React = m; renderToStaticMarkup = m.renderToStaticMarkup; PumpLab = m.PumpLab;
});

let clock = Date.parse('2026-10-23T10:00:00Z');
const at = () => new Date((clock += 1000)).toISOString();
const run = (caseId, actions, seed = 5, sessionId = 'ui-test') => {
  let s = S.initialState(sessionId, seed, caseId);
  for (const a of actions) s = S.transition(s, a, at());
  return s;
};

function render(props = {}) {
  const errors = [];
  const original = console.error;
  console.error = (...a) => errors.push(a.map(String).join(' '));
  try {
    const html = renderToStaticMarkup(React.createElement(PumpLab, { onExit: () => {}, sessionId: 'ui-test', seed: 5, ...props }));
    return { html, errors };
  } finally { console.error = original; }
}

const text = html => html.replace(/<[^>]*>/g, ' ').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ');
const sample = [
  { type: 'set-settings', speedRpm: 1450, valvePct: 100 }, { type: 'predict', flowLps: 8 }, { type: 'take-reading' },
  { type: 'inspect-section', readingId: 'R1', section: 'valve' },
];

test('renders each view without React warnings', () => {
  for (const view of ['diagram', 'reading', '3d', 'auto']) {
    for (const caseId of K.CASE_IDS) {
      const { html, errors } = render({ caseId, view });
      assert.deepEqual(errors, [], `${view}/${caseId}: ${errors.join(' | ')}`);
      assert.match(html, /<h1[^>]*>Pump lab<\/h1>/);
    }
  }
});

test('headline, back action and honest labelling are present', () => {
  const { html } = render({ view: 'diagram' });
  const t = text(html);
  assert.match(t, /Back to studios/);
  assert.match(t, /Illustrative model/);
  assert.match(t, /Reach 12 L\/s without breaking a limit/);
  assert.match(t, /Illustrative simulation\. The numbers come from a simplified teaching model, not a real pump, and no real maintenance was done/);
  assert.match(html, /<main class="pl"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /class="pl-skip" href="#pl-task"/);
  assert.match(html, /id="pl-task"/);
});

test('every part is reachable by keyboard in the diagram and in the parts list', () => {
  const { html } = render({ view: 'diagram' });
  const groups = [...html.matchAll(/<g class="pl-part[^"]*" role="button" tabindex="0" aria-label="([^"]*)" aria-pressed="(true|false)"/g)];
  const names = new Set(groups.map(g => g[1].split('. ')[0]));
  for (const t of L.TARGETS) assert.ok(names.has(t.label), `diagram part ${t.label}`);
  const listButtons = [...html.matchAll(/<button type="button" class="pl-btn pl-btn-small pl-part-btn"[^>]*>([^<]*)<\/button>/g)].map(m => m[1]);
  assert.deepEqual(listButtons.sort(), L.TARGETS.map(t => t.label).sort());
});

test('reading view carries the whole state in text, with no picture required', () => {
  const s = run('weak-delivery', [{ type: 'predict', flowLps: 11 }, { type: 'take-reading' }]);
  const { html } = render({ view: 'reading', snapshot: S.serialize(s) });
  const t = text(html);
  assert.doesNotMatch(html, /<svg class="pl-diagram"/);
  assert.match(html, /aria-label="Text description of the pump room"/);
  assert.match(t, /Settings: pump 1450 rpm, valve handle 100 percent/);
  assert.match(t, /Tanks: source 2\.50 m \(7500 L\), destination 0\.50 m \(1500 L\)/);
  for (const target of L.TARGETS) assert.ok(t.includes(target.label), target.label);
  assert.match(t, /Last reading R1: [\d.]+ L\/s \(target 12\)/);
  assert.match(t, /Water check: 9000 L in the two tanks together; started with 9000 L/);
});

test('nothing runs before the prediction, and the gauges are blank before a reading', () => {
  const { html } = render({ view: 'diagram' });
  const t = text(html);
  assert.match(t, /The pump is idle until you predict the flow/);
  assert.doesNotMatch(html, /class="pl-flow /);
  assert.match(html, /class="pl-gauge-text"[^>]*>—</);
  const reading = text(render({ view: 'reading' }).html);
  assert.match(reading, /Last reading|No reading yet\. Predict the flow, then take a reading\./);
  assert.match(reading, /Flow meter\. No reading yet\. Predict the flow, then take a reading\./);
  const drawing = text(html.match(/<svg class="pl-diagram"[\s\S]*?<\/svg>/)[0]);
  assert.doesNotMatch(drawing, /Over limit|Over rating|Bubbles at the impeller/);
  assert.match(t, /Off · Dots move along the pipes/);
});

test('after a prediction and a reading the diagram shows state cues in words as well as shapes', () => {
  const s = run('valve-handle-open', sample);
  const { html } = render({ view: 'diagram', snapshot: S.serialize(s) });
  const t = text(html);
  assert.match(html, /class="pl-flow pl-flow-suction/);
  assert.match(html, /class="pl-flow pl-flow-discharge/);
  assert.match(t, /Over limit \(200 kPa\)/);
  assert.doesNotMatch(t, /The pump is idle until you predict/);
  assert.match(t, new RegExp(`${s.readings[0].measured.dischargeKpa} kPa`));
  assert.match(html, /class="pl-impeller is-spinning"/);
  const cavit = run('noisy-suction', [{ type: 'predict', flowLps: 9 }]);
  const c = render({ view: 'diagram', snapshot: S.serialize(S.transition(S.transition(cavit, { type: 'set-settings', speedRpm: 1450, valvePct: 100 }, at()), { type: 'predict', flowLps: 9 }, at())) });
  assert.match(text(c.html), /Bubbles at the impeller: crackling/);
  assert.match(c.html, /class="pl-bubble"/);
});

test('names and labels: every button has text, every control has a label, ids are unique and referenced ids exist', () => {
  const s = run('noisy-suction', [...sample.slice(0, 3), { type: 'inspect-section', readingId: 'R1', section: 'suction' }]);
  for (const view of ['diagram', 'reading']) {
    const { html } = render({ view, snapshot: S.serialize(s) });
    for (const m of html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)) assert.ok(text(m[1]).trim().length > 1, `empty button: ${m[0].slice(0, 120)}`);
    const unlabelled = html.replace(/<label\b[\s\S]*?<\/label>/g, '').match(/<(input|select|textarea)\b/g);
    assert.equal(unlabelled, null, 'controls outside a label');
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, 'duplicate ids');
    for (const m of html.matchAll(/aria-labelledby="([^"]+)"/g)) for (const id of m[1].split(' ')) assert.ok(ids.includes(id), `missing id ${id}`);
    const informative = [...html.matchAll(/<svg\b[^>]*>/g)].filter(m => !/aria-hidden="true"/.test(m[0]));
    for (const m of informative) assert.match(m[0], /role="(img|group)"/);
    for (const svg of html.matchAll(/<svg\b(?![^>]*aria-hidden="true")[\s\S]*?<\/svg>/g)) assert.match(svg[0], /<title\b/);
  }
});

test('sliders announce their value in words and are at least a finger wide in the stylesheet', () => {
  const { html } = render({ view: 'diagram' });
  for (const m of html.matchAll(/<input[^>]*type="range"[^>]*>/g)) assert.match(m[0], /aria-valuetext="[^"]+"/);
  const css = readFileCss();
  assert.match(css, /\.pl-btn\{[^}]*min-height:44px/);
  assert.match(css, /\.pl-range-label input\[type=range\]\{[^}]*min-height:44px/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{\.pl-flow,\.pl-impeller\.is-spinning\{animation:none\}\}/);
  assert.match(css, /@media \(max-width:1000px\)\{\.pl-grid\{grid-template-columns:1fr\}/);
});

import { readFileSync } from 'node:fs';
function readFileCss() { return readFileSync(join(studio, 'src', 'pump-lab', 'pump-lab.css'), 'utf8'); }

test('help used, comparisons and the finished state show in the page', () => {
  const hinted = run('valve-handle-open', [...sample, { type: 'show-hint', level: 1 }, { type: 'show-hint', level: 2 }]);
  const t = text(render({ view: 'diagram', snapshot: S.serialize(hinted) }).html);
  assert.match(t, /Help used: hint 2\. This stays in your record\./);
  assert.match(t, /Hint 1\./);
  assert.match(t, /Hint 2\./);
  assert.doesNotMatch(t, /Hint 3\./);
  assert.match(t, /Show hint 3 of 3/);
  assert.match(t, /R1 · Discharge valve: pressure lost across the valve is [\d.]+ m; the datasheet gives [\d.]+ m/);
  assert.match(t, /Compare suction line with datasheet/);
});

test('a finished case reads as finished and offers the export', () => {
  const finished = run('baseline-commissioning', [
    { type: 'predict', flowLps: 15 }, { type: 'take-reading' },
    { type: 'inspect-section', readingId: 'R1', section: 'suction' }, { type: 'inspect-section', readingId: 'R1', section: 'pump' }, { type: 'inspect-section', readingId: 'R1', section: 'valve' },
    { type: 'submit-explanation', cause: 'no-fault', evidenceIds: ['R1.suction', 'R1.pump', 'R1.valve'], note: 'All three match.' },
    { type: 'set-settings', speedRpm: 1230, valvePct: 100 }, { type: 'predict', flowLps: 12.5 }, { type: 'take-reading' },
    { type: 'compare', a: 'R1', b: 'R2' }, { type: 'complete-case' },
  ]);
  const { html } = render({ view: 'diagram', snapshot: S.serialize(finished) });
  const t = text(html);
  assert.match(t, /Case finished\. Export your observation report\./);
  assert.match(t, /Observation report \(\.txt\)/);
  assert.match(t, /Evidence item \(\.json\)/);
  assert.match(t, /Supported by your evidence/);
  assert.match(html, /<button type="button" class="pl-btn" disabled="">Finish the case<\/button>/);
});

test('a snapshot that fails validation starts fresh and says so', () => {
  const { html } = render({ view: 'diagram', snapshot: '{"schema":"nope"}' });
  assert.match(text(html), /The saved session could not be restored, so this is a fresh start\./);
  assert.match(text(html), /Predict the flow for the current settings|Not done/);
});

test('a requested 3D view falls back to the diagram when WebGL is unavailable', () => {
  const { html } = render({ view: '3d' });
  assert.match(text(html), /This device cannot draw the 3D room, so the diagram is shown\./);
  assert.match(html, /<svg class="pl-diagram"/);
});

test('plots come with table equivalents, and the datasheet is on the page', () => {
  const s = run('weak-delivery', [{ type: 'predict', flowLps: 10 }, { type: 'take-reading' }]);
  const { html } = render({ view: 'diagram', snapshot: S.serialize(s) });
  const t = text(html);
  assert.equal((html.match(/<figure class="pl-figure">/g) || []).length, 2);
  assert.equal((html.match(/<summary>Table for this plot<\/summary>/g) || []).length, 2);
  assert.match(t, /Reading R1: head the pump added/);
  assert.match(t, /Datasheet expectation, healthy circuit/);
  assert.match(t, /Pump head \(healthy\) n² × 22 − 0\.06 × Q²/);
  assert.match(t, /Motor shaft power n³ × \(1\.1 \+ 0\.1064 × Q ÷ n\) kW/);
  assert.match(html, /<line [^>]*class="pl-target-line"/);
  assert.match(html, /class="pl-curve pl-curve-pump"/);
  assert.match(html, /class="pl-curve pl-curve-system"/);
  assert.doesNotMatch(t, /impellerHeadFactor|0\.62/, 'the hidden fault value is never on the page');
});

test('the hidden fault is never rendered, in any view, at any stage', () => {
  const stages = [[], sample, [...sample, { type: 'inspect-section', readingId: 'R1', section: 'suction' }, { type: 'inspect-section', readingId: 'R1', section: 'pump' }]];
  const give = /stuck part-closed|seized|blocked with debris|eroded back|worn out/i;
  for (const caseId of K.CASE_IDS) {
    for (const actions of stages) {
      const s = run(caseId, actions);
      for (const view of ['diagram', 'reading']) {
        const t = text(render({ view, snapshot: S.serialize(s) }).html);
        if (caseId === 'baseline-commissioning') continue;
        // The candidate causes and repairs are listed for every case; only case-specific hidden state must stay hidden.
        let body = t.replace(K.CASES[caseId].report, '');
        for (const v of [...Object.values(K.CAUSES), ...Object.values(K.REPAIRS)]) for (const str of Object.values(v)) if (typeof str === 'string') body = body.split(str).join('');
        for (const spec of Object.values(K.CASES)) for (const h of spec.hints) body = body.split(h).join('');
        assert.doesNotMatch(body, give, `${caseId}/${view}`);
      }
    }
  }
});

test('highlight and selection props are honoured, unknown ids ignored', () => {
  const ok = render({ view: 'diagram', highlightTarget: 'valve' });
  assert.match(ok.html, /class="pl-part is-highlight"[^>]*aria-label="Discharge valve\./);
  const bad = render({ view: 'diagram', highlightTarget: 'not-a-part' });
  assert.doesNotMatch(bad.html, /is-highlight/);
  assert.deepEqual(bad.errors, []);
});
