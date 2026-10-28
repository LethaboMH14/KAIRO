import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const studioRoot = fileURLToPath(new URL('..', import.meta.url));
let fixturePromise;
function getFixture() {
  if (!fixturePromise) fixturePromise = (async () => {
    const server = await createServer({
      root: studioRoot, configFile: false, plugins: [reactPlugin()],
      optimizeDeps: { noDiscovery: true, include: [] },
      server: { middlewareMode: true, ws: false }, appType: 'custom',
    });
    const ui = await server.ssrLoadModule('/src/learner-reasoning-ui/ReasoningCapture.tsx');
    const reasoning = await server.ssrLoadModule('/src/learner-reasoning-ui/reasoning.ts');
    const audio = await server.ssrLoadModule('/src/learner-reasoning-ui/audioCapture.ts');
    return { server, ui, reasoning, audio };
  })();
  return fixturePromise;
}
after(async () => { if (fixturePromise) (await fixturePromise).server.close(); });
async function withUI(run) {
  const { ui, reasoning, audio } = await getFixture();
  await run(ui.default, reasoning, audio);
}

const base = {
  questionId: 'motor-q-1',
  question: 'What changes when the motor load increases?',
  options: [
    { id: 'a', label: 'Current draw can rise.' },
    { id: 'b', label: 'Supply frequency always rises.' },
    { id: 'c', label: 'The motor stops being an electrical load.' },
  ],
  selectedOptionId: 'a',
  onSelectionChange() {},
  onConfirm() {},
};

function createFakeEnvironment({ getUserMedia, isTypeSupported = type => type === 'audio/webm;codecs=opus' } = {}) {
  const tracks = [{ stopped: 0, stop() { this.stopped += 1; } }];
  const stream = { getTracks: () => tracks };
  const recorders = [];
  let timerCallback = null;
  let timerDelay = null;
  const timersCleared = [];
  let permissionCalls = 0;
  class FakeRecorder {
    state = 'inactive';
    mimeType = '';
    ondataavailable = null;
    onstop = null;
    onerror = null;
    start(timeslice) { this.state = 'recording'; this.timeslice = timeslice; }
    stop() {
      if (this.state !== 'recording') throw new Error('not recording');
      this.state = 'inactive';
      this.onstop?.(new Event('stop'));
    }
  }
  return {
    tracks, stream, recorders, timersCleared,
    get permissionCalls() { return permissionCalls; },
    get timerCallback() { return timerCallback; },
    get timerDelay() { return timerDelay; },
    environment: {
      getUserMedia() { permissionCalls += 1; return getUserMedia ? getUserMedia() : Promise.resolve(stream); },
      createRecorder(_stream, options) {
        const recorder = new FakeRecorder();
        recorder.mimeType = options?.mimeType || 'audio/ogg';
        recorders.push(recorder);
        return recorder;
      },
      isTypeSupported,
      setTimer(callback, delay) { timerCallback = callback; timerDelay = delay; return 'timer-1'; },
      clearTimer(handle) { timersCleared.push(handle); },
    },
  };
}

