import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createProviderHarness, Deferred, installMediaMocks, loadActualTeacherProvider, settings } from './narration-fixtures/provider-harness.mjs';

let loaded;
before(async () => { loaded = await loadActualTeacherProvider(); });
after(async () => { await loaded?.close(); });

async function setup() {
  const mocks = installMediaMocks();
  const harness = createProviderHarness(loaded.Provider);
  // New learners default to the cloud natural voice; these cases exercise device narration explicitly.
  harness.render(); harness.value.update(settings()); harness.render();
  return { mocks, harness, get api() { return harness.value; }, async close() { harness.cleanup(); mocks.restore(); } };
}
async function settle() { await Promise.resolve(); await Promise.resolve(); }

test('browser replacement ignores late A start/end/error and stop prevents restart', async () => {
  const x = await setup();
  try {
    x.api.say('first'); x.harness.render(); const a = x.mocks.speech.utterances[0];
    x.api.say('second'); x.harness.render(); const b = x.mocks.speech.utterances[1];
    b.onstart(); x.harness.render(); assert.equal(x.api.speaking, true);
    a.onstart(); a.onend(); a.onerror(); x.harness.render();
    assert.equal(x.api.speaking, true); assert.match(x.api.status, /Synthetic English/);
    x.api.stop(); x.harness.render(); a.onstart(); b.onstart(); x.harness.render();
    assert.equal(x.api.speaking, false); assert.equal(x.api.status, 'Narration stopped.');
  } finally { await x.close(); }
});

test('browser pause/resume dispatches synthesis controls; stop clears paused state; unavailable voice does not speak', async () => {
  const x = await setup();
  try {
    x.api.say('pause me'); x.harness.render(); const utterance = x.mocks.speech.utterances[0]; utterance.onstart(); x.harness.render();
    x.api.pause(); x.harness.render(); assert.equal(x.mocks.speech.pauseCount, 1); assert.equal(x.api.paused, true);
    x.api.pause(); x.harness.render(); assert.equal(x.mocks.speech.resumeCount, 1); assert.equal(x.api.paused, false);
    x.api.pause(); x.harness.render(); x.api.stop(); x.harness.render(); assert.equal(x.api.speaking, false); assert.equal(x.api.paused, false);
    x.mocks.speech.voices = []; x.api.say('unavailable', 'zu-ZA'); x.harness.render();
    assert.equal(x.mocks.speech.utterances.length, 1); assert.match(x.api.status, /No zu-ZA voice/);
  } finally { await x.close(); }
});

test('cloud consent and language mismatch make no fetch or audio construction', async () => {
  const x = await setup();
  try {
    x.api.update(settings({ voiceMode: 'google', cloudConsent: false })); x.harness.render();
    x.api.say('hello'); x.harness.render(); await settle(); x.harness.render();
    assert.match(x.api.status, /Enable Google voice consent/); assert.equal(x.mocks.trace.fetches.length, 0); assert.equal(x.mocks.trace.audios.length, 0);
    x.api.update(settings({ voiceMode: 'google', cloudConsent: true, language: 'zu-ZA' })); x.harness.render();
    x.api.say('Sawubona', 'zu-ZA'); x.harness.render(); await settle(); x.harness.render();
    assert.match(x.api.status, /speaks en-GB/); assert.equal(x.mocks.trace.fetches.length, 0); assert.equal(x.mocks.trace.audios.length, 0);
  } finally { await x.close(); }
});

test('stop during delayed AudioContext resume prevents request and playback', async () => {
  const x = await setup();
  try {
    const resume = new Deferred(); x.mocks.trace.nextResumeDeferred = resume;
    x.api.update(settings({ voiceMode: 'google', cloudConsent: true })); x.harness.render();
    x.api.say('delayed'); x.harness.render(); assert.equal(x.mocks.trace.graphs.length, 1);
    x.api.stop(); x.harness.render(); resume.resolve(); await settle(); x.harness.render();
    assert.equal(x.mocks.trace.fetches.length, 0); assert.equal(x.mocks.trace.audios.length, 0); assert.equal(x.api.speaking, false);
  } finally { await x.close(); }
});

test('abort during pending fetch blocks even an abort-ignoring late response from constructing audio', async () => {
  const x = await setup();
  try {
    const pending = new Deferred(); let signal;
    globalThis.fetch = async (...args) => { x.mocks.trace.fetches.push(args); signal = args[1].signal; return pending.promise; };
    x.api.update(settings({ voiceMode: 'google', cloudConsent: true })); x.harness.render();
    x.api.say('pending'); await settle(); assert.equal(x.mocks.trace.fetches.length, 1);
    x.api.stop(); x.harness.render(); assert.equal(signal.aborted, true);
    pending.resolve({ ok: true, blob: async () => new Blob(['synthetic']) }); await settle(); x.harness.render();
    assert.equal(x.mocks.trace.audios.length, 0); assert.equal(x.api.speaking, false);
  } finally { await x.close(); }
});

