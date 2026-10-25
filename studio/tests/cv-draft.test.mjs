import test from 'node:test';
import assert from 'node:assert/strict';
import { createCvDraft, CvDraftInputError, CV_DRAFT_LIMITS } from '../src/cv-draft/model.ts';

const fact = (id, section, text, confirmation = 'confirmed') => ({
  id, section, text, providedBy: 'applicant', confirmation,
});
const input = (facts = [], targetRoleRequirements) => ({
  facts,
  ...(targetRoleRequirements ? { targetRoleRequirements } : {}),
});
const expectCode = (code, action) => assert.throws(action, error => error instanceof CvDraftInputError && error.code === code);

test('keeps applicant wording verbatim and accepts ordinary code and skill names', () => {
  const profile = 'Built a C++ parser, reviewed C# examples, and used Node.js in a class project.';
  const draft = createCvDraft(input([fact('skills-1', 'skills', profile)]));
  assert.match(draft.draftText, /- Built a C\+\+ parser, reviewed C# examples, and used Node\.js in a class project\./);
  assert.deepEqual(draft.evidenceLabels, [{
    factId: 'skills-1', section: 'skills', source: 'applicant-provided',
    confirmation: 'applicant-confirmed', independentlyVerified: false,
  }]);
  assert.equal(draft.provenance.independentlyVerified, false);
  assert.equal(draft.provenance.atsScore, null);
});

test('labels practice as applicant-reported and never merges role requirements into the CV', () => {
  const draft = createCvDraft(input(
    [fact('practice-1', 'practice', 'Completed a fictional service triage exercise.')],
    { label: 'Example analyst role', requirements: ['SQL', 'Stakeholder communication'] },
  ));
  assert.match(draft.draftText, /Practice and learning \(applicant-reported\)/);
  assert.doesNotMatch(draft.draftText, /SQL|Stakeholder communication|Example analyst role/);
  assert.deepEqual(draft.targetRoleRequirements, {
    label: 'Example analyst role', requirements: ['SQL', 'Stakeholder communication'],
    source: 'applicant-supplied-not-verified', includedInDraft: false,
  });
  assert.equal(draft.provenance.targetRequirementsTreatedAsApplicantFacts, false);
});

test('omits unconfirmed facts and explains that confirmation is applicant-owned', () => {
  const draft = createCvDraft(input([fact('job-1', 'employment', 'Worked at Example Ltd', 'unconfirmed')]));
  assert.doesNotMatch(draft.draftText, /Example Ltd/);
  assert.deepEqual(draft.excludedFacts, [{ factId: 'job-1', reason: 'not-confirmed-by-applicant' }]);
  assert.match(draft.warnings.join(' '), /confirm each item/);
  assert.equal(draft.evidenceLabels.length, 0);
});

test('empty facts give actionable non-assumptive missing-information warnings', () => {
  const draft = createCvDraft(input());
  assert.equal(draft.draftText, '');
  assert.match(draft.warnings.join(' '), /Add it only if applicable, or leave the section out/);
  assert.match(draft.warnings.join(' '), /draft text is empty/);
});

test('rejects unsupported fields, origins, sections, duplicate IDs and missing confirmation', () => {
  const unknown = fact('a', 'skills', 'Excel'); unknown.privateData = 'no';
  expectCode('UNKNOWN_FIELD', () => createCvDraft(input([unknown])));
  const wrongOrigin = { ...fact('a', 'skills', 'Excel'), providedBy: 'employer' };
  expectCode('INVALID_ORIGIN', () => createCvDraft(input([wrongOrigin])));
  expectCode('INVALID_SECTION', () => createCvDraft(input([fact('a', 'grades', 'Excel')])));
  const noConfirmation = { id: 'a', section: 'skills', text: 'Excel', providedBy: 'applicant' };
  expectCode('INVALID_CONFIRMATION', () => createCvDraft(input([noConfirmation])));
  expectCode('DUPLICATE_FACT_ID', () => createCvDraft(input([fact('a', 'skills', 'Excel'), fact('a', 'skills', 'Word')])));
});

test('rejects sparse fact and target-requirement arrays instead of silently skipping entries', () => {
  const sparseFacts = new Array(2);
  sparseFacts[1] = fact('later', 'skills', 'Excel');
  expectCode('INVALID_FACTS', () => createCvDraft(input(sparseFacts)));

  const sparseRequirements = new Array(2);
  sparseRequirements[1] = 'SQL';
  expectCode('INVALID_TARGET_REQUIREMENTS', () => createCvDraft(input([], { label: 'Role', requirements: sparseRequirements })));
});

test('rejects over-counted collections before serializing nested custom hooks', () => {
  let called = false;
  const hookFact = { ...fact('x', 'skills', 'Excel'), toJSON() { called = true; return {}; } };
  const tooManyFacts = Array.from({ length: CV_DRAFT_LIMITS.facts + 1 }, () => hookFact);
  expectCode('INVALID_FACTS', () => createCvDraft(input(tooManyFacts)));
  assert.equal(called, false);

  const tooManyRequirements = Array.from({ length: CV_DRAFT_LIMITS.targetItems + 1 }, () => ({ toJSON() { called = true; return 'SQL'; } }));
  expectCode('INVALID_TARGET_REQUIREMENTS', () => createCvDraft(input([], { label: 'Role', requirements: tooManyRequirements })));
  assert.equal(called, false);
});

test('rejects markup, links, code formatting, line breaks and direction controls', () => {
  for (const [index, text] of [
    '<script>alert(1)</script>', 'text > mark', '[link](https://example.test)',
    '![image](x)', '`secret`', '**bold**', 'two\nlines', 'right-to-left \u202e text',
  ].entries()) {
    expectCode('UNSAFE_TEXT', () => createCvDraft(input([fact(`bad-${index}`, 'profile', text)])));
  }
  expectCode('UNSAFE_TEXT', () => createCvDraft(input([fact('bad-control', 'profile', 'line\u0001break')])));
});

test('bounds serialized input, individual facts, collections, target fields and complete output', () => {
  expectCode('TEXT_TOO_LONG', () => createCvDraft(input([fact('long', 'profile', 'x'.repeat(CV_DRAFT_LIMITS.factTextBytes + 1))])));
  expectCode('INVALID_FACTS', () => createCvDraft(input(Array.from({ length: CV_DRAFT_LIMITS.facts + 1 }, (_, i) => fact(`f${i}`, 'skills', 'Excel')))));
  expectCode('INVALID_TARGET_REQUIREMENTS', () => createCvDraft(input([], { label: 'Role', requirements: Array(CV_DRAFT_LIMITS.targetItems + 1).fill('SQL') })));
  const maxSizedFacts = Array.from({ length: CV_DRAFT_LIMITS.facts }, (_, i) => fact(`big${i}`, 'skills', 'x'.repeat(CV_DRAFT_LIMITS.factTextBytes)));
  const maxSizedRequirements = Array.from({ length: CV_DRAFT_LIMITS.targetItems }, () => 'r'.repeat(CV_DRAFT_LIMITS.targetTextBytes));
  expectCode('INPUT_TOO_LARGE', () => createCvDraft(input(maxSizedFacts, { label: 'Role', requirements: maxSizedRequirements })));

  const manyFacts = Array.from({ length: 72 }, (_, i) => fact(`f${i}`, 'skills', `x${i}`.padEnd(1200, 'x')));
  const manyRequirements = Array.from({ length: 24 }, (_, i) => `r${i}`.padEnd(1500, 'r'));
  expectCode('OUTPUT_TOO_LARGE', () => createCvDraft(input(manyFacts, { label: 'Role', requirements: manyRequirements })));
});

test('rejects overlong ASCII before allocating UTF-8 encoded bytes', () => {
  const OriginalEncoder = globalThis.TextEncoder;
  globalThis.TextEncoder = class extends OriginalEncoder {
    encode(value, ...rest) {
      if (value.length > CV_DRAFT_LIMITS.factTextBytes) throw new Error('unexpected large encode');
      return super.encode(value, ...rest);
    }
  };
  try {
    expectCode('TEXT_TOO_LONG', () => createCvDraft(input([
      fact('large', 'profile', 'x'.repeat(CV_DRAFT_LIMITS.factTextBytes + 1)),
    ])));
  } finally {
    globalThis.TextEncoder = OriginalEncoder;
  }
});
