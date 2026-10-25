/** Pure, source-aware preparation of a reading and practice sequence.
 * This package does not fetch sources, save progress, score learning, or call KAIRO.
 */

export type LessonPlanInput = {
  lessonId: string;
  sourceId: string;
  revision: string;
  title: string;
  objective: string;
  chapters: Array<{ title: string; explanation: string; example: string; citationIds: string[] }>;
  evidence: Array<{ id: string; quote: string; locator: string }>;
  quiz: Array<{
    question: string;
    options: string[];
    correct: number;
    explanation: string;
    citationIds: string[];
    supportQuote: string;
  }>;
};

export type LessonReadiness = {
  title: string;
  objective: string;
  chapterCount: number;
  questionCount: number;
  estimatedMinutes: number | null;
  estimateBasis: string;
  sourceState: 'reviewed' | 'changed' | 'unavailable';
  capability: 'source-reading' | 'prepared-interactive';
  savedStep: number | null;
  saving: 'device' | 'session-only' | 'unavailable';
  notices: string[];
};

export type LessonPlanStep = {
  kind: 'read' | 'worked-example' | 'self-explain' | 'check' | 'reflect';
  title: string;
  prompt: string;
  citationIds: string[];
};

export type LessonPlan = { summary: LessonReadiness; steps: LessonPlanStep[]; warnings: string[] };
export type SourceContext = { sourceId: string; revision: string; reviewed: boolean };

const WORDS_PER_MINUTE = 200;
const MAX_CHAPTER_WORDS = 300;
const VAGUE_OBJECTIVE = /\b(understand|learn about|know about|get familiar with)\b/i;
const OPEN_REASONING = /\b(explain|why|describe|reflect|justify|how would|in your own words)\b/i;
const CALCULATION = /\b(calculate|compute|solve|determine|work out)\b/i;
const RECOGNITION = /\b(which passage|which statement|according to (the )?(source|passage)|appears in|is mentioned in)\b/i;
const PROMPT_LIKE_EXAMPLE = /^(try\b|explain\b|connect\b|identify\b|what would you|in your own words\b)|\b(your studies|your work|in your own words|check your explanation)\b/i;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requiredText(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim() !== value || value.length === 0) {
    throw new TypeError(`${name} must be a non-empty, trimmed string.`);
  }
  return value;
}

function countWords(text: string): number {
  return (text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? []).length;
}

function uniqueInOrder(values: string[]): string[] {
  return [...new Set(values)];
}

function classifyQuestion(question: string, options: string[]): 'recognition' | 'calculation' | 'open-reflection' | 'recall' {
  if (options.length < 2 && OPEN_REASONING.test(question)) return 'open-reflection';
  if (CALCULATION.test(question)) return 'calculation';
  if (RECOGNITION.test(question)) return 'recognition';
  if (OPEN_REASONING.test(question)) return 'open-reflection';
  return 'recall';
}

/** Validate source identity/citations and normalize only by copying; never repairs malformed data. */
export function validateLessonPlanInput(value: unknown): LessonPlanInput {
  if (!isObject(value)) throw new TypeError('Lesson must be an object.');
  const lessonId = requiredText(value.lessonId, 'lessonId');
  const sourceId = requiredText(value.sourceId, 'sourceId');
  const revision = requiredText(value.revision, 'revision');
  if (value.title !== undefined && typeof value.title !== 'string') throw new TypeError('title must be text.');
  if (value.objective !== undefined && typeof value.objective !== 'string') throw new TypeError('objective must be text.');
  const title = typeof value.title === 'string' ? value.title : '';
  const objective = typeof value.objective === 'string' ? value.objective : '';
  if (!Array.isArray(value.chapters) || value.chapters.length === 0) throw new TypeError('Lesson must contain at least one chapter.');
  if (!Array.isArray(value.evidence)) throw new TypeError('Lesson evidence must be an array.');
  if (!Array.isArray(value.quiz)) throw new TypeError('Lesson quiz must be an array.');

  const evidence = value.evidence.map((entry, index) => {
    if (!isObject(entry)) throw new TypeError(`Evidence ${index + 1} must be an object.`);
    const id = requiredText(entry.id, `Evidence ${index + 1} id`);
    const quote = requiredText(entry.quote, `Evidence ${id} quote`);
    const locator = requiredText(entry.locator, `Evidence ${id} locator`);
    return { id, quote, locator };
  });
  const known = new Set<string>();
  for (const entry of evidence) {
    if (known.has(entry.id)) throw new TypeError(`Duplicate evidence identity: ${entry.id}.`);
    known.add(entry.id);
  }

  const parseCitations = (raw: unknown, label: string): string[] => {
    if (!Array.isArray(raw) || raw.some(id => typeof id !== 'string' || id.trim() !== id || id.length === 0)) {
      throw new TypeError(`${label} citations must be non-empty strings.`);
    }
    for (const id of raw as string[]) if (!known.has(id)) throw new TypeError(`${label} cites unknown evidence: ${id}. Add the exact source anchor or remove the invalid citation.`);
    return [...raw] as string[];
  };

  const chapters = value.chapters.map((entry, index) => {
    if (!isObject(entry)) throw new TypeError(`Chapter ${index + 1} must be an object.`);
    if (typeof entry.title !== 'string' || typeof entry.explanation !== 'string' || typeof entry.example !== 'string') {
      throw new TypeError(`Chapter ${index + 1} text fields must be strings.`);
    }
    return {
      title: entry.title,
      explanation: entry.explanation,
      example: entry.example,
      citationIds: parseCitations(entry.citationIds, `Chapter ${index + 1}`),
    };
  });

  const quiz = value.quiz.map((entry, index) => {
    if (!isObject(entry)) throw new TypeError(`Question ${index + 1} must be an object.`);
    if (typeof entry.question !== 'string' || !Array.isArray(entry.options) || entry.options.some(option => typeof option !== 'string') ||
      typeof entry.explanation !== 'string' || typeof entry.supportQuote !== 'string' ||
      !(typeof entry.correct === 'number' || entry.correct === null)) {
      throw new TypeError(`Question ${index + 1} has malformed fields.`);
    }
    const citationIds = parseCitations(entry.citationIds, `Question ${index + 1}`);
    const supportQuote = entry.supportQuote;
    if (supportQuote && citationIds.length && !citationIds.some(id => evidence.find(item => item.id === id)!.quote.includes(supportQuote))) {
      throw new TypeError(`Question ${index + 1} supportQuote is not an exact anchor in its cited evidence.`);
    }
    return {
      question: entry.question,
      options: [...entry.options] as string[],
      correct: entry.correct as number,
      explanation: entry.explanation,
      citationIds,
      supportQuote,
    };
  });

  return { lessonId, sourceId, revision, title, objective, chapters, evidence, quiz };
}

