import { useEffect, useId, useRef } from 'react';
import './bundle-lesson-view.css';

const ID = /^[a-f0-9]{24}$/;
const SHA = /^[a-f0-9]{64}$/;
const PROVIDERS = new Set(['google', 'groq', 'openrouter', 'aiml']);
const RECORD_KEYS = new Set(['schemaVersion', 'id', 'createdAt', 'mode', 'sourceRefs', 'bundleRevision', 'evidence', 'title', 'objective', 'chapters', 'quiz', 'reviewWarning', 'provider', 'model']);
const REF_KEYS = new Set(['sourceId', 'revision']);
const EVIDENCE_KEYS = new Set(['id', 'sourceId', 'sourceRevision', 'title', 'locator', 'quote', 'start', 'end', 'edited']);
const CHAPTER_KEYS = new Set(['title', 'explanation', 'example', 'citationIds']);
const QUIZ_KEYS = new Set(['question', 'options', 'correct', 'explanation', 'citationIds', 'supportQuote']);

export type BundleSourceRef = { sourceId: string; revision: string };
export type BundleEvidence = { id: string; sourceId: string; sourceRevision: string; title: string; locator: string; quote: string; start: number; end: number; edited: boolean };
export type BundleChapter = { title: string; explanation: string; example: string; citationIds: string[] };
export type BundleQuiz = { question: string; options: string[]; correct: number; explanation: string; citationIds: string[]; supportQuote: string };
export type BundleLesson = { schemaVersion: 2; id: string; createdAt: string; mode: 'local-extractive-v2' | 'cloud-v2'; sourceRefs: BundleSourceRef[]; bundleRevision: string; evidence: BundleEvidence[]; title: string; objective: string; chapters: BundleChapter[]; quiz: BundleQuiz[]; reviewWarning: string; provider?: string; model?: string };
export type BundleLessonViewModel = { record: BundleLesson; missingCoverage: Array<{ kind: 'source-without-evidence'; sourceId: string } | { kind: 'evidence-not-cited'; evidenceId: string }> };

function invalid(reason: string): never { throw new TypeError(`This bundle lesson cannot be shown: ${reason}.`); }
function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(`${label} must be an object`);
  return value as Record<string, unknown>;
}
function exactKeys(value: Record<string, unknown>, allowed: Set<string>, label: string) {
  if (Object.keys(value).some(key => !allowed.has(key))) invalid(`${label} has unsupported fields`);
}
function text(value: unknown, label: string, max: number, trim = true): string {
  if (typeof value !== 'string' || value.length > max || (trim && !value.trim())) invalid(`${label} is invalid`);
  return value;
}
function citations(value: unknown, known: Map<string, BundleEvidence>, label: string): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 4) invalid(`${label} must name one to four evidence items`);
  const seen = new Set<string>();
  return value.map((id, index) => {
    if (typeof id !== 'string' || !known.has(id) || seen.has(id)) invalid(`${label}[${index}] is missing, unknown or repeated`);
    seen.add(id);
    return id;
  });
}

