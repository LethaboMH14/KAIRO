import manifestJson from './motor-field-speed.manifest.json';

/** Immutable allowlist for the exact generated worker manifest reviewed on 2026-10-26. */
export const REVIEWED_PREPARED_CLIP = {
  manifestSha256: 'c8017323e56b5c7f491a5966c25877a8bc6512221c421e1b057a4f1621417093',
  jobId: 'motor-field-speed-demo-50hz-4poles',
  sourceRevisions: [
    { id: 'kairo-engineering-motor-field-speed-20261024', sha256: 'd096a6c07a1bd7ac0cd475239c04ad5882e0d4e182bd62c925b5a89827f7e8b7' },
    { id: 'kairo-concept-clip-source-citations-20261026', sha256: '2ed5d9887afdc07df5c708d6b23f96f71ff33d86e6a9d91bd1d08983303abe88' },
  ],
  template: 'motor-field-speed-v1',
  templateVersion: '1.0.0',
  templateSha256: 'ee9545d326f3551439fa88f1a9dd346f12cb93b0f8619786594a20ffad277269',
  workerSha256: '55f6ca6b152550f52280690f86bd7c0f4b1b7611bd7eb8441ec82bedd846f93b',
  dependencyLockSha256: '22db19b38b0914477f1149522dbc7e866ec72336c1f2fb484b1d9587c053b798',
  sourcePackPath: 'docs/engineering-pilot-packs-20261024/motor-field-speed.json',
  sourcePackSha256: 'd096a6c07a1bd7ac0cd475239c04ad5882e0d4e182bd62c925b5a89827f7e8b7',
  sourceCitationRecordPath: 'docs/concept-clip-20261026/sources.json',
  sourceCitationRecordSha256: '2ed5d9887afdc07df5c708d6b23f96f71ff33d86e6a9d91bd1d08983303abe88',
  sourceReferences: [
    {
      id: 'nptel-rotating-field',
      url: 'https://archive.nptel.ac.in/content/storage2/courses/108106072/pdf/1_2.pdf',
    },
    {
      id: 'nptel-field-speed',
      url: 'https://archive.nptel.ac.in/content/storage2/courses/108106072/pdf/1_8.pdf',
    },
  ],
  excludedInheritedReference: {
    id: 'nptel-induction-slip',
    url: 'https://archive.nptel.ac.in/content/storage2/courses/108106026/chapter4.pdf',
  },
  parameters: { frequencyHz: 50, poleCount: 4 },
  calculation: { formula: 'n_s = 120 f / P', synchronousFieldSpeedRpm: 1500 },
  renderer: {
    name: 'Manim Community', version: '0.19.0', python: '3.11.9', resolution: '720x404',
    fps: 15, audioTracks: 0, durationSeconds: 8.266667, frameCount: 124, renderedMp4Count: 1,
  },
  artifacts: {
    video: 'motor-field-speed-v1-b84477959e869ac7ddad.mp4',
    poster: 'motor-field-speed-v1-b84477959e869ac7ddad.png',
    captions: 'motor-field-speed-v1-b84477959e869ac7ddad.vtt',
  },
  artifactSha256: 'a21f19529b18b03c8109f6789215a053d0fd8e5ac526b5de4620a85abdc2e5d4',
  posterSha256: 'ae787ba34a576eddc2ef536614318826705116e4ad8766fbbdd428de2d7e6fc7',
  captionsSha256: '9651fbab8a68affea1c10394bbdb747d0f76acc428257b17ab8865b94906b49d',
} as const;

export type ReviewedClipLock = typeof REVIEWED_PREPARED_CLIP;

export type PreparedClipManifest = {
  schemaVersion: number;
  jobId: string;
  status: string;
  sourceRevisions: Array<{ id: string; sha256: string }>;
  template: string;
  templateVersion: string;
  templateSha256: string;
  workerSha256: string;
  dependencyLockSha256: string;
  sourcePackPath: string;
  sourcePackSha256: string;
  sourceCitationRecordPath: string;
  sourceCitationRecordSha256: string;
  sourceReferences: Array<{ id: string; url: string }>;
  excludedInheritedReference: { id: string; url: string };
  parameters: { frequencyHz: number; poleCount: number };
  calculation: { formula: string; synchronousFieldSpeedRpm: number };
  renderer: {
    name: string; version: string; python: string; resolution: string; fps: number;
    audioTracks: number; durationSeconds: number; frameCount: number; renderedMp4Count: number;
  };
  artifacts: { video: string; poster: string; captions: string };
  artifactSha256: string;
  posterSha256: string;
  captionsSha256: string;
};

export type PreparedClipInput = {
  /** Digest returned for the exact JSON manifest file, not a user-controlled URL. */
  manifestSha256: string;
  manifest: PreparedClipManifest;
};

