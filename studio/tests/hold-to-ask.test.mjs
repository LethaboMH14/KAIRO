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
    const model = await server.ssrLoadModule('/src/hold-to-ask/model.ts');
    const ui = await server.ssrLoadModule('/src/hold-to-ask/HoldToAsk.tsx');
    const audio = await server.ssrLoadModule('/src/learner-reasoning-ui/audioCapture.ts');
    const groq = await server.ssrLoadModule('/src/reasoning-listening-bridge/groqReasoningTranscriber.ts');
    return { server, model, ui, audio, groq };
  })();
  return fixturePromise;
}
after(async () => { if (fixturePromise) (await fixturePromise).server.close(); });

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

/** A fake microphone: counts getUserMedia calls and records whether tracks were stopped. */
function fakeMicrophone({ deferStream = false } = {}) {
  const mic = { opened: 0, trackStops: 0, recorders: 0, release: null };
  const stream = { getTracks: () => [{ stop() { mic.trackStops++; } }] };
  mic.env = {
    getUserMedia() {
      mic.opened++;
      if (!deferStream) return Promise.resolve(stream);
      return new Promise(resolve => { mic.release = () => resolve(stream); });
    },
    createRecorder() {
      mic.recorders++;
      const recorder = {
        state: 'inactive', mimeType: 'audio/webm;codecs=opus',
        start() { recorder.state = 'recording'; },
        stop() {
          recorder.state = 'inactive';
          recorder.ondataavailable?.({ data: new Blob(['synthetic-audio'], { type: 'audio/webm' }) });
          recorder.onstop?.();
        },
      };
      return recorder;
    },
    isTypeSupported: type => type === 'audio/webm;codecs=opus',
    setTimer: () => 1,
    clearTimer() {},
  };
  return mic;
}

/** The real Groq bridge with a recording fetch: only the listening route should ever be called. */
function recordingTranscriber(groq, text = 'Why does the pump need priming?') {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, headers: init.headers });
    return new Response(JSON.stringify({ text, provider: 'Groq', model: 'whisper-large-v3-turbo', locale: 'en', localeStatus: 'requested-not-validated', sourceLabel: 'uploaded-file', translation: false }), { status: 200 });
  };
  return { calls, transcribe: groq.createGroqReasoningTranscriber({ fetchImpl, requestIdFactory: () => 'synthetic-request-1' }) };
}

function session(model, audio, mic, transcribe, clock) {
  const seen = { phases: [], statuses: [], errors: [], transcripts: [] };
  const hold = model.createHoldToAsk({ createCapture: events => audio.createAudioCapture(mic.env, events), transcribe, now: () => clock.now }, {
    onPhase: phase => seen.phases.push(phase),
    onStatus: message => seen.statuses.push(message),
    onError: message => seen.errors.push(message),
    onTranscript: text => seen.transcripts.push(text),
  });
  return { hold, seen };
}

test('the microphone opens only on an explicit press after consent', async () => {
  const { model, audio, groq } = await getFixture();
  const mic = fakeMicrophone(), clock = { now: 0 }, { calls, transcribe } = recordingTranscriber(groq);
  const { hold } = session(model, audio, mic, transcribe, clock);
  await settle();
  assert.equal(mic.opened, 0, 'creating the control must not open the microphone');
  assert.equal(hold.press(false), false, 'a press without consent is ignored');
  await settle();
  assert.equal(mic.opened, 0);
  assert.equal(hold.press(true), true);
  await settle();
  assert.equal(mic.opened, 1);
  assert.equal(hold.phase(), 'recording');
  assert.equal(calls.length, 0, 'nothing is sent while the button is held');
  hold.dispose();
  assert.equal(mic.trackStops, 1, 'disposing releases the microphone');
});

test('hold, speak and let go: the transcript fills the question and nothing is asked automatically', async () => {
  const { model, audio, groq } = await getFixture();
  const mic = fakeMicrophone(), clock = { now: 0 }, { calls, transcribe } = recordingTranscriber(groq);
  const { hold, seen } = session(model, audio, mic, transcribe, clock);
  hold.press(true);
  await settle();
  clock.now = 1500;
  hold.release();
  await settle(); await settle();
  assert.deepEqual(seen.transcripts, ['Why does the pump need priming?']);
  assert.deepEqual(seen.errors, []);
  assert.equal(hold.phase(), 'idle');
  assert.deepEqual(seen.phases, ['requesting', 'recording', 'transcribing', 'idle']);
  assert.equal(mic.trackStops, 1, 'letting go closes the microphone');
  assert.equal(calls.length, 1, 'exactly one request: the transcription');
  assert.equal(calls[0].url, '/api/workspace/listening');
  assert.equal(calls[0].headers['X-Kairo-Consent'], 'groq');
  assert.equal(calls[0].headers['X-Kairo-Language'], 'en');
  assert.ok(!calls.some(call => String(call.url).includes('/passage')), 'the question is never sent for an explanation');
  assert.match(seen.statuses.at(-1), /Nothing is asked until you choose Explain/);

  // The transcript lands in an editable field; typed words keep the Keep/Replace choice.
  assert.deepEqual(model.placeVoiceQuestion('', seen.transcripts[0]), { question: 'Why does the pump need priming?', pending: null });
  assert.deepEqual(model.placeVoiceQuestion('  ', 'Hi'), { question: 'Hi', pending: null });
  assert.deepEqual(model.placeVoiceQuestion('My own words', seen.transcripts[0]), { question: 'My own words', pending: 'Why does the pump need priming?' });
});

