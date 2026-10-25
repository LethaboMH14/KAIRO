const DEFAULT_MAX_AGE_DAYS = 7;
const MAX_MAX_AGE_DAYS = 365;
const MAX_REQUIREMENTS = 100;
const DAY_MS = 24 * 60 * 60 * 1000;
const UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function strictUtcMillis(value) {
  if (typeof value !== 'string' || !UTC_TIMESTAMP.test(value)) return null;
  const millis = Date.parse(value);
  return Number.isFinite(millis) && new Date(millis).toISOString() === value ? millis : null;
}

function safeOriginalUrl(value) {
  if (typeof value !== 'string' || value.length > 2048 || value.trim() !== value || /[\u0000-\u0020\u007f]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null;
    return value;
  } catch {
    return null;
  }
}

function isPlainRecord(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function nonEmptyString(value, maxLength) {
  return typeof value === 'string' && value.length <= maxLength && value.trim().length > 0;
}

/**
 * Inspect caller-supplied opportunity metadata without fetching or mutating it.
 * `current` means complete metadata checked within the requested age window;
 * it does not verify that a provider still offers the opportunity or that a
 * learner is eligible. `now` and record dates use canonical UTC ISO timestamps.
 */
export function inspectOpportunity(record, options = {}) {
  const reasons = [];
  const originalUrl = isPlainRecord(record) ? safeOriginalUrl(record.url) : null;
  const invalid = (reason) => {
    if (!reasons.includes(reason)) reasons.push(reason);
  };
  if (!isPlainRecord(record)) {
    return { status: 'invalid', reasons: ['invalid-record'], originalUrl: null };
  }

  if (!isPlainRecord(options)) {
    return { status: 'invalid', reasons: ['invalid-options'], originalUrl };
  }

  const { now, maxAgeDays = DEFAULT_MAX_AGE_DAYS } = options;
  if (!Number.isSafeInteger(maxAgeDays) || maxAgeDays < 1 || maxAgeDays > MAX_MAX_AGE_DAYS) invalid('invalid-max-age-days');
  const nowMs = strictUtcMillis(now);
  if (nowMs === null) invalid('invalid-now');

  if (!nonEmptyString(record.id, 160)) invalid('invalid-id');
  if (!nonEmptyString(record.title, 300)) invalid('invalid-title');
  if (originalUrl === null) invalid('invalid-url');
  const checkedAtMs = strictUtcMillis(record.checkedAt);
  if (checkedAtMs === null) invalid('invalid-checked-at');
  else if (nowMs !== null && checkedAtMs > nowMs) invalid('checked-at-in-future');

  let closesAtMs = null;
  if (record.closesAt !== null && record.closesAt !== undefined) {
    closesAtMs = strictUtcMillis(record.closesAt);
    if (closesAtMs === null) invalid('invalid-closes-at');
  }

  const missing = [];
  if (record.sourceName === null || record.sourceName === undefined || (typeof record.sourceName === 'string' && !record.sourceName.trim())) {
    missing.push('missing-source-name');
  } else if (!nonEmptyString(record.sourceName, 200)) {
    invalid('invalid-source-name');
  }

  if (record.requirements === null || record.requirements === undefined) {
    missing.push('missing-requirements');
  } else if (!Array.isArray(record.requirements)) {
    invalid('invalid-requirements');
  } else if (record.requirements.length > MAX_REQUIREMENTS) {
    invalid('invalid-requirements');
  } else if (record.requirements.length === 0) {
    missing.push('missing-requirements');
  } else if (!record.requirements.every((item) => nonEmptyString(item, 500))) {
    invalid('invalid-requirements');
  }

  if (reasons.length) return { status: 'invalid', reasons, originalUrl };

  if (closesAtMs !== null && closesAtMs <= nowMs) {
    return { status: 'expired', reasons: ['closing-time-reached'], originalUrl };
  }

  if (missing.length) {
    return { status: 'needs-check', reasons: missing, originalUrl };
  }

  if (nowMs - checkedAtMs > maxAgeDays * DAY_MS) {
    return { status: 'needs-check', reasons: ['source-check-is-stale'], originalUrl };
  }

  if (closesAtMs === null) {
    return { status: 'needs-check', reasons: ['missing-closing-time'], originalUrl };
  }

  return { status: 'current', reasons: [], originalUrl };
}
