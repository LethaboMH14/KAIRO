/**
 * Isolated, unmounted pump-local-work partition prerequisite.
 * IMPORTANT: A trusted authenticated caller must fetch/verify current source status.
 * This module cannot prove account ownership or source review from client JSON.
 */
const ID = /^[a-f0-9]{24}$/;
const REVISION = /^[a-f0-9]{64}$/;
const minted = new WeakSet();
const PREFIX = 'kairo-pump-context-v2:';
const SESSION_SCHEMA = 'kairo-pump-lab-session/1';
const REPORT_SCHEMA = 'kairo-pump-lab-report/1';
const EVIDENCE_SCHEMA = 'kairo-evidence-item/pump-lab-draft-1';
const LOCAL_STATUS = 'local self-directed simulation, unverified';
export const MAX_SNAPSHOT_BYTES = 80_000;
export const MAX_EVIDENCE_BYTES = 80_000;
const size = value => new TextEncoder().encode(value).length;
const own = (value, name) => value && Object.hasOwn(value, name);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function mint(kind, id = null, revision = null) {
  const key = kind === 'standalone' ? 'standalone' : `${kind}:${id}:${revision}`;
  const value = Object.freeze({ kind, id, revision, key });
  minted.add(value);
  return value;
}

/** Unlinked practice remains separate from every lesson and bundle. */
export function standaloneContext() { return mint('standalone'); }

/**
 * Caller must supply a TRUSTED authenticated GET/verification adapter, not URL
 * metadata or an unvalidated client object. The callback MUST fail closed on
 * owner mismatch, revoked review, revision drift and inaccessible source(s).
 * No linked context can be constructed from a URL-supplied revision.
 */
export async function resolveLinkedContext(kind, id, fetchVerified) {
  if (!['v1', 'v2'].includes(kind) || !ID.test(id || '') || typeof fetchVerified !== 'function') {
    return { status: 'detached', reason: 'Invalid lesson link. Start unlinked practice or return to your lesson.', context: null };
  }
  try {
    const record = await fetchVerified({ kind, id });
    if (!object(record) || record.id !== id || !REVISION.test(record.revision || '') ||
        record.reviewedCurrent !== true || record.ownerAccessible !== true ||
        (record.kind !== undefined && record.kind !== kind)) {
      return { status: 'detached', reason: 'The reviewed lesson or bundle could not be verified. Earlier local work was kept separately.', context: null };
    }
    return { status: 'linked', context: mint(kind, id, record.revision) };
  } catch {
    return { status: 'detached', reason: 'The lesson or bundle is unavailable. Try again, or continue as unlinked practice.', context: null };
  }
}

function keys(context) {
  if (!minted.has(context)) throw new TypeError('A resolved pump context is required.');
  return { snapshot: `${PREFIX}${context.key}:snapshot`, evidence: `${PREFIX}${context.key}:evidence` };
}
export function contextStorageKeys(context) { return Object.freeze(keys(context)); }

function checkedState(snapshot, replay) {
  if (typeof snapshot !== 'string' || size(snapshot) > MAX_SNAPSHOT_BYTES || typeof replay !== 'function') return null;
  try {
    const state = replay(snapshot);
    if (!object(state) || state.schema !== SESSION_SCHEMA ||
        typeof state.sessionId !== 'string' || !state.sessionId.trim() || state.sessionId.length > 100 ||
        typeof state.model !== 'string' || !state.model || state.model.length > 100) return null;
    return state;
  } catch { return null; }
}

/** Never deletes or migrates a malformed/legacy snapshot. */
export function readSnapshot(storage, context, replay) {
  const key = keys(context).snapshot;
  let raw;
  try { raw = storage.getItem(key); } catch { return { status: 'unavailable', reason: 'Local storage is unavailable. Export this run before leaving.' }; }
  if (raw === null) return { status: 'empty' };
  if (typeof raw !== 'string' || size(raw) > MAX_SNAPSHOT_BYTES + 1024) return { status: 'blocked', reason: 'Saved pump work is too large. It was left unchanged.' };
  try {
    const value = JSON.parse(raw);
    if (!object(value) || value.version !== 2 || value.contextKey !== context.key ||
        typeof value.snapshot !== 'string' || !own(value, 'sessionId') || !own(value, 'modelVersion')) throw Error();
    const state = checkedState(value.snapshot, replay);
    if (!state || state.sessionId !== value.sessionId || state.model !== value.modelVersion) throw Error();
    return { status: 'restored', snapshot: value.snapshot, sessionId: state.sessionId, modelVersion: state.model };
  } catch { return { status: 'blocked', reason: 'Saved pump work failed replay or context checks. It was left unchanged.' }; }
}

