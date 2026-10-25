const TYPES = new Set(['job', 'bursary', 'internship', 'learnership', 'funding', 'hackathon']);
const MAX_RECORDS = 200;
const FRESHNESS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const TRACKING_PARAMS = new Set(['fbclid', 'gclid', 'dclid', 'msclkid', 'mc_cid', 'mc_eid', 'igshid']);

function isPublicHttpsUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return false;
    const host = url.hostname.toLowerCase();
    if (!host.includes('.') || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return false;
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.startsWith('[')) return false;
    return true;
  } catch {
    return false;
  }
}

function safeRecord(raw, nowMs) {
  if (!raw || typeof raw !== 'object') return null;
  const strings = ['id', 'title', 'provider'];
  if (strings.some((key) => typeof raw[key] !== 'string' || !raw[key].trim())) return null;
  if (!TYPES.has(raw.type) || !['open', 'closed', 'unknown'].includes(raw.status)) return null;
  if (!['official', 'discovery-only'].includes(raw.verification)) return null;
  if (!isPublicHttpsUrl(raw.officialUrl)) return null;
  if (raw.discoveryUrl != null && !isPublicHttpsUrl(raw.discoveryUrl)) return null;
  if (typeof raw.checkedAt !== 'string' || !Number.isFinite(Date.parse(raw.checkedAt)) || Date.parse(raw.checkedAt) > nowMs) return null;
  if (raw.closesAt != null && (typeof raw.closesAt !== 'string' || !Number.isFinite(Date.parse(raw.closesAt)))) return null;
  if (!Array.isArray(raw.requirements) || !Array.isArray(raw.disciplines)) return null;
  if (![...raw.requirements, ...raw.disciplines].every((item) => typeof item === 'string' && item.trim() && item.length <= 300)) return null;

  // No deadline means the source has not established an open/closed state.
  const status = raw.verification === 'official' && raw.status === 'closed'
    ? 'closed'
    : raw.closesAt == null ? 'unknown' : raw.status;
  return {
    id: raw.id.trim(), title: raw.title.trim(), type: raw.type, provider: raw.provider.trim(),
    ...(raw.discoveryUrl ? { discoveryUrl: raw.discoveryUrl } : {}), officialUrl: raw.officialUrl,
    checkedAt: new Date(raw.checkedAt).toISOString(), closesAt: raw.closesAt ? new Date(raw.closesAt).toISOString() : null,
    requirements: raw.requirements.map((item) => item.trim()), disciplines: raw.disciplines.map((item) => item.trim()),
    status, verification: raw.verification,
  };
}

function deduplicate(records) {
  const selected = [];
  for (const record of records) {
    const urlKey = canonicalUrl(record.officialUrl);
    const previousIndex = selected.findIndex((entry) => {
      const entryKey = canonicalUrl(entry.officialUrl);
      return entry.id.toLowerCase() === record.id.toLowerCase() || entryKey === urlKey;
    });
    const previous = previousIndex >= 0 ? selected[previousIndex] : null;
    const shouldReplace = !previous ||
      (record.verification === 'official' && previous.verification !== 'official') ||
      (record.verification === previous.verification && Date.parse(record.checkedAt) > Date.parse(previous.checkedAt));
    if (shouldReplace) {
      if (previousIndex >= 0) selected[previousIndex] = record;
      else selected.push(record);
    }
  }
  return selected;
}

function canonicalUrl(value) {
  const url = new URL(value);
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_[a-z0-9_]+$/i.test(key) || TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  return `${url.origin}${url.pathname.replace(/\/$/, '')}${url.search}${url.hash}`;
}

function relevantTo(record, programme) {
  const query = String(programme).toLocaleLowerCase().trim();
  if (!query) return true;
  const words = query.split(/[^a-z0-9]+/).filter((word) => word.length > 2);
  if (!words.length) return true;
  return [...record.disciplines, ...record.requirements].some((value) => {
    const haystack = value.toLocaleLowerCase();
    return words.some((word) => haystack.includes(word));
  });
}

