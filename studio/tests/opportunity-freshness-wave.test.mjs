import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectOpportunity } from '../server/opportunity-freshness/index.mjs';

// SYNTHETIC TEST DATA ONLY. This fixture is not a real vacancy, fund or provider record.
const syntheticRecord = (overrides = {}) => ({
  id: 'synthetic-test-record-001',
  title: 'Synthetic test opportunity — not a real vacancy',
  url: 'https://example.org/synthetic-test-only',
  sourceName: 'Synthetic test source',
  checkedAt: '2026-10-24T00:00:00.000Z',
  closesAt: '2026-11-01T00:00:00.000Z',
  requirements: ['Synthetic requirement for validator tests'],
  ...overrides,
});
const options = (overrides = {}) => ({ now: '2026-10-25T00:00:00.000Z', ...overrides });

test('complete recent metadata is current and preserves the exact safe provider URL', () => {
  const record = syntheticRecord({ url: 'https://example.org/apply?ref=synthetic%20test' });
  const before = structuredClone(record);
  assert.deepEqual(inspectOpportunity(record, options()), {
    status: 'current', reasons: [], originalUrl: record.url,
  });
  assert.deepEqual(record, before, 'inspection must not mutate caller data');
});

test('closing timestamp is expired at the exact boundary and afterwards', () => {
  const record = syntheticRecord({ closesAt: '2026-10-25T00:00:00.000Z' });
  assert.deepEqual(inspectOpportunity(record, options()), {
    status: 'expired', reasons: ['closing-time-reached'], originalUrl: record.url,
  });
  assert.equal(inspectOpportunity(record, options({ now: '2026-10-25T00:00:00.001Z' })).status, 'expired');
});

test('a missing closing timestamp cannot be reported current', () => {
  const result = inspectOpportunity(syntheticRecord({ closesAt: null }), options());
  assert.equal(result.status, 'needs-check');
  assert.deepEqual(result.reasons, ['missing-closing-time']);
});

test('staleness changes only after the inclusive max-age boundary', () => {
  const record = syntheticRecord({ checkedAt: '2026-10-18T00:00:00.000Z' });
  assert.equal(inspectOpportunity(record, options()).status, 'current');
  const stale = inspectOpportunity(record, options({ now: '2026-10-25T00:00:00.001Z' }));
  assert.equal(stale.status, 'needs-check');
  assert.deepEqual(stale.reasons, ['source-check-is-stale']);
});

test('future checked timestamps are invalid rather than fresh', () => {
  const result = inspectOpportunity(syntheticRecord({ checkedAt: '2026-10-25T00:00:00.001Z' }), options());
  assert.equal(result.status, 'invalid');
  assert.deepEqual(result.reasons, ['checked-at-in-future']);
});

test('date-only, offset, impossible and malformed timestamps fail strict UTC validation', () => {
  for (const checkedAt of [
    '2026-10-24',
    '2026-10-24T00:00:00Z',
    '2026-10-24T02:00:00.000+02:00',
    '2026-02-30T00:00:00.000Z',
    'yesterday',
  ]) {
    assert.equal(inspectOpportunity(syntheticRecord({ checkedAt }), options()).status, 'invalid', checkedAt);
  }
  assert.equal(inspectOpportunity(syntheticRecord(), options({ now: '2026-10-25' })).status, 'invalid');
});

test('missing source attribution or requirements is needs-check, never current', () => {
  for (const patch of [
    { sourceName: undefined },
    { sourceName: '' },
    { requirements: undefined },
    { requirements: [] },
  ]) {
    const result = inspectOpportunity(syntheticRecord(patch), options());
    assert.equal(result.status, 'needs-check');
    assert.ok(result.reasons.length > 0);
  }
});

test('malformed record fields and requirement entries fail closed', () => {
  for (const patch of [
    { id: '' },
    { title: 42 },
    { sourceName: { name: 'not a source' } },
    { requirements: 'not an array' },
    { requirements: [''] },
    { requirements: [null] },
    { closesAt: 'not-a-time' },
  ]) {
    assert.equal(inspectOpportunity(syntheticRecord(patch), options()).status, 'invalid');
  }
  assert.equal(inspectOpportunity(null, options()).status, 'invalid');
  assert.equal(inspectOpportunity([], options()).status, 'invalid');
});

test('raw string bounds apply before trimming', () => {
  const oversizedTitle = ` ${' '.repeat(300)}Valid title`;
  const oversizedRequirement = `Valid${' '.repeat(500)}`;
  assert.equal(inspectOpportunity(syntheticRecord({ title: oversizedTitle }), options()).status, 'invalid');
  assert.equal(inspectOpportunity(syntheticRecord({ requirements: [oversizedRequirement] }), options()).status, 'invalid');
});

test('requirements are bounded before individual entries are inspected', () => {
  const requirements = Array.from({ length: 101 }, (_, index) => `Synthetic requirement ${index + 1}`);
  const result = inspectOpportunity(syntheticRecord({ requirements }), options());
  assert.equal(result.status, 'invalid');
  assert.deepEqual(result.reasons, ['invalid-requirements']);
});

test('unsafe source URLs fail and are never returned for navigation', () => {
  for (const url of [
    'javascript:alert(1)',
    'http://example.org/path',
    'https://user:password@example.org/path',
    'https://example.org/with space',
    'not a url',
  ]) {
    const result = inspectOpportunity(syntheticRecord({ url }), options());
    assert.equal(result.status, 'invalid', url);
    assert.equal(result.originalUrl, null, url);
  }
});

test('age bound accepts positive integers only and rejects values over the published cap', () => {
  assert.equal(inspectOpportunity(syntheticRecord(), options({ maxAgeDays: 365 })).status, 'current');
  for (const maxAgeDays of [0, -1, 1.5, 366, Number.NaN, '7']) {
    const result = inspectOpportunity(syntheticRecord(), options({ maxAgeDays }));
    assert.equal(result.status, 'invalid', String(maxAgeDays));
    assert.ok(result.reasons.includes('invalid-max-age-days'));
  }
});

test('invalid option containers fail closed without throwing', () => {
  assert.deepEqual(inspectOpportunity(syntheticRecord(), null), {
    status: 'invalid', reasons: ['invalid-options'], originalUrl: syntheticRecord().url,
  });
  assert.equal(inspectOpportunity(syntheticRecord(), []).status, 'invalid');
});

test('invalid record does not mutate nested requirements', () => {
  const record = syntheticRecord({ requirements: [' synthetic ', 'another'] });
  const before = structuredClone(record);
  inspectOpportunity(record, options());
  assert.deepEqual(record, before);
});