export function saveSnapshot(storage, context, snapshot, replay) {
  const key = keys(context).snapshot;
  const state = checkedState(snapshot, replay);
  if (!state) return { status: 'blocked', reason: 'Pump work did not pass deterministic replay validation; nothing was overwritten.' };
  const raw = JSON.stringify({ version: 2, contextKey: context.key, sessionId: state.sessionId, modelVersion: state.model, snapshot });
  if (size(raw) > MAX_SNAPSHOT_BYTES + 1024) return { status: 'blocked', reason: 'Pump work is too large for this local record.' };
  try { storage.setItem(key, raw); return { status: 'saved', sessionId: state.sessionId }; }
  catch { return { status: 'unavailable', reason: 'Local storage could not save. Export this run before leaving.' }; }
}

function validEvidence(entry, context) {
  if (!object(entry) || entry.contextKey !== context.key || entry.status !== 'local-unverified' ||
      !object(entry.report) || entry.report.schema !== REPORT_SCHEMA || entry.report.status !== LOCAL_STATUS ||
      !object(entry.report.model) || !object(entry.item) || entry.item.schema !== EVIDENCE_SCHEMA ||
      entry.item.label !== LOCAL_STATUS || !object(entry.item.provenance) || entry.item.provenance.simulated !== true ||
      entry.item.events?.competencyExternallyVerified !== false ||
      entry.item.provenance.sessionId !== entry.report.model.sessionId ||
      entry.item.provenance.modelVersion !== entry.report.model.version ||
      entry.sessionId !== entry.report.model.sessionId || entry.modelVersion !== entry.report.model.version ||
      typeof entry.completedAt !== 'string' || !Number.isFinite(Date.parse(entry.completedAt))) return false;
  return true;
}

export function readEvidence(storage, context) {
  const key = keys(context).evidence;
  let raw;
  try { raw = storage.getItem(key); } catch { return { status: 'unavailable', reason: 'Local evidence storage is unavailable.' }; }
  if (raw === null) return { status: 'empty', entries: [] };
  if (typeof raw !== 'string' || size(raw) > MAX_EVIDENCE_BYTES) return { status: 'blocked', reason: 'Saved local evidence is oversized and was kept unchanged.' };
  try {
    const data = JSON.parse(raw);
    if (!object(data) || data.version !== 2 || data.contextKey !== context.key ||
        !Array.isArray(data.entries) || data.entries.length > 5 ||
        !data.entries.every(e => validEvidence(e, context))) throw Error();
    return { status: 'restored', entries: data.entries };
  } catch { return { status: 'blocked', reason: 'Saved local evidence failed provenance checks and was kept unchanged.' }; }
}

/** Evidence may be written only against the replay-verified CURRENT local snapshot. */
export function appendEvidence(storage, context, item, report, replay, completedAt) {
  const current = readSnapshot(storage, context, replay);
  if (current.status !== 'restored') return { status: 'blocked', reason: 'Save a replay-verified pump session in this lesson before keeping evidence.' };
  const entry = { contextKey: context.key, status: 'local-unverified', sessionId: current.sessionId,
    modelVersion: current.modelVersion, completedAt, item, report };
  if (!validEvidence(entry, context) || current.sessionId !== report.model.sessionId ||
      current.modelVersion !== report.model.version) return { status: 'blocked', reason: 'Evidence does not match the current pump session and model.' };
  const old = readEvidence(storage, context);
  if (!['empty', 'restored'].includes(old.status)) return { status: 'blocked', reason: 'Existing evidence could not be verified and was kept unchanged.' };
  const entries = [...old.entries, entry].slice(-5);
  const raw = JSON.stringify({ version: 2, contextKey: context.key, entries });
  if (size(raw) > MAX_EVIDENCE_BYTES) return { status: 'blocked', reason: 'Evidence is too large. Export it before leaving.' };
  try { storage.setItem(keys(context).evidence, raw); return { status: 'saved', count: entries.length }; }
  catch { return { status: 'unavailable', reason: 'Evidence could not be saved locally. Export the report.' }; }
}
