import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createLocalAiStore} from '../server/ai-runtime/local-store.mjs';
import {createModelGateway} from '../server/ai-runtime/gateway.mjs';
import {createLocalBundleRepository} from '../server/bundle-lessons/local-repository.mjs';

const idFor = requestId => `ai_req_${createHash('sha256').update(JSON.stringify(requestId)).digest('hex').slice(0, 48)}`;

test('local AI preferences and gateway ledgers are shared across the real SQLite adapters', async () => {
  const home = resolve(await mkdtemp(join(tmpdir(), 'kairo-bundle-local-')));
  let ai;
  let bundle;
  try {
    ai = createLocalAiStore(join(home, 'ai-runtime.sqlite'));
    bundle = await createLocalBundleRepository(home);

    const savedPreferences = {language: 'en-ZA', readingSpeed: 0.8, textOnly: true};
    const preference = await ai.put('local', 'progress', 'learner_preferences', savedPreferences, {create: true});
    assert.deepEqual(await bundle.get('local', 'progress', 'learner_preferences'), preference);

    const bundlePreference = {language: 'zu-ZA', readingSpeed: 1, textOnly: false};
    const replaced = await bundle.put('local', 'progress', 'learner_preferences', bundlePreference, {version: preference.version});
    assert.deepEqual(await ai.get('local', 'progress', 'learner_preferences'), replaced);

    const fixedTime = Date.parse('2026-10-25T10:11:12.000Z');
    const env = {KAIRO_CLOUD_ENABLED: '1', KAIRO_AI_DAILY_MICROUSD: '1000000'};
    let performed = 0;
    const runGateway = async (repository, requestId) => createModelGateway({
      repository,
      env,
      clock: () => fixedTime,
    }).run({
      uid: 'local', requestId, revision: 'reviewed-revision',
      payload: {task: 'help', question: 'Explain the reviewed point'},
      provider: 'google', consent: ['google'],
      validate: raw => raw,
      perform: async () => { performed++; return {text: 'Synthetic local test result'}; },
    });

    const legacyResult = await runGateway(ai, 'legacy-request-123');
    assert.equal(legacyResult.provider, 'google');
    const legacyRequestKey = idFor('legacy-request-123');
    assert.equal((await bundle.get('local', 'progress', legacyRequestKey)).value.status, 'complete');
    const dailyKey = 'ai_usage_20261025';
    assert.equal((await bundle.get('local', 'progress', dailyKey)).value.requests[legacyRequestKey + '_google'], 20000);
    assert.deepEqual(await runGateway(bundle, 'legacy-request-123'), legacyResult);
    assert.equal(performed, 1, 'the second adapter must reuse the completed idempotency record');

    const bundleResult = await runGateway(bundle, 'bundle-request-123');
    assert.equal(bundleResult.provider, 'google');
    const bundleRequestKey = idFor('bundle-request-123');
    assert.equal((await ai.get('local', 'progress', bundleRequestKey)).value.status, 'complete');
    assert.equal((await ai.get('local', 'progress', dailyKey)).value.requests[bundleRequestKey + '_google'], 20000);

    const independentId = 'bundle_lesson_123';
    const lessonProgress = await bundle.put('local', 'progress', independentId, {step: 2, notes: 'my work'}, {create: true});
    assert.deepEqual(await bundle.get('local', 'progress', independentId), lessonProgress);
    assert.equal(await ai.get('local', 'progress', independentId), null);
    await assert.rejects(
      () => bundle.put('local', 'progress', independentId, {step: 3, notes: 'stale'}, {version: 'stale-version'}),
      error => error.status === 409,
    );
    assert.deepEqual(await bundle.get('local', 'progress', independentId), lessonProgress);
    await assert.rejects(() => bundle.get('another-owner', 'progress', independentId), /local only/);
  } finally {
    bundle?.close();
    ai?.close();
    await rm(home, {recursive: true, force: true});
  }
});
