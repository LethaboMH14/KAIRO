import type { Chapter, Lesson, Question } from '../workspace/types';
import type { DraftAction, DraftBlock, LessonDraft } from './types';

const ID24 = /^[a-f0-9]{24}$/i;
const BLOCK_ID = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,95}$/;
const LAYOUTS = new Set(['reading', 'split', 'practice']);
const KINDS = new Set(['explanation', 'worked-example', 'question', 'reflection']);
const ORIGINS = new Set(['source', 'generated', 'authored']);
const ROOT_KEYS = ['schemaVersion', 'lessonId', 'sourceId', 'sourceRevision', 'title', 'layout', 'blocks'];
const BLOCK_KEYS = ['id', 'kind', 'title', 'text', 'citationIds', 'origin', 'question'];
const QUESTION_KEYS = ['options', 'correct', 'supportQuote'];

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be an object.`);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new TypeError(`${label} has an unsupported field: ${key}.`);
}

function boundedText(value: unknown, max: number, label: string, allowEmpty = false): string {
  if (typeof value !== 'string' || value.length > max || (!allowEmpty && !value.trim())) {
    throw new TypeError(`${label} must be ${allowEmpty ? 'at most' : '1–'}${max} characters.`);
  }
  return value;
}

function copyQuestion(question: Question): DraftBlock['question'] {
  return { options: [...question.options], correct: question.correct, supportQuote: question.supportQuote };
}

function teaching(kind: DraftBlock['kind']): boolean {
  return kind === 'explanation' || kind === 'worked-example';
}

function assertLessonIdentity(lesson: Lesson): void {
  if (!ID24.test(lesson.id) || !ID24.test(lesson.sourceId)) throw new TypeError('Lesson and source IDs must be 24 hexadecimal characters.');
  if (typeof lesson.revision !== 'string' || !lesson.revision) throw new TypeError('Lesson source revision is required.');
}

function citationSet(lesson: Lesson): Set<string> {
  return new Set(lesson.evidence.map(item => item.id));
}

function isLiteralEvidence(text: string, citationIds: string[], lesson: Lesson): boolean {
  return citationIds.some(id => lesson.evidence.some(evidence => evidence.id === id && evidence.quote.includes(text)));
}

function nativeOrigin(text: string, citationIds: string[], lesson: Lesson): DraftBlock['origin'] {
  return isLiteralEvidence(text, citationIds, lesson) ? 'source' : 'generated';
}

export function draftFromLesson(lesson: Lesson): LessonDraft {
  assertLessonIdentity(lesson);
  const blocks: DraftBlock[] = [];
  lesson.chapters.forEach((chapter, index) => {
    const refs = [...chapter.citationIds];
    blocks.push({ id: `chapter-${index}-explanation`, kind: 'explanation', title: chapter.title, text: chapter.explanation, citationIds: refs, origin: nativeOrigin(chapter.explanation, refs, lesson) });
    blocks.push({ id: `chapter-${index}-worked-example`, kind: 'worked-example', title: chapter.title, text: chapter.example, citationIds: [...refs], origin: nativeOrigin(chapter.example, refs, lesson) });
  });
  lesson.quiz.forEach((question, index) => blocks.push({
    id: `question-${index}`, kind: 'question', title: `Practice question ${index + 1}`, text: question.question,
    citationIds: [...question.citationIds], origin: nativeOrigin(question.question, question.citationIds, lesson), question: copyQuestion(question),
  }));
  return { schemaVersion: 1, lessonId: lesson.id, sourceId: lesson.sourceId, sourceRevision: lesson.revision, title: lesson.title, layout: 'reading', blocks };
}

export function validateDraft(value: unknown, lesson: Lesson): LessonDraft {
  assertLessonIdentity(lesson);
  const raw = record(value, 'Draft');
  exactKeys(raw, ROOT_KEYS, 'Draft');
  if (raw.schemaVersion !== 1 || raw.lessonId !== lesson.id || raw.sourceId !== lesson.sourceId || raw.sourceRevision !== lesson.revision) {
    throw new TypeError('Draft lesson, source, revision or schema does not match the native lesson.');
  }
  const title = boundedText(raw.title, 120, 'Draft title');
  if (typeof raw.layout !== 'string' || !LAYOUTS.has(raw.layout)) throw new TypeError('Draft layout is unsupported.');
  if (!Array.isArray(raw.blocks) || raw.blocks.length > 40) throw new TypeError('Draft must contain at most 40 blocks.');

  const knownCitations = citationSet(lesson);
  const seen = new Set<string>();
  const blocks = raw.blocks.map((unknownBlock, index): DraftBlock => {
    const block = record(unknownBlock, `Block ${index + 1}`);
    exactKeys(block, BLOCK_KEYS, `Block ${index + 1}`);
    if (typeof block.id !== 'string' || !BLOCK_ID.test(block.id) || seen.has(block.id)) throw new TypeError(`Block ${index + 1} has an invalid or duplicate ID.`);
    seen.add(block.id);
    if (typeof block.kind !== 'string' || !KINDS.has(block.kind)) throw new TypeError(`Block ${index + 1} has an unsupported kind.`);
    if (typeof block.origin !== 'string' || !ORIGINS.has(block.origin)) throw new TypeError(`Block ${index + 1} has an unsupported origin.`);
    const blockTitle = boundedText(block.title, 120, `Block ${index + 1} title`);
    const text = boundedText(block.text, 2400, `Block ${index + 1} text`, block.kind === 'reflection');
    if (!Array.isArray(block.citationIds) || block.citationIds.length > 4 || ((teaching(block.kind as DraftBlock['kind']) || block.kind === 'question') && block.citationIds.length < 1)) {
      throw new TypeError(`Block ${index + 1} must have 1–4 citations when it teaches.`);
    }
    const ids = block.citationIds.map(id => {
      if (typeof id !== 'string' || !knownCitations.has(id)) throw new TypeError(`Block ${index + 1} cites evidence outside this lesson.`);
      return id;
    });
    if (new Set(ids).size !== ids.length) throw new TypeError(`Block ${index + 1} has duplicate citations.`);

    const chapterMatch = block.id.match(/^chapter-(\d+)-(explanation|worked-example)(?:~[A-Za-z0-9][A-Za-z0-9._:-]{0,63})*$/);
    if (chapterMatch) {
      const chapterIndex = Number(chapterMatch[1]);
      const nativeChapter = lesson.chapters[chapterIndex];
      if (!nativeChapter || block.kind !== chapterMatch[2] || ids.length !== nativeChapter.citationIds.length || ids.some((id, i) => id !== nativeChapter.citationIds[i])) {
        throw new TypeError(`Block ${block.id} changed its native chapter or citation mapping.`);
      }
    } else if (block.kind !== 'question' && (block.kind !== 'reflection' || block.origin !== 'authored' || ids.length !== 0)) {
      throw new TypeError(`Block ${block.id} has no native chapter mapping.`);
    }

    let question: DraftBlock['question'];
    if (block.kind === 'question') {
      if (!/^question-\d+$/.test(block.id)) throw new TypeError('Question blocks must keep their stable native question ID.');
      const native = lesson.quiz[Number(block.id.slice('question-'.length))];
      if (!native) throw new TypeError('Question block does not map to a native question.');
      if (text !== native.question || ids.length !== native.citationIds.length || ids.some((id, i) => id !== native.citationIds[i])) {
        throw new TypeError(`Question ${block.id} changed its native prompt or citation mapping.`);
      }
      const rawQuestion = record(block.question, `Question block ${block.id}`);
      exactKeys(rawQuestion, QUESTION_KEYS, `Question block ${block.id}`);
      if (!Array.isArray(rawQuestion.options) || rawQuestion.options.length !== native.options.length ||
          rawQuestion.options.some((option, i) => option !== native.options[i]) || rawQuestion.correct !== native.correct || rawQuestion.supportQuote !== native.supportQuote) {
        throw new TypeError(`Question ${block.id} changed its native options, answer key or source anchor.`);
      }
      question = copyQuestion(native);
    } else if (block.question !== undefined) {
      throw new TypeError(`Non-question block ${block.id} cannot contain a question payload.`);
    }
    let expectedOrigin: DraftBlock['origin'];
    if (chapterMatch) {
      const nativeChapter = lesson.chapters[Number(chapterMatch[1])];
      const nativeText = block.kind === 'explanation' ? nativeChapter.explanation : nativeChapter.example;
      expectedOrigin = block.id.includes('~') || blockTitle !== nativeChapter.title || text !== nativeText ? 'authored' : nativeOrigin(nativeText, ids, lesson);
    } else if (block.kind === 'question') {
      const nativeQuestion = lesson.quiz[Number(block.id.slice('question-'.length))];
      expectedOrigin = blockTitle !== `Practice question ${Number(block.id.slice('question-'.length)) + 1}` ? 'authored' : nativeOrigin(text, ids, lesson);
      if (text !== nativeQuestion.question) throw new TypeError(`Question ${block.id} changed its native prompt.`);
    } else {
      expectedOrigin = 'authored';
    }
    if (block.origin !== expectedOrigin) throw new TypeError(`Block ${block.id} provenance does not match its native content.`);
    return { id: block.id, kind: block.kind as DraftBlock['kind'], title: blockTitle, text, citationIds: ids, origin: block.origin as DraftBlock['origin'], ...(question ? { question } : {}) };
  });

  if (!blocks.some(block => teaching(block.kind))) throw new TypeError('A draft must retain at least one teaching block.');
  const draft: LessonDraft = { schemaVersion: 1, lessonId: lesson.id, sourceId: lesson.sourceId, sourceRevision: lesson.revision, title, layout: raw.layout as LessonDraft['layout'], blocks };
  if (new TextEncoder().encode(JSON.stringify(draft)).byteLength > 128 * 1024) throw new TypeError('Draft exceeds the 128 KiB limit.');
  return draft;
}

function cloneDraft(draft: LessonDraft): LessonDraft {
  return { ...draft, blocks: draft.blocks.map(block => ({ ...block, citationIds: [...block.citationIds], ...(block.question ? { question: { ...block.question, options: [...block.question.options] } } : {}) })) };
}

function assertDraftResources(draft: LessonDraft): void {
  if (draft.blocks.length > 40) throw new TypeError('Draft must contain at most 40 blocks.');
  if (new TextEncoder().encode(JSON.stringify(draft)).byteLength > 128 * 1024) throw new TypeError('Draft exceeds the 128 KiB limit.');
}

export function editDraft(draft: LessonDraft, action: DraftAction): LessonDraft {
  const rawAction = record(action, 'Action');
  if (typeof rawAction.kind !== 'string') throw new TypeError('Draft action kind is required.');
  const actionFields: Record<string, string[]> = {
    edit: ['kind', 'id', 'patch'], move: ['kind', 'id', 'direction'], remove: ['kind', 'id'],
    'add-reflection': ['kind', 'id'], split: ['kind', 'id', 'newId', 'offset'], layout: ['kind', 'layout'], title: ['kind', 'title'],
  };
  const allowedActionFields = actionFields[rawAction.kind];
  if (!allowedActionFields) throw new TypeError('Draft action is unsupported.');
  exactKeys(rawAction, allowedActionFields, 'Draft action');
  const next = cloneDraft(draft);
  if (action.kind === 'title') {
    next.title = boundedText(action.title, 120, 'Draft title');
  } else if (action.kind === 'layout') {
    if (!LAYOUTS.has(action.layout)) throw new TypeError('Draft layout is unsupported.');
    next.layout = action.layout;
  } else if (action.kind === 'add-reflection') {
    if (next.blocks.length >= 40) throw new TypeError('Draft must contain at most 40 blocks.');
    if (!BLOCK_ID.test(action.id) || next.blocks.some(block => block.id === action.id)) throw new TypeError('Reflection block ID is invalid or already used.');
    next.blocks.push({ id: action.id, kind: 'reflection', title: 'Your reflection', text: '', citationIds: [], origin: 'authored' });
  } else {
    const index = next.blocks.findIndex(block => block.id === action.id);
    if (index < 0) throw new TypeError('Draft block was not found.');
    const block = next.blocks[index];
    if (action.kind === 'edit') {
      const patch = record(action.patch, 'Edit patch');
      exactKeys(patch, ['title', 'text'], 'Edit patch');
      if (patch.title !== undefined) block.title = boundedText(patch.title, 120, 'Block title');
      if (patch.text !== undefined) {
        if (block.kind === 'question') throw new TypeError('Question wording is fixed to its native scored prompt.');
        block.text = boundedText(patch.text, 2400, 'Block text', block.kind === 'reflection');
      }
      if (patch.title !== undefined || patch.text !== undefined) block.origin = 'authored';
    } else if (action.kind === 'move') {
      if (action.direction !== -1 && action.direction !== 1) throw new TypeError('Move direction must be -1 or 1.');
      const target = Math.max(0, Math.min(next.blocks.length - 1, index + action.direction));
      if (target !== index) [next.blocks[index], next.blocks[target]] = [next.blocks[target], next.blocks[index]];
    } else if (action.kind === 'remove') {
      const remaining = next.blocks.filter((_, i) => i !== index);
      if (!remaining.some(item => teaching(item.kind))) throw new TypeError('The last teaching block cannot be removed.');
      next.blocks = remaining;
    } else if (action.kind === 'split') {
      if (next.blocks.length >= 40) throw new TypeError('Draft must contain at most 40 blocks.');
      if (block.kind !== 'explanation' && block.kind !== 'worked-example') throw new TypeError('Only explanations and worked examples can be split.');
      if (!BLOCK_ID.test(action.newId) || action.newId.includes('~') || next.blocks.some(item => item.id === action.newId || item.id.endsWith(`~${action.newId}`))) throw new TypeError('Split block ID is invalid or already used.');
      if (!Number.isInteger(action.offset) || action.offset < 1 || action.offset >= block.text.length) throw new TypeError('Split position must be inside the block text.');
      const first = block.text.slice(0, action.offset).trim();
      const second = block.text.slice(action.offset).trim();
      if (!first || !second) throw new TypeError('Both split blocks must contain text.');
      block.text = first;
      block.origin = 'authored';
      const childId = `${block.id}~${action.newId}`;
      if (!BLOCK_ID.test(childId)) throw new TypeError('Split block ID exceeds the stable ID limit.');
      next.blocks.splice(index + 1, 0, { ...block, id: childId, title: block.title, text: second, citationIds: [...block.citationIds], origin: 'authored' });
    }
  }
  assertDraftResources(next);
  return next;
}

function projectChapters(blocks: DraftBlock[]): Chapter[] {
  return blocks
    .filter(block => block.kind === 'explanation' || block.kind === 'worked-example')
    .map(block => ({ title: block.title, explanation: block.text, example: '', citationIds: [...block.citationIds] }));
}

function isNativeChapterSequence(blocks: DraftBlock[], lesson: Lesson): boolean {
  const teachingBlocks = blocks.filter(block => block.kind === 'explanation' || block.kind === 'worked-example');
  const expected = lesson.chapters.flatMap((chapter, index) => [
    { id: `chapter-${index}-explanation`, kind: 'explanation', title: chapter.title, text: chapter.explanation, citationIds: chapter.citationIds },
    { id: `chapter-${index}-worked-example`, kind: 'worked-example', title: chapter.title, text: chapter.example, citationIds: chapter.citationIds },
  ]);
  return teachingBlocks.length === expected.length && teachingBlocks.every((block, index) => {
    const native = expected[index];
    return block.id === native.id && block.kind === native.kind && block.title === native.title && block.text === native.text &&
      block.citationIds.length === native.citationIds.length && block.citationIds.every((id, i) => id === native.citationIds[i]);
  });
}

export function draftToLesson(draft: LessonDraft, lesson: Lesson): Lesson {
  const checked = validateDraft(draft, lesson);
  const questions = new Map(lesson.quiz.map((question, index) => [`question-${index}`, question]));
  const quiz = checked.blocks.filter(block => block.kind === 'question').map(block => {
    const original = questions.get(block.id)!;
    return { ...original, options: [...original.options], citationIds: [...original.citationIds] };
  });
  return {
    ...lesson,
    title: checked.title,
    chapters: isNativeChapterSequence(checked.blocks, lesson)
      ? lesson.chapters.map(chapter => ({ ...chapter, citationIds: [...chapter.citationIds] }))
      : projectChapters(checked.blocks),
    quiz,
    evidence: lesson.evidence.map(item => ({ ...item })),
  };
}
