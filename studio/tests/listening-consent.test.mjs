import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createConsentedUploadFlow } from '../src/listening-consent/uploadFlow.mjs';

const sampleAudio = new Uint8Array([82, 73, 70, 70]); // synthetic bytes; no real recording
const request = (locale = 'en') => ({ audio: sampleAudio, mimeType: 'audio/wav', locale, consent: true });
const asResult = ({ locale = 'en', text = 'How does a pump work?' } = {}) => ({
  text, sourceLabel: 'uploaded-file', locale,
  localeStatus: locale === 'unknown' ? 'unknown' : 'requested-not-validated',
});
const deferred = () => { let resolve; let reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };

test('no consent or absent explicit boolean: no transcriber call and no question', async () => {
  let calls = 0;
  const flow = createConsentedUploadFlow({ transcribe: () => { calls++; return Promise.resolve(asResult()); } });
  for (const consent of [undefined, false, 'true', 1, null]) {
    assert.deepEqual(await flow.upload({ ...request(), consent }), { ok: false, reason: 'consent-required' });
  }
  assert.equal(calls, 0);
  assert.equal(flow.getState().phase, 'idle');
  assert.equal(flow.question().ok, false);
});

test('explicit upload produces editable transcript, not an automatically sent question', async () => {
  const signals = [];
  const flow = createConsentedUploadFlow({ transcribe: async (args) => {
    signals.push(args);
    return asResult();
  } });
  assert.deepEqual(await flow.upload(request()), { ok: true, phase: 'needs-confirmation' });
  assert.equal(signals.length, 1);
  assert.deepEqual({ locale: signals[0].locale, sourceLabel: signals[0].sourceLabel, aborted: signals[0].signal.aborted },
    { locale: 'en', sourceLabel: 'uploaded-file', aborted: false });
  assert.equal(flow.question().ok, false);
  flow.confirm();
  assert.deepEqual(flow.question(), { ok: true, text: 'How does a pump work?', sourceLabel: 'uploaded-file', locale: 'en' });
  flow.edit('How is the stator connected?');
  assert.deepEqual(flow.question(), { ok: false, reason: 'confirmation-required' });
  flow.confirm();
  assert.equal(flow.question().text, 'How is the stator connected?');
});

test('cancel while transcribing aborts immediately and discards a late successful answer', async () => {
  const pending = deferred();
  let signal;
  const flow = createConsentedUploadFlow({ transcribe: ({ signal: s }) => { signal = s; return pending.promise; } });
  const running = flow.upload(request());
  assert.equal(flow.getState().phase, 'transcribing');
  assert.equal(signal.aborted, false);
  flow.cancel();
  assert.equal(signal.aborted, true);
  assert.equal(flow.getState().draftText, '');
  assert.equal(flow.question().ok, false);
  pending.resolve(asResult({ text: 'Late answer must disappear' }));
  assert.deepEqual(await running, { ok: false, reason: 'cancelled' });
  assert.equal(flow.getState().phase, 'cancelled');
  assert.equal(flow.getState().draftText, '');
});

test('an old request cannot corrupt a fresh retry after cancellation', async () => {
  const pending = deferred();
  let calls = 0;
  const flow = createConsentedUploadFlow({ transcribe: () => ++calls === 1 ? pending.promise : Promise.resolve(asResult({ text: 'New verified question' })) });
  const old = flow.upload(request());
  flow.cancel();
  assert.deepEqual(await flow.upload(request()), { ok: true, phase: 'needs-confirmation' });
  pending.reject(new Error('Old failure from disconnected request'));
  assert.deepEqual(await old, { ok: false, reason: 'cancelled' });
  assert.equal(flow.getState().draftText, 'New verified question');
  assert.equal(flow.getState().phase, 'needs-confirmation');
  assert.equal(calls, 2, 'never implicitly retries');
});

