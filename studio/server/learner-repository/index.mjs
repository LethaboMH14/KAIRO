import { createHash, randomUUID } from 'node:crypto';

const KINDS = new Set(['sources', 'revisions', 'lessons', 'drafts', 'jobs', 'progress']);
const ID = /^[a-zA-Z0-9_-]{1,96}$/;
const MAX_RECORD_BYTES = 220 * 1024;
const MAX_BLOB_BYTES = 8 * 1024 * 1024;

function badRequest() {
  const error = new Error('Invalid learner record request');
  error.status = 400;
  return error;
}

function conflict() {
  const error = new Error('Learner record version conflict');
  error.status = 409;
  return error;
}

function ownerKey(uid) {
  if (typeof uid !== 'string' || uid.length < 1 || uid.length > 128 || !uid.trim() || /[\u0000-\u001f\u007f]/.test(uid)) throw badRequest();
  return createHash('sha256').update(uid, 'utf8').digest('hex');
}

function recordId(value) {
  if (typeof value !== 'string' || !ID.test(value)) throw badRequest();
  return value;
}

function kindName(value) {
  if (!KINDS.has(value)) throw badRequest();
  return value;
}

function encodeValue(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw badRequest();
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw badRequest();
  let encoded;
  try {
    encoded = JSON.stringify(value);
    if (encoded === undefined) throw badRequest();
  } catch {
    throw badRequest();
  }
  if (Buffer.byteLength(encoded, 'utf8') > MAX_RECORD_BYTES) throw badRequest();
  return JSON.parse(encoded);
}

function unpack(snapshot, owner, kind, id) {
  if (!snapshot?.exists) return null;
  const data = snapshot.data();
  if (!data || data.ownerKey !== owner || data.kind !== kind || data.id !== id ||
      typeof data.version !== 'string' || !data.version || !Object.hasOwn(data, 'value')) {
    throw new Error('Stored learner record failed identity validation');
  }
  let value;
  try { value = encodeValue(data.value); } catch { throw new Error('Stored learner record failed payload validation'); }
  return { id, value, version: data.version };
}

function blobPath(owner, id) {
  return `owners/${owner}/originals/${id}`;
}

function missingBlob(error) {
  return error?.code === 404 || error?.code === '404' || error?.code === 'storage/object-not-found';
}

/** Create an owner-scoped repository over already-initialized Firebase Admin adapters. */
export function createLearnerRepository({ firestore, bucket } = {}) {
  if (!firestore || typeof firestore.collection !== 'function' ||
      !bucket || typeof bucket.file !== 'function') {
    throw new TypeError('Firebase Admin Firestore and Storage bucket adapters are required');
  }

  function refFor(owner, kind, id) {
    return firestore.collection('owners').doc(owner).collection(kind).doc(id);
  }

  async function get(uid, kind, id) {
    const owner = ownerKey(uid);
    kind = kindName(kind);
    id = recordId(id);
    return unpack(await refFor(owner, kind, id).get(), owner, kind, id);
  }

  async function list(uid, kind, { limit = 100 } = {}) {
    const owner = ownerKey(uid);
    kind = kindName(kind);
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw badRequest();
    const result = await firestore.collection('owners').doc(owner).collection(kind).limit(limit).get();
    return result.docs.map((snapshot) => {
      const id = recordId(snapshot.id);
      return unpack(snapshot, owner, kind, id);
    }).filter(Boolean);
  }

  async function put(uid, kind, id, value, { version, create = false } = {}) {
    const owner = ownerKey(uid);
    kind = kindName(kind);
    id = recordId(id);
    const safeValue = encodeValue(value);
    if (typeof create !== 'boolean' || (create ? version !== undefined : typeof version !== 'string' || !version)) {
      throw badRequest();
    }
    const ref = refFor(owner, kind, id);
    const nextVersion = randomUUID();
    await firestore.runTransaction(async (transaction) => {
      const current = await transaction.get(ref);
      if (create ? current.exists : !current.exists || unpack(current, owner, kind, id).version !== version) {
        throw conflict();
      }
      transaction.set(ref, { ownerKey: owner, kind, id, value: safeValue, version: nextVersion });
    });
    return { id, value: safeValue, version: nextVersion };
  }

  async function remove(uid, kind, id, { version } = {}) {
    const owner = ownerKey(uid);
    kind = kindName(kind);
    id = recordId(id);
    if (typeof version !== 'string' || !version) throw badRequest();
    const ref = refFor(owner, kind, id);
    let removed = false;
    await firestore.runTransaction(async (transaction) => {
      const current = await transaction.get(ref);
      if (!current.exists) return;
      if (unpack(current, owner, kind, id).version !== version) throw conflict();
      transaction.delete(ref);
      removed = true;
    });
    return { removed };
  }

  async function putBlob(uid, id, bytes, { contentType = 'application/octet-stream' } = {}) {
    const owner = ownerKey(uid);
    id = recordId(id);
    if (!(Buffer.isBuffer(bytes) || bytes instanceof Uint8Array) || bytes.byteLength === 0 ||
        bytes.byteLength > MAX_BLOB_BYTES || typeof contentType !== 'string' ||
        !contentType.trim() || contentType.length > 255) throw badRequest();
    const body = Buffer.from(bytes);
    const sha256 = createHash('sha256').update(body).digest('hex');
    const file = bucket.file(blobPath(owner, id));
    await file.save(body, {
      resumable: false,
      preconditionOpts: { ifGenerationMatch: 0 },
      metadata: { contentType, metadata: { ownerKey: owner, id, sha256, bytes: String(body.length) } },
    });
    return { id, sha256, bytes: body.length, contentType };
  }

  async function getBlob(uid, id) {
    const owner = ownerKey(uid);
    id = recordId(id);
    const file = bucket.file(blobPath(owner, id));
    let metadata;
    let body;
    try {
      [metadata] = await file.getMetadata();
      [body] = await file.download();
    } catch (error) {
      if (missingBlob(error)) return null;
      throw error;
    }
    const custom = metadata?.metadata;
    if (custom?.ownerKey !== owner || custom?.id !== id || !Buffer.isBuffer(body) ||
        !/^[a-f0-9]{64}$/.test(custom.sha256 ?? '') || Number(custom.bytes) !== body.length ||
        body.length === 0 || body.length > MAX_BLOB_BYTES ||
        createHash('sha256').update(body).digest('hex') !== custom.sha256) {
      throw new Error('Stored learner blob failed integrity validation');
    }
    return body;
  }

  async function removeBlob(uid, id) {
    const owner = ownerKey(uid);
    id = recordId(id);
    try {
      await bucket.file(blobPath(owner, id)).delete();
      return { removed: true };
    } catch (error) {
      if (missingBlob(error)) return { removed: false };
      throw error;
    }
  }

  return Object.freeze({ get, list, put, remove, putBlob, getBlob, removeBlob });
}
