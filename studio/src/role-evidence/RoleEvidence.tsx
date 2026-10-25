import {useState} from 'react';

/** Unmounted, user-controlled view for server/role-evidence evaluateRoleEvidence v1. */
export type EvidenceDraft = {
  requirementId: string;
  rubricIds: string[];
  kind: 'explanation';
  reviewStatus: 'self-reported';
  note: string;
};
type LinkedEvidence = {
  id: string; requirementId: string; rubricIds: string[];
  kind: string; reviewStatus: string; note: string; reference: string | null;
};
type RubricRow = {
  id: string; label: string; status: 'unknown'|'learner-evidence-recorded';
  evidenceIds: string[]; explanation: string;
};
type Requirement = {
  id: string; text: string; priority: 'essential'|'preferred'|'unspecified';
  providerExcerpt: string; sourceLocator: string; sourceState: string;
  status: string; explanation: string; rubric: RubricRow[]; evidence: LinkedEvidence[];
};
export type RoleEvidenceReport = {
  version: 1; roleId: string; title: string; provider: string; observedAt: string;
  source: {officialUrl: string; checkedAt: string; closesAt: string|null; state: string; stale: boolean};
  listingState: 'unknown'|'closed'|'deadline-ahead-unconfirmed';
  requirements: Requirement[];
  nextPractice: Array<{requirementId:string; title:string; instructions:string; href:string; missingRubric:string[]}>;
  limitations: string[];
};
export type RoleEvidenceProps = {
  report: unknown;
  onAddEvidence?: (draft: EvidenceDraft) => void;
  onRemoveEvidence?: (id: string) => void;
};

const internal = new Set(['/practice','/sources','/evidence','/pathways','/opportunities']);
export function isSafeRoleHref(value: unknown): value is string {
  if (typeof value !== 'string' || !value || value.length > 2048) return false;
  if (internal.has(value)) return true;
  try {
    const url = new URL(value), host = url.hostname.toLowerCase();
    return url.protocol === 'https:' && !url.username && !url.password &&
      (!url.port || url.port === '443') && host.includes('.') &&
      host !== 'localhost' && !host.endsWith('.localhost') && !host.endsWith('.local') &&
      !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) && !host.startsWith('[');
  } catch { return false; }
}
function SafeLink({url,children}:{url:unknown;children:string}) {
  if (!isSafeRoleHref(url)) return <span>{children} (link unavailable)</span>;
  return url.startsWith('/') ? <a href={url}>{children}</a> :
    <a href={url} target="_blank" rel="noopener noreferrer">{children}</a>;
}
function displayDate(value: string|null|undefined) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isFinite(date.valueOf()) ?
    new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',dateStyle:'medium'}).format(date) : 'Unknown';
}
function validReport(value: unknown): value is RoleEvidenceReport {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<RoleEvidenceReport>;
  return r.version === 1 && typeof r.title === 'string' && typeof r.provider === 'string' &&
    !!r.source && typeof r.source.checkedAt === 'string' &&
    Array.isArray(r.requirements) && Array.isArray(r.nextPractice) && Array.isArray(r.limitations) &&
    ['unknown','closed','deadline-ahead-unconfirmed'].includes(r.listingState ?? '');
}
const states:Record<string,string> = {
  unknown:'Evidence unknown',
  'partially-documented':'Some rubric checks documented, others unknown',
  'documented-for-review':'Learner evidence recorded — independent review still needed',
  'source-needs-recheck':'Provider wording needs rechecking',
};

/** Does not fetch, persist, upload, visit external links or submit applications.
 * Caller must validate drafts, assign evidence IDs, enforce owner scope and
 * confirm saves, corrections and deletions before re-evaluating.
 */
