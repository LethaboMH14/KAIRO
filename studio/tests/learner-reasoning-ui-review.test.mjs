import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { readFile } from 'node:fs/promises';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { createReasoningAttempt } from '../../tools/learnharness-adapter-20261026/reasoning-attempt.mjs';

const studioRoot = fileURLToPath(new URL('..', import.meta.url));
let runtimePromise;
function getRuntime() {
  if (!runtimePromise) runtimePromise = (async () => {
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
  return runtimePromise;
}
function withRuntime(run) { return getRuntime().then(({ ui, reasoning, audio }) => run(ui.default, reasoning, audio)); }
after(async () => { if (runtimePromise) (await runtimePromise).server.close(); });

function fakeAudioEnvironment(permission = async () => null) {
  let permissionCalls = 0;
  let stoppedTracks = 0;
  const stream = { getTracks: () => [{ stop() { stoppedTracks += 1; } }] };
  let recorder;
  const env = {
    async getUserMedia() { permissionCalls += 1; await permission(); return stream; },
    createRecorder(_stream, options) {
      recorder = {
        state: 'inactive', mimeType: options?.mimeType || 'audio/ogg',
        ondataavailable: null, onstop: null, onerror: null,
        start(timeslice) { this.state = 'recording'; this.timeslice = timeslice; },
        stop() { this.state = 'inactive'; this.onstop?.(new Event('stop')); },
      };
      return recorder;
    },
    isTypeSupported: value => value === 'audio/webm;codecs=opus',
    setTimer: () => 'timer', clearTimer() {},
  };
  return { env, stream, get recorder() { return recorder; }, get permissionCalls() { return permissionCalls; }, get stoppedTracks() { return stoppedTracks; } };
}

const adapterQuestion = {
  id: 'motor-question-1', prompt: 'Which answer best fits this reviewed question?', options: [
    { id: 'shaft', label: 'Measured shaft speed' }, { id: 'field', label: 'Synchronous field speed' },
  ],
};
const sourceRefs = [{ sourceId: 'a'.repeat(24), revision: 'b'.repeat(64), locator: 'Reviewed synthetic source, page 1' }];

 test('UI snapshot confidence and answer pass unchanged into the real KAIRO adapter percentage contract', async () => {
  await withRuntime((_Panel, reasoning) => {
    const snapshot = reasoning.buildConfirmedReasoning({
      questionId: adapterQuestion.id, selectedOptionId: 'shaft', text: 'I assumed the field and shaft rotate together.', method: 'typed', confidence: 75,
    });
    assert.ok(snapshot);
    const attempt = createReasoningAttempt({
      ownerId: 'synthetic-owner', question: adapterQuestion,
      response: { ...snapshot, confirmed: true }, sourceRefs, confirmedAt: '2026-10-26T12:00:00.000Z',
    });
    assert.equal(attempt.response.selectedOptionId, 'shaft');
    assert.equal(attempt.response.text, snapshot.text);
    assert.equal(attempt.response.confidence, 75);
    assert.equal(attempt.evidenceStatus, 'learner-reported-attempt');
    const unset = reasoning.buildConfirmedReasoning({ ...snapshot, confidence: null });
    assert.equal(unset.confidence, null);
    assert.equal(createReasoningAttempt({ ownerId: 'synthetic-owner', question: adapterQuestion, response: { ...unset, confirmed: true }, sourceRefs, confirmedAt: '2026-10-26T12:00:00.000Z' }).response.confidence, null);
    assert.equal(reasoning.buildConfirmedReasoning({ ...snapshot, confidence: 101 }), null);
  });
});

test('adapter retains distinct explanations for the same selected option', async () => {
  await withRuntime((Panel, reasoning) => {
    const values = ['I assumed the field and shaft rotate together.', 'I was unsure what the word synchronous means.'];
    const attempts = values.map(text => createReasoningAttempt({
      ownerId: 'synthetic-owner', question: adapterQuestion,
      response: { ...reasoning.buildConfirmedReasoning({ questionId: adapterQuestion.id, selectedOptionId: 'shaft', text, method: 'dictated', confidence: null }), confirmed: true },
      sourceRefs, confirmedAt: '2026-10-26T12:00:00.000Z',
    }));
    assert.equal(attempts[0].response.selectedOptionId, attempts[1].response.selectedOptionId);
    assert.notEqual(attempts[0].response.text, attempts[1].response.text);
    assert.notEqual(attempts[0].fingerprint, attempts[1].fingerprint);
    const html = renderToStaticMarkup(React.createElement(Panel, {
      questionId: adapterQuestion.id, question: adapterQuestion.prompt, options: adapterQuestion.options,
      selectedOptionId: 'shaft', onSelectionChange() {}, onConfirm() {},
    }));
    assert.match(html, /Your answer/);
    assert.match(html, /What led you to that answer/);
    assert.match(html, /Use my explanation/);
  });
});

test('context comparison detects source revision, question and answer changes independently', async () => {
  await withRuntime((_Panel, reasoning) => {
    const current = { questionId: 'q1', question: 'Same visible prompt', selectedOptionId: 'shaft', contextKey: 'source-a:rev-1' };
    assert.deepEqual(reasoning.compareReasoningContext(current, { ...current, contextKey: 'source-a:rev-2' }), { questionChanged: true, answerChanged: false });
    assert.deepEqual(reasoning.compareReasoningContext(current, { ...current, questionId: 'q2' }), { questionChanged: true, answerChanged: false });
    assert.deepEqual(reasoning.compareReasoningContext(current, { ...current, question: 'Changed prompt' }), { questionChanged: true, answerChanged: false });
    assert.deepEqual(reasoning.compareReasoningContext(current, { ...current, selectedOptionId: 'field' }), { questionChanged: false, answerChanged: true });
  });
});

test('source-key and question resets in the component clear text and cancel capture; answer changes cancel only active work', async () => {
  await withRuntime(async () => {
    const source = await readFile(new URL('../src/learner-reasoning-ui/ReasoningCapture.tsx', import.meta.url), 'utf8');
    assert.match(source, /compareReasoningContext\(previous,\s*\{\s*questionId, question, selectedOptionId, contextKey\s*\}\)/);
    assert.match(source, /\[questionId, question, selectedOptionId, contextKey\]/);
    assert.match(source, /if \(questionChanged\) \{\s*stopPendingAudio\(\);\s*setText\(''\);\s*setMethod\('typed'\);\s*setConfidenceText\(''\);/);
    assert.match(source, /if \(answerChanged\) \{\s*if \(phase !== 'idle'\) stopPendingAudio\(\);\s*setConfirmedKey\(''\);/);
    assert.match(source, /return \(\) => \{\s*mountedRef\.current = false;\s*captureRef\.current\?\.dispose\(\);[\s\S]*?transcriptionRef\.current\?\.abort\(\);/);
    assert.match(source, /if \(!value\) \{\s*stopPendingAudio\(/);
    assert.match(source, /if \(phase !== 'idle'\) stopPendingAudio\('Microphone capture or transcription was cancelled because the explanation changed\.'/);
    assert.match(source, /disabled=\{disabled \|\| !audioConsent \|\| !audioAvailable \|\| phase === 'transcribing'\} onClick=\{startRecording\}/);
  });
});
test('fake MediaRecorder stays idle until start and releases tracks on cancel, dispose and recorder error', async () => {
  await withRuntime(async (_Panel, _reasoning, audio) => {
    for (const end of ['cancel', 'dispose', 'error']) {
      const fake = fakeAudioEnvironment();
      let ready = 0;
      const errors = [];
      const session = audio.createAudioCapture(fake.env, { onStarted() {}, onReady() { ready += 1; }, onError: value => errors.push(value), onTimeLimit() {} });
      assert.equal(fake.permissionCalls, 0, 'constructing the capture has no microphone side effect');
      await session.start();
      fake.recorder.ondataavailable({ data: new Blob(['audio']) });
      if (end === 'cancel') session.cancel();
      if (end === 'dispose') session.dispose();
      if (end === 'error') fake.recorder.onerror(new Event('error'));
      assert.equal(fake.stoppedTracks, 1, `${end} stops the track exactly once`);
      assert.equal(ready, 0, `${end} discards in-progress audio`);
      if (end === 'error') assert.match(errors[0], /audio error/i);
    }
  });
});

test('permission denial and a late grant after context cancellation leave no open tracks', async () => {
  await withRuntime(async (_Panel, _reasoning, audio) => {
    const denied = fakeAudioEnvironment(async () => { const error = new Error('permission'); error.name = 'NotAllowedError'; throw error; });
    const errors = [];
    await audio.createAudioCapture(denied.env, { onStarted() {}, onReady() {}, onError: value => errors.push(value), onTimeLimit() {} }).start();
    assert.match(errors[0], /permission was not granted/i);

    let resolvePermission;
    const late = fakeAudioEnvironment(() => new Promise(resolve => { resolvePermission = resolve; }));
    let starts = 0;
    const session = audio.createAudioCapture(late.env, { onStarted() { starts += 1; }, onReady() {}, onError() {}, onTimeLimit() {} });
    const pending = session.start();
    session.cancel(); // same primitive used when the source/question context changes
    resolvePermission();
    await pending;
    assert.equal(starts, 0);
    assert.equal(late.stoppedTracks, 1);
  });
});

test('cancelled or stale transcriber result cannot update the learner transcript', async () => {
  await withRuntime(async (_Panel, reasoning) => {
    const controller = new AbortController();
    let currentContext = 'source-v1:q1';
    let resolveTranscription;
    let accepted = 0;
    let errors = 0;
    const task = reasoning.runEnglishTranscription(new Blob(['fixture']), () => new Promise(resolve => { resolveTranscription = resolve; }), controller.signal,
      () => currentContext === 'source-v1:q1', () => { accepted += 1; }, () => { errors += 1; });
    currentContext = 'source-v2:q1';
    controller.abort();
    resolveTranscription({ text: 'late transcript', provider: 'fixture', model: 'fixture' });
    assert.equal(await task, false);
    assert.equal(accepted, 0);
    assert.equal(errors, 0);
  });
});