/** Parse presentation shape only. The owner and source revisions still require server verification on every read. */
export function parseBundleLessonView(record: unknown): BundleLessonViewModel {
  const raw = object(record, 'record');
  exactKeys(raw, RECORD_KEYS, 'record');
  if (raw.schemaVersion !== 2) invalid('only schema version 2 is supported');
  if (Object.hasOwn(raw, 'sourceId') || Object.hasOwn(raw, 'revision')) invalid('single-source v1 records cannot be coerced');
  if (typeof raw.id !== 'string' || !ID.test(raw.id)) invalid('record ID is invalid');
  if (typeof raw.createdAt !== 'string' || raw.createdAt.length > 40 || !Number.isFinite(Date.parse(raw.createdAt))) invalid('creation date is invalid');
  if (raw.mode !== 'local-extractive-v2' && raw.mode !== 'cloud-v2') invalid('record mode is unsupported');
  if (raw.mode === 'cloud-v2') {
    if (typeof raw.provider !== 'string' || !PROVIDERS.has(raw.provider)) invalid('provider metadata is unsupported');
    if (Object.hasOwn(raw, 'model') && (typeof raw.model !== 'string' || !raw.model.trim() || raw.model.length > 160)) invalid('model metadata is unsupported');
  } else if (Object.hasOwn(raw, 'provider') || Object.hasOwn(raw, 'model')) invalid('local records cannot include provider metadata');
  if (typeof raw.bundleRevision !== 'string' || !SHA.test(raw.bundleRevision)) invalid('bundle revision is invalid');
  if (!Array.isArray(raw.sourceRefs) || raw.sourceRefs.length < 1 || raw.sourceRefs.length > 8) invalid('one to eight selected source references are required');
  const refsSeen = new Set<string>();
  const sourceRefs = raw.sourceRefs.map((input, index): BundleSourceRef => {
    const ref = object(input, `sourceRefs[${index}]`); exactKeys(ref, REF_KEYS, `sourceRefs[${index}]`);
    if (typeof ref.sourceId !== 'string' || !ID.test(ref.sourceId) || typeof ref.revision !== 'string' || !SHA.test(ref.revision) || refsSeen.has(ref.sourceId)) invalid(`sourceRefs[${index}] is malformed or duplicated`);
    refsSeen.add(ref.sourceId);
    return { sourceId: ref.sourceId, revision: ref.revision };
  });
  if (!Array.isArray(raw.evidence) || raw.evidence.length < 1 || raw.evidence.length > 12) invalid('evidence count is out of bounds');
  const evidenceIds = new Set<string>(); let quoteCharacters = 0;
  const evidence = raw.evidence.map((input, index): BundleEvidence => {
    const item = object(input, `evidence[${index}]`); exactKeys(item, EVIDENCE_KEYS, `evidence[${index}]`);
    const ref = sourceRefs.find(candidate => candidate.sourceId === item.sourceId);
    if (typeof item.id !== 'string' || !item.id.trim() || item.id.length > 150 || evidenceIds.has(item.id) || !ref || item.sourceRevision !== ref.revision ||
      typeof item.start !== 'number' || !Number.isSafeInteger(item.start) || item.start < 0 || typeof item.end !== 'number' || !Number.isSafeInteger(item.end) || item.end <= item.start ||
      typeof item.quote !== 'string' || !item.quote.trim() || item.end - item.start !== item.quote.length || typeof item.edited !== 'boolean') invalid(`evidence[${index}] has a mismatched source, offset or identity`);
    evidenceIds.add(item.id); quoteCharacters += item.quote.length;
    return { id: item.id, sourceId: item.sourceId as string, sourceRevision: item.sourceRevision as string, title: text(item.title, 'evidence title', 120), locator: text(item.locator, 'evidence locator', 500), quote: item.quote as string, start: item.start as number, end: item.end as number, edited: item.edited as boolean };
  });
  if (quoteCharacters > 12000) invalid('evidence text exceeds the record limit');
  const evidenceById = new Map(evidence.map(item => [item.id, item]));
  const title = text(raw.title, 'title', 120), objective = text(raw.objective, 'objective', 350);
  if (!Array.isArray(raw.chapters) || raw.chapters.length < 2 || raw.chapters.length > 5) invalid('two to five chapters are required');
  const chapterEvidence = new Set<string>();
  const chapters = raw.chapters.map((input, index): BundleChapter => {
    const chapter = object(input, `chapters[${index}]`); exactKeys(chapter, CHAPTER_KEYS, `chapters[${index}]`);
    const citationIds = citations(chapter.citationIds, evidenceById, `chapters[${index}].citationIds`);
    citationIds.forEach(id => chapterEvidence.add(id));
    return { title: text(chapter.title, 'chapter title', 100), explanation: text(chapter.explanation, 'chapter explanation', 1300), example: text(chapter.example, 'chapter example', 900), citationIds };
  });
  if (!Array.isArray(raw.quiz) || raw.quiz.length < 1 || raw.quiz.length > 4) invalid('one to four read-only practice prompts are required');
  const quiz = raw.quiz.map((input, index): BundleQuiz => {
    const item = object(input, `quiz[${index}]`); exactKeys(item, QUIZ_KEYS, `quiz[${index}]`);
    const citationIds = citations(item.citationIds, evidenceById, `quiz[${index}].citationIds`);
    const options = item.options;
    if (!Array.isArray(options) || options.length !== 4) invalid(`quiz[${index}] must have four choices`);
    const safeOptions = options.map((option, i) => text(option, `quiz[${index}].options[${i}]`, 350));
    if (new Set(safeOptions).size !== 4 || typeof item.correct !== 'number' || !Number.isInteger(item.correct) || item.correct < 0 || item.correct > 3) invalid(`quiz[${index}] choices are malformed`);
    const supportQuote = text(item.supportQuote, 'quiz support quote', 700);
    if (!citationIds.some(id => evidenceById.get(id)!.quote.includes(supportQuote))) invalid(`quiz[${index}] has no exact cited support`);
    return { question: text(item.question, 'quiz question', 450), options: safeOptions, correct: item.correct, explanation: text(item.explanation, 'quiz explanation', 900), citationIds, supportQuote };
  });
  const reviewWarning = text(raw.reviewWarning, 'review warning', 500);
  const parsedRecord: BundleLesson = { schemaVersion: 2, id: raw.id, createdAt: raw.createdAt, mode: raw.mode, sourceRefs, bundleRevision: raw.bundleRevision, evidence, title, objective, chapters, quiz, reviewWarning };
  if (raw.mode === 'cloud-v2') { parsedRecord.provider = raw.provider as string; if (Object.hasOwn(raw, 'model')) parsedRecord.model = raw.model as string; }
  const missingCoverage: BundleLessonViewModel['missingCoverage'] = [];
  for (const ref of sourceRefs) if (!evidence.some(item => item.sourceId === ref.sourceId)) missingCoverage.push({ kind: 'source-without-evidence', sourceId: ref.sourceId });
  for (const item of evidence) if (!chapterEvidence.has(item.id)) missingCoverage.push({ kind: 'evidence-not-cited', evidenceId: item.id });
  return { record: parsedRecord, missingCoverage };
}

