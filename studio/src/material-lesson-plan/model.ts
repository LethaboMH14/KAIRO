import type { Source } from '../workspace/types';

export type MaterialBrief = {
  goal: string;
  depth: 'short' | 'standard' | 'deep';
  approach: 'read' | 'worked' | 'practice';
};

export type MaterialCard = {
  title: string;
  steps: string[];
  citation: { locator: string; quote: string; sourceId: string; revision: string } | null;
  status: 'draft' | 'reviewed-source';
};

const MAX_CARDS = 3;
const MAX_QUOTE = 360;
const MAX_GOAL = 300;
const DEPTHS = new Set<MaterialBrief['depth']>(['short', 'standard', 'deep']);
const APPROACHES = new Set<MaterialBrief['approach']>(['read', 'worked', 'practice']);

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeBrief(value: MaterialBrief): MaterialBrief {
  if (!record(value) || typeof value.goal !== 'string' ||
      !DEPTHS.has(value.depth as MaterialBrief['depth']) ||
      !APPROACHES.has(value.approach as MaterialBrief['approach'])) {
    throw new TypeError('Choose a text goal, depth and approach.');
  }
  return { goal: value.goal, depth: value.depth, approach: value.approach };
}

function boundGoal(value: string): string {
  return value.slice(0, MAX_GOAL).trimEnd();
}

function fallbackGoal(brief: MaterialBrief): string {
  if (brief.depth === 'short') {
    if (brief.approach === 'worked') return 'Find one example or procedure in the reviewed material and follow only its stated steps.';
    if (brief.approach === 'practice') return 'Choose one claim in the reviewed material and explain it in your own words.';
    return 'Read one passage and identify a claim to check against its source.';
  }
  if (brief.depth === 'deep') {
    if (brief.approach === 'worked') return 'Trace an example or procedure in the reviewed material and identify what it leaves unspecified.';
    if (brief.approach === 'practice') return 'Explain a claim from the reviewed material and identify what further evidence you would need.';
    return 'Compare reviewed passages, explain one claim and identify what the source leaves uncertain.';
  }
  if (brief.approach === 'worked') return 'Trace an example or procedure using only the steps stated in the reviewed material.';
  if (brief.approach === 'practice') return 'Explain one claim from the reviewed material and point to its supporting passage.';
  return 'Read the reviewed material, explain one claim and check the supporting passage.';
}

function optionGuidance(brief: MaterialBrief): string {
  const depth = brief.depth === 'short' ? 'short (one focused passage)' : brief.depth === 'deep' ? 'deep (compare limits and gaps)' : 'standard (a few connected steps)';
  const approach = brief.approach === 'read' ? 'read and check the source' : brief.approach === 'worked'
    ? 'trace only source-stated steps' : 'explain one source-backed claim';
  return `Depth: ${depth}. Approach: ${approach}.`;
}

/** Compile learner intent within the existing 300-character goal limit. */
export function compileMaterialGoal(briefValue: MaterialBrief): string {
  const brief = normalizeBrief(briefValue);
  const learnerGoal = brief.goal.trim() || fallbackGoal(brief);
  const guidance = optionGuidance(brief);
  const availableGoalLength = MAX_GOAL - guidance.length - 1;
  const boundedLearnerGoal = boundGoal(learnerGoal.slice(0, availableGoalLength));
  return `${boundedLearnerGoal}\n${guidance}`;
}

function shortExactQuote(text: string): string {
  const start = text.search(/\S/);
  if (start < 0) return '';
  const content = text.slice(start);
  if (content.length <= MAX_QUOTE) return content;

  const sample = content.slice(0, MAX_QUOTE);
  const sentenceEnd = sample.search(/[.!?](?:\s|$)/);
  if (sentenceEnd >= 80) return sample.slice(0, sentenceEnd + 1);
  const lastSpace = sample.lastIndexOf(' ');
  return sample.slice(0, lastSpace > 80 ? lastSpace : MAX_QUOTE);
}

