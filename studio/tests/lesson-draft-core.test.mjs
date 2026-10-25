import test from 'node:test';
import assert from 'node:assert/strict';
import { draftFromLesson, draftToLesson, editDraft, validateDraft } from '../src/lesson-draft-core/model.ts';

const quote = 'A learner should inspect the source and explain the connection in their own words.';
const lesson = {
  id: '111111111111111111111111', sourceId: '222222222222222222222222', sourceTitle: 'Study notes',
  title: 'Evidence and explanation', objective: 'Connect a claim to its source.',
  chapters: [
    { title: 'Read the claim', explanation: 'Read this claim carefully.', example: 'Find the words that support it.', citationIds: ['E1'] },
    { title: 'Explain the link', explanation: 'Describe how the evidence supports the claim.', example: 'Give a related example.', citationIds: ['E2'] },
  ],
  quiz: [
    { question: 'Which action checks the claim?', options: ['Inspect the source', 'Guess', 'Skip it', 'Copy a title'], correct: 0, explanation: 'The source contains the evidence.', citationIds: ['E1'], supportQuote: quote },
    { question: 'What should a learner explain?', options: ['The connection', 'A guess', 'A score', 'A credential'], correct: 0, explanation: 'Explain how evidence supports the claim.', citationIds: ['E2'], supportQuote: 'Describe how the evidence supports the claim.' },
  ],
  evidence: [
    { id: 'E1', sourceId: '222222222222222222222222', title: 'Study notes', locator: 'page 1', quote, start: 0, end: quote.length, edited: false },
    { id: 'E2', sourceId: '222222222222222222222222', title: 'Study notes', locator: 'page 2', quote: 'Describe how the evidence supports the claim.', start: 0, end: 46, edited: false },
  ],
  mode: 'local-extractive', model: null, revision: 'source-revision-7', createdAt: '2026-10-23T00:00:00Z',
  coverage: 'Reviewed sections only.', reviewWarning: 'Citations are traceability, not independent fact checking.',
};

test('native lesson maps to stable blocks with citation and question mappings intact', () => {
  const draft = draftFromLesson(lesson);
  assert.deepEqual(draftToLesson(draft, lesson), lesson);
  assert.deepEqual(draft.blocks.map(block => block.id), [
    'chapter-0-explanation', 'chapter-0-worked-example', 'chapter-1-explanation', 'chapter-1-worked-example', 'question-0', 'question-1',
  ]);
  assert.deepEqual(draft.blocks[0].citationIds, ['E1']);
  assert.deepEqual(draft.blocks[4].question, { options: [...lesson.quiz[0].options], correct: 0, supportQuote: quote });
  const projected = draftToLesson(draft, lesson);
  assert.equal(projected.id, lesson.id);
  assert.equal(projected.sourceId, lesson.sourceId);
  assert.equal(projected.revision, lesson.revision);
  assert.equal(projected.title, lesson.title);
  assert.deepEqual(projected.quiz, lesson.quiz);
});

test('validation clones accepted data and rejects extra keys, duplicate IDs, wrong identity or citation', () => {
  const draft = draftFromLesson(lesson);
  const accepted = validateDraft(draft, lesson);
  assert.notEqual(accepted, draft);
  accepted.blocks[0].citationIds.push('E2');
  assert.deepEqual(draft.blocks[0].citationIds, ['E1']);

  for (const [index, mutate] of [
    value => { value.extra = true; },
    value => { value.blocks[0].unexpected = true; },
    value => { value.blocks[1].id = value.blocks[0].id; },
    value => { value.blocks[0].citationIds = ['not-evidence']; },
    value => { value.sourceRevision = 'stale'; },
    value => { value.sourceId = '333333333333333333333333'; },
    value => { value.blocks[4].question.correct = 1; },
    value => { value.blocks[4].question.options[0] = 'different answer'; },
    value => { value.blocks[4].question.supportQuote = 'new quote'; },
    value => { value.blocks[4].text = 'A different scored question'; },
    value => { value.blocks[0].text = 'New authored wording'; },
    value => { value.blocks[0].text = 'New authored wording'; value.blocks[0].origin = 'generated'; },
    value => { value.blocks[0].origin = 'source'; },
  ].entries()) {
    const changed = structuredClone(draft);
    mutate(changed);
    assert.throws(() => validateDraft(changed, lesson), TypeError, `mutation ${index} should be rejected`);
  }
});

