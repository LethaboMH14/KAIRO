import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyProfile } from '../src/profile/model.ts';
import { initialCase, records, transition } from '../src/practice/model.ts';
import { preparePracticePortfolioExport } from '../src/practice/export-recovery.ts';

function completedRun() {
  let state = transition(initialCase('run-1', 'lesson-7'), { type: 'calculate', value: 23 }, '2026-10-22T08:00:00Z');
  for (const key of Object.keys(records)) state = transition(state, { type: 'inspect', key }, '2026-10-22T08:01:00Z');
  state = transition(state, { type: 'reconcile', difference: 2, cause: 'damage' }, '2026-10-22T08:02:00Z');
  state = transition(state, { type: 'decide', value: 'record' }, '2026-10-22T08:03:00Z');
  return transition(state, { type: 'reflect', value: 'I checked the signed damage entry and recorded the saleable count for the next shift.' }, '2026-10-22T08:04:00Z');
}

test('profile read failure refuses export, keeps the in-memory run intact, and does not call serialization or storage writes', () => {
  const run = completedRun();
  const before = structuredClone(run);
  let reads = 0;
  const result = preparePracticePortfolioExport(() => { reads++; throw new Error('stored profile is malformed'); }, run, null);
  assert.deepEqual(result, { status: 'unreadable' });
  assert.equal(reads, 1);
  assert.deepEqual(run, before);
});

test('ready export includes saved history plus the current run and linked source without mutating saved data', () => {
  const run = completedRun();
  const saved = emptyProfile();
  const before = structuredClone(saved);
  const lesson = { id: 'lesson-7', title: 'Stock records', revision: 'rev-abc123', evidence: [{ id: 'p1', title: 'Closing stock', locator: 'page 2', quote: 'Opening stock plus deliveries minus sales.' }] };
  const result = preparePracticePortfolioExport(() => saved, run, lesson);
  assert.equal(result.status, 'ready');
  assert.match(result.markdown, /Closing time at Nandi’s shop/);
  assert.match(result.markdown, /run-1/);
  assert.match(result.markdown, /Stock records/);
  assert.match(result.markdown, /rev-abc123/);
  assert.match(result.markdown, /Browser-local, self-directed practice/);
  assert.deepEqual(saved, before);
  assert.deepEqual(run, completedRun());
});

function savedCase(id) {
  return { id, lessonId: null, title: `Historical ${id}`, version: 'corner-shop-v1', events: [], completedAt: null, reflection: '' };
}

test('export keeps all 20 saved cases and appends the new current run without persistence', () => {
  const run = completedRun();
  const saved = { ...emptyProfile(), cases: Array.from({ length: 20 }, (_, index) => savedCase(`old-${index}`)) };
  const before = structuredClone(saved);
  const result = preparePracticePortfolioExport(() => saved, run, null);
  assert.equal(result.status, 'ready');
  assert.match(result.markdown, /Run: old-0/);
  assert.match(result.markdown, /Run: old-19/);
  assert.match(result.markdown, /Run: run-1/);
  assert.equal((result.markdown.match(/^Run:/gm) || []).length, 21);
  assert.deepEqual(saved, before);
});

test('export replaces a saved case with the current matching run ID instead of duplicating it', () => {
  const run = completedRun();
  const saved = { ...emptyProfile(), cases: [savedCase('run-1'), ...Array.from({ length: 19 }, (_, index) => savedCase(`old-${index}`))] };
  const before = structuredClone(saved);
  const result = preparePracticePortfolioExport(() => saved, run, null);
  assert.equal(result.status, 'ready');
  assert.equal((result.markdown.match(/^Run: run-1$/gm) || []).length, 1);
  assert.match(result.markdown, /### Closing time at Nandi’s shop/);
  assert.doesNotMatch(result.markdown, /### Historical run-1/);
  assert.equal((result.markdown.match(/^Run:/gm) || []).length, 20);
  assert.deepEqual(saved, before);
});
