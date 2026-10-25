export type GuideRequestContext = {
  question: string;
  topic: string;
  stage: number;
};

export type GuideRequestEvent =
  | { type: 'started' }
  | { type: 'answer'; answer: string }
  | { type: 'error'; message: string }
  | { type: 'finished' };

export type GuideStageState = { stage: number; playing: boolean };

export type GuideRequestGate = {
  updateContext(nextContext: string): void;
  begin(nextContext: string): number;
  isCurrent(request: number, expectedContext: string): boolean;
  invalidate(): void;
};

export function guideContextKey(context: GuideRequestContext): string;
export function selectGuideStage(state: GuideStageState, nextStage: number): GuideStageState;
export function consumeAutoplayStep(state: GuideStageState, stageCount: number): GuideStageState;
export function createGuideRequestGate(initialContext: string): GuideRequestGate;
export function runGuideRequest(options: {
  gate: GuideRequestGate;
  context: GuideRequestContext;
  request: () => Promise<string>;
  onState: (event: GuideRequestEvent) => void;
}): Promise<void>;
