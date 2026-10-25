/**
 * Read-only server-side consistency audit for the EXISTING KAIRO pump lab.
 *
 * This verifies a local draft against a deterministic replay. It does not verify
 * who performed actions, ownership of a source, lesson revision, or competence.
 * Never persist a verified grade based on this function alone.
 */
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { restore, serialize, SESSION_SCHEMA } from '../../src/pump-lab/session.ts';
import { toEvidenceItem } from '../../src/pump-lab/report.ts';

export const REPLAY_AUDIT_VERSION = 'kairo-pump-replay-audit/1';
export const MAX_SNAPSHOT_BYTES = 200_000;
export const MAX_EVIDENCE_BYTES = 65_536;

const ACTION_KEYS = Object.freeze({
  'set-settings': ['type', 'speedRpm', 'valvePct'],
  predict: ['type', 'flowLps'],
  'run-transfer': ['type', 'seconds'],
  'take-reading': ['type'],
  'inspect-section': ['type', 'readingId', 'section'],
  'inspect-part': ['type', 'part'],
  compare: ['type', 'a', 'b'],
  'show-hint': ['type', 'level'],
  'submit-explanation': ['type', 'cause', 'evidenceIds', 'note'],
  'apply-repair': ['type', 'repair'],
  'complete-case': ['type'],
});

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const exactKeys = (value, keys) => isRecord(value) &&
  Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const denied = code => ({
  replayConsistent: false, status: 'rejected', code,
  serverVerified: false, ownerVerified: false, sourceRevisionVerified: false,
  competencyExternallyVerified: false, publishable: false,
});

/**
 * @param {{snapshot: unknown, evidence: unknown, expectedSessionId: unknown}} input
 * expectedSessionId must be supplied from a separately trusted session binding,
 * never copied from an untrusted snapshot. Even a matching value is NOT identity
 * authentication; an authenticated server route must enforce owner/lesson/source.
 */
export function auditPumpDraft(input) {
  if (!isRecord(input)) return denied('invalid-input');
  const { snapshot, evidence, expectedSessionId } = input;
  if (typeof expectedSessionId !== 'string' || !expectedSessionId.trim()
      || expectedSessionId.length > 100) return denied('missing-trusted-session');
  if (typeof snapshot !== 'string' || Buffer.byteLength(snapshot, 'utf8') > MAX_SNAPSHOT_BYTES) {
    return denied('invalid-snapshot-size');
  }
  if (!isRecord(evidence)) return denied('invalid-evidence');
  try {
    const evidenceBytes = JSON.stringify(evidence);
    if (!evidenceBytes || Buffer.byteLength(evidenceBytes, 'utf8') > MAX_EVIDENCE_BYTES) {
      return denied('invalid-evidence-size');
    }

    const raw = JSON.parse(snapshot);
    if (!exactKeys(raw, ['schema', 'sessionId', 'seed', 'caseId', 'actions'])
        || raw.schema !== SESSION_SCHEMA || !Array.isArray(raw.actions)) {
      return denied('invalid-snapshot-shape');
    }
    // Fail closed on injected metadata and unrecognized action fields, even if
    // the underlying replay engine would ignore them.
    for (const entry of raw.actions) {
      if (!exactKeys(entry, ['action', 'at']) || !isRecord(entry.action)) {
        return denied('invalid-action-shape');
      }
      const keys = ACTION_KEYS[entry.action.type];
      if (!keys || !exactKeys(entry.action, keys)) return denied('invalid-action-shape');
    }
    const state = restore(snapshot);
    if (!state || serialize(state) !== snapshot) return denied('invalid-replay');
    if (state.sessionId !== expectedSessionId) return denied('session-mismatch');

    const recomputed = toEvidenceItem(state);
    if (!isDeepStrictEqual(evidence, recomputed)) return denied('evidence-mismatch');
    const sha256 = createHash('sha256').update(snapshot, 'utf8').digest('hex');
    return {
      replayConsistent: true,
      status: 'replayed-local-draft-only',
      auditVersion: REPLAY_AUDIT_VERSION,
      caseId: state.caseId,
      modelVersion: state.model,
      rubricVersion: recomputed.rubricVersion,
      actionCount: state.actions.length,
      actionLogSha256: sha256,
      illustrativeCaseCompleted: state.completed !== null,
      assistanceLevel: recomputed.assistanceUsed.level,
      serverVerified: false,
      ownerVerified: false,
      sourceRevisionVerified: false,
      competencyExternallyVerified: false,
      publishable: false,
      warning: 'Deterministic replay only. The model is illustrative; learner identity, source ownership and competency are not verified.',
    };
  } catch {
    // No exception text or raw learner actions/notes may leave this boundary.
    return denied('invalid-input-data');
  }
}