test('actual SSR presents an accessible English-first MCQ and typed fallback without a provider', async () => {
  await withUI((Panel, _reasoning, audio) => {
    let selectionCalls = 0;
    let confirmCalls = 0;
    const html = renderToStaticMarkup(React.createElement(Panel, {
      ...base,
      question: '<b>Which source fact helped?</b>',
      options: base.options.map(option => ({ ...option, label: option.id === 'a' ? '<img src=x>' : option.label })),
      onSelectionChange() { selectionCalls += 1; },
      onConfirm() { confirmCalls += 1; },
    }));
    assert.match(html, /KAIRO · your thinking/);
    assert.match(html, /Which source fact helped/);
    assert.match(html, /Your answer/);
    assert.match(html, /What led you to that answer\?/);
    assert.match(html, /I don&#x27;t know yet/);
    assert.match(html, /Microphone transcription is not configured here/);
    assert.match(html, /How sure are you\?/);
    assert.match(html, /percentage from 0 to 100/);
    assert.match(html, /not a mastery or ability score/);
    assert.match(html, /Use my explanation/);
    assert.match(html, /&lt;img src=x&gt;/);
    assert.doesNotMatch(html, /<img\b/i);
    assert.equal((html.match(/type="radio"/g) || []).length, 3);
    assert.equal(selectionCalls, 0, 'SSR does not select an answer');
    assert.equal(confirmCalls, 0, 'SSR does not submit an explanation');
    assert.equal(audio.browserAudioCaptureAvailable(), false, 'SSR does not claim microphone support');
  });
});

test('audio UI requires provider configuration and separate consent before start or send', async () => {
  await withUI(Panel => {
    const noConsent = renderToStaticMarkup(React.createElement(Panel, {
      ...base, transcribe: async () => ({ text: 'words', provider: 'test', model: 'test' }), providerLabel: 'Test provider',
    }));
    assert.match(noConsent, /I agree to microphone recording/);
    assert.match(noConsent, /sent to Test provider/);
    assert.match(noConsent, /KAIRO keeps the transcript in your private AI request record/);
    assert.match(noConsent, /does not confirm how long the provider keeps the audio/);
    assert.doesNotMatch(noConsent, /No audio is saved permanently/);
    assert.match(noConsent, /Start microphone/);
    assert.doesNotMatch(noConsent, /<button[^>]*>Transcribe audio/);
    assert.match(noConsent, /recording stays in this page until you choose/i);
    const unavailable = renderToStaticMarkup(React.createElement(Panel, { ...base, disabled: true }));
    assert.match(unavailable, /Microphone transcription is not configured here/);
    assert.match(unavailable, /Write what you were thinking/);
  });
});

test('confirmed snapshot stays tied to answer and learner wording; optional confidence stays null', async () => {
  await withUI((_Panel, reasoning) => {
    const { buildConfirmedReasoning, confirmationFingerprint, dispatchReasoningConfirmation } = reasoning;
    const firstInput = { questionId: 'motor-q-1', selectedOptionId: 'a', text: 'I used the current from the diagram.', method: 'typed', confidence: null };
    const first = buildConfirmedReasoning(firstInput);
    assert.deepEqual(first, firstInput);
    assert.equal(buildConfirmedReasoning({ ...firstInput, text: '   ' }), null);
    assert.equal(buildConfirmedReasoning({ ...firstInput, text: 'x'.repeat(4001) }), null);
    assert.equal(buildConfirmedReasoning({ ...firstInput, confidence: 0 }).confidence, 0, 'zero is a valid explicit percentage');
    assert.equal(buildConfirmedReasoning({ ...firstInput, confidence: 100 }).confidence, 100);
    assert.equal(buildConfirmedReasoning({ ...firstInput, confidence: 101 }), null);
    const sameAnswerDifferentReason = buildConfirmedReasoning({ ...firstInput, text: 'I guessed from the word load.' });
    assert.notEqual(confirmationFingerprint(first), confirmationFingerprint(sameAnswerDifferentReason));
    assert.notEqual(confirmationFingerprint(first), confirmationFingerprint(buildConfirmedReasoning({ ...firstInput, selectedOptionId: 'b' })));
    assert.notEqual(confirmationFingerprint(first), confirmationFingerprint(buildConfirmedReasoning({ ...firstInput, text: 'I used the current from the diagram.', confidence: 75 })));
    const sent = [];
    assert.equal(dispatchReasoningConfirmation({ ...firstInput, text: ' ' }, value => sent.push(value)), false);
    assert.equal(sent.length, 0, 'invalid input cannot reach the host');
    assert.equal(dispatchReasoningConfirmation(firstInput, value => sent.push(value)), true);
    assert.deepEqual(sent, [firstInput], 'the explicit confirm boundary receives the associated answer and exact learner text');
    const second = buildConfirmedReasoning({ ...firstInput, text: 'I guessed from the word load.' });
    dispatchReasoningConfirmation(second, value => sent.push(value));
    assert.equal(sent.length, 2);
    assert.equal(sent[0].selectedOptionId, sent[1].selectedOptionId);
    assert.notEqual(sent[0].text, sent[1].text);
  });
});

test('MediaRecorder starts only on request, stops tracks, and yields an in-memory blob', async () => {
  await withUI(async (_Panel, _reasoning, audio) => {
    const fake = createFakeEnvironment();
    const callbacks = { started: 0, ready: [], errors: [], limited: 0 };
    const session = audio.createAudioCapture(fake.environment, {
      onStarted() { callbacks.started += 1; }, onReady(blob) { callbacks.ready.push(blob); },
      onError(message) { callbacks.errors.push(message); }, onTimeLimit() { callbacks.limited += 1; },
    });
    assert.equal(callbacks.started, 0, 'constructing a session does not open the microphone');
    await session.start();
    assert.equal(callbacks.started, 1);
    assert.equal(fake.recorders[0].timeslice, 1000);
    assert.equal(fake.recorders[0].mimeType, 'audio/webm;codecs=opus');
    fake.recorders[0].ondataavailable({ data: new Blob(['spoken words'], { type: 'audio/webm;codecs=opus' }) });
    session.stop();
    assert.equal(callbacks.ready.length, 1);
    assert.equal(await callbacks.ready[0].text(), 'spoken words');
    assert.equal(fake.tracks[0].stopped, 1);
    assert.deepEqual(callbacks.errors, []);
    assert.ok(fake.timersCleared.includes('timer-1'));
  });
});

test('recording cancel, permission denial, and late permission grant release every track without returning audio', async () => {
  await withUI(async (_Panel, _reasoning, audio) => {
    const fake = createFakeEnvironment();
    const ready = [];
    const session = audio.createAudioCapture(fake.environment, { onStarted() {}, onReady: blob => ready.push(blob), onError() {}, onTimeLimit() {} });
    await session.start();
    fake.recorders[0].ondataavailable({ data: new Blob(['discard me']) });
    session.cancel();
    assert.equal(ready.length, 0);
    assert.equal(fake.tracks[0].stopped, 1);

    const unmounted = createFakeEnvironment();
    const unmountedReady = [];
    const unmountedSession = audio.createAudioCapture(unmounted.environment, {
      onStarted() {}, onReady: blob => unmountedReady.push(blob), onError() {}, onTimeLimit() {},
    });
    await unmountedSession.start();
    unmountedSession.dispose();
    assert.equal(unmountedReady.length, 0, 'unmount cleanup never returns an unfinished recording');
    assert.equal(unmounted.tracks[0].stopped, 1, 'unmount stops microphone tracks');

    const denied = createFakeEnvironment({ getUserMedia: async () => { const error = new Error('denied'); error.name = 'NotAllowedError'; throw error; } });
    const deniedErrors = [];
    await audio.createAudioCapture(denied.environment, { onStarted() {}, onReady() {}, onError: message => deniedErrors.push(message), onTimeLimit() {} }).start();
    assert.match(deniedErrors[0], /permission was not granted/i);

    let resolvePermission;
    const late = createFakeEnvironment({ getUserMedia: () => new Promise(resolve => { resolvePermission = resolve; }) });
    let lateStarts = 0;
    const lateSession = audio.createAudioCapture(late.environment, { onStarted() { lateStarts += 1; }, onReady() {}, onError() {}, onTimeLimit() {} });
    const pending = lateSession.start();
    await lateSession.start();
    assert.equal(late.permissionCalls, 1, 'a pending permission request cannot open a second microphone stream');
    lateSession.cancel();
    resolvePermission(late.stream);
    await pending;
    assert.equal(lateStarts, 0);
    assert.equal(late.tracks[0].stopped, 1);
  });
});

test('recording stops at 60 seconds and discards audio larger than 8 MiB', async () => {
  await withUI(async (_Panel, _reasoning, audio) => {
    assert.equal(audio.MAX_RECORDING_MS, 60_000);
    assert.equal(audio.MAX_RECORDING_BYTES, 8 * 1024 * 1024);
    const timed = createFakeEnvironment();
    const ready = [];
    let limited = 0;
    const session = audio.createAudioCapture(timed.environment, { onStarted() {}, onReady: blob => ready.push(blob), onError() {}, onTimeLimit() { limited += 1; } });
    await session.start();
    assert.equal(timed.timerDelay, 60_000);
    timed.recorders[0].ondataavailable({ data: new Blob(['short audio']) });
    timed.timerCallback();
    assert.equal(limited, 1);
    assert.equal(ready.length, 1);
    assert.equal(timed.tracks[0].stopped, 1);

    const oversize = createFakeEnvironment();
    const oversizeReady = [];
    const oversizeErrors = [];
    const bounded = audio.createAudioCapture(oversize.environment, {
      onStarted() {}, onReady: blob => oversizeReady.push(blob), onError: message => oversizeErrors.push(message), onTimeLimit() {},
    });
    await bounded.start();
    oversize.recorders[0].ondataavailable({ data: new Blob([new Uint8Array(audio.MAX_RECORDING_BYTES + 1)]) });
    assert.equal(oversizeReady.length, 0);
    assert.match(oversizeErrors[0], /over 8 MiB/);
    assert.equal(oversize.tracks[0].stopped, 1);
  });
});

test('transcription errors preserve typed fallback; cancelled and stale responses are fenced', async () => {
  await withUI(async (_Panel, reasoning) => {
    const audio = new Blob(['audio']);
    const controller = new AbortController();
    let current = controller;
    let resolveRequest;
    let accepted = 0;
    let errors = 0;
    const pending = reasoning.runEnglishTranscription(audio,
      (_blob, options) => { assert.equal(options.locale, 'en'); assert.equal(options.signal, controller.signal); assert.equal(options.consent, true); return new Promise(resolve => { resolveRequest = resolve; }); },
      controller.signal, () => current === controller,
      () => { accepted += 1; }, () => { errors += 1; });
    controller.abort();
    current = null;
    resolveRequest({ text: 'late words', provider: 'test', model: 'fixture' });
    assert.equal(await pending, false);
    assert.equal(accepted, 0);
    assert.equal(errors, 0);

    const failure = new AbortController();
    const errorResult = await reasoning.runEnglishTranscription(audio, async () => { throw new Error('service unavailable'); }, failure.signal, () => true, () => { accepted += 1; }, () => { errors += 1; });
    assert.equal(errorResult, false);
    assert.equal(errors, 1, 'host failure is reported so the learner can keep typing');
  });
});
