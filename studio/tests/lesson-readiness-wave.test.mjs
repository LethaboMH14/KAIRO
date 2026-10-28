import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const base = {
  title: 'Synthetic source-linked lesson',
  objective: 'Synthetic test objective only.',
  steps: [{ id: 'step-a', title: 'Synthetic step', citationIds: ['source-a'] }],
  sources: [{ id: 'source-a', title: 'Synthetic reviewed source', locator: 'Page 4' }],
  sourceState: 'reviewed', coverageWarnings: [], mode: 'reading', busy: false, error: null,
  onStart() {}, onEdit() {}, onRetry() {},
};
let server;
let Panel;
let createStartHandler;
let isLessonStartAllowed;

test('load the actual panel through installed Vite SSR', async () => {
  server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, plugins: [reactPlugin()], server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try { ({ default: Panel, createStartHandler, isLessonStartAllowed } = await server.ssrLoadModule('/src/lesson-readiness-ui/LessonReadinessPanel.tsx')); }
  catch (error) { await server.close(); throw error; }
});

const render = (props = {}) => renderToStaticMarkup(React.createElement(Panel, { ...base, ...props }));
const visible = html => html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, ' ');

test('reviewed lesson shows source-linked steps and a usable start action', () => {
  const html = render();
  assert.match(html, /role="region"/);
  assert.match(html, /aria-labelledby=/);
  assert.match(html, /Synthetic step/);
  assert.match(html, /Synthetic reviewed source/);
  assert.match(html, /Page 4/);
  assert.match(html, />Start lesson<\/button>/);
  assert.doesNotMatch(html, /disabled=""/);
});

test('changed and unavailable source states fail closed and offer a check action', () => {
  for (const state of ['changed', 'unavailable']) {
    const html = render({ sourceState: state });
    assert.match(html, /disabled=""[^>]*>Start lesson/);
    assert.match(visible(html), /Check source again/);
    assert.match(visible(html), state === 'changed' ? /source changed after review/i : /source is unavailable/i);
  }
});

test('busy, empty steps, missing citation ids and unmatched citations all block start', () => {
  for (const props of [
    { busy: true },
    { steps: [] },
    { steps: [{ id: 'step-a', title: 'Synthetic step', citationIds: [] }] },
    { steps: [{ id: 'step-a', title: 'Synthetic step', citationIds: ['unknown'] }] },
  ]) assert.match(render(props), /disabled=""[^>]*>(?:Start lesson|Starting…)/);
  assert.match(visible(render({ busy: true })), /Starting your lesson/);
  assert.match(visible(render({ steps: [] })), /No lesson steps are ready yet/);
  assert.match(visible(render({ steps: [{ id: 'step-a', title: 'Synthetic step', citationIds: [] }] })), /Every step needs a citation/);
  assert.match(visible(render({ steps: [{ id: 'step-a', title: 'Synthetic step', citationIds: ['unknown'] }] })), /source for this step is missing/i);
});

test('actual start gate and handler reject stale, busy and incomplete states even if invoked directly', () => {
  let starts = 0;
  for (const props of [
    { sourceState: 'changed' }, { sourceState: 'unavailable' }, { busy: true }, { steps: [] },
    { steps: [{ id: 'step-a', title: 'Synthetic step', citationIds: [] }] },
    { steps: [{ id: 'step-a', title: 'Synthetic step', citationIds: ['unknown'] }] },
  ]) createStartHandler(isLessonStartAllowed({ ...base, ...props }), Boolean(props.busy), () => { starts++; })();
  assert.equal(starts, 0);
  createStartHandler(isLessonStartAllowed(base), false, () => { starts++; })();
  assert.equal(starts, 1);
});

test('blank or duplicate source and step ids fail closed', () => {
  for (const props of [
    { sources: [{ id: '', title: 'Synthetic source', locator: 'Page 4' }] },
    { sources: [...base.sources, { id: 'source-a', title: 'Ambiguous source', locator: 'Page 9' }] },
    { steps: [{ ...base.steps[0], id: '' }] },
    { steps: [...base.steps, { ...base.steps[0] }] },
  ]) assert.match(render(props), /disabled=""[^>]*>Start lesson/);
});

test('prepared interactive wording describes a prepared activity without promising a generated world', () => {
  const html = render({ mode: 'prepared-interactive' });
  assert.match(visible(html), /Prepared interactive lesson/);
  assert.match(visible(html), /Explore the prepared activity alongside your reading/i);
  assert.doesNotMatch(visible(html), /generated|new environment for any topic/i);
});

test('coverage warnings and errors remain visible to assistive technology', () => {
  const html = render({ coverageWarnings: ['Synthetic coverage limitation.'], error: 'Synthetic retry error.' });
  assert.match(visible(html), /Synthetic coverage limitation/);
  assert.match(html, /role="alert"/);
  assert.match(visible(html), /Synthetic retry error/);
});

test('learner-facing strings are escaped and repeated panels get distinct region labels', () => {
  const attack = '<img src=x onerror=run()>';
  const malicious = render({ title: attack, objective: attack, sources: [{ id: 'source-a', title: attack, locator: attack }] });
  assert.match(malicious, /&lt;img/);
  assert.doesNotMatch(malicious, /<img/);
  const twice = renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement(Panel, base), React.createElement(Panel, base)));
  const labels = [...twice.matchAll(/<section class="lesson-readiness" role="region" aria-labelledby="([^"]+)"/g)].map(match => match[1]);
  assert.equal(labels.length, 2);
  assert.notEqual(labels[0], labels[1]);
});

test('close SSR server', async () => { await server.close(); server = undefined; });
