import test from 'node:test';
import assert from 'node:assert/strict';
import { ReferenceError, canOpenSource, createSourceCard, getSourceFreshness, parseYouTubeEmbed, validateOutwardReferenceUrl } from '../server/reference-core/references.mjs';

const err = (code) => (error) => error instanceof ReferenceError && error.code === code;
const card = (overrides = {}) => createSourceCard({ title: 'Reference', summary: 'A short source summary', originalUrl: 'https://example.org/article', provider: 'web', checkedAt: '2026-10-22T00:00:00.000Z', expiresAt: '2026-10-23T00:00:00.000Z', eligibility: 'unknown', ...overrides });

test('builds privacy-enhanced YouTube embeds from allowlisted canonical public URLs', () => {
  const normal = parseYouTubeEmbed('https://www.youtube.com/watch?v=abcdefghijk');
  assert.equal(normal.embedUrl, 'https://www.youtube-nocookie.com/embed/abcdefghijk');
  assert.equal(normal.autoplay, false);
  const short = parseYouTubeEmbed('https://youtu.be/abcdefghijk?t=37');
  assert.equal(short.embedUrl, 'https://www.youtube-nocookie.com/embed/abcdefghijk?start=37');
  assert.equal(short.startSeconds, 37);
});

test('rejects unsafe schemes, credentials, fragments, host confusion and noncanonical YouTube variants', () => {
  for (const url of ['javascript:alert(1)', 'http://www.youtube.com/watch?v=abcdefghijk', 'https://user@youtube.com/watch?v=abcdefghijk', 'https://youtube.com.evil.test/watch?v=abcdefghijk', 'https://youtube.com/watch?v=abcdefghijk&autoplay=1', 'https://youtube.com/watch?v=abcdefghijk&v=zyxwvutsrq1', 'https://youtube.com/watch?v=abcdefghijk#fragment', 'https://youtube.com/embed/abcdefghijk', 'https://youtu.be/abcdefghijk/extra']) {
    assert.throws(() => parseYouTubeEmbed(url));
  }
  for (const start of ['-1', '1.5', '604801', '99999999', '1m20s']) assert.throws(() => parseYouTubeEmbed(`https://youtu.be/abcdefghijk?t=${encodeURIComponent(start)}`));
});

test('rejects arbitrary iframe markup and non-allowlisted providers by construction', () => {
  assert.throws(() => parseYouTubeEmbed('<iframe src="https://youtube.com/embed/abcdefghijk"></iframe>'));
  assert.throws(() => parseYouTubeEmbed('https://youtube-nocookie.com/embed/abcdefghijk'));
});

test('outward URL validation rejects local/private hosts and unsafe URL forms', () => {
  for (const url of ['http://example.org', 'https://localhost/a', 'https://foo.local/a', 'https://service.internal/a', 'https://127.0.0.1/a', 'https://[::1]/a', 'https://user:pass@example.org/a', 'file:///etc/passwd', 'https://example.org:8443/a', 'https://example.org:443/a', 'https://example.org\\@evil.test/a', 'https://example.org/a#x']) {
    assert.throws(() => validateOutwardReferenceUrl(url));
  }
  assert.equal(validateOutwardReferenceUrl('https://docs.example.org/guide'), 'https://docs.example.org/guide');
});

test('source cards require exact metadata and keep eligibility unknown', () => {
  const value = card();
  assert.equal(value.eligibility, 'unknown');
  assert.throws(() => card({ eligibility: 'eligible' }), err('INVALID_ELIGIBILITY'));
  assert.throws(() => card({ surprise: true }), err('UNKNOWN_FIELD'));
  assert.throws(() => card({ expiresAt: '2026-10-21T00:00:00.000Z' }), err('INVALID_EXPIRY'));
  assert.throws(() => card({ title: 'x'.repeat(241) }), err('INVALID_TITLE'));
});

test('expired, future-checked and malformed source metadata never opens', () => {
  const value = card();
  assert.equal(getSourceFreshness(value, Date.parse('2026-10-22T12:00:00.000Z')), 'current');
  assert.equal(canOpenSource(value, Date.parse('2026-10-23T00:00:00.000Z')), false);
  assert.equal(getSourceFreshness({ ...value, checkedAt: '2026-10-24T00:00:00.000Z' }, Date.parse('2026-10-22T12:00:00.000Z')), 'unknown');
  assert.equal(canOpenSource({ ...value, expiresAt: 'bogus' }, Date.parse('2026-10-22T12:00:00.000Z')), false);
});