test('adapter failure has a safe, recoverable state; retry needs NEW consent', async () => {
  let calls = 0;
  const flow = createConsentedUploadFlow({ transcribe: () => ++calls === 1 ? Promise.reject(new Error('private provider detail')) : Promise.resolve(asResult()) });
  assert.deepEqual(await flow.upload(request()), { ok: false, reason: 'transcription-failed' });
  assert.equal(flow.getState().phase, 'error');
  assert.ok(!flow.getState().errorMessage.includes('private provider detail'));
  assert.equal(flow.question().ok, false);
  assert.deepEqual(await flow.upload({ ...request(), consent: false }), { ok: false, reason: 'consent-required' });
  assert.equal(calls, 1);
  assert.deepEqual(await flow.upload(request()), { ok: true, phase: 'needs-confirmation' });
  assert.equal(calls, 2);
});

test('parallel attempts are rejected without duplicate uploads or losing request identity', async () => {
  const pending = deferred();
  let calls = 0;
  const flow = createConsentedUploadFlow({ transcribe: () => { calls++; return pending.promise; } });
  const first = flow.upload(request());
  const id = flow.getState().requestId;
  assert.deepEqual(await flow.upload(request()), { ok: false, reason: 'already-transcribing' });
  assert.equal(flow.getState().requestId, id);
  assert.equal(calls, 1);
  pending.resolve(asResult());
  await first;
  assert.equal(flow.getState().phase, 'needs-confirmation');
});

test('mislabelled/blank transcripts cannot bypass confirmation', async () => {
  const responses = [asResult({ text: '  ' }), { ...asResult(), sourceLabel: 'provided-audio' }, asResult({ locale: 'tn' })];
  const flow = createConsentedUploadFlow({ transcribe: () => Promise.resolve(responses.shift()) });
  for (let i = 0; i < 3; i++) {
    assert.deepEqual(await flow.upload(request()), { ok: false, reason: 'invalid-transcript' });
    assert.equal(flow.getState().phase, 'error');
    flow.confirm();
    assert.equal(flow.question().ok, false);
  }
});

test('locales are preserved as requested-not-validated and unsupported locale formats rejected', async () => {
  const results = [];
  const flow = createConsentedUploadFlow({ transcribe: async ({ locale }) => { results.push(locale); return asResult({ locale }); } });
  for (const locale of ['zu', 'tn', 'unknown', 'EN']) {
    flow.cancel();
    assert.equal((await flow.upload(request(locale))).ok, true);
    const snapshot = flow.getState();
    assert.equal(snapshot.locale, locale.toLowerCase());
    assert.equal(snapshot.localeStatus, locale === 'unknown' ? 'unknown' : 'requested-not-validated');
  }
  assert.deepEqual(results, ['zu', 'tn', 'unknown', 'en']);
  for (const locale of ['en-ZA', 'xx', ' zu ', 7]) {
    assert.deepEqual(await flow.upload(request(locale)), { ok: false, reason: 'invalid-locale' });
  }
  assert.equal(results.length, 4);
});

test('returned snapshot mutation does not change submitted question', async () => {
  const flow = createConsentedUploadFlow({ transcribe: async () => asResult() });
  await flow.upload(request());
  flow.confirm();
  const copy = flow.getState();
  copy.confirmedText = 'tampered';
  copy.draftText = 'tampered';
  assert.equal(flow.question().text, 'How does a pump work?');
  flow.cancel();
  assert.equal(flow.getState().confirmedText, null);
  assert.equal(flow.question().ok, false);
});

test('synthetic evaluation fixture covers target languages and consent/recovery without pretending to measure WER', () => {
  const path = new URL('../../docs/listening-evaluation-20261025/synthetic-cases.json', import.meta.url);
  const cases = JSON.parse(readFileSync(path, 'utf8'));
  assert.deepEqual(cases.map(item => item.id), ['english', 'isizulu', 'setswana', 'code-switch', 'noise', 'no-speech', 'cancel', 'disconnect']);
  assert.ok(cases.every(item => item.synthetic === true && item.humanReviewed === false));
  assert.ok(cases.every(item => item.expectedHandling && item.deviceAudioRecorded === false));
  assert.ok(cases.find(item => item.id === 'code-switch').requestLocale === 'unknown');
});
