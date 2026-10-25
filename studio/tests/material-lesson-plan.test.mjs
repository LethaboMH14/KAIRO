import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMaterialCards, compileMaterialGoal } from '../src/material-lesson-plan/model.ts';

// Synthetic fixture only: all titles, page text and locators below are invented test data.
const makeSource = (overrides = {}) => {
  const pages = [
    { text: 'Original synthetic first page text for comparison.', locator: 'Synthetic page 1', method: 'test', edited: false },
    { text: 'Original synthetic second page text for comparison.', locator: 'Synthetic page 2', method: 'test', edited: false },
  ];
  const reviewedPages = [
    { text: 'Reviewed synthetic passage one. Keep only what the source states.', locator: 'Synthetic page 1', method: 'test', edited: true },
    { text: 'Reviewed synthetic passage two. Check the exact words before using them.', locator: 'Synthetic page 2', method: 'test', edited: false },
  ];
  return { id: 'source-synthetic-01', title: 'Synthetic fixture source', pages, reviewedPages, reviewed: true, revision: 'synthetic-revision-7', limitNote: 'Synthetic fixture only.', ...overrides };
};
const baseBrief = { goal: 'Explain one claim using the passage.', depth: 'standard', approach: 'read' };

test('reviewed unchanged pages produce exact source-linked cards and readable learner steps', () => {
  const source = makeSource();
  const cards = buildMaterialCards(source, source.reviewedPages.map(page => page.text), baseBrief);
  assert.equal(cards.length, 2);
  assert.ok(cards.every(card => card.status === 'reviewed-source'));
  assert.equal(cards[0].title, 'Read · Synthetic fixture source · Synthetic page 1');
  assert.deepEqual(cards[0].citation, {
    locator: 'Synthetic page 1', quote: source.reviewedPages[0].text,
    sourceId: source.id, revision: source.revision,
  });
  assert.match(cards[1].steps[0], /goal in mind/);
  assert.match(cards[0].steps[1], /Relate the passage to your goal/);
  assert.ok(cards[0].citation.quote.length <= 360);
  assert.ok(source.reviewedPages[0].text.includes(cards[0].citation.quote));
});

test('dirty text, missing revision and unreviewed sources remain draft with no citation', () => {
  const source = makeSource(); const texts = source.reviewedPages.map(page => page.text);
  const dirty = buildMaterialCards(source, ['Unsaved synthetic edit.', texts[1]], baseBrief);
  assert.ok(dirty.every(card => card.status === 'draft' && card.citation === null));
  const noRevision = makeSource({ revision: undefined });
  assert.ok(buildMaterialCards(noRevision, noRevision.reviewedPages.map(page => page.text), baseBrief).every(card => card.citation === null));
  const unreviewed = makeSource({ reviewed: false });
  assert.ok(buildMaterialCards(unreviewed, unreviewed.reviewedPages.map(page => page.text), baseBrief).every(card => card.status === 'draft' && card.citation === null));
});

test('stale text and reordered pages cannot cite the current review locators', () => {
  const source = makeSource();
  const oldRevisionText = ['Prior synthetic review revision, page one.', 'Prior synthetic review revision, page two.'];
  const stale = buildMaterialCards(source, oldRevisionText, baseBrief);
  assert.ok(stale.every(card => card.citation === null && card.status === 'draft'));
  const reordered = buildMaterialCards(source, [...source.reviewedPages].reverse().map(page => page.text), baseBrief);
  assert.ok(reordered.every(card => card.citation === null && card.status === 'draft'));
  const wrongLocatorMap = makeSource();
  wrongLocatorMap.reviewedPages[0].locator = 'Synthetic page 2';
  const mismapped = buildMaterialCards(wrongLocatorMap, wrongLocatorMap.reviewedPages.map(page => page.text), baseBrief);
  assert.ok(mismapped.every(card => card.citation === null && card.status === 'draft'));
});

