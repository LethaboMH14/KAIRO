import test from 'node:test';
import assert from 'node:assert/strict';
import { consumeAutoplayStep, createGuideRequestGate, guideContextKey, runGuideRequest, selectGuideStage } from '../src/guide-request/request-state.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const initial = { question: 'Why use a database?', topic: 'database', stage: 1 };
const changed = { ...initial, stage: 2 };

test('ignores a late answer after the stage context changes', async () => {
  const gate = createGuideRequestGate(guideContextKey(initial));
  const pending = deferred();
  const events = [];
  const request = runGuideRequest({ gate, context: initial, request: () => pending.promise, onState: event => events.push(event) });

  gate.updateContext(guideContextKey(changed));
  pending.resolve('Answer for the previous stage');
  await request;

  assert.deepEqual(events.map(event => event.type), ['started']);
});

test('ignores a late error after the question context changes', async () => {
  const gate = createGuideRequestGate(guideContextKey(initial));
  const pending = deferred();
  const events = [];
  const request = runGuideRequest({ gate, context: initial, request: () => pending.promise, onState: event => events.push(event) });

  gate.updateContext(guideContextKey({ ...initial, question: 'A different question' }));
  pending.reject(new Error('Old request failed'));
  await request;

  assert.deepEqual(events.map(event => event.type), ['started']);
});

test('ignores a late answer after the topic context changes', async () => {
  const gate = createGuideRequestGate(guideContextKey(initial));
  const pending = deferred();
  const events = [];
  const request = runGuideRequest({ gate, context: initial, request: () => pending.promise, onState: event => events.push(event) });

  gate.updateContext(guideContextKey({ ...initial, topic: 'python' }));
  pending.resolve('Answer for the previous topic');
  await request;

  assert.deepEqual(events.map(event => event.type), ['started']);
});

test('a newer request owns the answer and completion state', async () => {
  const gate = createGuideRequestGate(guideContextKey(initial));
  const earlier = deferred();
  const events = [];
  const onState = event => events.push(event);
  const oldRequest = runGuideRequest({ gate, context: initial, request: () => earlier.promise, onState });
  const newRequest = runGuideRequest({ gate, context: initial, request: async () => 'Newest answer', onState });

  await newRequest;
  earlier.reject(new Error('Superseded request failed'));
  await oldRequest;

  assert.deepEqual(events, [
    { type: 'started' },
    { type: 'started' },
    { type: 'answer', answer: 'Newest answer' },
    { type: 'finished' },
  ]);
});

test('ignores settled outcomes after the view unmounts', async () => {
  const gate = createGuideRequestGate(guideContextKey(initial));
  const pending = deferred();
  const events = [];
  const request = runGuideRequest({ gate, context: initial, request: () => pending.promise, onState: event => events.push(event) });

  gate.invalidate();
  pending.resolve('Answer after unmount');
  await request;

  assert.deepEqual(events.map(event => event.type), ['started']);
});

test('delivers current-context answers and failures', async () => {
  const gate = createGuideRequestGate(guideContextKey(initial));
  const answers = [];
  const failures = [];
  await runGuideRequest({ gate, context: initial, request: async () => 'Current answer', onState: event => { if (event.type === 'answer') answers.push(event.answer); } });
  await runGuideRequest({ gate, context: initial, request: async () => { throw new Error('Current failure'); }, onState: event => { if (event.type === 'error') failures.push(event.message); } });

  assert.deepEqual(answers, ['Current answer']);
  assert.deepEqual(failures, ['Current failure']);
});

test('consumes autoplay through all four stages and stops at the last one', () => {
  let state = { stage: 0, playing: true };
  const seen = [state.stage];
  for (let tick = 0; tick < 4; tick += 1) {
    state = consumeAutoplayStep(state, 4);
    seen.push(state.stage);
  }

  assert.deepEqual(seen, [0, 1, 2, 3, 3]);
  assert.deepEqual(state, { stage: 3, playing: false });
});

test('manual pause holds playback and manual stage selection preserves that intent', () => {
  const paused = { stage: 1, playing: false };
  assert.deepEqual(consumeAutoplayStep(paused, 4), paused);
  assert.deepEqual(selectGuideStage(paused, 2), { stage: 2, playing: false });
  assert.deepEqual(selectGuideStage({ stage: 1, playing: true }, 2), { stage: 2, playing: true });
});

test('request gate remains usable after an effect cleanup replay', async () => {
  const gate = createGuideRequestGate(guideContextKey(initial));
  gate.invalidate();
  const events = [];

  await runGuideRequest({ gate, context: initial, request: async () => 'Answer after replay', onState: event => events.push(event.type) });

  assert.deepEqual(events, ['started', 'answer', 'finished']);
});
