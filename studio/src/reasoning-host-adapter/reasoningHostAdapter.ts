import type { ConfirmedReasoning } from '../learner-reasoning-ui/reasoning';

export type CanonicalReasoningContext = {
  contextKey: string;
  question: { id: string; prompt: string; options: Array<{ id: string; label: string }> };
  sourceRefs: Array<{ sourceId: string; revision: string; locator: string }>;
};

export type ConfirmedReasoningRequest = {
  contextKey: string;
  question: CanonicalReasoningContext['question'];
  sourceRefs: CanonicalReasoningContext['sourceRefs'];
  response: ConfirmedReasoning & { confirmed: true };
};

export type HostSubmit<T> = (request: ConfirmedReasoningRequest, options: { signal: AbortSignal }) => Promise<T>;
export type SubmitResult<T> = { status: 'submitted'; value: T } | { status: 'stale' | 'aborted' };

/**
 * Wraps only a learner-confirmed UI snapshot. The host callback is responsible
 * for authentication, server-side owner resolution, canonical context reload,
 * current-revision checks, UTC confirmation time, persistence and validation.
 */
export function createReasoningHostAdapter<T>(submitConfirmedAttempt: HostSubmit<T>) {
  let currentContextKey: string | null = null;
  let active: { controller: AbortController; contextKey: string; sequence: number } | null = null;
  let sequence = 0;

  function activateContext(contextKey: string) {
    if (!contextKey.trim()) throw new TypeError('A current reasoning context key is required.');
    if (contextKey !== currentContextKey) {
      active?.controller.abort();
      active = null;
      currentContextKey = contextKey;
    }
  }

  async function submit(
    snapshot: ConfirmedReasoning,
    context: CanonicalReasoningContext,
    options: { signal?: AbortSignal } = {},
  ): Promise<SubmitResult<T>> {
    if (!context || typeof context.contextKey !== 'string' || !context.contextKey.trim()) throw new TypeError('A current reasoning context key is required.');
    if (currentContextKey !== context.contextKey) throw new TypeError('Activate the current reasoning context before submitting.');
    if (!snapshot || snapshot.questionId !== context.question?.id) throw new TypeError('The confirmed explanation does not match the current question.');
    if (!Array.isArray(context.question.options) || !context.question.options.some(option => option.id === snapshot.selectedOptionId)) throw new TypeError('The selected answer is not part of the canonical question.');
    if (!Array.isArray(context.sourceRefs) || context.sourceRefs.length < 1 || context.sourceRefs.length > 12) throw new TypeError('Current reviewed source references are required.');
    if (options.signal?.aborted) return { status: 'aborted' };

    active?.controller.abort();
    const controller = new AbortController();
    const currentSequence = ++sequence;
    const run = { controller, contextKey: context.contextKey, sequence: currentSequence };
    active = run;
    const onAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onAbort, { once: true });
    const request: ConfirmedReasoningRequest = {
      contextKey: context.contextKey,
      question: context.question,
      sourceRefs: context.sourceRefs,
      response: { ...snapshot, confirmed: true },
    };
    try {
      const value = await submitConfirmedAttempt(request, { signal: controller.signal });
      if (controller.signal.aborted || active !== run || currentContextKey !== run.contextKey) {
        return { status: currentContextKey !== run.contextKey || active !== run ? 'stale' : 'aborted' };
      }
      return { status: 'submitted', value };
    } catch (error) {
      if (controller.signal.aborted || active !== run || currentContextKey !== run.contextKey) {
        return { status: currentContextKey !== run.contextKey || active !== run ? 'stale' : 'aborted' };
      }
      throw error;
    } finally {
      options.signal?.removeEventListener('abort', onAbort);
      if (active === run) active = null;
    }
  }

  function invalidate(contextKey: string) {
    activateContext(contextKey);
  }

  return { activateContext, submit, invalidate };
}
