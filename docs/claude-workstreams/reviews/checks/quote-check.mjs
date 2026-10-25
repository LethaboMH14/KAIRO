// REVIEW-C1-C3: rechecks every quoted span in C3's youtube-embed-research.md against the live official pages.
// Usage: node docs/claude-workstreams/reviews/checks/quote-check.mjs
// Writes quote-check.json beside this file. Pages are read into memory only; nothing is saved but the report.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../..');
const NOTE = join(root, 'docs/claude-workstreams/media-panel/youtube-embed-research.md');
const OUT = join(here, 'quote-check.json');
const HEADERS = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', 'accept-language': 'en' };
const INLINE = new Set(['a', 'b', 'i', 'em', 'strong', 'code', 'span', 'sup', 'sub', 'abbr', 'var', 'kbd', 'u', 's', 'small', 'mark', 'q', 'cite', 'dfn', 'time']);
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"', mdash: '—', ndash: '–', hellip: '…', copy: '©' };
const KEYWORDS = ['Referer', 'referrer', 'sandbox', 'identif', '480', 'cookie', 'consent'];

const norm = s => s.replace(/[‘’‛′]/g, "'").replace(/[“”″]/g, '"').replace(/[   ]/g, ' ').replace(/\s+/g, ' ');
const decode = s => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => e[0] === '#'
  ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
  : (ENTITIES[e.toLowerCase()] ?? m));
const words = (s, n) => s.trim().split(' ').slice(0, n).join(' ');