test('source provenance requires the exact text to occur in its cited evidence', () => {
  const sourceLesson = structuredClone(lesson);
  sourceLesson.chapters[0].explanation = quote;
  const draft = draftFromLesson(sourceLesson);
  assert.equal(draft.blocks[0].origin, 'source');
  assert.doesNotThrow(() => validateDraft(draft, sourceLesson));
  const authored = editDraft(draft, { kind: 'edit', id: 'chapter-0-explanation', patch: { text: 'A new interpretation.' } });
  assert.equal(authored.blocks[0].origin, 'authored');
  const forged = structuredClone(draft);
  forged.blocks[0].text = 'A fabricated interpretation.';
  assert.throws(() => validateDraft(forged, sourceLesson), /provenance/);
});

test('editing and splitting are immutable, retain source anchors and mark changed prose authored', () => {
  const draft = draftFromLesson(lesson);
  const changed = editDraft(draft, { kind: 'edit', id: 'chapter-0-explanation', patch: { text: 'A clearer explanation.' } });
  assert.equal(draft.blocks[0].text, 'Read this claim carefully.');
  assert.equal(changed.blocks[0].origin, 'authored');
  assert.deepEqual(changed.blocks[0].citationIds, ['E1']);

  const split = editDraft(changed, { kind: 'split', id: 'chapter-0-explanation', newId: 'block-new-part', offset: 8 });
  assert.equal(split.blocks[1].id, 'chapter-0-explanation~block-new-part');
  assert.deepEqual(split.blocks[1].citationIds, ['E1']);
  assert.equal(split.blocks[1].origin, 'authored');
  assert.doesNotThrow(() => validateDraft(split, lesson));
  const projected = draftToLesson(split, lesson);
  assert.deepEqual(projected.chapters.slice(0, 2).map(chapter => chapter.explanation), [split.blocks[0].text, split.blocks[1].text]);
  assert.deepEqual(projected.chapters[0].citationIds, ['E1']);
  assert.equal(projected.id, lesson.id);
  assert.equal(projected.revision, lesson.revision);
});

test('native projection follows teaching block order and keeps a surviving example readable', () => {
  let draft = draftFromLesson(lesson);
  draft = editDraft(draft, { kind: 'move', id: 'chapter-0-worked-example', direction: -1 });
  let projected = draftToLesson(draft, lesson);
  assert.deepEqual(projected.chapters.slice(0, 2).map(chapter => chapter.explanation), ['Find the words that support it.', 'Read this claim carefully.']);

  draft = editDraft(draft, { kind: 'remove', id: 'chapter-0-explanation' });
  draft = editDraft(draft, { kind: 'remove', id: 'chapter-1-explanation' });
  draft = editDraft(draft, { kind: 'remove', id: 'chapter-1-worked-example' });
  projected = draftToLesson(draft, lesson);
  assert.deepEqual(projected.chapters.map(chapter => chapter.explanation), ['Find the words that support it.']);
  assert.deepEqual(projected.chapters[0].citationIds, ['E1']);
});

test('block ordering and deletion preserve each question association by fixed native ID', () => {
  let draft = draftFromLesson(lesson);
  draft = editDraft(draft, { kind: 'move', id: 'question-1', direction: -1 });
  const movedLesson = draftToLesson(draft, lesson);
  assert.deepEqual(movedLesson.quiz.map(question => question.question), ['What should a learner explain?', 'Which action checks the claim?']);
  assert.equal(movedLesson.quiz[0].correct, 0);
  assert.equal(movedLesson.quiz[0].explanation, lesson.quiz[1].explanation);
  assert.deepEqual(movedLesson.quiz[0].citationIds, ['E2']);

  draft = editDraft(draft, { kind: 'remove', id: 'question-0' });
  assert.deepEqual(draftToLesson(draft, lesson).quiz.map(question => question.question), ['What should a learner explain?']);
});