test('stop during response.blob aborts the request and ignores an abort-ignoring late blob', async () => {
  const x = await setup();
  try {
    const blob = new Deferred(); let signal;
    globalThis.fetch = async (...args) => { x.mocks.trace.fetches.push(args); signal=args[1].signal; return { ok:true, blob:()=>blob.promise }; };
    x.api.update(settings({ voiceMode:'google', cloudConsent:true })); x.harness.render();
    x.api.say('blob pending'); await settle(); assert.equal(x.mocks.trace.fetches.length, 1);
    x.api.stop(); x.harness.render(); assert.equal(signal.aborted, true);
    blob.resolve(new Blob(['late blob'])); await settle(); x.harness.render();
    assert.equal(x.mocks.trace.audios.length, 0); assert.equal(x.mocks.trace.playCalls, 0); assert.equal(x.api.speaking, false);
  } finally { await x.close(); }
});

test('out-of-order cloud replacement permits only B to reach audio playback', async () => {
  const x = await setup();
  try {
    const first = new Deferred(), second = new Deferred(); let n = 0;
    globalThis.fetch = async (...args) => { x.mocks.trace.fetches.push(args); return (++n === 1 ? first.promise : second.promise); };
    x.api.update(settings({ voiceMode: 'google', cloudConsent: true })); x.harness.render();
    x.api.say('A'); await settle(); x.harness.render(); x.api.say('B'); await settle(); x.harness.render();
    second.resolve({ ok: true, blob: async () => new Blob(['B']) }); await settle(); x.harness.render();
    assert.equal(x.mocks.trace.audios.length, 1); const b = x.mocks.trace.audios[0]; b.onplaying(); x.harness.render();
    first.resolve({ ok: true, blob: async () => new Blob(['A']) }); await settle(); x.harness.render();
    assert.equal(x.mocks.trace.audios.length, 1); assert.equal(x.api.speaking, true); assert.equal(b.src, 'blob:test-1');
  } finally { await x.close(); }
});

test('active cloud stop resets signal and disposes audio, animation, URL and graph', async () => {
  const x = await setup();
  try {
    globalThis.fetch = async (...args) => { x.mocks.trace.fetches.push(args); return { ok: true, blob: async () => new Blob(['audio']) }; };
    x.api.update(settings({ voiceMode: 'google', cloudConsent: true })); x.harness.render(); x.api.say('playing'); await settle(); x.harness.render();
    const audio = x.mocks.trace.audios[0]; audio.onplaying(); x.harness.render();
    x.api.audioSignal.current = { energy: 0.6, time: 1.2, duration: 3 };
    x.api.stop(); x.harness.render();
    assert.equal(audio.paused, true); assert.equal(audio.src, ''); assert.deepEqual(x.api.audioSignal.current, { energy: 0, time: 0, duration: 0 });
    assert.equal(x.mocks.trace.revoked.length, 1); assert.ok(x.mocks.trace.cancelledFrames.length >= 1);
    assert.equal(x.mocks.trace.sources[0].disconnected, true); assert.equal(x.mocks.trace.analysers[0].disconnected, true);
    assert.equal(x.api.speaking, false); audio.onplaying?.(); audio.onended?.(); x.harness.render(); assert.equal(x.api.speaking, false);
  } finally { await x.close(); }
});

test('cloud pause/resume uses the active audio element and does not fetch again', async () => {
  const x = await setup();
  try {
    globalThis.fetch = async (...args) => { x.mocks.trace.fetches.push(args); return { ok: true, blob: async () => new Blob(['audio']) }; };
    x.api.update(settings({ voiceMode: 'google', cloudConsent: true })); x.harness.render(); x.api.say('playing'); await settle(); x.harness.render();
    const audio = x.mocks.trace.audios[0]; audio.onplaying(); x.harness.render(); const before = x.mocks.trace.fetches.length;
    x.api.pause(); x.harness.render(); assert.equal(audio.pauseCount, 1); assert.equal(x.api.paused, true);
    x.api.pause(); x.harness.render(); await settle(); assert.equal(x.api.paused, false); assert.equal(x.mocks.trace.fetches.length, before);
  } finally { await x.close(); }
});

