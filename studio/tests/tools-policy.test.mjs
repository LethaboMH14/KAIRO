import test from 'node:test';
import assert from 'node:assert/strict';
import { createPolicyEngine, PolicyError } from '../server/tools-core/policy.mjs';

const fixture = () => {
  let now = 1_800_000_000_000;
  const engine = createPolicyEngine({ clock: () => now });
  const base = { userId: 'learner-1', tool: 'document.read', action: 'read', destination: 'lesson-pane', resource: 'doc-7', fields: { section: 'intro' }, documentVersions: { 'doc-7': 'v3' }, idempotencyKey: 'key-1' };
  const grant = (overrides = {}) => engine.mintGrant({ userId: 'learner-1', tool: 'document.read', action: 'read', destination: 'lesson-pane', resource: 'doc-7', allowedFields: ['section'], documentVersions: { 'doc-7': 'v3' }, expiresAt: now + 1000, uses: 2, ...overrides });
  return { engine, base, grant, advance: (ms) => { now += ms; } };
};
const code = (expected) => (error) => error instanceof PolicyError && error.code === expected;

test('rejects revoked and expired grants during authorization', () => {
  const f = fixture(); let g = f.grant(); let req = f.engine.request(f.engine.createIntent(f.base));
  f.engine.revokeGrant(g.id, 'learner-1');
  assert.throws(() => f.engine.authorize(req.requestId, g.id, 'learner-1'), code('GRANT_REVOKED'));
  g = f.grant({ expiresAt: 1_800_000_000_001 }); req = f.engine.request(f.engine.createIntent({ ...f.base, idempotencyKey: 'key-2' })); f.advance(2);
  assert.throws(() => f.engine.authorize(req.requestId, g.id, 'learner-1'), code('GRANT_EXPIRED'));
});

test('rejects expanded fields, destination and document versions', () => {
  for (const [change, error] of [[{ fields: { section: 'intro', extra: true } }, 'SCOPE_MISMATCH'], [{ destination: 'external' }, 'SCOPE_MISMATCH'], [{ documentVersions: { 'doc-7': 'v4' } }, 'DOCUMENT_VERSION_MISMATCH']]) {
    const f = fixture(); const g = f.grant(); const intent = f.engine.createIntent({ ...f.base, ...change }); const req = f.engine.request(intent);
    assert.throws(() => f.engine.authorize(req.requestId, g.id, 'learner-1'), code(error));
  }
});

test('same idempotent submit returns same preview and does not spend twice; changed intent conflicts', () => {
  const f = fixture(); const g = f.grant();
  const a = f.engine.request(f.engine.createIntent(f.base)); const b = f.engine.request(f.engine.createIntent(f.base));
  assert.equal(a.requestId, b.requestId); assert.equal(b.duplicate, true);
  const reordered = f.engine.createIntent({ ...f.base, fields: { section: 'intro' }, documentVersions: { 'doc-7': 'v3' } });
  assert.equal(f.engine.request(reordered).requestId, a.requestId);
  assert.throws(() => f.engine.request(f.engine.createIntent({ ...f.base, resource: 'doc-8' })), code('IDEMPOTENCY_CONFLICT'));
  const authorized = f.engine.authorize(a.requestId, g.id, 'learner-1');
  assert.equal(f.engine.authorize(a.requestId, g.id, 'learner-1').ticketId, authorized.ticketId);
  assert.throws(() => f.engine.authorize(a.requestId, g.id, 'other-user'), code('USER_MISMATCH'));
});

