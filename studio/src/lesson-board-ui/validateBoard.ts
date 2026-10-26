import type { LessonBoardV1, SourceAnchorByElementId } from './types';

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/;
const REVISION = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const MAX_SLIDES = 12;
const MAX_ELEMENTS = 40;
const MAX_TEXT = 2400;
const MAX_TOTAL_TEXT = 24000;

export type Validation<T> = { ok: true; value: T } | { ok: false; reason: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max;
}

export function validateLessonBoard(value: unknown): Validation<LessonBoardV1> {
  if (!isRecord(value) || value.schema !== 'kairo.lesson-board' || value.version !== 1) {
    return { ok: false, reason: 'This board version is not supported.' };
  }
  if (!validString(value.lessonRevision, 128) || !REVISION.test(value.lessonRevision)) {
    return { ok: false, reason: 'The lesson revision is missing or invalid.' };
  }
  if (!validString(value.title, 200) || !Array.isArray(value.slides) || value.slides.length < 1 || value.slides.length > MAX_SLIDES) {
    return { ok: false, reason: 'The board title or slide count is invalid.' };
  }

  const ids = new Set<string>();
  let totalText = value.title.length;
  const slides: LessonBoardV1['slides'] = [];
  for (const candidate of value.slides) {
    if (!isRecord(candidate) || !validString(candidate.id, 96) || !ID.test(candidate.id) || ids.has(candidate.id)) {
      return { ok: false, reason: 'A slide identifier is invalid or repeated.' };
    }
    ids.add(candidate.id);
    if (!validString(candidate.heading, 200) || !Array.isArray(candidate.elements) || candidate.elements.length < 1 || candidate.elements.length > MAX_ELEMENTS) {
      return { ok: false, reason: 'A slide heading or element count is invalid.' };
    }
    const elements: LessonBoardV1['slides'][number]['elements'] = [];
    for (const element of candidate.elements) {
      if (!isRecord(element) || element.kind !== 'text' || !validString(element.id, 96) || !ID.test(element.id) || ids.has(element.id) || typeof element.text !== 'string' || element.text.length > MAX_TEXT) {
        return { ok: false, reason: 'A board element is invalid.' };
      }
      ids.add(element.id);
      totalText += element.text.length;
      if (totalText > MAX_TOTAL_TEXT) return { ok: false, reason: 'The board is larger than this editor supports.' };
      elements.push({ id: element.id, kind: 'text', text: element.text });
    }
    slides.push({ id: candidate.id, heading: candidate.heading, elements });
  }

  // Copy only the supported fields so unknown properties and rich HTML cannot cross the boundary.
  return { ok: true, value: { schema: 'kairo.lesson-board', version: 1, lessonRevision: value.lessonRevision, title: value.title, slides } };
}

export function validateSourceAnchors(value: unknown): Validation<SourceAnchorByElementId> {
  if (!isRecord(value)) return { ok: false, reason: 'Source links could not be checked.' };
  const anchors: Record<string, { label: string; sourceRevision: string; excerpt?: string }> = Object.create(null);
  for (const [elementId, candidate] of Object.entries(value)) {
    if (!ID.test(elementId) || !isRecord(candidate) || !validString(candidate.label, 120) || !validString(candidate.sourceRevision, 128) || !REVISION.test(candidate.sourceRevision)) {
      return { ok: false, reason: 'A source link is invalid.' };
    }
    if (candidate.excerpt !== undefined && (typeof candidate.excerpt !== 'string' || candidate.excerpt.length > 500)) {
      return { ok: false, reason: 'A source excerpt is too long.' };
    }
    anchors[elementId] = { label: candidate.label, sourceRevision: candidate.sourceRevision, ...(candidate.excerpt ? { excerpt: candidate.excerpt } : {}) };
  }
  return { ok: true, value: Object.freeze(anchors) };
}