test('failed cloud resume reports retry guidance rather than starting another request', async () => {
  const x = await setup();
  try {
    globalThis.fetch = async (...args) => { x.mocks.trace.fetches.push(args); return { ok:true, blob:async()=>new Blob(['audio']) }; };
    x.api.update(settings({ voiceMode:'google', cloudConsent:true })); x.harness.render(); x.api.say('playing'); await settle(); x.harness.render();
    const audio=x.mocks.trace.audios[0]; audio.onplaying(); x.harness.render(); x.api.pause(); x.harness.render();
    x.mocks.trace.nextPlayError = new Error('synthetic playback denial');
    x.api.pause(); x.harness.render(); await settle(); x.harness.render();
    assert.match(x.api.status, /Press Read to restart narration/); assert.equal(x.mocks.trace.fetches.length, 1);
    assert.equal(x.api.speaking, false, 'a rejected resume must not leave provider state claiming narration is active');
    assert.equal(x.api.paused, false);
  } finally { await x.close(); }
});

test('late rejected resume from A cannot stop replacement B', async () => {
  const x=await setup();
  try{
    globalThis.fetch=async()=>({ok:true,blob:async()=>new Blob(['synthetic'])});
    x.api.update(settings({voiceMode:'google',cloudConsent:true}));x.harness.render();x.api.say('A');await settle();x.harness.render();
    const a=x.mocks.trace.audios[0];a.onplaying();x.harness.render();x.api.pause();x.harness.render();
    const pending=new Deferred();a.play=()=>pending.promise;x.api.pause();x.harness.render();
    x.api.say('B');await settle();x.harness.render();const b=x.mocks.trace.audios.at(-1);b.onplaying();x.harness.render();
    pending.reject(new Error('old playback rejected'));await settle();x.harness.render();
    assert.equal(x.api.speaking,true);assert.notEqual(b.src,'');assert.equal(b.pauseCount,0);assert.doesNotMatch(x.api.status,/Press Read to restart/);
  }finally{await x.close();}
});

test('changing teacher settings cancels active cloud audio and disposes its resources', async () => {
  const x = await setup();
  try {
    globalThis.fetch = async (...args) => { x.mocks.trace.fetches.push(args); return { ok:true, blob:async()=>new Blob(['audio']) }; };
    x.api.update(settings({ voiceMode:'google', cloudConsent:true })); x.harness.render(); x.api.say('active'); await settle(); x.harness.render();
    const audio=x.mocks.trace.audios[0]; audio.onplaying(); x.harness.render();
    x.api.update(settings({ voiceMode:'browser', cloudConsent:false })); x.harness.render();
    assert.equal(audio.paused,true); assert.equal(audio.src,''); assert.equal(x.mocks.trace.revoked.length,1);
    assert.equal(x.api.speaking,false); audio.onplaying?.(); x.harness.render(); assert.equal(x.api.speaking,false);
  } finally { await x.close(); }
});

test('pagehide and provider cleanup cancel pending work and cleanup closes AudioContext', async () => {
  const x = await setup();
  try {
    const pending = new Deferred(); let signal;
    globalThis.fetch = async (...args) => { x.mocks.trace.fetches.push(args); signal=args[1].signal; return pending.promise; };
    x.api.update(settings({ voiceMode: 'google', cloudConsent: true })); x.harness.render(); x.api.say('pagehide'); await settle();
    x.mocks.trace.events.get('pagehide')(); assert.equal(signal.aborted, true);
    const context = x.mocks.trace.graphs[0]; x.harness.cleanup(); assert.equal(context.closeCount, 1);
    pending.resolve({ ok:true, blob: async()=>new Blob(['late']) }); await settle(); assert.equal(x.mocks.trace.audios.length, 0);
  } finally { await x.close(); }
});

test('actual speechChunks boundaries are used and stop between chunks cannot request the next chunk', async () => {
  const x = await setup();
  try {
    const first = new Deferred(); let signal;
    globalThis.fetch = async (...args) => { x.mocks.trace.fetches.push(args); signal=args[1].signal; return first.promise; };
    x.api.update(settings({ voiceMode: 'google', cloudConsent: true })); x.harness.render();
    const text = `${'one '.repeat(350)}${'two '.repeat(350)}`;
    x.api.say(text); await settle(); assert.equal(x.mocks.trace.fetches.length, 1);
    x.api.stop(); first.resolve({ ok:true, blob:async()=>new Blob(['late']) }); await settle(); x.harness.render();
    assert.equal(signal.aborted, true); assert.equal(x.mocks.trace.fetches.length, 1); assert.equal(x.mocks.trace.audios.length, 0);
  } finally { await x.close(); }
});
