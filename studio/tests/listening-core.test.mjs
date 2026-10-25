import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import {
  createGroqTranscriber, GROQ_TRANSCRIPTION_MODEL, GROQ_TRANSCRIPTION_URL, MAX_AUDIO_BYTES,
  MAX_RESPONSE_BYTES, MAX_TRANSCRIPT_CHARS,
} from '../server/listening-core/transcription.mjs';

const studioRoot = fileURLToPath(new URL('..', import.meta.url));
const baseInput = (overrides = {}) => ({
  audio: new Uint8Array([1, 2, 3]), mimeType: 'audio/wav', apiKey: 'synthetic-test-token',
  signal: new AbortController().signal, locale: 'unknown', sourceLabel: 'uploaded-file', ...overrides,
});
const jsonResponse = (text, status = 200) => new Response(JSON.stringify({ text }), { status, headers: { 'content-type': 'application/json' } });

test('adapter sends one bounded multipart request to the frozen model with explicit locale and source labels', async () => {
  let calls = 0;
  let request;
  const transcribe = createGroqTranscriber({ fetchImpl: async (url, init) => {
    calls += 1; request = { url, init }; return jsonResponse('  What is a pump?  ');
  } });
  const result = await transcribe(baseInput({ locale: 'zu', sourceLabel: 'provided-audio' }));
  assert.equal(calls, 1, 'no retries');
  assert.equal(request.url, GROQ_TRANSCRIPTION_URL);
  assert.equal(request.init.method, 'POST');
  assert.equal(request.init.signal.aborted, false);
  assert.equal(request.init.headers.Authorization, 'Bearer synthetic-test-token');
  assert.equal(request.init.body.get('model'), GROQ_TRANSCRIPTION_MODEL);
  assert.equal(request.init.body.get('language'), 'zu');
  assert.equal(request.init.body.get('response_format'), 'json');
  assert.equal(request.init.body.get('file').type, 'audio/wav');
  assert.equal(result.text, 'What is a pump?');
  assert.equal(result.sourceLabel, 'provided-audio');
  assert.equal(result.locale, 'zu');
  assert.equal(result.localeStatus, 'requested-not-validated');
  assert.equal(result.translation, false);
});

test('unknown locale is explicit and omitted from the provider request', async () => {
  let request;
  const transcribe = createGroqTranscriber({ fetchImpl: async (_url, init) => { request = init; return jsonResponse('Question'); } });
  const result = await transcribe(baseInput());
  assert.equal(request.body.get('language'), null);
  assert.equal(result.locale, 'unknown');
  assert.equal(result.localeStatus, 'unknown');
});

test('audio type and 8 MB cap are checked before making a provider request', async () => {
  let calls = 0;
  const transcribe = createGroqTranscriber({ fetchImpl: async () => { calls += 1; return jsonResponse('never'); } });
  await assert.rejects(transcribe(baseInput({ audio: new Uint8Array(MAX_AUDIO_BYTES + 1) })), { code: 'audio-too-large' });
  await assert.rejects(transcribe(baseInput({ mimeType: 'application/octet-stream' })), { code: 'unsupported-audio' });
  await assert.rejects(transcribe(baseInput({ mimeType: 'audio/wav', audio: new Blob([new Uint8Array([1])], { type: 'audio/ogg' }) })), { code: 'audio-type-mismatch' });
  await assert.rejects(transcribe(baseInput({ locale: 'en-NZ' })), { code: 'invalid-locale' });
  await assert.rejects(transcribe(baseInput({ locale: 'zz' })), { code: 'invalid-locale' });
  assert.equal(calls, 0);
  const exactLimit = createGroqTranscriber({ fetchImpl: async () => jsonResponse('ok') });
  const result = await exactLimit(baseInput({ audio: new Uint8Array(MAX_AUDIO_BYTES) }));
  assert.equal(result.text, 'ok');
});

test('abort is required and checked before any request', async () => {
  let calls = 0;
  const transcribe = createGroqTranscriber({ fetchImpl: async () => { calls += 1; return jsonResponse('no'); } });
  const controller = new AbortController(); controller.abort();
  await assert.rejects(transcribe(baseInput({ signal: controller.signal })), { code: 'aborted' });
  await assert.rejects(transcribe({ ...baseInput(), signal: null }), { code: 'missing-abort-signal' });
  assert.equal(calls, 0);
});

test('abort while fetch is pending wins even if an injected fetch ignores the signal', async () => {
  let resolveFetch;
  let calls = 0;
  const transcribe = createGroqTranscriber({ fetchImpl: () => { calls += 1; return new Promise((resolve) => { resolveFetch = resolve; }); } });
  const controller = new AbortController();
  const pending = transcribe(baseInput({ signal: controller.signal }));
  await Promise.resolve();
  controller.abort();
  await assert.rejects(pending, { code: 'aborted' });
  resolveFetch(jsonResponse('late result'));
  assert.equal(calls, 1);
});

