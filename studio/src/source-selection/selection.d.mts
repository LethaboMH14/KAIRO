export type ReviewedSourceSummary = {
  id: string;
  title: string;
  reviewed: boolean;
  revision: string;
  reviewedSectionCount: number;
  deleted?: boolean;
  revoked?: boolean;
};
export type ReviewedChoice = {sourceId: string; revision: string; title: string};
export function reviewedChoice(source: unknown): ReviewedChoice | null;
export function selectedRefs(selected: ReviewedChoice[]): Array<{sourceId:string;revision:string}>;
export function toggleReviewedSource(selected: ReviewedChoice[], source: ReviewedSourceSummary): ReviewedChoice[];
export function checkSelectedSources(
  selected: ReviewedChoice[],
  currentSources: ReviewedSourceSummary[] | null
): {ok:boolean;sourceRefs:Array<{sourceId:string;revision:string}>;problem:string|null};
export function prepareSelectionRequest(value: {
  selected: ReviewedChoice[];
  currentSources: ReviewedSourceSummary[]|null;
  multiSourceApi?: boolean;
  mode?: 'local'|'cloud';
  consent?: boolean;
  goal?: string;
  provider?: string;
  providerConsent?: string[];
  requestId?: string;
  fallback?: string;
}): unknown;
