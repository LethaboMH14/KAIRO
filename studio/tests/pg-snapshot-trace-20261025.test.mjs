import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  SOURCE, ISOLATIONS, TIMINGS, BASES, DELTAS,
  evaluateScenario, independentOracle, newSession, replaySession, recordAttempt,
} from '../src/studio-scenarios/pg-snapshot-trace-20261025/model.mjs';
const scenario = (overrides = {}) => ({ isolation: 'read-committed', timing: 'between-reads', base: 10, delta: 5, ...overrides });
const input = (overrides = {}) => ({ ...scenario(), prediction: 15,
  explanation: 'A sees the second committed snapshot after B commits.', ...overrides });

test('all 36 reviewed scenarios agree with independent oracle and deterministic replay', () => {
  let count = 0;
  for (const isolation of ISOLATIONS) for (const timing of TIMINGS)
    for (const base of BASES) for (const delta of DELTAS) {
      const s = { isolation: isolation.id, timing: timing.id, base, delta };
      const a = evaluateScenario(s), b = evaluateScenario(s);
      assert.deepEqual(a, b);
      assert.equal(a.second, independentOracle(s));
      assert.ok(a.trace.length >= 3);
      assert.equal(a.trace.at(-1).visible, a.second);
      assert.equal(a.sourceRevision, SOURCE.sourceRevision);
      count++;
    }
  assert.equal(count, 36);
});
test('READ COMMITTED refreshes between statements after B commits', () => {
  const r = evaluateScenario(scenario());
  assert.deepEqual([r.first, r.second], [10, 15]);
  assert.deepEqual(r.trace.map(x => x.actor), ['A', 'B', 'A']);
});
test('REPEATABLE READ retains the first snapshot after B commits', () => {
  const r = evaluateScenario(scenario({ isolation: 'repeatable-read' }));
  assert.deepEqual([r.first, r.second], [10, 10]);
});
test('no dirty read when B has not committed at second SELECT', () => {
  for (const isolation of ISOLATIONS) {
    const r = evaluateScenario(scenario({ isolation: isolation.id, timing: 'uncommitted' }));
    assert.deepEqual([r.first, r.second], [10, 10]);
    assert.equal(r.trace[1].visible, null);
  }
});
test('a writer commit before A first SELECT is visible at both levels', () => {
  for (const isolation of ISOLATIONS) {
    const r = evaluateScenario(scenario({ isolation: isolation.id, timing: 'before-first' }));
    assert.deepEqual([r.first, r.second], [15, 15]);
    assert.equal(r.trace[0].actor, 'B');
  }
});
test('invalid isolation, timing, values, extras and coerced types fail closed', () => {
  for (const bad of [null, {}, scenario({ isolation: 'serializable' }),
    scenario({ timing: 'after-second' }), scenario({ base: '10' }),
    scenario({ delta: -5 }), scenario({ base: 11 }), { ...scenario(), fake: true }]) {
    assert.throws(() => evaluateScenario(bad));
    assert.throws(() => independentOracle(bad));
  }
});
test('first local attempt is independently replayable, immutable and explicitly unverified', () => {
  const start = newSession();
  const result = recordAttempt(start, input({ prediction: 10 }));
  assert.equal(start.actions.length, 0);
  assert.equal(result.attempt.correct, false);
  assert.equal(result.attempt.observed, 15);
  assert.equal(result.attempt.verification, 'local-unverified');
  assert.ok(Object.isFrozen(result.session.actions));
  assert.deepEqual(replaySession(JSON.parse(JSON.stringify(result.session))).attempts, [result.attempt]);
});
test('second distinct attempt works; duplicate and third attempts are refused', () => {
  const first = recordAttempt(newSession(), input());
  assert.throws(() => recordAttempt(first.session, input({ prediction: 10 })), /distinct/);
  const second = recordAttempt(first.session, input({ isolation: 'repeatable-read', prediction: 10 }));
  assert.equal(second.session.actions.length, 2);
  assert.deepEqual(replaySession(second.session).attempts.map(x => x.id), ['local-1', 'local-2']);
  assert.throws(() => recordAttempt(second.session, input({ timing: 'uncommitted' })), /complete/);
});
test('replay rejects forged result fields, stale revisions, malformed sessions and extra actions', () => {
  const saved = recordAttempt(newSession(), input()).session;
  const action = saved.actions[0];
  for (const altered of [
    { ...action, observed: 10 }, { ...action, sourceRevision: 'old' },
    { ...action, modelRevision: 'forged' }, { ...action, prediction: 13 },
    { ...action, explanation: 'short' }, { ...action, explanation: 'a'.repeat(401) },
  ]) assert.throws(() => replaySession({ schemaVersion: 1, actions: [altered] }));
  for (const malformed of [null, { schemaVersion: 2, actions: [] },
    { schemaVersion: 1, actions: [], serverVerified: true },
    { schemaVersion: 1, actions: [action, action] },
    { schemaVersion: 1, actions: [action, action, action] }])
    assert.throws(() => replaySession(malformed));
});
test('source is official PostgreSQL 18 and examples are explicitly not a live DB', () => {
  assert.equal(SOURCE.url, 'https://www.postgresql.org/docs/18/transaction-iso.html');
  const path = join(dirname(fileURLToPath(import.meta.url)), '../src/studio-scenarios/pg-snapshot-trace-20261025/PgSnapshotLab.tsx');
  const text = readFileSync(path, 'utf8');
  for (const phrase of ['not a running PostgreSQL database', 'local-unverified', 'Nothing is uploaded', 'Step 1', 'Step 2', 'Step 3'])
    assert.ok(text.includes(phrase), phrase);
});
test('real React SSR markup includes native labelled inputs, source and a reading trace', async () => {
  const { build } = await import('esbuild');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const React = await import('react');
  const entry = join(dirname(fileURLToPath(import.meta.url)), '../src/studio-scenarios/pg-snapshot-trace-20261025/PgSnapshotLab.tsx');
  const outputDir = mkdtempSync(join(dirname(fileURLToPath(import.meta.url)), '../node_modules/.kairo-pg-snapshot-ssr-'));
  try {
    const outfile = join(outputDir, 'lab.mjs');
    await build({ entryPoints: [entry], outfile, bundle: true, platform: 'node', format: 'esm',
      external: ['react', 'react/jsx-runtime'], logLevel: 'silent' });
    const { default: Lab } = await import(pathToFileURL(outfile).href);
    const html = renderToStaticMarkup(React.createElement(Lab));
    for (const token of ['Database snapshot challenge', 'Step 1', 'Step 2', 'READ COMMITTED',
      'REPEATABLE READ', 'local-unverified', 'postgresql.org', 'type="radio"', '<fieldset', '<textarea', '<select', '<label'])
      assert.match(html, new RegExp(token, 'i'), token);
  } finally { rmSync(outputDir, { recursive: true, force: true }); }
});
