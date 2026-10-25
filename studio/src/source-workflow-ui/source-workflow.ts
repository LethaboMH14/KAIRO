export type StorageScope = 'local' | 'account' | null;

export type PreviewEvidence = {
  id: string;
  locator: string;
  quote: string;
  start?: number;
  end?: number;
};

export class SourceWorkspaceApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'SourceWorkspaceApiError';
    this.status = status;
  }
}

/** Source-workspace API parser that preserves plain-text authentication failures. */
export async function sourceWorkspaceApi<T>(
  path: string,
  body?: unknown,
  fetcher: typeof fetch = globalThis.fetch.bind(globalThis),
): Promise<T> {
  const response = await fetcher(`/api/workspace${path}`, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...(body === undefined ? {} : {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  });
  const raw = typeof response.text === 'function'
    ? await response.text()
    : JSON.stringify(await response.json());
  let value: unknown = null;
  if (raw) {
    try { value = JSON.parse(raw); }
    catch { value = { error: raw.trim() }; }
  }
  if (!response.ok) {
    const message = value && typeof value === 'object' && typeof (value as { error?: unknown }).error === 'string'
      ? (value as { error: string }).error
      : `This step could not finish (HTTP ${response.status}). Try again.`;
    throw new SourceWorkspaceApiError(message, response.status);
  }
  if (value === null || typeof value !== 'object') {
    throw new Error('The app returned an unreadable response. Try this step again.');
  }
  return value as T;
}

/** Validate the HTTP acknowledgement before telling a learner a job was cancelled. */
export async function cancelExtractionJob(
  jobId: string,
  fetcher: typeof fetch = globalThis.fetch.bind(globalThis),
): Promise<boolean> {
  if (typeof jobId !== 'string' || !jobId.trim()) return false;
  try {
    const response = await fetcher(`/api/workspace/jobs/${encodeURIComponent(jobId)}`, {
      method: 'DELETE',
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) return false;
    const body: unknown = await response.json();
    return body !== null && typeof body === 'object' &&
      (body as { cancelled?: unknown }).cancelled === true;
  } catch {
    return false;
  }
}

export function storageScopeText(scope: StorageScope): string {
  if (scope === 'local') return 'Stored in this local workspace; it is not account sync.';
  if (scope === 'account') return 'Stored in your account workspace.';
  return 'Storage scope is not available.';
}
