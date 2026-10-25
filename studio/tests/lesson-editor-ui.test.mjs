import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const sourceBlock = { id: 'a'.repeat(24), kind: 'explanation', title: 'Read the evidence', text: 'A source-linked explanation.', citationIds: ['source-span-1'], origin: 'source' };
const questionBlock = { id: 'b'.repeat(24), kind: 'question', title: 'Check your understanding', text: 'Which statement follows?', citationIds: ['source-span-2'], origin: 'generated', question: { options: ['First', 'Second'], correct: 0, supportQuote: 'Synthetic quote.' } };
const draft = { schemaVersion: 1, lessonId: 'c'.repeat(24), sourceId: 'd'.repeat(24), sourceRevision: 'e'.repeat(64), title: 'A synthetic lesson', layout: 'reading', blocks: [sourceBlock, questionBlock] };
let server, Editor;

test('load actual editor through installed Vite SSR', async () => {
  server = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, plugins: [reactPlugin()], server: { middlewareMode: true, ws: false }, appType: 'custom' });
  try { ({ default: Editor } = await server.ssrLoadModule('/src/lesson-editor-ui/LessonBlockEditor.tsx')); } catch (error) { await server.close(); throw error; }
});

const element = (props = {}) => Editor({ draft, onAction() {}, busy: false, selectedId: sourceBlock.id, onSelect() {}, ...props });
const find = (root, predicate) => {
  if (!root || typeof root !== 'object') return null;
  if (predicate(root)) return root;
  const children = root.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    const found = find(child, predicate);
    if (found) return found;
  }
  return null;
};
const textContent = node => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  return textContent(node.props?.children);
};
const render = (props = {}) => renderToStaticMarkup(React.createElement(Editor, { draft, onAction() {}, busy: false, selectedId: sourceBlock.id, onSelect() {}, ...props }));

test('renders the KAIRO lesson editor, selectable blocks, source provenance and layout controls', () => {
  const html = render();
  assert.match(html, /KAIRO/);
  assert.match(html, /Shape your lesson/);
  assert.match(html, /From source/);
  assert.match(html, /Generated draft/);
  assert.match(html, /source-span-1/);
  assert.match(html, /Reading layout/);
  assert.match(html, /aria-pressed="true">Reading/);
  assert.match(html, /Side by side/);
  assert.match(html, /Practice focus/);
  assert.doesNotMatch(html, />C<|aria-label="KAIRO lesson editor"/);
  assert.match(html, /Add reflection/);
  assert.doesNotMatch(html, /Synthetic quote/);
});

test('controlled title and text inputs emit only their narrow actions', () => {
  const actions = [];
  const root = element({ onAction: action => actions.push(action) });
  const title = find(root, node => node.type === 'input' && node.props.id === 'lbe-title');
  const blockTitle = find(root, node => node.type === 'input' && node.props.id === 'lbe-block-title');
  const textarea = find(root, node => node.type === 'textarea');
  title.props.onChange({ currentTarget: { value: 'New lesson title' } });
  blockTitle.props.onChange({ currentTarget: { value: 'New block title' } });
  textarea.props.onChange({ currentTarget: { value: 'Updated passage', selectionStart: 6 } });
  assert.deepEqual(actions, [
    { kind: 'title', title: 'New lesson title' },
    { kind: 'edit', id: sourceBlock.id, patch: { title: 'New block title' } },
    { kind: 'edit', id: sourceBlock.id, patch: { text: 'Updated passage' } },
  ]);
});

test('layout, selection, move and delete controls emit the contracted actions', () => {
  const actions = [], selected = [];
  const root = element({ onAction: action => actions.push(action), onSelect: id => selected.push(id) });
  const layout = find(root, node => node.type === 'button' && node.props.className?.includes('lbe__layout-choice') && textContent(node) === 'Side by side');
  layout.props.onClick();
  const picker = find(root, node => node.type === 'button' && node.props.className?.includes('lbe__block-pick') && textContent(node).includes(questionBlock.title));
  picker.props.onClick();
  const moveDown = find(root, node => node.type === 'button' && node.props['aria-label'] === 'Move block down');
  moveDown.props.onClick();
  const remove = find(root, node => node.type === 'button' && node.props.children === 'Delete block');
  remove.props.onClick();
  assert.deepEqual(actions, [{ kind: 'layout', layout: 'split' }, { kind: 'move', id: sourceBlock.id, direction: 1 }, { kind: 'remove', id: sourceBlock.id }]);
  assert.deepEqual(selected, [questionBlock.id]);
});

