import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { selectEvidence } from '../src/evidence-selection-core/model.ts';
import { validateDraft, draftFromLesson } from '../src/lesson-draft-core/model.ts';

const revision = 'a'.repeat(64);
const src = (pages, overrides = {}) => ({ id: 'src-1', title: 'Reviewed source', reviewed: true, revision, reviewedPages: pages, ...overrides });
const page = (text, locator, extra = {}) => ({ text, locator, method: 'text', ...extra });

test('preserves edited flags and distinct locators for repeated passages', () => {
  const result = selectEvidence(src([
    page('Motor speed changes with load.', 'Page 2', { edited: true }),
    page('Motor speed changes with load.', 'Page 9', { edited: false }),
  ]), 'motor speed load');
  assert.equal(result.evidence.length, 2);
  assert.deepEqual(result.evidence.map(e => e.locator), ['Page 2', 'Page 9']);
  assert.deepEqual(result.evidence.map(e => e.edited), [true, false]);
  assert.deepEqual(result.evidence.map(e => e.start), [0, 0]);
});

test('uses UTF-16 offsets and retains multiple late relevant sections within budget', () => {
  const text = '🧭'.repeat(800) + ' Motor rotor slip changes speed. ' + 'x'.repeat(1200) + ' Motor stator field creates torque.';
  const result = selectEvidence(src([page(text, 'Page 1')]), 'motor rotor slip stator field torque', { maxCharacters: 3000, maxChunks: 12 });
  const first = result.evidence.find(e => e.quote.includes('rotor slip'));
  const second = result.evidence.find(e => e.quote.includes('stator field'));
  assert.ok(first && second, 'both relevant late chunks should be selected');
  for (const item of [first, second]) assert.equal(text.slice(item.start, item.end), item.quote);
  assert.equal(first.start, 1400);
  assert.equal(result.selection.method, 'lexical-goal');
});

test('goal with no source match falls back to source order', () => {
  const result = selectEvidence(src([page('First topic.', 'Page 1'), page('Second topic.', 'Page 2')]), 'quantum chromodynamics');
  assert.equal(result.selection.method, 'source-order');
  assert.deepEqual(result.evidence.map(e => e.locator), ['Page 1', 'Page 2']);
});

const lesson = {
  id: '1'.repeat(24), sourceId: '2'.repeat(24), revision,
  title: 'Lesson', objective: 'Check source claims', sourceTitle: 'Source', reviewWarning: '',
  evidence: [{ id: 'E1', title: 'Source', locator: 'Page 1', quote: 'The rotor turns when the field moves.', start: 0, end: 38, edited: false }],
  chapters: [{ title: 'Rotor', explanation: 'Read the claim.', example: 'Check the field.', citationIds: ['E1'] }],
  quiz: [{ question: 'What turns?', options: ['Rotor', 'Field', 'Load', 'None'], correct: 0, explanation: 'The rotor turns.', citationIds: ['E1'], supportQuote: 'The rotor turns' }],
};

test('actual draft validator rejects stale revisions and fabricated support quotes', () => {
  const draft = draftFromLesson(lesson);
  const stale = structuredClone(draft); stale.sourceRevision = 'b'.repeat(64);
  assert.throws(() => validateDraft(stale, lesson), /revision/);
  const forged = structuredClone(draft); forged.blocks.find(b => b.kind === 'question').question.supportQuote = 'Fabricated quote';
  assert.throws(() => validateDraft(forged, lesson), /support quote|source/i);
});
