// Tracker worker. Built to a classic (non-module) script by tools/build-assets.mjs because @mediapipe/tasks-vision
// 0.10.17 loads its engine with importScripts, which module workers do not have. The page checks this file's SHA-256
// against the manifest before creating the worker, and passes in engine and model bytes that it has already checked.
// Hand landmarks only, on the CPU engine. No network, storage or DOM access happens here.
import { HandLandmarker } from '@mediapipe/tasks-vision';
import { toLandmarkFrame } from './convert.ts';
import { monotonic, type WorkerIn, type WorkerOut } from './protocol.ts';

type Scope = {
  onmessage: ((event: { data: WorkerIn }) => void) | null;
  postMessage(message: WorkerOut): void;
  close(): void;
};
const scope = self as unknown as Scope;

let landmarker: HandLandmarker | null = null;
let session = 0;
let lastTimestamp = 0;
const urls: string[] = [];

function post(message: WorkerOut) {
  scope.postMessage(message);
}

async function init(message: Extract<WorkerIn, { type: 'init' }>) {
  session = message.session;
  try {
    const loaderUrl = URL.createObjectURL(new Blob([message.loader], { type: 'text/javascript' }));
    const wasmUrl = URL.createObjectURL(new Blob([message.wasm], { type: 'application/wasm' }));
    urls.push(loaderUrl, wasmUrl);
    landmarker = await HandLandmarker.createFromOptions(
      { wasmLoaderPath: loaderUrl, wasmBinaryPath: wasmUrl },
      {
        baseOptions: { modelAssetBuffer: new Uint8Array(message.model), delegate: 'CPU' },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      },
    );
    for (const url of urls.splice(0)) URL.revokeObjectURL(url);
    post({ type: 'ready', session });
  } catch (error) {
    post({ type: 'error', session, fatal: true, message: error instanceof Error ? error.message : 'The tracker could not start.' });
  }
}

function frame(message: Extract<WorkerIn, { type: 'frame' }>) {
  const { bitmap, seq, capturedAt } = message;
  try {
    if (!landmarker || message.session !== session) {
      post({ type: 'error', session: message.session, seq, fatal: false, message: 'The tracker is not ready for this session.' });
      return;
    }
    const started = performance.now();
    lastTimestamp = monotonic(lastTimestamp, started);
    const raw = landmarker.detectForVideo(bitmap, lastTimestamp);
    const workerMs = performance.now() - started;
    post({ type: 'result', workerMs, frame: toLandmarkFrame(raw, { session, seq, capturedAt, width: bitmap.width, height: bitmap.height }) });
  } catch (error) {
    post({ type: 'error', session: message.session, seq, fatal: false, message: error instanceof Error ? error.message : 'The tracker failed on one picture.' });
  } finally {
    bitmap.close();
  }
}

scope.onmessage = event => {
  const message = event.data;
  if (message.type === 'init') void init(message);
  else if (message.type === 'frame') frame(message);
  else if (message.type === 'close') {
    try { landmarker?.close(); } catch { /* already closed */ }
    landmarker = null;
    for (const url of urls.splice(0)) URL.revokeObjectURL(url);
    post({ type: 'closed' });
    scope.close();
  }
};
