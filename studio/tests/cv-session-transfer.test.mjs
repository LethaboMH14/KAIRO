import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCvSessionFile,
  parseCvSessionFile,
  CV_SESSION_TRANSFER_LIMITS,
} from '../src/cv-session-transfer/index.ts';
import { createCvDraft, CvDraftInputError } from '../src/cv-draft/model.ts';

const fact = (id, section, text, confirmation = 'confirmed') => ({
  id, section, text, providedBy: 'applicant', confirmation,
});
const expectCode = (code, action) => assert.throws(action, error => error instanceof CvDraftInputError && error.code === code);

test('round-trips confirmed and unconfirmed facts and role notes as editable data', () => {
  const input = {
    facts: [fact('profile-1', 'profile', 'Learner-provided profile'), fact('skills-1', 'skills', 'Excel', 'unconfirmed')],
    targetRoleRequirements: { label: 'Analyst', requirements: ['Excel', 'Careful reporting'] },
  };
  const output = parseCvSessionFile(createCvSessionFile(input));
  assert.deepEqual(output, input);
  assert.notEqual(output, input);
  assert.notEqual(output.facts, input.facts);
  assert.notEqual(output.facts[0], input.facts[0]);
  assert.notEqual(output.targetRoleRequirements, input.targetRoleRequirements);
});

test('round-trips empty sessions and omits absent role notes', () => {
  assert.deepEqual(parseCvSessionFile(createCvSessionFile({ facts: [] })), { facts: [] });
});

test('emits only the exact versioned envelope and documented session fields', () => {
  const json = createCvSessionFile({ facts: [fact('x', 'practice', 'Completed a practice task', 'unconfirmed')] });
  assert.deepEqual(JSON.parse(json), {
    format: 'kairo-cv-session', version: 1,
    session: { facts: [fact('x', 'practice', 'Completed a practice task', 'unconfirmed')] },
  });
});

test('rejects malformed JSON, wrong roots, envelope fields and unsupported versions', () => {
  expectCode('INVALID_SESSION_JSON', () => parseCvSessionFile('{'));
  expectCode('INVALID_SESSION_OBJECT', () => parseCvSessionFile('[]'));
  expectCode('UNSUPPORTED_SESSION_VERSION', () => parseCvSessionFile('{"format":"other","version":1,"session":{"facts":[]}}'));
  expectCode('UNSUPPORTED_SESSION_VERSION', () => parseCvSessionFile('{"format":"kairo-cv-session","version":2,"session":{"facts":[]}}'));
  expectCode('INVALID_SESSION_FIELD', () => parseCvSessionFile('{"format":"kairo-cv-session","version":1,"session":{"facts":[]},"extra":true}'));
  expectCode('INVALID_SESSION_FIELD', () => parseCvSessionFile('{"format":"kairo-cv-session","version":1,"session":{"facts":[],"extra":true}}'));
});

test('rejects wrong types and invalid model fields without coercion', () => {
  expectCode('INVALID_SESSION_ARRAY', () => parseCvSessionFile('{"format":"kairo-cv-session","version":1,"session":{"facts":{}}}'));
  expectCode('INVALID_FACT_ID', () => parseCvSessionFile(JSON.stringify({ format: 'kairo-cv-session', version: 1, session: { facts: [fact(3, 'skills', 'Excel')] } })));
  expectCode('INVALID_CONFIRMATION', () => parseCvSessionFile(JSON.stringify({ format: 'kairo-cv-session', version: 1, session: { facts: [fact('x', 'skills', 'Excel', true)] } })));
  expectCode('INVALID_SESSION_ARRAY', () => parseCvSessionFile('{"format":"kairo-cv-session","version":1,"session":{"facts":[],"targetRoleRequirements":{"label":"Role","requirements":"SQL"}}}'));
});

test('rejects unknown fields at every nested level and prototype pollution keys', () => {
  for (const json of [
    '{"format":"kairo-cv-session","version":1,"session":{"facts":[{"id":"x","section":"skills","text":"Excel","providedBy":"applicant","confirmation":"confirmed","extra":1}]}}',
    '{"format":"kairo-cv-session","version":1,"session":{"facts":[],"targetRoleRequirements":{"label":"Role","requirements":[],"extra":1}}}',
    '{"format":"kairo-cv-session","version":1,"session":{"facts":[],"__proto__":{"polluted":true}}}',
  ]) expectCode('INVALID_SESSION_FIELD', () => parseCvSessionFile(json));
});

test('bounds characters and UTF-8 bytes before attempting JSON parsing', () => {
  expectCode('SESSION_TOO_LARGE', () => parseCvSessionFile('{'.padEnd(CV_SESSION_TRANSFER_LIMITS.fileBytes + 1, 'x')));
  const multibyte = 'é'.repeat(Math.ceil(CV_SESSION_TRANSFER_LIMITS.fileBytes / 2) + 1);
  expectCode('SESSION_TOO_LARGE', () => parseCvSessionFile(multibyte));
});

test('includes the envelope in the file-size limit and rejects an oversized export', () => {
  const input = { facts: [fact('x', 'profile', 'x'.repeat(1200))] };
  const json = createCvSessionFile(input);
  assert.ok(Buffer.byteLength(json, 'utf8') <= CV_SESSION_TRANSFER_LIMITS.fileBytes);
  const facts = Array.from({ length: 80 }, (_, index) => fact(`f${index}`, 'profile', 'x'.repeat(1200), 'unconfirmed'));
  let wrapperOnlyOversize;
  for (let length = 900; length >= 600; length--) {
    const candidate = { facts, targetRoleRequirements: { label: 'Role', requirements: Array(40).fill('r'.repeat(length)) } };
    try {
      createCvDraft(candidate);
      try { createCvSessionFile(candidate); } catch (error) {
        if (error.code === 'SESSION_TOO_LARGE') { wrapperOnlyOversize = candidate; break; }
        throw error;
      }
    } catch (error) {
      if (!(error instanceof CvDraftInputError) || error.code !== 'INPUT_TOO_LARGE') throw error;
    }
  }
  assert.ok(wrapperOnlyOversize, 'finds a model-valid input whose envelope exceeds the file limit');
  expectCode('SESSION_TOO_LARGE', () => createCvSessionFile(wrapperOnlyOversize));
});

test('copies caller data without invoking accessors or custom serialization hooks', () => {
  let called = false;
  const getterFact = fact('x', 'skills', 'Excel');
  Object.defineProperty(getterFact, 'text', { enumerable: true, get() { called = true; return 'Excel'; } });
  expectCode('INVALID_SESSION_OBJECT', () => createCvSessionFile({ facts: [getterFact] }));
  const hookFact = { ...fact('x', 'skills', 'Excel'), toJSON() { called = true; return {}; } };
  expectCode('INVALID_SESSION_FIELD', () => createCvSessionFile({ facts: [hookFact] }));
  assert.equal(called, false);
});

test('does not mutate the supplied session or its nested values', () => {
  const input = { facts: [fact('x', 'skills', 'Excel', 'unconfirmed')], targetRoleRequirements: { label: 'Role', requirements: ['SQL'] } };
  const before = structuredClone(input);
  createCvSessionFile(input);
  assert.deepEqual(input, before);
  assert.deepEqual(parseCvSessionFile(createCvSessionFile(input)), before);
});
