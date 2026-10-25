import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const studioRoot = fileURLToPath(new URL('..', import.meta.url));
const sourceA = 'a'.repeat(24), sourceB = 'b'.repeat(24), revisionA = '1'.repeat(64), revisionB = '2'.repeat(64);
const record = () => ({ schemaVersion: 2, id: 'f'.repeat(24), createdAt: '2026-10-25T10:00:00.000Z', mode: 'local-extractive-v2',
  sourceRefs: [{ sourceId: sourceA, revision: revisionA }, { sourceId: sourceB, revision: revisionB }], bundleRevision: 'c'.repeat(64),
  title: 'Synthetic multi-source lesson', objective: 'Check two reviewed sources without merging their identities.',
  evidence: [
    { id: 'ev-a', sourceId: sourceA, sourceRevision: revisionA, title: 'Synthetic motor notes', locator: 'Page 1', quote: 'Exact quote from reviewed source A.', start: 12, end: 47, edited: false },
    { id: 'ev-b', sourceId: sourceA, sourceRevision: revisionA, title: 'Synthetic motor notes', locator: 'Page 2', quote: 'Evidence selected but not cited by a chapter.', start: 2, end: 47, edited: true },
  ],
  chapters: [
    { title: 'First source', explanation: 'Read the exact first passage.', example: 'Name its locator.', citationIds: ['ev-a'] },
    { title: 'Second step', explanation: 'Connect the passage to a question.', example: 'State what remains unknown.', citationIds: ['ev-a'] },
  ],
  quiz: [{ question: 'Which phrase appears in the source?', options: ['Exact quote from reviewed source A.', 'Other synthetic choice A.', 'Other synthetic choice B.', 'Other synthetic choice C.'], correct: 0, explanation: 'Compare against the cited anchor.', citationIds: ['ev-a'], supportQuote: 'Exact quote from reviewed source A.' }],
  reviewWarning: 'Source-linked excerpts are not proof of educational correctness.',
});
let server, BundleLessonView, parseBundleLessonView, createBundleLessonViewActions;
before(async () => {
  server = await createServer({ root: studioRoot, configFile: false, plugins: [reactPlugin()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, ws: false }, appType: 'custom' });
  ({ default: BundleLessonView, parseBundleLessonView, createBundleLessonViewActions } = await server.ssrLoadModule('/src/bundle-lesson-view/BundleLessonView.tsx'));
});
after(async () => { await server?.close(); });

function render(props) { return renderToStaticMarkup(React.createElement(BundleLessonView, props)); }

test('actual parser keeps selected source refs distinct and reports both coverage gaps', () => {
  const parsed = parseBundleLessonView(record());
  assert.deepEqual(parsed.record.sourceRefs, [{ sourceId: sourceA, revision: revisionA }, { sourceId: sourceB, revision: revisionB }]);
  assert.deepEqual(parsed.missingCoverage, [{ kind: 'source-without-evidence', sourceId: sourceB }, { kind: 'evidence-not-cited', evidenceId: 'ev-b' }]);
  assert.equal(parsed.record.evidence[0].quote, 'Exact quote from reviewed source A.');
});

test('actual SSR presents distinct sources, exact citation locators and quotes, and the coverage warning', () => {
  const value = record();
  const html = render({ record: value, onRead() {}, onStop() {} });
  assert.match(html, /Multi-source lesson · read-only view/);
  assert.match(html, /Synthetic multi-source lesson/);
  assert.match(html, new RegExp(sourceA)); assert.match(html, new RegExp(sourceB));
  assert.match(html, /Revision <code>111111/); assert.match(html, /Revision <code>222222/);
  assert.match(html, /Page 1 · 12–47/); assert.match(html, /Exact quote from reviewed source A\./);
  assert.match(html, /Some selected material is not covered in the lesson/);
  assert.match(html, /No cited evidence was selected from source/);
  assert.match(html, /Evidence ev-b is not cited by a chapter/);
  assert.match(html, /does not submit answers or record a score/);
  assert.doesNotMatch(html, /<form\b|type="submit"/i);
});

test('actual repeated SSR instances receive unique linked heading IDs and escape source text', () => {
  const unsafe = record(); unsafe.title = '<img src=x onerror=alert(1)>'; unsafe.evidence[0].quote = '<script>inert source text</script>'; unsafe.evidence[0].end = unsafe.evidence[0].start + unsafe.evidence[0].quote.length; unsafe.quiz[0].supportQuote = unsafe.evidence[0].quote; unsafe.quiz[0].options[0] = unsafe.evidence[0].quote;
  const props = { record: unsafe, onRead() {}, onStop() {} };
  const html = renderToStaticMarkup(React.createElement(React.Fragment, null, React.createElement(BundleLessonView, props), React.createElement(BundleLessonView, props)));
  const headings = [...html.matchAll(/<h2 id="(blv-title-[^"]+)"/g)].map(match => match[1]);
  assert.equal(headings.length, 2); assert.equal(new Set(headings).size, 2);
  for (const id of headings) assert.match(html, new RegExp(`aria-labelledby="${id}"`));
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/); assert.match(html, /&lt;script&gt;inert source text&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<img src=x|<script>inert/);
});

test('malformed, v1, duplicated, misanchored and unsupported-provider records fail closed', () => {
  assert.throws(() => parseBundleLessonView(null), /object/);
  assert.throws(() => parseBundleLessonView({ ...record(), schemaVersion: 1 }), /schema version 2/);
  assert.throws(() => parseBundleLessonView({ ...record(), sourceId: sourceA }), /unsupported fields/);
  assert.throws(() => parseBundleLessonView({ ...record(), sourceRefs: [record().sourceRefs[0], record().sourceRefs[0]] }), /duplicated/);
  assert.throws(() => parseBundleLessonView({ ...record(), evidence: record().evidence.map((e, i) => i ? e : { ...e, sourceRevision: revisionB }) }), /mismatched source/);
  assert.throws(() => parseBundleLessonView({ ...record(), evidence: record().evidence.map((e, i) => i ? e : { ...e, end: e.end + 1 }) }), /mismatched source/);
  assert.throws(() => parseBundleLessonView({ ...record(), chapters: record().chapters.map((c, i) => i ? c : { ...c, citationIds: ['missing'] }) }), /unknown or repeated/);
  assert.throws(() => parseBundleLessonView({ ...record(), mode: 'cloud-v2', provider: 'unapproved' }), /provider metadata/);
  assert.throws(() => parseBundleLessonView({ ...record(), provider: 'google' }), /local records cannot include provider/);
  assert.throws(() => parseBundleLessonView({ ...record(), quiz: record().quiz.map(q => ({ ...q, supportQuote: 'not in the citation' })) }), /exact cited support/);
});

test('read handler invokes only explicit chapters from the parsed record', () => {
  const parsed = parseBundleLessonView(record()), calls = [];
  const actions = createBundleLessonViewActions(parsed.record.chapters, text => calls.push(text));
  assert.equal(calls.length, 0);
  assert.equal(actions.readChapter(parsed.record.chapters[0]), true);
  assert.deepEqual(calls, ['First source. Read the exact first passage. Name its locator.']);
  assert.equal(actions.readChapter({ ...parsed.record.chapters[0] }), false);
  assert.equal(calls.length, 1);
});

