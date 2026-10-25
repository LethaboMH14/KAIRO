import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, open, readFile, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

export class RunnerError extends Error {
  constructor(code, message) { super(message); this.name = 'RunnerError'; this.code = code; }
}
const fail = (code, detail) => { throw new RunnerError(code, detail); };
const active = new Set(['claimed', 'running', 'review', 'blocked']);
const actionIssues = new Set(['labeled', 'opened', 'reopened', 'closed']);
const actionPrs = new Set(['opened', 'ready_for_review']);

function header(headers, name) {
  const keys = Object.keys(headers || {}).filter(k => k.toLowerCase() === name);
  if (keys.length !== 1 || Array.isArray(headers[keys[0]]) || typeof headers[keys[0]] !== 'string') {
    fail('invalid_header', `Exactly one ${name} header is required`);
  }
  return headers[keys[0]];
}

export function verifySignature({ secret, headers, rawBody, maxBytes = 262144 }) {
  if (!Buffer.isBuffer(rawBody) || rawBody.length > maxBytes) fail('invalid_body', 'Raw request bytes are required and must be bounded');
  if (!(typeof secret === 'string' || Buffer.isBuffer(secret)) || !secret.length) fail('no_secret', 'Webhook secret must be supplied out of band');
  const supplied = header(headers, 'x-hub-signature-256');
  if (!/^sha256=[0-9a-fA-F]{64}$/.test(supplied)) fail('bad_signature', 'Malformed SHA-256 webhook signature');
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  const actual = Buffer.from(supplied.slice(7), 'hex');
  if (!timingSafeEqual(expected, actual)) fail('bad_signature', 'Webhook signature verification failed');
  return true;
}

export function normalizeScope(path) {
  if (typeof path !== 'string' || !path.trim() || path.length > 256 || path.includes('\\') || path.startsWith('/') || path.includes(':') || path.includes('\0') || path.split('/').some(p => !p || p === '.' || p === '..')) {
    fail('invalid_scope', 'Scopes must be relative, canonical POSIX file/subtree paths');
  }
  return path.toLowerCase().replace(/\/$/, '');
}
const overlaps = (a, b) => a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
const integer = n => Number.isSafeInteger(n) && n > 0;
const validBranch = b => typeof b === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,150}$/.test(b) && !b.includes('..') && !b.includes('//') && !b.endsWith('/');
const initial = () => ({ version: 1, deliveries: {}, tasks: {}, dispatches: 0, unitsSpent: 0 });