test('letting go before the microphone opens records and sends nothing', async () => {
  const { model, audio, groq } = await getFixture();
  const mic = fakeMicrophone({ deferStream: true }), clock = { now: 0 }, { calls, transcribe } = recordingTranscriber(groq);
  const { hold, seen } = session(model, audio, mic, transcribe, clock);
  hold.press(true);
  assert.equal(hold.phase(), 'requesting');
  hold.release();
  assert.equal(hold.phase(), 'idle');
  mic.release();
  await settle();
  assert.equal(mic.recorders, 0, 'no recorder starts after the learner let go');
  assert.equal(mic.trackStops, 1, 'the late microphone stream is stopped at once');
  assert.equal(calls.length, 0);
  assert.deepEqual(seen.transcripts, []);
  assert.match(seen.statuses.at(-1), /Nothing was recorded or sent/);
});

test('a tap shorter than the hold minimum, or Escape while holding, sends nothing', async () => {
  const { model, audio, groq } = await getFixture();
  const clock = { now: 0 }, { calls, transcribe } = recordingTranscriber(groq);
  const tap = session(model, audio, fakeMicrophone(), transcribe, clock);
  tap.hold.press(true);
  await settle();
  clock.now = model.MIN_HOLD_MS - 1;
  tap.hold.release();
  await settle();
  assert.match(tap.seen.statuses.at(-1), /too short/);

  const escape = session(model, audio, fakeMicrophone(), transcribe, clock);
  escape.hold.press(true);
  await settle();
  escape.hold.cancel();
  await settle();
  assert.equal(escape.hold.phase(), 'idle');
  assert.equal(calls.length, 0);
});

test('an over-long transcript is reported, not shortened or placed in the field', async () => {
  const { model, audio, groq } = await getFixture();
  const clock = { now: 0 }, { transcribe } = recordingTranscriber(groq, 'a'.repeat(model.MAX_VOICE_QUESTION_CHARS + 1));
  const { hold, seen } = session(model, audio, fakeMicrophone(), transcribe, clock);
  hold.press(true);
  await settle();
  clock.now = 2000;
  hold.release();
  await settle(); await settle();
  assert.deepEqual(seen.transcripts, []);
  assert.match(seen.errors.at(-1), /longer than 300 characters/);
});

test('a Permissions-Policy microphone block hides the control', async () => {
  const { model, ui, audio } = await getFixture();
  const blockedDoc = { permissionsPolicy: { allowsFeature: feature => feature !== 'microphone' } };
  const policyAllowsMicrophone = audio.microphoneAllowedByPolicy(blockedDoc);
  assert.equal(policyAllowsMicrophone, false);
  const transcribe = async () => ({ text: 'unused', provider: 'Groq', model: 'whisper-large-v3-turbo' });
  assert.equal(model.holdToAskAvailability({ policyAllowsMicrophone, recordingSupported: true, transcribe }), 'hidden');
  assert.equal(model.holdToAskAvailability({ policyAllowsMicrophone, recordingSupported: true, transcribe: null }), 'hidden');
  const blocked = () => ({ policyAllowsMicrophone, recordingSupported: true });
  assert.equal(renderToStaticMarkup(React.createElement(ui.default, { transcribe, onTranscript() {}, probe: blocked })), '');
  assert.equal(renderToStaticMarkup(React.createElement(ui.default, { transcribe: null, onTranscript() {}, probe: blocked })), '');
});

test('without Groq the honest not-configured note shows; with Groq the control waits for consent', async () => {
  const { ui } = await getFixture();
  const allowed = () => ({ policyAllowsMicrophone: true, recordingSupported: true });
  const notConfigured = renderToStaticMarkup(React.createElement(ui.default, { transcribe: null, onTranscript() {}, probe: allowed }));
  assert.match(notConfigured, /Hold-to-ask voice questions are not configured here\. Type your question instead\./);
  assert.doesNotMatch(notConfigured, /<button/);
  assert.equal(renderToStaticMarkup(React.createElement(ui.default, { transcribe: undefined, onTranscript() {}, probe: allowed })), '', 'nothing flashes while the status check is pending');

  const transcribe = async () => ({ text: 'unused', provider: 'Groq', model: 'whisper-large-v3-turbo' });
  const ready = renderToStaticMarkup(React.createElement(ui.default, { transcribe, onTranscript() {}, probe: allowed }));
  assert.match(ready, /Hold to ask/);
  assert.match(ready, /<button[^>]*disabled=""[^>]*>.*Hold to ask/s, 'the button stays disabled until consent is ticked');
  assert.match(ready, /Open my microphone only while I hold the button/);
  assert.match(ready, /send the clip to Groq/);
  assert.match(ready, /transcript language is not verified/);
  assert.match(ready, /never asked automatically/);
});
