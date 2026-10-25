// Opening and releasing the camera. Video only: the microphone is never requested.

export type CameraErrorKind = 'denied' | 'unavailable' | 'busy' | 'failed';

export const CAMERA_CONSTRAINTS = {
  audio: false,
  video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
} as const;

export function classifyCameraError(error: unknown): CameraErrorKind {
  const name = (error as { name?: string } | null)?.name ?? '';
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') return 'denied';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'unavailable';
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return 'busy';
  return 'failed';
}

export type StreamLike = { getTracks(): { stop(): void }[]; getVideoTracks(): { addEventListener(type: string, fn: () => void): void }[] };
export type MediaDevicesLike = { getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> };

/** Asks for the front camera. If this device cannot meet the size hints it retries once with a plain video request. */
export async function openCamera(devices: MediaDevicesLike): Promise<MediaStream> {
  try {
    return await devices.getUserMedia(CAMERA_CONSTRAINTS as unknown as MediaStreamConstraints);
  } catch (error) {
    if ((error as { name?: string } | null)?.name !== 'OverconstrainedError') throw error;
    return devices.getUserMedia({ audio: false, video: true });
  }
}

/** Stops every track so the camera light goes out. Safe on null and when called twice. */
export function releaseStream(stream: Pick<StreamLike, 'getTracks'> | null | undefined) {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    try { track.stop(); } catch { /* already stopped */ }
  }
}