const seed = [
  {
    id: 'nc-premier-bursary-2027', title: "Northern Cape Premier's Bursary Programme (2027)", type: 'bursary',
    provider: 'Northern Cape Provincial Government',
    discoveryUrl: 'https://www.studentroom.co.za/category/bursaries/',
    officialUrl: 'https://www.northerncape.gov.za/bursary/', checkedAt: '2026-10-25',
    closesAt: '2026-10-31T23:59:59+02:00', status: 'open', verification: 'official',
    requirements: ['South African citizen residing in the Northern Cape', 'Unemployed youth aged 18 to 30', 'Undergraduate or first qualification at an accredited South African higher education institution', 'Financial need and academic achievement are considered'],
    disciplines: ['Science', 'Technology', 'Engineering', 'Mathematics', 'Scarce and critical skills'],
  },
  {
    id: 'funza-lushaka-bursary-2027', title: 'Funza Lushaka Bursary (2027 new applicants)', type: 'bursary',
    provider: 'Department of Basic Education',
    discoveryUrl: 'https://www.studentroom.co.za/funza-lushaka-bursaries-2027-applications-now-open/',
    officialUrl: 'https://www.funzalushaka.doe.gov.za/', checkedAt: '2026-10-25',
    closesAt: '2027-01-31T23:59:59+02:00', status: 'open', verification: 'official',
    requirements: ['First-time applicants must be 30 years old or younger'],
    disciplines: ['Teaching', 'Education', 'Initial teacher education', 'Foundation Phase', 'Mathematics', 'Languages', 'Natural Science', 'Technology'],
  },
  {
    id: 'funza-lushaka-returning-2027', title: 'Funza Lushaka Bursary (2027 returning bursars)', type: 'bursary',
    provider: 'Department of Basic Education',
    discoveryUrl: 'https://www.studentroom.co.za/funza-lushaka-bursaries-2027-applications-now-open/',
    officialUrl: 'https://www.funzalushaka.doe.gov.za/', checkedAt: '2026-10-25',
    closesAt: '2026-11-30T23:59:59+02:00', status: 'open', verification: 'official',
    requirements: [],
    disciplines: ['Teaching', 'Education', 'Initial teacher education'],
  },
  {
    id: 'graduates24-bursary-discovery', title: 'Browse bursary listings', type: 'funding',
    provider: 'Graduates24 (discovery listing)', discoveryUrl: 'https://www.graduates24.com/bursaries',
    officialUrl: 'https://www.graduates24.com/bursaries', checkedAt: '2026-10-25',
    closesAt: null, status: 'unknown', verification: 'discovery-only', requirements: ['Listing directory; follow the employer or funder source to confirm current details'],
    disciplines: [],
  },
];

export function listOpportunities({ now = new Date(), programme, records = seed } = {}) {
  const timestamp = Date.parse(now);
  const limitations = [
    'Listings are curated public metadata, not application or eligibility decisions.',
    'A missing closing date is shown as unknown; source pages can change after the checked date.',
    'A source check older than seven days is marked stale and its status becomes unknown.',
    'Malformed entries and records checked in the future are ignored.',
    'Programme matching uses plain text overlap only. It is a discovery aid, not an eligibility or hiring score.',
    'Discovery listings are secondary sources; confirm every detail on the official provider page.',
  ];
  if (!Number.isFinite(timestamp)) return { records: [], limitations: [...limitations, 'The requested reference time was invalid.'] };
  if (!Array.isArray(records)) return { records: [], limitations: [...limitations, 'The supplied opportunity list was invalid.'] };
  const checked = records.slice(0, MAX_RECORDS).map((raw) => safeRecord(raw, timestamp)).filter(Boolean).map((record) => {
    const closes = record.closesAt ? Date.parse(record.closesAt) : NaN;
    const stale = timestamp - Date.parse(record.checkedAt) > FRESHNESS_TTL_MS;
    record.stale = stale;
    if (record.verification === 'discovery-only') record.status = 'unknown';
    else if (record.status === 'closed' || (Number.isFinite(closes) && closes <= timestamp)) record.status = 'closed';
    else if (stale || record.status === 'unknown') record.status = 'unknown';
    else if (Number.isFinite(closes) && closes > timestamp) record.status = 'open';
    else record.status = 'unknown';
    return record;
  });
  const unique = deduplicate(checked).filter((record) => !programme || relevantTo(record, programme));
  return {
    records: unique.sort((a, b) => (a.closesAt ?? '9999').localeCompare(b.closesAt ?? '9999') || a.title.localeCompare(b.title)),
    limitations,
  };
}

export { isPublicHttpsUrl };
