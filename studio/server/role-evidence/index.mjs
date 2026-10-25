/**
 * Issue #6: opt-in, bounded role requirement -> learner evidence preparation.
 * Pure and synchronous. The caller supplies manually checked provider metadata;
 * no live fetching, employer decisions, sharing or application actions.
 */
const PRIORITY = new Set(['essential', 'preferred', 'unspecified']);
const KINDS = new Set(['project', 'practice', 'credential', 'explanation']);
const REVIEWS = new Set(['self-reported', 'reported-feedback', 'unknown']);
const INTERNAL = new Set(['/practice', '/sources', '/evidence', '/pathways', '/opportunities']);
const DAY = 86400000;
const bounded = (v, max, label) => {
  if (typeof v !== 'string' || !v.trim() || v.length > max) throw new TypeError('Invalid ' + label);
  return v.trim();
};
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
function instant(value, label) {
  if (value instanceof Date) value = value.toISOString();
  if (typeof value !== 'string') throw new TypeError('Invalid ' + label);
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + 'T00:00:00.000Z') : new Date(value);
  if (!Number.isFinite(d.valueOf()) || (d.toISOString() !== value && d.toISOString().slice(0,10) !== value)) {
    throw new TypeError('Invalid ' + label + '; use canonical UTC or YYYY-MM-DD');
  }
  return d.toISOString();
}
export function isSafeRoleLink(value) {
  if (typeof value !== 'string' || !value || value.length > 2048) return false;
  if (INTERNAL.has(value)) return true;
  try {
    const u = new URL(value), h = u.hostname.toLowerCase();
    return u.protocol === 'https:' && !u.username && !u.password &&
      (!u.port || u.port === '443') && h.includes('.') &&
      h !== 'localhost' && !h.endsWith('.localhost') && !h.endsWith('.local') &&
      !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(h) && !h.startsWith('[');
  } catch { return false; }
}
function validateRole(role) {
  if (!object(role) || role.version !== 1 || !object(role.source) ||
      !Array.isArray(role.requirements) || role.requirements.length < 1 ||
      role.requirements.length > 30) throw new TypeError('Invalid version 1 role');
  const id = bounded(role.id,100,'role ID');
  const title = bounded(role.title,200,'role title');
  const provider = bounded(role.provider,160,'provider');
  const url = role.source.officialUrl;
  if (!isSafeRoleLink(url) || !url.startsWith('https://')) throw new TypeError('Invalid original provider URL');
  const checkedAt = instant(role.source.checkedAt,'provider check date');
  const closingDateOnly = typeof role.source.closesAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(role.source.closesAt);
  const closesAt = role.source.closesAt == null ? null : instant(role.source.closesAt,'closing date');
  if (!['official','discovery-only'].includes(role.source.verification) ||
      !['open','closed','unknown'].includes(role.source.status)) throw new TypeError('Invalid source state');
  const seen = new Set();
  const requirements = role.requirements.map(req => {
    if (!object(req) || !Array.isArray(req.rubric) ||
        req.rubric.length < 1 || req.rubric.length > 12) throw new TypeError('Invalid requirement rubric');
    const id = bounded(req.id,100,'requirement ID');
    if (seen.has(id)) throw new TypeError('Duplicate requirement ID');
    seen.add(id);
    const text = bounded(req.text,500,'requirement text');
    const providerExcerpt = bounded(req.providerExcerpt,240,'short original-provider excerpt');
    const sourceLocator = bounded(req.sourceLocator,120,'provider source locator');
    if (!PRIORITY.has(req.priority)) throw new TypeError('Unverified requirement priority');
    const rubricSeen = new Set();
    const rubric = req.rubric.map(item => {
      if (!object(item)) throw new TypeError('Invalid rubric row');
      const id = bounded(item.id,100,'rubric ID');
      if (rubricSeen.has(id)) throw new TypeError('Duplicate rubric ID');
      rubricSeen.add(id);
      return {id,label:bounded(item.label,240,'rubric label')};
    });
    let practice = null;
    if (req.practice != null) {
      if (!object(req.practice) || !isSafeRoleLink(req.practice.href)) throw new TypeError('Unsafe practice link');
      practice = {
        title:bounded(req.practice.title,160,'practice title'),
        instructions:bounded(req.practice.instructions,600,'practice instructions'),
        href:req.practice.href
      };
    }
    return {id,text,providerExcerpt,sourceLocator,priority:req.priority,rubric,practice};
  });
  return {id,title,provider,source:{officialUrl:url,checkedAt,closesAt,closingDateOnly,
    verification:role.source.verification,status:role.source.status},requirements};
}
function validateEvidence(items, requirements) {
  if (!Array.isArray(items) || items.length > 120) throw new TypeError('Invalid evidence collection');
  const seen = new Set();
  return items.map(item => {
    if (!object(item) || !Array.isArray(item.rubricIds) || item.rubricIds.length > 12) {
      throw new TypeError('Invalid evidence entry');
    }
    const id = bounded(item.id,100,'evidence ID');
    if (seen.has(id)) throw new TypeError('Duplicate evidence ID');
    seen.add(id);
    const requirementId = bounded(item.requirementId,100,'evidence requirement ID');
    const req = requirements.find(r => r.id === requirementId);
    if (!req) throw new TypeError('Unknown evidence requirement');
    const rubricIds = [...new Set(item.rubricIds.map(v => bounded(v,100,'rubric reference')))];
    if (!rubricIds.every(v => req.rubric.some(r => r.id === v))) throw new TypeError('Unknown rubric reference');
    if (!KINDS.has(item.kind) || !REVIEWS.has(item.reviewStatus)) throw new TypeError('Invalid evidence review/kind');
    return {id,requirementId,rubricIds,kind:item.kind,reviewStatus:item.reviewStatus,
      note:bounded(item.note,1200,'evidence note'),
      reference:item.reference == null ? null : bounded(item.reference,240,'evidence reference')};
  });
}
const order = p => p === 'essential' ? 0 : p === 'preferred' ? 1 : 2;

