import test from 'node:test';
import assert from 'node:assert/strict';
import { createPresentationState, transitionPresentation } from '../src/kairo-presentation-state/index.ts';

const cues = ['idle', 'explain', 'acknowledge'];
const ev = (type, requestId = 'r1', contextKey = 'lesson-a') => ({ type, requestId, contextKey });

test('creates immutable state and resolves only available cues', () => {
  const s = createPresentationState('lesson-a', false, ['idle', 'tablet-present', 'bogus', 'idle']);
  assert.equal(s.resolvedCue, 'idle');
  assert.deepEqual(s.availableCues, ['idle', 'tablet-present']);
  assert.ok(Object.isFrozen(s) && Object.isFrozen(s.availableCues));
});

test('accepts matching request chain and ignores wrong, duplicate, late and malformed events', () => {
  const s = createPresentationState('lesson-a', false, cues);
  const started = transitionPresentation(s, ev('request-started'));
  assert.equal(started.phase, 'preparing');
  assert.equal(started.resolvedCue, 'idle');
  assert.equal(transitionPresentation(started, ev('request-started')), started);
  assert.equal(transitionPresentation(started, ev('content-ready', 'other')), started);
  const ready = transitionPresentation(started, ev('content-ready'));
  assert.equal(ready.phase, 'presenting');
  assert.equal(ready.resolvedCue, 'idle');
  assert.equal(transitionPresentation(ready, ev('content-ready')), ready);
  assert.equal(transitionPresentation(ready, { type: 'content-ready', contextKey: 'lesson-a', requestId: { bad: true } }), ready);
  assert.equal(transitionPresentation(ready, Object.create({ type: 'saved', contextKey: 'lesson-a' })), ready);
});

test('failure and explicit cancellation cannot be reversed by late completion', () => {
  const s = createPresentationState('lesson-a', false, cues);
  const started = transitionPresentation(s, ev('request-started'));
  const cancelled = transitionPresentation(started, ev('cancelled'));
  assert.equal(cancelled.activeRequestId, null);
  assert.equal(transitionPresentation(cancelled, ev('content-ready')), cancelled);
  const retry = transitionPresentation(cancelled, ev('request-started', 'r2'));
  const failed = transitionPresentation(retry, ev('request-failed', 'r2'));
  assert.equal(failed.phase, 'error');
  assert.equal(transitionPresentation(failed, ev('content-ready', 'r2')), failed);
});

test('context change clears pending/error/presentation and rejects cross-context results', () => {
  const s = createPresentationState('lesson-a', false, cues);
  const pending = transitionPresentation(s, ev('request-started'));
  const changed = transitionPresentation(pending, { type: 'context-changed', contextKey: 'lesson-b' });
  assert.equal(changed.phase, 'idle');
  assert.equal(changed.activeRequestId, null);
  assert.equal(transitionPresentation(changed, ev('content-ready')), changed);
});

test('reduced motion and compact suppress elaborate cues while preserving task state', () => {
  const full = createPresentationState('lesson-a', false, ['idle', 'tablet-retrieve', 'tablet-present', 'explain']);
  const started = transitionPresentation(full, ev('request-started'));
  assert.equal(started.resolvedCue, 'tablet-retrieve');
  const compact = transitionPresentation(started, { type: 'compact-changed', compact: true });
  assert.equal(compact.phase, 'preparing');
  assert.equal(compact.activeRequestId, 'r1');
  assert.equal(compact.resolvedCue, 'explain');
  const reduced = transitionPresentation(compact, { type: 'motion-changed', reduced: true });
  assert.equal(reduced.resolvedCue, 'explain');
});

test('unavailable tablet cues fall back safely and save acknowledgement requires explicit event', () => {
  const s = createPresentationState('lesson-a', false, ['idle']);
  const ready = transitionPresentation(transitionPresentation(s, ev('request-started')), ev('content-ready'));
  assert.equal(ready.requestedCue, 'tablet-present');
  assert.equal(ready.resolvedCue, 'idle');
  const saved = transitionPresentation(ready, { type: 'saved', contextKey: 'lesson-a' });
  assert.equal(saved.requestedCue, 'acknowledge');
  assert.equal(saved.resolvedCue, 'idle');
  assert.equal(transitionPresentation(ready, { type: 'saved', contextKey: 'other' }), ready);
});

test('transitions never mutate prior states or accept malformed events', () => {
  const s = createPresentationState('lesson-a', false, cues);
  const before = JSON.stringify(s);
  assert.equal(transitionPresentation(s, null), s);
  assert.equal(transitionPresentation(s, { type: 'motion-changed', reduced: 'yes' }), s);
  transitionPresentation(s, ev('request-started'));
  assert.equal(JSON.stringify(s), before);
});
