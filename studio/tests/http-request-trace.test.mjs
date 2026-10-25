import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  assertScenario, commitAttempt, DEFAULT_SCENARIO, newSession,
  PREPARED_REFERENCE, TRACE_MODEL_VERSION, traceRequest,
} from '../src/studio-scenarios/http-request-trace/model.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const source = file => readFileSync(join(root, 'src/studio-scenarios/http-request-trace', file), 'utf8');
const at = '2026-10-25T06:10:00.000Z';
const prediction = (outcome = 'http-200', sendsHttpRequest = true) =>
  ({ outcome, sendsHttpRequest, explanation: 'I think the browser will send a new request.' });
const scenario = (cache = 'empty', connection = 'online', origin = '200') => ({ cache, connection, origin });

test('all eight cache/connection/origin combinations yield a finite deterministic trace', () => {
  let total = 0;
  for (const cache of ['fresh', 'empty']) for (const connection of ['online', 'offline']) for (const origin of ['200', '503']) {
    const input = scenario(cache, connection, origin);
    const a = traceRequest(input);
    const b = traceRequest(input);
    assert.deepEqual(a, b);
    assert.ok(a.steps.length >= 3 && a.steps.length <= 6);
    assert.equal(new Set(a.steps.map(step => step.id)).size, a.steps.length);
    assert.ok(a.steps.every(step => step.title && step.reading));
    assert.equal(a.steps[0].id, 'cache-check');
    total++;
  }
  assert.equal(total, 8);
});

test('fresh cache takes precedence over offline connection and server status', () => {
  for (const connection of ['online', 'offline']) for (const origin of ['200', '503']) {
    const t = traceRequest(scenario('fresh', connection, origin));
    assert.equal(t.outcome, 'cache-hit');
    assert.equal(t.sendsHttpRequest, false);
    assert.equal(t.httpStatus, null);
    assert.deepEqual(t.steps.map(s => s.id), ['cache-check', 'cache-reuse', 'display-cached']);
  }
});

test('offline without cache produces a network error, never a fabricated HTTP status', () => {
  for (const origin of ['200', '503']) {
    const t = traceRequest(scenario('empty', 'offline', origin));
    assert.equal(t.outcome, 'network-error');
    assert.equal(t.sendsHttpRequest, false);
    assert.equal(t.httpStatus, null);
    assert.ok(!t.steps.some(s => s.id === 'get' || s.id.startsWith('response-')));
  }
});

test('HTTP 200 and 503 are distinct genuine HTTP response branches in the model', () => {
  for (const status of ['200', '503']) {
    const t = traceRequest(scenario('empty', 'online', status));
    assert.equal(t.outcome, status === '200' ? 'http-200' : 'http-503');
    assert.equal(t.httpStatus, Number(status));
    assert.equal(t.sendsHttpRequest, true);
    assert.deepEqual(t.steps.slice(1, 4).map(s => s.id), ['dns', 'tls', 'get']);
    assert.ok(t.steps.some(s => s.id === 'response-' + status));
  }
});

test('rejects malformed scenarios and invalid model assumptions', () => {
  for (const bad of [null, [], {}, { cache: 'stale', connection: 'online', origin: '200' },
    { cache: 'empty', connection: 'online', origin: 200 },
    { cache: 'empty', connection: 'online', origin: '200', hidden: true },
    { cache: 'empty', connection: 'online' }]) {
    assert.throws(() => assertScenario(bad));
    assert.throws(() => traceRequest(bad));
  }
  assert.deepEqual(traceRequest(DEFAULT_SCENARIO).outcome, 'http-200');
});

test('two distinct local attempts bind model/reference and grade only the two predictions', () => {
  const first = newSession('test-session-42');
  const s1 = commitAttempt(first, scenario('empty', 'online', '200'), prediction(), at);
  assert.equal(first.attempts.length, 0);
  assert.equal(s1.attempts.length, 1);
  assert.equal(s1.attempts[0].id, 'test-session-42-round-1');
  assert.equal(s1.attempts[0].modelVersion, TRACE_MODEL_VERSION);
  assert.equal(s1.attempts[0].referenceKind, PREPARED_REFERENCE.kind);
  assert.equal(s1.attempts[0].referenceRevision, PREPARED_REFERENCE.revision);
  assert.equal(s1.attempts[0].evidenceStatus, 'local-unverified');
  assert.equal(s1.attempts[0].outcomeCorrect, true);
  assert.equal(s1.attempts[0].requestPredictionCorrect, true);
  const s2 = commitAttempt(s1, scenario('fresh', 'offline', '503'), prediction('network-error', false), '2026-10-25T06:11:00.000Z');
  assert.equal(s2.attempts.length, 2);
  assert.equal(s2.attempts[1].id, 'test-session-42-round-2');
  assert.equal(s2.attempts[1].outcomeCorrect, false);
  assert.equal(s2.attempts[1].requestPredictionCorrect, true);
  assert.throws(() => commitAttempt(s2, scenario('empty', 'online', '503'), prediction(), at), /Two attempts/);
});

test('replayed scenario, weak explanation, invalid time and ID are rejected', () => {
  assert.throws(() => newSession('bad id'));
  const s = newSession('test-session-42');
  assert.throws(() => commitAttempt(s, DEFAULT_SCENARIO, { ...prediction(), explanation: 'short' }, at), /12/);
  assert.throws(() => commitAttempt(s, DEFAULT_SCENARIO, prediction(), 'not-a-time'), /timestamp/);
  assert.throws(() => commitAttempt(s, DEFAULT_SCENARIO, { ...prediction(), outcome: '404' }, at), /Choose an outcome/);
  const s1 = commitAttempt(s, DEFAULT_SCENARIO, prediction(), at);
  assert.throws(() => commitAttempt(s1, { origin: '200', connection: 'online', cache: 'empty' }, prediction(), at), /Change at least one/);
});

test('committed evidence is a snapshot of the scenario and trims reflection', () => {
  const input = scenario('empty', 'online', '200');
  const s = commitAttempt(newSession('test-session-99'), input,
    { ...prediction(), explanation: '   I expect a fresh HTTP 200.   ' }, at);
  input.cache = 'fresh';
  assert.equal(s.attempts[0].scenario.cache, 'empty');
  assert.equal(s.attempts[0].prediction.explanation, 'I expect a fresh HTTP 200.');
  assert.equal(s.attempts[0].referenceKind, 'prepared-public-reference');
});

test('standalone 2D UI uses native controls, reading steps and honest preview boundaries', () => {
  const ui = source('RequestTraceLab.tsx');
  const html = source('preview.html');
  const preview = source('preview.tsx');
  assert.match(ui, /<fieldset/);
  assert.match(ui, /<legend/);
  assert.match(ui, /<select/);
  assert.match(ui, /<textarea/);
  assert.match(ui, /role="status"/);
  assert.match(ui, /role="alert"/);
  assert.match(ui, /<ol>/);
  assert.match(ui, /Record this local attempt/);
  assert.match(ui, /onLocalAttempt/);
  assert.match(ui, /not an authenticated lesson source/i);
  assert.doesNotMatch(ui, /<canvas|WebGL|navigator\.mediaDevices|fetch\(/);
  assert.match(html, /lang="en"/);
  assert.match(preview, /createRoot/);
  assert.match(preview, /RequestTraceLab/);
});
