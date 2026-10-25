// Messages between the page and the tracker worker. Bitmaps and asset buffers are transferred, not copied.
import type { LandmarkFrame } from './contract.ts';

export type WorkerIn =
  | { type: 'init'; session: number; loader: ArrayBuffer; wasm: ArrayBuffer; model: ArrayBuffer }
  | { type: 'frame'; session: number; seq: number; capturedAt: number; bitmap: ImageBitmap }
  | { type: 'close' };

export type WorkerOut =
  | { type: 'ready'; session: number }
  | { type: 'result'; frame: LandmarkFrame; workerMs: number }
  | { type: 'error'; session: number; seq?: number; fatal: boolean; message: string }
  | { type: 'closed' };

/** Detector timestamps must strictly increase; this keeps them whole milliseconds that never repeat or go backwards. */
export function monotonic(previous: number, now: number): number {
  return Math.max(previous + 1, Math.round(now));
}