/**
 * evaluateRoleEvidence({role,evidence?,now?}) returns a serializable v1
 * view-model. Every status is a documentation state, never an eligibility test.
 */
export function evaluateRoleEvidence({role,evidence=[],now=new Date()} = {}) {
  const r = validateRole(role);
  const observedAt = instant(now,'reference time');
  const ms = Date.parse(observedAt), checked = Date.parse(r.source.checkedAt);
  if (checked > ms) throw new TypeError('Provider check is in the future');
  const entries = validateEvidence(evidence,r.requirements);
  const stale = ms - checked > 7 * DAY;
  const sourceState = r.source.verification === 'discovery-only' ? 'discovery-only' :
    stale ? 'stale' : 'dated-provider-summary';
  // A date without a time cannot establish whether that closing DAY is still open.
  const closingStart = r.source.closesAt === null ? NaN : Date.parse(r.source.closesAt);
  const dayUnknown = r.source.closingDateOnly && ms >= closingStart && ms < closingStart + DAY;
  const closed = r.source.status === 'closed' ||
    (r.source.closesAt !== null && ms >= closingStart + (r.source.closingDateOnly ? DAY : 0));
  const listingState = closed ? 'closed' : dayUnknown || sourceState !== 'dated-provider-summary' ||
    r.source.status !== 'open' || r.source.closesAt === null ?
    'unknown' : 'deadline-ahead-unconfirmed';
  const rows = r.requirements.map(req => {
    const matches = entries.filter(item => item.requirementId === req.id);
    const rubric = req.rubric.map(item => {
      const support = matches.filter(entry => entry.rubricIds.includes(item.id));
      return {...item,status:support.length ? 'learner-evidence-recorded' : 'unknown',
        evidenceIds:support.map(entry => entry.id),
        explanation:support.length ?
          'Learner-linked work is recorded; no independent skill check or provider decision.' :
          'No linked work here. This is unknown, not evidence of inability.'};
    });
    const missing = rubric.filter(item => item.status === 'unknown');
    const status = sourceState !== 'dated-provider-summary' ? 'source-needs-recheck' :
      missing.length === rubric.length ? 'unknown' :
      missing.length ? 'partially-documented' : 'documented-for-review';
    return {...req,sourceState,status,rubric,evidence:matches,
      explanation:sourceState !== 'dated-provider-summary' ?
        'Recheck dated official source wording before relying on these requirements.' :
        matches.length ? 'Mapping shows only learner statements, not eligibility or an employment result.' :
          'No linked evidence. The learner may still have this skill.'};
  });
  const nextPractice = rows.filter(r => r.practice && r.rubric.some(c => c.status === 'unknown'))
    .sort((a,b) => order(a.priority)-order(b.priority)).slice(0,3)
    .map(r => ({requirementId:r.id,priority:r.priority,
      missingRubric:r.rubric.filter(c => c.status === 'unknown').map(c => c.label),
      ...r.practice,reason:'Voluntary KAIRO-authored practice, not an employer requirement.'}));
  return {version:1,roleId:r.id,title:r.title,provider:r.provider,observedAt,
    source:{...r.source,state:sourceState,stale},listingState,requirements:rows,nextPractice,
    limitations:[
      'Manually curated dated provider summaries; not a live vacancy feed or current eligibility check.',
      'Essential and preferred are explicit source classifications; unspecified stays unspecified.',
      'Learner notes, including reported feedback, are not independently verified.',
      'Undocumented evidence means unknown, not no ability. No hiring, ATS or applicant score.',
      'A source link opens only on the learner’s choice. Nothing is crawled, submitted or shared.'
    ]};
}
