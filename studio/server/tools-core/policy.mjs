const ACTIONS = new Set(['read', 'execute', 'upload', 'publish', 'submit']);
const DEFAULT_LIMITS = Object.freeze({ grants: 200, requests: 500, ledger: 500, fields: 40, fieldBytes: 8192, totalInputBytes: 32768, text: 200, logBytes: 2048 });

export class PolicyError extends Error {
  constructor(code) { super(code); this.name = 'PolicyError'; this.code = code; }
}

function ownObject(value, code = 'INVALID_INPUT') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new PolicyError(code);
  return value;
}
function exactKeys(value, allowed, required = allowed) {
  ownObject(value);
  for (const k of Object.keys(value)) if (!allowed.includes(k)) throw new PolicyError('UNKNOWN_FIELD');
  for (const k of required) if (!Object.hasOwn(value, k)) throw new PolicyError('MISSING_FIELD');
}
function str(value, code = 'INVALID_INPUT') {
  if (typeof value !== 'string' || value.length < 1 || value.length > DEFAULT_LIMITS.text || value.trim() !== value) throw new PolicyError(code);
  return value;
}
function finiteNow(clock) {
  const now = clock();
  if (!Number.isSafeInteger(now)) throw new PolicyError('INVALID_CLOCK');
  return now;
}
function mapObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) throw new PolicyError(`INVALID_${label}`);
  return value;
}
function safeClone(value, limits, budget = { bytes: 0 }, depth = 0) {
  if (depth > 5) throw new PolicyError('INPUT_TOO_LARGE');
  if (value === null || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) {
    budget.bytes += Buffer.byteLength(JSON.stringify(value), 'utf8') + 1;
    if (budget.bytes > limits.totalInputBytes) throw new PolicyError('INPUT_TOO_LARGE');
    return value;
  }
  if (typeof value === 'string') {
    const size = Buffer.byteLength(value, 'utf8');
    if (size > limits.fieldBytes || (budget.bytes += size) > limits.totalInputBytes) throw new PolicyError('INPUT_TOO_LARGE');
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > limits.fields) throw new PolicyError('INPUT_TOO_LARGE');
    budget.bytes += 2 + Math.max(0, value.length - 1);
    if (budget.bytes > limits.totalInputBytes) throw new PolicyError('INPUT_TOO_LARGE');
    return value.map((item) => safeClone(item, limits, budget, depth + 1));
  }
  ownObject(value);
  const keys = Object.keys(value);
  if (keys.length > limits.fields) throw new PolicyError('INPUT_TOO_LARGE');
  const out = Object.create(null);
  budget.bytes += 2 + Math.max(0, keys.length - 1);
  if (budget.bytes > limits.totalInputBytes) throw new PolicyError('INPUT_TOO_LARGE');
  for (const key of keys) {
    if (key.length > limits.text || ['__proto__', 'constructor', 'prototype'].includes(key)) throw new PolicyError('INVALID_INPUT');
    budget.bytes += Buffer.byteLength(key, 'utf8') + 3;
    if (budget.bytes > limits.totalInputBytes) throw new PolicyError('INPUT_TOO_LARGE');
    out[key] = safeClone(value[key], limits, budget, depth + 1);
  }
  return out;
}
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function cloneBounded(value, limits) {
  return safeClone(value, limits, { bytes: 0 });
}