/** The manifest is bundled with this leaf; no runtime manifest URL or user-supplied path is fetched. */
export const MOTOR_FIELD_SPEED_CLIP: PreparedClipInput = {
  manifestSha256: REVIEWED_PREPARED_CLIP.manifestSha256,
  manifest: manifestJson as PreparedClipManifest,
};

export type PreparedClipAssetPaths = {
  video: string;
  poster: string;
  captions: string;
};

const FIXED_ASSETS: Readonly<PreparedClipAssetPaths> = Object.freeze({
  video: `/media/explainers/${REVIEWED_PREPARED_CLIP.artifacts.video}`,
  poster: `/media/explainers/${REVIEWED_PREPARED_CLIP.artifacts.poster}`,
  captions: `/media/explainers/${REVIEWED_PREPARED_CLIP.artifacts.captions}`,
});

export function isApprovedSameOriginPath(path: string, origin: string): boolean {
  if (!Object.values(FIXED_ASSETS).includes(path as PreparedClipAssetPaths[keyof PreparedClipAssetPaths])) return false;
  try {
    const resolved = new URL(path, origin);
    return resolved.origin === new URL(origin).origin && resolved.pathname === path && !resolved.search && !resolved.hash;
  } catch {
    return false;
  }
}

export function preparedClipPaths(input: PreparedClipInput, origin: string): PreparedClipAssetPaths | null {
  if (!isReviewedPreparedClip(input)) return null;
  return Object.values(FIXED_ASSETS).every((path) => isApprovedSameOriginPath(path, origin)) ? { ...FIXED_ASSETS } : null;
}

function equalValue(actual: unknown, expected: unknown): boolean {
  if (actual === expected) return true;
  if (!actual || !expected || typeof actual !== 'object' || typeof expected !== 'object') return false;
  if (Array.isArray(actual) || Array.isArray(expected)) {
    return Array.isArray(actual) && Array.isArray(expected) && actual.length === expected.length && actual.every((value, index) => equalValue(value, expected[index]));
  }
  const actualRecord = actual as Record<string, unknown>;
  const expectedRecord = expected as Record<string, unknown>;
  return Object.keys(expectedRecord).every((key) => equalValue(actualRecord[key], expectedRecord[key]));
}

export function isReviewedPreparedClip(input: unknown): input is PreparedClipInput {
  if (!input || typeof input !== 'object') return false;
  const candidate = input as Partial<PreparedClipInput>;
  const manifest = candidate.manifest;
  if (candidate.manifestSha256 !== REVIEWED_PREPARED_CLIP.manifestSha256 || !manifest || typeof manifest !== 'object') return false;
  const lock = REVIEWED_PREPARED_CLIP;
  return manifest.schemaVersion === 1
    && manifest.jobId === lock.jobId
    && manifest.status === 'succeeded'
    && equalValue(manifest.sourceRevisions, lock.sourceRevisions)
    && manifest.template === lock.template
    && manifest.templateVersion === lock.templateVersion
    && manifest.templateSha256 === lock.templateSha256
    && manifest.workerSha256 === lock.workerSha256
    && manifest.dependencyLockSha256 === lock.dependencyLockSha256
    && manifest.sourcePackPath === lock.sourcePackPath
    && manifest.sourcePackSha256 === lock.sourcePackSha256
    && manifest.sourceCitationRecordPath === lock.sourceCitationRecordPath
    && manifest.sourceCitationRecordSha256 === lock.sourceCitationRecordSha256
    && Array.isArray(manifest.sourceReferences)
    && equalValue(manifest.sourceReferences.map((source) => {
      if (!source || typeof source !== 'object') return null;
      const reference = source as { id?: unknown; url?: unknown };
      return { id: reference.id, url: reference.url };
    }), lock.sourceReferences)
    && equalValue({ id: manifest.excludedInheritedReference?.id, url: manifest.excludedInheritedReference?.url }, lock.excludedInheritedReference)
    && equalValue(manifest.parameters, lock.parameters)
    && manifest.calculation?.formula === lock.calculation.formula
    && manifest.calculation?.synchronousFieldSpeedRpm === lock.calculation.synchronousFieldSpeedRpm
    && manifest.renderer?.name === lock.renderer.name
    && manifest.renderer?.version === lock.renderer.version
    && manifest.renderer?.python === lock.renderer.python
    && manifest.renderer?.resolution === lock.renderer.resolution
    && manifest.renderer?.fps === lock.renderer.fps
    && manifest.renderer?.audioTracks === 0
    && manifest.renderer?.durationSeconds === lock.renderer.durationSeconds
    && manifest.renderer?.frameCount === lock.renderer.frameCount
    && manifest.renderer?.renderedMp4Count === 1
    && equalValue(manifest.artifacts, lock.artifacts)
    && manifest.artifactSha256 === lock.artifactSha256
    && manifest.posterSha256 === lock.posterSha256
    && manifest.captionsSha256 === lock.captionsSha256;
}