export class OfflineRunner {
  constructor({ directory, secret, allowedRepo, maxConcurrent = 2, maxAttempts = 3, maxDispatches = 20, maxUnits = 20, backoffMs = 1000, maxDeliveries = 10000, clock = () => Date.now() }) {
    if (!directory || !secret || !/^[\w.-]+\/[\w.-]+$/.test(allowedRepo || '')) fail('configuration', 'Directory, secret and exact allowedRepo are required');
    for (const n of [maxConcurrent, maxAttempts, maxDispatches, maxUnits, backoffMs, maxDeliveries]) if (!integer(n)) fail('configuration', 'Limits must be positive safe integers');
    if (maxAttempts > 12 || maxConcurrent > 32 || maxDispatches > 100000 || maxUnits > 100000 || maxDeliveries > 100000) fail('configuration', 'Unsafe quota ceiling');
    this.directory = directory; this.file = join(directory, 'ledger.json'); this.lock = join(directory, '.ledger.lock');
    this.secret = secret; this.allowedRepo = allowedRepo; this.maxConcurrent = maxConcurrent; this.maxAttempts = maxAttempts;
    this.maxDispatches = maxDispatches; this.maxUnits = maxUnits; this.backoffMs = backoffMs; this.maxDeliveries = maxDeliveries; this.clock = clock;
  }
  async snapshot() {
    try {
      const state = JSON.parse(await readFile(this.file, 'utf8'));
      if (state.version !== 1 || !state.tasks || !state.deliveries || !integer(state.dispatches + 1) || !integer(state.unitsSpent + 1)) fail('corrupt_ledger', 'Ledger version or structure is invalid');
      return state;
    } catch (error) {
      if (error.code === 'ENOENT') return initial();
      if (error instanceof SyntaxError) fail('corrupt_ledger', 'Ledger JSON is invalid; no automatic recovery');
      throw error;
    }
  }
  async transaction(work) {
    await mkdir(this.directory, { recursive: true });
    let locked = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      try { await mkdir(this.lock); locked = true; break; }
      catch (error) { if (error.code !== 'EEXIST') throw error; await sleep(10); }
    }
    if (!locked) fail('lock_busy', 'Ledger is locked; inspect owner before any manual recovery');
    try {
      const state = await this.snapshot();
      const result = await work(state);
      const name = join(this.directory, `.ledger-${randomUUID()}.tmp`);
      const handle = await open(name, 'wx', 0o600);
      try { await handle.writeFile(JSON.stringify(state, null, 2) + '\n'); await handle.sync(); }
      finally { await handle.close(); }
      await rename(name, this.file);
      try { const dir = await open(this.directory, 'r'); try { await dir.sync(); } finally { await dir.close(); } }
      catch (error) { if (!['EINVAL', 'EPERM', 'EISDIR', 'ENOTSUP'].includes(error.code)) throw error; }
      return result;
    } finally { await rm(this.lock, { recursive: true }); }
  }
  async ingest({ headers, rawBody }) {
    verifySignature({ secret: this.secret, headers, rawBody });
    const delivery = header(headers, 'x-github-delivery');
    const event = header(headers, 'x-github-event');
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(delivery)) fail('invalid_delivery', 'A GitHub UUID delivery ID is required');
    const digest = createHash('sha256').update(rawBody).digest('hex');
    let body;
    try { body = JSON.parse(rawBody.toString('utf8')); } catch { fail('invalid_json', 'Webhook body is not JSON'); }
    if (!body || typeof body !== 'object' || Array.isArray(body) || body.repository?.full_name !== this.allowedRepo) fail('foreign_repo', 'Repository not on explicit allowlist');
    return this.transaction(state => {
      const previous = state.deliveries[delivery];
      if (previous) {
        if (previous.digest !== digest || previous.event !== event) fail('delivery_collision', 'Delivery ID reused with different contents/event');
        return { status: 'duplicate', previous: previous.outcome };
      }
      if (Object.keys(state.deliveries).length >= this.maxDeliveries) fail('ledger_full', 'Maximum durable deliveries reached; manual archival policy needed');
      let outcome = { status: 'ignored', reason: 'unsupported_or_feedback_event' };
      if (body.sender?.type === 'Bot') outcome = { status: 'ignored', reason: 'bot_feedback_loop' };
      else if (body.sender?.type !== 'User') outcome = { status: 'ignored', reason: 'unknown_actor' };
      else if (event === 'issues' && actionIssues.has(body.action) && integer(body.issue?.number) && !body.issue.pull_request) {
        const id = `${this.allowedRepo}#${body.issue.number}`;
        const ready = Array.isArray(body.issue.labels) && body.issue.labels.some(l => l.name === 'agent-ready');
        const triggering = body.action !== 'labeled' || body.label?.name === 'agent-ready';
        if (body.action === 'closed') {
          const task = state.tasks[id];
          if (task && task.state !== 'dead_letter' && task.state !== 'review') {
            task.state = 'blocked'; task.reason = 'GitHub issue closed'; task.updatedAt = this.clock();
            outcome = { status: 'blocked', taskId: id };
          }
        } else if (ready && triggering && body.issue.state === 'open') {
          if (!state.tasks[id]) {
            if (Object.keys(state.tasks).length >= 500) fail('ledger_full', 'Maximum task count reached');
            state.tasks[id] = { id, issue: body.issue.number, title: String(body.issue.title || '').slice(0, 200), state: 'queued', owner: null, branch: null, scopes: [], attempts: 0, dispatchId: null, nextAttemptAt: 0, pr: null, createdAt: this.clock(), updatedAt: this.clock() };
            outcome = { status: 'queued', taskId: id };
          } else outcome = { status: 'existing', taskId: id, state: state.tasks[id].state };
        }
      } else if (event === 'pull_request' && actionPrs.has(body.action) && integer(body.pull_request?.number) && body.pull_request?.head?.repo?.full_name === this.allowedRepo && body.pull_request?.base?.ref === 'main') {
        const task = Object.values(state.tasks).find(t => t.branch && t.branch === body.pull_request.head.ref && ['claimed', 'running', 'review'].includes(t.state));
        if (task) {
          if (task.pr !== null && task.pr !== body.pull_request.number) fail('pr_conflict', 'Task already linked to a different PR');
          task.pr = body.pull_request.number; task.state = 'review'; task.updatedAt = this.clock();
          outcome = { status: 'review', taskId: task.id, pr: task.pr };
        }
      }
      state.deliveries[delivery] = { digest, event, action: String(body.action || '').slice(0, 60), outcome, receivedAt: this.clock() };
      return outcome;
    });
  }
  async claim({ taskId, owner, branch, scopes }) {
    if (typeof owner !== 'string' || !/^[\w-]{1,100}$/.test(owner) || !validBranch(branch) || !Array.isArray(scopes) || !scopes.length || scopes.length > 30) fail('invalid_claim', 'Explicit owner, branch, and 1–30 safe scopes required');
    const normalized = [...new Set(scopes.map(normalizeScope))].sort();
    return this.transaction(state => {
      const task = state.tasks[taskId];
      if (!task) fail('unknown_task', 'Task does not exist');
      if (task.state !== 'queued') fail('already_claimed', 'Task is not queued; no ownership takeover');
      for (const other of Object.values(state.tasks)) if (other.id !== taskId && active.has(other.state)) {
        if (other.branch === branch || normalized.some(a => other.scopes.some(b => overlaps(a, b)))) fail('conflicting_claim', `Conflicting live task ${other.id}; coordinator review required`);
      }
      Object.assign(task, { state: 'claimed', owner, branch, scopes: normalized, updatedAt: this.clock() });
      return { status: 'claimed', taskId, owner, branch };
    });
  }
  async dispatchSimulation({ units = 1 } = {}) {
    if (!integer(units) || units > this.maxUnits) fail('invalid_units', 'Simulation units are positive integers');
    return this.transaction(state => {
      if (Object.values(state.tasks).filter(t => t.state === 'running').length >= this.maxConcurrent) return { status: 'at_capacity' };
      if (state.dispatches >= this.maxDispatches || state.unitsSpent + units > this.maxUnits) return { status: 'budget_exhausted' };
      const task = Object.values(state.tasks).filter(t => t.state === 'claimed' && t.nextAttemptAt <= this.clock()).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))[0];
      if (!task) return { status: 'no_ready_task' };
      task.attempts += 1; task.state = 'running'; task.updatedAt = this.clock();
      task.dispatchId = `${task.issue}-${task.attempts}-${randomUUID()}`;
      state.dispatches++; state.unitsSpent += units;
      return { status: 'simulated', taskId: task.id, owner: task.owner, branch: task.branch, attempt: task.attempts, dispatchId: task.dispatchId, units };
    });
  }
  async reportSimulation({ taskId, owner, dispatchId, result }) {
    if (!['succeeded', 'retryable_failure', 'fatal_failure'].includes(result)) fail('invalid_result', 'Explicit simulated outcome required');
    return this.transaction(state => {
      const task = state.tasks[taskId];
      if (!task || task.state !== 'running' || task.owner !== owner || task.dispatchId !== dispatchId) fail('stale_report', 'Only current claimed running attempt can report');
      if (result === 'succeeded') task.state = 'review';
      else if (result === 'fatal_failure' || task.attempts >= this.maxAttempts) { task.state = 'dead_letter'; task.reason = result; }
      else { task.state = 'claimed'; task.nextAttemptAt = this.clock() + this.backoffMs * (2 ** (task.attempts - 1)); }
      task.updatedAt = this.clock(); task.dispatchId = null;
      return { status: task.state, taskId, attempts: task.attempts, nextAttemptAt: task.nextAttemptAt };
    });
  }
  async block({ taskId, owner, reason }) {
    if (!reason || typeof reason !== 'string' || reason.length > 300) fail('invalid_reason', 'A short reason is required');
    return this.transaction(state => {
      const task = state.tasks[taskId];
      if (!task || task.owner !== owner || !['claimed', 'running'].includes(task.state)) fail('not_owner', 'Only current owner may block an active task');
      task.state = 'blocked'; task.reason = reason; task.updatedAt = this.clock(); task.dispatchId = null;
      return { status: 'blocked', taskId };
    });
  }
}
