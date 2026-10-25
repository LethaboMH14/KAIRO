export type Passage = { id: string; quote: string; sourceTitle: string; locator: string };
export type ExplainerProps = { lessonId: string; revision: string; title: string; passages: Passage[] };
export type ReadingState = { index: number; playing: boolean; textOnly: boolean };
export type ReadingAction = { type: 'play' } | { type: 'pause' } | { type: 'next'; count: number } | { type: 'previous'; count: number } | { type: 'toggleTextOnly' } | { type: 'reset' };
const MAX_PASSAGES = 6, MAX_ID = 160, MAX_QUOTE = 1200, MAX_TITLE = 240, MAX_SOURCE = 240, MAX_LOCATOR = 320;
function bounded(value: unknown, max: number): value is string { return typeof value === 'string' && value.trim().length > 0 && value.length <= max; }
export function validateExplainer(input: ExplainerProps): { ok: true; value: ExplainerProps } | { ok: false; reason: string } {
  if (!input || typeof input !== 'object') return { ok: false, reason: 'Lesson content is unavailable.' };
  if (!bounded(input.lessonId, MAX_ID) || !bounded(input.revision, MAX_ID) || !bounded(input.title, MAX_TITLE)) return { ok: false, reason: 'Lesson identity or title is missing or too long.' };
  if (!Array.isArray(input.passages) || input.passages.length === 0 || input.passages.length > MAX_PASSAGES) return { ok: false, reason: `Provide between 1 and ${MAX_PASSAGES} cited passages.` };
  const ids = new Set<string>();
  for (const [i, passage] of input.passages.entries()) {
    if (!passage || !bounded(passage.id, MAX_ID) || !bounded(passage.quote, MAX_QUOTE) || !bounded(passage.sourceTitle, MAX_SOURCE) || !bounded(passage.locator, MAX_LOCATOR)) return { ok: false, reason: `Passage ${i + 1} is incomplete or exceeds its text limit.` };
    if (ids.has(passage.id)) return { ok: false, reason: 'Passage identifiers must be unique.' };
    ids.add(passage.id);
  }
  return { ok: true, value: input };
}
export function passageSeconds(quote: string): number { const words = quote.trim().split(/\s+/u).filter(Boolean).length; return Math.min(15, Math.max(4, Math.ceil(words / 150 * 60))); }
export function readingReducer(state: ReadingState, action: ReadingAction): ReadingState {
  if (action.type === 'reset') return { index: 0, playing: false, textOnly: state.textOnly };
  if (action.type === 'play') return { ...state, playing: true };
  if (action.type === 'pause') return { ...state, playing: false };
  if (action.type === 'toggleTextOnly') return { ...state, textOnly: !state.textOnly };
  if (action.count < 1) return { ...state, playing: false };
  if (action.type === 'next') return { ...state, index: (state.index + 1) % action.count, playing: false };
  return { ...state, index: (state.index - 1 + action.count) % action.count, playing: false };
}
