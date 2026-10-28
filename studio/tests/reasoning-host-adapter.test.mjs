import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { createReasoningAttempt } from '../../tools/learnharness-adapter-20261026/reasoning-attempt.mjs';

const studioRoot = fileURLToPath(new URL('..', import.meta.url));
let runtimePromise;
function runtime() {
  if (!runtimePromise) runtimePromise = (async () => {
    const server = await createServer({ root: studioRoot, configFile: false, plugins: [reactPlugin()], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, ws: false }, appType: 'custom' });
    return { server, adapter: await server.ssrLoadModule('/src/reasoning-host-adapter/reasoningHostAdapter.ts'), reasoning: await server.ssrLoadModule('/src/learner-reasoning-ui/reasoning.ts') };
  })();
  return runtimePromise;
}
after(async () => { if (runtimePromise) (await runtimePromise).server.close(); });

const sourceRefs = [{ sourceId: 'a'.repeat(24), revision: 'b'.repeat(64), locator: 'Reviewed synthetic source, page 1' }];
const question = { id: 'motor-q1', prompt: 'Which speed is described?', options: [{ id: 'field', label: 'Field speed' }, { id: 'shaft', label: 'Shaft speed' }] };
const context = { contextKey: 'motor-q1:a'.repeat(0) + `motor-q1:${sourceRefs[0].revision}`, question, sourceRefs };
const snapshot = { questionId: question.id, selectedOptionId: 'shaft', text: 'I assumed they always match.', method: 'typed', confidence: 75 };

test('submits only a confirmed canonical snapshot and preserves percentage/null through original validator', async () => {
  const { adapter: module, reasoning } = await runtime();
  for (const confidence of [75, null]) {
    let callbackRequest;
    const adapter = module.createReasoningHostAdapter(async request => {
      callbackRequest = request;
      // This fixture stands in for the root-owned server callback: owner is
      // resolved here, never accepted in the client request.
      return createReasoningAttempt({ ownerId: 'server-resolved-fixture-owner', question: request.question, response: request.response, sourceRefs: request.sourceRefs, confirmedAt: '2026-10-26T12:00:00.000Z' });
    });
    adapter.activateContext(context.contextKey);
    const confirmed = reasoning.buildConfirmedReasoning({ ...snapshot, confidence });
    const result = await adapter.submit(confirmed, context);
    assert.equal(result.status, 'submitted');
    assert.equal(callbackRequest.response.confirmed, true);
    assert.equal('ownerId' in callbackRequest, false);
    assert.equal(result.value.ownerId, 'server-resolved-fixture-owner');
    assert.equal(result.value.response.confidence, confidence);
  }
});

test('rejects mismatched question, selected option, inactive context and missing reviewed sources before callback', async () => {
  const { adapter: module } = await runtime();
  let calls = 0;
  const adapter = module.createReasoningHostAdapter(async () => { calls += 1; });
  adapter.activateContext(context.contextKey);
  await assert.rejects(adapter.submit({ ...snapshot, questionId: 'other' }, context), /current question/);
  await assert.rejects(adapter.submit({ ...snapshot, selectedOptionId: 'invented' }, context), /canonical question/);
  await assert.rejects(adapter.submit(snapshot, { ...context, sourceRefs: [] }), /source references/);
  adapter.invalidate('motor-q1:new-revision');
  await assert.rejects(adapter.submit(snapshot, context), /Activate the current/);
  assert.equal(calls, 0);
});

test('caller cancellation propagates and late callback completion is fenced', async () => {
  const { adapter: module } = await runtime();
  let resolveHost;
  let receivedSignal;
  const adapter = module.createReasoningHostAdapter((_request, { signal }) => {
    receivedSignal = signal;
    return new Promise(resolve => { resolveHost = resolve; });
  });
  adapter.activateContext(context.contextKey);
  const caller = new AbortController();
  const pending = adapter.submit(snapshot, context, { signal: caller.signal });
  caller.abort();
  assert.equal(receivedSignal.aborted, true);
  resolveHost('late result');
  assert.deepEqual(await pending, { status: 'aborted' });
});

test('an edited explanation has a different confirmation fingerprint and must be confirmed again by the UI', async () => {
  const { reasoning } = await runtime();
  const first = reasoning.buildConfirmedReasoning(snapshot);
  const edited = reasoning.buildConfirmedReasoning({ ...snapshot, text: 'I now think the answer may be different.' });
  assert.notEqual(reasoning.confirmationFingerprint(first), reasoning.confirmationFingerprint(edited));
});

test('context invalidation aborts pending work and prevents old result delivery', async () => {
  const { adapter: module } = await runtime();
  let resolveHost;
  let receivedSignal;
  const adapter = module.createReasoningHostAdapter((_request, { signal }) => {
    receivedSignal = signal;
    return new Promise(resolve => { resolveHost = resolve; });
  });
  adapter.activateContext(context.contextKey);
  const pending = adapter.submit(snapshot, context);
  adapter.activateContext('motor-q1:changed-source-revision');
  assert.equal(receivedSignal.aborted, true);
  resolveHost('outdated result');
  assert.deepEqual(await pending, { status: 'stale' });
});

test('a second submission fences the first result for the same context', async () => {
  const { adapter: module } = await runtime();
  const resolvers = [];
  const adapter = module.createReasoningHostAdapter(() => new Promise(resolve => resolvers.push(resolve)));
  adapter.activateContext(context.contextKey);
  const first = adapter.submit(snapshot, context);
  const second = adapter.submit({ ...snapshot, text: 'I reviewed and confirmed this explanation.' }, context);
  resolvers[0]('first');
  resolvers[1]('second');
  assert.deepEqual(await first, { status: 'stale' });
  assert.deepEqual(await second, { status: 'submitted', value: 'second' });
});