/** Adapt the existing workspace Lesson identity without mutating its native record. */
export function toLessonPlanInput(value: unknown): LessonPlanInput {
  if (!isObject(value)) throw new TypeError('Lesson must be an object.');
  const hasId = Object.hasOwn(value, 'id');
  const hasLessonId = Object.hasOwn(value, 'lessonId');
  if (hasId && (typeof value.id !== 'string' || value.id.trim() !== value.id || value.id.length === 0)) {
    throw new TypeError('id must be a non-empty, trimmed string.');
  }
  if (hasLessonId && (typeof value.lessonId !== 'string' || value.lessonId.trim() !== value.lessonId || value.lessonId.length === 0)) {
    throw new TypeError('lessonId must be a non-empty, trimmed string.');
  }
  if (hasId && hasLessonId && value.id !== value.lessonId) {
    throw new TypeError('Lesson id and lessonId do not match.');
  }
  if (!hasId && !hasLessonId) throw new TypeError('Lesson must include id or lessonId.');
  return validateLessonPlanInput({ ...value, lessonId: hasLessonId ? value.lessonId : value.id });
}

function validSourceContext(value: unknown): value is SourceContext {
  return isObject(value) && typeof value.sourceId === 'string' && value.sourceId.trim() === value.sourceId && value.sourceId.length > 0 &&
    typeof value.revision === 'string' && value.revision.trim() === value.revision && value.revision.length > 0 && typeof value.reviewed === 'boolean';
}

