import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyGoalEdit,
  createRequestGate,
  hasUnsavedPaste,
  hasUnsavedSourceText,
  requestLatest,
  sourceCommitFromResult,
} from '../src/source-continuity/guards.ts';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test('dirty boundary warns only when source edits or an unfinished paste differ from saved state', () => {
  const source = { pages: [{ text: 'Saved page one' }, { text: 'Saved page two' }] };
  assert.equal(hasUnsavedSourceText(source, ['Saved page one', 'Saved page two']), false);
  assert.equal(hasUnsavedSourceText(source, ['Corrected page one', 'Saved page two']), true);
  assert.equal(hasUnsavedSourceText(source, ['Saved page one']), true);
  assert.equal(hasUnsavedSourceText(null, ['Pasted text']), false);
  assert.equal(hasUnsavedPaste('  ', '\n'), false);
  assert.equal(hasUnsavedPaste('Role notes', ''), true);
  assert.equal(hasUnsavedPaste('', 'Unreviewed passage'), true);
});

test('a newer explicit source selection wins over a delayed deep-link load', async () => {
  const gate = createRequestGate();
  const deepLink = deferred();
  const explicitChoice = deferred();
  const committed = [];
  const initialLoad = requestLatest(gate, () => deepLink.promise);
  const selected = requestLatest(gate, () => explicitChoice.promise);

  explicitChoice.resolve({ id: 'chosen-by-learner' });
  const selectedResult = await selected;
  if (selectedResult.status === 'value') committed.push(selectedResult.value.id);
  deepLink.resolve({ id: 'old-query-parameter' });
  const initialResult = await initialLoad;
  if (initialResult.status === 'value') committed.push(initialResult.value.id);

  assert.equal(selectedResult.status, 'value');
  assert.equal(initialResult.status, 'stale');
  assert.deepEqual(committed, ['chosen-by-learner']);
});

test('editing saved source text invalidates delayed generation results', async () => {
  const gate = createRequestGate();
  const generation = deferred();
  const committed = [];
  const resultPromise = requestLatest(gate, () => generation.promise);

  gate.invalidate(); // SourceWorkspace does this when an editor value changes.
  generation.resolve({ sourceRevision: 'previous-saved-revision' });
  const result = await resultPromise;
  if (result.status === 'value') committed.push(result.value);

  assert.equal(result.status, 'stale');
  assert.deepEqual(committed, []);
});

test('a delayed failure from an invalidated request is stale rather than a current error', async () => {
  const gate = createRequestGate();
  const request = deferred();
  const pending = requestLatest(gate, () => request.promise);
  gate.invalidate();
  request.reject(new Error('old source failed'));
  assert.deepEqual(await pending, { status: 'stale' });
});

test('a current request preserves its failure for the caller to report', async () => {
  const gate = createRequestGate();
  const error = new Error('current source failed');
  const result = await requestLatest(gate, async () => { throw error; });
  assert.equal(result.status, 'error');
  if (result.status === 'error') assert.equal(result.error, error);
});

test('saving reviewed text commits the new revision while retaining an unrelated raw paste draft', () => {
  const draft = { title: 'My role notes  ', paste: '  Keep these unreviewed lines exactly.\n' };
  const saved = { id: 'source-1', reviewed: true, pages: [{ text: 'extracted' }], reviewedPages: [{ text: 'Learner corrected text' }] };
  const result = sourceCommitFromResult({ status: 'value', value: saved }, draft, { preservePaste: true });

  assert.deepEqual(result, {
    source: saved,
    texts: ['Learner corrected text'],
    title: draft.title,
    paste: draft.paste,
    confirmed: true,
    reading: true,
  });
});

test('a successful paste create consumes only the exact captured draft', () => {
  const source = { id: 'paste-1', reviewed: false, pages: [{ text: 'Extracted passage' }] };
  const captured = { title: 'Draft title', paste: '  original text  ' };
  const unchanged = sourceCommitFromResult({ status: 'value', value: source }, captured, { consumedPaste: captured });
  assert.equal(unchanged.title, '');
  assert.equal(unchanged.paste, '');

  const newerDraft = { title: 'New title', paste: 'newer text, typed during the request' };
  const preserved = sourceCommitFromResult({ status: 'value', value: source }, newerDraft, { consumedPaste: captured });
  assert.equal(preserved.title, newerDraft.title);
  assert.equal(preserved.paste, newerDraft.paste);
});

test('stale or failed source requests produce no commit, preserving current workspace state', () => {
  const current = { title: 'Unsaved title', paste: 'Unsaved passage' };
  assert.equal(sourceCommitFromResult({ status: 'stale' }, current, { consumedPaste: current }), null);
  assert.equal(sourceCommitFromResult({ status: 'error', error: new Error('save failed') }, current, { consumedPaste: current }), null);
  assert.deepEqual(current, { title: 'Unsaved title', paste: 'Unsaved passage' });
});

test('goal edits clear a consumed lesson and make an in-flight result stale', async () => {
  const gate = createRequestGate();
  const generation = deferred();
  const originalLesson = { id: 'lesson-for-old-goal' };
  const pending = requestLatest(gate, () => generation.promise);
  const nextState = applyGoalEdit(gate, { goal: 'Explain it', created: originalLesson }, 'Compare it');

  assert.deepEqual(nextState, { goal: 'Compare it', created: null });
  generation.resolve({ id: 'late-old-goal-lesson' });
  assert.equal((await pending).status, 'stale');
});
