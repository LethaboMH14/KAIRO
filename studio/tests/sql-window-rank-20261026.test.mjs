import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  SOURCE, BOARDS, FUNCTIONS, evaluateScenario, independentOracle,
  newSession, replaySession, recordAttempt,
} from '../src/studio-scenarios/sql-window-rank-20261026/model.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '../src/studio-scenarios/sql-window-rank-20261026');
const scenario = (over = {}) => ({ boardId: 'top-tie', functionId: 'rank', targetId: 'cy', ...over });
const input = (over = {}) => ({ ...scenario(), prediction: 3,
  explanation: 'Tied first scores occupy two rows, so the next rank is three.', ...over });

test('all 45 prepared scenarios match independent count oracle and replay deterministically', () => {
  let count = 0;
  for (const board of BOARDS) for (const fn of FUNCTIONS) for (const row of board.rows) {
    const s = { boardId: board.id, functionId: fn.id, targetId: row.id };
    const result = evaluateScenario(s);
    assert.deepEqual(result, evaluateScenario(s));
    assert.equal(result.observed, independentOracle(s));
    assert.equal(result.trace.length, 5);
    assert.equal(result.trace.find(item => item.target).result, result.observed);
    assert.equal(result.sourceRevision, SOURCE.sourceRevision);
    assert.equal(result.modelRevision, SOURCE.modelRevision);
    assert.ok(result.trace.every((item, index) => item.position === index + 1));
    count++;
  }
  assert.equal(count, 45);
});
test('RANK leaves gaps after tied top scores', () => {
  const r = evaluateScenario(scenario());
  assert.deepEqual(r.trace.map(x => x.result), [1, 1, 3, 4, 4]);
  assert.equal(r.observed, 3);
});
test('DENSE_RANK counts peer groups without gaps', () => {
  const r = evaluateScenario(scenario({ functionId: 'dense-rank' }));
  assert.deepEqual(r.trace.map(x => x.result), [1, 1, 2, 3, 3]);
  assert.equal(r.observed, 2);
});
test('ROW_NUMBER breaks ties by learner ID and never assigns duplicate positions', () => {
  const r = evaluateScenario(scenario({ functionId: 'row-number', targetId: 'bo' }));
  assert.deepEqual(r.trace.map(x => x.result), [1, 2, 3, 4, 5]);
  assert.deepEqual(r.trace.slice(0, 2).map(x => x.id), ['ada', 'bo']);
  assert.equal(r.observed, 2);
  assert.match(FUNCTIONS[0].sql, /learner_id ASC/);
  assert.doesNotMatch(FUNCTIONS[1].sql, /learner_id ASC/);
});
test('a middle tie and a tie-free table distinguish the three ranking rules', () => {
  for (const functionId of ['rank', 'dense-rank']) {
    const r = evaluateScenario(scenario({ boardId: 'middle-tie', functionId, targetId: 'dee' }));
    assert.equal(r.observed, functionId === 'rank' ? 4 : 3);
  }
  for (const fn of FUNCTIONS) {
    const r = evaluateScenario(scenario({ boardId: 'no-tie', functionId: fn.id, targetId: 'dee' }));
    assert.equal(r.observed, 4);
  }
});
test('unrecognised board, function, target, extra keys and coerced values fail closed', () => {
  for (const bad of [null, {}, scenario({ boardId: 'foreign' }), scenario({ functionId: 'ntile' }),
    scenario({ targetId: 'other' }), scenario({ targetId: 3 }), { ...scenario(), ownerId: 'foreign' },
    { ...scenario(), boardId: null }]) {
    assert.throws(() => evaluateScenario(bad));
    assert.throws(() => independentOracle(bad));
  }
});
test('first local attempt records actions, not a trusted result; it can be replayed from JSON', () => {
  const start = newSession();
  const first = recordAttempt(start, input({ prediction: 2 }));
  assert.equal(start.actions.length, 0);
  assert.equal(first.attempt.observed, 3);
  assert.equal(first.attempt.correct, false);
  assert.equal(first.attempt.verification, 'local-unverified');
  assert.ok(Object.isFrozen(first.session.actions));
  assert.ok(Object.isFrozen(first.trace[0]));
  assert.deepEqual(replaySession(JSON.parse(JSON.stringify(first.session))).attempts, [first.attempt]);
  assert.equal(Object.hasOwn(first.session.actions[0], 'observed'), false);
  assert.equal(Object.hasOwn(first.session.actions[0], 'correct'), false);
});
test('second distinct attempt works, while duplicate and third attempts fail', () => {
  const first = recordAttempt(newSession(), input());
  assert.throws(() => recordAttempt(first.session, input({ prediction: 2 })), /different/);
  const second = recordAttempt(first.session, input({ functionId: 'dense-rank', prediction: 2 }));
  assert.equal(second.session.actions.length, 2);
  assert.deepEqual(replaySession(second.session).attempts.map(x => x.id), ['local-1', 'local-2']);
  assert.throws(() => recordAttempt(second.session, input({ boardId: 'no-tie' })), /complete/);
});
test('forged outcomes, foreign owner data, stale revisions and bad predictions are rejected', () => {
  const saved = recordAttempt(newSession(), input()).session;
  const action = saved.actions[0];
  for (const changed of [
    { ...action, observed: 1 }, { ...action, verified: true }, { ...action, ownerId: 'foreign' },
    { ...action, sourceRevision: 'stale' }, { ...action, modelRevision: 'forged' },
    { ...action, prediction: 0 }, { ...action, prediction: 6 },
    { ...action, prediction: '3' }, { ...action, prediction: 2.5 },
    { ...action, explanation: 'too short' }, { ...action, explanation: 'x'.repeat(401) },
    { ...action, explanation: 'valid explanation\nwith newline' },
  ]) assert.throws(() => replaySession({ schemaVersion: 1, actions: [changed] }));
});
test('session envelope rejects fabricated status, extra actions and duplicate replays', () => {
  const action = recordAttempt(newSession(), input()).session.actions[0];
  for (const bad of [null, {}, { schemaVersion: 2, actions: [] },
    { schemaVersion: 1, actions: [], verified: true },
    { schemaVersion: 1, actions: [action, action] },
    { schemaVersion: 1, actions: [action, action, action] },
    { schemaVersion: 1, actions: 'not-an-array' }])
    assert.throws(() => replaySession(bad));
});
test('source and preview explicitly disclose synthetic-only, local-unverified boundaries', () => {
  assert.equal(SOURCE.url, 'https://www.postgresql.org/docs/18/functions-window.html');
  const ui = readFileSync(join(dir, 'SqlWindowRankLab.tsx'), 'utf8');
  for (const phrase of ['fictional learners', 'local-unverified', 'Nothing is uploaded',
    'not real learner data or a running PostgreSQL database', 'Step 1', 'Step 2', 'Step 3',
    'second sort key', 'tabIndex={-1}', 'resultHeading.current?.focus()'])
    assert.ok(ui.includes(phrase), phrase);
  const html = readFileSync(join(dir, 'preview.html'), 'utf8');
  assert.match(html, /preview\.tsx/);
});
test('real React SSR has native labelled controls, source, score table and prediction input', async () => {
  const { build } = await import('esbuild');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const React = await import('react');
  const outputDir = mkdtempSync(join(here, '../node_modules/.kairo-sql-rank-ssr-'));
  try {
    const outfile = join(outputDir, 'lab.mjs');
    await build({ entryPoints: [join(dir, 'SqlWindowRankLab.tsx')], outfile,
      bundle: true, platform: 'node', format: 'esm',
      external: ['react', 'react/jsx-runtime'], logLevel: 'silent' });
    const { default: Lab } = await import(pathToFileURL(outfile).href);
    const html = renderToStaticMarkup(React.createElement(Lab));
    for (const token of ['SQL ranking challenge', 'Step 1', 'Step 2', 'ROW_NUMBER',
      'DENSE_RANK', 'local-unverified', 'postgresql.org', 'type="radio"',
      '<fieldset', '<textarea', '<select', '<label', '<table', 'score'])
      assert.match(html, new RegExp(token, 'i'), token);
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
});
