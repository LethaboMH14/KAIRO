/** Offline-only, deterministic candidate ranking. No GitHub writes, no worker dispatch. */
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const MAX_ITEMS = 500;
const clamp = (x) => Number.isInteger(x) && x >= 0 && x <= 3 ? x : null;
const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const validPath = (p) => typeof p === 'string' && p.length > 0 && p.length < 250 &&
  !p.startsWith('/') && !p.includes('\\') && !p.split('/').some(x => x === '..' || x === '' || x === '.');
const overlap = (a,b) => a === b || a.startsWith(b + '/') || b.startsWith(a + '/');
const list = (x, name) => {
  if (!Array.isArray(x) || x.length > MAX_ITEMS) throw new TypeError(`${name} must be a bounded array`);
  return x;
};
function checkCandidate(c) {
  if (!c || !Number.isSafeInteger(c.issue) || c.issue < 1 ||
    typeof c.problemKey !== 'string' || !norm(c.problemKey) ||
    !Array.isArray(c.paths) || !c.paths.length || c.paths.length > 12 ||
    !c.paths.every(validPath) || !Array.isArray(c.dependencies) ||
    !c.dependencies.every(n => Number.isSafeInteger(n) && n > 0) ||
    !['P0','P1','P2'].includes(c.priority) ||
    !['READY','RETURN'].includes(c.kind) ||
    !['code','research','qa'].includes(c.lane)) throw new TypeError('invalid candidate contract');
  for (const key of ['severity','urgency','evidenceGain','userValue','collisionRisk','costRisk','uncertainty']) {
    if (clamp(c[key]) === null) throw new TypeError(`invalid ${key}`);
  }
  if (c.userValue > 0 && (!Array.isArray(c.userEvidence) || c.userEvidence.length === 0))
    throw new TypeError('claimed validated user value lacks evidence');
}
function activeClaim(c) {
  return c && c.status === 'ACTIVE' && typeof c.session === 'string' && c.session.trim() &&
    typeof c.branch === 'string' && c.branch.trim() && Array.isArray(c.paths) &&
    c.paths.length && c.paths.every(validPath);
}

/** @returns {object} transparent ranking with excluded reasons; never assigns or starts work. */
export function rankSnapshot(snapshot) {
  if (!snapshot || snapshot.schemaVersion !== 1 || snapshot.source !== 'github-snapshot')
    throw new TypeError('requires explicit GitHub snapshot provenance');
  const issues = list(snapshot.issues, 'issues');
  const prs = list(snapshot.prs, 'prs');
  const claims = list(snapshot.claims, 'claims');
  const candidates = list(snapshot.candidates, 'candidates');
  const open = new Set(issues.filter(i => i.state === 'open').map(i => i.number));
  const closed = new Set(issues.filter(i => i.state === 'closed').map(i => i.number));
  const seen = new Set(), seenKeys = new Set(), ranked = [], excluded = [];
  for (const c of candidates) {
    checkCandidate(c);
    const why = [];
    const key = norm(c.problemKey);
    if (seen.has(c.issue) || seenKeys.has(key)) why.push('DUPLICATE_CANDIDATE');
    seen.add(c.issue); seenKeys.add(key);
    if (!open.has(c.issue)) why.push('ISSUE_NOT_OPEN');
    if (c.dependencies.some(d => !closed.has(d))) why.push('DEPENDENCY_UNVERIFIED');
    if (claims.some(x => activeClaim(x) && (x.issue === c.issue || x.paths.some(p => c.paths.some(q => overlap(p,q))))))
      why.push('ACTIVE_SCOPE_CLAIM');
    if (prs.some(p => p.state === 'open' && (p.issue === c.issue ||
      (Array.isArray(p.paths) && p.paths.some(path => validPath(path) && c.paths.some(q => overlap(path,q)))))))
      why.push('OPEN_PR_SCOPE');
    if (c.kind === 'RETURN' && (!c.review || c.review.decision !== 'RETURN' ||
      typeof c.review.url !== 'string' || !/^https:\/\/github\.com\//.test(c.review.url)))
      why.push('RETURN_REVIEW_UNVERIFIED');
    const score = 4*c.severity + 3*c.urgency + 2*c.evidenceGain + 2*c.userValue -
      2*c.collisionRisk - 2*c.costRisk - c.uncertainty;
    const entry = {issue:c.issue, problemKey:c.problemKey, lane:c.lane, score, paths:c.paths};
    if (why.length) excluded.push({...entry,reasons:why});
    else ranked.push(entry);
  }
  ranked.sort((a,b) => b.score-a.score || a.issue-b.issue);
  return {mode:'DRY_RUN_ONLY', provenance:snapshot.source, ready:ranked.slice(0,2),
    totalReady:ranked.length, excluded, executedWorkers:0, githubWrites:0,
    warning:'GitHub comments and plans do not prove a worker is running. Local SQLite claims not inspected.'};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 3) { console.error('Usage: node queue.mjs snapshot.json'); process.exitCode=2; }
  else {
    try {
      const data = JSON.parse(await readFile(process.argv[2], 'utf8'));
      console.log(JSON.stringify(rankSnapshot(data),null,2));
    } catch (e) { console.error(`Cannot rank snapshot: ${e.message}`); process.exitCode=1; }
  }
}
