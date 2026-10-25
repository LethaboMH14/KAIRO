import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { ConflictError, createVersionStore } from '../server/lesson-versions/store.mjs';

const id = n => n.toString(16).padStart(24, '0');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'kairo-lesson-versions-'));
  const path = join(dir, 'versions.sqlite');
  return { path, clean: () => rmSync(dir, { recursive: true, force: true }) };
}
function reviewedSource(sourceId, text, extra = {}) {
  const reviewedPages = [{ text, locator: 'Page 1', method: 'text', edited: false }];
  return { id: sourceId, title: 'Source', reviewed: true, reviewedPages, revision: hash(reviewedPages), ...extra };
}

test('source seed is idempotent, snapshots are immutable, and revisions survive reopen', () => {
  const f = fixture();
  try {
    let store = createVersionStore(f.path);
    const sourceId = id(1);
    const unreviewed = { id: sourceId, title: 'Imported', reviewed: false, pages: [{ text: 'Original' }] };
    assert.equal(store.seedSource(unreviewed), true);
    assert.equal(store.seedSource({ ...unreviewed, title: 'Replacement' }), false);
    assert.equal(store.getSource(sourceId).title, 'Imported');
    const first = reviewedSource(sourceId, 'Reviewed source text A');
    assert.deepEqual(store.reviewSource(sourceId, null, first), first);
    const revisionA = store.getSource(sourceId).revision;
    const second = reviewedSource(sourceId, 'Reviewed source text B');
    store.reviewSource(sourceId, revisionA, second);
    const revisionB = second.revision;
    assert.deepEqual(store.getSource(sourceId, revisionA), first);
    assert.deepEqual(store.getSource(sourceId, revisionB), second);
    const copy = store.getSource(sourceId, revisionA);
    copy.reviewedPages[0].text = 'caller mutation';
    assert.deepEqual(store.getSource(sourceId, revisionA), first);
    store.close();
    store = createVersionStore(f.path);
    assert.deepEqual(store.getSource(sourceId), second);
    assert.deepEqual(store.getSource(sourceId, revisionA), first);
    store.close();
  } finally { f.clean(); }
});

test('separate connections allow only one review of the same expected revision', () => {
  const f = fixture();
  const left = createVersionStore(f.path);
  const right = createVersionStore(f.path);
  try {
    const sourceId = id(2);
    left.seedSource({ id: sourceId, reviewed: false, pages: [] });
    const a = reviewedSource(sourceId, 'Text A');
    const b = reviewedSource(sourceId, 'Text B');
    left.reviewSource(sourceId, null, a);
    const expected = a.revision;
    left.reviewSource(sourceId, expected, b);
    assert.throws(() => right.reviewSource(sourceId, expected, a), ConflictError);
    assert.equal(left.getSource(sourceId).revision, b.revision);
    assert.equal(left.getSource(sourceId, a.revision).revision, a.revision);
  } finally { left.close(); right.close(); f.clean(); }
});

test('draft saves use integer CAS, preserve history, and survive reopen', () => {
  const f = fixture();
  try {
    const store = createVersionStore(f.path);
    const lessonId = id(3);
    const one = { schemaVersion: 1, lessonId, sourceId: id(4), sourceRevision: 'a'.repeat(64), title: 'One', blocks: [] };
    const two = { ...one, title: 'Two' };
    assert.equal(store.getDraft(lessonId), null);
    const v1 = store.saveDraft(lessonId, 0, one);
    assert.equal(v1.version, 1);
    const v2 = store.saveDraft(lessonId, 1, two);
    assert.equal(v2.version, 2);
    assert.deepEqual(store.getDraftVersion(lessonId, 1).document, one);
    assert.deepEqual(store.listDraftVersions(lessonId).map(row => row.version), [2, 1]);
    assert.throws(() => store.saveDraft(lessonId, 1, one), ConflictError);
    const clone = store.getDraft(lessonId);
    clone.document.title = 'Mutated outside';
    assert.equal(store.getDraft(lessonId).document.title, 'Two');
    store.close();
    const reopened = createVersionStore(f.path);
    assert.deepEqual(reopened.getDraft(lessonId).document, two);
    assert.equal(reopened.getDraftVersion(lessonId, 2).updatedAt, v2.updatedAt);
    reopened.close();
  } finally { f.clean(); }
});

test('concurrent draft connections reject stale writes', () => {
  const f = fixture();
  const left = createVersionStore(f.path);
  const right = createVersionStore(f.path);
  try {
    const lessonId = id(5);
    const first = { schemaVersion: 1, lessonId, sourceId: id(12), sourceRevision: 'b'.repeat(64), title: 'first' };
    const next = { ...first, title: 'next' };
    left.saveDraft(lessonId, 0, first);
    right.saveDraft(lessonId, 1, next);
    assert.throws(() => left.saveDraft(lessonId, 1, first), ConflictError);
    assert.equal(right.getDraft(lessonId).document.title, 'next');
  } finally { left.close(); right.close(); f.clean(); }
});

test('invalid IDs, revisions, mismatched identities, and oversized JSON are rejected without partial writes', () => {
  const f = fixture();
  try {
    const store = createVersionStore(f.path);
    assert.throws(() => store.seedSource({ id: '../bad' }), TypeError);
    const inconsistentId = id(13);
    assert.throws(() => store.seedSource({ id: inconsistentId, reviewed: true }), TypeError);
    assert.equal(store.getSource(inconsistentId), null);
    const sourceId = id(6);
    store.seedSource({ id: sourceId, reviewed: false, pages: [] });
    const invalidHash = reviewedSource(sourceId, 'Bad hash', { revision: 'f'.repeat(64) });
    assert.throws(() => store.reviewSource(sourceId, null, invalidHash), TypeError);
    assert.equal(store.getSource(sourceId).reviewed, false);
    assert.throws(() => store.reviewSource(sourceId, null, reviewedSource(id(7), 'wrong ID')), TypeError);
    const lessonId = id(8);
    assert.throws(() => store.saveDraft(lessonId, 0, { lessonId: id(9) }), TypeError);
    assert.equal(store.getDraft(lessonId), null);
    assert.throws(() => store.saveDraft(lessonId, 0, { lessonId, text: 'x'.repeat(128 * 1024) }), TypeError);
    assert.equal(store.getDraft(lessonId), null);
    store.close();
  } finally { f.clean(); }
});

test('a failed compare-and-swap transaction leaves both source head and draft history unchanged', () => {
  const f = fixture();
  let store;
  try {
    store = createVersionStore(f.path);
    const sourceId = id(10);
    const original = reviewedSource(sourceId, 'Original');
    store.seedSource({ id: sourceId, reviewed: false, pages: [] });
    store.reviewSource(sourceId, null, original);
    assert.throws(() => store.reviewSource(sourceId, null, reviewedSource(sourceId, 'Another')), ConflictError);
    assert.equal(store.getSource(sourceId).revision, original.revision);
    const lessonId = id(11);
    const draft = { schemaVersion: 1, lessonId, sourceId, sourceRevision: original.revision, title: 'Saved' };
    store.saveDraft(lessonId, 0, draft);
    assert.throws(() => store.saveDraft(lessonId, 0, { ...draft, title: 'Rejected' }), ConflictError);
    assert.deepEqual(store.listDraftVersions(lessonId).map(row => row.version), [1]);
    assert.equal(store.getDraft(lessonId).document.title, 'Saved');
  } finally { store?.close(); f.clean(); }
});
