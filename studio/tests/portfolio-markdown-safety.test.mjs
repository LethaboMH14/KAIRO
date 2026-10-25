import test from 'node:test';
import assert from 'node:assert/strict';
import { escapePortfolioMarkdown } from '../src/portfolio-export/markdown-safety.ts';
import { portfolioMarkdown, emptyProfile } from '../src/profile/model.ts';
import { initialCase } from '../src/practice/model.ts';
import { preparePracticePortfolioExport } from '../src/practice/export-recovery.ts';

test('ordinary source attribution and hyphenated revision IDs stay readable', () => {
  assert.equal(escapePortfolioMarkdown('Lesson rev-abc123, page 2: stock + deliveries - sales.'), 'Lesson rev-abc123, page 2: stock + deliveries - sales.');
});

test('untrusted headings, raw HTML and Markdown links/images become literal', () => {
  const input = 'Heading\n## Certified skills\n<script>alert(1)</script>\n[verify](https://untrusted.example)\n![image](https://untrusted.example/i.png)';
  const safe = escapePortfolioMarkdown(input);
  assert.ok(safe.includes('\\#\\# Certified skills'));
  assert.ok(safe.includes('&lt;script&gt;'));
  assert.ok(safe.includes('\\[verify\\]\\(https://untrusted.example\\)'));
  assert.ok(safe.includes('\\!\\[image\\]'));
  assert.doesNotMatch(safe, /<script|^## Certified skills/m);
});

test('quotes and code/emphasis cannot create Markdown structures', () => {
  const fence = String.fromCharCode(96).repeat(3);
  const safe = escapePortfolioMarkdown('> verified\n' + fence + 'html\n<b>certified</b>\n' + fence + '\n**mastery**');
  assert.match(safe, /^&gt; verified/);
  assert.ok(safe.includes('\\' + fence.split('').join('\\') + 'html'));
  assert.match(safe, /&lt;b&gt;certified&lt;\/b&gt;/);
  assert.match(safe, /\\\*\\\*mastery\\\*\\\*/);
});

test('horizontal rules, setext headings and list markers do not become document structure', () => {
  const safe = escapePortfolioMarkdown('---\n+ Verified\n- Certified\n1. Approved\n12. Passed\nClaim\n===\nrev-abc123');
  assert.match(safe, /^\\---/);
  assert.match(safe, /^\\\+ Verified/m);
  assert.match(safe, /^\\- Certified/m);
  assert.match(safe, /^1\\\. Approved/m);
  assert.match(safe, /^12\\\. Passed/m);
  assert.match(safe, /^\\===/m);
  assert.match(safe, /^rev-abc123/m);
});

test('entities and backslashes are escaped without discarding paragraph boundaries', () => {
  assert.equal(escapePortfolioMarkdown('A & B\nC \\ D'), 'A &amp; B\nC \\\\ D');
});

test('exported profile preserves KAIRO headings but neutralizes forged learner claims', () => {
  const hostile = '## KAIRO VERIFIED COMPETENCE\n[Approved](https://untrusted.example)\n<script>fake</script>';
  const profile = {
    ...emptyProfile(),
    lessons: [{ lessonId: 'lesson-1', title: hostile, topic: 'Other', format: 'passage', questions: 1, attempts: [], updatedAt: '2026-10-25T00:00:00Z' }],
    cases: [{ id: 'case-1', lessonId: null, title: hostile, version: 'corner-shop-v1', events: [{ at: '2026-10-25T00:00:00Z', kind: 'Note', value: hostile }], completedAt: null, reflection: hostile }],
  };
  const output = portfolioMarkdown(profile);
  assert.match(output, /^# KAIRO personal practice portfolio/m);
  assert.match(output, /^## Study history/m);
  assert.match(output, /^## Workplace cases/m);
  assert.doesNotMatch(output, /^## KAIRO VERIFIED COMPETENCE/m);
  assert.match(output, /\\#\\# KAIRO VERIFIED COMPETENCE/);
  assert.doesNotMatch(output, /<script>/);
  assert.match(output, /&lt;script&gt;/);
  assert.match(output, /Browser-local, self-directed practice/);
});

test('practice export preserves source attribution while escaping source-authored claims', () => {
  const hostile = 'Source line\n## OFFICIALLY ACCREDITED\n[Join](https://untrusted.example)\n<iframe src="https://untrusted.example"></iframe>';
  const lesson = {
    id: 'lesson-7', title: hostile, revision: 'rev-abc123',
    evidence: [{ id: 'p1', title: 'Source evidence', locator: 'page 2', quote: hostile }],
  };
  const result = preparePracticePortfolioExport(() => emptyProfile(), initialCase('case-7', 'lesson-7'), lesson);
  assert.equal(result.status, 'ready');
  assert.match(result.markdown, /## Linked lesson principles/);
  assert.match(result.markdown, /Source revision: rev-abc123/);
  assert.match(result.markdown, /page 2/);
  assert.match(result.markdown, /\\#\\# OFFICIALLY ACCREDITED/);
  assert.doesNotMatch(result.markdown, /^## OFFICIALLY ACCREDITED/m);
  assert.doesNotMatch(result.markdown, /<iframe\b/);
  assert.match(result.markdown, /&lt;iframe/);
  assert.match(result.markdown, /self-directed practice/);
});
