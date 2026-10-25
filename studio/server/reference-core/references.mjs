import { isIP } from 'node:net';

const MAX_URL_LENGTH = 2048;
const MAX_TITLE_LENGTH = 240;
const MAX_SUMMARY_LENGTH = 1200;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const SAFE_HOST_LABEL = /^(?=.{1,63}$)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

export class ReferenceError extends Error {
  constructor(code) { super(code); this.name = 'ReferenceError'; this.code = code; }
}

function text(value, max, code = 'INVALID_INPUT') {
  if (typeof value !== 'string' || value.length < 1 || value.length > max || value.trim() !== value || /[\u0000-\u001f\u007f]/.test(value)) throw new ReferenceError(code);
  return value;
}

function parseStrictUrl(input) {
  text(input, MAX_URL_LENGTH, 'INVALID_URL');
  if (input.includes('\\') || input.includes('%')) throw new ReferenceError('UNSAFE_URL');
  let url;
  try { url = new URL(input); } catch { throw new ReferenceError('INVALID_URL'); }
  const authority = input.match(/^https:\/\/([^/?#]*)/i)?.[1];
  if (!authority || authority.includes(':') || url.protocol !== 'https:' || url.username || url.password || url.hash || url.port) throw new ReferenceError('UNSAFE_URL');
  return url;
}

function publicDnsHost(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (!host || isIP(host) || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.test') || host.endsWith('.invalid') || host.endsWith('.example')) return false;
  const labels = host.split('.');
  return labels.length >= 2 && labels.every((label) => SAFE_HOST_LABEL.test(label));
}

/** Validate a user-facing outbound reference. This does not authorize a fetch or make a URL SSRF-safe. */
export function validateOutwardReferenceUrl(input) {
  const url = parseStrictUrl(input);
  if (!publicDnsHost(url.hostname)) throw new ReferenceError('UNSAFE_HOST');
  if (url.href.length > MAX_URL_LENGTH) throw new ReferenceError('INVALID_URL');
  return url.href;
}

function parseStart(value) {
  if (value === null) return 0;
  if (!/^\d{1,7}$/.test(value)) throw new ReferenceError('INVALID_START');
  const seconds = Number(value);
  if (!Number.isSafeInteger(seconds) || seconds < 0 || seconds > 604800) throw new ReferenceError('INVALID_START');
  return seconds;
}

/** Accept only canonical HTTPS public YouTube watch or short URLs and construct a fixed embed origin. */
export function parseYouTubeEmbed(input) {
  const url = parseStrictUrl(input);
  const host = url.hostname.toLowerCase();
  let videoId; let startRaw = null;
  if (host === 'www.youtube.com' || host === 'youtube.com') {
    if (url.pathname !== '/watch') throw new ReferenceError('UNSUPPORTED_YOUTUBE_URL');
    for (const key of url.searchParams.keys()) if (!['v', 't', 'start'].includes(key)) throw new ReferenceError('UNSUPPORTED_YOUTUBE_PARAM');
    if (url.searchParams.getAll('v').length !== 1 || url.searchParams.getAll('t').length > 1 || url.searchParams.getAll('start').length > 1 || (url.searchParams.has('t') && url.searchParams.has('start'))) throw new ReferenceError('UNSUPPORTED_YOUTUBE_PARAM');
    videoId = url.searchParams.get('v');
    startRaw = url.searchParams.get('start') ?? url.searchParams.get('t');
  } else if (host === 'youtu.be') {
    if (!/^\/[A-Za-z0-9_-]{11}$/.test(url.pathname)) throw new ReferenceError('UNSUPPORTED_YOUTUBE_URL');
    for (const key of url.searchParams.keys()) if (key !== 't' && key !== 'start') throw new ReferenceError('UNSUPPORTED_YOUTUBE_PARAM');
    if (url.searchParams.getAll('t').length > 1 || url.searchParams.getAll('start').length > 1 || (url.searchParams.has('t') && url.searchParams.has('start'))) throw new ReferenceError('UNSUPPORTED_YOUTUBE_PARAM');
    videoId = url.pathname.slice(1);
    startRaw = url.searchParams.get('start') ?? url.searchParams.get('t');
  } else throw new ReferenceError('UNSUPPORTED_YOUTUBE_HOST');
  if (!VIDEO_ID.test(videoId ?? '')) throw new ReferenceError('INVALID_VIDEO_ID');
  const start = parseStart(startRaw);
  const embedUrl = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  if (start > 0) embedUrl.searchParams.set('start', String(start));
  return Object.freeze({ provider: 'youtube', videoId, startSeconds: start, embedUrl: embedUrl.href, autoplay: false });
}

function timestamp(value, code) {
  if (typeof value !== 'string' || value.length > 40) throw new ReferenceError(code);
  const time = Date.parse(value);
  if (!Number.isSafeInteger(time) || new Date(time).toISOString() !== value) throw new ReferenceError(code);
  return time;
}

export function createSourceCard(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ReferenceError('INVALID_CARD');
  const allowed = ['title', 'summary', 'originalUrl', 'provider', 'checkedAt', 'expiresAt', 'eligibility'];
  for (const key of Object.keys(input)) if (!allowed.includes(key)) throw new ReferenceError('UNKNOWN_FIELD');
  for (const key of allowed) if (!Object.hasOwn(input, key)) throw new ReferenceError('MISSING_FIELD');
  const title = text(input.title, MAX_TITLE_LENGTH, 'INVALID_TITLE');
  const summary = text(input.summary, MAX_SUMMARY_LENGTH, 'INVALID_SUMMARY');
  const originalUrl = validateOutwardReferenceUrl(input.originalUrl);
  const provider = text(input.provider, 40, 'INVALID_PROVIDER');
  if (!['youtube', 'web', 'search'].includes(provider)) throw new ReferenceError('INVALID_PROVIDER');
  const checkedAt = text(input.checkedAt, 40, 'INVALID_TIMESTAMP');
  const expiresAt = text(input.expiresAt, 40, 'INVALID_TIMESTAMP');
  const checkedMs = timestamp(checkedAt, 'INVALID_TIMESTAMP');
  const expiresMs = timestamp(expiresAt, 'INVALID_TIMESTAMP');
  if (expiresMs <= checkedMs) throw new ReferenceError('INVALID_EXPIRY');
  if (input.eligibility !== 'unknown') throw new ReferenceError('INVALID_ELIGIBILITY');
  return Object.freeze({ title, summary, originalUrl, provider, checkedAt, expiresAt, eligibility: 'unknown' });
}

/** Fresh metadata permits an open affordance; it never proves link availability or external eligibility. */
export function getSourceFreshness(card, now = Date.now()) {
  if (!Number.isSafeInteger(now)) return 'unknown';
  try {
    const validated = createSourceCard(card);
    const checked = timestamp(validated.checkedAt, 'INVALID_TIMESTAMP');
    const expires = timestamp(validated.expiresAt, 'INVALID_TIMESTAMP');
    if (checked > now || expires <= checked) return 'unknown';
    return now < expires ? 'current' : 'expired';
  } catch { return 'unknown'; }
}

export function canOpenSource(card, now = Date.now()) {
  return getSourceFreshness(card, now) === 'current';
}
