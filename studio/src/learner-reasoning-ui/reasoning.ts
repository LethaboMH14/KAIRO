export const MAX_REASONING_CHARS = 4_000;

export type ReasoningOption = { id: string; label: string };
export type ReasoningMethod = 'typed' | 'dictated';
export type ConfirmedReasoning = {
  questionId: string;
  selectedOptionId: string;
  text: string;
  method: ReasoningMethod;
  confidence: number | null;
};

export type ReasoningContext = { questionId: string; question: string; selectedOptionId: string | null; contextKey?: string };

export function compareReasoningContext(previous: ReasoningContext, next: ReasoningContext) {
  return {
    questionChanged: previous.questionId !== next.questionId || previous.question !== next.question || previous.contextKey !== next.contextKey,
    answerChanged: previous.selectedOptionId !== next.selectedOptionId,
  };
}

export function buildConfirmedReasoning(input: ConfirmedReasoning): ConfirmedReasoning | null {
  if (!input.questionId.trim() || !input.selectedOptionId.trim() || input.text.length > MAX_REASONING_CHARS) return null;
  const text = input.text.trim();
  if (!text || (input.confidence !== null && (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 100))) return null;
  if (input.method !== 'typed' && input.method !== 'dictated') return null;
  return { ...input, text };
}

export function confirmationFingerprint(input: ConfirmedReasoning | null) {
  if (!input) return '';
  const snapshot = buildConfirmedReasoning(input);
  return snapshot ? JSON.stringify(snapshot) : '';
}

/** Called only by the explicit learner confirmation control. */
export function dispatchReasoningConfirmation(
  input: ConfirmedReasoning,
  onConfirm: (value: ConfirmedReasoning) => void | boolean,
) {
  const snapshot = buildConfirmedReasoning(input);
  if (!snapshot) return false;
  if (onConfirm(snapshot) === false) return false;
  return true;
}

/** Called only after the learner accepts microphone and provider consent, then presses Transcribe. */
export type EnglishTranscriber = (audio: Blob, options: { signal: AbortSignal; locale: 'en'; consent: true }) => Promise<{ text: string; provider: string; model: string }>;

export async function runEnglishTranscription(
  audio: Blob,
  transcribe: EnglishTranscriber,
  signal: AbortSignal,
  isCurrent: () => boolean,
  onTranscript: (result: { text: string; provider: string; model: string }) => void,
  onError: (cause: unknown) => void,
) {
  if (signal.aborted || !isCurrent()) return false;
  try {
    const result = await transcribe(audio, { signal, locale: 'en', consent: true });
    if (signal.aborted || !isCurrent()) return false;
    onTranscript(result);
    return true;
  } catch (cause) {
    if (!signal.aborted && isCurrent()) onError(cause);
    return false;
  }
}