/** Build an explainable sequence only when the explicit source context matches the lesson. */
export function buildLessonPlan(lessonValue: unknown, sourceContext: unknown): LessonPlan {
  const lesson = validateLessonPlanInput(lessonValue);
  const context = validSourceContext(sourceContext) ? sourceContext : null;
  const sourceState: LessonReadiness['sourceState'] = !context || !context.reviewed
    ? 'unavailable'
    : context.sourceId !== lesson.sourceId || context.revision !== lesson.revision ? 'changed' : 'reviewed';

  const warnings: string[] = [];
  if (!lesson.title.trim()) warnings.push('Add a plain lesson title before starting.');
  if (!lesson.objective.trim()) warnings.push('Add one observable learner action to the objective.');
  else if (VAGUE_OBJECTIVE.test(lesson.objective)) warnings.push('Make the goal observable: say what the learner can explain, compare, calculate or apply.');
  lesson.chapters.forEach((chapter, index) => {
    if (!chapter.title.trim()) warnings.push(`Chapter ${index + 1} needs a clear title.`);
    if (!chapter.explanation.trim()) warnings.push(`Chapter ${index + 1} needs an explanation before it can be read.`);
    if (!chapter.citationIds.length) warnings.push(`Chapter ${index + 1} has no source anchor; add a citation before relying on this explanation.`);
    if (countWords(chapter.explanation) > MAX_CHAPTER_WORDS) warnings.push(`Chapter ${index + 1} is long; split it into shorter reading chunks.`);
    if (!chapter.example.trim()) warnings.push(`Chapter ${index + 1} has no example or learner action.`);
    else if (PROMPT_LIKE_EXAMPLE.test(chapter.example.trim())) warnings.push(`Chapter ${index + 1} example is a learner prompt, not a verified worked example.`);
    if (new Set(chapter.citationIds).size !== chapter.citationIds.length) warnings.push(`Chapter ${index + 1} repeats a citation ID; keep each source anchor once.`);
  });
  lesson.quiz.forEach((question, index) => {
    if (!question.question.trim()) warnings.push(`Question ${index + 1} needs a question. No check step was added.`);
    if (!question.citationIds.length || !question.supportQuote.trim()) warnings.push(`Question ${index + 1} has no exact supporting source anchor. No check step was added.`);
    if (question.options.length !== 4 || new Set(question.options).size !== question.options.length ||
      !Number.isInteger(question.correct) || question.correct < 0 || question.correct >= question.options.length) {
      warnings.push(`Question ${index + 1} has invalid choices or answer position. No check step was added.`);
    }
    if (OPEN_REASONING.test(question.question)) warnings.push(`Question ${index + 1} uses open-reasoning wording; supplied answer choices do not capture an independently explained response.`);
  });

  const readableText = [lesson.title, lesson.objective,
    ...lesson.chapters.flatMap(chapter => [chapter.title, chapter.explanation]),
    ...lesson.evidence.filter(entry => lesson.chapters.some(chapter => chapter.citationIds.includes(entry.id))).map(entry => entry.quote),
  ].join(' ');
  const wordCount = countWords(readableText);
  const estimate = sourceState === 'reviewed' ? Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE)) : null;
  const estimateBasis = `Reading estimate: ${WORDS_PER_MINUTE} words per minute across the title, objective, explanations and cited passages; excludes examples, questions, practice and setup time.`;
  const notices: string[] = [];
  if (sourceState === 'changed') notices.push('The source or revision changed. Return to My material and review the current source before starting this lesson.');
  if (sourceState === 'unavailable') notices.push('The source is not confirmed as reviewed. Return to My material and review it before starting.');
  notices.push('Save availability is not checked here; the host must state whether work is saved on this device, for this session, or unavailable.');
  notices.push('A practice response or assisted attempt is not proof of independent mastery.');

  const summary: LessonReadiness = {
    title: lesson.title,
    objective: lesson.objective,
    chapterCount: lesson.chapters.length,
    questionCount: 0,
    estimatedMinutes: estimate,
    estimateBasis,
    sourceState,
    capability: 'source-reading',
    savedStep: null,
    saving: 'unavailable',
    notices,
  };

  if (sourceState !== 'reviewed') return { summary, steps: [], warnings };

  const steps: LessonPlanStep[] = [];
  for (const [index, chapter] of lesson.chapters.entries()) {
    const citations = uniqueInOrder(chapter.citationIds);
    if (chapter.explanation.trim() && citations.length) {
      steps.push({ kind: 'read', title: chapter.title.trim() || `Read chapter ${index + 1}`, prompt: chapter.explanation, citationIds: citations });
    }
    if (chapter.example.trim() && citations.length && !PROMPT_LIKE_EXAMPLE.test(chapter.example.trim())) {
      steps.push({ kind: 'worked-example', title: 'Lesson example · check against the source', prompt: chapter.example, citationIds: citations });
    }
    if (citations.length) {
      steps.push({ kind: 'self-explain', title: 'Explain it back', prompt: 'In your own words, explain the idea and point to the source passage that supports your explanation.', citationIds: citations });
    }
  }

  for (const [index, question] of lesson.quiz.entries()) {
    const choicesValid = question.options.length === 4 && new Set(question.options).size === 4 &&
      Number.isInteger(question.correct) && question.correct >= 0 && question.correct < question.options.length;
    if (!question.question.trim() || !question.citationIds.length || !question.supportQuote.trim() || !choicesValid) continue;
    const kind = classifyQuestion(question.question, question.options);
    const title = kind === 'recognition' ? 'Source recognition check'
      : kind === 'calculation' ? 'Calculation practice · answer from this lesson'
        : kind === 'open-reflection' ? 'Open reasoning wording · choices supplied; not automatically verified'
          : 'Recall check · answer from this lesson';
    steps.push({ kind: 'check', title: `${title} ${index + 1}`, prompt: `${question.question} Then compare your response with the cited passage. A selected answer is not proof of independent mastery.`, citationIds: uniqueInOrder(question.citationIds) });
    if (kind === 'open-reflection') warnings.push(`Question ${index + 1} asks for open reasoning; it needs human review before any mastery claim.`);
  }

  summary.questionCount = steps.filter(step => step.kind === 'check').length;

  const reflectCitations = uniqueInOrder(lesson.chapters.flatMap(chapter => chapter.citationIds));
  if (reflectCitations.length) {
    steps.push({ kind: 'reflect', title: 'Choose a next step', prompt: 'What can you explain now, and which source passage would you review next? This is a reflection, not a measured learning outcome.', citationIds: reflectCitations });
  } else {
    warnings.push('No source anchors are available for a reflection step.');
  }

  return { summary, steps, warnings: uniqueInOrder(warnings) };
}
