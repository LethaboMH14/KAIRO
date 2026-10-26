import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateLanguageCases} from './index.mjs';
const fixture = () => JSON.parse(readFileSync(new URL('./cases.json', import.meta.url), 'utf8'));
test('seven proposed cases validate without establishing accuracy or completed review', () => {
 const data = fixture(); assert.equal(data.cases.length, 7);
 assert(data.cases.every(c => c.evidenceStatus === 'not-run'));
 assert.deepEqual(validateLanguageCases(data), {valid:true,errors:[],establishesAccuracy:false});
});
test('rejects malformed envelopes, duplicate IDs, unknown fields and empty checks', () => {
 for (const data of [null, [], {}, {schemaVersion:2,cases:[]}]) assert.equal(validateLanguageCases(data).valid,false);
 for (const mutate of [d=>d.cases.push(d.cases[0]),d=>d.cases[0].unexpected=true,d=>d.cases[0].acceptanceChecks=[],d=>d.cases[0].languageTag='invented']) {
  const data=fixture();mutate(data);assert.equal(validateLanguageCases(data).valid,false);
 }
});
test('language and SASL quality cannot bypass human review', () => {
 for (const mutate of [d=>d.cases[0].reviewerRequired=false,d=>d.cases[6].sourceType='text',d=>d.cases[6].task='listening']) {
  const data=fixture();mutate(data);assert.equal(validateLanguageCases(data).valid,false);
 }
});
test('review status requires dated evidence and forbids fictional completed reviews in not-run cases', () => {
 const data=fixture();data.cases[0].evidenceStatus='reviewed';assert.equal(validateLanguageCases(data).valid,false);
 data.cases[0].reviewEvidence={artifact:'synthetic-test-only.json',reviewerRole:'synthetic test role',reviewedAt:'2026-02-30T00:00:00.000Z'};
 assert.equal(validateLanguageCases(data).valid,false);
 data.cases[0].reviewEvidence.reviewedAt='2026-10-25T00:00:00.000Z';assert.equal(validateLanguageCases(data).valid,true);
 data.cases[0].evidenceStatus='not-run';assert.equal(validateLanguageCases(data).valid,false);
});
test('bounds cases and strings and never mutates a manifest', () => {
 const data=fixture(),before=JSON.stringify(data);validateLanguageCases(data);assert.equal(JSON.stringify(data),before);
 data.cases[0].expectedCapabilities=['x'.repeat(1001)];assert.equal(validateLanguageCases(data).valid,false);
 assert.equal(validateLanguageCases({schemaVersion:1,cases:Array(101).fill(fixture().cases[0])}).valid,false);
});
test('SASL reviewed metadata requires the explicit reviewer qualification declaration', () => {
 const data=fixture(),sign=data.cases[6];sign.evidenceStatus='reviewed';
 sign.reviewEvidence={artifact:'synthetic-review-fixture.json',reviewerRole:'generic reviewer',reviewedAt:'2026-10-25T00:00:00.000Z'};
 assert.equal(validateLanguageCases(data).valid,false);
 sign.reviewEvidence.reviewerRole='qualified-sasl-reviewer';
 assert.equal(validateLanguageCases(data).valid,true);
 assert.equal(validateLanguageCases(data).establishesAccuracy,false);
});
