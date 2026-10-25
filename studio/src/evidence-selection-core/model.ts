export type ReviewedEvidenceSource = {
  id: string;
  title: string;
  reviewed: true;
  revision: string;
  reviewedPages: Array<{ text: string; locator: string; method: string; edited?: boolean }>;
};

export type EvidenceSelectionOptions = { maxCharacters?: number; maxChunks?: number };
export type EvidenceItem = { id: string; sourceId: string; title: string; locator: string; quote: string; start: number; end: number; edited: boolean };
export type EvidenceSelection = {
  evidence: EvidenceItem[];
  selection: { method: 'lexical-goal' | 'source-order'; consideredChunks: number; selectedCharacters: number; omittedCharacters: number; matchedTerms: string[]; scope: string };
};

const STOP = new Set('a an and are as at be by for from how i in is it of on or that the their this to was what when where which with you your explain describe understand learn about into using'.split(' '));
const WORD = /[\p{L}\p{N}]+/gu;
const boundedInt = (value: number | undefined, fallback: number, max: number) =>
  value === undefined ? fallback : Number.isFinite(value) ? Math.min(max, Math.max(1, Math.floor(value))) : fallback;

export function selectEvidence(source: ReviewedEvidenceSource, goal: string, options: EvidenceSelectionOptions = {}): EvidenceSelection {
  if (!source || typeof source !== 'object' || source.reviewed !== true || typeof source.id !== 'string' || !source.id || typeof source.title !== 'string' ||
      typeof source.revision !== 'string' || !/^[a-f\d]{64}$/i.test(source.revision) || !Array.isArray(source.reviewedPages) ||
      typeof goal !== 'string' || goal.length > 1000) throw new TypeError('A reviewed source, SHA-256 revision, and goal of at most 1,000 characters are required.');
  for (const page of source.reviewedPages) if (!page || typeof page.text !== 'string' || page.text.length > 16000 || typeof page.locator !== 'string' || page.locator.length > 300 || typeof page.method !== 'string' || (page.edited !== undefined && typeof page.edited !== 'boolean')) throw new TypeError('Malformed reviewed page.');
  if (source.reviewedPages.length > 100 || source.reviewedPages.reduce((n, p) => n + p.text.length, 0) > 48000) throw new RangeError('Reviewed source exceeds the 100-page / 48,000-character selector bound.');
  const maxCharacters = boundedInt(options.maxCharacters, 12000, 12000);
  const maxChunks = boundedInt(options.maxChunks, 12, 24);
  const goalTerms = new Set((goal.toLowerCase().match(WORD) ?? []).filter(t => t.length > 1 && !STOP.has(t)).slice(0, 64));
  const chunks: Array<{ page: number; start: number; end: number; text: string; score: number; order: number }> = [];
  const sourceTerms = new Set<string>();
  let order = 0;
  source.reviewedPages.forEach((page, pageIndex) => {
    for (let start = 0; start < page.text.length; start += 1400) {
      const end = Math.min(page.text.length, start + 1400), text = page.text.slice(start, end);
      const terms = new Set<string>(text.toLowerCase().match(WORD) ?? []);
      for (const term of terms) sourceTerms.add(term);
      let score = 0;
      for (const term of goalTerms) if (terms.has(term)) score++;
      chunks.push({ page: pageIndex, start, end, text, score, order: order++ });
    }
  });
  const matchedTerms = [...goalTerms].filter(term => sourceTerms.has(term));
  const method = matchedTerms.length ? 'lexical-goal' : 'source-order';
  const ranked = [...chunks].sort((a, b) => method === 'lexical-goal' ? b.score - a.score || a.order - b.order : a.order - b.order);
  const selected: typeof chunks = [];
  let selectedCharacters = 0;
  for (const chunk of ranked) {
    if (selected.length >= maxChunks) break;
    const remaining = maxCharacters - selectedCharacters;
    if (remaining <= 0) break;
    let clipped = chunk;
    if (chunk.text.length > remaining) {
      let end = chunk.start + remaining;
      const page = source.reviewedPages[chunk.page].text;
      if (end > chunk.start && end < page.length && /[\uD800-\uDBFF]/.test(page[end - 1]) && /[\uDC00-\uDFFF]/.test(page[end])) end--;
      if (end === chunk.start) continue;
      clipped = { ...chunk, end, text: page.slice(chunk.start, end) };
    }
    selected.push(clipped); selectedCharacters += clipped.text.length;
  }
  // Preserve relevance ranking for downstream consumers that take only the first few citations.
  // In fallback mode `ranked` is already source ordered; lexical ties remain source ordered above.
  const evidence = selected.map(chunk => {
    const page = source.reviewedPages[chunk.page];
    return { id: `S${chunk.page + 1}-${chunk.start}`, sourceId: source.id, title: source.title, locator: page.locator, quote: page.text.slice(chunk.start, chunk.end), start: chunk.start, end: chunk.end, edited: page.edited === true };
  });
  const consideredCharacters = chunks.reduce((n, c) => n + c.text.length, 0);
  return { evidence, selection: { method, consideredChunks: chunks.length, selectedCharacters, omittedCharacters: Math.max(0, consideredCharacters - selectedCharacters), matchedTerms: matchedTerms.sort(), scope: 'Lexical matching over all reviewed page text, bounded to 48,000 source characters and 100 pages; offsets are JavaScript UTF-16 indices.' } };
}
