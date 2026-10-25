import test from 'node:test';
import assert from 'node:assert/strict';
import { hash, evidenceFor, localLesson } from '../server/workspace/model.mjs';
import { loadCurrentV1Lesson } from '../server/lesson-read-integrity/v1.mjs';

// Synthetic owner-partitioned Firestore-shaped adapter only; no live account,
// Firestore emulator, real learner material, browser or production route.
const SOURCE_ID = 'a'.repeat(24);
const LESSON_ID = 'b'.repeat(24);
const OWNER = 'synthetic-owner-A';
const OTHER = 'synthetic-owner-B';
const clone = value => structuredClone(value);

function fixture() {
  const pages = [{ text: ('Synthetic stator and rotor reading supports a source-linked motor lesson. ').repeat(30),
    locator: 'Page 1', method: 'pasted-text', edited: false }];
  const source = { id: SOURCE_ID, title: 'Synthetic motor reading', reviewed: true,
    reviewedPages: pages, revision: hash(pages) };
  const lesson = { ...localLesson(source, evidenceFor(source)), id: LESSON_ID,
    sourceId: SOURCE_ID, sourceTitle: source.title, revision: source.revision,
    mode: 'local-extractive', createdAt: '2026-10-25T00:00:00Z' };
  const rows = new Map();
  const calls = [];
  let next = 1;
  let hook = () => {};
  const key = (uid, kind, id) => uid + '|' + kind + '|' + id;
  function save(uid, kind, id, value) {
    rows.set(key(uid, kind, id), { version: 'v' + next++, value: clone(value) });
  }
  function erase(uid, kind, id) { rows.delete(key(uid, kind, id)); }
  save(OWNER, 'sources', SOURCE_ID, source);
  save(OWNER, 'revisions', SOURCE_ID + '_' + source.revision, source);
  save(OWNER, 'lessons', LESSON_ID, lesson);
  const repository = {
    async get(uid, kind, id) {
      calls.push([uid, kind, id]);
      const row = clone(rows.get(key(uid, kind, id)) ?? null);
      hook(uid, kind, id);
      return row;
    },
    async put() { throw Error('Read-only guard must never write'); },
  };
  const read = (ownerId = OWNER) => loadCurrentV1Lesson({ repository, ownerId, lessonId: LESSON_ID });
  return { source, lesson, calls, save, erase, read, onGet(fn) { hook = fn; } };
}

async function rejected(f) {
  await assert.rejects(f.read(), error =>
    error?.status === 409 && /current reviewed source/i.test(error.message) &&
    !/Synthetic stator|Page 1|synthetic-owner/i.test(error.message));
}

test('current reviewed v1 lesson retains exact evidence and can be resumed read-only', async () => {
  const f = fixture();
  const result = await f.read();
  assert.equal(result.lesson.id, LESSON_ID);
  assert.equal(result.source.revision, f.source.revision);
  assert.equal(result.sourceRevision, f.source.revision);
  assert.ok(result.lesson.quiz[0].citationIds.length > 0);
  assert.ok(f.calls.every(([uid]) => uid === OWNER));
  assert.equal(f.calls.filter(([, kind]) => kind === 'sources').length, 2);
  assert.equal(f.calls.filter(([, kind]) => kind === 'revisions').length, 2);
});

test('owner partition denies a foreign lesson without fetching its source', async () => {
  const f = fixture();
  await assert.rejects(f.read(OTHER), { status: 404 });
  assert.deepEqual(f.calls, [[OTHER, 'lessons', LESSON_ID]]);
});

test('revocation and re-review invalidate saved lesson while retaining its stored bytes', async () => {
  for (const update of [
    s => ({ ...s, reviewed: false }),
    s => { const pages = [{ ...s.reviewedPages[0], text: 'A new reviewed edition. '.repeat(30) }];
      return { ...s, reviewedPages: pages, revision: hash(pages) }; },
  ]) {
    const f = fixture();
    f.save(OWNER, 'sources', SOURCE_ID, update(f.source));
    await rejected(f);
    assert.equal(f.calls[0][1], 'lessons');
  }
});

test('missing or forged archived source cannot validate a previously saved lesson', async () => {
  const missing = fixture();
  missing.erase(OWNER, 'revisions', SOURCE_ID + '_' + missing.source.revision);
  await rejected(missing);
  const forged = fixture();
  forged.save(OWNER, 'revisions', SOURCE_ID + '_' + forged.source.revision,
    { ...forged.source, reviewedPages: [{ ...forged.source.reviewedPages[0], text: 'Forged content' }] });
  await rejected(forged);
});

