import test from 'node:test';
import assert from 'node:assert/strict';
import { artifactMarkdown, collectArtifacts, summarizeCase, UNVERIFIED_STATUS } from '../src/evidence/model.ts';
import { initialCase, records, transition, caseRecord } from '../src/practice/model.ts';

const at = '2026-10-22T08:00:00Z';
const reflection = 'I compared the physical shelf with each signed record and reconciled the damaged units.';
function completed({ earlyInspect = false, wrongStock = false, wrongCause = false, accuse = false } = {}) {
  let s = initialCase('run-1', 'lesson-1');
  if (earlyInspect) s = transition(s, { type: 'inspect', key: 'shelf' }, at);
  if (wrongStock) s = transition(s, { type: 'calculate', value: 22 }, at);
  s = transition(s, { type: 'calculate', value: 23 }, at);
  for (const key of Object.keys(records)) if (!s.read.includes(key)) s = transition(s, { type: 'inspect', key }, at);
  if (wrongCause) s = transition(s, { type: 'reconcile', difference: 2, cause: 'theft' }, at);
  s = transition(s, { type: 'reconcile', difference: 2, cause: 'damage' }, at);
  if (accuse) s = transition(s, { type: 'decide', value: 'accuse' }, at);
  s = transition(s, { type: 'decide', value: 'record' }, at);
  s = transition(s, { type: 'reflect', value: reflection }, at);
  return caseRecord(s);
}

test('completed replay yields a stable unverified artifact with failed attempts retained', () => {
  const record = completed({ wrongStock: true, wrongCause: true, accuse: true });
  const artifact = summarizeCase(record);
  assert.ok(artifact);
  assert.equal(artifact.status, UNVERIFIED_STATUS);
  assert.equal(artifact.rubric[0].attempts, 2);
  assert.equal(artifact.rubric[0].firstTry, false);
  assert.equal(artifact.rubric[1].attempts, 2);
  assert.equal(artifact.rubric[2].firstTry, false);
  assert.match(artifact.limitations.join(' '), /help exposure is unknown/);
  assert.match(artifactMarkdown(artifact), /local self-directed practice, unverified/);
  assert.equal(artifactMarkdown(artifact), artifactMarkdown(summarizeCase(record)));
});

test('replay accepts model-valid inspection before calculation and checks truth, not completion flag', () => {
  const record = completed({ earlyInspect: true });
  assert.ok(summarizeCase(record));
  assert.equal(summarizeCase({ ...record, completedAt: 'not-a-date' }), null);
});

test('forged completion and altered correctness flags are rejected', () => {
  const good = completed();
  assert.equal(summarizeCase({ ...good, events: good.events.slice(0, -1) }), null);
  const forged = { ...good, events: good.events.map((e, i) => i === 0 ? { ...e, correct: false } : e) };
  assert.equal(summarizeCase(forged), null);
  assert.equal(summarizeCase({ ...good, version: 'future-case' }), null);
});

test('malformed, oversized and invalid-timestamp records are rejected; profile collection is version-bounded', () => {
  const good = completed();
  assert.equal(summarizeCase({ ...good, events: [...good.events, ...Array(193).fill(good.events[0])] }), null);
  assert.equal(summarizeCase({ ...good, events: good.events.map((e, i) => i ? e : { ...e, at: 'yesterday' }) }), null);
  assert.deepEqual(collectArtifacts({ version: 2, cases: [good] }), []);
  assert.deepEqual(collectArtifacts({ version: 1, cases: Array(21).fill(good) }), []);
  assert.equal(collectArtifacts({ version: 1, cases: [good, { ...good, version: 'future' }] }).length, 1);
});

test('reflection replays 500, 501 and 1000 characters and rejects a tampered saved prefix', () => {
  for (const length of [500, 501, 1000]) {
    const longReflection = 'x'.repeat(length);
    let s = initialCase(`long-${length}`, null);
    s = transition(s, { type: 'calculate', value: 23 }, at);
    for (const key of Object.keys(records)) s = transition(s, { type: 'inspect', key }, at);
    s = transition(s, { type: 'reconcile', difference: 2, cause: 'damage' }, at);
    s = transition(s, { type: 'decide', value: 'record' }, at);
    s = transition(s, { type: 'reflect', value: longReflection }, at);
    const record = caseRecord(s);
    assert.equal(record.events.at(-1).value, longReflection.slice(0, 500));
    assert.equal(summarizeCase(record)?.contributorReflection, longReflection);
    const changed = { ...record, events: record.events.map((e, i, all) => i === all.length - 1 ? { ...e, value: `${e.value.slice(0, -1)}z` } : e) };
    assert.equal(summarizeCase(changed), null);
  }
});

test('timestamps require valid ISO instants, nondecreasing event order and terminal completion time', () => {
  const good = completed();
  const invalids = ['2026-02-30T08:00:00Z', '2026-10-22', '1730000000000', '2026-10-22T08:00:00'];
  for (const invalid of invalids) assert.equal(summarizeCase({ ...good, completedAt: invalid }), null);
  const reversed = { ...good, events: good.events.map((e, i, all) => i === 1 ? { ...e, at: '2026-10-22T07:59:59Z' } : e) };
  assert.equal(summarizeCase(reversed), null);
  assert.equal(summarizeCase({ ...good, completedAt: '2026-10-22T07:59:59Z' }), null);
  assert.ok(summarizeCase(good));
});
