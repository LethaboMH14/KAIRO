import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chapterEvidence,
  chapterIndex,
  classroomHref,
  loadReviewedLesson,
} from '../src/source-classroom/session.ts';

const lessonId = '0123456789abcdef01234567';
const sourceId = 'abcdef0123456789abcdef01';
const pageText = 'A public synthetic passage for checking citation offsets.';
const quote = 'synthetic passage';
const start = pageText.indexOf(quote);

function fixture() {
  const evidence = {
    id: 'ev-1', sourceId, title: 'Synthetic public sample', locator: 'page 1',
    quote, start, end: start + quote.length, edited: false,
  };
  const lesson = {
    id: lessonId, sourceId, sourceTitle: 'Synthetic public sample',
    title: 'A boundary lesson', objective: 'Check grounded citations.',
    chapters: [
      { title: 'First', explanation: 'A checked explanation.', example: 'Example one.', citationIds: ['ev-1'] },
      { title: 'Second', explanation: 'Another checked explanation.', example: 'Example two.', citationIds: ['ev-2'] },
    ],
    quiz: [], evidence: [evidence, {
      id: 'ev-2', sourceId, title: 'Synthetic public sample', locator: 'page 1',
      quote: 'checking citation', start: pageText.indexOf('checking citation'),
      end: pageText.indexOf('checking citation') + 'checking citation'.length, edited: true,
    }],
    mode: 'local', model: null, revision: 'review-r7', createdAt: '2026-10-23T00:00:00.000Z',
    coverage: 'Synthetic fixture only.', reviewWarning: 'Synthetic fixture only.',
  };
  const source = {
    id: sourceId, title: 'Synthetic public sample', pages: [],
    reviewedPages: [{ text: pageText, locator: 'page 1', method: 'synthetic' }],
    reviewed: true, revision: 'review-r7', limitNote: 'Synthetic fixture only.',
  };
  return { lesson, source };
}

function loaderFor({ lesson, source }, calls = []) {
  return async (path, signal) => {
    calls.push({ path, signal });
    if (path === `/lesson/${lessonId}`) return lesson;
    if (path === `/source/${sourceId}`) return source;
    throw new Error(`Unexpected path: ${path}`);
  };
}

test('loads lesson first, then checks reviewed source and preserves citation data', async () => {
  const data = fixture();
  const calls = [];
  const result = await loadReviewedLesson(lessonId, loaderFor(data, calls), new AbortController().signal);

  assert.deepEqual(calls.map(({ path }) => path), [`/lesson/${lessonId}`, `/source/${sourceId}`]);
  assert.equal(result, data.lesson);
  assert.deepEqual(result.evidence[0], data.lesson.evidence[0]);
  assert.equal(calls[0].signal, calls[1].signal);
});

test('rejects malformed saved lesson IDs before calling the injected loader', async () => {
  let calls = 0;
  await assert.rejects(loadReviewedLesson('../lesson', async () => { calls++; }, new AbortController().signal), /saved lesson/);
  assert.equal(calls, 0);
  assert.throws(() => classroomHref('not-an-id'), /saved lesson/);
});

test('rejects a source whose reviewed revision is stale or whose review was withdrawn', async () => {
  for (const change of [
    source => { source.revision = 'review-r8'; },
    source => { source.reviewed = false; },
  ]) {
    const data = fixture();
    change(data.source);
    await assert.rejects(loadReviewedLesson(lessonId, loaderFor(data), new AbortController().signal), /source has changed or needs review/);
  }
});

test('rejects missing chapter citations and citations that do not match reviewed text offsets', async () => {
  const missing = fixture();
  missing.lesson.chapters[0].citationIds = ['unknown'];
  await assert.rejects(loadReviewedLesson(lessonId, loaderFor(missing), new AbortController().signal), /missing its source citation/);

  const mismatch = fixture();
  mismatch.lesson.evidence[0].start += 1;
  mismatch.lesson.evidence[0].end += 1;
  await assert.rejects(loadReviewedLesson(lessonId, loaderFor(mismatch), new AbortController().signal), /citation could not be checked/);
});

test('aborts before any load and propagates cancellation while the lesson request is pending', async () => {
  const alreadyAborted = new AbortController();
  alreadyAborted.abort(new Error('cancelled before start'));
  let calls = 0;
  await assert.rejects(loadReviewedLesson(lessonId, async () => { calls++; }, alreadyAborted.signal), /cancelled before start/);
  assert.equal(calls, 0);

  const duringLesson = new AbortController();
  let resolveLesson;
  const pending = loadReviewedLesson(lessonId, () => new Promise(resolve => { resolveLesson = resolve; }), duringLesson.signal);
  duringLesson.abort(new Error('cancelled during lesson load'));
  resolveLesson(fixture().lesson);
  await assert.rejects(pending, /cancelled during lesson load/);
});

test('aborts between lesson and source requests without starting the source request', async () => {
  const controller = new AbortController();
  const data = fixture();
  const calls = [];
  const load = async (path, signal) => {
    calls.push(path);
    if (path === `/lesson/${lessonId}`) {
      controller.abort(new Error('cancelled before source check'));
      return data.lesson;
    }
    return data.source;
  };

  await assert.rejects(loadReviewedLesson(lessonId, load, controller.signal), /cancelled before source check/);
  assert.deepEqual(calls, [`/lesson/${lessonId}`]);
});

test('clamps chapter indexes, returns only chapter citations and bounds classroom steps', () => {
  const { lesson } = fixture();
  assert.equal(chapterIndex(-4, 2), 0);
  assert.equal(chapterIndex(99, 2), 1);
  assert.equal(chapterIndex(0.5, 2), 0);
  assert.equal(chapterIndex(2, 0), 0);
  assert.deepEqual(chapterEvidence(lesson, 0).map(item => item.id), ['ev-1']);
  assert.deepEqual(chapterEvidence(lesson, 1).map(item => item.id), ['ev-2']);
  assert.equal(classroomHref(lessonId, 1), `/classroom?lesson=${lessonId}&step=1`);
  assert.equal(classroomHref(lessonId, -1), `/classroom?lesson=${lessonId}&step=0`);
});