export default function RoleEvidence({report,onAddEvidence,onRemoveEvidence}:RoleEvidenceProps) {
  const [drafts,setDrafts] = useState<Record<string,string>>({});
  const [notice,setNotice] = useState('Private preparation: nothing submitted to an employer.');
  if (!validReport(report)) return <section aria-label="Role evidence">
    <p role="status">Provider requirements unavailable; no evidence conclusion was made.</p>
  </section>;
  const requirements = report.requirements.filter(row => row && typeof row.id === 'string' &&
    Array.isArray(row.rubric) && Array.isArray(row.evidence));
  return <section className="role-evidence" aria-labelledby="role-evidence-title">
    <header>
      <p>Role requirement → evidence → practice</p>
      <h2 id="role-evidence-title">{report.title}</h2>
      <p>{report.provider}</p>
      <p><strong>Source:</strong> {report.source.state === 'dated-provider-summary' ?
        'Dated provider summary; not live-verified' : report.source.state === 'stale' ?
        'Older than seven days; recheck' : 'Unverified discovery record; requirements unknown'}</p>
      <p><strong>Availability:</strong> {report.listingState === 'closed' ? 'Closed' :
        report.listingState === 'unknown' ? 'Unknown' : 'Deadline ahead in dated source, not a confirmed opening'}</p>
      <p>Checked {displayDate(report.source.checkedAt)} · Closing {displayDate(report.source.closesAt)} · Viewed as of {displayDate(report.observedAt)}</p>
      <SafeLink url={report.source.officialUrl}>Inspect original provider link by choice</SafeLink>
    </header>
    <h3>Which work have you documented?</h3>
    <p>Only explicit learner links count as recorded. An unknown check does not mean inability. These are not employer, hiring, eligibility or ATS results.</p>
    <ol>{requirements.map(row => <li key={row.id}>
      <h4>{row.text}</h4>
      <p><strong>Provider priority:</strong> {row.priority === 'unspecified' ? 'Unspecified in the reviewed record' : row.priority}</p>
      <p><strong>Short provider excerpt:</strong> “{row.providerExcerpt}” · {row.sourceLocator}</p>
      <p><strong>{states[row.status] ?? 'Unknown status'}</strong>: {row.explanation}</p>
      <ul>{row.rubric.map(check => {
        const key = row.id + ':' + check.id;
        return <li key={key}>
          <p><strong>{check.label}:</strong> {check.status === 'learner-evidence-recorded' ?
            'Learner note linked, not independently verified' : 'Unknown — no linked work'}</p>
          <p>{check.explanation}</p>
          {onAddEvidence && <div>
            <label htmlFor={'role-evidence-' + key}>Add or correct your own work (avoid personal and employer-confidential data)</label>
            <textarea id={'role-evidence-' + key} rows={2} maxLength={1200}
              value={drafts[key] ?? ''}
              onChange={event => setDrafts(s => ({...s,[key]:event.target.value}))}/>
            <button type="button" disabled={!(drafts[key] ?? '').trim()}
              onClick={() => {
                const note = (drafts[key] ?? '').trim();
                if (!note) return;
                onAddEvidence({requirementId:row.id,rubricIds:[check.id],
                  kind:'explanation',reviewStatus:'self-reported',note});
                setNotice('Draft sent to hosting workspace for validation. Saving is not confirmed here.');
              }}>Add my evidence draft</button>
          </div>}
        </li>;
      })}</ul>
      {!!row.evidence.length && <details><summary>Linked learner notes ({row.evidence.length})</summary>
        <ul>{row.evidence.map(entry => <li key={entry.id}>
          <p>{entry.kind} · {entry.reviewStatus}: {entry.note}</p>
          {entry.reference && <p>Unverified reference: {entry.reference}</p>}
          {onRemoveEvidence && <button type="button" onClick={() => {
            onRemoveEvidence(entry.id);
            setNotice('Removal requested; confirmation belongs to hosting workspace.');
          }}>Remove my evidence link</button>}
        </li>)}</ul>
      </details>}
    </li>)}</ol>
    <h3>Next voluntary practice</h3>
    <p>KAIRO-authored tasks, not a provider assignment or mandatory credential.</p>
    {report.nextPractice.length ? <ol>{report.nextPractice.map(task => <li key={task.requirementId}>
      <h4>{task.title}</h4><p>{task.instructions}</p>
      <p>Undocumented checks: {task.missingRubric.join('; ')}</p>
      <SafeLink url={task.href}>Open practice resource</SafeLink>
    </li>)}</ol> : <p>No further task selected by this rubric; job readiness remains unknown.</p>}
    <p role="status">{notice}</p>
    <details><summary>Limitations and data boundaries</summary><ul>
      {report.limitations.map((text,i) => <li key={i}>{text}</li>)}
    </ul></details>
  </section>;
}
