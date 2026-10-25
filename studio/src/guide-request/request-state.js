export function guideContextKey({ question, topic, stage }) {
  return JSON.stringify([question, topic, stage]);
}

export function selectGuideStage(state, nextStage) {
  return { ...state, stage: nextStage };
}

export function consumeAutoplayStep(state, stageCount) {
  if (!state.playing || state.stage >= stageCount - 1) return { ...state, playing: false };
  return { ...state, stage: state.stage + 1 };
}

export function createGuideRequestGate(initialContext) {
  let context = initialContext;
  let generation = 0;
  const updateContext = (nextContext) => {
    if (nextContext !== context) {
      context = nextContext;
      generation += 1;
    }
  };

  return {
    updateContext,
    begin(nextContext) {
      updateContext(nextContext);
      generation += 1;
      return generation;
    },
    isCurrent(request, expectedContext) {
      return request === generation && context === expectedContext;
    },
    invalidate() {
      generation += 1;
    },
  };
}

export async function runGuideRequest({ gate, context, request, onState }) {
  const key = guideContextKey(context);
  const requestId = gate.begin(key);
  const current = () => gate.isCurrent(requestId, key);
  onState({ type: 'started' });

  try {
    const answer = await request();
    if (current()) onState({ type: 'answer', answer });
  } catch (error) {
    if (current()) onState({ type: 'error', message: error instanceof Error ? error.message : 'The guide is unavailable.' });
  } finally {
    if (current()) onState({ type: 'finished' });
  }
}