test('empty sources and empty pages create no fabricated quote or placeholder card', () => {
  assert.deepEqual(buildMaterialCards(null, [], baseBrief), []);
  const source = makeSource({ pages: [], reviewedPages: [], revision: 'synthetic-empty-revision' });
  assert.deepEqual(buildMaterialCards(source, [], baseBrief), []);
  const emptyPageSource = makeSource({ pages: [{ text: '', locator: 'Synthetic empty page', method: 'test' }], reviewedPages: [{ text: '', locator: 'Synthetic empty page', method: 'test' }], revision: 'synthetic-empty-revision' });
  assert.deepEqual(buildMaterialCards(emptyPageSource, [''], baseBrief), []);
});

test('cards are capped at three and invalid current text input fails closed', () => {
  const source = makeSource();
  const pages = Array.from({ length: 4 }, (_, index) => ({ text: `Reviewed synthetic page ${index + 1}.`, locator: `Synthetic page ${index + 1}`, method: 'test' }));
  const expanded = makeSource({ pages, reviewedPages: pages, revision: 'synthetic-four-page-revision' });
  const cards = buildMaterialCards(expanded, pages.map(page => page.text), baseBrief);
  assert.equal(cards.length, 3);
  assert.throws(() => buildMaterialCards(source, ['ok', null], baseBrief), /array of strings/);
  assert.throws(() => buildMaterialCards(source, source.reviewedPages.map(page => page.text), { ...baseBrief, depth: 'expert' }), /goal, depth and approach/);
});

test('goal compiler gives the explicit learner goal precedence, bounds output and has deterministic safe defaults', () => {
  const explicit = `  ${'Synthetic learner goal '.repeat(30)}  `;
  const compiled = compileMaterialGoal({ ...baseBrief, goal: explicit, approach: 'worked', depth: 'deep' });
  assert.ok(compiled.length <= 300);
  assert.ok(compiled.startsWith(explicit.trim().slice(0, explicit.trim().indexOf(' ', 200))));
  assert.match(compiled, /Depth: deep/);
  assert.match(compiled, /Approach: trace only source-stated steps/);
  const normalGoal = 'Explain why the supplied source passage matters.';
  const readCompiled = compileMaterialGoal({ ...baseBrief, goal: normalGoal, depth: 'short', approach: 'read' });
  const practiceCompiled = compileMaterialGoal({ ...baseBrief, goal: normalGoal, depth: 'deep', approach: 'practice' });
  assert.match(readCompiled, /^Explain why the supplied source passage matters\.\nDepth: short/);
  assert.match(readCompiled, /Approach: read and check the source/);
  assert.match(practiceCompiled, /Depth: deep/);
  assert.match(practiceCompiled, /Approach: explain one source-backed claim/);
  assert.notEqual(readCompiled, practiceCompiled);
  assert.match(compileMaterialGoal({ ...baseBrief, goal: '', approach: 'practice', depth: 'short' }), /Choose one claim/);
  assert.match(compileMaterialGoal({ ...baseBrief, goal: '', approach: 'worked', depth: 'deep' }), /leaves unspecified/);
  const frozenBrief = Object.freeze({ ...baseBrief, goal: 'Keep this synthetic goal.' });
  const before = JSON.stringify(frozenBrief);
  compileMaterialGoal(frozenBrief);
  assert.equal(JSON.stringify(frozenBrief), before);
  assert.throws(() => compileMaterialGoal({ ...baseBrief, goal: null }), /goal, depth and approach/);
});

test('builder preserves deeply frozen source, current texts and brief', () => {
  const raw = makeSource();
  const source = Object.freeze({ ...raw, pages: Object.freeze(raw.pages.map(page => Object.freeze({ ...page }))), reviewedPages: Object.freeze(raw.reviewedPages.map(page => Object.freeze({ ...page }))) });
  const texts = Object.freeze(source.reviewedPages.map(page => page.text));
  const brief = Object.freeze({ ...baseBrief });
  const before = JSON.stringify({ source, texts, brief });
  buildMaterialCards(source, texts, brief);
  assert.equal(JSON.stringify({ source, texts, brief }), before);
});
