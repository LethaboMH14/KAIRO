import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

let server, coachFor, StudioGuide;
test('load actual coach model and StudioGuide through Vite SSR', async () => {
  server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, plugins: [reactPlugin()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try {
    ({ coachFor } = await server.ssrLoadModule('/src/studio-coach/model.ts'));
    ({ default: StudioGuide } = await server.ssrLoadModule('/src/studio-guide-ui/StudioGuide.tsx'));
  } catch (error) { await server.close(); throw error; }
});
test.after(async () => { await server?.close(); });

const response = (overrides = {}) => ({
  title: 'Explain <the model>', text: 'Follow the source <carefully>.', prompt: 'What do you expect?',
  scope: 'Authored guidance. No learner answer is graded.',
  sourceLinks: [{ title: 'Reference <one>', url: 'https://example.org/guide' }], ...overrides,
});
const props = (overrides = {}) => ({ contextLabel: 'Motor · Rotor cutaway', response: response(), speaking: false, paused: false, status: 'Ready', onIntent() {}, onRead() {}, onPause() {}, onStop() {}, onAccess() {}, ...overrides });
const render = value => renderToStaticMarkup(React.createElement(StudioGuide, value));

test('actual component presents context, KAIRO, authored guidance, reading controls, access, and expandable citations', () => {
  const html = render(props({ response: coachFor({ studio: 'motor', intent: 'explain', selectedLabel: 'Squirrel cage' }) }));
  assert.match(html, /Motor · Rotor cutaway/);
  assert.match(html, /KAIRO/);
  assert.match(html, /Authored studio guidance/);
  assert.match(html, /Read with KAIRO/);
  assert.match(html, /Voice, language and camera options/);
  assert.match(html, /Sources for this guidance \(3\)/);
  assert.match(html, /target="_blank" rel="noreferrer"/);
});

test('response text and source labels are escaped; only safe HTTPS citations become links', () => {
  const html = render(props({ response: response({
    text: '<script>alert(1)</script>',
    sourceLinks: [
      { title: '<b>safe title</b>', url: 'https://example.org/path' },
      { title: 'javascript', url: 'javascript:alert(1)' },
      { title: 'plain http', url: 'http://example.org' },
      { title: 'credentials', url: 'https://user:pass@example.org/secret' },
      { title: 'broken', url: 'not a url' },
    ],
  }) }));
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /&lt;b&gt;safe title&lt;\/b&gt;/);
  assert.match(html, /Sources for this guidance \(1\)/);
  assert.match(html, /https:\/\/example.org\/path/);
  assert.doesNotMatch(html, /javascript:|http:\/\/example.org|user:pass|<script>|<b>safe title/);
});

test('actual four intent buttons and read, pause, stop, access controls invoke host callbacks', () => {
  const received = [];
  const element = StudioGuide({ ...props({
    onIntent: value => received.push(value), onRead: () => received.push('read'),
    onPause: () => received.push('pause'), onStop: () => received.push('stop'), onAccess: () => received.push('access'),
  }) });
  const children = element.props.children;
  const intents = children.find(child => child?.props?.['aria-label'] === 'Choose coaching help');
  const controls = children.find(child => child?.props?.className === 'sg-controls');
  const speech = controls.props.children.find(child => child?.props?.['aria-label'] === 'KAIRO reading controls');
  for (const button of intents.props.children) button.props.onClick();
  for (const button of speech.props.children) button.props.onClick();
  controls.props.children[1].props.onClick();
  assert.deepEqual(received, ['explain', 'hint', 'predict', 'check', 'read', 'pause', 'stop', 'access']);
});

test('fallback portrait names KAIRO and speaking state gives an honest resume control', () => {
  const html = render(props({ speaking: true, paused: true, status: 'Paused' }));
  assert.match(html, /KAIRO portrait placeholder/);
  assert.match(html, />Resume reading</);
  assert.match(html, />Resume</);
  assert.match(html, /Paused/);
});

test('root-provided visual renders in the slot without a second teacher identity', () => {
  const html = render(props({ visual: React.createElement('div', { 'data-testid': 'root-visual' }, 'KAIRO visual') }));
  assert.match(html, /data-testid="root-visual"/);
  assert.match(html, /KAIRO visual/);
  assert.doesNotMatch(html, /Rain/);
});