test('split uses the selected textarea cursor and a fresh block UUID', () => {
  const actions = [], root = element({ onAction: action => actions.push(action) });
  const textarea = find(root, node => node.type === 'textarea');
  textarea.props.onSelect({ currentTarget: { selectionStart: 12 } });
  const split = find(root, node => node.type === 'button' && node.props.children === 'Split at cursor');
  split.props.onClick();
  assert.equal(actions.length, 1);
  assert.equal(actions[0].kind, 'split');
  assert.equal(actions[0].id, sourceBlock.id);
  assert.equal(actions[0].offset, 12);
  assert.match(actions[0].newId, /^block-[0-9a-f-]{36}$/i);
});

test('question blocks cannot split, while reflection creation uses a fresh UUID', () => {
  const actions = [], root = element({ selectedId: questionBlock.id, onAction: action => actions.push(action) });
  const split = find(root, node => node.type === 'button' && node.props.children === 'Split at cursor');
  assert.equal(split.props.disabled, true);
  split.props.onClick();
  const add = find(root, node => node.type === 'button' && node.props.className === 'lbe__add');
  add.props.onClick();
  assert.equal(actions.length, 1);
  assert.equal(actions[0].kind, 'add-reflection');
  assert.match(actions[0].id, /^block-[0-9a-f-]{36}$/i);
});

test('reflection blocks cannot split into learner-authored scored content', () => {
  const reflection = { id: 'f'.repeat(24), kind: 'reflection', title: 'Your reflection', text: '', citationIds: [], origin: 'authored' };
  const reflectionDraft = { ...draft, blocks: [reflection, questionBlock] };
  const actions = [], root = element({ draft: reflectionDraft, selectedId: reflection.id, onAction: action => actions.push(action) });
  const split = find(root, node => node.type === 'button' && node.props.children === 'Split at cursor');
  assert.equal(split.props.disabled, true);
  split.props.onClick();
  assert.deepEqual(actions, []);
});

test('busy controls are disabled and direct handler calls emit nothing', () => {
  let calls = 0;
  const root = element({ busy: true, onAction() { calls++; }, onSelect() { calls++; } });
  const title = find(root, node => node.type === 'input' && node.props.id === 'lbe-title');
  const textarea = find(root, node => node.type === 'textarea');
  const add = find(root, node => node.type === 'button' && node.props.className === 'lbe__add');
  const layout = find(root, node => node.type === 'button' && node.props.className?.includes('lbe__layout-choice') && textContent(node) === 'Reading');
  title.props.onChange({ currentTarget: { value: 'Ignored' } });
  textarea.props.onChange({ currentTarget: { value: 'Ignored', selectionStart: 2 } });
  add.props.onClick();
  layout.props.onClick();
  const html = render({ busy: true });
  assert.equal(calls, 0);
  assert.match(html, /disabled/);
  assert.match(html, /Updating lesson/);
});

test('learner supplied strings are escaped and controls have accessible names', () => {
  const hostile = { ...sourceBlock, title: '<img src=x onerror=run()>', text: '<script>run()</script>' };
  const unsafeDraft = { ...draft, title: '<b>Unsafe title</b>', blocks: [hostile, questionBlock] };
  const html = render({ draft: unsafeDraft });
  assert.match(html, /&lt;img/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;b&gt;Unsafe title/);
  assert.doesNotMatch(html, /<img|<script>|<b>/);
  assert.match(html, /aria-label="Move block up"/);
  assert.match(html, /aria-label="Move block down"/);
  assert.match(html, /for="lbe-block-text"/);
});

test('scored question wording is read-only and guarded against direct edit events', () => {
  const actions = [], root = element({ selectedId: questionBlock.id, onAction: action => actions.push(action) });
  const textarea = find(root, node => node.type === 'textarea');
  assert.equal(textarea.props.readOnly, true);
  textarea.props.onChange({ currentTarget: { value: 'Attempt to change the scored prompt', selectionStart: 5 } });
  const title = find(root, node => node.type === 'input' && node.props.id === 'lbe-block-title');
  title.props.onChange({ currentTarget: { value: 'Friendly heading' } });
  const html = render({ selectedId: questionBlock.id });
  assert.match(html, /Scored questions keep their original wording and answer key/);
  assert.deepEqual(actions, [{ kind: 'edit', id: questionBlock.id, patch: { title: 'Friendly heading' } }]);
});

test('close SSR server', async () => { await server.close(); server = undefined; });
