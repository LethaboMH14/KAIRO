import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const studioRoot = fileURLToPath(new URL('..', import.meta.url));
let runtimePromise;
function runtime() {
  if (!runtimePromise) runtimePromise = (async () => {
    const server = await createServer({ root: studioRoot, configFile: false, plugins: [reactPlugin()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, ws: false }, appType: 'custom' });
    return { server, bridge: await server.ssrLoadModule('/src/reasoning-listening-bridge/groqReasoningTranscriber.ts'), reasoning: await server.ssrLoadModule('/src/learner-reasoning-ui/reasoning.ts') };
  })();
  return runtimePromise;
}
after(async () => { if (runtimePromise) (await runtimePromise).server.close(); });

const transcript = {
  text: 'I compared the field and shaft speed.', provider: 'Groq', model: 'whisper-large-v3-turbo',
  sourceLabel: 'uploaded-file', locale: 'en', localeStatus: 'requested-not-validated', translation: false,
};
const audio = () => new Blob(['synthetic audio bytes'], { type: 'audio/webm;codecs=opus' });
const options = signal => ({ signal, locale: 'en', consent: true });
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });

test('explicit consent is required before the bridge makes a same-origin request', async () => {
  const { bridge } = await runtime();
  let calls = 0;
  const transcribe = bridge.createGroqReasoningTranscriber({ fetchImpl: async () => { calls += 1; return json(transcript); } });
  await assert.rejects(transcribe(audio(), { signal: new AbortController().signal, locale: 'en', consent: false }), { code: 'consent-required' });
  assert.equal(calls, 0);
});

test('posts the raw Blob once to the existing endpoint with exact Groq consent, English, type and abort signal', async () => {
  const { bridge } = await runtime();
  const controller = new AbortController();
  const requests = [];
  const transcribe = bridge.createGroqReasoningTranscriber({
    requestIdFactory: () => 'reasoning-test-001',
    fetchImpl: async (url, init) => { requests.push({ url, init }); return json(transcript); },
  });
  const clip = audio();
  const result = await transcribe(clip, options(controller.signal));
  assert.equal(requests.length, 1, 'a failed or successful upload is never retried');
  assert.equal(requests[0].url, '/api/workspace/listening');
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(requests[0].init.body, clip, 'the raw audio Blob is the request body');
  assert.equal(requests[0].init.signal, controller.signal);
  assert.equal(requests[0].init.headers['Content-Type'], 'audio/webm');
  assert.equal(requests[0].init.headers['X-Kairo-Consent'], 'groq');
  assert.equal(requests[0].init.headers['X-Kairo-Language'], 'en');
  assert.equal(requests[0].init.headers['X-Kairo-Request'], 'reasoning-test-001');
  assert.deepEqual(result, { text: transcript.text, provider: 'Groq', model: 'whisper-large-v3-turbo' });
});

test('rejects empty, over-8-MiB, unsupported MIME and non-English requests before fetch', async () => {
  const { bridge } = await runtime();
  let calls = 0;
  const transcribe = bridge.createGroqReasoningTranscriber({ fetchImpl: async () => { calls += 1; return json(transcript); } });
  const signal = new AbortController().signal;
  await assert.rejects(transcribe(new Blob([], { type: 'audio/webm' }), options(signal)), { code: 'empty-audio' });
  await assert.rejects(transcribe(new Blob([new Uint8Array(8 * 1024 * 1024 + 1)], { type: 'audio/webm' }), options(signal)), { code: 'audio-too-large' });
  await assert.rejects(transcribe(new Blob(['bad'], { type: 'application/octet-stream' }), options(signal)), { code: 'unsupported-audio' });
  await assert.rejects(transcribe(audio(), { ...options(signal), locale: 'zu' }), { code: 'unsupported-language' });
  assert.equal(calls, 0);
});

test('pre-aborted and in-flight aborted requests never deliver late transcript text', async () => {
  const { bridge } = await runtime();
  let calls = 0;
  const pre = new AbortController();
  pre.abort();
  const never = bridge.createGroqReasoningTranscriber({ fetchImpl: async () => { calls += 1; return json(transcript); } });
  await assert.rejects(never(audio(), options(pre.signal)), { name: 'AbortError' });
  assert.equal(calls, 0);

  let resolveFetch;
  let observedSignal;
  const during = bridge.createGroqReasoningTranscriber({ fetchImpl: (_url, init) => {
    calls += 1;
    observedSignal = init.signal;
    return new Promise(resolve => { resolveFetch = resolve; });
  } });
  const controller = new AbortController();
  const pending = during(audio(), options(controller.signal));
  controller.abort();
  assert.equal(observedSignal.aborted, true);
  resolveFetch(json(transcript));
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(calls, 1);
});

test('surfaces route HTTP errors and maps server 413 to the existing 8-MiB learner limit', async () => {
  const { bridge } = await runtime();
  const signal = new AbortController().signal;
  const badRequest = bridge.createGroqReasoningTranscriber({ fetchImpl: async () => json({ error: 'Groq listening is not configured. Type your question instead.' }, 400) });
  await assert.rejects(badRequest(audio(), options(signal)), /Groq listening is not configured/);
  const tooLarge = bridge.createGroqReasoningTranscriber({ fetchImpl: async () => new Response('<html>too large</html>', { status: 413, headers: { 'Content-Type': 'text/html' } }) });
  await assert.rejects(tooLarge(audio(), options(signal)), /server 8 MiB limit/);
});

test('rejects invalid JSON and mismatched, blank or overlong server transcripts', async () => {
  const { bridge } = await runtime();
  const signal = new AbortController().signal;
  const malformed = bridge.createGroqReasoningTranscriber({ fetchImpl: async () => new Response('{', { status: 200 }) });
  await assert.rejects(malformed(audio(), options(signal)), { code: 'invalid-response' });
  for (const invalid of [
    { ...transcript, provider: 'Other' },
    { ...transcript, model: 'different-model' },
    { ...transcript, locale: 'zu' },
    { ...transcript, translation: true },
    { ...transcript, sourceLabel: 'unknown' },
    { ...transcript, text: '   ' },
    { ...transcript, text: 'x'.repeat(4001) },
  ]) {
    const transcribe = bridge.createGroqReasoningTranscriber({ fetchImpl: async () => json(invalid) });
    await assert.rejects(transcribe(audio(), options(signal)));
  }
});

test('UI transcription runner forwards the explicit consent assertion and preserves editable text result shape', async () => {
  const { reasoning } = await runtime();
  const controller = new AbortController();
  let receivedOptions;
  let accepted;
  const result = await reasoning.runEnglishTranscription(audio(), async (_blob, requestOptions) => {
    receivedOptions = requestOptions;
    return { text: transcript.text, provider: 'Groq', model: 'whisper-large-v3-turbo' };
  }, controller.signal, () => true, value => { accepted = value; }, () => {});
  assert.equal(result, true);
  assert.deepEqual(receivedOptions, { signal: controller.signal, locale: 'en', consent: true });
  assert.equal(accepted.text, transcript.text);
  assert.equal(accepted.provider, 'Groq');
});
