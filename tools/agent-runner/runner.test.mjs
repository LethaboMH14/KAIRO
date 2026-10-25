import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { OfflineRunner, verifySignature, RunnerError } from './runner.mjs';

const repo = 'LethaboMH14/KAIRO';
const secret = 'offline-test-secret-not-a-real-key';
const make = async (t, overrides = {}) => {
  const directory = await mkdtemp(join(tmpdir(), 'kairo-agent-runner-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return { runner: new OfflineRunner({ directory, secret, allowedRepo: repo, ...overrides }), directory };
};
function signed(event, body, { delivery, signature } = {}) {
  const rawBody = Buffer.from(JSON.stringify(body));
  const headers = { 'x-github-event': event, 'x-github-delivery': delivery || randomUUID(), 'x-hub-signature-256': signature || `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}` };
  return { headers, rawBody };
}
const issueEvent = (number, action = 'labeled', withReady = true) => ({
  action, repository: { full_name: repo }, sender: { type: 'User', login: 'approved-owner' },
  issue: { number, state: 'open', title: `Task ${number}`, labels: withReady ? [{ name: 'agent-ready' }] : [] }, label: { name: 'agent-ready' }
});
const prEvent = (number, branch) => ({
  action: 'opened', repository: { full_name: repo }, sender: { type: 'User' },
  pull_request: { number, head: { ref: branch, repo: { full_name: repo } }, base: { ref: 'main' } }
});
async function queue(runner, issue) {
  const result = await runner.ingest(signed('issues', issueEvent(issue)));
  assert.equal(result.status, 'queued');
  return result.taskId;
}
const fails = (code) => (error) => error instanceof RunnerError && error.code === code;

test('HMAC: exact raw bytes, no sha1, length error, altered payload, duplicate signature header', () => {
  const packet = signed('issues', issueEvent(1));
  assert.equal(verifySignature({ secret, ...packet }), true);
  const altered = Buffer.from(packet.rawBody.toString().replace('Task 1', 'Task x'));
  assert.throws(() => verifySignature({ secret, headers: packet.headers, rawBody: altered }), fails('bad_signature'));
  assert.throws(() => verifySignature({ secret, headers: { ...packet.headers, 'x-hub-signature-256': 'sha1=ffff' }, rawBody: packet.rawBody }), fails('bad_signature'));
  assert.throws(() => verifySignature({ secret, headers: { ...packet.headers, 'X-Hub-Signature-256': packet.headers['x-hub-signature-256'] }, rawBody: packet.rawBody }), fails('invalid_header'));
  assert.throws(() => verifySignature({ secret, ...packet, maxBytes: 2 }), fails('invalid_body'));
});

test('authenticated duplicate delivery is idempotent across runner restart', async t => {
  const { runner, directory } = await make(t);
  const event = signed('issues', issueEvent(8), { delivery: '00000000-0000-4000-8000-000000000013' });
  assert.equal((await runner.ingest(event)).status, 'queued');
  const restarted = new OfflineRunner({ directory, secret, allowedRepo: repo });
  assert.deepEqual(await restarted.ingest(event), { status: 'duplicate', previous: { status: 'queued', taskId: `${repo}#8` } });
  assert.equal(Object.keys((await restarted.snapshot()).tasks).length, 1);
  await assert.rejects(restarted.ingest(signed('issues', issueEvent(9), { delivery: '00000000-0000-4000-8000-000000000013' })), fails('delivery_collision'));
  assert.equal(Object.keys((await restarted.snapshot()).tasks).length, 1);
});

test('untrusted event types, bot echoes, no ready label, foreign repo never enqueue', async t => {
  const { runner } = await make(t);
  assert.equal((await runner.ingest(signed('issue_comment', issueEvent(2)))).status, 'ignored');
  const bot = issueEvent(3); bot.sender.type = 'Bot';
  assert.equal((await runner.ingest(signed('issues', bot))).reason, 'bot_feedback_loop');
  assert.equal((await runner.ingest(signed('issues', issueEvent(4, 'opened', false)))).status, 'ignored');
  const foreign = issueEvent(5); foreign.repository.full_name = 'other/repo';
  await assert.rejects(runner.ingest(signed('issues', foreign)), fails('foreign_repo'));
  assert.equal(Object.keys((await runner.snapshot()).tasks).length, 0);
});

test('claim is durable and rejects conflicting owner, overlapping scopes, parent/child and duplicate branch', async t => {
  const { runner, directory } = await make(t);
  const a = await queue(runner, 10), b = await queue(runner, 11);
  await runner.claim({ taskId: a, owner: 'worker-1', branch: 'feat/issue10', scopes: ['tools/agent-runner'] });
  await assert.rejects(runner.claim({ taskId: a, owner: 'worker-2', branch: 'feat/steal', scopes: ['docs/a'] }), fails('already_claimed'));
  await assert.rejects(runner.claim({ taskId: b, owner: 'worker-2', branch: 'feat/issue11', scopes: ['tools/agent-runner/subdir'] }), fails('conflicting_claim'));
  await assert.rejects(runner.claim({ taskId: b, owner: 'worker-2', branch: 'feat/issue10', scopes: ['docs/a'] }), fails('conflicting_claim'));
  const reload = new OfflineRunner({ directory, secret, allowedRepo: repo });
  assert.equal((await reload.snapshot()).tasks[a].owner, 'worker-1');
  await assert.rejects(reload.claim({ taskId: b, owner: 'worker-3', branch: 'feat/issue11', scopes: ['tools'] }), fails('conflicting_claim'));
  await reload.claim({ taskId: b, owner: 'worker-2', branch: 'feat/issue11', scopes: ['docs/worker'] });
});

test('concurrent claim calls serialize without admitting a conflicting scope', async t => {
  const { runner } = await make(t);
  const ids = [await queue(runner, 20), await queue(runner, 21)];
  const outcomes = await Promise.allSettled(ids.map((taskId, i) => runner.claim({ taskId, owner: `worker-${i}`, branch: `feat/concurrent${i}`, scopes: ['tools/shared'] })));
  assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1);
  assert.equal(outcomes.filter(x => x.status === 'rejected' && x.reason.code === 'conflicting_claim').length, 1);
});

test('bounded dispatch and exponential retry respect time, idempotent attempt receipt and dead letter', async t => {
  let time = 10000;
  const { runner, directory } = await make(t, { clock: () => time, maxAttempts: 3, maxConcurrent: 1, backoffMs: 50 });
  const taskId = await queue(runner, 30);
  await runner.claim({ taskId, owner: 'agent-one', branch: 'feat/retry', scopes: ['src/retry'] });
  const first = await runner.dispatchSimulation();
  assert.equal(first.status, 'simulated'); assert.equal(first.attempt, 1);
  assert.equal((await runner.dispatchSimulation()).status, 'at_capacity');
  await assert.rejects(runner.reportSimulation({ ...first, taskId, owner: 'wrong', result: 'succeeded' }), fails('stale_report'));
  const afterOne = await runner.reportSimulation({ taskId, owner: 'agent-one', dispatchId: first.dispatchId, result: 'retryable_failure' });
  assert.equal(afterOne.status, 'claimed'); assert.equal(afterOne.nextAttemptAt, 10050);
  await assert.rejects(runner.reportSimulation({ taskId, owner: 'agent-one', dispatchId: first.dispatchId, result: 'succeeded' }), fails('stale_report'));
  assert.equal((await runner.dispatchSimulation()).status, 'no_ready_task');
  time = 10050;
  const restart = new OfflineRunner({ directory, secret, allowedRepo: repo, clock: () => time, maxAttempts: 3, maxConcurrent: 1, backoffMs: 50 });
  const second = await restart.dispatchSimulation(); assert.equal(second.attempt, 2);
  const afterTwo = await restart.reportSimulation({ taskId, owner: 'agent-one', dispatchId: second.dispatchId, result: 'retryable_failure' });
  assert.equal(afterTwo.nextAttemptAt, 10150);
  time = 10150;
  const third = await restart.dispatchSimulation(); assert.equal(third.attempt, 3);
  assert.equal((await restart.reportSimulation({ taskId, owner: 'agent-one', dispatchId: third.dispatchId, result: 'retryable_failure' })).status, 'dead_letter');
  assert.equal((await restart.dispatchSimulation()).status, 'no_ready_task');
  assert.equal((await restart.snapshot()).dispatches, 3);
});

test('simulated run consumes caps, never invokes a worker, and success requires matching receipt', async t => {
  const { runner } = await make(t, { maxUnits: 2, maxDispatches: 2 });
  const a = await queue(runner, 40);
  await runner.claim({ taskId: a, owner: 'worker', branch: 'feat/40', scopes: ['docs/forty'] });
  const receipt = await runner.dispatchSimulation({ units: 2 });
  assert.equal(receipt.status, 'simulated');
  assert.equal((await runner.reportSimulation({ taskId: a, owner: 'worker', dispatchId: receipt.dispatchId, result: 'succeeded' })).status, 'review');
  assert.equal((await runner.dispatchSimulation()).status, 'budget_exhausted');
  assert.equal((await runner.snapshot()).unitsSpent, 2);
});

test('PR events only mark matching claimed branch for same-repo review; no dispatch from comments', async t => {
  const { runner } = await make(t);
  const id = await queue(runner, 50);
  await runner.claim({ taskId: id, owner: 'worker', branch: 'feat/issue50', scopes: ['docs/50'] });
  assert.equal((await runner.ingest(signed('pull_request', prEvent(71, 'other/branch')))).status, 'ignored');
  const fork = prEvent(72, 'feat/issue50'); fork.pull_request.head.repo.full_name = 'fork/elsewhere';
  assert.equal((await runner.ingest(signed('pull_request', fork))).status, 'ignored');
  assert.equal((await runner.ingest(signed('pull_request', prEvent(73, 'feat/issue50')))).status, 'review');
  assert.equal((await runner.snapshot()).tasks[id].pr, 73);
  assert.equal((await runner.ingest(signed('issue_comment', { action: 'created', repository: { full_name: repo }, sender: { type: 'Bot' } }))).status, 'ignored');
  assert.equal((await runner.dispatchSimulation()).status, 'no_ready_task');
  await assert.rejects(runner.ingest(signed('pull_request', prEvent(74, 'feat/issue50'))), fails('pr_conflict'));
});

test('closed issue blocks claimed task; path traversal and invalid actor are rejected', async t => {
  const { runner } = await make(t);
  const id = await queue(runner, 60);
  await assert.rejects(runner.claim({ taskId: id, owner: 'bad owner', branch: 'good', scopes: ['src'] }), fails('invalid_claim'));
  await assert.rejects(runner.claim({ taskId: id, owner: 'ok', branch: 'good', scopes: ['src/../secret'] }), fails('invalid_scope'));
  await runner.claim({ taskId: id, owner: 'ok', branch: 'feat/60', scopes: ['src/legit'] });
  const closed = issueEvent(60, 'closed'); closed.issue.state = 'closed';
  assert.equal((await runner.ingest(signed('issues', closed))).status, 'blocked');
  assert.equal((await runner.dispatchSimulation()).status, 'no_ready_task');
});
