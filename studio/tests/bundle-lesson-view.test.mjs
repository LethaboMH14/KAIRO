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
  assert.match(html, /<details><summary>Source details<\/summary><p>Source ID <code>aaaaaaaaaaaaaaaaaaaaaaaa<\/code><\/p><p>Revision <code>111111/);
  assert.match(html, /<details><summary>Source details<\/summary><p>Source ID <code>bbbbbbbbbbbbbbbbbbbbbbbb<\/code><\/p><p>Revision <code>222222/);
  assert.match(html, /Page 1 · 12–47/); assert.match(html, /Exact quote from reviewed source A\./);
  assert.match(html, /Some selected material is not covered in the lesson/);
  assert.match(html, /No cited excerpt is included from Selected source 2\./);
  assert.match(html, /The excerpt at Page 2 in Synthetic motor notes is not cited by a chapter\./);
  assert.doesNotMatch(html, new RegExp(`source ${sourceB}|Evidence ev-b`));
  assert.match(html, /does not submit answers or record a score/);
  assert.doesNotMatch(html, /<form\b|type="submit"/i);
});

test('actual SSR includes practice preview by default and omits only that preview when disabled', () => {
  const props = { record: record(), onRead() {}, onStop() {} };
  const withPreview = render(props);
  const withoutPreview = render({ ...props, showPracticePreview: false });
  const practiceSection = /<section aria-label="Read-only practice prompts">[\s\S]*?<\/section>/;
  assert.match(withPreview, practiceSection);
  assert.doesNotMatch(withoutPreview, practiceSection);
  assert.equal(withPreview.replace(practiceSection, ''), withoutPreview);
  assert.match(withoutPreview, /Exact quote from reviewed source A\./);
  assert.match(withoutPreview, /Page 1 · 12–47/);
  assert.match(withoutPreview, /href="#blv-evidence-[^"]+ev-a"/);
  assert.match(withoutPreview, /<summary>Source details<\/summary>/);
});

test('actual SSR source identifiers and revisions are available under accessible disclosures', () => {
  const html = render({ record: record(), onRead() {}, onStop() {} });
  assert.equal((html.match(/<summary>Source details<\/summary>/g) || []).length, 4);
  assert.match(html, /Source ID <code>aaaaaaaaaaaaaaaaaaaaaaaa<\/code>/);
  assert.match(html, /Source ID <code>bbbbbbbbbbbbbbbbbbbbbbbb<\/code>/);
  assert.match(html, /Revision <code>1111111111111111111111111111111111111111111111111111111111111111<\/code>/);
  assert.match(html, /Revision <code>2222222222222222222222222222222222222222222222222222222222222222<\/code>/);
  assert.match(html, /Page 1 · 12–47/);
  assert.match(html, /<blockquote>Exact quote from reviewed source A\.<\/blockquote>/);
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


test('repeated component instances have unique IDs for every labelled section and anchor',()=>{
 const html=renderToStaticMarkup(React.createElement(React.Fragment,null,...[1,2].map(key=>React.createElement(BundleLessonView,{key,record:record(),onRead(){},onStop(){}}))));
 const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const m of html.matchAll(/aria-labelledby="([^"]+)"/g))assert.ok(ids.includes(m[1]));
});
