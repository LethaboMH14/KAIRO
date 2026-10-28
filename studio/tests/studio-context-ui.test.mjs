import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');
const sourcePath = resolve('src/studio-context-ui/StudioContextPanel.tsx');
const source = await readFile(sourcePath, 'utf8');
const js = ts.transpile(source.replace("import './studio-context-panel.css';", ''), { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 });
const componentModule = { exports: {} };
let mockedId = 0;
const componentRequire = name => name === 'react' ? { ...React, useId: () => `mock-id-${++mockedId}` } : require(name);
new Function('require', 'module', 'exports', 'React', js)(componentRequire, componentModule, componentModule.exports, React);
const Panel = componentModule.exports.default;

const props = (overrides = {}) => ({ studioLabel: 'Pump studio', lessonTitle: 'Flow and pressure', selectedComponent: 'Discharge valve', variables: [{ id: 'flow', label: 'Flow rate', value: '12 L/min' }], citations: [{ id: 'c1', title: 'Pump notes', locator: 'Page 4' }], contextState: 'current', busy: false, onAsk() {}, onOpenLesson() {}, ...overrides });

test('SSR presents the current lesson, selection, variables and cited context with escaped text', () => {
  const html = renderToStaticMarkup(React.createElement(Panel, props({ studioLabel: '<Pump>' })));
  assert.match(html, /&lt;Pump&gt;/);
  assert.match(html, /Flow and pressure/);
  assert.match(html, /Discharge valve/);
  assert.match(html, /12 L\/min/);
  assert.match(html, /Pump notes/);
  assert.match(html, /Page 4/);
  assert.match(html, /Ask KAIRO about this/);
});

test('unknown context is plain and both disabled controls also guard callbacks', () => {
  let asks = 0; let opens = 0;
  const p = props({ lessonTitle: null, selectedComponent: null, variables: [], citations: [], contextState: 'changed', onAsk: () => asks++, onOpenLesson: () => opens++ });
  const html = renderToStaticMarkup(React.createElement(Panel, p));
  assert.match(html, /No lesson selected/);
  assert.match(html, /No part selected/);
  assert.match(html, /No source citations available/);
  assert.match(html, /disabled=""/);
  const element = Panel(p);
  element.props.children.at(-1).props.children.forEach(button => button.props.onClick());
  assert.equal(asks, 0); assert.equal(opens, 0);
});

test('busy state disables and guards actions; unavailable state explains reading fallback', () => {
  let calls = 0;
  const p = props({ busy: true, contextState: 'unavailable', onAsk: () => calls++, onOpenLesson: () => calls++ });
  const html = renderToStaticMarkup(React.createElement(Panel, p));
  assert.equal((html.match(/disabled=""/g) || []).length, 2);
  assert.match(html, /continue reading/);
  const element = Panel(p); element.props.children.at(-1).props.children.forEach(button => button.props.onClick());
  assert.equal(calls, 0);
});

test('multiple instances receive distinct stable heading ids', () => {
  const html = renderToStaticMarkup(React.createElement(React.Fragment, null, React.createElement(Panel, props()), React.createElement(Panel, props())));
  const ids = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, 4);
  assert.equal(new Set(ids).size, ids.length);
});
