import test from 'node:test';
import assert from 'node:assert/strict';
import { selectEvidence } from '../src/evidence-selection-core/model.ts';

const revision = 'a'.repeat(64);
const source = (pages, overrides = {}) => ({ id: 'src-1', title: 'Reviewed motor notes', reviewed: true, revision, reviewedPages: pages, ...overrides });
const page = (text, extra = {}) => ({ text, locator: 'section 2', method: 'text', ...extra });

test('finds relevant material after the former first-12k prefix and returns exact offsets', () => {
  const prefix = 'x'.repeat(12000);
  const relevant = 'Motor rotor speed depends on load and slip. 🧭';
  const result = selectEvidence(source([page(prefix + relevant, { edited: true })]), 'Explain motor rotor slip');
  const item = result.evidence.find(e => e.quote.includes('rotor speed'));
  assert.ok(item);
  assert.ok(result.evidence[0].quote.includes('Motor rotor speed'), 'the first-four lesson consumer must receive the late relevant passage');
  assert.ok(result.evidence.slice(0, 4).some(e => e.quote.includes('Motor rotor speed')));
  assert.equal(item.start, 11200);
  assert.equal(item.end - item.start, item.quote.length);
  assert.equal((prefix + relevant).slice(item.start, item.end), item.quote);
  assert.equal(item.edited, true);
  assert.equal(item.id, 'S1-11200');
});

test('caps selected text and chunk count, with deterministic source-order ties', () => {
  const text = Array.from({ length: 8 }, (_, i) => `motor rotor load speed section${i} ` + 'z'.repeat(300)).join('\n');
  const result = selectEvidence(source([page(text)]), 'motor rotor load speed', { maxCharacters: 1000, maxChunks: 2 });
  assert.ok(result.evidence.length <= 2);
  assert.ok(result.selection.selectedCharacters <= 1000);
  assert.ok(result.selection.omittedCharacters > 0);
  const repeat = selectEvidence(source([page(text)]), 'motor rotor load speed', { maxCharacters: 1000, maxChunks: 2 });
  assert.deepEqual(result.evidence.map(e => e.id), repeat.evidence.map(e => e.id));
});

test('uses source order when goal has only stopwords or no matches', () => {
  const result = selectEvidence(source([page('First idea.'), page('Other subject.')]), 'the and with');
  assert.equal(result.selection.method, 'source-order');
  assert.deepEqual(result.evidence.map(e => e.locator), ['section 2', 'section 2']);
  assert.deepEqual(result.selection.matchedTerms, []);
  assert.equal(selectEvidence(source([page('Any text.')]), '').selection.method, 'source-order');
});

test('clips the highest-ranked chunk to small character budgets without splitting surrogate pairs', () => {
  const text = 'motor ' + '🧭'.repeat(800);
  for (const budget of [1, 20, 1399]) {
    const result = selectEvidence(source([page(text)]), 'motor', { maxCharacters: budget });
    assert.ok(result.evidence.length > 0);
    assert.ok(result.selection.selectedCharacters <= budget);
    assert.equal(result.selection.selectedCharacters, result.evidence.reduce((n, e) => n + e.quote.length, 0));
    for (const item of result.evidence) {
      assert.equal(text.slice(item.start, item.end), item.quote);
      assert.ok(!/[\uD800-\uDBFF]$/.test(item.quote));
      assert.ok(!/^[\uDC00-\uDFFF]/.test(item.quote));
    }
  }
});

test('rejects unknown, malformed, unreviewed, and invalid revision input', () => {
  assert.throws(() => selectEvidence(null, 'goal'), /reviewed source/);
  assert.throws(() => selectEvidence(source([page('ok')], { reviewed: false }), 'goal'), /reviewed source/);
  assert.throws(() => selectEvidence(source([page('ok')], { revision: 'bad' }), 'goal'), /reviewed source/);
  assert.throws(() => selectEvidence(source([{ text: 3, locator: 'p', method: 'x' }]), 'goal'), /Malformed/);
  assert.throws(() => selectEvidence(source(Array.from({ length: 4 }, () => page('x'.repeat(12001)))), 'goal'), /48,000/);
  assert.throws(() => selectEvidence(source([page('ok')]), 'g'.repeat(1001)), /1,000/);
});