/** Guard explicit read controls so only chapters parsed from the current record can be narrated. */
export function createBundleLessonViewActions(chapters: BundleChapter[], onRead: (text: string) => void) {
  const allowed = new Set(chapters);
  return { readChapter(chapter: BundleChapter) { if (!allowed.has(chapter)) return false; onRead(`${chapter.title}. ${chapter.explanation} ${chapter.example}`); return true; } };
}

export default function BundleLessonView({ record, onRead, onStop }: { record: unknown; onRead: (text: string) => void; onStop: () => void }) {
  let parsed: BundleLessonViewModel | null = null, error = '';
  try { parsed = parseBundleLessonView(record); } catch (reason) { error = reason instanceof Error ? reason.message : 'This lesson record is invalid.'; }
  const identity = parsed ? `${parsed.record.id}:${parsed.record.bundleRevision}` : 'invalid-record';
  const instanceId = useId().replace(/:/g, '');
  const stopRef = useRef(onStop); stopRef.current = onStop;
  useEffect(() => () => stopRef.current(), [identity]);
  if (!parsed) return <section className="blv" role="alert" aria-label="Lesson unavailable"><h2>Lesson cannot be shown</h2><p>{error}</p><p>Return to My material and reopen the selected reviewed sources.</p></section>;
  const { record: lesson, missingCoverage } = parsed;
  const actions = createBundleLessonViewActions(lesson.chapters, onRead);
  return <article className="blv" aria-labelledby={`blv-title-${instanceId}`}>
    <header><p className="blv-eyebrow">Multi-source lesson · read-only view</p><h2 id={`blv-title-${instanceId}`}>{lesson.title}</h2><p>{lesson.objective}</p><p className="blv-caveat">{lesson.reviewWarning} The server must verify ownership and every source revision whenever this record is read.</p></header>
    <section aria-labelledby="blv-sources"><h3 id="blv-sources">Selected sources</h3><ul className="blv-sources">{lesson.sourceRefs.map(ref => <li key={ref.sourceId}><code>{ref.sourceId}</code><span>Revision <code>{ref.revision}</code></span></li>)}</ul></section>
    {missingCoverage.length > 0 && <aside className="blv-warning" role="status"><strong>Some selected material is not covered in the lesson.</strong><ul>{missingCoverage.map(item => <li key={`${item.kind}:${'sourceId' in item ? item.sourceId : item.evidenceId}`}>{item.kind === 'source-without-evidence' ? `No cited evidence was selected from source ${item.sourceId}.` : `Evidence ${item.evidenceId} is not cited by a chapter.`}</li>)}</ul></aside>}
    <section aria-label="Lesson chapters">{lesson.chapters.map((chapter, index) => <section className="blv-chapter" key={`${index}:${chapter.title}`}><h3>{chapter.title}</h3><p>{chapter.explanation}</p><p><strong>Try this:</strong> {chapter.example}</p><p className="blv-citation-links">Cited evidence: {chapter.citationIds.map(id => <a key={id} href={`#blv-evidence-${instanceId}-${encodeURIComponent(id)}`}>{id}</a>)}</p><button type="button" onClick={() => actions.readChapter(chapter)}>Read this chapter with KAIRO</button></section>)}</section>
    <section aria-labelledby={`blv-evidence-${instanceId}`}><h3 id={`blv-evidence-${instanceId}`}>Exact source excerpts</h3>{lesson.evidence.map(item => <article className="blv-evidence" id={`blv-evidence-${instanceId}-${encodeURIComponent(item.id)}`} key={item.id}><h4>{item.title}</h4><p>{item.locator} · {item.start}–{item.end}{item.edited ? ' · reviewed text edited' : ''}</p><blockquote>{item.quote}</blockquote><p className="blv-citation-links">Source ID <code>{item.sourceId}</code> · Revision <code>{item.sourceRevision}</code></p></article>)}</section>
    <section aria-label="Read-only practice prompts"><h3>Practice prompts</h3><p>This view does not submit answers or record a score.</p>{lesson.quiz.map((item, index) => <article className="blv-prompt" key={index}><h4>{item.question}</h4><ol type="A">{item.options.map((option, i) => <li key={i}>{option}</li>)}</ol><p>{item.explanation}</p><p>Source anchor: <q>{item.supportQuote}</q></p></article>)}</section>
  </article>;
}
