import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRegistry } from '../../tools/product-proof-validator/validate.mjs';

const SHA = 'a'.repeat(40);
const source = { issuer: 'Public reference', url: 'https://example.org/reference', publishedDate: '2026-01-01', checkedDate: '2026-10-25' };
const base = () => ({ claimId: 'CLAIM-001', statement: 'A proposed source-linked task', userJob: 'Check a lesson against a source', status: 'proposed', publication: 'draft', claimClass: 'technical', authorSession: 'author-a', judgingCriteria: ['Product', 'Intelligence'], sources: [], evidence: [] });
const check = (claim, headSha) => validateRegistry({ claims: [claim] }, { headSha });
const ci = () => ({ kind: 'ci', commit: SHA, runUrl: 'https://github.com/LethaboMH14/KAIRO/actions/runs/1', outcome: 'passed' });
const review = () => ({ kind: 'review', reviewerSession: 'reviewer-b', reviewUrl: 'https://github.com/LethaboMH14/KAIRO/pull/1' });

test('proposed synthetic record is valid but makes no success claim', () => assert.deepEqual(check(base()), []));
test('public technical claim needs current CI and independent review', () => { const c=base(); c.publication='public'; c.sources=[source]; assert.match(check(c, SHA).join(' '), /exact-head CI/); });
test('valid structural technical evidence is not misreported as externally verified', () => { const c=base(); c.publication='public'; c.status='independent-reviewed'; c.sources=[source]; c.evidence=[ci(),review()]; assert.deepEqual(check(c,SHA),[]); });
test('rejects stale CI commit', () => { const c=base(); c.publication='public'; c.sources=[source]; c.evidence=[ci(),review()]; assert.match(check(c,'b'.repeat(40)).join(' '), /stale CI SHA/); });
test('rejects same-session review', () => { const c=base(); c.publication='public'; c.sources=[source]; c.evidence=[ci(),{...review(),reviewerSession:'author-a'}]; assert.match(check(c,SHA).join(' '), /independent reviewer session/); });
test('rejects numerical claims without denominator and method', () => { const c=base(); c.quantitative={value:86.5,unit:'percent'}; assert.match(check(c).join(' '), /positive denominator/); });
test('rejects invalid source dates', () => { const c=base(); c.sources=[{...source,publishedDate:'2026-02-30'}]; assert.match(check(c).join(' '), /publishedDate/); });
test('rejects synthetic-only public claims', () => { const c=base(); c.publication='public'; c.sources=[source]; c.evidence=[{kind:'synthetic'}]; assert.match(check(c,SHA).join(' '), /synthetic-only/); });
test('requires real device evidence for public UX claims', () => { const c=base(); c.publication='public'; c.claimClass='user-experience'; c.sources=[source]; c.evidence=[ci(),review()]; assert.match(check(c,SHA).join(' '), /device evidence/); });
test('requires real observation for measured outcomes', () => { const c=base(); c.publication='public'; c.claimClass='measured-outcome'; c.sources=[source]; c.evidence=[{kind:'research',issuer:'Reference',url:source.url,checkedDate:'2026-10-25'}]; assert.match(check(c,SHA).join(' '), /real consent-safe observation/); });
test('detects duplicate IDs and secret-shaped strings', () => { const c=base(); const duplicate={...base(),statement:'sk-'+'x'.repeat(25)}; const errors=validateRegistry({claims:[c,duplicate]}); assert.match(errors.join(' '), /duplicate identifier/); assert.match(errors.join(' '), /possible secret/); });
test('fails closed on malformed registry', () => assert.match(validateRegistry({claims:null}).join(' '), /expected array/));
test('unverified status cannot be promoted as public factual success', () => { const c=base(); c.publication='public'; c.sources=[source]; c.evidence=[ci(),review()]; assert.match(check(c,SHA).join(' '), /unverified\/withdrawn state/); });
test('percentage claims require explicit denominator and method', () => { const c=base(); c.publication='public'; c.status='independent-reviewed'; c.statement='86.5% top-three accuracy'; c.sources=[source]; c.evidence=[ci(),review()]; assert.match(check(c,SHA).join(' '), /numerical public claim/); });
