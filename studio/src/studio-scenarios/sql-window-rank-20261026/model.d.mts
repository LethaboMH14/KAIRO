export type BoardId = 'top-tie' | 'middle-tie' | 'no-tie';
export type FunctionId = 'row-number' | 'rank' | 'dense-rank';
export type RowId = 'ada' | 'bo' | 'cy' | 'dee' | 'eli';
export type Scenario = Readonly<{ boardId: BoardId; functionId: FunctionId; targetId: RowId }>;
export type Action = Scenario & Readonly<{
  prediction: number; explanation: string; sourceRevision: string; modelRevision: string;
}>;
export type Session = Readonly<{ schemaVersion: 1; actions: readonly Action[] }>;
export type TraceRow = Readonly<{
  position: number; id: RowId; score: number; peerGroup: number;
  result: number; reason: string; target: boolean;
}>;
export type Attempt = Action & Readonly<{
  id: string; key: string; observed: number; correct: boolean;
  verification: 'local-unverified';
}>;
export declare const SOURCE: Readonly<{
  title: string; url: string; sourceRevision: string; modelRevision: string;
}>;
export declare const BOARDS: readonly Readonly<{
  id: BoardId; label: string;
  rows: readonly Readonly<{ id: RowId; score: number }>[];
}>[];
export declare const FUNCTIONS: readonly Readonly<{
  id: FunctionId; label: string; sql: string; help: string;
}>[];
export declare function evaluateScenario(value: Scenario): Readonly<{
  scenario: Scenario; trace: readonly TraceRow[]; observed: number;
  sourceRevision: string; modelRevision: string;
}>;
export declare function independentOracle(value: Scenario): number;
export declare function newSession(): Session;
export declare function replaySession(value: Session): Readonly<{
  attempts: readonly Attempt[]; latestTrace: readonly TraceRow[];
}>;
export declare function recordAttempt(session: Session, input: Scenario & {
  prediction: number; explanation: string;
}): Readonly<{ session: Session; attempt: Attempt; trace: readonly TraceRow[] }>;
