import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

let server, coachFor, CoachPanel;
test('load actual coach model and panel through Vite SSR', async () => {
  server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, plugins: [reactPlugin()], server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try { ({ coachFor } = await server.ssrLoadModule('/src/studio-coach/model.ts')); ({ default: CoachPanel } = await server.ssrLoadModule('/src/studio-coach/CoachPanel.tsx')); }
  catch (error) { await server.close(); throw error; }
});
test.after(async () => { await server?.close(); });
const props = response => ({ response, speaking: false, paused: false, status: 'Ready', onIntent() {}, onRead() {}, onPause() {}, onStop() {} });
const render = response => renderToStaticMarkup(React.createElement(CoachPanel, props(response)));

test('motor help separates field and rotor speed and cites existing pack sources', () => {
  const response = coachFor({ studio: 'motor', intent: 'explain', selectedLabel: 'Squirrel cage' });
  assert.match(response.text, /induces current/); assert.match(response.text, /slightly below synchronous field speed/);
  assert.equal(response.sourceLinks[0].url, 'https://en.wikipedia.org/wiki/Induction_motor'); assert.equal(response.sourceLinks.length, 3);
});
test('motor hint, predict and check ask for learner reasoning', () => {
  assert.match(coachFor({ studio: 'motor', intent: 'hint', nextStep: 'cutaway' }).prompt, /What observation/);
  assert.match(coachFor({ studio: 'motor', intent: 'predict' }).prompt, /what do you predict/);
  const check = coachFor({ studio: 'motor', intent: 'check' });
  assert.match(check.prompt, /Which visible observation/); assert.match(check.prompt, /does not mark your answer/); assert.match(check.scope, /does not grade/);
});
test('pump cites vetted DOE and Hydraulic Institute sources, never local unserved docs', () => {
  const response = coachFor({ studio: 'pump', intent: 'explain' });
  assert.deepEqual(response.sourceLinks.map(x => x.url), [
    'https://www.energy.gov/sites/default/files/2026-04/DOE-HDBK-1012-92_VOL3.pdf',
    'https://datatool.pumps.org/pump-fundamentals/combined.html',
    'https://datatool.pumps.org/pump-fundamentals/pump-curves.html',
  ]);
});
test('pump responses stay bounded, source-linked and independent of hidden fault labels', () => {
  const inputs = ['explain', 'hint', 'predict', 'check'].map(intent => coachFor({ studio: 'pump', intent, selectedLabel: 'Suction gauge', readings: 2, finished: true }));
  for (const response of inputs) { assert.match(response.scope, /Hidden case cause is not used or revealed/); assert.match(response.scope, /illustrative/); assert.equal(response.sourceLinks.length, 3); }
  assert.match(inputs[1].prompt, /Which section will you measure next/); assert.match(inputs[2].prompt, /Before you take the next reading/);
  assert.match(inputs[3].prompt, /does not mark your answer/); assert.doesNotMatch(JSON.stringify(inputs), /strainer-blocked|impeller-worn|trueCause/);
});
test('invalid context is safe and learner labels are bounded', () => {
  const response = coachFor({ studio: 'pump', intent: 'check', selectedLabel: '<img src=x>' + 'x'.repeat(150), readings: -2 });
  assert.ok(response.text.length < 900); assert.doesNotMatch(response.text, /<img/); assert.match(response.text, /No reading count was supplied/);
});
test('actual panel renders accessible KAIRO controls, status and citations', () => {
  const html = render(coachFor({ studio: 'motor', intent: 'explain' }));
  assert.match(html, /Learn with KAIRO/); assert.match(html, /aria-label="Choose coaching help"/); assert.match(html, /aria-live="polite"/);
  assert.match(html, /Read with KAIRO/); assert.match(html, /https:\/\/en\.wikipedia\.org\/wiki\/Induction_motor/); assert.match(html, /noreferrer/);
});
test('panel delegates coaching and narration controls to shared callbacks', () => {
  const received = [];
  const element = CoachPanel({ ...props(coachFor({ studio: 'pump', intent: 'explain' })), onIntent: v => received.push(v), onRead: () => received.push('read'), onPause: () => received.push('pause'), onStop: () => received.push('stop') });
  const children = element.props.children; const intents = children.find(c => c?.props?.['aria-label'] === 'Choose coaching help'); const speech = children.find(c => c?.props?.['aria-label'] === 'KAIRO narration controls');
  for (const button of intents.props.children) button.props.onClick(); for (const button of speech.props.children.slice(0, 3)) button.props.onClick();
  assert.deepEqual(received, ['explain', 'hint', 'predict', 'check', 'read', 'pause', 'stop']);
});