function stepsFor(brief: MaterialBrief, goal: string, locator: string): string[] {
  const where = locator ? ` at ${locator}` : '';
  const steps = brief.approach === 'worked'
    ? [`For your goal, find an example or procedure${where}. Follow only the steps the passage states; note missing details.`]
    : brief.approach === 'practice'
      ? [`For your goal, choose one claim${where}. Explain it in your own words, then point to the sentence that supports it.`]
      : [`Read the passage${where} with this goal in mind: ${goal}. Mark one term or claim you want to check.`];

  if (brief.depth !== 'short') steps.push(`Relate the passage to your goal: ${goal}`);
  if (brief.depth === 'deep') steps.push('What does this passage leave unanswered? Name what you would need to check next.');
  return steps;
}

/** Build at most three outlines. Quotes are attached only to the exact saved reviewed text. */
export function buildMaterialCards(
  source: Source | null,
  texts: string[],
  briefValue: MaterialBrief,
): MaterialCard[] {
  const brief = normalizeBrief(briefValue);
  if (!Array.isArray(texts) || texts.some(text => typeof text !== 'string')) {
    throw new TypeError('Current page text must be an array of strings.');
  }
  if (!source) return [];

  const reviewedPages = Array.isArray(source.reviewedPages) ? source.reviewedPages : null;
  const identityReady = typeof source.id === 'string' && source.id.trim() === source.id && source.id.length > 0 &&
    typeof source.revision === 'string' && source.revision.trim() === source.revision && source.revision.length > 0 && source.reviewed === true &&
    reviewedPages !== null && reviewedPages.length === texts.length && Array.isArray(source.pages) && source.pages.length === texts.length;
  const matchesReviewedText = identityReady && texts.every((text, index) =>
    record(reviewedPages![index]) && typeof reviewedPages![index].text === 'string' && text === reviewedPages![index].text);
  const pageMappingMatches = identityReady && texts.every((_, index) =>
    typeof reviewedPages![index]?.locator === 'string' && reviewedPages![index].locator.trim() === reviewedPages![index].locator &&
    typeof source.pages[index]?.locator === 'string' && source.pages[index].locator === reviewedPages![index].locator);
  const citationReady = Boolean(identityReady && matchesReviewedText && pageMappingMatches);
  const goal = compileMaterialGoal(brief);
  const sourceTitle = typeof source.title === 'string' && source.title.trim() ? source.title.trim() : 'Your material';
  const pages = texts.slice(0, MAX_CARDS);
  const cards: MaterialCard[] = [];

  pages.forEach((text, index) => {
    if (!text.trim()) return;
    const reviewedPage = reviewedPages?.[index];
    const citationLocator = citationReady && typeof reviewedPage?.locator === 'string' && reviewedPage.locator.trim() === reviewedPage.locator && reviewedPage.locator.length > 0
      ? reviewedPage.locator
      : '';
    const locator = typeof reviewedPage?.locator === 'string' && reviewedPage.locator.trim()
      ? reviewedPage.locator.trim()
      : typeof source.pages?.[index]?.locator === 'string' && source.pages[index].locator.trim()
        ? source.pages[index].locator.trim()
        : `Section ${index + 1}`;
    const quote = citationLocator && typeof reviewedPage?.text === 'string' ? shortExactQuote(reviewedPage.text) : '';
    const hasCitation = quote.length > 0 && citationLocator.length > 0 && typeof source.id === 'string' && typeof source.revision === 'string';
    cards.push({
      title: `${brief.approach === 'read' ? 'Read' : brief.approach === 'worked' ? 'Work through' : 'Practise'} · ${sourceTitle} · ${locator}`,
      steps: stepsFor(brief, goal, locator),
      citation: hasCitation ? { locator: citationLocator, quote, sourceId: source.id, revision: source.revision! } : null,
      status: hasCitation ? 'reviewed-source' : 'draft',
    });
  });

  return cards;
}