export function createPolicyEngine({ clock = () => Date.now(), limits: overrides = {} } = {}) {
  if (typeof clock !== 'function') throw new PolicyError('INVALID_CLOCK');
  const limits = { ...DEFAULT_LIMITS, ...overrides };
  for (const [key, value] of Object.entries(limits)) if (!Number.isSafeInteger(value) || value < 1) throw new PolicyError('INVALID_LIMIT');
  const grants = new Map(); const requests = new Map(); const idempotency = new Map(); const ledger = [];
  let sequence = 0;
  const id = (prefix) => `${prefix}-${++sequence}`;

  function validGrant(grant, userId, intent, now, consume = false) {
    if (!grant || grant.revoked) throw new PolicyError('GRANT_REVOKED');
    if (now >= grant.expiresAt) throw new PolicyError('GRANT_EXPIRED');
    if (grant.userId !== userId) throw new PolicyError('USER_MISMATCH');
    if (consume && grant.remainingUses < 1) throw new PolicyError('GRANT_EXHAUSTED');
    if (grant.tool !== intent.tool || grant.action !== intent.action || grant.destination !== intent.destination || grant.resource !== intent.resource) throw new PolicyError('SCOPE_MISMATCH');
    if (intent.action === 'read' && !ACTIONS.has('read')) throw new PolicyError('SCOPE_MISMATCH');
    if (intent.action !== 'read' && !ACTIONS.has(intent.action)) throw new PolicyError('SCOPE_MISMATCH');
    if (stable(grant.documentVersions) !== stable(intent.documentVersions)) throw new PolicyError('DOCUMENT_VERSION_MISMATCH');
    const fields = Object.keys(intent.fields).sort();
    if (fields.some((field) => !grant.allowedFields.includes(field))) throw new PolicyError('SCOPE_MISMATCH');
    return grant;
  }

  function mintGrant(input) {
    exactKeys(input, ['userId', 'tool', 'action', 'destination', 'resource', 'allowedFields', 'documentVersions', 'expiresAt', 'uses']);
    if (!Array.isArray(input.allowedFields) || input.allowedFields.length > limits.fields) throw new PolicyError('INVALID_GRANT');
    mapObject(input.documentVersions, 'DOCUMENT_VERSIONS');
    const grant = {
      id: id('grant'), userId: str(input.userId), tool: str(input.tool), action: str(input.action),
      destination: str(input.destination), resource: str(input.resource),
      allowedFields: [...new Set(input.allowedFields.map((x) => str(x)))].sort(),
      documentVersions: cloneBounded(input.documentVersions, limits), expiresAt: input.expiresAt,
      remainingUses: input.uses, revoked: false,
    };
    if (!ACTIONS.has(grant.action) || !Number.isSafeInteger(grant.expiresAt) || grant.expiresAt <= finiteNow(clock) || !Number.isSafeInteger(grant.remainingUses) || grant.remainingUses < 1) throw new PolicyError('INVALID_GRANT');
    if (grants.size >= limits.grants) throw new PolicyError('CAPACITY_REACHED');
    grants.set(grant.id, grant);
    return Object.freeze({ id: grant.id, userId: grant.userId, tool: grant.tool, action: grant.action, destination: grant.destination, resource: grant.resource, allowedFields: [...grant.allowedFields], documentVersions: cloneBounded(grant.documentVersions, limits), expiresAt: grant.expiresAt, uses: grant.remainingUses });
  }
  function revokeGrant(grantId, userId) {
    const grant = grants.get(str(grantId));
    if (!grant) throw new PolicyError('GRANT_NOT_FOUND');
    if (grant.userId !== str(userId)) throw new PolicyError('USER_MISMATCH');
    grant.revoked = true;
    return true;
  }
  function createIntent(input) {
    exactKeys(input, ['userId', 'tool', 'action', 'destination', 'resource', 'fields', 'documentVersions', 'idempotencyKey']);
    mapObject(input.fields, 'FIELDS'); mapObject(input.documentVersions, 'DOCUMENT_VERSIONS');
    const intent = { userId: str(input.userId), tool: str(input.tool), action: str(input.action), destination: str(input.destination), resource: str(input.resource), fields: cloneBounded(input.fields, limits), documentVersions: cloneBounded(input.documentVersions, limits), idempotencyKey: str(input.idempotencyKey) };
    if (!ACTIONS.has(intent.action) || Object.keys(intent.fields).length > limits.fields) throw new PolicyError('INVALID_INTENT');
    if (intent.idempotencyKey.length > 128) throw new PolicyError('INVALID_INTENT');
    return Object.freeze(intent);
  }
  function request(intent) {
    ownObject(intent);
    // Re-validate snapshots at the boundary; callers cannot smuggle mutated nested objects.
    const normalized = createIntent(intent);
    const fingerprint = stable(normalized);
    const idemKey = `${normalized.userId}\u0000${normalized.idempotencyKey}`;
    const existing = idempotency.get(idemKey);
    if (existing) {
      if (existing.fingerprint !== fingerprint) throw new PolicyError('IDEMPOTENCY_CONFLICT');
      return Object.freeze({ requestId: existing.requestId, status: requests.get(existing.requestId).status, duplicate: true });
    }
    if (requests.size >= limits.requests) throw new PolicyError('CAPACITY_REACHED');
    const requestId = id('request');
    requests.set(requestId, { requestId, intent: normalized, fingerprint, status: 'preview', grantId: null, ticketId: null });
    idempotency.set(idemKey, { fingerprint, requestId });
    return Object.freeze({ requestId, status: 'preview', summary: Object.freeze({ userId: normalized.userId, tool: normalized.tool, action: normalized.action, destination: normalized.destination, resource: normalized.resource, fieldNames: Object.keys(normalized.fields).sort(), documentVersions: cloneBounded(normalized.documentVersions, limits) }) });
  }
  function authorize(requestId, grantId, userId) {
    const req = requests.get(str(requestId));
    if (!req) throw new PolicyError('REQUEST_NOT_FOUND');
    if (req.ticketId) {
      if (req.intent.userId !== str(userId) || req.grantId !== str(grantId)) throw new PolicyError('USER_MISMATCH');
      const currentGrant = grants.get(req.grantId);
      validGrant(currentGrant, userId, req.intent, finiteNow(clock));
      return Object.freeze({ ticketId: req.ticketId, status: req.status, duplicate: true });
    }
    if (req.status !== 'preview') throw new PolicyError('INVALID_STATE');
    if (req.intent.userId !== str(userId)) throw new PolicyError('USER_MISMATCH');
    const grant = grants.get(str(grantId));
    const now = finiteNow(clock);
    validGrant(grant, userId, req.intent, now, true);
    if (ledger.length >= limits.ledger) throw new PolicyError('CAPACITY_REACHED');
    if (grant.remainingUses < 1) throw new PolicyError('GRANT_EXHAUSTED');
    grant.remainingUses -= 1;
    const ticketId = id('ticket');
    req.grantId = grant.id; req.ticketId = ticketId; req.status = 'queued';
    ledger.push({ ticketId, requestId, userId, tool: req.intent.tool, action: req.intent.action, destination: req.intent.destination, resource: req.intent.resource, status: 'queued', at: now, detail: '[payload omitted]' });
    return Object.freeze({ ticketId, status: 'queued' });
  }
  function execute(ticketId, { outcome = 'succeeded' } = {}) {
    if (!['succeeded', 'failed', 'outcome_unknown'].includes(outcome)) throw new PolicyError('INVALID_OUTCOME');
    const row = ledger.find((entry) => entry.ticketId === str(ticketId));
    if (!row) throw new PolicyError('TICKET_NOT_FOUND');
    const req = requests.get(row.requestId);
    if (req.status !== 'queued') return receipt(req, row, true);
    const grant = grants.get(req.grantId);
    const now = finiteNow(clock);
    validGrant(grant, req.intent.userId, req.intent, now);
    req.status = outcome;
    row.status = outcome; row.at = now;
    row.detail = '[payload omitted]';
    return receipt(req, row, false);
  }
  function cancel(ticketId) {
    const row = ledger.find((entry) => entry.ticketId === str(ticketId));
    if (!row) throw new PolicyError('TICKET_NOT_FOUND');
    const req = requests.get(row.requestId);
    if (req.status !== 'queued') throw new PolicyError('INVALID_STATE');
    const now = finiteNow(clock);
    req.status = 'cancelled'; row.status = 'cancelled'; row.at = now; row.detail = '[payload omitted]';
    return receipt(req, row, false);
  }
  function receipt(req, row, duplicate) {
    return Object.freeze({ ticketId: row.ticketId, requestId: req.requestId, status: req.status, duplicate, receipt: Object.freeze({ status: row.status, at: row.at, action: row.action, tool: row.tool, destination: row.destination, resource: row.resource }) });
  }
  function getLedger() { return Object.freeze(ledger.map(({ detail, ...entry }) => Object.freeze({ ...entry, detail }))); }
  return Object.freeze({ mintGrant, revokeGrant, createIntent, request, authorize, execute, cancel, getLedger });
}
