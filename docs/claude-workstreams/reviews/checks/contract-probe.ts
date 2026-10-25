// REVIEW-C1-C3: does media-panel-contract.ts enforce the invariants its own comments state?
// Every @ts-expect-error below marks a state a contract comment forbids. tsc reports
// "Unused '@ts-expect-error' directive" (TS2578) wherever the types accept that state anyway.
// Run: node studio/node_modules/typescript/bin/tsc --noEmit --strict --module esnext --moduleResolution bundler --target es2022 docs/claude-workstreams/reviews/checks/contract-probe.ts
import type { CaptionInfo, MediaPanelEntry, TimestampProvenance, VideoItem } from '../../media-panel/media-panel-contract';

// Line 28: basis "none" only with availability "unknown". A union type could enforce this.
// @ts-expect-error captions "yes" on no evidence
export const yesWithoutBasis: CaptionInfo = { availability: 'yes', basis: 'none' };
// @ts-expect-error captions "no" on no evidence
export const noWithoutBasis: CaptionInfo = { availability: 'no', basis: 'none' };

// Line 40: a model cannot confirm its own suggestion. Control case: the union already forbids this.
// @ts-expect-error model confirming itself
export const selfConfirmed: TimestampProvenance = { startSeconds: 0, reason: 'r', chosenBy: 'model-suggested', confirmedBy: 'model-suggested' };

// Lines 36-38: integer >= 0, integer > start, one sentence. Plain number/string types cannot hold these; only runtime validation can.
// @ts-expect-error negative start
export const negativeStart: TimestampProvenance = { startSeconds: -5, reason: 'r', chosenBy: 'learner' };
// @ts-expect-error end before start
export const endBeforeStart: TimestampProvenance = { startSeconds: 90, endSeconds: 30, reason: 'r', chosenBy: 'learner' };
// @ts-expect-error fractional seconds
export const fractionalStart: TimestampProvenance = { startSeconds: 1.5, reason: 'r', chosenBy: 'learner' };
// @ts-expect-error empty reason shown to the learner
export const emptyReason: TimestampProvenance = { startSeconds: 0, reason: '', chosenBy: 'learner' };

// Line 57: /^[A-Za-z0-9_-]{11}$/. The prototype's own video preset uses "".
// @ts-expect-error empty video id
export const emptyVideoId: VideoItem['videoId'] = '';

// Line 7 and 20: provider identity is always shown as a badge with attribution.
// @ts-expect-error empty badge and attribution
export const blankProvider: MediaPanelEntry['provider'] = { kind: 'youtube', label: '', attribution: '' };
