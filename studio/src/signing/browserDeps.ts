// Real browser dependencies for TrackingSession. Kept apart from session.ts so the session stays testable in Node.
import manifestJson from './manifest.json';
import { ASSET_BASE } from './contract.ts';
import { fetchVerified, loadVerifiedAssets, parseManifest, simdSupported, type Manifest } from './assets.ts';
import { meanLuma } from './convert.ts';
import type { Deps, WorkerLike } from './session.ts';

export const manifest: Manifest = parseManifest(manifestJson);

/** Creates a classic worker from bytes whose SHA-256 matches the manifest. The page never runs unchecked worker code. */
async function createVerifiedWorker(): Promise<WorkerLike> {
  const bytes = await fetchVerified('tracker worker', ASSET_BASE, manifest.worker, (url, init) => fetch(url, init));
  const url = URL.createObjectURL(new Blob([bytes], { type: 'text/javascript' }));
  const worker = new Worker(url);
  const like: WorkerLike = {
    postMessage: (message, transfer) => worker.postMessage(message, transfer ?? []),
    terminate: () => { worker.terminate(); URL.revokeObjectURL(url); },
    onmessage: null,
    onerror: null,
  };
  worker.onmessage = event => like.onmessage?.(event);
  worker.onerror = event => like.onerror?.(event);
  return like;
}

export function createBrowserDeps(video: HTMLVideoElement): Deps {
  const probe = document.createElement('canvas');
  probe.width = 32;
  probe.height = 24;
  const probeContext = probe.getContext('2d', { willReadFrequently: true });
  const hasFrameCallback = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
  const simd = simdSupported();

  return {
    mediaDevices: navigator.mediaDevices,
    video,
    loadAssets: signal => loadVerifiedAssets({ manifest, base: ASSET_BASE, fetchFn: (url, init) => fetch(url, init), simd, signal }),
    createWorker: createVerifiedWorker,
    grabFrame: (source, width) => {
      const target = source as HTMLVideoElement;
      const w = Math.min(width, target.videoWidth); // never enlarge a smaller camera picture
      const height = Math.max(1, Math.round((w * target.videoHeight) / target.videoWidth));
      return createImageBitmap(target, { resizeWidth: w, resizeHeight: height, resizeQuality: 'low' });
    },
    // One callback per new camera picture where the browser offers it; otherwise once per display frame.
    requestFrame: callback => (hasFrameCallback ? video.requestVideoFrameCallback(() => callback()) : requestAnimationFrame(() => callback())),
    cancelFrame: handle => (hasFrameCallback ? video.cancelVideoFrameCallback(handle as number) : cancelAnimationFrame(handle as number)),
    now: () => performance.now(),
    timers: {
      setTimeout: (fn, ms) => window.setTimeout(fn, ms),
      clearTimeout: id => window.clearTimeout(id as number),
      setInterval: (fn, ms) => window.setInterval(fn, ms),
      clearInterval: id => window.clearInterval(id as number),
    },
    isHidden: () => document.visibilityState === 'hidden',
    onVisibilityChange: callback => {
      document.addEventListener('visibilitychange', callback);
      return () => document.removeEventListener('visibilitychange', callback);
    },
    onPageHide: callback => {
      window.addEventListener('pagehide', callback);
      return () => window.removeEventListener('pagehide', callback);
    },
    watchCameraPermission: callback => {
      let status: PermissionStatus | null = null;
      let off = false;
      const changed = () => { if (status?.state === 'denied') callback(); };
      navigator.permissions?.query({ name: 'camera' as PermissionName }).then(result => {
        if (off) return;
        status = result;
        result.addEventListener('change', changed);
      }).catch(() => { /* Permissions API not available for the camera here: track "ended" still covers revocation. */ });
      return () => { off = true; status?.removeEventListener('change', changed); };
    },
    sampleLuma: () => {
      if (!probeContext || video.readyState < 2) return null;
      probeContext.drawImage(video, 0, 0, probe.width, probe.height);
      return meanLuma(probeContext.getImageData(0, 0, probe.width, probe.height).data);
    },
  };
}
