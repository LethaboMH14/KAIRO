import type { PreviewEvidence, StorageScope } from './source-workflow';
import { storageScopeText } from './source-workflow';

export function StorageScopeNote({ scope, label }: { scope: StorageScope; label: string | null }) {
  return <div className="sw-storage">
    <span>Storage</span>
    <strong>{label?.trim() || 'Storage label unavailable.'}</strong>
    <span>{storageScopeText(scope)}</span>
  </div>;
}

export type PreviewStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

export type ProcessingJob = {
  id: string;
  name: string;
  status: 'queued' | 'extracting' | 'ready' | 'error' | 'cancelled';
};

export function FileProcessingPanel({
  jobs,
  busy,
  activeJobId,
  messages,
  onOpenJob,
}: {
  jobs: readonly ProcessingJob[];
  busy: boolean;
  activeJobId: string | null;
  messages: Readonly<Record<string, string>>;
  onOpenJob: (job: ProcessingJob) => void;
}) {
  if (jobs.length === 0) return null;
  const statusText: Record<ProcessingJob['status'], string> = {
    queued: 'Waiting to start',
    extracting: 'Reading file',
    ready: 'Ready to open',
    error: 'Needs attention',
    cancelled: 'Cancelled',
  };

  return <section className="sw-processing" aria-labelledby="sw-processing-title">
    <div className="sw-processing-heading">
      <div><h2 id="sw-processing-title">File processing</h2>
        <p>Files still being processed stay here when you return.</p></div>
    </div>
    <ul>
      {jobs.map(job => {
        const label = job.status === 'ready' ? 'Open source'
          : job.status === 'error' || job.status === 'cancelled' ? 'Check status'
            : activeJobId === job.id ? 'Checking…' : 'Resume';
        return <li key={job.id}>
          <div className="sw-processing-meta"><strong>{job.name}</strong><span>{statusText[job.status]}</span></div>
          <button type="button" className="sw-secondary" disabled={busy} aria-label={`${label} ${job.name}`} onClick={() => onOpenJob(job)}>{label}</button>
          {messages[job.id]&&<p role="status">{messages[job.id]}</p>}
        </li>;
      })}
    </ul>
  </section>;
}

export function PassageSelectionPreview({
  status,
  evidence,
  disabled,
  onPreview,
}: {
  status: PreviewStatus;
  evidence: readonly PreviewEvidence[];
  disabled: boolean;
  onPreview: () => void;
}) {
  const message = status === 'loading' ? 'Checking which reviewed passages match this goal…'
    : status === 'unavailable' ? 'Passage preview is unavailable right now. You can still make a local reading lesson.'
      : status === 'ready' && evidence.length === 0 ? 'No matching passages were returned for this goal. Try changing the goal or make a local reading lesson.'
        : status === 'ready' ? `${evidence.length} reviewed passage${evidence.length === 1 ? '' : 's'} selected for this goal.`
          : 'Preview the reviewed passages selected for this goal. Nothing is sent until you choose to create the cited lesson.';

  return <section className="sw-selection-preview" aria-labelledby="sw-selection-preview-title">
    <div className="sw-preview-heading">
      <div><h3 id="sw-selection-preview-title">Passages for this goal</h3>
        <p>This read-only preview is tied to the current source revision and learning goal.</p></div>
      <button type="button" className="sw-secondary" disabled={disabled || status === 'loading'} onClick={onPreview}>
        {status === 'loading' ? 'Checking passages…' : status === 'ready' ? 'Refresh preview' : 'Preview passages'}
      </button>
    </div>
    <p role="status" aria-live="polite">{message}</p>
    {status === 'ready' && evidence.length > 0 && <ol className="sw-preview-list">
      {evidence.map((item, index) => <li key={`${item.id}-${index}`}>
        <strong>{item.locator}</strong>
        <blockquote>{item.quote}</blockquote>
      </li>)}
    </ol>}
  </section>;
}