test('reflection add, edit, layout and title are retained without inventing a scored answer', () => {
  let draft = draftFromLesson(lesson);
  draft = editDraft(draft, { kind: 'add-reflection', id: 'reflection-1' });
  draft = editDraft(draft, { kind: 'edit', id: 'reflection-1', patch: { title: 'My connection', text: 'I can explain this claim because…' } });
  draft = editDraft(draft, { kind: 'layout', layout: 'split' });
  draft = editDraft(draft, { kind: 'title', title: 'My source-linked lesson' });
  const projected = draftToLesson(draft, lesson);
  assert.equal(draft.layout, 'split');
  assert.equal(projected.title, 'My source-linked lesson');
  assert.equal(projected.quiz.length, lesson.quiz.length);
  assert.equal(draft.blocks.at(-1).origin, 'authored');
  assert.equal(draft.blocks.at(-1).citationIds.length, 0);
  draft = editDraft(draft, { kind: 'remove', id: 'chapter-0-explanation' });
  draft = editDraft(draft, { kind: 'remove', id: 'chapter-0-worked-example' });
  draft = editDraft(draft, { kind: 'remove', id: 'chapter-1-explanation' });
  assert.throws(() => editDraft(draft, { kind: 'remove', id: 'chapter-1-worked-example' }), /last teaching block/);
});

test('question wording and split are rejected by edit operations; resource bounds are enforced', () => {
  const draft = draftFromLesson(lesson);
  assert.throws(() => editDraft(draft, { kind: 'edit', id: 'question-0', patch: { text: 'Changed prompt' } }), /scored prompt/);
  assert.throws(() => editDraft(draft, { kind: 'split', id: 'question-0', newId: 'split-q', offset: 4 }), /Only explanations/);
  assert.throws(() => editDraft(draft, { kind: 'split', id: 'chapter-0-explanation', newId: 'split-bad', offset: 0 }), /inside the block/);
  const tooLong = structuredClone(draft);
  tooLong.blocks[0].text = 'x'.repeat(2401);
  assert.throws(() => validateDraft(tooLong, lesson), /2400/);
  const largeLesson = structuredClone(lesson);
  const longEvidenceId = 'C'.repeat(30000);
  largeLesson.evidence = largeLesson.evidence.map(item => ({ ...item, id: longEvidenceId }));
  largeLesson.chapters = largeLesson.chapters.map(chapter => ({ ...chapter, citationIds: [longEvidenceId] }));
  largeLesson.quiz = largeLesson.quiz.map(question => ({ ...question, citationIds: [longEvidenceId] }));
  assert.throws(() => validateDraft(draftFromLesson(largeLesson), largeLesson), /128 KiB/);
  const tooMany = structuredClone(draft);
  tooMany.blocks = Array.from({ length: 41 }, (_, i) => ({ ...draft.blocks[0], id: `chapter-0-explanation~copy${i}` }));
  assert.throws(() => validateDraft(tooMany, lesson), /40 blocks/);
  const full = { ...draft, blocks: [...draft.blocks, ...Array.from({ length: 34 }, (_, i) => ({ id: `reflection-${i}`, kind: 'reflection', title: 'Reflection', text: '', citationIds: [], origin: 'authored' }))] };
  assert.throws(() => editDraft(full, { kind: 'add-reflection', id: 'reflection-overflow' }), /40 blocks/);
  assert.throws(() => editDraft(full, { kind: 'split', id: 'chapter-0-explanation', newId: 'overflow', offset: 4 }), /40 blocks/);
  assert.throws(() => editDraft(draft, { kind: 'remove', id: 'question-0', surprise: true }), /unsupported field/);
});