test('abort during bounded response reading cancels the reader and discards late text', async () => {
  let resolveRead;
  let cancelCount = 0;
  const response = {
    ok: true, status: 200,
    body: { getReader: () => ({
      read: () => new Promise((resolve) => { resolveRead = resolve; }),
      cancel: async () => { cancelCount += 1; },
      releaseLock() {},
    }) },
  };
  const controller = new AbortController();
  const transcribe = createGroqTranscriber({ fetchImpl: async () => response });
  const pending = transcribe(baseInput({ signal: controller.signal }));
  for (let turn = 0; turn < 20 && !resolveRead; turn += 1) await new Promise((resolve) => setImmediate(resolve));
  assert.equal(typeof resolveRead, 'function', 'adapter reached the response stream read');
  controller.abort();
  await assert.rejects(pending, { code: 'aborted' });
  assert.equal(cancelCount, 1);
  resolveRead({ done: false, value: new TextEncoder().encode('{"text":"late"}') });
});

test('response and transcript bounds fail without retries or provider error details', async () => {
  let calls = 0;
  const tooLarge = new Response('x'.repeat(MAX_RESPONSE_BYTES + 1), { status: 200 });
  const transcribe = createGroqTranscriber({ fetchImpl: async () => { calls += 1; return tooLarge; } });
  await assert.rejects(transcribe(baseInput()), { code: 'response-too-large' });
  const tooLong = createGroqTranscriber({ fetchImpl: async () => jsonResponse('a'.repeat(MAX_TRANSCRIPT_CHARS + 1)) });
  await assert.rejects(tooLong(baseInput()), { code: 'invalid-transcript' });
  const failed = createGroqTranscriber({ fetchImpl: async () => new Response('secret provider detail', { status: 503 }) });
  await assert.rejects(failed(baseInput()), (error) => error.code === 'service-error' && !error.message.includes('secret provider detail'));
  assert.equal(calls, 1);
});

async function withUi(run) {
  const server = await createServer({ root: studioRoot, configFile: false, plugins: [reactPlugin()], server: { middlewareMode: true }, appType: 'custom' });
  try {
    const component = await server.ssrLoadModule('/src/listening-core/TranscriptReview.tsx');
    const machine = await server.ssrLoadModule('/src/listening-core/transcriptState.ts');
    await run(component.default, machine);
  } finally { await server.close(); }
}

test('transcript state requires learner confirmation, and an edit invalidates it', async () => {
  await withUi((_View, machine) => {
    const idle = machine.createTranscriptState();
    assert.deepEqual(machine.questionForSubmission(idle), { ok: false, reason: 'empty-question' });
    const started = machine.beginTranscription(idle, { sourceLabel: 'uploaded-file', locale: 'en' });
    const review = machine.receiveTranscription(started, started.requestId, {
      text: 'How does a pump work?', sourceLabel: 'uploaded-file', locale: 'en', localeStatus: 'requested-not-validated',
    });
    assert.equal(review.phase, 'needs-confirmation');
    assert.equal(machine.questionForSubmission(review).ok, false);
    const wrongSource = machine.receiveTranscription(started, started.requestId, {
      text: 'Mislabelled source', sourceLabel: 'provided-audio', locale: 'en', localeStatus: 'requested-not-validated',
    });
    assert.equal(wrongSource.phase, 'error', 'response cannot replace the caller-supplied source label');
    const confirmed = machine.confirmTranscript(review);
    assert.deepEqual(machine.questionForSubmission(confirmed), {
      ok: true, text: 'How does a pump work?', sourceLabel: 'uploaded-file', locale: 'en',
    });
    const edited = machine.editTranscript(confirmed, 'How does the motor move water?');
    assert.equal(edited.phase, 'needs-confirmation');
    assert.equal(edited.confirmedText, null);
    assert.equal(machine.questionForSubmission(edited).ok, false);
  });
});

test('cancel clears the transcript and ignores a late response from the old request', async () => {
  await withUi((_View, machine) => {
    const started = machine.beginTranscription(machine.createTranscriptState(), { sourceLabel: 'provided-audio', locale: 'unknown' });
    const cancelled = machine.cancelTranscript(started);
    const late = machine.receiveTranscription(cancelled, started.requestId, {
      text: 'late question', sourceLabel: 'provided-audio', locale: 'unknown', localeStatus: 'unknown',
    });
    assert.equal(cancelled.phase, 'cancelled');
    assert.equal(cancelled.draftText, '');
    assert.equal(cancelled.requestId > started.requestId, true);
    assert.strictEqual(late, cancelled, 'late result cannot replace the cancelled state');
    assert.equal(machine.questionForSubmission(cancelled).ok, false);
  });
});

test('review UI exposes source and locale, escapes text, and disables confirmation until reviewable', async () => {
  await withUi((TranscriptReview, machine) => {
    const started = machine.beginTranscription(machine.createTranscriptState(), { sourceLabel: 'uploaded-file', locale: 'unknown' });
    const html = renderToStaticMarkup(React.createElement(TranscriptReview, { state: started, onEdit() {}, onConfirm() {}, onCancel() {} }));
    assert.match(html, /Uploaded audio file/);
    assert.match(html, /Not specified/);
    assert.match(html, /Check the words first/);
    assert.match(html, /disabled=""/);
    const review = machine.receiveTranscription(started, started.requestId, {
      text: '<script>bad</script>', sourceLabel: 'uploaded-file', locale: 'unknown', localeStatus: 'unknown',
    });
    const reviewedHtml = renderToStaticMarkup(React.createElement(TranscriptReview, { state: review, onEdit() {}, onConfirm() {}, onCancel() {} }));
    assert.match(reviewedHtml, /&lt;script&gt;bad&lt;\/script&gt;/);
    assert.doesNotMatch(reviewedHtml, /<script\b/i);
    assert.match(reviewedHtml, /confirmation is required/i);
  });
});
