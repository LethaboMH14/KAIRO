import { hash } from '../workspace/model.mjs';

const ID = /^[a-f0-9]{24}$/;
const REVISION = /^[a-f0-9]{64}$/;
const MAX_INPUT = 500;
const MAX_RESULTS = 100;

/**
 * Safe summary of records returned by an authenticated owner-partitioned
 * repository.list(uid, 'sources'). Never accepts a client-submitted owner.
 * This is display metadata; only the server's lesson route can authorize use.
 */
export function summarizeReviewedSources(records, { limit = MAX_RESULTS } = {}) {
  if (!Array.isArray(records) || records.length > MAX_INPUT ||
      !Number.isInteger(limit) || limit < 1 || limit > MAX_RESULTS) {
    throw new TypeError('Reviewed source catalog exceeds supported limits.');
  }
  const byId = new Set();
  const candidates = [];
  for (const row of records) {
    const source = row?.value;
    const id = source?.id;
    if (typeof id !== 'string' || !ID.test(id) || row.id !== id) continue;
    if (byId.has(id)) throw new TypeError('Reviewed source catalog has repeated source IDs.');
    byId.add(id);
    if (source.reviewed !== true || source.deleted === true || source.revoked === true ||
        typeof source.title !== 'string' || !source.title.trim() || source.title.length > 120 ||
        typeof source.revision !== 'string' || !REVISION.test(source.revision) ||
        !Array.isArray(source.reviewedPages) || source.reviewedPages.length < 1 ||
        source.reviewedPages.length > 120) continue;
    let chars = 0;
    let meaningful = false;
    let wellFormed = true;
    for (const p of source.reviewedPages) {
      if (!p || typeof p !== 'object' || Array.isArray(p) ||
          typeof p.text !== 'string' || p.text.length > 16000 ||
          typeof p.locator !== 'string' || !p.locator.trim() || p.locator.length > 500) {
        wellFormed = false; break;
      }
      chars += p.text.length;
      if (p.text.trim().length >= 80) meaningful = true;
    }
    if (!wellFormed || !meaningful || chars > 48000 || hash(source.reviewedPages) !== source.revision) continue;
    const summary = {
      id, title: source.title.trim(), reviewed: true,
      revision: source.revision, reviewedSectionCount: source.reviewedPages.length,
    };
    if (typeof source.reviewedAt === 'string' && source.reviewedAt.length <= 40 &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(source.reviewedAt) &&
        Number.isFinite(Date.parse(source.reviewedAt))) {
      summary.reviewedAt = source.reviewedAt;
    }
    candidates.push(summary);
  }
  candidates.sort((a,b) => {
    const aa = a.title.toLowerCase(), bb = b.title.toLowerCase();
    return aa < bb ? -1 : aa > bb ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return {
    reviewedSourcesVersion: 1,
    reviewedSources: candidates.slice(0, limit),
    reviewedSourcesPage: {
      limit,
      returned: Math.min(limit, candidates.length),
      possiblyTruncated: candidates.length > limit || records.length >= MAX_RESULTS,
    },
  };
}