test('source mutation during archive read is detected by second source version check', async () => {
  const f = fixture();
  let changed = false;
  f.onGet((uid, kind) => {
    if (!changed && uid === OWNER && kind === 'revisions') {
      changed = true;
      f.save(OWNER, 'sources', SOURCE_ID, { ...f.source, reviewed: false });
    }
  });
  await rejected(f);
  assert.equal(changed, true);
});

test('archived revision deletion during source recheck is detected', async () => {
  const f = fixture();
  let sourceReads = 0;
  f.onGet((_uid, kind) => {
    if (kind === 'sources' && ++sourceReads === 2) {
      f.erase(OWNER, 'revisions', SOURCE_ID + '_' + f.source.revision);
    }
  });
  await rejected(f);
  assert.equal(sourceReads, 2);
});

test('lesson replacement during source validation is detected before returning stale content', async () => {
  const f = fixture();
  let changed = false;
  f.onGet((_uid, kind) => {
    if (!changed && kind === 'revisions') {
      changed = true;
      f.save(OWNER, 'lessons', LESSON_ID, { ...f.lesson, title: 'New saved lesson version' });
    }
  });
  await rejected(f);
  assert.equal(changed, true);
});

test('forged evidence offsets, source, locator, title, revision and duplicate anchors fail closed', async () => {
  const changes = [
    e => ({ ...e, quote: 'A quote not in the source' }),
    e => ({ ...e, start: e.start + 1 }),
    e => ({ ...e, end: e.end - 1 }),
    e => ({ ...e, locator: 'Page 999' }),
    e => ({ ...e, sourceId: 'c'.repeat(24) }),
    e => ({ ...e, title: 'Another source' }),
    e => ({ ...e, sourceRevision: 'f'.repeat(64) }),
    e => ({ ...e, edited: true }),
    e => ({ ...e, id: 'S2-0' }),
  ];
  for (const change of changes) {
    const f = fixture();
    f.save(OWNER, 'lessons', LESSON_ID, {
      ...f.lesson, evidence: [change(f.lesson.evidence[0]), ...f.lesson.evidence.slice(1)],
    });
    await rejected(f);
  }
  const duplicate = fixture();
  duplicate.save(OWNER, 'lessons', LESSON_ID, {
    ...duplicate.lesson, evidence: [duplicate.lesson.evidence[0], duplicate.lesson.evidence[0]],
  });
  await rejected(duplicate);
});

test('chapter and quiz citation forgery is rejected even with valid source excerpts', async () => {
  for (const modify of [
    l => ({ ...l, chapters: [{ ...l.chapters[0], citationIds: ['unknown'] }, ...l.chapters.slice(1)] }),
    l => ({ ...l, quiz: [{ ...l.quiz[0], supportQuote: 'not an exact quote' }] }),
  ]) {
    const f = fixture();
    f.save(OWNER, 'lessons', LESSON_ID, modify(f.lesson));
    await rejected(f);
  }
});

test('cloud-v2 and mixed-version records cannot masquerade as v1', async () => {
  for (const extra of [
    { schemaVersion: 2, sourceRefs: [{ sourceId: SOURCE_ID, revision: 'f'.repeat(64) }] },
    { schemaVersion: 1, sourceRefs: [] },
    { bundleRevision: 'f'.repeat(64) },
  ]) {
    const f = fixture();
    f.save(OWNER, 'lessons', LESSON_ID, { ...f.lesson, ...extra });
    await rejected(f);
  }
});

test('v1 authored published copy retains read access when exact original anchors remain valid', async () => {
  const f = fixture();
  f.save(OWNER, 'lessons', LESSON_ID, { ...f.lesson, parentLessonId: 'c'.repeat(24),
    draftVersion: 2, reviewWarning: 'Edited copy: verify explanations independently.' });
  assert.equal((await f.read()).lesson.draftVersion, 2);
});

test('invalid request and storage failures never silently return an unverified lesson', async () => {
  const f = fixture();
  await assert.rejects(loadCurrentV1Lesson({ repository: { get() { throw Error('Firestore unavailable'); } },
    ownerId: OWNER, lessonId: LESSON_ID }), /Firestore unavailable/);
  await assert.rejects(loadCurrentV1Lesson({ repository: { get: async () => null },
    ownerId: OWNER, lessonId: 'invalid' }), TypeError);
  assert.equal((await f.read()).lesson.id, LESSON_ID);
});
