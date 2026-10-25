// kairo-signing/0.1, tracking-only subset (docs/blueprint/claude-review/sasl/CAPTURE-DESIGN.md).
// Nothing here recognises or translates a language: it finds hands in a camera picture on the learner's device.

export const SIGNING_CONTRACT = 'kairo-signing/0.1';
export const ASSET_BASE = '/signing/';

/** Always shown next to the camera while tracking, in this wording. */
export const TRACKING_ONLY_LABEL = 'Tracking only: this does not understand SASL yet.';
export const PRIVACY_NOTE = 'Video stays on this device. Nothing is recorded, stored or sent.';

/**
 * Width of the picture handed to the tracker. Measured on 23 October 2026 (Chrome 152, CPU engine, identical frames
 * interleaved): tracker time was 118 ms at 640 px and 122 ms at 320 px, so a smaller picture buys no speed. Throughput
 * is limited by the tracker itself, and the pump drops pictures while it is busy.
 */
export const CAPTURE_WIDTH = 640;

/** A paused camera is released after this long, whether the learner paused it or the tab went to the background. */
export const PAUSE_LIMIT_MS = 30_000;

export type Point3 = readonly [number, number, number];

/** The learner's own hand. `unknown` when the classifier gave no usable label. */
export type HandSide = 'left' | 'right' | 'unknown';

export type TrackedHand = {
  side: HandSide;
  /** Confidence of the left/right label only; it says nothing about handshape or meaning. */
  sideScore: number;
  /** 21 image points: x and y are normalised 0..1 on the raw (not mirrored) camera picture, z is relative depth. */
  points: readonly Point3[];
};

/** In memory only: handed to the preview once and never stored, queued or sent anywhere. */
export type LandmarkFrame = {
  session: number;
  seq: number;
  /** performance.now() when the picture was taken. */
  capturedAt: number;
  width: number;
  height: number;
  hands: readonly TrackedHand[];
};

export type ModelRef = { id: string; sha256: string; bytes: number };

/** Consent for a tracking-only session: live use on this device. Storing, training and publishing are never on. */
export const TRACKING_CONSENT = { communicate: true, store: false, train: false, publish: false } as const;