test('execution rechecks revocation and expiry, and unknown outcome cannot be retried', () => {
  const f = fixture(); let g = f.grant(); let req = f.engine.request(f.engine.createIntent(f.base)); let ticket = f.engine.authorize(req.requestId, g.id, 'learner-1');
  f.engine.revokeGrant(g.id, 'learner-1'); assert.throws(() => f.engine.execute(ticket.ticketId), code('GRANT_REVOKED'));
  g = f.grant(); req = f.engine.request(f.engine.createIntent({ ...f.base, idempotencyKey: 'key-2' })); ticket = f.engine.authorize(req.requestId, g.id, 'learner-1');
  const unknown = f.engine.execute(ticket.ticketId, { outcome: 'outcome_unknown' });
  assert.equal(unknown.status, 'outcome_unknown'); assert.equal(f.engine.execute(ticket.ticketId).status, 'outcome_unknown');
  assert.equal(f.engine.getLedger().at(-1).status, 'outcome_unknown');
});

test('execution rejects a grant that expires after authorization', () => {
  const f = fixture(); const g = f.grant({ expiresAt: 1_800_000_000_010 });
  const req = f.engine.request(f.engine.createIntent(f.base)); const ticket = f.engine.authorize(req.requestId, g.id, 'learner-1');
  f.advance(10);
  assert.throws(() => f.engine.execute(ticket.ticketId), code('GRANT_EXPIRED'));
});

test('a one-use grant cannot authorize a second distinct request', () => {
  const f = fixture(); const g = f.grant({ uses: 1 });
  const first = f.engine.request(f.engine.createIntent(f.base)); f.engine.authorize(first.requestId, g.id, 'learner-1');
  const second = f.engine.request(f.engine.createIntent({ ...f.base, idempotencyKey: 'second-key' }));
  assert.throws(() => f.engine.authorize(second.requestId, g.id, 'learner-1'), code('GRANT_EXHAUSTED'));
});

test('rejects user mismatch; cancellation stops queued mock action', () => {
  const f = fixture(); const g = f.grant(); const req = f.engine.request(f.engine.createIntent(f.base));
  assert.throws(() => f.engine.authorize(req.requestId, g.id, 'someone-else'), code('USER_MISMATCH'));
  const ticket = f.engine.authorize(req.requestId, g.id, 'learner-1');
  assert.equal(f.engine.cancel(ticket.ticketId).status, 'cancelled');
  assert.equal(f.engine.execute(ticket.ticketId).status, 'cancelled');
});

test('redacts credential-like fields and rejects oversized inputs', () => {
  const f = fixture(); const g = f.grant({ allowedFields: ['token'] });
  assert.throws(() => f.engine.createIntent({ ...f.base, fields: { token: 'x'.repeat(9000) } }), code('INPUT_TOO_LARGE'));
  const req = f.engine.request(f.engine.createIntent({ ...f.base, fields: { token: { nested: 'do-not-log', secret: 7 } } }));
  const ticket = f.engine.authorize(req.requestId, g.id, 'learner-1');
  const ledger = f.engine.getLedger(); const serialized = JSON.stringify(ledger);
  assert.equal(serialized.includes('do-not-log'), false); assert.ok(serialized.length < 5000);
  assert.equal(serialized.includes('nested'), false); assert.equal(serialized.includes('secret'), false);
  assert.equal(f.engine.execute(ticket.ticketId).status, 'succeeded');
});

test('rejects malformed maps, allowed fields and invalid clocks with PolicyError', () => {
  const f = fixture();
  for (const bad of [null, [], 'x', 1]) {
    assert.throws(() => f.engine.createIntent({ ...f.base, fields: bad }), code('INVALID_FIELDS'));
    assert.throws(() => f.engine.createIntent({ ...f.base, documentVersions: bad }), code('INVALID_DOCUMENT_VERSIONS'));
  }
  assert.throws(() => f.engine.mintGrant({ userId: 'u', tool: 't', action: 'read', destination: 'd', resource: 'r', allowedFields: null, documentVersions: {}, expiresAt: 1_900_000_000_000, uses: 1 }), code('INVALID_GRANT'));
  const invalidClock = createPolicyEngine({ clock: () => Number.NaN });
  assert.throws(() => invalidClock.mintGrant({ userId: 'u', tool: 't', action: 'read', destination: 'd', resource: 'r', allowedFields: [], documentVersions: {}, expiresAt: 1_900_000_000_000, uses: 1 }), code('INVALID_CLOCK'));
  for (const badTime of [1_800_000_000_000.5, Number.MAX_SAFE_INTEGER + 1]) {
    const badClock = createPolicyEngine({ clock: () => badTime });
    assert.throws(() => badClock.mintGrant({ userId: 'u', tool: 't', action: 'read', destination: 'd', resource: 'r', allowedFields: [], documentVersions: {}, expiresAt: 1_900_000_000_000, uses: 1 }), code('INVALID_CLOCK'));
  }
});

