import { readFileSync } from 'node:fs';

const SHA = /^[a-f0-9]{40}$/i;
const HTTPS = /^https:\/\/[^\s/]+\//;
const CRITERIA = new Set(['Product', 'Creativity', 'Usability', 'Sustainability', 'Impact', 'Presentation', 'Intelligence']);
const STATUS = new Set(['proposed', 'source-supported', 'code-implemented', 'isolated-test-passed', 'exact-head-ci-passed', 'independent-reviewed', 'real-device-observed', 'external-user-observed', 'buyer-validated', 'blocked', 'withdrawn']);
const SECRET = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|AIza[A-Za-z0-9_-]{20,})\b|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const validDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().slice(0,10) === s;
const present = s => typeof s === 'string' && s.trim().length > 0;

export function validateRegistry(registry, { headSha } = {}) {
  const errors = [];
  const fail = (id, field, message) => errors.push(`${id}.${field}: ${message}`);
  if (!registry || !Array.isArray(registry.claims)) return ['registry.claims: expected array'];
  if (headSha !== undefined && !SHA.test(headSha)) return ['headSha: expected exact 40-hex commit'];
  const seen = new Set();
  for (const [index, c] of registry.claims.entries()) {
    const id = present(c?.claimId) ? c.claimId : `claim[${index}]`;
    if (!c || typeof c !== 'object') { fail(id, 'record', 'expected object'); continue; }
    if (!/^[A-Z][A-Z0-9-]{3,63}$/.test(id)) fail(id, 'claimId', 'stable uppercase identifier required');
    if (seen.has(id)) fail(id, 'claimId', 'duplicate identifier');
    seen.add(id);
    if (!present(c.statement)) fail(id, 'statement', 'required');
    if (!present(c.userJob)) fail(id, 'userJob', 'required');
    if (!STATUS.has(c.status)) fail(id, 'status', 'unknown evidence state');
    if (!Array.isArray(c.judgingCriteria) || !c.judgingCriteria.length || c.judgingCriteria.some(x => !CRITERIA.has(x))) fail(id, 'judgingCriteria', 'one or more of the seven criteria required');
    if (!['draft', 'public'].includes(c.publication)) fail(id, 'publication', 'draft or public required');
    if (!['technical', 'user-experience', 'measured-outcome', 'research'].includes(c.claimClass)) fail(id, 'claimClass', 'unsupported class');
    if (!Array.isArray(c.sources)) fail(id, 'sources', 'array required');
    else for (const [i, s] of c.sources.entries()) {
      if (!present(s?.issuer) || !HTTPS.test(s?.url || '') || !validDate(s?.publishedDate) || !validDate(s?.checkedDate)) fail(id, `sources[${i}]`, 'issuer, HTTPS URL, publishedDate and checkedDate required');
    }
    if (c.quantitative !== undefined) {
      const q = c.quantitative;
      if (!q || !Number.isFinite(q.value) || !present(q.unit) || !Number.isFinite(q.denominator) || q.denominator <= 0 || !present(q.period) || !present(q.method)) fail(id, 'quantitative', 'finite value, unit, positive denominator, period and method required');
    }
    if (!Array.isArray(c.evidence)) fail(id, 'evidence', 'array required');
    const ev = Array.isArray(c.evidence) ? c.evidence : [];
    for (const [i, e] of ev.entries()) {
      if (!['ci', 'review', 'device', 'external-observation', 'research', 'synthetic'].includes(e?.kind)) { fail(id, `evidence[${i}]`, 'unknown evidence kind'); continue; }
      if (e.kind === 'ci' && (!SHA.test(e.commit || '') || !HTTPS.test(e.runUrl || '') || e.outcome !== 'passed')) fail(id, `evidence[${i}]`, 'CI requires exact SHA, run URL and passed outcome');
      if (e.kind === 'review' && (!present(e.reviewerSession) || !HTTPS.test(e.reviewUrl || '') || e.reviewerSession === c.authorSession)) fail(id, `evidence[${i}]`, 'independent reviewer session and review URL required');
      if (e.kind === 'device' && (!present(e.device) || !validDate(e.observedAt) || !HTTPS.test(e.artifactUrl || ''))) fail(id, `evidence[${i}]`, 'device, date and actual artifact URL required');
      if (e.kind === 'external-observation' && (!validDate(e.observedAt) || !present(e.method) || !Number.isInteger(e.sampleSize) || e.sampleSize <= 0 || !HTTPS.test(e.redactedEvidenceUrl || ''))) fail(id, `evidence[${i}]`, 'dated consent-safe observation method, n and redacted URL required');
      if (e.kind === 'research' && (!present(e.issuer) || !HTTPS.test(e.url || '') || !validDate(e.checkedDate))) fail(id, `evidence[${i}]`, 'issuer, dated HTTPS citation required');
      if (e.kind === 'ci' && headSha && e.commit !== headSha) fail(id, `evidence[${i}]`, 'stale CI SHA against supplied current head');
    }
    if (c.publication === 'public') {
      if (!c.sources?.length) fail(id, 'publication', 'public claim needs traceable sources');
      if (ev.length === 0 || ev.every(e => e.kind === 'synthetic')) fail(id, 'publication', 'synthetic-only or absent evidence cannot support public claim');
      if (c.claimClass === 'technical' || c.claimClass === 'user-experience') {
        if (!headSha || !ev.some(e => e.kind === 'ci' && e.commit === headSha && e.outcome === 'passed')) fail(id, 'publication', 'current exact-head CI required');
        if (!ev.some(e => e.kind === 'review' && e.reviewerSession !== c.authorSession)) fail(id, 'publication', 'independent diff review required');
      }
      if (c.claimClass === 'user-experience' && !ev.some(e => e.kind === 'device')) fail(id, 'publication', 'actual authorised device evidence required');
      if (c.claimClass === 'measured-outcome' && !ev.some(e => e.kind === 'external-observation')) fail(id, 'publication', 'measured outcome requires real consent-safe observation');
      if (c.claimClass === 'research' && !ev.some(e => e.kind === 'research')) fail(id, 'publication', 'dated independent source evidence required');
    }
    if (SECRET.test(JSON.stringify(c))) fail(id, 'privacy', 'possible secret or personal email in public registry; redact before committing');
  }
  return errors;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    const file = process.argv[2];
    if (!file) throw new Error('Usage: node validate.mjs <registry.json> [40-hex-head-sha]');
    const errors = validateRegistry(JSON.parse(readFileSync(file, 'utf8')), { headSha: process.argv[3] });
    if (errors.length) { for (const e of errors) console.error(e); process.exitCode = 1; }
    else console.log('Claim registry valid (structural check only; no external evidence independently verified).');
  } catch (error) { console.error(`Claim registry validation failed: ${error.message}`); process.exitCode = 1; }
}