function marker(style, n) {
  const roman = k => [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']]
    .reduce((acc, [v, r]) => { while (k >= v) { acc += r; k -= v; } return acc; }, '');
  if (style === 'lower-alpha' || style === 'lower-latin') return String.fromCharCode(96 + n);
  if (style === 'upper-alpha' || style === 'upper-latin') return String.fromCharCode(64 + n);
  if (style === 'lower-roman') return roman(n);
  if (style === 'upper-roman') return roman(n).toUpperCase();
  if (style === 'decimal') return String(n);
  return '*';
}

function listStyle(tag, attrs) {
  const css = attrs.match(/list-style-type\s*:\s*([\w-]+)/i)?.[1];
  if (css) return css.toLowerCase();
  const type = attrs.match(/\btype\s*=\s*["']?([aAiI1])/)?.[1];
  if (type) return { a: 'lower-alpha', A: 'upper-alpha', i: 'lower-roman', I: 'upper-roman', 1: 'decimal' }[type];
  return tag === 'ol' ? 'decimal' : 'disc';
}

/** Page text plus, for each text offset, the ordered-list path and the h2/h3 headings above it. */
function walk(html) {
  let text = '';
  const marks = [];
  const lists = [];
  const heads = { h2: '', h3: '' };
  let headingTag = null, headingBuf = '';
  const append = s => {
    s = norm(s);
    if (!s) return;
    if ((text.endsWith(' ') || text === '') && s.startsWith(' ')) s = s.slice(1);
    text += s;
  };
  const re = /<!--[\s\S]*?-->|<(script|style|noscript|template)\b[\s\S]*?<\/\1\s*>|<(\/?)([a-zA-Z][\w-]*)([^>]*)>|([^<]+)|(<)/g;
  for (const m of html.matchAll(re)) {
    const [, skipped, close, rawTag, attrs = '', chunk, stray] = m;
    if (skipped || m[0].startsWith('<!--')) continue;
    if (rawTag) {
      const tag = rawTag.toLowerCase();
      if (!INLINE.has(tag) && !text.endsWith(' ')) text += ' ';
      if (tag === 'ol' || tag === 'ul') {
        if (close) lists.pop();
        else lists.push({ style: listStyle(tag, attrs), n: Math.max(0, Number(attrs.match(/\bstart\s*=\s*["']?(\d+)/)?.[1] ?? 1) - 1) });
      } else if (tag === 'li' && !close && lists.length) {
        lists[lists.length - 1].n++;
      } else if (tag === 'h2' || tag === 'h3') {
        if (close && headingTag === tag) {
          heads[tag] = norm(headingBuf).trim();
          if (tag === 'h2') heads.h3 = '';
          headingTag = null;
        } else if (!close) { headingTag = tag; headingBuf = ''; }
      }
      continue;
    }
    const piece = decode(chunk ?? stray);
    if (headingTag) headingBuf += piece;
    const path = lists.filter(l => l.style !== 'disc').map(l => marker(l.style, l.n)).join('.');
    const last = marks[marks.length - 1];
    if (!last || last.path !== path || last.h2 !== heads.h2 || last.h3 !== heads.h3) marks.push({ at: text.length, path, ...heads });
    append(piece);
  }
  return { text, marks };
}

function locate(page, offset) {
  let found = page.marks[0];
  for (const mark of page.marks) { if (mark.at > offset) break; found = mark; }
  return found ?? { path: '', h2: '', h3: '' };
}

/** "III. ..." heading + "E. ..." heading + list path 6 -> "III.E.6". */
const sectionLabel = where => [where.h2.match(/^([IVXL]+)\./)?.[1], where.h3.match(/^([A-Z])\./)?.[1], where.path].filter(Boolean).join('.');

/** Longest leading run of the quote's words that occurs on the page, and the page's next words there. */
function divergence(text, quote) {
  const parts = quote.split(' ');
  let best = 0, at = -1;
  for (let k = 1; k <= parts.length; k++) {
    const i = text.indexOf(parts.slice(0, k).join(' '));
    if (i < 0) break;
    best = k; at = i;
  }
  if (best === 0) return { matchedWords: 0, of: parts.length, pageContinues: null };
  const prefix = parts.slice(0, best).join(' ');
  return { matchedWords: best, of: parts.length, pageContinues: words(text.slice(at + prefix.length), 12) };
}

const rows = readFileSync(NOTE, 'utf8').split(/\r?\n/).filter(l => l.startsWith('| ') && !l.startsWith('| Topic'));
const claims = [];
let previous = [];
for (const line of rows) {
  const [topic, quoteCell, sourceCell] = line.split('|').slice(1, -1).map(c => c.trim());
  const urls = [...sourceCell.matchAll(/https?:\/\/[^\s|)]+/g)].map(m => m[0].replace(/[.,;]+$/, ''));
  const sources = sourceCell.startsWith('same') ? [...previous, ...urls] : urls;
  previous = sources;
  const section = quoteCell.match(/\((III\.[^)]+)\)/)?.[1] ?? null;
  for (const [, span] of quoteCell.matchAll(/"([^"]+)"/g)) {
    // Backticks are the note's own code formatting, not page text; stripping them is recorded per span.
    claims.push({ topic, quote: norm(span.replace(/`/g, '')).trim(), markdownStripped: span.includes('`'), claimedSources: sources, claimedSection: section });
  }
}
const noteText = norm(readFileSync(NOTE, 'utf8')).toLowerCase();

// Statements on the pages the note cites that bear on the prototype, checked for presence on the page and absence from the note.
const OMISSION_PROBES = [
  { url: 'https://developers.google.com/youtube/terms/required-minimum-functionality', span: 'must provide identification through the HTTP Referer request header', noteKeyword: 'referer' },
  { url: 'https://developers.google.com/youtube/iframe_api_reference', span: 'The request does not include the HTTP Referer header or equivalent API Client identification', noteKeyword: '153' },
  { url: 'https://developers.google.com/youtube/terms/required-minimum-functionality', span: 'it must be large enough to fully display the controls without shrinking the viewport below the minimum size', noteKeyword: 'fully display the controls' },
  { url: 'https://developers.google.com/youtube/terms/required-minimum-functionality', span: 'We recommend 16:9 players be at least 480 pixels wide and 270 pixels tall', noteKeyword: '480' },
  { url: 'https://developers.google.com/youtube/player_parameters', span: 'playback data collection and sharing will therefore occur upon page load', noteKeyword: 'data collection' },
];

const pages = {};
for (const url of [...new Set([...claims.flatMap(c => c.claimedSources), ...OMISSION_PROBES.map(p => p.url)])]) {
  const fetchUrl = url.includes('support.google.com') && !url.includes('hl=') ? `${url}?hl=en` : url;
  const response = await fetch(fetchUrl, { headers: HEADERS });
  const html = await response.text();
  pages[url] = { fetchUrl, status: response.status, bytes: Buffer.byteLength(html), sha256: createHash('sha256').update(html).digest('hex'), fetchedAt: new Date().toISOString(), ...walk(html) };
}

const results = claims.map(claim => {
  const foundOn = [];
  let detail = null;
  for (const [url, page] of Object.entries(pages)) {
    const exact = page.text.indexOf(claim.quote);
    const loose = exact >= 0 ? exact : page.text.toLowerCase().indexOf(claim.quote.toLowerCase());
    if (loose < 0) continue;
    foundOn.push({ url, exactCase: exact >= 0 });
    if (claim.claimedSources.includes(url) && !detail) {
      const where = locate(page, loose);
      detail = { h2: words(where.h2, 10), h3: words(where.h3, 10), listPath: where.path, sectionLabel: sectionLabel(where) };
      if (claim.claimedSection) detail.sectionMatches = detail.sectionLabel === claim.claimedSection;
    }
  }
  const onClaimed = foundOn.filter(f => claim.claimedSources.includes(f.url));
  const verdict = onClaimed.length ? 'verbatim-on-claimed-source' : foundOn.length ? 'found-on-other-page-only' : 'not-found-verbatim';
  const misses = verdict === 'not-found-verbatim'
    ? Object.fromEntries(claim.claimedSources.map(url => [url, divergence(pages[url].text, claim.quote)]))
    : undefined;
  return { ...claim, verdict, foundOn, location: detail, misses };
});

const omissions = OMISSION_PROBES.map(probe => ({
  ...probe,
  onPage: pages[probe.url].text.includes(probe.span),
  keywordInNote: noteText.includes(probe.noteKeyword.toLowerCase()),
}));

const keywordProbe = Object.fromEntries(Object.entries(pages).map(([url, page]) => [url, Object.fromEntries(KEYWORDS.map(k => {
  const lower = page.text.toLowerCase();
  let count = 0, i = -1;
  while ((i = lower.indexOf(k.toLowerCase(), i + 1)) >= 0) count++;
  return [k, count];
}))]));

const report = {
  task: 'REVIEW-C1-C3',
  checked: 'Every double-quoted span in docs/claude-workstreams/media-panel/youtube-embed-research.md, matched after whitespace and curly-quote normalisation only.',
  note: 'Section labels are rebuilt from the page\'s nested ordered lists (list-style-type), because the numbering is not in the page text.',
  pages: Object.fromEntries(Object.entries(pages).map(([url, p]) => [url, { fetchUrl: p.fetchUrl, status: p.status, bytes: p.bytes, sha256: p.sha256, fetchedAt: p.fetchedAt }])),
  summary: {
    spans: results.length,
    verbatimOnClaimedSource: results.filter(r => r.verdict === 'verbatim-on-claimed-source').length,
    foundOnOtherPageOnly: results.filter(r => r.verdict === 'found-on-other-page-only').length,
    notFoundVerbatim: results.filter(r => r.verdict === 'not-found-verbatim').length,
    sectionLabelsChecked: results.filter(r => r.claimedSection).length,
    sectionLabelsMatching: results.filter(r => r.location?.sectionMatches).length,
    omittedStatementsOnPage: omissions.filter(o => o.onPage && !o.keywordInNote).length,
  },
  results,
  omissions,
  keywordCounts: keywordProbe,
};
writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.summary));
for (const r of results) console.log(`${r.verdict.padEnd(27)} ${r.topic} | ${r.quote.slice(0, 50)}${r.claimedSection ? ` | claimed ${r.claimedSection} -> ${r.location?.sectionLabel} (${r.location?.h2} / ${r.location?.h3})` : ''}${r.misses ? ' | ' + JSON.stringify(r.misses) : ''}`);
for (const o of omissions) console.log(`omission onPage=${o.onPage} inNote=${o.keywordInNote} | ${o.span.slice(0, 70)}`);