test('enforces aggregate nested input byte budget', () => {
  const f = fixture();
  const bounded = createPolicyEngine({ clock: () => 1_800_000_000_000, limits: { totalInputBytes: 32, fieldBytes: 64 } });
  assert.doesNotThrow(() => bounded.createIntent({ ...f.base, fields: { a: '1234', b: '5678' } }));
  assert.throws(() => bounded.createIntent({ ...f.base, fields: { a: { b: '12345678901234567890123456789012' } } }), code('INPUT_TOO_LARGE'));
  assert.throws(() => bounded.createIntent({ ...f.base, fields: { values: Array(20).fill(null) } }), code('INPUT_TOO_LARGE'));
});

test('invalid clock cannot partially mutate execute or cancel state', () => {
  let now = 1_800_000_000_000;
  const engine = createPolicyEngine({ clock: () => now });
  const grant = engine.mintGrant({ userId: 'u', tool: 't', action: 'read', destination: 'd', resource: 'r', allowedFields: [], documentVersions: {}, expiresAt: now + 1000, uses: 2 });
  const req = engine.request(engine.createIntent({ userId: 'u', tool: 't', action: 'read', destination: 'd', resource: 'r', fields: {}, documentVersions: {}, idempotencyKey: 'one' }));
  const ticket = engine.authorize(req.requestId, grant.id, 'u'); now = Number.NaN;
  assert.throws(() => engine.execute(ticket.ticketId), code('INVALID_CLOCK'));
  assert.equal(engine.getLedger()[0].status, 'queued');
  assert.throws(() => engine.cancel(ticket.ticketId), code('INVALID_CLOCK'));
  assert.equal(engine.getLedger()[0].status, 'queued');
});

test('authorization captures one time before mutation even with an alternating clock', () => {
  let calls = 0;
  const engine = createPolicyEngine({ clock: () => (++calls <= 2 ? 1_800_000_000_000 : Number.NaN) });
  // Grant creation and authorization see valid timestamps; the next clock read fails.
  const grant = engine.mintGrant({ userId: 'u', tool: 't', action: 'read', destination: 'd', resource: 'r', allowedFields: [], documentVersions: {}, expiresAt: 1_800_000_001_000, uses: 1 });
  const req = engine.request(engine.createIntent({ userId: 'u', tool: 't', action: 'read', destination: 'd', resource: 'r', fields: {}, documentVersions: {}, idempotencyKey: 'one' }));
  const ticket = engine.authorize(req.requestId, grant.id, 'u');
  assert.equal(engine.getLedger().length, 1);
  assert.equal(engine.getLedger()[0].ticketId, ticket.ticketId);
  assert.throws(() => engine.execute(ticket.ticketId), code('INVALID_CLOCK'));
  assert.equal(engine.getLedger()[0].status, 'queued');
});

test('separates read, execute, upload, publish and submit grants', () => {
  for (const action of ['execute', 'upload', 'publish', 'submit']) {
    const f = fixture(); const g = f.grant({ action }); const req = f.engine.request(f.engine.createIntent({ ...f.base, action }));
    assert.equal(f.engine.authorize(req.requestId, g.id, 'learner-1').status, 'queued');
  }
});
