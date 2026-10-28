import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

let server;
let LessonBoardAdapter;
let validateLessonBoard;
let validateSourceAnchors;

before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL('..', import.meta.url)),
    configFile: false,
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [reactPlugin()],
    server: { middlewareMode: true, ws: false },
    appType: 'custom',
  });
  ({ LessonBoardAdapter } = await server.ssrLoadModule('/src/lesson-board-ui/LessonBoardAdapter.tsx'));
  ({ validateLessonBoard, validateSourceAnchors } = await server.ssrLoadModule('/src/lesson-board-ui/validateBoard.ts'));
});

after(async () => server?.close());

const board = {
  schema: 'kairo.lesson-board', version: 1, lessonRevision: 'lesson-r4', title: 'Motor lesson',
  slides: [{ id: 'step-1', heading: 'Rotating field', elements: [{ id: 'el-1', kind: 'text', text: '<script>alert(1)</script>' }] }],
};
const anchors = { 'el-1': { label: 'Motor notes · p. 4', sourceRevision: 'source-r4', excerpt: '<img src=x onerror=alert(1)>' } };
function Surface({ board: content, onElementSelect }) {
  return React.createElement('p', { onClick: () => onElementSelect('el-1') }, content.slides[0].elements[0].text);
}

test('board validator keeps only versioned plain-text fields and accepts text that looks like markup as text', () => {
  const result = validateLessonBoard({ ...board, html: '<script>bad</script>' });
  assert.equal(result.ok, true);
  assert.equal(Object.hasOwn(result.value, 'html'), false);
  assert.equal(result.value.slides[0].elements[0].text, '<script>alert(1)</script>');
});

test('unsupported board versions and unsafe anchor records fail closed', () => {
  assert.equal(validateLessonBoard({ ...board, version: 2 }).ok, false);
  assert.equal(validateSourceAnchors({ 'el-1': { label: 'x', sourceRevision: 'r1', excerpt: '<x>'.repeat(200) } }).ok, false);
});

test('adapter displays KAIRO reading and source separately, escaping learner content and source excerpts', () => {
  const markup = renderToStaticMarkup(React.createElement(LessonBoardAdapter, {
    board, sourceAnchorByElementId: anchors, Surface, onSave: async () => ({ ok: true }),
    readingContent: React.createElement('p', null, 'Read the same lesson.'),
  }));
  assert.match(markup, /KAIRO lesson board/);
  assert.match(markup, /Motor notes · p\. 4/);
  assert.match(markup, /role="tab" aria-selected="false">Read<\/button>/);
  assert.match(markup, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(markup, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(markup, /<script>|<img /);
});

test('read path remains available when the board version is rejected', () => {
  const markup = renderToStaticMarkup(React.createElement(LessonBoardAdapter, {
    board: { ...board, version: 9 }, sourceAnchorByElementId: anchors, Surface, readingContent: React.createElement('p', null, 'Continue reading.'),
  }));
  assert.match(markup, /board version is not supported/);
  assert.match(markup, /Continue reading/);
});
